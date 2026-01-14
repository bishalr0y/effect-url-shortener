import { Data } from "effect";

export class DatabaseError extends Data.TaggedError("DatabaseError")<{
  readonly message: string;
}> {}

export class UrlAlreadyExistsError extends Data.TaggedError(
  "UrlAlreadyExistsError",
)<{
  readonly message: string;
}> {}

export class UrlDoesntExistsError extends Data.TaggedError(
  "UrlDoesntExistsError",
)<{
  readonly message: string;
}> {}

export class UrlValidationError extends Data.TaggedError("UrlValidationError")<{
  readonly message: string;
}> {}

export class UserAlreadyExistsError extends Data.TaggedError(
  "UserAlreadyExistsError",
)<{
  readonly message: string;
}> {}

export class UserDoesntExistsError extends Data.TaggedError(
  "UserDoesntExistsError",
)<{
  readonly message: string;
}> {}
