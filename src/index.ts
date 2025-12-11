import { Hono, Context } from "hono";
import { randomBytes } from "crypto";

const app = new Hono();

const generateCode = () => randomBytes(2).toString("hex").toUpperCase();

app.get("/", (c: Context) => {
  return c.json({
    ok: true,
    message: "Hello Hono!",
  });
});

// shortenHandler
app.post("/shorten", (c: Context) => {
  return c.json({
    ok: true,
    message: "generate the shortened url",
  });
});

// redirectHandler
app.get("/:code", (c: Context) => {
  const code = c.req.param("code");
  // return c.redirect("https://aiflux.tech");
  return c.json({
    ok: true,
    message: `redirect to ${code}`,
  });
});

// infoHandler
app.get("/:code/info", (c: Context) => {
  const code = c.req.param("code");

  return c.json({
    ok: true,
    message: `get info handler ${code}`,
  });
});

export default app;
