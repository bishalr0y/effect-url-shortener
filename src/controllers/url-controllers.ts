import { Context } from "hono";
import { Effect, Schema, Layer } from "effect";
import { UrlService, UrlServiceLive } from "../services/url-service";
import { UrlRepositoryLive } from "../repositories/url-repository";
import { ShortenRequest, ShortenResponse, Url } from "../schemas";
import { yieldFlush } from "effect/Micro";
import { UnauthorizedRequestError } from "../errors";

// Handler 1: Shorten URL
export const shortenHandler = async (c: Context) => {
  const program = Effect.gen(function* () {
    const service = yield* UrlService;

    // parse request
    const body = yield* Effect.promise(() => c.req.json());
    const { url, userIdFk } = yield* Schema.decodeUnknown(ShortenRequest)(body);

    // TODO: check if the userId is the same as that of the present in the token
    // if not then return error
    const userIdFromToken = c.get("userId") as string;

    if (userIdFromToken !== "" && userIdFromToken !== userIdFk) {
      return yield* new UnauthorizedRequestError({
        message: "user not authorized",
      });
    }

    // call service
    const code = yield* service.shortenUrl(url, userIdFk);

    // return response
    return yield* Schema.encode(ShortenResponse)({
      ok: true,
      message: `generated the shortened url: ${code}`,
    });
  });

  const layer = Layer.provide(UrlServiceLive, UrlRepositoryLive);

  const result = await Effect.runPromise(
    Effect.provide(program, layer).pipe(
      // adding the status code to the response type
      Effect.map((response) => ({ ...response, statusCode: 200 })),

      Effect.catchTag("UrlAlreadyExistsError", (error) =>
        Effect.succeed({
          ok: false,
          message: error.message,
          statusCode: 400,
        }),
      ),
      Effect.catchTag("UrlValidationError", (error) =>
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

      Effect.catchTag("UnauthorizedRequestError", (error) =>
        Effect.succeed({
          ok: false,
          message: error.message,
          statusCode: 401,
        }),
      ),
    ),
  );

  return c.json(
    { ok: result.ok, message: result.message },
    result.statusCode as 200 | 400 | 401 | 500,
  );
};

// Handler 2: Redirect
export const redirectHandler = async (c: Context) => {
  const code = c.req.param("code");

  const program = Effect.gen(function* () {
    const service = yield* UrlService;
    const urlRecord = yield* service.resolveUrl(code);
    return { redirect: urlRecord.url };
  });

  const layer = Layer.provide(UrlServiceLive, UrlRepositoryLive);

  const result = await Effect.runPromise(
    Effect.provide(program, layer).pipe(
      // adding the status code to the response type
      Effect.map((response) => ({ ...response, statusCode: 200 })),

      Effect.catchTag("DatabaseError", (error) =>
        Effect.succeed({
          ok: false,
          message: error.message,
          statusCode: 500,
        }),
      ),

      Effect.catchTag("UrlDoesntExistsError", (error) =>
        Effect.succeed({
          ok: false,
          message: error.message,
          statusCode: 404,
        }),
      ),
    ),
  );

  // if there is no error then redirect
  if (result && "redirect" in result) {
    return c.redirect(result.redirect);
  }

  return c.json(
    { ok: result.ok, message: result.message },
    result.statusCode as 200 | 404 | 500,
  );
};

// Handler 3: Info
export const infoHandler = async (c: Context) => {
  const code = c.req.param("code");

  const program = Effect.gen(function* () {
    const service = yield* UrlService;
    const urlRecord = yield* service.getUrlInfo(code);
    return yield* Schema.encode(Url)({
      id: urlRecord.id,
      url: urlRecord.url,
      code: urlRecord.code,
      userIdFk: urlRecord.userIdFk,
      createdAt: new Date(urlRecord.createdAt).toISOString(),
    });
  });

  const layer = Layer.provide(UrlServiceLive, UrlRepositoryLive);

  const result = await Effect.runPromise(
    Effect.provide(program, layer).pipe(
      Effect.map((response) => ({ ...response, statusCode: 200 })),

      Effect.catchTag("DatabaseError", (error) =>
        Effect.succeed({
          ok: false,
          message: error.message,
          statusCode: 500,
        }),
      ),
      Effect.catchTag("UrlDoesntExistsError", (error) =>
        Effect.succeed({
          ok: false,
          message: error.message,
          statusCode: 404,
        }),
      ),
    ),
  );

  // destructure the statusCode and body
  const { statusCode, ...body } = result;

  return c.json(body, statusCode as 200 | 404 | 500);
};
