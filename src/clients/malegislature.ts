import axios from 'axios';
import Pino from 'pino';

const logger = Pino();
function queryRecentBills(): void {
  const x = { a: 1 };
  Object.keys(x).forEach((key) => {
    if (Number.isNaN(1)) {
      logger.info('OH NO');
    }
    logger.info(key);
  });
}

module.exports = { queryRecentBills };
