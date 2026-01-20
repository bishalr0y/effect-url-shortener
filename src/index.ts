import { Hono } from "hono";
import { logger } from "hono/logger";

import {
  shortenHandler,
  redirectHandler,
  infoHandler,
} from "./controllers/url-controllers";
import { signupHandler } from "./controllers/user-controllers";

const app = new Hono();
app.use(logger());

app.post("/shorten", shortenHandler);
app.get("/:code", redirectHandler);
app.get("/:code/info", infoHandler);

app.post("/signup", signupHandler);

export default app;
