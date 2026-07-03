import { generateKeyPairSync } from "node:crypto";
import { writeFileSync, mkdirSync } from "node:fs";

mkdirSync(".agentos/plasma_gate", { recursive: true });

const { publicKey, privateKey } = generateKeyPairSync("ed25519");
writeFileSync(".agentos/plasma_gate/pubkey.pem", publicKey.export({ type: "spki", format: "pem" }));
writeFileSync(".agentos/plasma_gate/private_key.pem", privateKey.export({ type: "pkcs8", format: "pem" }));

console.log("Plasma Gate Ed25519 keypair generated");
