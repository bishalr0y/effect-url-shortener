import { Context, Layer, Effect } from "effect";
import {
  DatabaseError,
  InvalidCredentialsError,
  UserAlreadyExistsError,
} from "../errors";
import jwt from "jsonwebtoken";
import { UserRepository } from "../repositories/user-repository";

export class UserService extends Context.Tag("app/UserService")<
  UserService,
  {
    // new acc
    signup: (
      email: string,
      password: string,
    ) => Effect.Effect<string, UserAlreadyExistsError | DatabaseError>;

    // login
    // signin: (
    //   email: string,
    //   password: string,
    // ) => Effect.Effect<string, InvalidCredentialsError>;
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
        const user = yield* repo.create(email, password);
        const token = generateJwtToken(user.id, user.email);
        return token;
      }),
  });
});

export const UserServiceLive = Layer.scoped(UserService, makeLive);
