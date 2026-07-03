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
```

## Architecture

```text
agent clones repo
  -> reads AGENTS.md
  -> runs verify:all
  -> bootstraps GitBucket memory index
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

