#!/usr/bin/env node
// Entry point for `npx -y github:Billiecavallaro/AI-Design`.
// Runs the TypeScript server directly, so there's no build step to keep in sync.
import { register } from "tsx/esm/api";

register();
await import("../src/stdio.ts");
