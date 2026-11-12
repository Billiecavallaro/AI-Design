# Getting billie.mcp listed

These steps need your own accounts, so they run on your Mac. The easiest way is to open this repo in Claude Code and say: **"Follow PUBLISHING.md with me."** It can run every command; you just approve the logins in your browser.

Everything below is already set up in the repo (`package.json` has the `mcpName`, and `server.json` is ready).

## 1. Publish to npm (one time, about 5 minutes)

The official registry only lists servers whose code lives in a package registry like npm. This also gives you a shorter install command: `npx -y billie-mcp`.

1. Create a free account at [npmjs.com/signup](https://www.npmjs.com/signup) if you don't have one.
2. In this repo on your Mac:
   ```bash
   git pull
   npm install
   MCP_STDIO=1 npm test   # make sure everything passes
   npm login              # opens your browser
   npm publish            # publishes "billie-mcp"
   ```
3. Check it at [npmjs.com/package/billie-mcp](https://www.npmjs.com/package/billie-mcp).

## 2. Publish to the official MCP Registry

```bash
brew install mcp-publisher
mcp-publisher login github   # approve in your browser
mcp-publisher publish
```

You'll see `✓ Server io.github.Billiecavallaro/billie-mcp version 0.2.0`. If it complains about the name, run `mcp-publisher init` in a scratch folder to see the exact name your GitHub login allows, and update the name in both `server.json` and `package.json` (`mcpName`) to match.

## 3. Submit to the community directories

Each of these has its own submission flow (a form, a pull request, or a GitHub sign-in). Some pick servers up from GitHub or the official registry on their own, so check whether you're already listed first.

- **Glama:** [glama.ai/mcp/servers](https://glama.ai/mcp/servers)
- **PulseMCP:** [pulsemcp.com/servers](https://www.pulsemcp.com/servers)
- **mcp.so:** [mcp.so](https://mcp.so)
- **Smithery:** [smithery.ai](https://smithery.ai)
- **Awesome MCP Servers:** [mcpservers.org](https://mcpservers.org)

Copy-paste listing text:

> **billie.mcp**: Billie Cavallaro, a principal product designer focused on agentic AI and design systems, as an MCP server. Agents can read his profile, check his fit for a role from a job description, browse case studies and request full access, book an intro, and find his products for designers. Install: `npx -y billie-mcp`

Category: something like "Other", "Personal", or "Knowledge". There isn't a standard one.

## 4. On GitHub

On the repo's front page, click the gear next to **About** and add:
- **Description:** `billie.mcp: I turned myself into an MCP server`
- **Website:** `https://billiecavallaro.github.io/AI-Design/`
- **Topics:** `mcp`, `mcp-server`, `model-context-protocol`, `portfolio`

Topics help directories that crawl GitHub find it.

## When you change the server later

Bump `version` in `package.json` and in both places in `server.json`, then run `npm publish` and `mcp-publisher publish` again. Content-only edits for the homepage don't need this.
