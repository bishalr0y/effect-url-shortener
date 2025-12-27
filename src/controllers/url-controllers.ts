import { Hono, Context } from "hono";
import { Effect, Schema, Layer } from "effect";
import { UrlService, UrlServiceLive } from "../services/url-service";
import { UrlRepositoryLive } from "../repositories/url-repository";
import { ShortenRequest, ShortenResponse } from "../schemas";
import { DatabaseError } from "../errors";

// Helper: Convert Effect to Hono handler
// E -> Error type, A -> Success type, R -> Requirements
const effectToHandler = <E, A, R>(
  effect: Effect.Effect<A, E, R>,
  layer: Layer.Layer<any, never>,
) => {
  return async (c: Context) => {
    const result = await Effect.runPromise(
      Effect.provide(effect, layer).pipe(
        Effect.catchAll((error) =>
          Effect.succeed(
            Schema.encode(ShortenResponse)({
              ok: false,
              message: `Error: ${String(error)}`,
            }),
          ),
        ),
      ),
    );
    return c.json(result);
  };
};

// Handler 1: Shorten URL
export const shortenHandler = async (c: Context) => {
  const program = Effect.gen(function* () {
    const service = yield* UrlService;

    // parse request
    const body = yield* Effect.promise(() => c.req.json());
    const { url } = yield* Schema.decodeUnknown(ShortenRequest)(body);

    // call service
    const code = yield* service.shortenUrl(url);

    // return response
    return yield* Schema.encode(ShortenResponse)({
      ok: true,
      message: `generated the shortened url: ${code}`,
    });
  });
  return effectToHandler(
    program,
    Layer.provide(UrlServiceLive, UrlRepositoryLive),
  )(c);
};

// Handler 2: Redirect
export const redirectHandler = async (c: Context) => {
  const code = c.req.param("code");

  const program = Effect.gen(function* () {
    const service = yield* UrlService;
    const urlRecord = yield* service.resolveUrl(code);

    if (!urlRecord) {
      return yield* Schema.encode(ShortenResponse)({
        ok: false,
        message: "URL not found",
      });
    }

    return { redirect: urlRecord.url };
  });

  return effectToHandler(
    program,
    Layer.provide(UrlServiceLive, UrlRepositoryLive),
  )(c);
};

// Handler 3: Info
export const infoHandler = (c: Context) => {
  const code = c.req.param("code");

  const program = Effect.gen(function* () {
    const service = yield* UrlService;
    const urlRecord = yield* service.getUrlInfo(code);

    if (!urlRecord) {
      return yield* Schema.encode(ShortenResponse)({
        ok: false,
        message: "URL not found",
      });
    }

    return yield* Schema.encode(ShortenResponse)({
      ok: true,
      message: `${urlRecord.code} -> ${urlRecord.url}`,
    });
  });

  return effectToHandler(
    program,
    Layer.provide(UrlServiceLive, UrlRepositoryLive),
  );
};
