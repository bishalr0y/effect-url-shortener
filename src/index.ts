import { Hono, Context } from "hono";
import { randomBytes } from "crypto";
import { prisma } from "./lib/prisma";

const app = new Hono();

const generateCode = () => randomBytes(2).toString("hex").toLowerCase();

app.get("/", (c: Context) => {
  return c.json({
    ok: true,
    message: "Hello Hono!",
  });
});

// shortenHandler
app.post("/shorten", async (c: Context) => {
  const body = await c.req.json();
  const url = body.url;

  if (!url || typeof url !== "string") {
    console.log(url);
    return c.json({
      ok: false,
      message: "Error: URL is required and must be a string",
    });
  }

  try {
    const newRecord = await prisma.url.create({
      data: {
        url: url,
        code: generateCode(),
      },
    });

    return c.json({
      ok: true,
      message: `generated the shortened url:\n ${newRecord.code}`,
    });
  } catch (error) {
    return c.json({
      ok: false,
      message: `Error: ${error}`,
    });
  }
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
