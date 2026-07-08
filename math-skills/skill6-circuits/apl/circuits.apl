⍝ Circuit Complexity in APL
⍝ Boolean circuit simulation and analysis

∇ output ← EvaluateCircuit circuit inputs;gate_outputs;i;in1;in2
    ⍝ Evaluate circuit on input
    gate_outputs ← (⍴circuit)⍴0
    
    :For i :In ⍳⍴circuit
        :Select circuit[i;1]  ⍝ Gate type
        :Case 5  ⍝ INPUT
            gate_outputs[i] ← inputs[circuit[i;2]]
        :Case 1  ⍝ AND
            in1 ← circuit[i;2]
            in2 ← circuit[i;3]
            gate_outputs[i] ← gate_outputs[in1] ∧ gate_outputs[in2]
        :Case 2  ⍝ OR
            in1 ← circuit[i;2]
            in2 ← circuit[i;3]
            gate_outputs[i] ← gate_outputs[in1] ∨ gate_outputs[in2]
        :Case 3  ⍝ NOT
            in1 ← circuit[i;2]
            gate_outputs[i] ← ~gate_outputs[in1]
        :Case 4  ⍝ XOR
            in1 ← circuit[i;2]
            in2 ← circuit[i;3]
            gate_outputs[i] ← gate_outputs[in1] ≠ gate_outputs[in2]
        :EndSelect
    :EndFor
    
    output ← gate_outputs[⍴circuit]
∇

∇ (n_and n_or n_not n_xor) ← CountGates circuit
    ⍝ Count gates by type
    n_and ← +/circuit[;1]=1
    n_or ← +/circuit[;1]=2
    n_not ← +/circuit[;1]=3
    n_xor ← +/circuit[;1]=4
∇

∇ depth ← CircuitDepth circuit;gate_depths;i;in1;in2
    ⍝ Compute circuit depth
    gate_depths ← (⍴circuit)⍴0
    
    :For i :In ⍳⍴circuit
        :Select circuit[i;1]
        :Case 5  ⍝ INPUT
            gate_depths[i] ← 0
        :Case 3  ⍝ NOT
            in1 ← circuit[i;2]
            gate_depths[i] ← gate_depths[in1] + 1
        :Case 1 2 4  ⍝ AND, OR, XOR
            in1 ← circuit[i;2]
            in2 ← circuit[i;3]
            gate_depths[i] ← (⌈/gate_depths[in1 in2]) + 1
        :EndSelect
    :EndFor
    
    depth ← ⌈/gate_depths
∇

∇ circuit ← BuildParityCircuit n;i
    ⍝ Build parity circuit (XOR of all inputs)
    circuit ← (2×n-1) 3⍴0
    
    ⍝ Input gates
    :For i :In ⍳n
        circuit[i;] ← 5 i 0  ⍝ INPUT gate
    :EndFor
    
    ⍝ XOR tree
    :For i :In 1⍳n-1
        circuit[n+i;1] ← 4  ⍝ XOR gate
        :If i=1
            circuit[n+i;2 3] ← 1 2
        :Else
            circuit[n+i;2 3] ← n+i-1 i+1
        :EndIf
    :EndFor
∇

⍝ Example usage:
⍝ circuit ← BuildParityCircuit 4
⍝ output ← EvaluateCircuit circuit 1 0 1 0
⍝ depth ← CircuitDepth circuit
