import { Hono } from "hono";
import { logger } from "hono/logger";

import {
  shortenHandler,
  redirectHandler,
  infoHandler,
} from "./controllers/url-controllers";
import {
  getAllUsersHandler,
  signInHandler,
  signupHandler,
} from "./controllers/user-controllers";

const app = new Hono();
app.use(logger());

app.post("url/shorten", shortenHandler);
app.get("url/:code", redirectHandler);
app.get("url/:code/info", infoHandler);

app.post("auth/signup", signupHandler);

app.post("auth/signin", signInHandler);

// TODO: this is contradicting
app.get("/users", getAllUsersHandler);

export default app;
