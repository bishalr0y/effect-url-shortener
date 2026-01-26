import { Context, Next } from "hono";
import jwt from "jsonwebtoken";

export const authMiddleware = async (c: Context, next: Next) => {
  const token = c.req.header("Authorization")?.split("Bearer ")[1];
  if (!token) {
    return c.json({ error: "No token provided" }, 401);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    c.set("userId", decoded.data.id);
    c.set("userEmail", decoded.data.email);
    await next();
  } catch (error) {
    return c.json({ error: "Invalid token" }, 401);
  }
};
