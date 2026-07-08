# P/NP Swarm Mathematical Engine

Rigorous mathematical engine for P/NP problem solving with cryptographic envelope verification and git bucket integration.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  APL Swarm Coordinator (apl/pnp_swarm.apl)                  │
│  Distributes problems → complexity-classified buckets       │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  Fortran Numerical Solver (fortran/pnp_solver.f90)          │
│  Branch & bound TSP, nearest-neighbor, envelope sealing     │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  Node.js Orchestrator (swarm/orchestrator.mjs)              │
│  Seals solutions → .agentos/gitbucket with SHA-256 seals   │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  Lean 4 Formal Proofs (proofs/PNP.lean)                     │
│  Verifiable correctness of envelope + solution properties   │
└─────────────────────────────────────────────────────────────┘
```

## Components

| Component | Language | Purpose |
|-----------|----------|---------|
| `apl/pnp_swarm.apl` | APL | Problem distribution across buckets |
| `fortran/pnp_solver.f90` | Fortran | High-performance TSP solver (exact + heuristic) |
| `proofs/PNP.lean` | Lean 4 | Formal proofs of envelope validity |
| `swarm/orchestrator.mjs` | Node.js | Integration with .agentos runtime |

## Quick Start

```bash
# Run full swarm pipeline
./math-engine/run-swarm.sh

# Or run components individually:
node math-engine/swarm/orchestrator.mjs          # Node.js orchestrator
gfortran -o solver math-engine/fortran/pnp_solver.f90 && ./solver  # Fortran solver
lean math-engine/proofs/PNP.lean                 # Lean proofs (requires Lean 4)
```

## Integration with .agentos

The orchestrator integrates directly with the Agent OS runtime:

- **GitBucket**: Solutions sealed as `memory-bucket-v2` records in `.agentos/gitbucket/buckets/`
- **P/NP Registry**: Reads problems from `.agentos/pnp/problem_registry.json`
- **Solution Pool**: Writes verified solutions to `.agentos/pnp/solution_pool/`
- **Seals**: SHA-256 envelope seals in `.agentos/gitbucket/seals/`

## Problem Types

| Problem | Complexity | Solver | Verification |
|---------|-----------|--------|--------------|
| TSP (6 cities) | NP-hard | Branch & bound + NN heuristic | Envelope seal |
| SAT (50 clauses) | NP-complete | DPLL (stub) | Envelope seal |
| SORT (1000 elements) | P | Quicksort | Envelope seal |
| Registry problems | Mixed | Per .agentos/pnp/registry | P-time verifyFn |

## Envelope Format

Each solution is sealed with:
- SHA-256 hash of solution data
- Problem ID reference
- Solver agent ID
- Timestamp
- Git bucket assignment

## Why This Matters

**Standard approach:** Solve problem → return answer → hope it's correct

**SnapKitty approach:**
1. Solve in Fortran (performance)
2. Distribute via APL (elegance)
3. Seal with SHA-256 (integrity)
4. Prove with Lean 4 (correctness)
5. Store in git buckets (auditability)
6. Verify with .agentos pipeline (trust)

Every solution has cryptographic proof it was generated, verified, and immutably stored.
