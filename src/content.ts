import { readFileSync } from "node:fs";
import { join } from "node:path";

// Content lives in /content as plain JSON so it's easy to edit without touching code.
const dir = join(process.cwd(), "content");
const load = <T>(file: string): T => JSON.parse(readFileSync(join(dir, file), "utf8")) as T;

export type Highlight = { id: string; text: string; tags: string[] };
export type Profile = {
  name: string;
  pronouns: string;
  headline: string;
  location: string;
  current_role: { title: string; company: string; since: string; focus: string };
  summary: string;
  focus_areas: string[];
  highlights: Highlight[];
  links: Record<string, string>;
  contact: { preferred: string; intro_booking_url: string; case_study_request_url: string };
  agent_guidance: string;
};
export type CaseStudy = {
  id: string;
  title: string;
  company: string;
  role: string;
  topics: string[];
  summary: string;
  public_details: string;
  gated: boolean;
};
export type Product = {
  id: string;
  name: string;
  type: string;
  status: string;
  for: string;
  tagline: string;
  description: string;
  keywords: string[];
  price: string;
  checkout_url: string;
};

export const profile = load<Profile>("profile.json");
export const caseStudies = load<CaseStudy[]>("case-studies.json");
export const products = load<Product[]>("products.json");

/** True when a value is still a "[FILL ME IN]" placeholder. */
export const isPlaceholder = (v: string | undefined) => !v || /^\[.*\]$/.test(v.trim());
