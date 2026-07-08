import Lake
open Lake DSL

package collatz_proofs

lean_lib Collatz where
  srcDir := "."

require mathlib from git
  "https://github.com/leanprover-community/mathlib4.git"
