# billie.mcp

I turned myself into an MCP server.

**billie.mcp** is a [Model Context Protocol](https://modelcontextprotocol.io) server that lets any AI agent learn about my work, check my fit for a role, request my case studies, book an intro, or find my digital products for designers. It ships with a garage-studio homepage where visitors can explore how it works and try the tools live.

## What's in here

```
content/            ← your words. Edit these, not the code.
  profile.json        bio, highlights, links, contact
  case-studies.json   public summaries of each case study
  products.json       Vibe Lab, skills bundle, prices, checkout links
src/server.ts       the MCP server: tools and resources
api/mcp.ts          optional hosted endpoint (served at /mcp)
public/             the homepage (index.html, app.js, llms.txt)
src/tools.js        tool logic shared by the server and the homepage demo
bin/billie-mcp.js   the installable version (npx)
dev/serve.ts        local preview server
scripts/smoke.ts    end-to-end test that calls every tool like an agent would
```

### Tools agents can use

| Tool | What it does |
| --- | --- |
| `get_profile` | Bio, current role, focus areas, highlights, links |
| `get_fit_for_role` | Takes a job description, returns the matching evidence from my work, ranked |
| `list_case_studies` / `get_case_study` | Case-study summaries (full versions stay gated) |
| `request_full_access` | Sends a case-study access request, or returns the request form |
| `book_intro` | Returns my booking link |
| `list_products` / `get_product` | My products for designers, with checkout links |

Plus one resource, `billie://profile`, a markdown version of my profile.

## Before going live: fill in the placeholders

Anything in `[BRACKETS]` in `content/` is a placeholder. The server hides placeholders from agents automatically, so nothing breaks, but these make it much better:

- [ ] `profile.json`: **calendar booking link**, **case-study request form URL**, stealth-startup one-liner
- [ ] `case-studies.json`: `public_details` for each case study, and the stealth-startup title and summary
- [ ] `products.json`: Vibe Lab **price and Lemon Squeezy link**, skills bundle name, contents, price and waitlist link
- [ ] Read every line of `content/` and make sure you're comfortable with it being public, especially anything about Capital One

## Run it locally

Needs Node 20 or newer.

```bash
npm install
npm run dev              # http://localhost:3000 (page + an HTTP MCP endpoint at /mcp)
npm test                 # in a second terminal: calls every tool over HTTP
MCP_STDIO=1 npm test     # tests the installable version
```

## How it's deployed

**The homepage is on GitHub Pages.** Every push to `main` rebuilds it (`.github/workflows/pages.yml`). The "Try it live" demo runs the exact same tool code (`src/tools.js`) in the visitor's browser, so it works with no server.

One-time setup: repo **Settings → Pages → Source: GitHub Actions**.

**The server installs straight from GitHub.** No hosting needed. People add it with:

- **Claude Code:** `claude mcp add billie -- npx -y github:Billiecavallaro/AI-Design`
- **Claude Desktop:** add this to `claude_desktop_config.json`:
  ```json
  { "mcpServers": { "billie": { "command": "npx", "args": ["-y", "github:Billiecavallaro/AI-Design"] } } }
  ```

The first launch takes a little longer while npx downloads it.

### Later: a hosted URL (optional)

A hosted URL lets anyone connect without Node, including Claude on the web. The code is ready (`api/mcp.ts`, `vercel.json`):

1. Import this repo at [vercel.com/new](https://vercel.com/new) and deploy with the defaults (free).
2. Your server is at `https://<project>.vercel.app/mcp`. Check it with `MCP_URL=https://<project>.vercel.app/mcp npm test`.
3. Put that URL in the `mcp-endpoint` meta tag in `public/index.html`. The demo then calls the live server, and the Connect section shows the URL.
4. Optional: set `ACCESS_REQUEST_WEBHOOK_URL` in Vercel (Zapier, Make or Formspree) so `request_full_access` sends requests straight to you.

## Get found

See **[PUBLISHING.md](PUBLISHING.md)** for step-by-step listing: npm, the official MCP Registry, and the community directories.

- Link the homepage from billiecavallaro.com as a featured project (done).
- `public/llms.txt` gives AI crawlers a plain-text summary of you and the server.

## Updating

Edit a file in `content/`, commit, and push. The homepage redeploys automatically, and installed copies get it the next time npx fetches the latest version (a hosted URL updates immediately).
