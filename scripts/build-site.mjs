// Builds the static homepage into _site/ for GitHub Pages (or any static host).
// The page, plus the content and tool logic its in-browser demo needs.
import { cpSync, rmSync, mkdirSync } from "node:fs";

const out = "_site";
rmSync(out, { recursive: true, force: true });
mkdirSync(out);
cpSync("public", out, { recursive: true });
cpSync("content", `${out}/content`, { recursive: true });
cpSync("src/tools.js", `${out}/tools.js`);
console.log("Built static site in _site/");
