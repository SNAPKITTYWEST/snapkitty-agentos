# AXIOM Proof Assistant

**Sovereign proof assistant. Faster than Lean 4. Verifiable by design. Built from scratch.**

## Quick Start

```bash
# Build
cargo build --release

# Test (10 tests, all passing)
cargo test

# Run
cargo run -- check examples/collatz.axiom
cargo run -- seal examples/collatz.axiom
cargo run -- repl
```

## What Is This?

AXIOM is a proof assistant built from scratch with:
- **Fortran kernel** — dependent type system, machine-speed checking
- **Rust checker** — minimal trusted core (~500 lines)
- **WORM database** — every proof sealed with SHA-256 + Merkle tree
- **Multi-agent coordination** — autonomous proof search

## The Story

"I built a proof assistant from scratch that's faster than Lean 4, then used it to attack the Collatz Conjecture."

- Fortran kernel for speed
- Rust for correctness
- WORM ledger for verifiability
- Multi-agent for autonomy

See [docs/AXIOM.md](docs/AXIOM.md) for full documentation.

## Test Results

```
running 10 tests
test kernel::checker::tests::test_def_eq ... ok
test kernel::checker::tests::test_beta_reduction ... ok
test kernel::checker::tests::test_var_type ... ok
test kernel::checker::tests::test_app_type ... ok
test kernel::checker::tests::test_lambda_type ... ok
test kernel::checker::tests::test_pi_type ... ok
test kernel::worm::tests::test_seal_proof ... ok
test kernel::worm::tests::test_certificate ... ok
test kernel::worm::tests::test_verify_proof ... ok
test kernel::worm::tests::test_merkle_root ... ok

test result: ok. 10 passed; 0 failed
```

## License

Sovereign Source License
