import { existsSync } from "node:fs";
import { readJson } from "./core.mjs";

export async function loadSkill(skillId) {
  const registry = readJson(".agentos/skills/registry.json", { skills: [] });
  const record = registry.skills.find((skill) => skill.id === skillId);
  if (!record) throw new Error(`Skill ${skillId} not found`);
  if (!existsSync(record.implementation)) throw new Error(`Missing implementation for ${skillId}`);
  if (!existsSync(record.verifyFn)) throw new Error(`Missing verifier for ${skillId}`);

  const impl = await import(`../../${record.implementation}`);
  const verifier = await import(`../../${record.verifyFn}`);
  return {
    id: skillId,
    record,
    execute: (input) => impl.run(input),
    verify: (input, output, proof = output?.proof) => verifier.verify(input, output, proof)
  };
}
