import { Context } from "hono";
import { Effect, Layer, Schema } from "effect";
import { UserService, UserServiceLive } from "../services/user-service";
import { UserAuthRequest, UserAuthResponse } from "../schemas";
import { UserRepositoryLive } from "../repositories/user-repository";

export const signupHandler = async (c: Context) => {
  const program = Effect.gen(function* () {
    const userService = yield* UserService;

    const body = yield* Effect.promise(() => c.req.json());

    const { email, password } =
      yield* Schema.decodeUnknown(UserAuthRequest)(body);

    const jwtToken = yield* userService.signup(email, password);

    return yield* Schema.encode(UserAuthResponse)({
      ok: true,
      token: jwtToken,
      message: "user signup successfull",
    });
  });

  const layer = Layer.provide(UserServiceLive, UserRepositoryLive);

  const result = await Effect.runPromise(
    Effect.provide(program, layer).pipe(
      Effect.map((response) => ({ ...response, statusCode: 200 })),

      Effect.catchTag("ParseError", (error) =>
        Effect.succeed({
          ok: false,
          message: error.message,
          statusCode: 400,
        }),
      ),

      Effect.catchTag("UserAlreadyExistsError", (error) =>
        Effect.succeed({
          ok: false,
          message: error.message,
          statusCode: 400,
        }),
      ),

      Effect.catchTag("DatabaseError", (error) =>
        Effect.succeed({
          ok: false,
          message: error.message,
          statusCode: 500,
        }),
      ),
    ),
  );

  return c.json(
    {
      ok: result.ok,
      message: result.message,
    },
    result.statusCode as 200 | 400 | 500,
  );
};
