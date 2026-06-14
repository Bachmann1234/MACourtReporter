import type { DB } from '../../src/db';
import { type BillStatus, bills } from '../../src/db/schema';
import { getQueueStatus } from '../../src/scripts/queueStatus';
import createTestDb from '../utils/testDb';

let db: DB;

beforeEach(() => {
  db = createTestDb();
});

function insertBill(billNumber: string, status: BillStatus): void {
  db.insert(bills)
    .values({
      courtNumber: 194,
      billNumber,
      filedBy: 'Someone',
      summary: `Summary for ${billNumber}`,
      url: `https://malegislature.gov/Bills/194/${billNumber.replace('.', '')}`,
      status
    })
    .run();
}

describe('getQueueStatus', () => {
  it('reports an empty queue', () => {
    const status = getQueueStatus(db);
    expect(status.total).toBe(0);
    expect(status.byChamber).toEqual({ House: 0, Senate: 0, Other: 0 });
    expect(status.oldest).toBeUndefined();
  });

  it('counts only NEW bills and splits them by chamber', () => {
    insertBill('H.5504', 'NEW');
    insertBill('H.5503', 'NEW');
    insertBill('S.3120', 'NEW');
    insertBill('H.5400', 'POSTED'); // already posted, not in the queue
    insertBill('S.3000', 'SKIPPED'); // seeded backlog, not in the queue

    const status = getQueueStatus(db);
    expect(status.total).toBe(3);
    expect(status.byChamber).toEqual({ House: 2, Senate: 1, Other: 0 });
  });

  it('picks the oldest (lowest-numbered) NEW bill as next up', () => {
    insertBill('H.5504', 'NEW');
    insertBill('S.3120', 'NEW');
    insertBill('H.5479', 'NEW');

    const status = getQueueStatus(db);
    // postBill.ts drains by ascending bill number; S.3120 is numerically lowest.
    expect(status.oldest?.billNumber).toBe('S.3120');
  });
});
