import { mkdirSync } from "node:fs";
import { writeJson } from "../runtime/core.mjs";

for (const dir of [
  ".agentos/gitbucket/buckets",
  ".agentos/gitbucket/seals",
  ".agentos/gitbucket/index",
  ".agentos/gitbucket/query"
]) {
  mkdirSync(dir, { recursive: true });
}

writeJson(".agentos/gitbucket/index/manifest.json", {
  schema: "gitbucket-v2",
  initializedAt: new Date().toISOString(),
  indexes: ["file", "entity", "agent", "topic", "time", "dependency", "problemId"],
  buckets: []
});

console.log("GitBucket v2 initialized");
