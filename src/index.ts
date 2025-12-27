import { Hono } from "hono";
import {
  shortenHandler,
  redirectHandler,
  infoHandler,
} from "./controllers/url-controllers";

const app = new Hono();

app.post("/shorten", shortenHandler);
app.get("/:code", redirectHandler);
app.get("/:code/info", infoHandler);

export default app;
