import { Schema } from "effect";

export const Url = Schema.Struct({
  id: Schema.String,
  url: Schema.String,
  code: Schema.String,
  userIdFk: Schema.String,
  createdAt: Schema.String,
});

export const ShortenRequest = Schema.Struct({
  url: Schema.String,
  userIdFk: Schema.String,
});

export const ShortenResponse = Schema.Struct({
  ok: Schema.Boolean,
  message: Schema.String,
});

export const User = Schema.Struct({
  id: Schema.String,
  email: Schema.String,
  password: Schema.String,
  createdAt: Schema.String,
});

export const UserAuthRequest = Schema.Struct({
  email: Schema.String.pipe(Schema.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)),
  password: Schema.String.pipe(Schema.minLength(6)),
});

export const UserAuthResponse = Schema.Struct({
  ok: Schema.Boolean,
  token: Schema.String,
  message: Schema.String,
});
