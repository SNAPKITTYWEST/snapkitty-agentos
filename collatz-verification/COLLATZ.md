# Collatz Conjecture Verification System

Production infrastructure to formally verify and computationally search the Collatz Conjecture (3n+1 problem) — an 87-year-old unsolved problem in mathematics.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Multi-Agent Coordination                                       │
│  ATLAS (orchestration) → TENSOR (compute) → LEDGE (verify)     │
│  → AXIOM (accounting)                                          │
└────────────────┬────────────────────────────────────────────────┘
                 │
    ┌────────────┼────────────┐
    ▼            ▼            ▼
┌────────┐ ┌──────────┐ ┌──────────┐
│  Rust  │ │  Lean 4  │ │ Frontend │
│ Engine │ │  Proofs  │ │  (HTML)  │
└───┬────┘ └────┬─────┘ └────┬─────┘
    │           │            │
    ▼           ▼            ▼
┌─────────────────────────────────────────────────────────────────┐
│  WORM Ledger + Merkle Tree                                      │
│  Every trajectory sealed with SHA-256, immutable audit trail    │
└─────────────────────────────────────────────────────────────────┘
```

## Components

### 1. Rust Computational Engine (`engine/`)

Parallel trajectory search with rayon, targeting up to 10^15.

```rust
// Compute single trajectory
let trajectory = compute_trajectory(27);
// → length=112, max_value=9232

// Parallel search across range
let trajectories = parallel_search(1, 1_000_000);
// → rayon distributes across all cores

// Merkle root of all trajectories
let root = compute_merkle_root(&trajectories);
```

**Key functions:**
- `compute_trajectory(n)` — full trajectory from n to 1
- `parallel_search(start, end)` — rayon-parallelized range search
- `find_max_length(start, end)` — longest trajectory in range
- `compute_merkle_root(trajectories)` — tamper-proof audit root
- `seal_to_worm(trajectory, merkle_root)` — WORM ledger entry

### 2. Lean 4 Formal Proofs (`proofs/`)

Partial formalization of Collatz properties:

- `collatz(n)` — the 3n+1 function definition
- `reaches_one(n)` — formal statement of the conjecture
- `even_decreases` — even numbers always decrease
- `pow_two_reaches_one` — powers of 2 always reach 1
- `double_reaches` — if n→1 then 2n→1
- `merkle_valid` — Merkle root integrity property
- `worm_immutable` — WORM ledger immutability axiom

### 3. Frontend Visualizer (`frontend/`)

Pure HTML/CSS/JS visualization with:
- Real-time trajectory display (color-coded odd/even steps)
- Parallel search across ranges
- WORM ledger audit trail
- SHA-256 seal generation per trajectory
- Responsive dark theme

### 4. REST API (`api/`)

Axum server with three endpoints:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/verify?n=27` | GET | Compute and verify single trajectory |
| `/search?start=1&end=1000` | GET | Parallel search with Merkle root |
| `/seal?n=27` | POST | Seal trajectory to WORM ledger |
| `/health` | GET | Health check |

### 5. WORM Ledger (`ledger/`)

Immutable audit trail:
- `collatz_worm.jsonl` — append-only ledger of all sealed trajectories
- `merkle_root.txt` — current Merkle root hash
- Every entry: `{trajectory_hash, start_value, length, timestamp, merkle_proof}`

## Multi-Agent Protocol

| Agent | Role | Responsibility |
|-------|------|----------------|
| **ATLAS** | Orchestration | Coordinates search ranges, distributes work |
| **TENSOR** | Computation | Runs Rust engine, parallel trajectory search |
| **LEDGE** | Verification | Lean 4 proofs, validates trajectory correctness |
| **AXIOM** | Accounting | Merkle tree maintenance, WORM ledger writes |

### Coordination Flow

```
1. ATLAS receives search request (start=1, end=10^6)
2. ATLAS partitions range → sends chunks to TENSOR
3. TENSOR computes trajectories in parallel (rayon)
4. TENSOR returns trajectories → LEDGE verifies each
5. LEDGE confirms all reach 1 → AXIOM computes Merkle root
6. AXIOM seals all to WORM ledger with SHA-256 + Merkle proof
7. ATLAS returns result with merkle_root for audit
```

## Building

```bash
# Build Rust engine + API
cd collatz-verification
cargo build --release

# Run tests
cargo test

# Run parallel search
cargo run --release --bin collatz-search -- 1 1000000

# Start API server
cargo run --release --bin collatz-api
# → http://127.0.0.1:3000/verify?n=27
```

## Verification

```bash
# Test trajectory correctness
cargo test -- --nocapture

# Verify Lean proofs (requires Lean 4 + Mathlib)
cd proofs && lake build

# Check WORM ledger integrity
cat ledger/collatz_worm.jsonl | wc -l  # count entries
cat ledger/merkle_root.txt              # current root
```

## GitHub Pages Deploy

Frontend deploys automatically via GitHub Actions on push to `main`.

URL: `https://snapkittywest.github.io/snapkitty-agentos/collatz-verification/frontend/`

## Mathematical Significance

The Collatz Conjecture (1937) states: *every positive integer eventually reaches 1 under the iteration n → 3n+1 (odd) or n → n/2 (even).*

This system provides:
1. **Computational evidence** — parallel search up to 10^15
2. **Formal partial proofs** — Lean 4 verification of special cases
3. **Immutable audit** — WORM ledger with Merkle tree
4. **Multi-agent coordination** — distributed verification protocol

While the full conjecture remains unproven, this infrastructure enables systematic computational search with cryptographic verification of every result.
