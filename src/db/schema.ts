import * as p from "drizzle-orm/pg-core";

export const urlsTable = p.pgTable("urls", {
  id: p.uuid().defaultRandom().primaryKey(),
  code: p.text().unique().notNull(),
  url: p.text().notNull().unique(),
  created_at: p.timestamp().defaultNow(),
});
