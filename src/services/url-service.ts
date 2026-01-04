import { Context, Layer, Effect } from "effect";
import { UrlRepository, Url } from "../repositories/url-repository";
import {
  DatabaseError,
  UrlAlreadyExistsError,
  UrlValidationError,
} from "../errors";
import { randomBytes } from "crypto";

// Step 1: Define Service Tag
export class UrlService extends Context.Tag("app/UrlService")<
  UrlService,
  {
    shortenUrl: (
      url: string,
    ) => Effect.Effect<
      string,
      DatabaseError | UrlAlreadyExistsError | UrlValidationError
    >;
    resolveUrl: (code: string) => Effect.Effect<Url | null, DatabaseError>;
    getUrlInfo: (code: string) => Effect.Effect<Url | null, DatabaseError>;
  }
>() {}

// Helper function to generate short code
const generateCode = () => randomBytes(2).toString("hex").toLowerCase();

// Helper validate URL
const validateUrl = (
  url: string,
): Effect.Effect<string, UrlValidationError> => {
  try {
    new URL(url);
    return Effect.succeed(url);
  } catch {
    return new UrlValidationError({ message: "Invalid URL" });
  }
};

// Step 2: Live implementation
const makeLive = Effect.gen(function* () {
  const repo = yield* UrlRepository;

  return UrlService.of({
    shortenUrl: (url: string) =>
      Effect.gen(function* () {
        // validate url
        yield* validateUrl(url);

        // generate the unique code
        let code: string;
        let attempts = 0;
        let maxAttempts = 10;

        do {
          code = generateCode();
          const existing = yield* repo.findByCode(code);

          if (!existing) break;
          attempts++;
        } while (attempts < maxAttempts);

        if (attempts >= maxAttempts) {
          return yield* new DatabaseError({
            message: "Failed to generate unique code",
          });
        }

        // create url record (add it to the db)
        yield* repo.create(url, code);
        return code;
      }),

    resolveUrl: (code: string) => repo.findByCode(code),

    getUrlInfo: (code: string) => repo.findByCode(code),
  });
});

export const UrlServiceLive = Layer.effect(UrlService, makeLive);
