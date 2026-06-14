import { queryRecentBills, type ScrapedBill } from '../../src/clients/malegislature';
import type { DB } from '../../src/db';
import { bills } from '../../src/db/schema';
import { getCurrentLegislature } from '../../src/legislature/generalCourt';
import updateBillsInDb from '../../src/scripts/updateBillsInDb';
import createTestDb from '../utils/testDb';

vi.mock('../../src/clients/malegislature', () => ({
  queryRecentBills: vi.fn()
}));

const scrapedBills: ScrapedBill[] = [
  {
    billNumber: 'H.5086',
    filedBy: 'Labor and Workforce Development (J)',
    summary:
      'An Act to prevent wage theft, promote employer accountability, and enhance public enforcement',
    url: 'https://malegislature.gov/Bills/191/H5086'
  },
  {
    billNumber: 'H.5085',
    filedBy: 'Labor and Workforce Development (J)',
    summary: 'An Act requiring one fair wage',
    url: 'https://malegislature.gov/Bills/191/H5085'
  }
];

let db: DB;

beforeEach(() => {
  db = createTestDb();
  vi.mocked(queryRecentBills).mockReset();
});

describe('updateBillsInDb', () => {
  it('saves bills to the db', async () => {
    vi.mocked(queryRecentBills).mockResolvedValue(scrapedBills);
    await updateBillsInDb(db);
    expect(vi.mocked(queryRecentBills)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(queryRecentBills)).toHaveBeenCalledWith(getCurrentLegislature());
    const saved = db.select().from(bills).all();
    expect(saved.map((b) => b.billNumber).sort()).toEqual(['H.5085', 'H.5086']);
    expect(saved.every((b) => b.status === 'NEW')).toBe(true);
  });

  it('ignores bills that have already been saved', async () => {
    vi.mocked(queryRecentBills).mockResolvedValue(scrapedBills);
    await updateBillsInDb(db);
    // Second run with the same scrape result should not insert duplicates.
    await updateBillsInDb(db);
    const saved = db.select().from(bills).all();
    expect(saved).toHaveLength(2);
  });
});
