import { existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import Database from 'better-sqlite3';
import { type BetterSQLite3Database, drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';

export type DB = BetterSQLite3Database<typeof schema>;

const DEFAULT_DB_PATH = './data/macourtreporter.db';

let cached: DB | undefined;

// Lazily open (and memoize) the shared Drizzle handle. Kept out of module scope
// so importing a script doesn't touch the filesystem — tests inject their own
// in-memory db instead.
export function getDb(dbPath = process.env.DB_PATH ?? DEFAULT_DB_PATH): DB {
  if (cached) {
    return cached;
  }
  const dir = dirname(dbPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  const sqlite = new Database(dbPath);
  sqlite.pragma('journal_mode = WAL');
  cached = drizzle(sqlite, { schema });
  return cached;
}
