import { Context, Layer, Effect } from "effect";
import {
  DatabaseError,
  InvalidCredentialsError,
  UserAlreadyExistsError,
  UserDoesntExistsError,
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
    ) => Effect.Effect<string, UserAlreadyExistsError | DatabaseError>;

    // login
    signin: (
      email: string,
      password: string,
    ) => Effect.Effect<
      string,
      DatabaseError | UserDoesntExistsError | InvalidCredentialsError
    >;

    getAllUsers: () => Effect.Effect<User[], DatabaseError>;
  }
>() {}

// helper function
const generateJwtToken = (id: string, email: string) => {
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
};

const makeLive = Effect.gen(function* () {
  const repo = yield* UserRepository;

  return UserService.of({
    signup: (email: string, password: string) =>
      Effect.gen(function* () {
        const hashedPassword = generateHash(password);

        const user = yield* repo.create(email, hashedPassword);
        const token = generateJwtToken(user.id, user.email);
        return token;
      }),
    signin: (email: string, password: string) =>
      Effect.gen(function* () {
        const user = yield* repo.getByEmail(email);

        if (!validateHash(password, user.password)) {
          yield* Effect.fail(
            new InvalidCredentialsError({
              message: "invalid credentials",
            }),
          );
        }

        const token = generateJwtToken(user.id, user.email);
        return token;
      }),
    getAllUsers: () =>
      Effect.gen(function* () {
        const users = yield* repo.getAll();
        return users;
      }),
  });
});

export const UserServiceLive = Layer.scoped(UserService, makeLive);
