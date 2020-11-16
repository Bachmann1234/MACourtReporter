import { mocked } from 'ts-jest/utils';
import main from '../../src/scripts/updateBillsInDb';
import { queryRecentBills } from '../../src/clients/malegislature';
import Bill from '../../src/entity/Bill';

const getManyMock = jest.fn();
const saveMock = jest.fn();
jest.mock('typeorm', () => {
  return {
    getConnection: () => {
      return {
        getRepository: () => {
          return {
            createQueryBuilder: jest.fn().mockReturnValue({
              where: jest.fn().mockReturnThis(),
              getMany: getManyMock
            }),
            save: saveMock
          };
        },
        close: () => jest.fn()
      };
    },
    createConnection: () => jest.fn(),
    Repository: () => jest.fn(),
    Entity: () => jest.fn(),
    PrimaryGeneratedColumn: () => jest.fn(),
    Column: () => jest.fn(),
    Index: () => jest.fn(),
    Unique: () => jest.fn(),
    OneToOne: () => jest.fn(),
    JoinColumn: () => jest.fn(),
    CreateDateColumn: () => jest.fn()
  };
});
jest.mock('../../src/clients/malegislature', () => {
  return {
    queryRecentBills: jest.fn()
  };
});

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
    mocked(queryRecentBills).mockResolvedValue(scrapedBills);
    getManyMock.mockResolvedValue([]);
    saveMock.mockResolvedValue([new Bill(), new Bill()]); // The actual content does not matter. just throwing back empties
    await main();
    expect(mocked(queryRecentBills)).toHaveBeenCalledTimes(1);
    expect(mocked(queryRecentBills)).toHaveBeenCalledWith({
      courtNumber: 191,
      searchId: '3139317374202843757272656e7429'
    });
    expect(saveMock).toHaveBeenCalledTimes(1);
    expect(saveMock).toHaveBeenCalledWith(scrapedBills.map(Bill.fromScrapedBill));
  });

  it('ignores bills that have already been saved', async () => {
    mocked(queryRecentBills).mockResolvedValue(scrapedBills);
    getManyMock.mockResolvedValue(scrapedBills.map(Bill.fromScrapedBill));
    await main();
    expect(mocked(queryRecentBills)).toHaveBeenCalledTimes(1);
    expect(mocked(queryRecentBills)).toHaveBeenCalledWith({
      courtNumber: 191,
      searchId: '3139317374202843757272656e7429'
    });
    expect(saveMock).toHaveBeenCalledTimes(1);
    expect(saveMock).toHaveBeenCalledWith([]);
  });
});