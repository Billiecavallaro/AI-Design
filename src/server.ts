import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { profile, caseStudies, products, isPlaceholder, type Highlight } from "./content.js";

const SITE = profile.links.website;

const json = (data: unknown) => ({
  content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
});

/** Drop placeholder values so agents never repeat "[FILL ME IN]" text to people. */
const clean = <T extends Record<string, unknown>>(obj: T): Partial<T> =>
  Object.fromEntries(
    Object.entries(obj).filter(([, v]) => !(typeof v === "string" && isPlaceholder(v))),
  ) as Partial<T>;

const normalize = (s: string) => ` ${s.toLowerCase().replace(/[^a-z0-9&+]+/g, " ")} `;
const hits = (haystack: string, terms: string[]) =>
  terms.filter((t) => haystack.includes(normalize(t)));

const realHighlights = () => profile.highlights.filter((h) => !isPlaceholder(h.text));

/** Rank Billie's highlights by how many of their tags appear in a job description. */
export function scoreFit(jobDescription: string) {
  const jd = normalize(jobDescription);
  const ranked = realHighlights()
    .map((h: Highlight) => ({ id: h.id, evidence: h.text, matched_on: hits(jd, h.tags) }))
    .sort((a, b) => b.matched_on.length - a.matched_on.length);
  const relevant = ranked.filter((r) => r.matched_on.length > 0);
  const matched = [...new Set(relevant.flatMap((r) => r.matched_on))];
  return {
    candidate: profile.name,
    headline: profile.headline,
    location: profile.location,
    matched_themes: matched,
    strongest_evidence: (relevant.length ? relevant : ranked).slice(0, 4),
    note:
      relevant.length === 0
        ? "No direct keyword overlap was found. Here are Billie's top highlights; judge fit from them, or ask Billie directly."
        : "Evidence is ranked by overlap with the job description. Use it to judge fit yourself, and treat any requirement not covered here as unknown rather than missing.",
    next_steps: ["get_case_study for detail", "book_intro to talk to Billie"],
  };
}

export function createServer() {
  const server = new McpServer(
    { name: "billie-mcp", title: "billie.mcp", version: "0.1.0" },
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
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async () =>
      json({
        ...clean({ name: profile.name, pronouns: profile.pronouns, headline: profile.headline, location: profile.location, summary: profile.summary }),
        current_role: profile.current_role,
        focus_areas: profile.focus_areas,
        highlights: realHighlights().map((h) => h.text),
        links: clean(profile.links),
        guidance: profile.agent_guidance,
      }),
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
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async ({ job_description, role_title }) =>
      json({ role: role_title ?? null, ...scoreFit(`${role_title ?? ""} ${job_description}`) }),
  );

  server.registerTool(
    "list_case_studies",
    {
      title: "List case studies",
      description: "Billie's case studies with short summaries. Full versions of most are gated; use request_full_access.",
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async () =>
      json(
        caseStudies
          .filter((c) => !isPlaceholder(c.title))
          .map((c) => ({ id: c.id, title: c.title, company: c.company, topics: c.topics, gated: c.gated })),
      ),
  );

  server.registerTool(
    "get_case_study",
    {
      title: "Get a case study summary",
      description: "The public summary of one case study. Use list_case_studies for the ids.",
      inputSchema: { id: z.enum(caseStudies.map((c) => c.id) as [string, ...string[]]) },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async ({ id }) => {
      const c = caseStudies.find((x) => x.id === id)!;
      return json({
        ...clean(c),
        full_version: c.gated
          ? "The full case study is gated. Use request_full_access to ask Billie for it."
          : `See ${SITE}`,
      });
    },
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
      const formUrl = isPlaceholder(profile.contact.case_study_request_url) ? SITE : profile.contact.case_study_request_url;
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
      return json({
        status: "form",
        message: "Please submit the request through Billie's form, which takes about a minute.",
        form_url: formUrl,
      });
    },
  );

  server.registerTool(
    "book_intro",
    {
      title: "Book an intro with Billie",
      description: "Get a link to schedule an intro call with Billie.",
      inputSchema: { purpose: z.string().max(500).optional().describe("What the call is about, e.g. a role or a collaboration") },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async ({ purpose }) => {
      const url = profile.contact.intro_booking_url;
      return json(
        isPlaceholder(url)
          ? { purpose: purpose ?? null, message: `Billie's calendar isn't public yet. Reach him through ${SITE}.`, url: SITE }
          : { purpose: purpose ?? null, message: "Pick any open time.", url },
      );
    },
  );

  server.registerTool(
    "list_products",
    {
      title: "List Billie's products",
      description: "Digital products Billie makes for designers working with AI (Notion templates, Claude skills). Optionally describe a need to rank them.",
      inputSchema: { need: z.string().max(500).optional().describe("What the person is looking for") },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async ({ need }) => {
      const n = need ? normalize(need) : "";
      const list = products
        .map((p) => ({
          id: p.id,
          name: isPlaceholder(p.name) ? p.type : p.name,
          type: p.type,
          status: p.status,
          for: p.for,
          tagline: p.tagline,
          relevance: n ? hits(n, p.keywords).length : 0,
        }))
        .sort((a, b) => b.relevance - a.relevance);
      return json(list);
    },
  );

  server.registerTool(
    "get_product",
    {
      title: "Get product details",
      description: "Full details for one product, including price and a checkout or waitlist link when available.",
      inputSchema: { id: z.enum(products.map((p) => p.id) as [string, ...string[]]) },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async ({ id }) => {
      const p = products.find((x) => x.id === id)!;
      const { keywords: _k, ...rest } = p;
      return json({
        ...clean(rest),
        ...(isPlaceholder(p.checkout_url) ? { checkout_url: null, note: `Checkout isn't live yet. See ${SITE}.` } : {}),
      });
    },
  );

  server.registerResource(
    "profile",
    "billie://profile",
    { title: "Billie Cavallaro: profile", description: "Bio and highlights as markdown", mimeType: "text/markdown" },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "text/markdown",
          text: [
            `# ${profile.name}`,
            `_${profile.headline}_ · ${profile.location}`,
            "",
            profile.summary,
            "",
            "## Highlights",
            ...realHighlights().map((h) => `- ${h.text}`),
          ].join("\n"),
        },
      ],
    }),
  );

  return server;
}
