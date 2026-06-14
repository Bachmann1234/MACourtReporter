import { config } from 'dotenv';
import { inArray } from 'drizzle-orm';
import Pino from 'pino';
import { queryRecentBills, type ScrapedBill } from '../clients/malegislature';
import { type DB, getDb } from '../db';
import { bills, type NewBill } from '../db/schema';
import { getCurrentLegislature } from '../legislature/generalCourt';

config({ quiet: true });
const logger = Pino();

function toNewBill(scraped: ScrapedBill): NewBill {
  return {
    billNumber: scraped.billNumber,
    filedBy: scraped.filedBy,
    summary: scraped.summary,
    url: scraped.url,
    status: 'NEW'
  };
}

function findNewBills(foundBills: ScrapedBill[], db: DB): ScrapedBill[] {
  if (foundBills.length === 0) {
    return [];
  }
  const scrapedBillNumbers = foundBills.map((b) => b.billNumber);
  const existingBills = new Set(
    db
      .select({ billNumber: bills.billNumber })
      .from(bills)
      .where(inArray(bills.billNumber, scrapedBillNumbers))
      .all()
      .map((bill) => bill.billNumber)
  );
  return foundBills.filter((foundBill) => !existingBills.has(foundBill.billNumber));
}

export default async function updateBillsInDb(db: DB = getDb()): Promise<void> {
  logger.info(
    `Updating database with Bills from MA General Court ${getCurrentLegislature().courtNumber}`
  );
  const recentScrapedBills = await queryRecentBills(getCurrentLegislature());
  logger.info(`${recentScrapedBills.length}`);
  const unsavedBills = findNewBills(recentScrapedBills, db);
  unsavedBills.forEach((bill) => {
    logger.info(
      `${bill.billNumber}: ${bill.summary}. Filed by: ${bill.filedBy}. Learn more: ${bill.url}`
    );
  });
  if (unsavedBills.length > 0) {
    db.insert(bills).values(unsavedBills.map(toNewBill)).run();
  }
  logger.info(`Done! Saved ${unsavedBills.length} to the db`);
}
if (require.main === module) {
  updateBillsInDb().catch((error) => logger.error(error));
}
