# Resonance Math

**Mathematical foundation for SnapKitty Agent OS.**

Integrated from SNAPKITTY-PROOFS and RESONANCE-CORE. Three-layer architecture: JavaScript bridges, Haskell proves, AXIOM formalizes.

## Modules

### 1. Entropy (`lib/entropy.mjs`)

Information-theoretic foundations:

| Function | Description |
|----------|-------------|
| `shannonEntropy(probs)` | H(X) = -Σ p(x) log₂ p(x) |
| `klDivergence(p, q)` | D_KL(P ‖ Q) ≥ 0 (Gibbs' inequality) |
| `crossEntropy(p, q)` | H(P,Q) = H(P) + D_KL(P ‖ Q) |
| `vonNeumannEntropy(eigenvalues)` | S(ρ) = -Tr(ρ log ρ) |
| `normalize(weights)` | Normalize to probability distribution |
| `isWithinEntropyBound(amplitudes, max)` | Check entropy ≤ threshold |

**AXIOM formalization** (`axiom/entropy.axiom`):
- `shannon_nonneg` — Shannon entropy is non-negative
- `kl_nonneg` — KL divergence is non-negative (Gibbs' inequality)
- `kl_zero_iff_eq` — KL = 0 iff P = Q
- `cross_entropy_decomposition` — H(P,Q) = H(P) + D_KL(P ‖ Q)
- `von_neumann_reduces_to_shannon` — For diagonal density matrices

### 2. Thermal Window Engine (`lib/thermal.mjs`)

Adaptive sampling via thermodynamic analogy:

| Function | Description |
|----------|-------------|
| `mkFriction(f)` | Clamp to [0,1] |
| `frictionEMA(current, score)` | f_{n+1} = 0.2·score + 0.8·current |
| `computeThermalWindow(f)` | {lo, hi, span} in uint16 space |
| `normalizeWithinWindow(raw, window)` | Clamp and normalize to [0,1] |
| `thermalMode(f)` | Cool / Warm / Hot classification |
| `sampleCount(f)` | 2 + round(f × 6), range [2,8] |
| `decisionsToCool(f)` | Steps to cool below f=0.1 |
| `thermalFeedbackLoop(initial, scores)` | Full closed-loop simulation |
| `boltzmannPartition(energies, T)` | Z = Σ exp(-E_i/kT) |
| `boltzmannProb(E, T, Z)` | P(E_i) = exp(-E_i/kT) / Z |

**Proven invariant** (`axiom/thermal.axiom`):
```
∀ f ∈ [0,1]: lo(f) ≤ 16383 < 49151 ≤ hi(f)
∴ lo(f) < hi(f)  ∎
```

**Boundary values:**
- f=0: [0, 65535] — full range, maximum diversity
- f=1: [16383, 49151] — sovereign center, 25%-75%

**Boltzmann connection:** Hot friction contracts window → low-temperature concentration. Cool friction opens window → high-temperature uniform sampling.

### 3. Quantum Monad (`lib/quantum.mjs`)

Superposition algebra with monadic operations:

| Function | Description |
|----------|-------------|
| `qUnit(value)` | η(v) = {(1.0, v)} |
| `qBind(superposition, fn)` | S >>= f (Born-rule weighted branching) |
| `qMap(superposition, fn)` | Functor map |
| `qNormalize(superposition)` | Ensure weights sum to 1 |
| `qPrune(superposition)` | Remove zero-weight branches |
| `qMeasure(superposition)` | collapse(S) = argmax wᵢ |
| `watchtowerAmplitudes([r0,r1,r2,r3])` | ANU uint16 → normalized tower weights |
| `subleqGate(amplitudes, threshold)` | Threshold gate |
| `call49(superposition)` | The 49th Call: reverse |
| `mirrorIdentity(superposition)` | call49(call49(X)) = X |
| `sovereignDefaults()` | Al-Hamid abjad defaults [53, 49, 106, 7] |

**The 49th Call — Three languages, one truth:**
- APL (1962): `⌽X`
- Prolog (1972): `call_49(X,Y) :- reverse(X,Y).`
- Haskell (1990): `call49 = reverse`

### 4. ERE-5 Verification (`lib/ere.mjs`)

Five-pass verification protocol:

| Pass | Role | Direction | Check |
|------|------|-----------|-------|
| 1 | Structural | LTR | Non-empty, well-formed |
| 2 | Scholarly | LTR | No fabrication markers |
| 3 | Invariants | RTL | Reverse-read is valid |
| 4 | Mission | RTL | Not a mission violation |
| 5 | Root | RTL | Input is defined |

| Function | Description |
|----------|-------------|
| `erePass1`–`erePass5` | Individual pass functions |
| `ereScore(input)` | Fraction of failed passes ∈ [0,1] |
| `ereRunPasses(input)` | Run all 5, return detailed results |
| `ereRunMode(mode, input)` | Run in watchtower-specific order |

**Search orders:**
- analytical (East/Air): 1→2→3→4→5
- creative (South/Fire): 5→4→3→2→1
- receptive (West/Water): 1→3→5→2→4
- grounding (North/Earth): 5→4→3→2→1

### 5. Borrow Chain / Verdict Algebra (`lib/borrow-chain.mjs`)

Policy decision framework:

| Function | Description |
|----------|-------------|
| `combineVerdicts(verdicts)` | Strictest verdict wins |
| `verdictPriority(verdict)` | Priority ordering |
| `verdictNatsSubject(verdict)` | Route to NATS subjects |
| `verdictIsFinal(verdict)` | approve/reject are final |
| `validateChainDepth(depth)` | 0 ≤ depth ≤ 32 |
| `wormSealInvariant(cid, state)` | Once sealed, cannot modify |
| `validJitCompile(souliir, wasm, worm)` | Policy validation |
| `validCapTransfer(cap, policy, worm, caps)` | Capability transfer |
| `validAttestation(epoch, root, roots)` | Epoch attestation |

**Verdict priority:** approve ≺ defer ≺ reject ≺ human_required ≺ escalate

## AXIOM Formalizations

Three AXIOM files formalize the key theorems:

### `axiom/thermal.axiom`
- `thermal_lo_upper_bound` — lo(f) ≤ 16383
- `thermal_hi_lower_bound` — hi(f) ≥ 49151
- `thermal_window_valid` — lo(f) < hi(f) for all f ∈ [0,1]
- `ema_preserves_bounds` — EMA preserves [0,1]
- `sample_count_bounds` — sampleCount ∈ [2,8]

### `axiom/entropy.axiom`
- `shannon_nonneg` — H(X) ≥ 0
- `shannon_max_uniform` — Maximum for uniform distribution
- `kl_nonneg` — D_KL(P ‖ Q) ≥ 0
- `kl_zero_iff_eq` — D_KL = 0 iff P = Q
- `cross_entropy_decomposition` — H(P,Q) = H(P) + D_KL
- `von_neumann_reduces_to_shannon` — For diagonal ρ

### `axiom/golden.axiom`
- `phi_gt_one` — φ > 1
- `phi_sq_eq_phi_add_one` — φ² = φ + 1
- `phi_inv_eq_phi_sub_one` — φ⁻¹ = φ - 1
- `sqrt_five_irrational` — √5 is irrational
- `phi_irrational` — φ is irrational
- `ahmad_sovereign_seal` — F(53) % 107 = 8
- `fib_twelve_dimension_overshoot` — F(12) = 144 = 108 + 36
- `zeckendorf_64` — 64 = F(10) + F(6) + F(2)
- `phinary_contraction` — R₀ / φⁿ → 0
- `goldilocks_not_collapse` — 1/φ > 0
- `goldilocks_contractive` — 1/φ < 1
- `goldilocks_self_referential` — 1/φ = φ - 1

## Test Results

```
45 tests, 0 failures

Entropy:     7 passed
Thermal:    12 passed
Quantum:     9 passed
ERE:         9 passed
Borrow Chain: 8 passed
```

## Integration with Existing Infrastructure

| Component | Integration Point |
|-----------|------------------|
| `math-skills/` | Entropy used in QEC discovery, thermal in search strategies |
| `axiom-proof/` | AXIOM formalizations extend existing type theory |
| `pnp-attack/` | Verdict algebra for proof search coordination |
| `collatz-verification/` | Thermal window for adaptive search |
| `.agentos/gitbucket/` | WORM sealing of all mathematical discoveries |

## Source Repositories

- **SNAPKITTY-PROOFS** — Lean 4 proofs, Haskell implementations, Liquid Haskell refinements
- **RESONANCE-CORE** — JavaScript bridge implementations, LaTeX formal specs

## Building

```bash
cd resonance-math
npm test
```

## Architecture

```
SNAPKITTY-PROOFS          RESONANCE-CORE
├── Lean 4 proofs         ├── JS bridge modules
├── Haskell code          ├── LaTeX specs
├── Liquid Haskell        ├── Test fixtures
├── Idris 2               └── Constants config
└── Prolog
         │                        │
         └────────┬───────────────┘
                  │
                  ▼
         resonance-math/
         ├── lib/*.mjs (JS bridges)
         ├── axiom/*.axiom (formal proofs)
         ├── tests/ (45 tests)
         └── WORM sealed
```

## License

Sovereign Source License v1.0
