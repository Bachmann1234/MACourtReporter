import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import type { DB } from '../../src/db';
import * as schema from '../../src/db/schema';

// A fresh in-memory database with the real migrations applied, so tests exercise
// actual Drizzle queries rather than a hand-stubbed query builder.
export default function createTestDb(): DB {
  const sqlite = new Database(':memory:');
  const db = drizzle(sqlite, { schema });
  migrate(db, { migrationsFolder: './drizzle' });
  return db;
}
