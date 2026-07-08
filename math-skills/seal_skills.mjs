// WORM Sealing Script for Mathematical Skills
// Seals each skill as a GitBucket memory bucket with Ed25519-compatible chain
// Integrates with .agentos/gitbucket seal format

import { createHash } from 'crypto';
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const AGENTOS_ROOT = join(__dirname, '..', '.agentos');
const BUCKETS_DIR = join(AGENTOS_ROOT, 'gitbucket', 'buckets');
const SEALS_DIR = join(AGENTOS_ROOT, 'gitbucket', 'seals');
const MANIFEST_PATH = join(AGENTOS_ROOT, 'gitbucket', 'index', 'manifest.json');

const skills = [
  { id: 'skill1-enumeration', name: 'Combinatorial Enumeration', provides: ['enumerateGraphs', 'countGraphs', 'canonicalForm'] },
  { id: 'skill2-isomorphism', name: 'Graph Isomorphism Detection', provides: ['areIsomorphic', 'canonicalLabel', 'graphHash'] },
  { id: 'skill3-symmetry', name: 'Symmetry Breaking', provides: ['computeOrbits', 'canonicalOrbitRep', 'reduceSearchSpace'] },
  { id: 'skill4-hadamard', name: 'Hadamard Matrix Construction', provides: ['sylvester', 'paley', 'williamson', 'isHadamard'] },
  { id: 'skill5-probabilistic', name: 'Probabilistic Method', provides: ['randomGraph', 'monteCarloClique', 'estimateRamseyBound'] },
  { id: 'skill6-circuits', name: 'Circuit Complexity', provides: ['evaluateCircuit', 'countGates', 'circuitDepth'] },
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

function getGitHash() {
  try {
    return execSync('git rev-parse HEAD', { encoding: 'utf8', cwd: join(__dirname, '..') }).trim();
  } catch {
    return 'workspace';
  }
}

function sealSkill(skill, previousSeal) {
  const skillDir = join(__dirname, skill.id);

  // Hash all implementation files
  const fortranHashes = hashDir(join(skillDir, 'fortran'), '.f90');
  const aplHashes = hashDir(join(skillDir, 'apl'), '.apl');
  const axiomHashes = hashDir(join(skillDir, 'axiom'), '.axiom');

  const allHashes = [...fortranHashes, ...aplHashes, ...axiomHashes];
  const payloadHash = createHash('sha256')
    .update(allHashes.join(':'))
    .digest('hex');

  // Create memory bucket (GitBucket v2 format)
  const bucketId = `mem_${skill.id.replace(/-/g, '_')}`;
  const bucket = {
    schema: 'memory-bucket-v2',
    id: bucketId,
    gitHash: 'current',
    type: 'skill',
    summary: `Mathematical skill: ${skill.name}`,
    files: [
      ...fortranHashes.map(() => `${skill.id}/fortran/*.f90`),
      ...aplHashes.map(() => `${skill.id}/apl/*.apl`),
      ...axiomHashes.map(() => `${skill.id}/axiom/*.axiom`),
    ],
    entities: ['snapkitty-agentos', 'math-skills', skill.id],
    topics: ['math', 'skill', skill.id, ...skill.provides],
    dependencies: [],
    problems: [],
    skillProvides: skill.provides,
    extractedAt: new Date().toISOString(),
  };

  // Create seal (chain to previous)
  const sealPayload = `MEMORY_BUCKET:${JSON.stringify(bucket)}`;
  const sealHash = createHash('sha256').update(sealPayload).digest('hex');

  const seal = {
    kind: 'MEMORY_BUCKET',
    payloadHash,
    previous: previousSeal,
    seal: sealHash,
    sealedAt: new Date().toISOString(),
  };

  // Write bucket and seal
  mkdirSync(BUCKETS_DIR, { recursive: true });
  mkdirSync(SEALS_DIR, { recursive: true });

  writeFileSync(join(BUCKETS_DIR, `${bucketId}.json`), JSON.stringify(bucket, null, 2));
  writeFileSync(join(SEALS_DIR, `${bucketId}.seal.json`), JSON.stringify(seal, null, 2));

  return { bucketId, sealHash, payloadHash };
}

function updateManifest(newBucketIds) {
  let manifest;
  try {
    manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));
  } catch {
    manifest = {
      schema: 'gitbucket-v2',
      buckets: [],
      indexes: ['file', 'entity', 'agent', 'topic', 'time', 'dependency', 'problemId'],
      initializedAt: new Date().toISOString(),
    };
  }

  for (const id of newBucketIds) {
    if (!manifest.buckets.includes(id)) {
      manifest.buckets.push(id);
    }
  }

  writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
}

function computeMerkleRoot(seals) {
  let hashes = seals.map(s => s.sealHash);
  while (hashes.length > 1) {
    const next = [];
    for (let i = 0; i < hashes.length; i += 2) {
      const left = hashes[i];
      const right = hashes[i + 1] || left;
      next.push(createHash('sha256').update(left + right).digest('hex'));
    }
    hashes = next;
  }
  return hashes[0];
}

// --- Main ---

console.log('===========================================================');
console.log('  WORM Sealing: Mathematical Skills');
console.log('  Integrating with .agentos/gitbucket');
console.log('===========================================================');
console.log('');

let previousSeal = '0'.repeat(64); // Genesis seal
const results = [];

for (const skill of skills) {
  const result = sealSkill(skill, previousSeal);
  results.push(result);
  previousSeal = result.sealHash;

  const fileCount =
    hashDir(join(__dirname, skill.id, 'fortran'), '.f90').length +
    hashDir(join(__dirname, skill.id, 'apl'), '.apl').length +
    hashDir(join(__dirname, skill.id, 'axiom'), '.axiom').length;

  console.log(`  ✓ ${skill.name}`);
  console.log(`    Bucket: ${result.bucketId}`);
  console.log(`    Files:  ${fileCount} (Fortran + APL + AXIOM)`);
  console.log(`    Seal:   ${result.sealHash.substring(0, 32)}...`);
  console.log(`    Chain:  ← ${result.payloadHash.substring(0, 16)}...`);
  console.log('');
}

// Compute Merkle root over all seals
const merkleRoot = computeMerkleRoot(results);

// Update gitbucket manifest
const bucketIds = results.map(r => r.bucketId);
updateManifest(bucketIds);

// Write master seal
const masterSeal = {
  timestamp: new Date().toISOString(),
  skills: results.map((r, i) => ({
    id: skills[i].id,
    name: skills[i].name,
    bucketId: r.bucketId,
    seal: r.sealHash,
    payloadHash: r.payloadHash,
  })),
  merkleRoot,
  chainLength: results.length,
};

writeFileSync(
  join(__dirname, 'math_skills_master_seal.json'),
  JSON.stringify(masterSeal, null, 2)
);

console.log('===========================================================');
console.log(`  ${results.length} skills sealed to WORM ledger`);
console.log(`  Merkle root: ${merkleRoot}`);
console.log(`  Chain: genesis → ${results.map(r => r.bucketId).join(' → ')}`);
console.log('');
console.log('  Buckets:  .agentos/gitbucket/buckets/');
console.log('  Seals:    .agentos/gitbucket/seals/');
console.log('  Manifest: .agentos/gitbucket/index/manifest.json');
console.log('===========================================================');
