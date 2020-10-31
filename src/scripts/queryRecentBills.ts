import Pino from 'pino';
import { CURRENT_LEGISLATURE } from '../legislature/generalCourt';
import { queryRecentBills } from '../clients/malegislature';

require('dotenv').config();

const logger = Pino();

queryRecentBills(CURRENT_LEGISLATURE).then(() => logger.info('Done!'));
