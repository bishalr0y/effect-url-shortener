import { Context, Layer, Effect, Data } from "effect";
import {
  DatabaseError,
  UserAlreadyExistsError,
  UserDoesntExistsError,
} from "../errors";
import { usersTable } from "../db/schema";
import { db } from "../lib/drizzle";
import { UrlRepository } from "./url-repository";
import { UrlService } from "../services/url-service";

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
    ) => Effect.Effect<Boolean, DatabaseError | UserAlreadyExistsError>;
    // getById: (
    //   id: string,
    // ) => Effect.Effect<User, DatabaseError | UserDoesntExistsError>;
    // getAll: () => Effect.Effect<User[], DatabaseError>;
  }
>() {}

// Step 2: Live implementation
export const makeLive = Effect.sync(() =>
  UserRepository.of({
    create: (email: string, password: string) =>
      Effect.gen(function* () {
        const isUserExists = yield* Effect.tryPromise({
          try: () => db.select({ id: usersTable.id }).from(usersTable),
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
          try: () =>
            db.insert(usersTable).values({ email, password }).returning(),
          catch: (error) => new DatabaseError({ message: String(error) }),
        });

        if (!user) {
          return false;
        }
        return true;
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
        return true;
      }),
  });
});

export const UserRepositoryTest = Layer.scoped(UserRepository, makeTest);
