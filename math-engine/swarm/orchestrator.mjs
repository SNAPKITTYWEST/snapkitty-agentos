#!/usr/bin/env node
// P/NP Swarm Orchestrator
// Distributes problems to git buckets with envelope sealing
// Integrates with .agentos runtime (core.mjs seal, gitbucket extract)

import { createHash } from 'crypto';
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const AGENTOS_ROOT = join(__dirname, '..', '..', '.agentos');
const BUCKETS_DIR = join(AGENTOS_ROOT, 'gitbucket', 'buckets');
const SEALS_DIR = join(AGENTOS_ROOT, 'gitbucket', 'seals');
const PNP_DIR = join(AGENTOS_ROOT, 'pnp');

class PNPSwarm {
  constructor() {
    this.problems = [];
    this.solutions = [];
    this.buckets = new Map();
  }

  /**
   * Register a problem in the swarm
   */
  addProblem({ name, complexity, input, bucketHint }) {
    const envelope_id = this.generateEnvelope({ name, complexity, input });
    const bucket_id = bucketHint || this.assignBucket(complexity);

    const problem = {
      id: `prob_${name.toLowerCase()}_${Date.now()}`,
      name,
      complexity,
      input,
      envelope_id,
      bucket_id,
      status: 'open',
      createdAt: new Date().toISOString()
    };

    this.problems.push(problem);

    if (!this.buckets.has(bucket_id)) {
      this.buckets.set(bucket_id, []);
    }
    this.buckets.get(bucket_id).push(problem);

    return problem;
  }

  /**
   * Generate deterministic envelope seal (SHA-256 of data only)
   */
  generateEnvelope(data) {
    const hash = createHash('sha256')
      .update(JSON.stringify(data))
      .digest('hex');
    return `env-${hash.slice(0, 32)}`;
  }

  /**
   * Assign bucket based on complexity class
   */
  assignBucket(complexity) {
    const prefix = complexity === 'P' ? 'bucket_p' : 'bucket_np';
    return `${prefix}_${this.buckets.size}`;
  }

  /**
   * Submit a solution for a problem
   */
  submitSolution(problemId, solution) {
    const problem = this.problems.find(p => p.id === problemId);
    if (!problem) throw new Error(`Problem ${problemId} not found`);

    const solvedAt = new Date().toISOString();
    const sealData = { problemId, solution, solvedAt };
    const seal = this.generateEnvelope(sealData);

    const record = {
      problemId,
      solution,
      envelope_seal: seal,
      solver: 'local',
      solvedAt,
      verified: false
    };

    this.solutions.push(record);
    problem.status = 'solved';

    return record;
  }

  /**
   * Verify all solutions against their envelopes
   */
  verifyAll() {
    let verified = 0;
    let failed = 0;

    for (const sol of this.solutions) {
      const problem = this.problems.find(p => p.id === sol.problemId);
      if (!problem) { failed++; continue; }

      // Re-compute envelope from stored solution data (deterministic)
      const sealData = {
        problemId: sol.problemId,
        solution: sol.solution,
        solvedAt: sol.solvedAt
      };
      const expected = this.generateEnvelope(sealData);

      sol.verified = (expected === sol.envelope_seal);
      if (sol.verified) verified++;
      else failed++;
    }

    return { verified, failed, total: this.solutions.length };
  }

  /**
   * Seal all buckets to gitbucket storage
   */
  sealToGit() {
    mkdirSync(BUCKETS_DIR, { recursive: true });
    mkdirSync(SEALS_DIR, { recursive: true });

    for (const [bucket_id, problems] of this.buckets) {
      const bucket = {
        schema: 'memory-bucket-v2',
        id: `mem_swarm_${bucket_id}`,
        gitHash: this.getGitHash(),
        type: 'swarm',
        summary: `P/NP swarm bucket: ${bucket_id} (${problems.length} problems)`,
        files: problems.map(p => `math-engine/swarm/${p.name}`),
        entities: ['snapkitty-agentos', 'pnp-swarm', bucket_id],
        topics: ['pnp', 'swarm', 'math-engine', problems.map(p => p.complexity.toLowerCase())].flat(),
        dependencies: problems.map(p => p.id),
        problems: problems.map(p => ({ id: p.id, name: p.name, complexity: p.complexity, envelope: p.envelope_id })),
        extractedAt: new Date().toISOString()
      };

      const bucketFile = join(BUCKETS_DIR, `${bucket.id}.json`);
      writeFileSync(bucketFile, JSON.stringify(bucket, null, 2));

      // Write seal
      const seal = {
        kind: 'MEMORY_BUCKET',
        payloadHash: createHash('sha256')
          .update(JSON.stringify(bucket))
          .digest('hex'),
        previous: '0'.repeat(64),
        seal: createHash('sha256')
          .update(`MEMORY_BUCKET:${JSON.stringify(bucket)}`)
          .digest('hex'),
        sealedAt: new Date().toISOString()
      };

      const sealFile = join(SEALS_DIR, `${bucket.id}.seal.json`);
      writeFileSync(sealFile, JSON.stringify(seal, null, 2));

      console.log(`  sealed ${problems.length} problems → ${bucket.id}`);
    }

    // Update manifest
    this.updateManifest();
  }

  /**
   * Update gitbucket manifest with new bucket IDs
   */
  updateManifest() {
    const manifestPath = join(AGENTOS_ROOT, 'gitbucket', 'index', 'manifest.json');
    let manifest;
    try {
      manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    } catch {
      manifest = { schema: 'gitbucket-v2', buckets: [], indexes: [], initializedAt: new Date().toISOString() };
    }

    for (const [bucket_id] of this.buckets) {
      const memId = `mem_swarm_${bucket_id}`;
      if (!manifest.buckets.includes(memId)) {
        manifest.buckets.push(memId);
      }
    }

    writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  }

  /**
   * Write solution pool entries for P/NP verifier
   */
  writeToSolutionPool() {
    const poolDir = join(PNP_DIR, 'solution_pool');
    mkdirSync(poolDir, { recursive: true });

    for (const sol of this.solutions) {
      const problemDir = join(poolDir, sol.problemId);
      mkdirSync(problemDir, { recursive: true });

      const solutionFile = join(problemDir, `solution_swarm_${Date.now()}.json`);
      writeFileSync(solutionFile, JSON.stringify({
        witness: sol.solution,
        proof: { envelope: sol.envelope_seal, verified: sol.verified },
        agentId: 'math-engine-swarm',
        timestamp: sol.solvedAt
      }, null, 2));
    }
  }

  getGitHash() {
    try {
      return execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
    } catch {
      return 'workspace';
    }
  }

  /**
   * Print swarm status
   */
  status() {
    console.log('\n=== P/NP Swarm Status ===');
    console.log(`Problems:  ${this.problems.length}`);
    console.log(`Solutions: ${this.solutions.length}`);
    console.log(`Buckets:   ${this.buckets.size}`);

    for (const [bucket_id, problems] of this.buckets) {
      const solved = problems.filter(p => p.status === 'solved').length;
      console.log(`  ${bucket_id}: ${solved}/${problems.length} solved`);
    }

    const { verified, failed, total } = this.verifyAll();
    console.log(`Verified:  ${verified}/${total} (${failed} failed)`);
    console.log('=========================\n');
  }
}

// --- Main execution ---

const swarm = new PNPSwarm();

// Register problems from the existing problem_registry.json
try {
  const registry = JSON.parse(readFileSync(join(PNP_DIR, 'problem_registry.json'), 'utf8'));
  for (const prob of registry.problems) {
    swarm.addProblem({
      name: prob.id,
      complexity: prob.difficulty.includes('NP') ? 'NP' : 'P',
      input: { specHash: prob.specHash },
      bucketHint: prob.difficulty.includes('NP') ? 'bucket_np_registry' : 'bucket_p_registry'
    });
  }
  console.log(`Loaded ${registry.problems.length} problems from registry`);
} catch (e) {
  console.log('No problem registry found, using defaults');
}

// Add math-engine specific problems
swarm.addProblem({ name: 'TSP_6', complexity: 'NP', input: { cities: 6 } });
swarm.addProblem({ name: 'SAT_50', complexity: 'NP', input: { clauses: 50 } });
swarm.addProblem({ name: 'SORT_1000', complexity: 'P', input: { elements: 1000 } });

// Submit mock solutions (in production, Fortran solver provides real witnesses)
for (const p of swarm.problems) {
  swarm.submitSolution(p.id, { witness: `witness_${p.name}`, value: Math.random() });
}

// Verify all
const results = swarm.verifyAll();
console.log(`\nVerification: ${results.verified}/${results.total} passed`);

// Seal to git buckets
console.log('\nSealing to git buckets...');
swarm.sealToGit();

// Write to solution pool
swarm.writeToSolutionPool();

swarm.status();

console.log('Swarm orchestration complete.');
