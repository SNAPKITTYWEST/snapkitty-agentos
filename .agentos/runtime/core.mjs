import { createHash, randomBytes } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync, existsSync, appendFileSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

export function sortKeys(value) {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, sortKeys(value[key])]));
}

export function stableStringify(value) {
  return JSON.stringify(sortKeys(value));
}

export function sha256(value) {
  const input = typeof value === "string" ? value : stableStringify(value);
  return createHash("sha256").update(input).digest("hex");
}

export function readJson(path, fallback = null) {
  if (!existsSync(path)) return fallback;
  return JSON.parse(readFileSync(path, "utf8"));
}

export function writeJson(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(sortKeys(value), null, 2)}\n`);
}

export function appendJsonl(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  appendFileSync(path, `${stableStringify(value)}\n`);
}

export function readJsonl(path) {
  if (!existsSync(path)) return [];
  return readFileSync(path, "utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

export function seal(kind, payload, previous = "0".repeat(64)) {
  const body = {
    kind,
    previous,
    payloadHash: sha256(payload),
    sealedAt: new Date().toISOString()
  };
  return { ...body, seal: sha256(body) };
}

export function assertHex64(value, label) {
  if (!/^[0-9a-f]{64}$/i.test(value || "")) {
    throw new Error(`${label} must be 64 hex chars`);
  }
}

export function randomId(prefix) {
  return `${prefix}_${randomBytes(8).toString("hex")}`;
}

export function ok(message, extra = {}) {
  return { ok: true, message, ...extra };
}

export function fail(message, extra = {}) {
  return { ok: false, message, ...extra };
}

export function isMain(importMetaUrl) {
  return process.argv[1] && fileURLToPath(importMetaUrl) === process.argv[1];
}
