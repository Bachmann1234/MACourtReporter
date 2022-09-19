import Pino from 'pino';
import 'reflect-metadata';
import { config } from 'dotenv';
import { getConnection, createConnection, Repository } from 'typeorm';
import { getCurrentLegislature } from '../legislature/generalCourt';
import { queryRecentBills, ScrapedBill } from '../clients/malegislature';
import Bill from '../entity/Bill';

config();
const logger = Pino();

async function findNewBills(
  foundBills: ScrapedBill[],
  billRepository: Repository<Bill>
): Promise<ScrapedBill[]> {
  const scrapedBillNumbers = foundBills.map((b) => b.billNumber);
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

export default async function updateBillsInDb(): Promise<void> {
  logger.info(
    `Updating database with Bills from MA General Court ${getCurrentLegislature().courtNumber}`
  );
  const recentScrapedBills = await queryRecentBills(getCurrentLegislature());
  logger.info(`${recentScrapedBills.length}`);
  await createConnection();
  const billRepository = getConnection().getRepository(Bill);
  const unsavedBills = await findNewBills(recentScrapedBills, billRepository);
  unsavedBills.forEach((bill) => {
    logger.info(
      `${bill.billNumber}: ${bill.summary}. Filed by: ${bill.filedBy}. Learn more: ${bill.url}`
    );
  });
  const savedBills = await billRepository.save(unsavedBills.map(Bill.fromScrapedBill));
  getConnection().close();
  logger.info(`Done! Saved ${savedBills.length} to the db`);
}
if (require.main === module) {
  updateBillsInDb().catch((error) => logger.error(error));
}
