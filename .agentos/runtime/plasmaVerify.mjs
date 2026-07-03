import { existsSync } from "node:fs";
import { readJson, ok, fail, isMain } from "./core.mjs";

export function verifyPlasmaGate() {
  const config = readJson(".agentos/config.json");
  if (!config) return fail("missing .agentos/config.json");
  if (config.memoryProtocol !== "gitbucket-v2") return fail("unexpected memory protocol");
  if (!config.auditId) return fail("missing audit id");

  const hasPublicKey = existsSync(".agentos/plasma_gate/pubkey.pem");
  return ok("plasma gate verified", {
    publicKeyPresent: hasPublicKey,
    mode: hasPublicKey ? "ed25519-public-key" : "bootstrap-no-key"
  });
}

if (isMain(import.meta.url)) {
  const result = verifyPlasmaGate();
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exit(1);
}
