import { Context, Layer, Effect } from "effect";
import {
  DatabaseError,
  InvalidCredentialsError,
  UserAlreadyExistsError,
  UserDoesntExistsError,
  JwtGenerationError,
  HashGenerationError,
} from "../errors";
import jwt from "jsonwebtoken";
import { User, UserRepository } from "../repositories/user-repository";
import { generateHash, validateHash } from "../utils/index";

export class UserService extends Context.Tag("app/UserService")<
  UserService,
  {
    // new acc
    signup: (
      email: string,
      password: string,
    ) => Effect.Effect<string, UserAlreadyExistsError | DatabaseError | HashGenerationError | JwtGenerationError>;

    // login
    signin: (
      email: string,
      password: string,
    ) => Effect.Effect<
      string,
      DatabaseError | UserDoesntExistsError | InvalidCredentialsError | HashGenerationError | JwtGenerationError
    >;

    getAllUsers: () => Effect.Effect<User[], DatabaseError>;
    getUser: (
      id: string,
    ) => Effect.Effect<
      Omit<User, "password">,
      DatabaseError | UserDoesntExistsError
    >;
  }
>() {}

// helper function
const generateJwtToken = (id: string, email: string) =>
  Effect.try({
    try: () => {
      const secret = process.env.JWT_SECRET;
      if (!secret) {
        throw new Error("JWT_SECRET not found in env");
      }

      return jwt.sign(
        {
          data: {
            id,
            email,
          },
        },
        secret,
        { expiresIn: "1hr", audience: "user", issuer: "admin" },
      );
    },
    catch: (error) => new JwtGenerationError({ message: String(error) })
  });

const makeLive = Effect.gen(function* () {
  const repo = yield* UserRepository;

  return UserService.of({
    signup: (email: string, password: string) =>
      Effect.gen(function* () {
        const hashedPassword = yield* generateHash(password);

        const user = yield* repo.create(email, hashedPassword);
        const token = yield* generateJwtToken(user.id, user.email);
        return token;
      }),
    signin: (email: string, password: string) =>
      Effect.gen(function* () {
        const user = yield* repo.getByEmail(email);

        const isValidPassword = yield* validateHash(password, user.password);
        if (!isValidPassword) {
          yield* Effect.fail(
            new InvalidCredentialsError({
              message: "invalid credentials",
            }),
          );
        }

        const token = yield* generateJwtToken(user.id, user.email);
        return token;
      }),
    getAllUsers: () =>
      Effect.gen(function* () {
        const users = yield* repo.getAll();
        return users;
      }),

    getUser: (id: string) =>
      Effect.gen(function* () {
        const user = yield* repo.getById(id);
        return user;
      }),
  });
});

export const UserServiceLive = Layer.scoped(UserService, makeLive);
