import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

// Content lives in /content as plain JSON so it's easy to edit without touching code.
// Look next to this file first (works when installed with npx from any folder),
// then in the working directory (works on serverless hosts).
const candidates = [fileURLToPath(new URL("../content", import.meta.url)), join(process.cwd(), "content")];
const dir = candidates.find((d) => existsSync(join(d, "profile.json"))) ?? candidates[1];
const load = (file: string) => JSON.parse(readFileSync(join(dir, file), "utf8"));

export const content = {
  profile: load("profile.json"),
  caseStudies: load("case-studies.json"),
  products: load("products.json"),
};
