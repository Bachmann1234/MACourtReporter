import { IncomingMessage } from 'node:http';
import { Socket } from 'node:net';
import type { DB } from '../../src/db';
import { bills, posts } from '../../src/db/schema';
import { composePostText } from '../../src/posts/composePost';
import runTweetTask, {
  handleTwitterResponse,
  logger as tweetBillLogger
} from '../../src/scripts/tweetBill';
import createTestDb from '../utils/testDb';

const { postMock } = vi.hoisted(() => ({ postMock: vi.fn() }));

vi.mock('twit', () => ({
  default: class {
    post = postMock;
  }
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

const TWITTER_ENV = {
  TWITTER_API_KEY: 'key',
  TWITTER_API_KEY_SECRET: 'key-secret',
  TWITTER_ACCESS_TOKEN: 'token',
  TWITTER_ACCESS_TOKEN_SECRET: 'token-secret'
};

let db: DB;

beforeEach(() => {
  db = createTestDb();
  db.insert(bills)
    .values(scrapedBills.map((b) => ({ ...b, status: 'NEW' as const })))
    .run();
  postMock.mockReset();
  Object.assign(process.env, TWITTER_ENV);
});

describe('tweetBill', () => {
  it('should tweet the oldest bill, record the post, and mark it POSTED', async () => {
    // H.5085 is the lower number, so it is the oldest and goes first.
    const expectedText = composePostText(scrapedBills[1]);
    await runTweetTask(db);

    expect(postMock).toHaveBeenCalledTimes(1);
    expect(postMock).toHaveBeenCalledWith(
      'statuses/update',
      { status: expectedText },
      handleTwitterResponse
    );

    const savedPosts = db.select().from(posts).all();
    expect(savedPosts).toHaveLength(1);
    expect(savedPosts[0].text).toBe(expectedText);

    const postedBill = db
      .select()
      .from(bills)
      .all()
      .find((b) => b.id === savedPosts[0].billId);
    expect(postedBill?.billNumber).toBe('H.5085');
    expect(postedBill?.status).toBe('POSTED');
  });

  it('should do nothing when there are no NEW bills', async () => {
    db.update(bills).set({ status: 'POSTED' }).run();
    await runTweetTask(db);
    expect(postMock).not.toHaveBeenCalled();
    expect(db.select().from(posts).all()).toHaveLength(0);
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
