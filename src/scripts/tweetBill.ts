import Pino from 'pino';
import 'reflect-metadata';
import { config } from 'dotenv';
import { createConnection } from 'typeorm';
import Bill from '../entity/Bill';

// 280
config();
const logger = Pino();

async function getBillToTweet(): Promise<Bill> {
  return new Bill();
}

export default async function main(): Promise<void> {
  logger.info(`Tweeting a bill!`);
  await createConnection();
  const billToTweet = await getBillToTweet();
}
main().catch((error) => logger.error(error));
