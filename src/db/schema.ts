import * as p from "drizzle-orm/pg-core";

export const usersTable = p.pgTable("users", {
  id: p.uuid().defaultRandom().primaryKey(),
  email: p.text().unique().notNull(),
  password: p.text().notNull(),
  created_at: p.date().defaultNow(),
});

export const urlsTable = p.pgTable("urls", {
  id: p.uuid().defaultRandom().primaryKey(),
  code: p.text().unique().notNull(),
  url: p.text().notNull().unique(),
  created_at: p.date().defaultNow(),
  // TODO: will add the line below when the user functionalities are done
  // user_id_fk: p.uuid().references(() => usersTable.id, { onDelete: "cascade" }),
});
