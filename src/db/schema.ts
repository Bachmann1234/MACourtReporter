import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

// Bill lifecycle (see ticket #004): SKIPPED = seeded on first run (never posted),
// NEW = scraped and awaiting a post, POSTED = a real post exists for it.
export const BILL_STATUSES = ['NEW', 'POSTED', 'SKIPPED'] as const;

export const bills = sqliteTable(
  'bill',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    created: text('created').notNull().default(sql`CURRENT_TIMESTAMP`),
    // The General Court (session) this bill belongs to, e.g. 194. Bill numbers
    // restart every session, so identity is (courtNumber, billNumber) — see #012.
    courtNumber: integer('court_number').notNull(),
    billNumber: text('bill_number').notNull(),
    filedBy: text('filed_by').notNull(),
    summary: text('summary').notNull(),
    url: text('url').notNull(),
    status: text('status', { enum: BILL_STATUSES }).notNull().default('NEW')
  },
  (table) => [uniqueIndex('court_bill_number_idx').on(table.courtNumber, table.billNumber)]
);

// One row per real post. "Has this bill been posted" is authoritative on
// bill.status, not derived from this table — every row here is a genuine post.
export const posts = sqliteTable('post', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  created: text('created').notNull().default(sql`CURRENT_TIMESTAMP`),
  billId: integer('bill_id')
    .notNull()
    .unique()
    .references(() => bills.id),
  // The post's URI on the network (e.g. a Bluesky at:// URI). Populated once the
  // posting backend can return it (#004); nullable until then.
  uri: text('uri'),
  text: text('text').notNull()
});

export type Bill = typeof bills.$inferSelect;
export type NewBill = typeof bills.$inferInsert;
export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
export type BillStatus = (typeof BILL_STATUSES)[number];
