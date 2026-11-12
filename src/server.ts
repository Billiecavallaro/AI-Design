import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { content } from "./content.js";
import { createTools } from "./tools.js";

const json = (data: unknown) => ({
  content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
});

export function createServer() {
  const { profile, caseStudies, products } = content;
  const tools = createTools(content);
  const readOnly = { readOnlyHint: true, openWorldHint: false };

  const server = new McpServer(
    { name: "billie-mcp", title: "billie.mcp", version: "0.2.0" },
    {
      instructions:
        "billie.mcp is Billie Cavallaro's personal MCP server. Billie is a principal product designer focused on agentic AI and design systems. " +
        "Use it to answer questions about his work, check his fit for a role, request his gated case studies, book an intro, or find his digital products for designers. " +
        profile.agent_guidance,
    },
  );

  server.registerTool(
    "get_profile",
    {
      title: "Get Billie's profile",
      description: "Billie's bio, current role, focus areas, career highlights and links. Start here for any question about who Billie is.",
      annotations: readOnly,
    },
    async () => json(tools.get_profile()),
  );

  server.registerTool(
    "get_fit_for_role",
    {
      title: "Check Billie's fit for a role",
      description:
        "Paste a job description (or a few lines about the role) and get the parts of Billie's experience that match it, ranked by relevance. Returns evidence, not a verdict: use it to judge fit.",
      inputSchema: {
        job_description: z.string().min(10).max(20000).describe("The job description or a summary of the role"),
        role_title: z.string().max(200).optional().describe("Optional role title, e.g. 'Head of AI Design'"),
      },
      annotations: readOnly,
    },
    async (args) => json(tools.get_fit_for_role(args)),
  );

  server.registerTool(
    "list_case_studies",
    {
      title: "List case studies",
      description: "Billie's case studies with short summaries. Full versions of most are gated; use request_full_access.",
      annotations: readOnly,
    },
    async () => json(tools.list_case_studies()),
  );

  server.registerTool(
    "get_case_study",
    {
      title: "Get a case study summary",
      description: "The public summary of one case study. Use list_case_studies for the ids.",
      inputSchema: { id: z.enum(caseStudies.map((c: { id: string }) => c.id) as [string, ...string[]]) },
      annotations: readOnly,
    },
    async (args) => json(tools.get_case_study(args)),
  );

  server.registerTool(
    "request_full_access",
    {
      title: "Request access to full case studies",
      description:
        "Ask Billie for access to his full, gated case studies. Only call this when the person you're helping wants access and has agreed to share their name and company with Billie.",
      inputSchema: {
        requester_name: z.string().min(1).max(200),
        company: z.string().min(1).max(200),
        email: z.string().email().optional().describe("Where Billie should reply"),
        case_study_id: z.string().max(100).optional(),
        note: z.string().max(2000).optional().describe("Role or reason for the request"),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    },
    async (args) => {
      const hook = process.env.ACCESS_REQUEST_WEBHOOK_URL;
      if (hook) {
        try {
          const r = await fetch(hook, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ type: "case_study_access", ...args, at: new Date().toISOString() }),
          });
          if (r.ok) return json({ status: "sent", message: "Request sent. Billie reviews these personally and replies directly." });
        } catch {
          /* fall through to the form */
        }
      }
      return json(tools.request_full_access());
    },
  );

  server.registerTool(
    "book_intro",
    {
      title: "Book an intro with Billie",
      description: "Get a link to schedule an intro call with Billie.",
      inputSchema: { purpose: z.string().max(500).optional().describe("What the call is about, e.g. a role or a collaboration") },
      annotations: readOnly,
    },
    async (args) => json(tools.book_intro(args)),
  );

  server.registerTool(
    "list_products",
    {
      title: "List Billie's products",
      description: "Digital products Billie makes for designers working with AI (Notion templates, Claude skills). Optionally describe a need to rank them.",
      inputSchema: { need: z.string().max(500).optional().describe("What the person is looking for") },
      annotations: readOnly,
    },
    async (args) => json(tools.list_products(args)),
  );

  server.registerTool(
    "get_product",
    {
      title: "Get product details",
      description: "Full details for one product, including price and a checkout or waitlist link when available.",
      inputSchema: { id: z.enum(products.map((p: { id: string }) => p.id) as [string, ...string[]]) },
      annotations: readOnly,
    },
    async (args) => json(tools.get_product(args)),
  );

  server.registerResource(
    "profile",
    "billie://profile",
    { title: "Billie Cavallaro: profile", description: "Bio and highlights as markdown", mimeType: "text/markdown" },
    async (uri) => ({ contents: [{ uri: uri.href, mimeType: "text/markdown", text: tools.profile_markdown() }] }),
  );

  return server;
}
