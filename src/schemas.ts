import { Schema } from "effect";

export const Url = Schema.Struct({
  id: Schema.String,
  url: Schema.String,
  code: Schema.String,
  createdAt: Schema.String,
});

export const ShortenRequest = Schema.Struct({
  url: Schema.String,
});

export const ShortenResponse = Schema.Struct({
  ok: Schema.Boolean,
  message: Schema.String,
});
