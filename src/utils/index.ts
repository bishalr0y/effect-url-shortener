import bcrypt from "bcrypt";

const saltRounds = 10;

export const generateHash = (plainPassword: string): string => {
  const salt = bcrypt.genSaltSync(saltRounds);
  const hashedPassword = bcrypt.hashSync(plainPassword, salt);
  return hashedPassword;
};

export const validateHash = (
  plainPassword: string,
  hashedPassword: string,
): boolean => {
  return bcrypt.compareSync(plainPassword, hashedPassword);
};
