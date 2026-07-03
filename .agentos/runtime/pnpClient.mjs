import { readJson, writeJson, appendJsonl, randomId, isMain } from "./core.mjs";

export function claimFirstOpen(agentId = process.env.AGENT_ID || randomId("agent")) {
  const registry = readJson(".agentos/pnp/problem_registry.json", { problems: [] });
  const problem = registry.problems.find((item) => item.status === "open");
  if (!problem) return { ok: false, reason: "no_open_problems" };

  const now = new Date();
  const expires = new Date(now.getTime() + 240 * 60 * 1000);
  problem.status = "claimed";
  problem.claimedBy = agentId;
  problem.claimedAt = now.toISOString();

  const claim = {
    problemId: problem.id,
    agentId,
    nonce: randomId("nonce"),
    timestamp: now.toISOString(),
    expiresAt: expires.toISOString()
  };
  appendJsonl(".agentos/pnp/claim_ledger.jsonl", claim);
  writeJson(".agentos/pnp/problem_registry.json", registry);
  return { ok: true, claim };
}

if (isMain(import.meta.url) && process.argv[2] === "claim") {
  console.log(JSON.stringify(claimFirstOpen(process.argv[3]), null, 2));
}
