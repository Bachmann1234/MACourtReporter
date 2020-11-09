import Pino from 'pino';
import 'reflect-metadata';
import { config } from 'dotenv';
import { Connection, createConnection } from 'typeorm';
import { getCurrentLegislature } from '../legislature/generalCourt';
import { queryRecentBills, ScrapedBill } from '../clients/malegislature';
import Bill from '../entity/Bill';

config();
const logger = Pino();

async function findNewBills(
  foundBills: ScrapedBill[],
  connection: Connection
): Promise<ScrapedBill[]> {
  const scrapedBillNumbers = foundBills.map((b) => b.billNumber);
  const billRepository = connection.getRepository(Bill);
  const existingBills = new Set(
    Array.from(
      await billRepository
        .createQueryBuilder('bill')
        .where('bill.billNumber IN (:...scrapedBillNumbers)', { scrapedBillNumbers })
        .getMany()
    ).map((bill) => bill.billNumber)
  );
  return foundBills.filter((foundBill) => !existingBills.has(foundBill.billNumber));
}

async function saveBillsToDb(
  newScrapedBills: ScrapedBill[],
  connection: Connection
): Promise<Bill[]> {
  const billsToSave = newScrapedBills.map((newScrapedBill) => {
    const bill = new Bill();
    bill.billNumber = newScrapedBill.billNumber;
    bill.filedBy = newScrapedBill.filedBy;
    bill.url = newScrapedBill.url;
    bill.summary = newScrapedBill.summary;
    return bill;
  });
  const billRepository = connection.getRepository(Bill);
  return billRepository.save(billsToSave);
}

logger.info(
  `Updating database with Bills from MA General Court ${getCurrentLegislature().courtNumber}`
);
createConnection()
  .then((connection) => {
    queryRecentBills(getCurrentLegislature())
      .then((scrapedBills) => {
        return findNewBills(scrapedBills, connection);
      })
      .then((newScrapedBills) => {
        if (!newScrapedBills.length) {
          return [];
        }
        newScrapedBills.forEach((bill) => {
          logger.info(
            `${bill.billNumber}: ${bill.summary}. Filed by: ${bill.filedBy}. Learn more: ${bill.url}`
          );
        });
        return saveBillsToDb(newScrapedBills, connection);
      })
      .then((savedBills) => {
        connection.close();
        logger.info(`Done! Saved ${savedBills.length} to the db`);
      });
  })
  .catch((error) => logger.error(error));
