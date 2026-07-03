import { readdirSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { readJson, seal, writeJson } from "./core.mjs";

export function assembleContext(spec = {}) {
  const bucketDir = ".agentos/gitbucket/buckets";
  const buckets = readdirSync(bucketDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => readJson(join(bucketDir, entry.name)))
    .filter(Boolean);

  const skills = readJson(".agentos/skills/registry.json", { skills: [] }).skills;
  const problems = readJson(".agentos/pnp/problem_registry.json", { problems: [] }).problems;
  const context = {
    schema: "agentos-context-v1",
    spec,
    generatedAt: new Date().toISOString(),
    buckets,
    skills,
    openProblems: problems.filter((problem) => problem.status === "open"),
    proof: seal("CONTEXT_BUNDLE", { buckets, skills, problems })
  };
  return context;
}

const context = assembleContext({ topic: process.argv[2] || "bootstrap" });
writeJson(".agentos/gitbucket/index/context.json", context);
mkdirSync(".agentos/memory", { recursive: true });
writeFileSync(
  ".agentos/memory/INDEX.md",
  `# Agent OS Memory Index\n\nGenerated: ${context.generatedAt}\n\n` +
    `Buckets: ${context.buckets.length}\n\nSkills: ${context.skills.length}\n\nOpen problems: ${context.openProblems.length}\n`
);

console.log(JSON.stringify({ ok: true, buckets: context.buckets.length, skills: context.skills.length, openProblems: context.openProblems.length }, null, 2));
