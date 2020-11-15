import { mocked } from "ts-jest/utils";
import main from "../../src/scripts/updateBillsInDb";
import { queryRecentBills } from '../../src/clients/malegislature'

jest.mock('../../src/clients/malegislature', () => {
  return {
    queryRecentBills: jest.fn()
  };
});

describe('updateBillsInDb', () => {
  it('saves bills to the db', async () => {
    mocked(queryRecentBills).mockResolvedValue(
      [
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
      ]
    )
    try {
       await main()
    } catch {
      // just fine
    }
    expect(mocked(queryRecentBills).mock.calls[0][0]).toEqual({courtNumber: 191, searchId: '3139317374202843757272656e7429'})
    expect(4).toBe(7)
  });
});
