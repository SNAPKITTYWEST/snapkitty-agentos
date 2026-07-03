import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { appendJsonl, readJson, seal, writeJson, isMain } from "./core.mjs";

export async function verifyProblemSolution(problem, submission) {
  if (!existsSync(problem.verifyFn)) {
    return { ok: false, reason: `missing verifier ${problem.verifyFn}` };
  }
  const verifier = await import(`../../${problem.verifyFn}`);
  const witness = submission.witness || submission;
  const ok = Boolean(verifier.verify(problem, witness));
  return {
    ok,
    reason: ok ? "p_time_verifier_accept" : "p_time_verifier_reject",
    seal: seal("PNP_SOLUTION", { problemId: problem.id, witness })
  };
}

export async function verifyAllSolutions() {
  const registry = readJson(".agentos/pnp/problem_registry.json", { problems: [] });
  const results = [];
  for (const problem of registry.problems) {
    if (!existsSync(problem.verifyFn)) {
      results.push({ problemId: problem.id, ok: false, reason: "missing_verify_fn" });
      continue;
    }
    const dir = `.agentos/pnp/solution_pool/${problem.id}`;
    if (!existsSync(dir)) {
      results.push({ problemId: problem.id, ok: true, reason: "no_submissions" });
      continue;
    }
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isFile() || !entry.name.endsWith(".json")) continue;
      const submission = readJson(join(dir, entry.name));
      const result = await verifyProblemSolution(problem, submission);
      results.push({ problemId: problem.id, file: entry.name, ...result });
      if (result.ok) {
        appendJsonl(".agentos/pnp/verified_solutions.jsonl", {
          problemId: problem.id,
          file: entry.name,
          verifiedAt: new Date().toISOString(),
          seal: result.seal.seal
        });
      }
    }
  }
  return results;
}

if (isMain(import.meta.url)) {
  const results = await verifyAllSolutions();
  writeJson(".agentos/pnp/verification_report.json", { generatedAt: new Date().toISOString(), results });
  console.log(JSON.stringify({ ok: results.every((r) => r.ok), results }, null, 2));
  if (!results.every((r) => r.ok)) process.exit(1);
}
