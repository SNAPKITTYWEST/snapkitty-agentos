import { readJson, writeJson } from "../runtime/core.mjs";

const founding = readJson(".agentos/pnp/founding_problems.json", []);
const registry = readJson(".agentos/pnp/problem_registry.json", { problems: [] });
const existing = new Set(registry.problems.map((problem) => problem.id));

for (const problem of founding) {
  if (existing.has(problem.id)) continue;
  registry.problems.push({
    ...problem,
    title: problem.id.replaceAll("_", " "),
    specHash: `sha256:${"0".repeat(64)}`,
    verifyFn: `.agentos/pnp/verifiers/${problem.id}.mjs`,
    status: "open",
    claimedBy: null,
    claimedAt: null,
    solvedBy: null,
    solvedAt: null,
    solutionRef: null
  });
}

writeJson(".agentos/pnp/problem_registry.json", registry);
console.log(JSON.stringify({ ok: true, problems: registry.problems.length }, null, 2));
