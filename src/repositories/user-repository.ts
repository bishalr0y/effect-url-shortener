import { Context, Layer, Effect } from "effect";
import {
  DatabaseError,
  UserAlreadyExistsError,
  UserDoesntExistsError,
} from "../errors";
import { usersTable } from "../db/schema";
import { db } from "../lib/drizzle";
import { eq } from "drizzle-orm";

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
    ) => Effect.Effect<
      Omit<User, "password">,
      DatabaseError | UserDoesntExistsError
    >;
    getAll: () => Effect.Effect<User[], DatabaseError>;
    getByEmail: (
      email: string,
    ) => Effect.Effect<User, DatabaseError | UserDoesntExistsError>;
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
            return await db
              .insert(usersTable)
              .values({ email, password })
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
    getByEmail: (email: string) =>
      Effect.tryPromise({
        try: async () => {
          const user = await db
            .select()
            .from(usersTable)
            .where(eq(usersTable.email, email));

          if (!user || user.length === 0) {
            new UserDoesntExistsError({ message: "user not found" });
          }
          return {
            id: user[0].id,
            email: user[0].email,
            password: user[0].password,
            createdAt: user[0].created_at
              ? new Date(user[0].created_at)
              : new Date(),
          };
        },
        catch: (error) => new DatabaseError({ message: String(error) }),
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

    getByEmail: (email: string) =>
      Effect.gen(function* () {
        if (users.length === 0) {
          return yield* Effect.fail(
            new UserDoesntExistsError({ message: "user not found" }),
          );
        }
        for (let i = 0; i < users.length; i++) {
          if (users[i].email === email) {
            return {
              id: users[i].id,
              email: users[i].email,
              password: users[i].password,
              createdAt: users[i].createdAt,
            };
          }
        }
        return yield* Effect.fail(
          new UserDoesntExistsError({ message: "user not found" }),
        );
      }),
  });
});

export const UserRepositoryTest = Layer.scoped(UserRepository, makeTest);
