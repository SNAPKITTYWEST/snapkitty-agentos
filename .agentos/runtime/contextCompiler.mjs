import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname } from "node:path";
import { sign, createPrivateKey, createPublicKey } from "node:crypto";
import { readJson, sha256, stableStringify, writeJson, randomId, isMain } from "./core.mjs";

export const COMPILER_VERSION = "gitbucket_context_compiler_v2.1.0";
export const CONTEXT_CLIP_SCHEMA = "https://snapkitty.os/schema/context-clip-v1.json";

const DEFAULT_BUDGET = {
  max_tokens: 8192,
  allocated: {
    problem_spec: 1024,
    relevant_memories: 4096,
    skill_contracts: 1536,
    proof_scaffolding: 1024,
    runtime_directives: 535,
    reserved: 512
  }
};

export function estimateTokens(value) {
  const text = typeof value === "string" ? value : stableStringify(value);
  return Math.ceil(text.length / 4);
}

function clipId(agentId) {
  const stamp = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  return `clip_${stamp}_${agentId}_${randomId("ctx").slice(4)}`;
}

function makeSection(name, priority, content, sourceRefs = []) {
  return {
    name,
    priority,
    content,
    source_refs: sourceRefs,
    token_count: estimateTokens(content),
    verified: true
  };
}

function loadBuckets() {
  const manifest = readJson(".agentos/gitbucket/index/manifest.json", { buckets: [] });
  return manifest.buckets
    .map((id) => readJson(`.agentos/gitbucket/buckets/${id}.json`))
    .filter(Boolean);
}

function relevantMemories(problem, buckets, budgetTokens) {
  const scored = buckets.map((bucket) => {
    const haystack = stableStringify(bucket).toLowerCase();
    let score = 0;
    for (const term of [problem.id, problem.title, problem.difficulty].filter(Boolean)) {
      if (haystack.includes(String(term).toLowerCase())) score += 3;
    }
    for (const topic of bucket.topics || []) {
      if (["agent-native", "memory", "verification", "skill", "pnp"].includes(topic)) score += 1;
    }
    return { bucket, score };
  }).sort((a, b) => b.score - a.score || String(a.bucket.id).localeCompare(String(b.bucket.id)));

  const selected = [];
  let used = 0;
  for (const item of scored) {
    const cost = estimateTokens(item.bucket);
    if (used + cost > budgetTokens && selected.length > 0) continue;
    selected.push(item.bucket);
    used += cost;
    if (used >= budgetTokens) break;
  }
  return selected;
}

function skillContracts(skills) {
  return skills.map((skill) => ({
    skill_id: skill.id,
    verify_fn_hash: `sha256:${sha256(existsSync(skill.verifyFn) ? readFileSync(skill.verifyFn) : skill.verifyFn)}`,
    input_schema: skill.inputSchema || {},
    output_schema: skill.outputSchema || {},
    memory_ref: skill.memoryRef,
    provides: skill.provides || [],
    requires: skill.requires || []
  }));
}

function runtimeDirectives(policy = "pnp_solve") {
  return {
    policy,
    reasoning_mode: "verified_reasoning_summary",
    output_format: { witness: "...", proof: "..." },
    self_check: "run verifyFn before submit",
    max_iterations: 3,
    no_hidden_state: true,
    submit_only_p_time_verifiable_witnesses: true
  };
}

function proofScaffolding(problem) {
  return {
    verify_fn: problem.verifyFn,
    expected_witness_shape: {
      type: "object",
      required: ["witness", "proof"]
    },
    previous_best: problem.previousBest || null,
    constraints: ["deterministic", "borrow_checker_compliant", "p_time_verifiable"]
  };
}

function signClip(unsignedClip, config) {
  const payload = stableStringify(unsignedClip);
  const privatePath = ".agentos/plasma_gate/private_key.pem";
  const publicPath = ".agentos/plasma_gate/pubkey.pem";

  if (existsSync(privatePath) && existsSync(publicPath)) {
    const privateKey = createPrivateKey(readFileSync(privatePath));
    const publicKey = createPublicKey(readFileSync(publicPath));
    const signature = sign(null, Buffer.from(payload), privateKey).toString("base64");
    return {
      algorithm: "Ed25519",
      signature: `base64:${signature}`,
      signer: "plasma_gate_compiler",
      public_key: `base64:${publicKey.export({ type: "spki", format: "der" }).toString("base64")}`,
      audit_ref: config.auditId
    };
  }

  return {
    algorithm: "bootstrap-sha256",
    signature: `sha256:${sha256(payload)}`,
    signer: "plasma_gate_compiler",
    public_key: "bootstrap-no-key",
    audit_ref: config.auditId
  };
}

export function compileContextClip(input = {}) {
  const config = readJson(".agentos/config.json");
  const skills = readJson(".agentos/skills/registry.json", { skills: [] }).skills;
  const problems = readJson(".agentos/pnp/problem_registry.json", { problems: [] }).problems;
  const buckets = loadBuckets();
  const budget = input.budget || DEFAULT_BUDGET;
  const taskSpec = input.taskSpec || {
    type: "pnp_solve",
    problem_id: input.problemId || problems[0]?.id,
    claim_nonce: input.claimNonce || "unclaimed"
  };
  const problem = problems.find((item) => item.id === taskSpec.problem_id);
  if (!problem) throw new Error(`Problem ${taskSpec.problem_id} not found`);

  const memories = relevantMemories(problem, buckets, budget.allocated.relevant_memories);
  const requiredSkills = skillContracts(skills);
  const sections = [
    makeSection("problem_spec", "critical", problem, [problem.specHash]),
    makeSection("relevant_memories", "high", memories, memories.map((bucket) => bucket.id)),
    makeSection("skill_contracts", "critical", requiredSkills, requiredSkills.map((skill) => skill.memory_ref)),
    makeSection("proof_scaffolding", "critical", proofScaffolding(problem), [problem.specHash]),
    makeSection("runtime_directives", "medium", runtimeDirectives(input.policy || taskSpec.type), [])
  ];
  const actualTokens = sections.reduce((sum, section) => sum + section.token_count, 0);
  if (actualTokens > budget.max_tokens) {
    throw new Error(`Budget exceeded: ${actualTokens} > ${budget.max_tokens}`);
  }

  const unsignedClip = {
    $schema: CONTEXT_CLIP_SCHEMA,
    clip_id: input.clipId || clipId(input.agentId || "agent_local"),
    version: 1,
    issued_at: new Date().toISOString(),
    issued_by: COMPILER_VERSION,
    agent_id: input.agentId || "agent_local",
    task_spec: taskSpec,
    budget: {
      max_tokens: budget.max_tokens,
      allocated: budget.allocated,
      actual_tokens: actualTokens
    },
    sections,
    provenance: {
      gitbucket_index_hash: `sha256:${sha256(readJson(".agentos/gitbucket/index/manifest.json", {}))}`,
      compiler_version: COMPILER_VERSION,
      compilation_trace_id: randomId("trace")
    }
  };

  return {
    ...unsignedClip,
    seal: signClip(unsignedClip, config)
  };
}

function parseArgs(argv) {
  const out = {};
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--agent") out.agentId = argv[++i];
    else if (arg === "--problem") out.problemId = argv[++i];
    else if (arg === "--claim") out.claimNonce = argv[++i];
    else if (arg === "--policy") out.policy = argv[++i];
    else if (arg === "--out") out.out = argv[++i];
  }
  return out;
}

if (isMain(import.meta.url)) {
  const args = parseArgs(process.argv);
  const clip = compileContextClip(args);
  const out = args.out || `.agentos/context/clips/${clip.clip_id}.json`;
  mkdirSync(dirname(out), { recursive: true });
  writeJson(out, clip);
  console.log(JSON.stringify({ ok: true, clip_id: clip.clip_id, out, actual_tokens: clip.budget.actual_tokens, seal: clip.seal.algorithm }, null, 2));
}
