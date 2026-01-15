import { Context, Layer, Effect } from "effect";
import {
  DatabaseError,
  UrlAlreadyExistsError,
  UrlDoesntExistsError,
} from "../errors";
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
    create: (
      url: string,
      code: string,
    ) => Effect.Effect<Url, DatabaseError | UrlAlreadyExistsError>;
    findByCode: (
      code: string,
    ) => Effect.Effect<Url, DatabaseError | UrlDoesntExistsError>;
    checkIfCodeExists: (code: string) => Effect.Effect<boolean, DatabaseError>;
    getAll: () => Effect.Effect<Url[], DatabaseError>;
  }
>() {}

// Step 2: Live implementation using drizzle
const makeLive = Effect.sync(() =>
  UrlRepository.of({
    create: (url: string, code: string) =>
      Effect.gen(function* () {
        const isRecordExists = yield* Effect.tryPromise({
          try: () =>
            db
              .select({ id: urlsTable.id })
              .from(urlsTable)
              .where(eq(urlsTable.url, url)),
          catch: (error) => new DatabaseError({ message: String(error) }),
        });

        if (isRecordExists.length > 0) {
          return yield* Effect.fail(
            new UrlAlreadyExistsError({
              message: "The url already exists",
            }),
          );
        }

        yield* Effect.tryPromise({
          try: () => db.insert(urlsTable).values({ url, code }),
          catch: (error) => new DatabaseError({ message: String(error) }),
        });

        const result = yield* Effect.tryPromise({
          try: () =>
            db.select().from(urlsTable).where(eq(urlsTable.code, code)),
          catch: (error) => new DatabaseError({ message: String(error) }),
        });

        if (!result || result.length === 0) {
          return yield* Effect.fail(
            new DatabaseError({ message: "Insert returned no records" }),
          );
        }

        const record = result[0];
        return {
          id: record.id,
          code: record.code,
          url: record.url ?? "",
          createdAt: record.created_at
            ? new Date(record.created_at)
            : new Date(),
        };
      }),
    findByCode: (code: string) =>
      Effect.gen(function* () {
        const result = yield* Effect.tryPromise({
          try: () =>
            db.select().from(urlsTable).where(eq(urlsTable.code, code)),
          catch: (error) => new DatabaseError({ message: String(error) }),
        });

        if (!result || result.length === 0) {
          return yield* Effect.fail(
            new UrlDoesntExistsError({
              message: "Url does not exists",
            }),
          );
        }

        const record = result[0];
        return {
          id: record.id,
          code: record.code,
          url: record.url ?? "",
          createdAt: record.created_at
            ? new Date(record.created_at)
            : new Date(),
        };
      }),

    checkIfCodeExists: (code: string) =>
      Effect.gen(function* () {
        const result = yield* Effect.tryPromise({
          try: () =>
            db.select().from(urlsTable).where(eq(urlsTable.code, code)),
          catch: (error) => new DatabaseError({ message: String(error) }),
        });

        if (!result || result.length === 0) {
          return false;
        }
        return true;
      }),

    getAll: () =>
      Effect.tryPromise({
        try: async () => {
          const records = await db.select().from(urlsTable);
          const urls: Url[] = [];
          for (let i = 0; i < records.length; i++) {
            urls[i] = {
              id: records[i].id,
              code: records[i].code,
              url: records[i].url,
              createdAt: records[i].created_at
                ? new Date(records[i].created_at as string)
                : new Date(),
            };
          }
          return urls;
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
    findByCode: (code: string) =>
      Effect.gen(function* () {
        const url = store.get(code);
        if (!url) {
          return yield* Effect.fail(
            new UrlDoesntExistsError({
              message: "Url does not exists",
            }),
          );
        }
        return url;
      }),

    checkIfCodeExists: (code: string) =>
      Effect.gen(function* () {
        const url = store.get(code);
        if (!url) {
          return false;
        }
        return true;
      }),
    // copy of urls is returned to avoid mutation
    getAll: () => Effect.sync(() => [...urls]),
  });
});

export const UrlRepositoryTest = Layer.scoped(UrlRepository, makeTest);
