import { Schema } from "effect";

export const Url = Schema.Struct({
  id: Schema.String,
  code: Schema.String,
  url: Schema.String,
  createdAt: Schema.Date,
});

export const GenerateShortenedUrlPayload = Schema.Struct({
  url: Schema.String,
});
