import { AtpAgent, RichText } from '@atproto/api';
import { config } from 'dotenv';
import { eq } from 'drizzle-orm';
import Pino from 'pino';
import { type DB, getDb } from '../db';
import { compareByBillNumberAsc } from '../db/billOrder';
import { type Bill, bills, posts } from '../db/schema';
import { composePostText } from '../posts/composePost';
import { maybeBuildReply } from '../posts/summarizeBill';

config({ quiet: true });
export const logger = Pino();

const BLUESKY_SERVICE = 'https://bsky.social';

// A post's strong ref — both fields are required to reply to it (#015).
type PostRef = { uri: string; cid: string };

// Logs in and returns an agent. Auth is a handle + app password (created in
// Bluesky settings, NOT the account password). We log in once per run so the
// main post and its optional reply share the session.
async function loginAgent(): Promise<AtpAgent> {
  const identifier = process.env.BLUESKY_HANDLE;
  const password = process.env.BLUESKY_APP_PASSWORD;
  if (!(identifier && password)) {
    throw new Error('Bluesky credentials not defined in environment');
  }
  const agent = new AtpAgent({ service: BLUESKY_SERVICE });
  await agent.login({ identifier, password });
  return agent;
}

// Posts `text` and returns the new post's ref. Bluesky does not auto-link plain
// text, so we run the text through RichText to detect facets that render the bill
// URL and #mapoli as real links. Pass `reply` to thread under another post.
async function postToBluesky(
  agent: AtpAgent,
  text: string,
  reply?: { root: PostRef; parent: PostRef }
): Promise<PostRef> {
  const richText = new RichText({ text });
  await richText.detectFacets(agent);
  const { uri, cid } = await agent.post({
    text: richText.text,
    facets: richText.facets,
    ...(reply ? { reply } : {})
  });
  logger.info(`Posted to Bluesky: ${uri}`);
  return { uri, cid };
}

function oldestNewBill(db: DB): Bill | undefined {
  return db
    .select()
    .from(bills)
    .where(eq(bills.status, 'NEW'))
    .all()
    .sort(compareByBillNumberAsc)[0];
}

export default async function runPostTask(db: DB = getDb()): Promise<void> {
  logger.info('Checking for bills to post!');
  const billToPost = oldestNewBill(db);
  if (billToPost) {
    logger.info('Posting the bill!');
    const text = composePostText(billToPost);
    const agent = await loginAgent();
    const mainRef = await postToBluesky(agent, text);

    // Best-effort plain-English summary reply (#015): the model decides whether
    // it adds value over the title. A failure here must never undo the main post
    // or the POSTED status, so the whole reply path is guarded.
    let replyText: string | null = null;
    let replyUri: string | null = null;
    try {
      const decision = await maybeBuildReply(billToPost);
      if (decision.reply) {
        const replyRef = await postToBluesky(agent, decision.text, {
          root: mainRef,
          parent: mainRef
        });
        replyText = decision.text;
        replyUri = replyRef.uri;
      }
    } catch (error) {
      logger.warn(
        { err: error, billNumber: billToPost.billNumber },
        'Summary reply failed; main post stands'
      );
    }

    db.insert(posts)
      .values({ billId: billToPost.id, text, uri: mainRef.uri, replyText, replyUri })
      .run();
    db.update(bills).set({ status: 'POSTED' }).where(eq(bills.id, billToPost.id)).run();
  } else {
    logger.info('No new bills!');
  }
  logger.info('all done!');
}
if (require.main === module) {
  runPostTask().catch((error) => logger.error(error));
}
