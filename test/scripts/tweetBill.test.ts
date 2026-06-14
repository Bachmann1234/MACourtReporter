import { IncomingMessage } from 'node:http';
import { Socket } from 'node:net';
import Bill from '../../src/entity/Bill';
import Tweet from '../../src/entity/Tweet';
import runTweetTask, {
  handleTwitterResponse,
  logger as tweetBillLogger
} from '../../src/scripts/tweetBill';

// Stubs the TypeORM surface our code touches: the active-record-ish global
// connection and the decorators the entities apply at import time. Everything
// lives in vi.hoisted so the vi.mock factory references no imports and is
// therefore immune to import ordering. (All of this goes away in #007.)
const { getManyMock, saveMock, postMock, typeorm } = vi.hoisted(() => {
  const getManyMock = vi.fn();
  const saveMock = vi.fn();
  const postMock = vi.fn();
  const decorator = () => vi.fn();
  return {
    getManyMock,
    saveMock,
    postMock,
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
vi.mock('twit', () => ({
  default: class {
    post = postMock;
  }
}));

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
    const infoSpy = vi.spyOn(tweetBillLogger, 'info').mockImplementation(() => undefined);
    handleTwitterResponse(null, { id_str: '1', created_at: '2', text: 'tweet' }, msg);
    expect(infoSpy).toHaveBeenCalled();
    expect(infoSpy).toHaveBeenCalledWith('tweet id: 1 created_at: 2 text: tweet');
    const warnSpy = vi.spyOn(tweetBillLogger, 'warn').mockImplementation(() => undefined);
    handleTwitterResponse(null, { created_at: '2', text: 'tweet' }, msg);
    expect(warnSpy).toHaveBeenCalledWith('Twitter response had an unexpected type');
  });
});
