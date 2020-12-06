import Pino from 'pino';
import 'reflect-metadata';
import { config } from 'dotenv';
import { createConnection, getConnection } from 'typeorm';
import Twit from 'twit';
import Bill from '../entity/Bill';
import Tweet from '../entity/Tweet';

config();
const logger = Pino();

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

export async function tweetBill(tweet: Tweet): Promise<void> {
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
  twit.post('statuses/update', { status: tweet.body }, (err, data) => {
    if (err) {
      throw new Error(`Failed to Tweet ${err}`);
    }
    if (isSuccessfulTwitterResponse(data)) {
      logger.info(`tweet id: ${data.id_str} created_at: ${data.created_at} text: ${data.text}`);
    } else {
      logger.warn('Twitter response had an unexpected type');
    }
  });
}

export default async function main(): Promise<void> {
  logger.info(`Checking for bills to tweet!!`);
  await createConnection();
  const billRepository = getConnection().getRepository(Bill);
  const tweetRepository = getConnection().getRepository(Tweet);
  const billToTweet = (
    (await billRepository
      .createQueryBuilder('bill')
      .leftJoinAndMapOne('tweet', 'tweet', 'tweet', 'tweet.billId = bill.id')
      .where('tweet.id is NULL')
      .getMany()) || []
  ).sort((a, b) => {
    const aDigits = a.billNumber.match(/\d+/);
    const bDigits = b.billNumber.match(/\d+/);
    if (aDigits === null || bDigits === null) {
      throw new Error(`Could not match bill numbers: ${a.billNumber} ${b.billNumber}`);
    }
    return Number.parseInt(aDigits[0], 10) - Number.parseInt(bDigits[0], 10);
  })[0];
  if (billToTweet) {
    logger.info(`Tweeting the bill!`);
    const tweet = Tweet.fromBill(billToTweet);
    await tweetBill(tweet);
    await tweetRepository.save(tweet);
  } else {
    logger.info('No new bills!');
  }
  logger.info('all done!');
}
main().catch((error) => logger.error(error));
