import { Context, Layer, Effect, Data } from "effect";
import {
  DatabaseError,
  UserAlreadyExistsError,
  UserDoesntExistsError,
} from "../errors";
import { usersTable } from "../db/schema";
import { db } from "../lib/drizzle";
import { eq } from "drizzle-orm";
import { generateHash } from "../utils";

// Domain interface
export interface User {
  id: string;
  email: string;
  password: string;
  createdAt: Date;
}

// Step 1: Define Service Tag
export class UserRepository extends Context.Tag("app/UserRepository")<
  UserRepository,
  {
    create: (
      email: string,
      password: string,
    ) => Effect.Effect<
      Omit<User, "password">,
      DatabaseError | UserAlreadyExistsError
    >;
    getById: (
      id: string,
    ) => Effect.Effect<User, DatabaseError | UserDoesntExistsError>;
    getAll: () => Effect.Effect<User[], DatabaseError>;
  }
>() {}

// Step 2: Live implementation
export const makeLive = Effect.sync(() =>
  UserRepository.of({
    create: (email: string, password: string) =>
      Effect.gen(function* () {
        const isUserExists = yield* Effect.tryPromise({
          try: () =>
            db
              .select({
                id: usersTable.id,
              })
              .from(usersTable),
          catch: (error) => new DatabaseError({ message: String(error) }),
        });

        if (isUserExists.length > 0) {
          return yield* Effect.fail(
            new UserAlreadyExistsError({
              message: "The user already exists",
            }),
          );
        }
        // create the user
        const user = yield* Effect.tryPromise({
          try: async () => {
            const hashedPassword = generateHash(password) as string;

            return await db
              .insert(usersTable)
              .values({ email, password: hashedPassword })
              .returning({
                id: usersTable.id,
                email: usersTable.email,
                createdAt: usersTable.created_at,
              });
          },
          catch: (error) => new DatabaseError({ message: String(error) }),
        });

        if (!user) {
          new DatabaseError({ message: "failed to create the user" });
        }
        return {
          id: user[0].id,
          email: user[0].email,
          createdAt: user[0].createdAt
            ? new Date(user[0].createdAt)
            : new Date(),
        };
      }),
    getById: (id: string) =>
      Effect.gen(function* () {
        const result = yield* Effect.tryPromise({
          try: () => db.select().from(usersTable).where(eq(usersTable.id, id)),
          catch: (error) => new DatabaseError({ message: String(error) }),
        });

        if (!result || result.length === 0) {
          return yield* Effect.fail(
            new UserDoesntExistsError({
              message: "User does not exists",
            }),
          );
        }

        const user = result[0];

        return {
          id: user.id,
          email: user.email,
          password: "",
          createdAt: user.created_at ? new Date(user.created_at) : new Date(),
        };
      }),
    getAll: () =>
      Effect.gen(function* () {
        yield* Effect.tryPromise({
          try: async () => {
            const records = await db.select().from(usersTable);
            const users: User[] = [];
            for (let i = 0; i < records.length; i++) {
              users[i] = {
                id: records[i].id,
                email: records[i].email,
                password: "",
                createdAt: records[i].created_at
                  ? new Date(records[i].created_at as string)
                  : new Date(),
              };
            }
            return users;
          },
          catch: (error) => new DatabaseError({ message: String(error) }),
        });
        return [] as User[];
      }),
  }),
);

export const UserRepositoryLive = Layer.scoped(UserRepository, makeLive);

// Step 3: Test implementation (in-memory)
const makeTest = Effect.sync(() => {
  const store = new Map<string, User>();
  const users: User[] = [];
  return UserRepository.of({
    create: (email: string, password: string) =>
      Effect.sync(() => {
        const newUser: User = {
          id: crypto.randomUUID(),
          email,
          password,
          createdAt: new Date(),
        };

        store.set(newUser.id, newUser);
        users.push(newUser);
        return {
          id: newUser.id,
          email: newUser.email,
          createdAt: newUser.createdAt,
        };
      }),
    getById: (id: string) =>
      Effect.gen(function* () {
        const user = store.get(id);

        if (!user) {
          return yield* Effect.fail(
            new UserDoesntExistsError({
              message: "User does not exists",
            }),
          );
        }
        return user;
      }),
    // copy of the users is returned to avoid mutation
    getAll: () => Effect.sync(() => [...users]),
  });
});

export const UserRepositoryTest = Layer.scoped(UserRepository, makeTest);
