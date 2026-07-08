⍝ Symmetry Breaking in APL
⍝ Orbit enumeration and search space reduction

∇ orbits ← ComputeOrbits n group;element;visited;orbit_id
    ⍝ Compute orbits of {1..n} under group action
    orbits ← n⍴0
    visited ← n⍴0
    orbit_id ← 0
    
    :For element :In ⍳n
        :If ~visited[element]
            orbit_id ← orbit_id + 1
            orbits[element] ← orbit_id
            visited[element] ← 1
            
            ⍝ Find all elements in same orbit
            :For g :In group
                orbits ← UpdateOrbit orbits visited g element orbit_id
            :EndFor
        :EndIf
    :EndFor
∇

∇ orbits ← UpdateOrbit orbits visited g start orbit_id;current;next
    ⍝ Update orbit assignment
    current ← start
    :While ~visited[current]
        visited[current] ← 1
        orbits[current] ← orbit_id
        next ← g[current]
        :If next ≠ current
            current ← next
        :Else
            →0
        :EndIf
    :EndWhile
∇

∇ rep ← CanonicalOrbitRep group element;candidate
    ⍝ Find canonical (smallest) representative of orbit
    rep ← element
    :For g :In group
        candidate ← g[element]
        :If candidate < rep
            rep ← candidate
        :EndIf
    :EndFor
∇

∇ reduced ← ReduceSearchSpace n group original_size;orbits;num_orbits
    ⍝ Reduce search space by symmetry
    orbits ← ComputeOrbits n group
    num_orbits ← ⌈/orbits
    reduced ← num_orbits
    
    ⎕←'  Reduced from ',(⍕original_size),' to ',(⍕num_orbits)
∇

∇ group ← GenerateSymmetricGroup n;perm
    ⍝ Generate all n! permutations
    group ← ⍬
    :For perm :In Permutations ⍳n
        group ← group,⊂perm
    :EndFor
∇

∇ result ← Permutations items;n
    ⍝ Generate all permutations of items
    n ← ≢items
    result ← ⍬
    :If n=1
        result ← ,⊂items
    :Else
        :For i :In ⍳n
            result ← result,⊂{items[i],⍵}¨Permutations items[~i⍳⍨⍳n]
        :EndFor
    :EndIf
∇

⍝ Example: Reduce Ramsey R(3,3) search space
⍝ Without symmetry: 2^(C(6,2)) = 2^15 = 32768 graphs
⍝ With symmetry: much smaller (exploit S_6 action)
