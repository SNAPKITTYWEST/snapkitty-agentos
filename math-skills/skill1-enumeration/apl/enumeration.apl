⍝ Combinatorial Enumeration in APL
⍝ Concise expression of graph enumeration

∇ result ← EnumerateGraphs n;edges;subsets;canonical_count;g;canonical_forms
    ⍝ Enumerate all non-isomorphic graphs on n vertices
    
    ⍝ Generate all possible edges
    edges ← ⊃,/∘.{(⍺,⍵)}⍨⍳n
    
    ⍝ Generate all subsets of edges (2^|edges| total)
    subsets ← Subsets edges
    
    ⍝ Build graphs from edge subsets
    canonical_forms ← ⍬
    :For subset :In subsets
        g ← BuildGraph n subset
        canonical ← CanonicalForm g
        :If ~canonical ∊ canonical_forms
            canonical_forms ← canonical_forms,⊂canonical
        :EndIf
    :EndFor
    
    result ← canonical_forms
∇

∇ g ← BuildGraph n edges;adj
    ⍝ Build adjacency matrix from edge list
    adj ← n n⍴0
    :For edge :In edges
        adj[edge[1];edge[2]] ← 1
        adj[edge[2];edge[1]] ← 1
    :EndFor
    g ← adj
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

∇ result ← Permutations items;n;perm
    ⍝ Generate all permutations of items
    n ← ≢items
    result ← ⍬
    :If n=1
        result ← ,⊂items
    :Else
        :For i :In ⍳n
            perm ← Permutations items[~i⍳⍨⍳n]
            result ← result,⊂{items[i],⍵}¨perm
        :EndFor
    :EndIf
∇

∇ result ← Subsets items;mask
    ⍝ Generate all subsets of items
    result ← ⍬
    :For mask :In ⊃⍳(2*≢items)⍴2
        result ← result,⊂items/⍨mask
    :EndFor
∇

⍝ Test: Count graphs on n vertices
∇ count ← CountGraphs n;graphs
    graphs ← EnumerateGraphs n
    count ← ≢graphs
∇

⍝ Expected results (OEIS A000088):
⍝ n=1: 1
⍝ n=2: 2
⍝ n=3: 4
⍝ n=4: 11
⍝ n=5: 34

⍝ Example usage:
⍝ graphs5 ← EnumerateGraphs 5
⍝ ≢graphs5  ⍝ Should be 34
