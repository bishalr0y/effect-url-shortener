import { Context, Layer, Effect } from "effect";
import { prisma } from "../lib/prisma";
import { DatabaseError } from "../errors";

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

// Step 2: Live implementation using prisma
const makeLive = Effect.sync(() => ({
  create: (url: string, code: string) =>
    Effect.tryPromise({
      try: () =>
        prisma.url.create({
          data: { url, code },
        }),
      catch: (error) => new DatabaseError({ message: String(error) }),
    }),
  findByCode: (code: string) =>
    Effect.tryPromise({
      try: () =>
        prisma.url
          .findFirst({
            where: {
              code,
            },
          })
          // TODO: to check why this exists
          .then((r) => r ?? null),
      catch: (error) => new DatabaseError({ message: String(error) }),
    }),

  getAll: () =>
    Effect.tryPromise({
      try: () => prisma.url.findMany(),
      catch: (error) => new DatabaseError({ message: String(error) }),
    }),
}));

// in Layer.scoped resources are clearly lifecycle-managed:
// export const UrlRepositoryLive = Layer.effect(UrlRepository, makeLive);
export const UrlRepositoryLive = Layer.scoped(UrlRepository, makeLive);

// Step 3: Test implementation (in-memory)
const makeTest = Effect.sync(() => {
  const store = new Map<string, Url>();
  const urls: Url[] = [];

  return {
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
  };
});

export const UrlRepositoryTest = Layer.scoped(UrlRepository, makeTest);
