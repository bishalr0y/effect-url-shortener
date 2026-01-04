import { drizzle } from "drizzle-orm/postgres-js";

// You can specify any property from the postgres-js connection options
export const db = drizzle({
  connection: {
    url: process.env.DATABASE_URL,
    ssl: true,
  },
});
