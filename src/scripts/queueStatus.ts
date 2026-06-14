import { config } from 'dotenv';
import { eq } from 'drizzle-orm';
import { type DB, getDb } from '../db';
import { compareByBillNumberAsc } from '../db/billOrder';
import { type Bill, bills } from '../db/schema';

config({ quiet: true });

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
  const { House, Senate, Other } = status.byChamber;

  const lines = [
    'Post queue (bills in status NEW)',
    '────────────────────────────────',
    `  Total queued:  ${status.total}`,
    `  House:         ${House}`,
    `  Senate:        ${Senate}`
  ];
  // Only mention "Other" when it's non-zero — normally every bill is H or S, so
  // a zero line is just noise.
  if (Other > 0) {
    lines.push(`  Other:         ${Other}`);
  }
  lines.push('');

  if (status.oldest) {
    // postBill.ts drains oldest-first, so this is literally the next post.
    lines.push('Next up:');
    lines.push(`  ${status.oldest.billNumber} — ${status.oldest.summary}`);
    lines.push(`  ${status.oldest.url}`);
  } else {
    lines.push('Queue is empty — nothing waiting to post.');
  }

  console.log(lines.join('\n'));
  return status;
}

if (require.main === module) {
  reportQueueStatus();
}
