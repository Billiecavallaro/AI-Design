# billie.mcp

I turned myself into an MCP server.

**billie.mcp** is a [Model Context Protocol](https://modelcontextprotocol.io) server that lets any AI agent learn about my work, check my fit for a role, request my case studies, book an intro, or find my digital products for designers. It ships with a garage-studio homepage where visitors can explore how it works and try the server live.

## What's in here

```
content/            ← your words. Edit these, not the code.
  profile.json        bio, highlights, links, contact
  case-studies.json   public summaries of each case study
  products.json       Vibe Lab, skills bundle, prices, checkout links
src/server.ts       the MCP server: tools and resources
api/mcp.ts          the web endpoint (served at /mcp)
public/             the homepage (index.html, app.js, llms.txt)
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

- [ ] `profile.json`: LinkedIn URL, newsletter URL, **calendar booking link**, **case-study request form URL**, stealth-startup one-liner
- [ ] `case-studies.json`: `public_details` for each case study, and the stealth-startup title and summary
- [ ] `products.json`: Vibe Lab **price and Lemon Squeezy link**, skills bundle name, contents, price and waitlist link
- [ ] Read every line of `content/` and make sure you're comfortable with it being public, especially anything about Capital One

## Run it locally

Needs Node 20 or newer.

```bash
npm install
npm run dev      # http://localhost:3000, MCP endpoint at /mcp
npm test         # in a second terminal: calls every tool and checks the answers
```

## Deploy (free, about 5 minutes)

1. Go to [vercel.com/new](https://vercel.com/new), sign in with GitHub, and import this repo.
2. Leave every setting at its default and click **Deploy**. `vercel.json` already handles the rest.
3. Your homepage is live at `https://<project>.vercel.app` and the server is at `https://<project>.vercel.app/mcp`.
4. Optional: in Vercel → Settings → Domains, add something like `mcp.billiecavallaro.com`.

Check the live server with `MCP_URL=https://<your-domain>/mcp npm test`.

**Optional: get access requests sent to you.** Set an `ACCESS_REQUEST_WEBHOOK_URL` environment variable in Vercel (a Zapier, Make or Formspree webhook works). `request_full_access` will POST each request there. Without it, agents get your request form link instead.

## Connect an agent

- **Claude (web, desktop):** add a custom connector with your `/mcp` URL.
- **Claude Code:** `claude mcp add --transport http billie https://<your-domain>/mcp`
- **Anything else that speaks MCP:** point it at the same URL. It's a stateless Streamable HTTP endpoint.

## Get found

- Add the server to the public MCP directories, like the [official MCP Registry](https://github.com/modelcontextprotocol/registry), so agents and the people who use them can discover it.
- Link the homepage from billiecavallaro.com as a featured project.
- `public/llms.txt` gives AI crawlers a plain-text summary of you and the server.

## Updating

Edit a file in `content/`, commit, and push. Vercel redeploys automatically, and every agent sees the change on its next call.
