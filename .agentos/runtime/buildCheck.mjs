import { existsSync } from "node:fs";

const required = [
  "AGENTS.md",
  "README.md",
  ".agentos/config.json",
  ".agentos/skills/registry.json",
  ".agentos/pnp/problem_registry.json",
  ".agentos/runtime/core.mjs"
];

const missing = required.filter((path) => !existsSync(path));
if (missing.length) {
  console.error(`Build check failed. Missing: ${missing.join(", ")}`);
  process.exit(1);
}

console.log("snapkitty-agentos build surface OK");
