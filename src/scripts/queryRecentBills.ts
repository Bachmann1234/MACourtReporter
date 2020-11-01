import Pino from 'pino';
import { CURRENT_LEGISLATURE } from '../legislature/generalCourt';
import { queryRecentBills } from '../clients/malegislature';

const logger = Pino();

queryRecentBills(CURRENT_LEGISLATURE).then(() => logger.info('Done!'));
