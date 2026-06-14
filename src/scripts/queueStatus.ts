import { config } from 'dotenv';
import { eq } from 'drizzle-orm';
import Pino from 'pino';
import { type DB, getDb } from '../db';
import { compareByBillNumberAsc } from '../db/billOrder';
import { type Bill, bills } from '../db/schema';

config({ quiet: true });
const logger = Pino();

// The post task (postBill.ts) drains bills in status NEW, oldest first, across
// every court — so the "queue" is exactly the set of NEW bills. This script is a
// read-only peek at how deep that queue is, broken down by chamber, so the post
// cadence (1 / 2h) can be sanity-checked against inflow once the Senate is live
// (see ticket #013).

function chamberOf(billNumber: string): 'House' | 'Senate' | 'Other' {
  if (billNumber.startsWith('H')) {
    return 'House';
  }
  if (billNumber.startsWith('S')) {
    return 'Senate';
  }
  return 'Other';
}

export type QueueStatus = {
  total: number;
  byChamber: Record<'House' | 'Senate' | 'Other', number>;
  oldest?: Bill;
};

export function getQueueStatus(db: DB = getDb()): QueueStatus {
  const queued = db.select().from(bills).where(eq(bills.status, 'NEW')).all();
  const byChamber = { House: 0, Senate: 0, Other: 0 };
  for (const bill of queued) {
    byChamber[chamberOf(bill.billNumber)] += 1;
  }
  const oldest = queued.length > 0 ? [...queued].sort(compareByBillNumberAsc)[0] : undefined;
  return { total: queued.length, byChamber, oldest };
}

export default function reportQueueStatus(db: DB = getDb()): QueueStatus {
  const status = getQueueStatus(db);
  logger.info(
    { byChamber: status.byChamber },
    `${status.total} bill(s) queued to post (NEW): ` +
      `${status.byChamber.House} House, ${status.byChamber.Senate} Senate`
  );
  if (status.oldest) {
    logger.info(
      `Next up (oldest NEW): ${status.oldest.billNumber} — ${status.oldest.summary} (${status.oldest.url})`
    );
  } else {
    logger.info('Queue is empty — nothing waiting to post.');
  }
  return status;
}

if (require.main === module) {
  reportQueueStatus();
}
