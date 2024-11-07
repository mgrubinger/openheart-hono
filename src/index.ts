import { Hono } from "hono";
import { html } from "hono/html";
import { cors } from "hono/cors";

type Bindings = {
  MY_NAME: string;
  openheartkv: KVNamespace;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use(
  "/*",
  cors({
    origin: "*",
  })
);

app.get("/", async (context) => {
  return context.html(html`
    <!DOCTYPE html>
    <h1>grooovingers open heart API</h1>
    <ul>
      <li>
        <code>POST</code> to <code>/path-of-your-website</code> with payload of
        a single emoji
      </li>
      <li>
        <code>GET</code> <code>/path-of-your-website</code> to get a list of all
        recorded emojis and their count
      </li>
    </ul>
    <form action="/list" method="GET">
      <label
        >Enter URL to receive a list of stored emojis for this URL
        <input type="text" name="url" />
      </label>
      <button type="submit">Submit</button>
    </form>
  `);
});

app.get("/list", async (context) => {
  const url = context.req.query("url");

  if (!url) {
    return context.text("No URL provided", 400);
  }

  const compiled = await getByUrl(url, context);
  return context.json(compiled);
});

app.get("/:site{.+}", async (context) => {
  let { site: sitename } = context.req.param();

  const compiled = await getByUrl(sitename, context);

  return context.json(compiled);
});

app.post("/:site{.+}", async (context) => {
  let emoji = await context.req.text();

  let parseResult = ensureEmoji(emoji);
  if (!parseResult) {
    return context.text("Invalid!", 400);
  }

  let { site: sitename } = context.req.param();

  let key: string = `${sitename}++${emoji}`;
  let siteCountS = (await context.env.openheartkv.get(key)) || "0";
  let siteCount = parseInt(siteCountS);
  siteCount++;
  await context.env.openheartkv.put(key, `${siteCount}`, {
    metadata: {
      count: siteCount,
    },
  });

  return context.json({
    ok: true,
    count: siteCount,
  });
});

function ensureEmoji(emoji: string) {
  const segments = Array.from(
    new Intl.Segmenter({ granularity: "grapheme" }).segment(emoji.trim())
  );
  const parsedEmoji = segments.length > 0 ? segments[0].segment : null;

  if (/\p{Emoji}/u.test(parsedEmoji)) return parsedEmoji;
}

async function getByUrl(sitename: string, context) {
  let prefix = `${sitename}++`;
  const list = await context.env.openheartkv.list({ prefix });
  let compiled = {};
  list.keys.forEach(
    (k) => (compiled[k.name.replace(prefix, "")] = k.metadata?.count)
  );
  return compiled;
}

export default app;
