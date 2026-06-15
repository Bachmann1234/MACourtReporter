import type { DB } from '../../src/db';
import { bills, posts } from '../../src/db/schema';
import { composePostText } from '../../src/posts/composePost';
import runPostTask from '../../src/scripts/postBill';
import createTestDb from '../utils/testDb';

const { loginMock, postMock, detectFacetsMock, maybeBuildReplyMock } = vi.hoisted(() => ({
  loginMock: vi.fn(),
  postMock: vi.fn(),
  detectFacetsMock: vi.fn(),
  maybeBuildReplyMock: vi.fn()
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

// The summary reply is exercised end-to-end in summarizeBill.test.ts; here we
// mock the decision so these tests stay focused on threading and persistence.
vi.mock('../../src/posts/summarizeBill', () => ({ maybeBuildReply: maybeBuildReplyMock }));

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
const REPLY_URI = 'at://did:plc:abc123/app.bsky.feed.post/reply456';

let db: DB;

beforeEach(() => {
  db = createTestDb();
  db.insert(bills)
    .values(scrapedBills.map((b) => ({ ...b, courtNumber: 194, status: 'NEW' as const })))
    .run();
  postMock.mockResolvedValue({ uri: POST_URI, cid: 'cid123' });
  // Default: the model declines to add a reply. Tests opt into a reply explicitly.
  maybeBuildReplyMock.mockResolvedValue({ reply: false });
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
    // No reply by default — the reply columns stay null.
    expect(savedPosts[0].replyUri).toBeNull();
    expect(savedPosts[0].replyText).toBeNull();
  });

  it('posts a value-add summary as a threaded reply and records it on the same row', async () => {
    maybeBuildReplyMock.mockResolvedValue({ reply: true, text: 'Plain-English summary.' });
    postMock
      .mockResolvedValueOnce({ uri: POST_URI, cid: 'cidMAIN' })
      .mockResolvedValueOnce({ uri: REPLY_URI, cid: 'cidREPLY' });

    await runPostTask(db);

    expect(postMock).toHaveBeenCalledTimes(2);
    // Second post is the reply, threaded under the main post (root === parent).
    const replyArg = postMock.mock.calls[1][0];
    expect(replyArg.text).toBe('Plain-English summary.');
    expect(replyArg.reply).toEqual({
      root: { uri: POST_URI, cid: 'cidMAIN' },
      parent: { uri: POST_URI, cid: 'cidMAIN' }
    });

    const savedPosts = db.select().from(posts).all();
    expect(savedPosts).toHaveLength(1);
    expect(savedPosts[0].uri).toBe(POST_URI);
    expect(savedPosts[0].replyUri).toBe(REPLY_URI);
    expect(savedPosts[0].replyText).toBe('Plain-English summary.');
  });

  it('keeps the main post and POSTED status when the reply post itself fails', async () => {
    maybeBuildReplyMock.mockResolvedValue({ reply: true, text: 'summary' });
    postMock
      .mockResolvedValueOnce({ uri: POST_URI, cid: 'cidMAIN' })
      .mockRejectedValueOnce(new Error('reply post failed'));

    await runPostTask(db);

    const savedPosts = db.select().from(posts).all();
    expect(savedPosts).toHaveLength(1);
    expect(savedPosts[0].uri).toBe(POST_URI);
    expect(savedPosts[0].replyUri).toBeNull();
    expect(savedPosts[0].replyText).toBeNull();
    const postedBill = db
      .select()
      .from(bills)
      .all()
      .find((b) => b.id === savedPosts[0].billId);
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
