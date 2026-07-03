import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { readJson, seal, sha256, writeJson } from "../runtime/core.mjs";

function git(command, fallback = "") {
  try {
    return execSync(`git ${command}`, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return fallback;
  }
}

const head = git("rev-parse HEAD", "workspace");
const summary = git("log -1 --pretty=%s", "workspace bootstrap");
const changed = git("diff-tree --no-commit-id --name-only -r HEAD", "")
  .split(/\r?\n/)
  .filter(Boolean);

const bucket = {
  schema: "memory-bucket-v2",
  id: `mem_${sha256(`${head}:${summary}`).slice(0, 12)}`,
  gitHash: head,
  type: summary.split(":")[0] || "workspace",
  summary,
  files: changed,
  entities: ["snapkitty-agentos", "gitbucket-v2"],
  topics: ["agent-native", "memory", "verification"],
  dependencies: [],
  extractedAt: new Date().toISOString()
};

const bucketSeal = seal("MEMORY_BUCKET", bucket);
writeJson(`.agentos/gitbucket/buckets/${bucket.id}.json`, bucket);
writeJson(`.agentos/gitbucket/seals/${bucket.id}.seal.json`, bucketSeal);

const manifest = readJson(".agentos/gitbucket/index/manifest.json", {
  schema: "gitbucket-v2",
  buckets: []
});
if (!manifest.buckets.includes(bucket.id)) manifest.buckets.push(bucket.id);
writeJson(".agentos/gitbucket/index/manifest.json", manifest);

console.log(JSON.stringify({ bucket: bucket.id, seal: bucketSeal.seal }, null, 2));
