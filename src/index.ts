import { Hono, Context } from "hono";
import { Effect, Schema } from "effect";
import { randomBytes } from "crypto";
import { prisma } from "./lib/prisma";
import { ShortenRequest, ShortenResponse } from "./schemas";
import { DatabaseError } from "./errors";

const app = new Hono();

const generateCode = () => randomBytes(2).toString("hex").toLowerCase();

const createShortenedUrl = (url: string) =>
  Effect.tryPromise({
    try: () => prisma.url.create({ data: { url: url, code: generateCode() } }),
    catch: (error) => new DatabaseError({ message: String(error) }),
  });

// shortenHandler
app.post("/shorten", async (c: Context) => {
  const program = Effect.gen(function* () {
    const body = yield* Effect.promise(() => c.req.json());
    const { url } = yield* Schema.decodeUnknown(ShortenRequest)(body);
    const record = yield* createShortenedUrl(url);
    return yield* Schema.encode(ShortenResponse)({
      ok: true,
      message: `generated the shortened url:\n ${record.code}`,
    });
  }).pipe(
    Effect.catchAll((error) =>
      Effect.succeed(
        Schema.encode(ShortenResponse)({
          ok: false,
          message: `Error: ${String(error)}`,
        }),
      ),
    ),
  );

  const result = await Effect.runPromise(program);
  return c.json(result);
});

// redirectHandler
app.get("/:code", (c: Context) => {
  const code = c.req.param("code");
  // return c.redirect("https://aiflux.tech");
  return c.json({
    ok: true,
    message: `redirect to ${code}`,
  });
});

// infoHandler
app.get("/:code/info", (c: Context) => {
  const code = c.req.param("code");

  return c.json({
    ok: true,
    message: `get info handler ${code}`,
  });
});

export default app;
