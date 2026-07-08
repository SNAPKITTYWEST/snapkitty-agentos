// WORM Seal Verification Script
// Verifies integrity of sealed mathematical skills

import { createHash } from 'crypto';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const AGENTOS_ROOT = join(__dirname, '..', '.agentos');
const BUCKETS_DIR = join(AGENTOS_ROOT, 'gitbucket', 'buckets');
const SEALS_DIR = join(AGENTOS_ROOT, 'gitbucket', 'seals');
const MANIFEST_PATH = join(AGENTOS_ROOT, 'gitbucket', 'index', 'manifest.json');
const MASTER_SEAL_PATH = join(__dirname, 'math_skills_master_seal.json');

const skillIds = [
  'skill1_enumeration',
  'skill2_isomorphism',
  'skill3_symmetry',
  'skill4_hadamard',
  'skill5_probabilistic',
  'skill6_circuits',
];

function hashFile(filePath) {
  const content = readFileSync(filePath);
  return createHash('sha256').update(content).digest('hex');
}

function hashDir(dirPath, ext) {
  if (!existsSync(dirPath)) return [];
  return readdirSync(dirPath)
    .filter(f => f.endsWith(ext))
    .sort()
    .map(f => hashFile(join(dirPath, f)));
}

console.log('===========================================================');
console.log('  WORM Seal Verification');
console.log('===========================================================');
console.log('');

let allPassed = true;
let previousSeal = '0'.repeat(64); // Genesis
const sealHashes = [];

// Verify each skill seal
for (const skillId of skillIds) {
  const bucketId = `mem_${skillId}`;
  const bucketPath = join(BUCKETS_DIR, `${bucketId}.json`);
  const sealPath = join(SEALS_DIR, `${bucketId}.seal.json`);

  console.log(`Verifying ${skillId}...`);

  // Check files exist
  if (!existsSync(bucketPath)) {
    console.log(`  ✗ Bucket file missing: ${bucketPath}`);
    allPassed = false;
    continue;
  }
  if (!existsSync(sealPath)) {
    console.log(`  ✗ Seal file missing: ${sealPath}`);
    allPassed = false;
    continue;
  }

  // Read bucket and seal
  const bucket = JSON.parse(readFileSync(bucketPath, 'utf8'));
  const seal = JSON.parse(readFileSync(sealPath, 'utf8'));

  // Verify chain link
  if (seal.previous !== previousSeal) {
    console.log(`  ✗ Chain broken: expected previous=${previousSeal.substring(0, 16)}..., got ${seal.previous.substring(0, 16)}...`);
    allPassed = false;
  } else {
    console.log(`  ✓ Chain link valid (← ${seal.previous.substring(0, 16)}...)`);
  }

  // Recompute payload hash from actual files
  const skillDir = join(__dirname, skillId.replace('_', '-'));
  const fortranHashes = hashDir(join(skillDir, 'fortran'), '.f90');
  const aplHashes = hashDir(join(skillDir, 'apl'), '.apl');
  const axiomHashes = hashDir(join(skillDir, 'axiom'), '.axiom');
  const allHashes = [...fortranHashes, ...aplHashes, ...axiomHashes];

  const computedPayloadHash = createHash('sha256')
    .update(allHashes.join(':'))
    .digest('hex');

  if (seal.payloadHash !== computedPayloadHash) {
    console.log(`  ✗ Payload hash mismatch`);
    console.log(`    Expected: ${computedPayloadHash.substring(0, 32)}...`);
    console.log(`    Got:      ${seal.payloadHash.substring(0, 32)}...`);
    allPassed = false;
  } else {
    console.log(`  ✓ Payload hash valid (${allHashes.length} files)`);
  }

  // Verify seal hash
  const sealPayload = `MEMORY_BUCKET:${JSON.stringify(bucket)}`;
  const computedSealHash = createHash('sha256').update(sealPayload).digest('hex');

  if (seal.seal !== computedSealHash) {
    console.log(`  ✗ Seal hash mismatch`);
    console.log(`    Expected: ${computedSealHash.substring(0, 32)}...`);
    console.log(`    Got:      ${seal.seal.substring(0, 32)}...`);
    allPassed = false;
  } else {
    console.log(`  ✓ Seal hash valid`);
  }

  // Verify bucket schema
  if (bucket.schema !== 'memory-bucket-v2') {
    console.log(`  ✗ Invalid schema: ${bucket.schema}`);
    allPassed = false;
  } else {
    console.log(`  ✓ Schema valid (memory-bucket-v2)`);
  }

  // Verify bucket ID
  if (bucket.id !== bucketId) {
    console.log(`  ✗ Bucket ID mismatch: expected ${bucketId}, got ${bucket.id}`);
    allPassed = false;
  } else {
    console.log(`  ✓ Bucket ID valid`);
  }

  previousSeal = seal.seal;
  sealHashes.push(seal.seal);

  console.log('');
}

// Verify Merkle root
console.log('Verifying Merkle root...');
let hashes = [...sealHashes];
while (hashes.length > 1) {
  const next = [];
  for (let i = 0; i < hashes.length; i += 2) {
    const left = hashes[i];
    const right = hashes[i + 1] || left;
    next.push(createHash('sha256').update(left + right).digest('hex'));
  }
  hashes = next;
}
const computedMerkleRoot = hashes[0];

// Read master seal
const masterSeal = JSON.parse(readFileSync(MASTER_SEAL_PATH, 'utf8'));

if (masterSeal.merkleRoot !== computedMerkleRoot) {
  console.log(`  ✗ Merkle root mismatch`);
  console.log(`    Expected: ${computedMerkleRoot}`);
  console.log(`    Got:      ${masterSeal.merkleRoot}`);
  allPassed = false;
} else {
  console.log(`  ✓ Merkle root valid`);
  console.log(`    ${computedMerkleRoot}`);
}

console.log('');

// Verify manifest
console.log('Verifying manifest...');
const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));

const expectedBucketIds = skillIds.map(id => `mem_${id}`);
let manifestValid = true;

for (const bucketId of expectedBucketIds) {
  if (!manifest.buckets.includes(bucketId)) {
    console.log(`  ✗ Bucket ${bucketId} not in manifest`);
    manifestValid = false;
    allPassed = false;
  }
}

if (manifestValid) {
  console.log(`  ✓ All ${expectedBucketIds.length} buckets registered in manifest`);
}

console.log('');
console.log('===========================================================');

if (allPassed) {
  console.log('  ✓ ALL VERIFICATIONS PASSED');
  console.log(`  Chain length: ${skillIds.length}`);
  console.log(`  Merkle root: ${computedMerkleRoot.substring(0, 32)}...`);
  console.log('  WORM ledger integrity: VERIFIED');
} else {
  console.log('  ✗ VERIFICATION FAILED');
  console.log('  Some seals are invalid or tampered');
}

console.log('===========================================================');

process.exit(allPassed ? 0 : 1);
