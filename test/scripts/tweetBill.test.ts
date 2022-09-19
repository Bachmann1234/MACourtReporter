/* eslint-disable import/first */
/* eslint-disable import/order */
// eslint-disable-next-line import/newline-after-import
import { mockTypeORM } from '../utils/utils';
const [getManyMock, saveMock] = mockTypeORM();
import Bill from '../../src/entity/Bill';
import Tweet from '../../src/entity/Tweet';
import runTweetTask, {
  handleTwitterResponse,
  logger as tweetBillLogger
} from '../../src/scripts/tweetBill';
import { IncomingMessage } from 'http';
import { Socket } from 'net';
/* eslint-enable import/first */
/* eslint-enable import/order */

const postMock = jest.fn();
jest.mock('twit', () => {
  return class {
    post = postMock;
  };
});

const bills = [
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
].map(Bill.fromScrapedBill);

describe('tweetBill', () => {
  // This one would really benefit from an integration test
  // the mocks would have to get quite elaborite to show that the next time
  // the script runs there is a tweet there

  // However, its good to verify that the correct bill comes up (the sort) and that
  // a tweet gets saved
  it('should tweet the oldest bill', async () => {
    const tweet = Tweet.fromBill(bills[1]);
    getManyMock.mockResolvedValue(bills.slice());
    saveMock.mockResolvedValue([new Tweet()]);
    await runTweetTask();
    expect(postMock).toHaveBeenCalledTimes(1);
    expect(postMock).toHaveBeenCalledWith(
      'statuses/update',
      { status: tweet.body },
      handleTwitterResponse
    );
    expect(saveMock).toHaveBeenCalledTimes(1);
    expect(saveMock).toHaveBeenCalledWith(tweet);
  });

  it('should handle twitter responses', () => {
    const msg = new IncomingMessage(new Socket());
    expect(() => {
      handleTwitterResponse(new Error('OMG'), {}, msg);
    }).toThrow(new Error('Failed to Tweet -- Error: OMG'));
    const infoSpy = jest
      .spyOn(tweetBillLogger, 'info')
      .mockImplementation((message: string) => message);
    handleTwitterResponse(null, { id_str: '1', created_at: '2', text: 'tweet' }, msg);
    expect(infoSpy).toHaveBeenCalled();
    expect(infoSpy).toBeCalledWith('tweet id: 1 created_at: 2 text: tweet');
    const warnSpy = jest
      .spyOn(tweetBillLogger, 'warn')
      .mockImplementation((message: string) => message);
    handleTwitterResponse(null, { created_at: '2', text: 'tweet' }, msg);
    expect(warnSpy).toBeCalledWith('Twitter response had an unexpected type');
  });
});
