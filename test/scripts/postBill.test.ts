import type { DB } from '../../src/db';
import { bills, posts } from '../../src/db/schema';
import { composePostText } from '../../src/posts/composePost';
import runPostTask from '../../src/scripts/postBill';
import createTestDb from '../utils/testDb';

const { loginMock, postMock, detectFacetsMock } = vi.hoisted(() => ({
  loginMock: vi.fn(),
  postMock: vi.fn(),
  detectFacetsMock: vi.fn()
}));

vi.mock('@atproto/api', () => ({
  AtpAgent: class {
    login = loginMock;
    post = postMock;
  },
  RichText: class {
    text: string;
    facets = undefined;
    detectFacets = detectFacetsMock;
    constructor({ text }: { text: string }) {
      this.text = text;
    }
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

const BLUESKY_ENV = {
  BLUESKY_HANDLE: 'bot.bsky.social',
  BLUESKY_APP_PASSWORD: 'app-pass'
};

const POST_URI = 'at://did:plc:abc123/app.bsky.feed.post/xyz789';

let db: DB;

beforeEach(() => {
  db = createTestDb();
  db.insert(bills)
    .values(scrapedBills.map((b) => ({ ...b, status: 'NEW' as const })))
    .run();
  postMock.mockResolvedValue({ uri: POST_URI, cid: 'cid123' });
  Object.assign(process.env, BLUESKY_ENV);
});

describe('postBill', () => {
  it('should post the oldest bill to Bluesky, record it with its uri, and mark it POSTED', async () => {
    // H.5085 is the lower number, so it is the oldest and goes first.
    const expectedText = composePostText(scrapedBills[1]);
    await runPostTask(db);

    expect(loginMock).toHaveBeenCalledWith({
      identifier: 'bot.bsky.social',
      password: 'app-pass'
    });
    expect(postMock).toHaveBeenCalledTimes(1);
    expect(postMock.mock.calls[0][0].text).toBe(expectedText);

    const savedPosts = db.select().from(posts).all();
    expect(savedPosts).toHaveLength(1);
    expect(savedPosts[0].text).toBe(expectedText);
    expect(savedPosts[0].uri).toBe(POST_URI);

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
    await runPostTask(db);
    expect(postMock).not.toHaveBeenCalled();
    expect(db.select().from(posts).all()).toHaveLength(0);
  });

  it('throws when Bluesky credentials are missing', async () => {
    process.env.BLUESKY_HANDLE = '';
    process.env.BLUESKY_APP_PASSWORD = '';
    await expect(runPostTask(db)).rejects.toThrow('Bluesky credentials not defined in environment');
    expect(postMock).not.toHaveBeenCalled();
    expect(db.select().from(posts).all()).toHaveLength(0);
  });
});
