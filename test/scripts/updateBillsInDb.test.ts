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

const currentCourt = getCurrentLegislature().courtNumber;

// Mark the current court as already seeded so a scrape exercises the normal
// NEW path rather than the brand-new-session auto-seed (see #008). The sentinel
// uses a bill number the scrape never returns, so it won't collide.
function seedCourt(db: DB): void {
  db.insert(bills)
    .values({
      courtNumber: currentCourt,
      billNumber: 'H.0001',
      filedBy: 'seed',
      summary: 'seed',
      url: 'https://malegislature.gov/seed',
      status: 'SKIPPED'
    })
    .run();
}

// Build N distinct scraped bills (H.6000, H.6001, ...) for flood-guard tests.
function makeScrapedBills(n: number): ScrapedBill[] {
  return Array.from({ length: n }, (_, i) => ({
    billNumber: `H.${6000 + i}`,
    filedBy: 'Some Committee (J)',
    summary: `An Act number ${i}`,
    url: `https://malegislature.gov/Bills/194/H${6000 + i}`
  }));
}

let db: DB;

beforeEach(() => {
  db = createTestDb();
  vi.mocked(queryRecentBills).mockReset();
});

describe('updateBillsInDb', () => {
  it('saves bills to the db as NEW once the court is seeded', async () => {
    seedCourt(db);
    vi.mocked(queryRecentBills).mockResolvedValue(scrapedBills);
    await updateBillsInDb(db);
    expect(vi.mocked(queryRecentBills)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(queryRecentBills)).toHaveBeenCalledWith(getCurrentLegislature());
    const saved = db.select().from(bills).all();
    expect(
      saved
        .filter((b) => b.billNumber !== 'H.0001')
        .map((b) => b.billNumber)
        .sort()
    ).toEqual(['H.5085', 'H.5086']);
    expect(saved.filter((b) => b.billNumber !== 'H.0001').every((b) => b.status === 'NEW')).toBe(
      true
    );
  });

  it('seeds a brand-new session as SKIPPED instead of posting the backlog', async () => {
    // Empty DB => the current court has no rows yet, so everything found on the
    // first scrape is the existing backlog and must not be queued to post.
    vi.mocked(queryRecentBills).mockResolvedValue(scrapedBills);
    await updateBillsInDb(db);
    const saved = db.select().from(bills).all();
    expect(saved.map((b) => b.billNumber).sort()).toEqual(['H.5085', 'H.5086']);
    expect(saved.every((b) => b.status === 'SKIPPED')).toBe(true);
  });

  it('flood-guards a large batch into SKIPPED', async () => {
    seedCourt(db);
    vi.mocked(queryRecentBills).mockResolvedValue(makeScrapedBills(16));
    await updateBillsInDb(db);
    const saved = db
      .select()
      .from(bills)
      .all()
      .filter((b) => b.billNumber !== 'H.0001');
    expect(saved).toHaveLength(16);
    expect(saved.every((b) => b.status === 'SKIPPED')).toBe(true);
  });

  it('leaves a batch at the flood-guard threshold as NEW', async () => {
    seedCourt(db);
    vi.mocked(queryRecentBills).mockResolvedValue(makeScrapedBills(15));
    await updateBillsInDb(db);
    const saved = db
      .select()
      .from(bills)
      .all()
      .filter((b) => b.billNumber !== 'H.0001');
    expect(saved).toHaveLength(15);
    expect(saved.every((b) => b.status === 'NEW')).toBe(true);
  });

  it('stamps the current court number on saved bills', async () => {
    seedCourt(db);
    vi.mocked(queryRecentBills).mockResolvedValue(scrapedBills);
    await updateBillsInDb(db);
    const saved = db.select().from(bills).all();
    expect(saved.every((b) => b.courtNumber === currentCourt)).toBe(true);
  });

  it('ignores bills that have already been saved', async () => {
    seedCourt(db);
    vi.mocked(queryRecentBills).mockResolvedValue(scrapedBills);
    await updateBillsInDb(db);
    // Second run with the same scrape result should not insert duplicates.
    await updateBillsInDb(db);
    const saved = db.select().from(bills).all();
    // Two scraped bills plus the seed sentinel.
    expect(saved).toHaveLength(3);
  });

  it('treats a reused bill number from a prior session as new (#012)', async () => {
    // Bill numbers restart each session. A leftover row from the previous court
    // must not mask the same number in the current one.
    db.insert(bills)
      .values({
        ...scrapedBills[0],
        courtNumber: currentCourt - 1,
        status: 'POSTED'
      })
      .run();
    vi.mocked(queryRecentBills).mockResolvedValue([scrapedBills[0]]);
    await updateBillsInDb(db);
    const saved = db.select().from(bills).all();
    expect(saved).toHaveLength(2);
    expect(saved.filter((b) => b.courtNumber === currentCourt)).toHaveLength(1);
  });
});
