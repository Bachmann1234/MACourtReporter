import type { IncomingMessage } from 'node:http';
import { config } from 'dotenv';
import { eq } from 'drizzle-orm';
import Pino from 'pino';
import Twit, { type Response } from 'twit';
import { type DB, getDb } from '../db';
import { type Bill, bills, posts } from '../db/schema';
import { composePostText } from '../posts/composePost';

config({ quiet: true });
export const logger = Pino();

type SuccessfulTwitterResponse = {
  id_str: string;
  created_at: string;
  text: string;
};

function isSuccessfulTwitterResponse(value: unknown): value is SuccessfulTwitterResponse {
  if (value && typeof value === 'object') {
    return 'id_str' in value && 'created_at' in value && 'text' in value;
  }
  return false;
}

export function handleTwitterResponse(
  err: Error | null,
  result: Response,
  _response: IncomingMessage
): void {
  if (err) {
    throw new Error(`Failed to Tweet -- ${err}`);
  }
  if (isSuccessfulTwitterResponse(result)) {
    logger.info(`tweet id: ${result.id_str} created_at: ${result.created_at} text: ${result.text}`);
  } else {
    logger.warn('Twitter response had an unexpected type');
  }
}

async function tweetBill(text: string): Promise<void> {
  if (
    !(
      process.env.TWITTER_API_KEY &&
      process.env.TWITTER_API_KEY_SECRET &&
      process.env.TWITTER_ACCESS_TOKEN &&
      process.env.TWITTER_ACCESS_TOKEN_SECRET
    )
  ) {
    throw new Error('Twitter keys not defined in environment');
  }
  const twit = new Twit({
    consumer_key: process.env.TWITTER_API_KEY,
    consumer_secret: process.env.TWITTER_API_KEY_SECRET,
    access_token: process.env.TWITTER_ACCESS_TOKEN,
    access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
    timeout_ms: 1000 * 60,
    strictSSL: true
  });
  twit.post('statuses/update', { status: text }, handleTwitterResponse);
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

export default async function runTweetTask(db: DB = getDb()): Promise<void> {
  logger.info(`Checking for bills to tweet!!`);
  const billToTweet = oldestNewBill(db);
  if (billToTweet) {
    logger.info(`Tweeting the bill!`);
    const text = composePostText(billToTweet);
    await tweetBill(text);
    db.insert(posts).values({ billId: billToTweet.id, text }).run();
    db.update(bills).set({ status: 'POSTED' }).where(eq(bills.id, billToTweet.id)).run();
  } else {
    logger.info('No new bills!');
  }
  logger.info('all done!');
}
if (require.main === module) {
  runTweetTask().catch((error) => logger.error(error));
}
