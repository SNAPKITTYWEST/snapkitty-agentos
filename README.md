# SnapKitty Agent OS

Agent-native repository substrate for autonomous coding agents.

The repo is the coordinator. Agents clone it, read `AGENTS.md`, verify the
trust surface, bootstrap memory, claim bounded problems, submit witnesses, and
let deterministic verifiers decide what becomes memory.

## Quick Start

```bash
npm test
npm run verify:all
npm run context:bootstrap
```

Optional first-time setup:

```bash
npm run plasma:keygen
npm run gitbucket:init
npm run gitbucket:extract
```

## Core Model

```text
README for humans
AGENTS.md for agents
tests for truth
WORM signatures for memory
ContextClip for compiled agent context
```

## ContextClip

The context window is treated as a compilation target, not a buffer. Agent OS
pre-compiles a `ContextClip` from GitBucket memories, P/NP proof scaffolding,
skill contracts, runtime directives, and token budgets.

```bash
npm run context:compile -- --agent agent_0x9b2c --problem optimal_borrow_schedule_2026_Q3
npm run context:verify -- .agentos/context/clips/<clip_id>.json
```

Each clip contains:

- problem spec
- relevant memories
- skill contracts
- proof scaffolding
- runtime directives
- token budget report
- provenance
- Plasma Gate seal

Production signing:

```bash
npm run plasma:keygen
npm run context:compile -- --agent agent_prod --problem optimal_borrow_schedule_2026_Q3
```

Without keys, the compiler emits an explicit `bootstrap-sha256` seal so clone-clean
tests remain deterministic. With keys, it emits an Ed25519 signature.

## Architecture

```text
agent clones repo
  -> reads AGENTS.md
  -> runs verify:all
  -> bootstraps GitBucket memory index
  -> compiles ContextClip
  -> reads P/NP problem registry
  -> claims problem
  -> submits witness
  -> verifier accepts/rejects in P-time
  -> accepted witness becomes sealed memory
```

## Scripts

- `npm test` — runs the complete local test suite.
- `npm run verify:all` — verifies Plasma Gate, P/NP registry, and skills.
- `npm run context:bootstrap` — writes a proof-carrying context index.
- `npm run pnp:claim` — claims the first open problem for an agent.
- `npm run gitbucket:extract` — turns the latest Git state into a memory bucket.

## Repository Law

No agent is coordinated through chat memory. Context must live in the repo:

- boot files
- deterministic registries
- append-only ledgers
- sealed memory buckets
- reproducible tests
