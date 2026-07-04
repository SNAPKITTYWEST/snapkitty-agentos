import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { sha256, stableStringify, seal } from "../.agentos/runtime/core.mjs";
import { verifyPlasmaGate } from "../.agentos/runtime/plasmaVerify.mjs";
import { verifySkills } from "../.agentos/runtime/skillVerify.mjs";
import { verifyProblemSolution } from "../.agentos/runtime/pnpVerifier.mjs";
import { loadSkill } from "../.agentos/runtime/skillLoader.mjs";
import { compileContextClip } from "../.agentos/runtime/contextCompiler.mjs";
import { verifyContextClip } from "../.agentos/runtime/contextVerifier.mjs";

test("stableStringify is deterministic across key order", () => {
  assert.equal(stableStringify({ b: 2, a: 1 }), stableStringify({ a: 1, b: 2 }));
});

test("sha256 produces 64 hex chars", () => {
  assert.match(sha256("snapkitty"), /^[0-9a-f]{64}$/);
});

test("seal chains payload hash into immutable entry", () => {
  const entry = seal("TEST", { hello: "world" });
  assert.equal(entry.kind, "TEST");
  assert.match(entry.payloadHash, /^[0-9a-f]{64}$/);
  assert.match(entry.seal, /^[0-9a-f]{64}$/);
});

test("plasma gate verifies bootstrap mode", () => {
  const result = verifyPlasmaGate();
  assert.equal(result.ok, true);
});

test("ledger skill executes and verifies balanced entry", async () => {
  const skill = await loadSkill("ledger_validation_v3");
  const input = { entry: { debit: 25, credit: 25 } };
  const output = skill.execute(input);
  assert.equal(output.valid, true);
  assert.equal(skill.verify(input, output), true);
});

test("borrow scheduler returns topological order", async () => {
  const skill = await loadSkill("borrow_chain_scheduler_v1");
  const input = { borrowGraph: { nodes: ["A", "B", "C"], edges: [["A", "B"], ["B", "C"]] } };
  const output = skill.execute(input);
  assert.deepEqual(output.schedule, ["A", "B", "C"]);
  assert.equal(skill.verify(input, output), true);
});

test("all skills verify from proof examples", async () => {
  const results = await verifySkills();
  assert.equal(results.every((result) => result.ok), true);
});

test("P/NP verifier accepts a valid borrow witness", async () => {
  const problem = {
    id: "optimal_borrow_schedule_2026_Q3",
    verifyFn: ".agentos/pnp/verifiers/optimal_borrow_schedule.mjs",
    borrowGraph: { nodes: ["A", "B", "C"], edges: [["A", "B"], ["B", "C"]] }
  };
  const result = await verifyProblemSolution(problem, { witness: { schedule: ["A", "B", "C"] } });
  assert.equal(result.ok, true);
});

test("ContextClip compiles with runtime directives and verifies seal", () => {
  const clip = compileContextClip({
    agentId: "agent_test",
    problemId: "optimal_borrow_schedule_2026_Q3",
    claimNonce: "nonce_test",
    clipId: "clip_test"
  });
  assert.equal(clip.clip_id, "clip_test");
  assert.equal(clip.$schema, "https://snapkitty.os/schema/context-clip-v1.json");
  assert.equal(clip.sections.some((section) => section.name === "runtime_directives"), true);
  assert.equal(clip.sections.every((section) => section.verified), true);
  assert.equal(verifyContextClip(clip).ok, true);
});

test("Nix Sovereign layout presence and Prolog BOM verification", () => {
  assert.equal(existsSync("flake.nix"), true);
  assert.equal(existsSync("policies/snapkitty_bom.pl"), true);
});
