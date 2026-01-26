import { Hono } from "hono";
import { logger } from "hono/logger";

import {
  shortenHandler,
  redirectHandler,
  infoHandler,
} from "./controllers/url-controllers";
import {
  getAllUsersHandler,
  getUserHandler,
  signInHandler,
  signupHandler,
} from "./controllers/user-controllers";
import { authMiddleware } from "./middleware/auth";

const app = new Hono();
app.use(logger());

app.post("url/shorten", authMiddleware, shortenHandler);
app.get("url/:code", redirectHandler);
app.get("url/:code/info", authMiddleware, infoHandler);

app.post("auth/signup", signupHandler);

app.post("auth/signin", signInHandler);

app.get("/users", authMiddleware, getAllUsersHandler);
app.get("/users/:id", authMiddleware, getUserHandler);

export default app;
