import { existsSync, readFileSync } from "node:fs";
import { createPublicKey, verify } from "node:crypto";
import { readJson, sha256, stableStringify, isMain } from "./core.mjs";

const requiredSections = new Set([
  "problem_spec",
  "relevant_memories",
  "skill_contracts",
  "proof_scaffolding",
  "runtime_directives"
]);

export function unsignedClip(clip) {
  const { seal: _seal, ...unsigned } = clip;
  return unsigned;
}

export function verifyContextClip(clip) {
  if (clip.$schema !== "https://snapkitty.os/schema/context-clip-v1.json") return { ok: false, reason: "bad_schema" };
  if (clip.version !== 1) return { ok: false, reason: "bad_version" };
  if (!Array.isArray(clip.sections)) return { ok: false, reason: "sections_not_array" };
  for (const name of requiredSections) {
    if (!clip.sections.some((section) => section.name === name)) return { ok: false, reason: `missing_section:${name}` };
  }
  const actual = clip.sections.reduce((sum, section) => sum + Number(section.token_count || 0), 0);
  if (actual !== clip.budget.actual_tokens) return { ok: false, reason: "bad_token_total" };
  if (actual > clip.budget.max_tokens) return { ok: false, reason: "budget_exceeded" };
  if (!clip.sections.every((section) => section.verified === true)) return { ok: false, reason: "unverified_section" };

  const payload = stableStringify(unsignedClip(clip));
  if (clip.seal.algorithm === "bootstrap-sha256") {
    const expected = `sha256:${sha256(payload)}`;
    return clip.seal.signature === expected
      ? { ok: true, reason: "bootstrap_signature_verified" }
      : { ok: false, reason: "bad_bootstrap_signature" };
  }

  if (clip.seal.algorithm === "Ed25519") {
    try {
      const pub = Buffer.from(clip.seal.public_key.replace(/^base64:/, ""), "base64");
      const key = createPublicKey({ key: pub, type: "spki", format: "der" });
      const sig = Buffer.from(clip.seal.signature.replace(/^base64:/, ""), "base64");
      const ok = verify(null, Buffer.from(payload), key, sig);
      return ok ? { ok: true, reason: "ed25519_signature_verified" } : { ok: false, reason: "bad_ed25519_signature" };
    } catch (error) {
      return { ok: false, reason: `ed25519_error:${error.message}` };
    }
  }

  return { ok: false, reason: "unknown_signature_algorithm" };
}

if (isMain(import.meta.url)) {
  const path = process.argv[2];
  if (!path || !existsSync(path)) {
    console.error("usage: npm run context:verify -- <clip.json>");
    process.exit(1);
  }
  const result = verifyContextClip(JSON.parse(readFileSync(path, "utf8")));
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exit(1);
}
