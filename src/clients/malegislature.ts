import axios from 'axios';
import Pino from 'pino';
import { CURRENT_LEGISLATURE } from 'legislature/generalCourt';

const logger = Pino();

export type ScrapedBill = {};
export function queryRecentBills(): void {
  logger.info(CURRENT_LEGISLATURE);
  const x = { a: 1 };
  Object.keys(x).forEach((key) => {
    if (Number.isNaN(1)) {
      logger.info('OH NO');
    }
    logger.info(key);
  });
}
