⍝ Hadamard Matrix Construction in APL
⍝ Sylvester, Paley, Williamson constructions

∇ H ← Sylvester k;n;H2
    ⍝ Sylvester construction: H_{2^k}
    n ← 2*k
    H2 ← 2 2⍴1 1 1 ¯1
    
    H ← H2
    :While (≢H) < n
        H ← (H,⍪H) ⍪ (H,⍪¯H)
    :EndWhile
∇

∇ H ← Paley p;legendre;Q
    ⍝ Paley construction for prime p ≡ 3 (mod 4)
    legendre ← LegendreSymbol ⍳p-1
    Q ← p p⍴0
    
    :For i :In ⍳p
        :For j :In ⍳p
            Q[i;j] ← legendre[1+|j-i|]
        :EndFor
    :EndFor
    
    H ← (1+p) (1+p)⍴1
    H[2∘.+⍳p;2∘.+⍳p] ← Q
∇

∇ sym ← LegendreSymbol a;p;power
    ⍝ Compute Legendre symbol (a/p)
    sym ← ⍬
    :For x :In a
        :If x=0
            sym ← sym,0
        :Else
            power ← (x*÷p-1) | p
            :If power=1
                sym ← sym,1
            :Else
                sym ← sym,¯1
            :EndIf
        :EndIf
    :EndFor
∇

∇ H ← Williamson m;A;B
    ⍝ Williamson construction for n=2m
    A ← Circulant m
    B ← Circulant m
    H ← (A,⍪B) ⍪ (B,⍪¯A)
∇

∇ C ← Circulant m;first_row
    ⍝ Construct circulant matrix
    first_row ← 1,¯1+2×IsQuadraticResidue ⍳m-1
    C ← m m⍴0
    :For i :In ⍳m
        C[i;] ← first_row[1+∘.|⍨⍳m]
    :EndFor
∇

∇ result ← IsQuadraticResidue a;n;squares
    ⍝ Check if a is quadratic residue mod n
    squares ← n|∘.*2⍨⍳n
    result ← a∊squares
∇

∇ valid ← IsHadamard H;n;product
    ⍝ Verify H*H' = n*I
    n ← ≢H
    product ← H +.× ⍉H
    valid ← ∧/, product = n×=∘.⍳n
∇

⍝ Example usage:
⍝ H4 ← Sylvester 2
⍝ IsHadamard H4  ⍝ Should be 1
