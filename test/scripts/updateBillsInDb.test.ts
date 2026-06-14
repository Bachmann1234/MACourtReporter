import { queryRecentBills } from '../../src/clients/malegislature';
import Bill from '../../src/entity/Bill';
import { getCurrentLegislature } from '../../src/legislature/generalCourt';
import updateBillsInDb from '../../src/scripts/updateBillsInDb';

// Stubs the TypeORM surface our code touches: the active-record-ish global
// connection and the decorators the entities apply at import time. Everything
// lives in vi.hoisted so the vi.mock factory references no imports and is
// therefore immune to import ordering. (All of this goes away in #007.)
const { getManyMock, saveMock, typeorm } = vi.hoisted(() => {
  const getManyMock = vi.fn();
  const saveMock = vi.fn();
  const decorator = () => vi.fn();
  return {
    getManyMock,
    saveMock,
    typeorm: {
      getConnection: () => ({
        getRepository: () => ({
          createQueryBuilder: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnThis(),
            leftJoinAndMapOne: vi.fn().mockReturnThis(),
            getMany: getManyMock
          }),
          save: saveMock
        }),
        close: () => vi.fn()
      }),
      createConnection: () => vi.fn(),
      Repository: decorator,
      Entity: decorator,
      PrimaryGeneratedColumn: decorator,
      Column: decorator,
      Index: decorator,
      Unique: decorator,
      OneToOne: decorator,
      JoinColumn: decorator,
      CreateDateColumn: decorator
    }
  };
});

vi.mock('typeorm', () => typeorm);
vi.mock('../../src/clients/malegislature', () => ({
  queryRecentBills: vi.fn()
}));

const scrapedBills = [
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

describe('updateBillsInDb', () => {
  it('saves bills to the db', async () => {
    vi.mocked(queryRecentBills).mockResolvedValue(scrapedBills);
    getManyMock.mockResolvedValue([]);
    saveMock.mockResolvedValue([new Bill(), new Bill()]); // The actual content does not matter. just throwing back empties
    await updateBillsInDb();
    expect(vi.mocked(queryRecentBills)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(queryRecentBills)).toHaveBeenCalledWith(getCurrentLegislature());
    expect(saveMock).toHaveBeenCalledTimes(1);
    expect(saveMock).toHaveBeenCalledWith(scrapedBills.map(Bill.fromScrapedBill));
  });

  it('ignores bills that have already been saved', async () => {
    vi.mocked(queryRecentBills).mockResolvedValue(scrapedBills);
    getManyMock.mockResolvedValue(scrapedBills.map(Bill.fromScrapedBill));
    await updateBillsInDb();
    expect(vi.mocked(queryRecentBills)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(queryRecentBills)).toHaveBeenCalledWith(getCurrentLegislature());
    expect(saveMock).toHaveBeenCalledTimes(1);
    expect(saveMock).toHaveBeenCalledWith([]);
  });
});
