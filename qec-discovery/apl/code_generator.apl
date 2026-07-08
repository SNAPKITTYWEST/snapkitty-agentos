⍝ Quantum Error Correction: APL Code Generator
⍝ Systematic exploration of stabilizer codes
⍝ Generates candidate codes and tests properties

∇ result ← GenerateStabilizerCode n k;S;i;j;pauli
    ⍝ Generate random stabilizer code [[n,k,d]]
    ⍝ n: physical qubits, k: logical qubits
    
    ⍝ Need n-k stabilizer generators
    S ← ⍬
    :For i :In ⍳(n-k)
        ⍝ Random Pauli string (I,X,Y,Z = 0,1,2,3)
        pauli ← ?(n⍴4)
        S ← S,⊂pauli
    :EndFor
    
    ⍝ Verify commutativity (all stabilizers must commute)
    :If ~VerifyCommutativity S
        result ← ⍬  ⍝ Invalid code
        →0
    :EndIf
    
    ⍝ Compute distance (simplified)
    d ← ComputeDistance S n
    
    result ← (n k d S)
∇

∇ valid ← VerifyCommutativity stabilizers;s1;s2
    ⍝ Check if all stabilizers commute
    valid ← 1
    :For s1 :In stabilizers
        :For s2 :In stabilizers
            :If ~Commute s1 s2
                valid ← 0
                →0
            :EndIf
        :EndFor
    :EndFor
∇

∇ commutes ← Commute p1 p2;pauli_product
    ⍝ Check if two Pauli strings commute
    ⍝ Pauli strings commute if they differ in even number of positions
    ⍝ where both are non-identity and different
    
    pauli_product ← +/((p1≠0)∧(p2≠0)∧(p1≠p2))
    commutes ← ~2|pauli_product  ⍝ Even number of anti-commuting pairs
∇

∇ d ← ComputeDistance stabilizers n;min_weight;weight;error
    ⍝ Compute code distance (minimum weight logical operator)
    ⍝ Simplified: search for low-weight errors
    
    min_weight ← n  ⍝ Start with maximum
    
    ⍝ Search for errors of weight 1, 2, 3, ...
    :For weight :In ⍳3
        :For each error of weight weight
            ⍝ Check if error commutes with all stabilizers
            ⍝ but is not in stabilizer group
            :If (CommutesWithAll error stabilizers) ∧ (~InStabilizerGroup error stabilizers)
                min_weight ← ⌊/min_weight weight
            :EndIf
        :EndFor
    :EndFor
    
    d ← min_weight
∇

∇ result ← SearchCodeSpace n_min n_max;best_code;best_score;code;score
    ⍝ Systematic search over code parameters
    
    best_code ← ⍬
    best_score ← 0
    
    :For n :In ⍳(n_max-n_min+1)+n_min-1
        :For k :In ⍳n-1
            code ← GenerateStabilizerCode n k
            :If code ≢ ⍬  ⍝ Valid code
                ⍝ Score: balance rate, distance, and threshold
                rate ← k÷n
                score ← rate × code[3] × 0.01  ⍝ Simplified threshold
                
                :If score > best_score
                    best_score ← score
                    best_code ← code
                    ⎕←'Found: [[',n,',',k,',',code[3],']] rate=',rate
                :EndIf
            :EndIf
        :EndFor
    :EndFor
    
    result ← (best_code best_score)
∇

∇ sealed ← SealToWORM code;hash;timestamp
    ⍝ Seal discovered code to WORM ledger
    hash ← SHA256 ⍕code
    timestamp ← ⍕⎕TS
    sealed ← 'qec-',hash,'-',timestamp
    ⍝ Append to ledger
    'qec_worm.jsonl' AppendToFile sealed,'|',⍕code
∇

⍝ Known codes for comparison
∇ codes ← KnownCodes
    ⍝ Return list of known quantum codes
    codes ← ⊂
        (5,1,3)   ⍝ Perfect code
        (7,1,3)   ⍝ Steane code
        (9,1,3)   ⍝ Shor code
        (23,1,7)  ⍝ Golay-based code
∇

⍝ Surface code benchmark
∇ surface ← SurfaceCode d
    ⍝ Surface code with distance d
    ⍝ Uses 2d²-1 physical qubits, encodes 1 logical qubit
    surface ← (2×d*2)-1
    surface ← (surface,1,d)
∇

⍝ Example usage:
⍝ result ← SearchCodeSpace 5 15
⍝ best_code ← result[1]
⍝ best_score ← result[2]
⍝ SealToWORM best_code
