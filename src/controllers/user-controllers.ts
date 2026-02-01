import { Context } from "hono";
import { Effect, Schema } from "effect";
import { UserService } from "../services/user-service";
import { UserAuthRequest, UserAuthResponse } from "../schemas";
import { appLayer } from "../layers";

// helper function to return human readable error message
const formatValidationError = (message: string): string => {
  if (message.includes("is missing")) {
    return "Missing required fields";
  }
  if (message.includes('"email"') && message.includes("pattern")) {
    return "Invalid email format";
  }
  if (message.includes('"password"') && message.includes("minLength")) {
    return "Password must be at least 6 characters";
  }
  return "Invalid request data";
};

export const signupHandler = async (c: Context) => {
  const program = Effect.gen(function* () {
    const userService = yield* UserService;

    const body = yield* Effect.promise(() => c.req.json());

    const { email, password } =
      yield* Schema.decodeUnknown(UserAuthRequest)(body);

    const jwtToken = yield* userService.signup(email, password);

    yield* Effect.logInfo("User signup successful", { email });

    return yield* Schema.encode(UserAuthResponse)({
      ok: true,
      token: jwtToken,
      message: "user signup successful",
    });
  });

  const result = await Effect.runPromise(
    Effect.provide(program, appLayer).pipe(
      Effect.map((response) => ({ ...response, statusCode: 200 })),

      Effect.catchTag("ParseError", (error) =>
        Effect.gen(function* () {
          yield* Effect.logError("ParseError", { message: error.message });
          return {
            ok: false,
            message: formatValidationError(error.message),
            token: "",
            statusCode: 400,
          };
        }),
      ),

      Effect.catchTag("UserAlreadyExistsError", (error) =>
        Effect.gen(function* () {
          yield* Effect.logError("UserAlreadyExistsError", {
            message: error.message,
          });
          return {
            ok: false,
            message: error.message,
            token: "",
            statusCode: 400,
          };
        }),
      ),

      Effect.catchTag("DatabaseError", (error) =>
        Effect.gen(function* () {
          yield* Effect.logError("DatabaseError", { message: error.message });
          return {
            ok: false,
            message: error.message,
            token: "",
            statusCode: 500,
          };
        }),
      ),

      Effect.catchAll((error) =>
        Effect.gen(function* () {
          yield* Effect.logError("Uncaught error", { error });
          return {
            ok: false,
            message: "Unexpected error",
            token: "",
            statusCode: 500,
          };
        }),
      ),
    ),
  );

  return c.json(
    {
      ok: result.ok,
      message: result.message,
      token: result.token,
    },
    result.statusCode as 200 | 400 | 500,
  );
};

export const signInHandler = async (c: Context) => {
  const program = Effect.gen(function* () {
    const service = yield* UserService;

    const body = yield* Effect.promise(() => c.req.json());
    const { email, password } =
      yield* Schema.decodeUnknown(UserAuthRequest)(body);

    const jwtToken = yield* service.signin(email, password);

    yield* Effect.logInfo("User signin successful", { email });

    return yield* Schema.encode(UserAuthResponse)({
      ok: true,
      token: jwtToken,
      message: "user signin successful",
    });
  });

  const result = await Effect.runPromise(
    Effect.provide(program, appLayer).pipe(
      Effect.map((response) => ({ ...response, statusCode: 200 })),

      Effect.catchTag("ParseError", (error) =>
        Effect.gen(function* () {
          yield* Effect.logError("ParseError", { message: error.message });
          return {
            ok: false,
            message: formatValidationError(error.message),
            token: "",
            statusCode: 400,
          };
        }),
      ),

      Effect.catchTag("UserDoesntExistsError", (error) =>
        Effect.gen(function* () {
          yield* Effect.logError("UserDoesntExistsError", {
            message: error.message,
          });
          return {
            ok: false,
            message: error.message,
            token: "",
            statusCode: 400,
          };
        }),
      ),

      Effect.catchTag("InvalidCredentialsError", (error) =>
        Effect.gen(function* () {
          yield* Effect.logError("InvalidCredentialsError", {
            message: error.message,
          });
          return {
            ok: false,
            message: error.message,
            token: "",
            statusCode: 400,
          };
        }),
      ),

      Effect.catchTag("DatabaseError", (error) =>
        Effect.gen(function* () {
          yield* Effect.logError("DatabaseError", { message: error.message });
          return {
            ok: false,
            message: error.message,
            token: "",
            statusCode: 500,
          };
        }),
      ),

      Effect.catchAll((error) =>
        Effect.gen(function* () {
          yield* Effect.logError("Uncaught error", { error });
          return {
            ok: false,
            message: "Unexpected error",
            token: "",
            statusCode: 500,
          };
        }),
      ),
    ),
  );

  return c.json(
    {
      ok: result.ok,
      message: result.message,
      token: result.token,
    },
    result.statusCode as 200 | 400 | 500,
  );
};

export const getAllUsersHandler = async (c: Context) => {
  const program = Effect.gen(function* () {
    const service = yield* UserService;

    const users = yield* service.getAllUsers();

    yield* Effect.logInfo("Fetched all users", { userCount: users.length });

    return {
      ok: true,
      message: "fetched all users",
      users,
    };
  });

  const result = await Effect.runPromise(
    Effect.provide(program, appLayer).pipe(
      Effect.map((response) => ({ ...response, statusCode: 200 })),

      Effect.catchTag("DatabaseError", (error) =>
        Effect.gen(function* () {
          yield* Effect.logError("DatabaseError", { message: error.message });
          return {
            ok: false,
            message: error.message,
            users: [],
            statusCode: 500,
          };
        }),
      ),

      Effect.catchAll((error) =>
        Effect.gen(function* () {
          yield* Effect.logError("Uncaught error", { error });
          return {
            ok: false,
            message: "Unexpected error",
            users: [],
            statusCode: 500,
          };
        }),
      ),
    ),
  );

  return c.json(
    {
      ok: result.ok,
      message: result.message,
      users: result.users,
    },
    result.statusCode as 200 | 500,
  );
};

export const getUserHandler = async (c: Context) => {
  const program = Effect.gen(function* () {
    const userId = c.req.param("id");
    const service = yield* UserService;

    const user = yield* service.getUser(userId);

    yield* Effect.logInfo("User found", { userId });

    return {
      ok: true,
      message: "user found successfully",
      user,
    };
  });

  const result = await Effect.runPromise(
    Effect.provide(program, appLayer).pipe(
      Effect.map((response) => ({ ...response, statusCode: 200 })),

      Effect.catchTag("UserDoesntExistsError", (error) =>
        Effect.gen(function* () {
          yield* Effect.logError("UserDoesntExistsError", {
            message: error.message,
          });
          return {
            ok: false,
            message: error.message,
            user: null,
            statusCode: 404,
          };
        }),
      ),

      Effect.catchTag("DatabaseError", (error) =>
        Effect.gen(function* () {
          yield* Effect.logError("DatabaseError", { message: error.message });
          return {
            ok: false,
            message: error.message,
            user: null,
            statusCode: 500,
          };
        }),
      ),

      Effect.catchAll((error) =>
        Effect.gen(function* () {
          yield* Effect.logError("Uncaught error", { error });
          return {
            ok: false,
            message: "Unexpected error",
            user: null,
            statusCode: 500,
          };
        }),
      ),
    ),
  );

  return c.json(
    {
      ok: result.ok,
      message: result.message,
      user: result.user,
    },
    result.statusCode as 200 | 404 | 500,
  );
};

