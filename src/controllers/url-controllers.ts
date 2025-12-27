import { Context } from "hono";
import { Effect, Schema, Layer } from "effect";
import { UrlService, UrlServiceLive } from "../services/url-service";
import { UrlRepositoryLive } from "../repositories/url-repository";
import { ShortenRequest, ShortenResponse } from "../schemas";

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

  const layer = Layer.provide(UrlServiceLive, UrlRepositoryLive);

  const result = await Effect.runPromise(
    Effect.provide(program, layer).pipe(
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

  const layer = Layer.provide(UrlServiceLive, UrlRepositoryLive);

  const result = await Effect.runPromise(
    Effect.provide(program, layer).pipe(
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

  // if there is no error then redirect
  if (result && "redirect" in result) {
    return c.redirect(result.redirect);
  }

  return c.json(result);
};

// Handler 3: Info
export const infoHandler = async (c: Context) => {
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

  const layer = Layer.provide(UrlServiceLive, UrlRepositoryLive);

  const result = await Effect.runPromise(
    Effect.provide(program, layer).pipe(
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
