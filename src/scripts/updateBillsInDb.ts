import { config } from 'dotenv';
import { and, eq, inArray } from 'drizzle-orm';
import Pino from 'pino';
import { queryRecentBills, type ScrapedBill } from '../clients/malegislature';
import { type DB, getDb } from '../db';
import { type BillStatus, bills, type NewBill } from '../db/schema';
import { getCurrentLegislature } from '../legislature/generalCourt';

config({ quiet: true });
const logger = Pino();

// Flood guard: if a single scrape turns up more than this many previously-unseen
// bills, we assume it's a session filing-deadline flood (thousands at once) and
// seed the batch as SKIPPED rather than queueing it all to post. In steady state
// a scrape sees 0–1 new bills, so this never trips. See #008.
const FLOOD_GUARD_THRESHOLD = 15;

function toNewBill(scraped: ScrapedBill, courtNumber: number, status: BillStatus): NewBill {
  return {
    courtNumber,
    billNumber: scraped.billNumber,
    filedBy: scraped.filedBy,
    summary: scraped.summary,
    url: scraped.url,
    status
  };
}

// True when we've never recorded any bill for this court. Used to auto-seed a
// brand-new session (fresh DB today, and again at every 2-year rollover): the
// existing backlog is marked SKIPPED so we don't post it. See #008/#012.
function courtIsUnseeded(courtNumber: number, db: DB): boolean {
  const existing = db
    .select({ id: bills.id })
    .from(bills)
    .where(eq(bills.courtNumber, courtNumber))
    .limit(1)
    .all();
  return existing.length === 0;
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

  // Decide whether this batch should post or just be seeded. Two automatic
  // layers keep us from spamming a backlog (see #008): seeding a brand-new
  // session, and a flood guard for a deadline-day filing surge.
  let status: BillStatus = 'NEW';
  if (courtIsUnseeded(legislature.courtNumber, db)) {
    status = 'SKIPPED';
    logger.info(
      `Court ${legislature.courtNumber} has no rows yet; seeding ${unsavedBills.length} bills as SKIPPED.`
    );
  } else if (unsavedBills.length > FLOOD_GUARD_THRESHOLD) {
    status = 'SKIPPED';
    logger.warn(
      `Flood guard tripped: ${unsavedBills.length} new bills (> ${FLOOD_GUARD_THRESHOLD}) in one scrape; marking SKIPPED instead of queueing to post.`
    );
  }

  if (unsavedBills.length > 0) {
    db.insert(bills)
      .values(unsavedBills.map((bill) => toNewBill(bill, legislature.courtNumber, status)))
      .run();
  }
  logger.info(`Done! Saved ${unsavedBills.length} to the db as ${status}`);
}
if (require.main === module) {
  updateBillsInDb().catch((error) => logger.error(error));
}
