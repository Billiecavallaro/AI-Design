// End-to-end check: connects to the MCP endpoint like a real agent would and calls every tool.
// Run `npm run dev` in one terminal, then `npm test` (or set MCP_URL to test a deployed server).
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const url = new URL(process.env.MCP_URL ?? "http://localhost:3000/mcp");
const client = new Client({ name: "smoke-test", version: "1.0.0" });
await client.connect(new StreamableHTTPClientTransport(url));

const text = (r: any) => r.content?.[0]?.text ?? "";
let failures = 0;
const check = (label: string, ok: boolean) => {
  console.log(`${ok ? "✓" : "✗"} ${label}`);
  if (!ok) failures++;
};

const { tools } = await client.listTools();
check(`lists 8 tools (${tools.map((t) => t.name).join(", ")})`, tools.length === 8);

const calls: [string, Record<string, unknown>, (out: string) => boolean][] = [
  ["get_profile", {}, (o) => o.includes("Billie Cavallaro") && !o.includes("[YOUR")],
  ["get_fit_for_role", { role_title: "Head of AI Design", job_description: "Lead design for agentic AI products in financial services. Design systems experience a plus." }, (o) => o.includes("fuse-assist") && o.includes("agentic")],
  ["list_case_studies", {}, (o) => o.includes("fuse-assist") && !o.includes("STEALTH STARTUP CASE")],
  ["get_case_study", { id: "fuse-assist" }, (o) => o.includes("gated") && !o.includes("[2–4")],
  ["request_full_access", { requester_name: "Test", company: "Acme" }, (o) => o.includes("form_url") || o.includes("sent")],
  ["book_intro", { purpose: "test" }, (o) => o.includes("url")],
  ["list_products", { need: "notion template for vibe coding" }, (o) => o.indexOf("vibe-lab") < o.indexOf("skills-bundle")],
  ["get_product", { id: "vibe-lab" }, (o) => o.includes("Vibe Lab") && !o.includes("[LEMON")],
];
for (const [name, args, ok] of calls) {
  const r = await client.callTool({ name, arguments: args });
  check(`${name}`, !r.isError && ok(text(r)));
}

const res = await client.readResource({ uri: "billie://profile" });
check("reads billie://profile resource", String((res.contents[0] as any).text).startsWith("# Billie"));

await client.close();
console.log(failures ? `\n${failures} check(s) failed` : "\nAll checks passed");
process.exit(failures ? 1 : 0);
