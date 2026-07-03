import { existsSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const repoRoot = resolve(".");
const targets = [
  "build",
  "build-agentos-check",
  "dist",
  "node_modules/.cache",
  ".agentos/gitbucket/buckets",
  ".agentos/gitbucket/seals",
  ".agentos/memory",
  ".agentos/plasma_gate/private_key.pem",
  ".agentos/runtime/auditLog.jsonl",
  ".agentos/pnp/claim_ledger.jsonl",
  ".agentos/pnp/convergence_log.jsonl",
  ".agentos/pnp/verified_solutions.jsonl",
  ".agentos/pnp/verification_report.json",
  ".agentos/pnp/solution_pool",
  ".agentos/memory/INDEX.md"
];

for (const target of targets) {
  const absolute = resolve(repoRoot, target);
  if (!absolute.startsWith(repoRoot)) {
    throw new Error(`Refusing to remove outside repo: ${absolute}`);
  }
  if (existsSync(absolute)) {
    rmSync(absolute, { recursive: true, force: true });
    console.log(`removed ${target}`);
  }
}
