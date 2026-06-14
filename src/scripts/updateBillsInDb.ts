import { config } from 'dotenv';
import { and, eq, inArray } from 'drizzle-orm';
import Pino from 'pino';
import { queryRecentBills, type ScrapedBill } from '../clients/malegislature';
import { type DB, getDb } from '../db';
import { bills, type NewBill } from '../db/schema';
import { getCurrentLegislature } from '../legislature/generalCourt';

config({ quiet: true });
const logger = Pino();

function toNewBill(scraped: ScrapedBill, courtNumber: number): NewBill {
  return {
    courtNumber,
    billNumber: scraped.billNumber,
    filedBy: scraped.filedBy,
    summary: scraped.summary,
    url: scraped.url,
    status: 'NEW'
  };
}

// Bill numbers restart each session, so a bill is "already seen" only if we've
// seen that number *for this court* — see #012.
function findNewBills(foundBills: ScrapedBill[], courtNumber: number, db: DB): ScrapedBill[] {
  if (foundBills.length === 0) {
    return [];
  }
  const scrapedBillNumbers = foundBills.map((b) => b.billNumber);
  const existingBills = new Set(
    db
      .select({ billNumber: bills.billNumber })
      .from(bills)
      .where(and(eq(bills.courtNumber, courtNumber), inArray(bills.billNumber, scrapedBillNumbers)))
      .all()
      .map((bill) => bill.billNumber)
  );
  return foundBills.filter((foundBill) => !existingBills.has(foundBill.billNumber));
}

export default async function updateBillsInDb(db: DB = getDb()): Promise<void> {
  const legislature = getCurrentLegislature();
  logger.info(`Updating database with Bills from MA General Court ${legislature.courtNumber}`);
  const recentScrapedBills = await queryRecentBills(legislature);
  logger.info(`${recentScrapedBills.length}`);
  const unsavedBills = findNewBills(recentScrapedBills, legislature.courtNumber, db);
  unsavedBills.forEach((bill) => {
    logger.info(
      `${bill.billNumber}: ${bill.summary}. Filed by: ${bill.filedBy}. Learn more: ${bill.url}`
    );
  });
  if (unsavedBills.length > 0) {
    db.insert(bills)
      .values(unsavedBills.map((bill) => toNewBill(bill, legislature.courtNumber)))
      .run();
  }
  logger.info(`Done! Saved ${unsavedBills.length} to the db`);
}
if (require.main === module) {
  updateBillsInDb().catch((error) => logger.error(error));
}
