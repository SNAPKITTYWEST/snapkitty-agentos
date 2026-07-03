import { existsSync } from "node:fs";
import { readJson, isMain } from "./core.mjs";
import { loadSkill } from "./skillLoader.mjs";

export async function verifySkills() {
  const registry = readJson(".agentos/skills/registry.json", { skills: [] });
  const results = [];
  for (const record of registry.skills) {
    const manifestPath = `.agentos/skills/artifacts/${record.id}/manifest.json`;
    const proofPath = `.agentos/skills/artifacts/${record.id}/proof_example.json`;
    if (!existsSync(manifestPath) || !existsSync(proofPath)) {
      results.push({ id: record.id, ok: false, reason: "missing manifest or proof example" });
      continue;
    }
    const skill = await loadSkill(record.id);
    const example = readJson(proofPath);
    const output = skill.execute(example.input);
    results.push({
      id: record.id,
      ok: skill.verify(example.input, output, output.proof),
      provides: record.provides
    });
  }
  return results;
}

if (isMain(import.meta.url)) {
  const results = await verifySkills();
  console.log(JSON.stringify({ ok: results.every((r) => r.ok), results }, null, 2));
  if (!results.every((r) => r.ok)) process.exit(1);
}
