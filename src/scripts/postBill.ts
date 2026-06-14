import { AtpAgent, RichText } from '@atproto/api';
import { config } from 'dotenv';
import { eq } from 'drizzle-orm';
import Pino from 'pino';
import { type DB, getDb } from '../db';
import { type Bill, bills, posts } from '../db/schema';
import { composePostText } from '../posts/composePost';

config({ quiet: true });
export const logger = Pino();

const BLUESKY_SERVICE = 'https://bsky.social';

// Posts `text` to Bluesky and returns the new post's at:// URI. Auth is a handle
// + app password (created in Bluesky settings, NOT the account password). Bluesky
// does not auto-link plain text, so we run the text through RichText to detect
// facets that render the bill URL and #mapoli as real links.
async function postToBluesky(text: string): Promise<string> {
  const identifier = process.env.BLUESKY_HANDLE;
  const password = process.env.BLUESKY_APP_PASSWORD;
  if (!(identifier && password)) {
    throw new Error('Bluesky credentials not defined in environment');
  }
  const agent = new AtpAgent({ service: BLUESKY_SERVICE });
  await agent.login({ identifier, password });
  const richText = new RichText({ text });
  await richText.detectFacets(agent);
  const { uri } = await agent.post({ text: richText.text, facets: richText.facets });
  logger.info(`Posted to Bluesky: ${uri}`);
  return uri;
}

function oldestNewBill(db: DB): Bill | undefined {
  return db
    .select()
    .from(bills)
    .where(eq(bills.status, 'NEW'))
    .all()
    .sort((a, b) => {
      const aDigits = a.billNumber.match(/\d+/);
      const bDigits = b.billNumber.match(/\d+/);
      if (aDigits === null || bDigits === null) {
        throw new Error(`Could not match bill numbers: ${a.billNumber} ${b.billNumber}`);
      }
      return Number.parseInt(aDigits[0], 10) - Number.parseInt(bDigits[0], 10);
    })[0];
}

export default async function runPostTask(db: DB = getDb()): Promise<void> {
  logger.info('Checking for bills to post!');
  const billToPost = oldestNewBill(db);
  if (billToPost) {
    logger.info('Posting the bill!');
    const text = composePostText(billToPost);
    const uri = await postToBluesky(text);
    db.insert(posts).values({ billId: billToPost.id, text, uri }).run();
    db.update(bills).set({ status: 'POSTED' }).where(eq(bills.id, billToPost.id)).run();
  } else {
    logger.info('No new bills!');
  }
  logger.info('all done!');
}
if (require.main === module) {
  runPostTask().catch((error) => logger.error(error));
}
