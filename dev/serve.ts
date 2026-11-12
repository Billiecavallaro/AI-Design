// Local dev server: serves /public and the MCP endpoint at /mcp, like Vercel does.
// Run: npm run dev  →  http://localhost:3000
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { join, extname, normalize } from "node:path";
import handler from "../api/mcp.js";

const PORT = Number(process.env.PORT ?? 3000);
const types: Record<string, string> = { ".html": "text/html", ".txt": "text/plain", ".svg": "image/svg+xml", ".png": "image/png", ".json": "application/json", ".css": "text/css", ".js": "text/javascript" };

createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://${req.headers.host}`);
  if (url.pathname === "/mcp" || url.pathname === "/api/mcp") {
    let raw = "";
    for await (const chunk of req) raw += chunk;
    const body = raw ? JSON.parse(raw) : undefined;
    return handler(Object.assign(req, { body }), res);
  }
  const path = normalize(url.pathname === "/" ? "/index.html" : url.pathname).replace(/^(\.\.[/\\])+/, "");
  try {
    const data = await readFile(join(process.cwd(), "public", path));
    res.writeHead(200, { "content-type": types[extname(path)] ?? "application/octet-stream" });
    res.end(data);
  } catch {
    res.writeHead(404).end("Not found");
  }
}).listen(PORT, () => console.log(`billie.mcp running at http://localhost:${PORT}  (MCP endpoint: /mcp)`));
