import { readJsonl, appendJsonl, readJson } from "./core.mjs";

const config = readJson(".agentos/config.json", { universeSum: { difficultyWeights: {} } });
const verified = readJsonl(".agentos/pnp/verified_solutions.jsonl");
const registry = readJson(".agentos/pnp/problem_registry.json", { problems: [] });
const weights = config.universeSum?.difficultyWeights || {};

let universeSum = 0;
for (const item of verified) {
  const problem = registry.problems.find((p) => p.id === item.problemId);
  universeSum += weights[problem?.difficulty] || 1;
}

appendJsonl(".agentos/pnp/convergence_log.jsonl", {
  event: "convergence_tick",
  verifiedSolutions: verified.length,
  universeSum,
  timestamp: new Date().toISOString()
});

console.log(JSON.stringify({ ok: true, universeSum, verifiedSolutions: verified.length }, null, 2));
