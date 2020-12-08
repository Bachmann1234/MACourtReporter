import Pino from 'pino';
import 'reflect-metadata';
import { config } from 'dotenv';
import { getCurrentLegislature } from '../legislature/generalCourt';
import { queryRecentBills } from '../clients/malegislature';

config();
const logger = Pino();

if (require.main === module) {
  logger.info(
    `Querying for recent bills from MA General Court ${getCurrentLegislature().courtNumber}`
  );
  queryRecentBills(getCurrentLegislature())
    .then((bills) => {
      bills.forEach((bill) => {
        logger.info(
          `${bill.billNumber}: ${bill.summary}. Filed by: ${bill.filedBy}. Learn more: ${bill.url}`
        );
      });
      logger.info('Done!');
    })
    .catch((error) => logger.error(error));
}
