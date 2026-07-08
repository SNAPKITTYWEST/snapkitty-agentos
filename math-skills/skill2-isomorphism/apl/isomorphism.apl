⍝ Graph Isomorphism in APL
⍝ Canonical labeling and isomorphism detection

∇ result ← AreIsomorphic g1 g2;canon1;canon2
    ⍝ Check if two graphs are isomorphic
    :If (≢g1) ≠ ≢g2
        result ← 0
        →0
    :EndIf
    
    canon1 ← CanonicalForm g1
    canon2 ← CanonicalForm g2
    
    result ← ∧/, canon1 = canon2
∇

∇ canonical ← CanonicalForm g;perms;permuted;min_form
    ⍝ Compute canonical form (lexicographically smallest)
    perms ← Permutations ⍳≢g
    min_form ← g
    :For perm :In perms
        permuted ← g[perm;perm]
        :If (∊permuted) < ∊min_form
            min_form ← permuted
        :EndIf
    :EndFor
    canonical ← min_form
∇

∇ hash ← GraphHash g;canonical
    ⍝ Compute hash of canonical form
    canonical ← CanonicalForm g
    hash ← +/, canonical × (⍳≢canonical) ∘.× ⍳≢canonical
∇

∇ result ← Permutations items;n;perm
    ⍝ Generate all permutations
    n ← ≢items
    result ← ⍬
    :If n=1
        result ← ,⊂items
    :Else
        :For i :In ⍳n
            perm ← Permutations items[~i⍳⍨⍳n]
            result ← result,⊂{items[i],⍵}¨perm
        :EndIf
    :EndIf
∇

⍝ Example usage:
⍝ g1 ← 4 4⍴0 1 0 0 1 0 1 0 0 1 0 1 0 0 1 0  ⍝ Path graph
⍝ g2 ← 4 4⍴0 0 0 1 0 0 1 0 0 1 0 0 1 0 0 0  ⍝ Same path, different order
⍝ AreIsomorphic g1 g2  ⍝ Should be 1
