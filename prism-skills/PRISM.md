# Prism Skills

**Canonical serialization, SHA-256d hashing, ψ-pipeline, WORM sealing, and admission validation.**

Integrated from sovereign-prism for SnapKitty Agent OS.

## Overview

Prism Skills provides the cryptographic and algebraic topology foundation for deterministic artifact processing:

1. **Canonical Serialization** - Deterministic JSON with key ordering invariance
2. **SHA-256d** - Double SHA-256 hashing (prevents length-extension attacks)
3. **ψ-Pipeline** - Algebraic topology stages (Nerve → Postnikov → Homotopy → k-Invariants)
4. **WORM Seal** - Write-once-read-many cryptographic witnesses
5. **Admission Validation** - Fail-closed target verification

## Components

### 1. Canonical Serialization (`canonical.rs`)

**Problem:** JSON objects have no canonical ordering:
```json
{"b": 2, "a": 1}  vs  {"a": 1, "b": 2}
```

**Solution:** Sort keys lexicographically before serialization using BTreeMap.

```rust
use prism_skills::canonical_bytes;
use serde_json::json;

let v1 = json!({"b": 2, "a": 1});
let v2 = json!({"a": 1, "b": 2});

assert_eq!(canonical_bytes(&v1), canonical_bytes(&v2));
```

**Invariant:** Same logical value → same byte representation.

### 2. SHA-256d Hashing (`sha256d.rs`)

**Mathematical Definition:**
```
SHA-256d(x) = SHA-256(SHA-256(x))
```

**Purpose:** Prevent length-extension attacks.

```rust
use prism_skills::{hash_bytes, hash_double, snapsha256d};

let data = b"test data";

// Single SHA-256
let single = hash_bytes(data);

// Double SHA-256
let double = hash_double(data);

// SnapSHA256d label format
let label = snapsha256d(data);
// → "snapsha256d:e3b0c44298fc1c149afbf4c8996fb924..."
```

**Properties:**
- **Deterministic:** Same input → same hash
- **Collision-resistant:** Computationally infeasible to find x ≠ y where SHA-256d(x) = SHA-256d(y)
- **Pre-image resistant:** Given h, computationally infeasible to find x where SHA-256d(x) = h
- **Length-extension resistant:** Double hashing prevents length-extension attacks

### 3. ψ-Pipeline (`psi_pipeline.rs`)

**Mathematical Foundation:** Postnikov tower decomposition from algebraic topology.

**Pipeline Stages:**
```
Artifact → Nerve → Postnikov Tower → Homotopy Groups → k-Invariants → Label
```

```rust
use prism_skills::pipeline;
use serde_json::json;

let artifact = json!({
    "type": "artifact",
    "id": "test_123",
    "metadata": {"version": 1}
});

let carrier = pipeline(artifact);
assert!(carrier.label.is_some());
```

**Stage Details:**

1. **Nerve Construction** - Converts category to simplicial set
   - N(C)_0 = objects, N(C)_1 = morphisms, N(C)_n = composable sequences
   - Current: Identity transform (placeholder)

2. **Postnikov Tower** - Sequence of spaces X_n with π_k(X_n) = 0 for k > n
   - Provides k-invariant filtration
   - Current: Identity transform (placeholder)

3. **Homotopy Groups** - π_k(X) = homotopy classes of maps S^k → X
   - π_0 = connected components, π_1 = fundamental group
   - Current: Identity transform (placeholder)

4. **k-Invariants** - k^(n+1) ∈ H^(n+1)(X_n; π_(n+1)(X))
   - Classifies Postnikov tower stages
   - Current: Computes SHA-256d hash as invariant vector

**Non-Recursive:** Staged pipeline, no recursion.

### 4. WORM Seal (`seal.rs`)

**Properties:**
- **Write-once:** Seal cannot be modified after creation
- **Read-many:** Seal can be verified by anyone
- **Timestamped:** Unix timestamp for temporal ordering
- **Content-addressed:** Hash of label + payload + timestamp

```rust
use prism_skills::WormSeal;

// Create seal
let seal = WormSeal::seal("test_label", "test_payload", 42);

// Verify integrity
assert!(seal.verify());

// Tamper detection
let mut tampered = seal.clone();
tampered.payload = "tampered".to_string();
assert!(!tampered.verify()); // Fails!

// Content hash (independent of timestamp)
let content_hash = seal.content_hash();
```

**Seal Format:**
```
WORM:<label>:<payload>:<steps>:<timestamp>
```

### 5. Admission Validation (`admission.rs`)

**Principle:** Fail-closed architecture. Any error terminates processing.

**No fallback. No default. No silent failure.**

```rust
use prism_skills::{AdmissionValidator, PrimeIndexValidator};

// General validator
let validator = AdmissionValidator::new(vec!["allowed".to_string()]).unwrap();
assert!(validator.is_admitted("allowed"));
assert!(!validator.is_admitted("not_allowed"));

// Prime index validator
let prime_validator = PrimeIndexValidator::new(vec![2, 3, 5, 7, 11]).unwrap();
assert!(prime_validator.is_admitted(2));
assert!(!prime_validator.is_admitted(4)); // 4 is not prime
```

**Error Types:**
- `TargetNotInAllowedSet` - Target not in allowed set
- `InvalidTargetFormat` - Target format invalid
- `EmptyAllowedSet` - Allowed set is empty

## Integration Example

Full end-to-end workflow:

```rust
use prism_skills::*;
use serde_json::json;

// 1. Create artifact
let artifact = json!({
    "name": "sovereign_artifact",
    "data": [1, 2, 3],
    "metadata": {"z": 1, "a": 2}
});

// 2. Canonicalize
let canonical = canonical_bytes(&artifact);

// 3. Hash with SHA-256d
let hash = hash_double(&canonical);

// 4. Run through ψ-pipeline
let carrier = pipeline(artifact.clone());
let label = carrier.label.unwrap();

// 5. Create WORM seal
let seal = WormSeal::seal(&label, &serde_json::to_string(&artifact).unwrap(), 5);
assert!(seal.verify());

// 6. Validate admission
let validator = PrimeIndexValidator::new(vec![2, 3, 5, 7, 11]).unwrap();
assert!(validator.is_admitted(5));
```

## Test Results

```
running 25 tests
test admission::tests::test_admission_validator_creation ... ok
test admission::tests::test_empty_target ... ok
test admission::tests::test_empty_allowed_set ... ok
test admission::tests::test_admitted_target ... ok
test admission::tests::test_fail_closed_behavior ... ok
test admission::tests::test_prime_index_validator ... ok
test canonical::tests::test_arrays_preserve_order ... ok
test canonical::tests::test_key_ordering_invariance ... ok
test canonical::tests::test_nested_objects ... ok
test canonical::tests::test_primitives ... ok
test psi_pipeline::tests::test_carrier_construction ... ok
test psi_pipeline::tests::test_carrier_label ... ok
test psi_pipeline::tests::test_deterministic_pipeline ... ok
test psi_pipeline::tests::test_psi_pipeline ... ok
test seal::tests::test_content_hash_deterministic ... ok
test seal::tests::test_content_hash_different_payloads ... ok
test seal::tests::test_seal_creation ... ok
test seal::tests::test_seal_tamper_detection ... ok
test seal::tests::test_seal_verification ... ok
test sha256d::tests::test_deterministic ... ok
test sha256d::tests::test_different_inputs ... ok
test sha256d::tests::test_sha256_empty ... ok
test sha256d::tests::test_sha256d_empty ... ok
test sha256d::tests::test_snapsha256d_format ... ok
test integration_test::test_full_pipeline ... ok

test result: ok. 25 passed; 0 failed
```

## Mathematical Foundations

### Simplicial Sets

A simplicial set X is a sequence of sets X_n (n-simplices) with face and degeneracy maps:
```
d_i : X_n → X_(n-1)  (face maps, i = 0..n)
s_i : X_n → X_(n+1)  (degeneracy maps, i = 0..n)
```

### Nerve Construction

For a category C, the nerve N(C) is a simplicial set where:
```
N(C)_0 = objects of C
N(C)_1 = morphisms of C
N(C)_n = composable sequences of n morphisms
```

### Postnikov Tower

For a space X, the Postnikov tower is a sequence:
```
X → ... → X_3 → X_2 → X_1 → X_0
```
where π_k(X_n) = π_k(X) for k ≤ n and π_k(X_n) = 0 for k > n.

### k-Invariants

```
k^(n+1) ∈ H^(n+1)(X_n; π_(n+1)(X))
```
Classifies the fibration X_(n+1) → X_n.

## Building

```bash
cd prism-skills
cargo build --release
cargo test
```

## Integration with Existing Infrastructure

| Component | Integration Point |
|-----------|------------------|
| `resonance-math/` | SHA-256d used for WORM sealing, entropy for admission scoring |
| `math-skills/` | Canonical serialization for graph enumeration |
| `axiom-proof/` | ψ-pipeline for proof artifact processing |
| `pnp-attack/` | WORM sealing for proof attempts |
| `.agentos/gitbucket/` | WORM ledger integration |

## Source Repository

- **sovereign-prism** — Original Rust implementation (SNAPKITTYWEST/sovereign-prism)

## Architecture

```
sovereign-prism/
├── canonical.rs    (Deterministic JSON)
├── sha256d.rs      (Double SHA-256)
├── psi_pipeline.rs (Algebraic topology)
├── seal.rs         (WORM sealing)
└── admission.rs    (Fail-closed validation)
         │
         ▼
prism-skills/
├── src/            (Integrated modules)
├── tests/          (25 tests)
└── PRISM.md        (This file)
```

## License

Sovereign Source License v1.0
