// Test suite for resonance-math modules
import { strict as assert } from 'node:assert';
import {
  shannonEntropy, klDivergence, crossEntropy, normalize, vonNeumannEntropy, isWithinEntropyBound
} from '../lib/entropy.mjs';
import {
  mkFriction, frictionEMA, computeThermalWindow, normalizeWithinWindow,
  thermalMode, sampleCount, decisionsToCool, thermalFeedbackLoop,
  boltzmannPartition, boltzmannProb
} from '../lib/thermal.mjs';
import {
  qUnit, qBind, qMap, qNormalize, qPrune, qMeasure,
  watchtowerAmplitudes, subleqGate, call49, mirrorIdentity, sovereignDefaults
} from '../lib/quantum.mjs';
import {
  erePass1, erePass2, erePass3, erePass4, erePass5, ereScore,
  ereRunPasses, ereRunMode
} from '../lib/ere.mjs';
import {
  combineVerdicts, verdictPriority, verdictNatsSubject, verdictIsFinal,
  validateChainDepth, wormSealInvariant, validJitCompile, validCapTransfer
} from '../lib/borrow-chain.mjs';

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    failed++;
    console.log(`  ✗ ${name}: ${e.message}`);
  }
}

console.log('===========================================================');
console.log('  Resonance Math Test Suite');
console.log('===========================================================');
console.log('');

// --- Entropy Tests ---
console.log('Entropy:');

test('shannonEntropy of uniform distribution = log2(n)', () => {
  const probs = [0.25, 0.25, 0.25, 0.25];
  const h = shannonEntropy(probs);
  assert.ok(Math.abs(h - 2.0) < 0.001, `Expected ~2.0, got ${h}`);
});

test('shannonEntropy of deterministic distribution = 0', () => {
  const probs = [1.0, 0, 0, 0];
  const h = shannonEntropy(probs);
  assert.ok(Math.abs(h) < 0.001, `Expected ~0, got ${h}`);
});

test('klDivergence of identical distributions = 0', () => {
  const p = [0.5, 0.5];
  const q = [0.5, 0.5];
  const d = klDivergence(p, q);
  assert.ok(Math.abs(d) < 0.001, `Expected ~0, got ${d}`);
});

test('klDivergence is non-negative', () => {
  const p = [0.7, 0.3];
  const q = [0.5, 0.5];
  const d = klDivergence(p, q);
  assert.ok(d >= 0, `Expected >= 0, got ${d}`);
});

test('crossEntropy = shannon + KL', () => {
  const p = [0.6, 0.4];
  const q = [0.5, 0.5];
  const h = shannonEntropy(p);
  const d = klDivergence(p, q);
  const ce = crossEntropy(p, q);
  assert.ok(Math.abs(ce - (h + d)) < 0.001, `Expected ${h + d}, got ${ce}`);
});

test('normalize sums to 1', () => {
  const weights = [3, 1, 2];
  const probs = normalize(weights);
  const sum = probs.reduce((a, b) => a + b, 0);
  assert.ok(Math.abs(sum - 1.0) < 0.001, `Expected 1.0, got ${sum}`);
});

test('vonNeumannEntropy reduces to Shannon for positive eigenvalues', () => {
  const eigenvalues = [0.5, 0.3, 0.2];
  const vn = vonNeumannEntropy(eigenvalues);
  const sh = shannonEntropy(eigenvalues);
  assert.ok(Math.abs(vn - sh) < 0.001, `Expected ${sh}, got ${vn}`);
});

console.log('');

// --- Thermal Tests ---
console.log('Thermal:');

test('mkFriction clamps to [0,1]', () => {
  assert.equal(mkFriction(-0.5), 0);
  assert.equal(mkFriction(1.5), 1);
  assert.equal(mkFriction(0.5), 0.5);
});

test('frictionEMA preserves bounds', () => {
  const result = frictionEMA(0.5, 0.8);
  assert.ok(result >= 0 && result <= 1, `Expected [0,1], got ${result}`);
});

test('thermalWindow lo < hi for all f in [0,1]', () => {
  for (let f = 0; f <= 1; f += 0.01) {
    const { lo, hi } = computeThermalWindow(f);
    assert.ok(lo < hi, `lo(${f})=${lo} >= hi(${f})=${hi}`);
  }
});

test('thermalWindow lo <= 16383 < 49151 <= hi', () => {
  for (let f = 0; f <= 1; f += 0.1) {
    const { lo, hi } = computeThermalWindow(f);
    assert.ok(lo <= 16383, `lo(${f})=${lo} > 16383`);
    assert.ok(hi >= 49151, `hi(${f})=${hi} < 49151`);
  }
});

test('normalizeWithinWindow returns [0,1]', () => {
  const window = computeThermalWindow(0.5);
  const raw = 30000;
  const norm = normalizeWithinWindow(raw, window);
  assert.ok(norm >= 0 && norm <= 1, `Expected [0,1], got ${norm}`);
});

test('thermalMode classification', () => {
  assert.equal(thermalMode(0.1), 'Cool');
  assert.equal(thermalMode(0.5), 'Warm');
  assert.equal(thermalMode(0.9), 'Hot');
});

test('sampleCount in [2,8]', () => {
  for (let f = 0; f <= 1; f += 0.1) {
    const n = sampleCount(f);
    assert.ok(n >= 2 && n <= 8, `Expected [2,8], got ${n}`);
  }
});

test('decisionsToCool returns positive for f > 0.1', () => {
  const n = decisionsToCool(0.5);
  assert.ok(n > 0, `Expected > 0, got ${n}`);
});

test('thermalFeedbackLoop returns valid state', () => {
  const result = thermalFeedbackLoop(0.5, [0.8, 0.9, 0.1]);
  assert.ok(result.friction >= 0 && result.friction <= 1);
  assert.ok(result.window.lo < result.window.hi);
});

test('boltzmannPartition is positive', () => {
  // Use k=1 (normalized) to avoid underflow with small energies
  const z = boltzmannPartition([1.0, 2.0, 3.0], 300, 1.0);
  assert.ok(z > 0, `Expected > 0, got ${z}`);
});

test('boltzmannProb sums to 1', () => {
  const energies = [1.0, 2.0, 3.0];
  const T = 300;
  const k = 1.0; // Normalized Boltzmann constant
  const z = boltzmannPartition(energies, T, k);
  const probs = energies.map(e => boltzmannProb(e, T, z, k));
  const sum = probs.reduce((a, b) => a + b, 0);
  assert.ok(Math.abs(sum - 1.0) < 0.001, `Expected 1.0, got ${sum}`);
});

console.log('');

// --- Quantum Tests ---
console.log('Quantum:');

test('qUnit creates deterministic superposition', () => {
  const s = qUnit('hello');
  assert.equal(s.length, 1);
  assert.equal(s[0].weight, 1.0);
  assert.equal(s[0].value, 'hello');
});

test('qBind composes superpositions', () => {
  const s = qUnit(1);
  const result = qBind(s, (x) => [{ weight: 0.5, value: x + 1 }, { weight: 0.5, value: x + 2 }]);
  assert.equal(result.length, 2);
});

test('qNormalize sums to 1', () => {
  const s = [{ weight: 2, value: 'a' }, { weight: 3, value: 'b' }];
  const norm = qNormalize(s);
  const sum = norm.reduce((acc, a) => acc + a.weight, 0);
  assert.ok(Math.abs(sum - 1.0) < 0.001, `Expected 1.0, got ${sum}`);
});

test('qMeasure returns highest weight', () => {
  const s = [{ weight: 0.3, value: 'a' }, { weight: 0.7, value: 'b' }];
  assert.equal(qMeasure(s), 'b');
});

test('call49 reverses superposition', () => {
  const s = [{ weight: 1, value: 'a' }, { weight: 2, value: 'b' }];
  const rev = call49(s);
  assert.equal(rev[0].value, 'b');
  assert.equal(rev[1].value, 'a');
});

test('mirrorIdentity: call49(call49(X)) = X', () => {
  const s = [{ weight: 1, value: 'a' }, { weight: 2, value: 'b' }, { weight: 3, value: 'c' }];
  assert.ok(mirrorIdentity(s));
});

test('watchtowerAmplitudes normalizes ANU values', () => {
  const amps = watchtowerAmplitudes([53, 49, 106, 7]);
  const sum = amps.reduce((acc, a) => acc + a.weight, 0);
  assert.ok(Math.abs(sum - 1.0) < 0.001, `Expected 1.0, got ${sum}`);
});

test('subleqGate fires when above threshold', () => {
  const amps = [{ weight: 0.5, value: 'east' }, { weight: 0.1, value: 'south' }];
  const result = subleqGate(amps, 0.3);
  assert.ok(result.fired);
  assert.equal(result.count, 1);
});

test('sovereignDefaults returns 4 towers', () => {
  const defaults = sovereignDefaults();
  assert.equal(defaults.length, 4);
});

console.log('');

// --- ERE Tests ---
console.log('ERE:');

test('erePass1 accepts non-empty string', () => {
  assert.ok(erePass1('hello world'));
  assert.ok(!erePass1('hi'));
  assert.ok(!erePass1(''));
});

test('erePass2 rejects fabrication markers', () => {
  assert.ok(erePass2('The theorem is proven by induction'));
  assert.ok(!erePass2('I made up this proof'));
  assert.ok(!erePass2('As an AI, I cannot verify'));
});

test('erePass3 accepts valid reverse', () => {
  assert.ok(erePass3('hello'));
  assert.ok(erePass3([1, 2, 3]));
});

test('erePass4 rejects mission violations', () => {
  assert.ok(erePass4('valid input'));
  assert.ok(!erePass4('null'));
  assert.ok(!erePass4('undefined'));
});

test('erePass5 accepts defined input', () => {
  assert.ok(erePass5('hello'));
  assert.ok(erePass5(null));
  assert.ok(!erePass5(undefined));
});

test('ereScore returns 0 for clean input', () => {
  const score = ereScore('The proof uses mathematical induction on n');
  assert.equal(score, 0);
});

test('ereRunPasses returns detailed results', () => {
  const result = ereRunPasses('Valid mathematical content here');
  assert.ok(result.certified);
  assert.equal(result.score, 0);
  assert.equal(result.metatron, 'YES');
});

test('ereRunMode analytical passes clean input', () => {
  const result = ereRunMode('analytical', 'Valid proof content');
  assert.ok(result.certified);
});

test('ereRunMode creative reverses pass order', () => {
  const result = ereRunMode('creative', 'Valid proof content');
  assert.ok(result.certified);
});

console.log('');

// --- Borrow Chain Tests ---
console.log('Borrow Chain:');

test('combineVerdicts picks strictest', () => {
  const v1 = { type: 'approve', policyId: 'P1' };
  const v2 = { type: 'reject', policyId: 'P2' };
  const combined = combineVerdicts([v1, v2]);
  assert.equal(combined.type, 'reject');
});

test('combineVerdicts merges human_required', () => {
  const v1 = { type: 'human_required', policyId: 'P1' };
  const v2 = { type: 'human_required', policyId: 'P2' };
  const combined = combineVerdicts([v1, v2]);
  assert.equal(combined.type, 'human_required');
  assert.ok(combined.policyIds.includes('P1'));
  assert.ok(combined.policyIds.includes('P2'));
});

test('verdictPriority ordering', () => {
  assert.ok(verdictPriority({ type: 'approve' }) < verdictPriority({ type: 'reject' }));
  assert.ok(verdictPriority({ type: 'reject' }) < verdictPriority({ type: 'escalate' }));
});

test('verdictNatsSubject routes correctly', () => {
  assert.equal(verdictNatsSubject({ type: 'approve' }), 'sovereign.audit.bifrost.commit.v1');
  assert.equal(verdictNatsSubject({ type: 'defer' }), 'sovereign.governance.decision.pending.v1');
});

test('verdictIsFinal for approve/reject', () => {
  assert.ok(verdictIsFinal({ type: 'approve' }));
  assert.ok(verdictIsFinal({ type: 'reject' }));
  assert.ok(!verdictIsFinal({ type: 'defer' }));
});

test('validateChainDepth accepts valid depths', () => {
  assert.ok(validateChainDepth(0));
  assert.ok(validateChainDepth(16));
  assert.ok(validateChainDepth(32));
  assert.ok(!validateChainDepth(-1));
  assert.ok(!validateChainDepth(33));
});

test('wormSealInvariant detects sealed CIDs', () => {
  const wormState = new Set(['abc123', 'def456']);
  assert.ok(wormSealInvariant('abc123', wormState));
  assert.ok(!wormSealInvariant('xyz789', wormState));
});

test('validJitCompile requires souliir sealed, wasm not', () => {
  const wormState = new Set(['souliir_cid']);
  assert.ok(validJitCompile('souliir_cid', 'wasm_cid', wormState));
  assert.ok(!validJitCompile('other_cid', 'wasm_cid', wormState));
});

test('validCapTransfer with sealed policy', () => {
  const wormState = new Set(['policy_cid']);
  const capMap = new Set(['cap_hash']);
  assert.ok(validCapTransfer('cap_hash', 'policy_cid', wormState, capMap));
});

console.log('');

// --- Summary ---
console.log('===========================================================');
console.log(`  Results: ${passed} passed, ${failed} failed`);
if (failed === 0) {
  console.log('  ✓ ALL TESTS PASSED');
} else {
  console.log('  ✗ SOME TESTS FAILED');
}
console.log('===========================================================');

process.exit(failed > 0 ? 1 : 0);
