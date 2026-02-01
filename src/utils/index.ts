import bcrypt from "bcrypt";
import { Effect } from "effect";
import { HashGenerationError } from "../errors";

const saltRounds = 10;

export const generateHash = (plainPassword: string) =>
  Effect.try({
    try: () => {
      const salt = bcrypt.genSaltSync(saltRounds);
      return bcrypt.hashSync(plainPassword, salt);
    },
    catch: (error) => new HashGenerationError({ message: String(error) })
  });

export const validateHash = (
  plainPassword: string,
  hashedPassword: string,
) =>
  Effect.try({
    try: () => bcrypt.compareSync(plainPassword, hashedPassword),
    catch: (error) => new HashGenerationError({ message: String(error) })
  });
