import { Hono } from "hono";

const app = new Hono();

app.get("/", (c) => {
  return c.json({
    ok: true,
    message: "Hello Hono!",
  });
});

// shortenHandler
app.post("/shorten", (c) => {
  return c.json({
    ok: true,
    message: "generate the shortened url",
  });
});

// redirectHandler
app.get("/:code", (c) => {
  const code = c.req.param("code");
  return c.json({
    ok: true,
    message: `redirect to ${code}`,
  });
});

// infoHandler
app.get("/:code/info", (c) => {
  const code = c.req.param("code");

  return c.json({
    ok: true,
    message: `get info handler ${code}`,
  });
});

export default app;
