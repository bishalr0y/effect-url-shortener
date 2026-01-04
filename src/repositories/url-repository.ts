import { Context, Layer, Effect } from "effect";
import { DatabaseError } from "../errors";
import { db } from "../lib/drizzle";
import { urlsTable } from "../db/schema";
import { eq } from "drizzle-orm";

// Domain model
export interface Url {
  id: string;
  code: string;
  url: string;
  createdAt: Date;
}

// Step 1: Define Service Tag
export class UrlRepository extends Context.Tag("app/UrlRepository")<
  UrlRepository,
  {
    create: (url: string, code: string) => Effect.Effect<Url, DatabaseError>;
    findByCode: (code: string) => Effect.Effect<Url | null, DatabaseError>;
    getAll: () => Effect.Effect<Url[], DatabaseError>;
  }
>() {}

// Step 2: Live implementation using drizzle
const makeLive = Effect.sync(() =>
  UrlRepository.of({
    create: (url: string, code: string) =>
      Effect.tryPromise({
        try: async () => {
          await db.insert(urlsTable).values({ url, code });
          const result = await db
            .select()
            .from(urlsTable)
            .where(eq(urlsTable.code, code));
          if (!result || result.length === 0) {
            new DatabaseError({ message: "Insert returned no records" });
          }
          const record = result[0];
          return {
            id: record.id,
            code: record.code,
            url: record.url ?? "",
            createdAt: record.created_at ?? new Date(),
          };
        },
        catch: (error) => new DatabaseError({ message: String(error) }),
      }),
    findByCode: (code: string) =>
      Effect.tryPromise({
        try: async () => {
          const result = await db
            .select()
            .from(urlsTable)
            .where(eq(urlsTable.code, code));
          if (!result || result.length === 0) {
            return null;
          }
          const record = result[0];

          return {
            id: record.id,
            code: record.code,
            url: record.url ?? "",
            createdAt: record.created_at ?? new Date(),
          };
        },
        catch: (error) => new DatabaseError({ message: String(error) }),
      }),

    getAll: () =>
      Effect.tryPromise({
        try: async () => {
          const records = await db.select().from(urlsTable);
          const results: Url[] = [];
          for (let i = 0; i < records.length; i++) {
            results[i] = {
              id: records[i].id,
              code: records[i].code,
              url: records[i].url,
              createdAt: records[i].created_at ?? new Date(),
            };
          }
          return results;
        },
        catch: (error) => new DatabaseError({ message: String(error) }),
      }),
  }),
);

// in Layer.scoped resources are clearly lifecycle-managed:
// export const UrlRepositoryLive = Layer.effect(UrlRepository, makeLive);
export const UrlRepositoryLive = Layer.scoped(UrlRepository, makeLive);

// Step 3: Test implementation (in-memory)
const makeTest = Effect.sync(() => {
  const store = new Map<string, Url>();
  const urls: Url[] = [];

  return UrlRepository.of({
    create: (url: string, code: string) =>
      Effect.sync(() => {
        const newUrl: Url = {
          id: crypto.randomUUID(),
          url,
          code,
          createdAt: new Date(),
        };

        store.set(code, newUrl);
        urls.push(newUrl);
        return newUrl;
      }),
    findByCode: (code: string) => Effect.sync(() => store.get(code) ?? null),
    getAll: () => Effect.sync(() => [...urls]),
  });
});

export const UrlRepositoryTest = Layer.scoped(UrlRepository, makeTest);
