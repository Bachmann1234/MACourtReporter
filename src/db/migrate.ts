import { config } from 'dotenv';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import Pino from 'pino';
import { getDb } from './index';

config({ quiet: true });
const logger = Pino();

if (require.main === module) {
  logger.info('Applying database migrations');
  migrate(getDb(), { migrationsFolder: './drizzle' });
  logger.info('Done!');
}
