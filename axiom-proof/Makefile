# AXIOM Proof Assistant - Makefile
# Compiles Fortran kernel and Rust components

.PHONY: all kernel rust test clean

all: kernel rust

# Compile Fortran type theory kernel
kernel:
	@echo "▶ Compiling Fortran type theory kernel..."
	gfortran -c -O3 -o src/kernel/types.o src/kernel/types.f90
	@echo "✓ Fortran kernel compiled"

# Build Rust components
rust:
	@echo "▶ Building Rust proof checker..."
	cargo build --release
	@echo "✓ Rust components built"

# Run all tests
test:
	@echo "▶ Running tests..."
	cargo test
	@echo "✓ All tests passed"

# Clean build artifacts
clean:
	cargo clean
	rm -f src/kernel/*.o
	rm -f axiom_worm.jsonl

# Run AXIOM REPL
repl:
	cargo run -- repl

# Check a file
check:
	@if [ -z "$(FILE)" ]; then echo "Usage: make check FILE=examples/collatz.axiom"; exit 1; fi
	cargo run -- check $(FILE)

# Seal proofs to WORM ledger
seal:
	@if [ -z "$(FILE)" ]; then echo "Usage: make seal FILE=examples/collatz.axiom"; exit 1; fi
	cargo run -- seal $(FILE)
