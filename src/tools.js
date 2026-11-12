// billie.mcp tool logic. Plain JavaScript with no dependencies, so the exact same code
// powers the MCP server (Node) and the "Try it live" demo on the homepage (browser).
// Every function takes the content from /content and returns a plain object.

/** True when a value is still a "[FILL ME IN]" placeholder. */
export const isPlaceholder = (v) => typeof v !== "string" || v.trim() === "" || /^\[.*\]$/.test(v.trim());

/** Drop placeholder strings so agents never repeat "[FILL ME IN]" text to people. */
const clean = (obj) =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => !(typeof v === "string" && isPlaceholder(v))));

const normalize = (s) => ` ${String(s).toLowerCase().replace(/[^a-z0-9&+]+/g, " ")} `;
const hits = (haystack, terms) => terms.filter((t) => haystack.includes(normalize(t)));

export function createTools({ profile, caseStudies, products }) {
  const SITE = profile.links.website;
  const realHighlights = () => profile.highlights.filter((h) => !isPlaceholder(h.text));
  const linkOr = (url) => (isPlaceholder(url) ? SITE : url);

  return {
    get_profile() {
      return {
        ...clean({
          name: profile.name,
          pronouns: profile.pronouns,
          headline: profile.headline,
          location: profile.location,
          summary: profile.summary,
        }),
        current_role: profile.current_role,
        focus_areas: profile.focus_areas,
        highlights: realHighlights().map((h) => h.text),
        links: clean(profile.links),
        guidance: profile.agent_guidance,
      };
    },

    get_fit_for_role({ job_description, role_title } = {}) {
      const jd = normalize(`${role_title ?? ""} ${job_description ?? ""}`);
      const ranked = realHighlights()
        .map((h) => ({ id: h.id, evidence: h.text, matched_on: hits(jd, h.tags) }))
        .sort((a, b) => b.matched_on.length - a.matched_on.length);
      const relevant = ranked.filter((r) => r.matched_on.length > 0);
      return {
        role: role_title ?? null,
        candidate: profile.name,
        headline: profile.headline,
        location: profile.location,
        matched_themes: [...new Set(relevant.flatMap((r) => r.matched_on))],
        strongest_evidence: (relevant.length ? relevant : ranked).slice(0, 4),
        note:
          relevant.length === 0
            ? "No direct keyword overlap was found. Here are Billie's top highlights; judge fit from them, or ask Billie directly."
            : "Evidence is ranked by overlap with the job description. Use it to judge fit yourself, and treat any requirement not covered here as unknown rather than missing.",
        next_steps: ["get_case_study for detail", "book_intro to talk to Billie"],
      };
    },

    list_case_studies() {
      return caseStudies
        .filter((c) => !isPlaceholder(c.title))
        .map((c) => ({ id: c.id, title: c.title, company: c.company, topics: c.topics, gated: c.gated }));
    },

    get_case_study({ id } = {}) {
      const c = caseStudies.find((x) => x.id === id);
      if (!c) return { error: `No case study with id "${id}". Use list_case_studies for the ids.` };
      return {
        ...clean(c),
        full_version: c.gated ? "The full case study is gated. Use request_full_access to ask Billie for it." : `See ${SITE}`,
      };
    },

    /** The form fallback. The Node server can send the request to a webhook first. */
    request_full_access() {
      return {
        status: "form",
        message: "Please submit the request through Billie's form, which takes about a minute.",
        form_url: linkOr(profile.contact.case_study_request_url),
      };
    },

    book_intro({ purpose } = {}) {
      const url = profile.contact.intro_booking_url;
      return isPlaceholder(url)
        ? { purpose: purpose ?? null, message: `Billie's calendar isn't public yet. Reach him through ${SITE}.`, url: SITE }
        : { purpose: purpose ?? null, message: "Pick any open time.", url };
    },

    list_products({ need } = {}) {
      const n = need ? normalize(need) : "";
      return products
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
    },

    get_product({ id } = {}) {
      const p = products.find((x) => x.id === id);
      if (!p) return { error: `No product with id "${id}". Use list_products for the ids.` };
      const { keywords, ...rest } = p;
      return {
        ...clean(rest),
        ...(isPlaceholder(p.checkout_url) ? { checkout_url: null, note: `Checkout isn't live yet. See ${SITE}.` } : {}),
      };
    },

    profile_markdown() {
      return [
        `# ${profile.name}`,
        `_${profile.headline}_ · ${profile.location}`,
        "",
        profile.summary,
        "",
        "## Highlights",
        ...realHighlights().map((h) => `- ${h.text}`),
      ].join("\n");
    },
  };
}
