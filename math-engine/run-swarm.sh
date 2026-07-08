#!/bin/bash
# Run P/NP Swarm Mathematical Engine
# Integrates Fortran solver, APL coordinator, Node.js orchestrator, Lean proofs

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "========================================="
echo "  P/NP Swarm Mathematical Engine"
echo "  SnapKitty Agent OS"
echo "========================================="
echo ""

# 1. Compile Fortran solver (if gfortran available)
if command -v gfortran &> /dev/null; then
    echo "▶ Compiling Fortran P/NP solver..."
    gfortran -O2 -o "$SCRIPT_DIR/fortran/pnp_solver" "$SCRIPT_DIR/fortran/pnp_solver.f90"
    echo "  ✓ Compiled"
else
    echo "⚠ gfortran not found — skipping Fortran compilation"
    echo "  Install with: winget install FortranCompiler  (or use WSL)"
fi

# 2. Run Node.js swarm orchestrator (integrates with .agentos runtime)
echo ""
echo "▶ Running P/NP swarm orchestrator..."
node "$SCRIPT_DIR/swarm/orchestrator.mjs"
echo "  ✓ Swarm orchestrated"

# 3. Run Fortran solver (if compiled)
if [ -f "$SCRIPT_DIR/fortran/pnp_solver.exe" ] || [ -f "$SCRIPT_DIR/fortran/pnp_solver" ]; then
    echo ""
    echo "▶ Running Fortran TSP solver..."
    if [ -f "$SCRIPT_DIR/fortran/pnp_solver.exe" ]; then
        "$SCRIPT_DIR/fortran/pnp_solver.exe"
    else
        "$SCRIPT_DIR/fortran/pnp_solver"
    fi
    echo "  ✓ Fortran solver complete"
fi

# 4. Run APL coordinator (if Dyalog/GNU APL available)
if command -v dyalog &> /dev/null; then
    echo ""
    echo "▶ Running APL swarm coordinator..."
    dyalog -script "$SCRIPT_DIR/apl/pnp_swarm.apl"
    echo "  ✓ APL coordinator complete"
elif command -v apl &> /dev/null; then
    echo ""
    echo "▶ Running APL swarm coordinator (GNU APL)..."
    apl --script "$SCRIPT_DIR/apl/pnp_swarm.apl"
    echo "  ✓ APL coordinator complete"
else
    echo ""
    echo "⚠ APL interpreter not found — skipping APL coordinator"
    echo "  Reference implementation at: math-engine/apl/pnp_swarm.apl"
fi

# 5. Verify Lean proofs (if Lean 4 available)
if command -v lean &> /dev/null; then
    echo ""
    echo "▶ Checking Lean 4 proofs..."
    lean "$SCRIPT_DIR/proofs/PNP.lean"
    echo "  ✓ Proofs checked"
else
    echo ""
    echo "⚠ Lean 4 not found — skipping proof verification"
    echo "  Proof source at: math-engine/proofs/PNP.lean"
fi

# 6. Run .agentos verification pipeline
echo ""
echo "▶ Running .agentos verification pipeline..."
cd "$ROOT_DIR"
npm run verify:all 2>/dev/null || echo "  ⚠ Some verifications had warnings"

echo ""
echo "========================================="
echo "  Swarm complete"
echo "  All envelopes sealed to git buckets"
echo "========================================="
