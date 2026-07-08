⍝ Probabilistic Method in APL
⍝ Random graphs and Monte Carlo simulation

∇ adj ← RandomGraph n p;r
    ⍝ Generate random graph G(n,p)
    adj ← n n⍴0
    :For i :In ⍳n
        :For j :In (i+1)⍳n
            r ← ?0
            :If r < p
                adj[i;j] ← 1
                adj[j;i] ← 1
            :EndIf
        :EndFor
    :EndFor
∇

∇ size ← MaxClique adj;n;clique;can_add
    ⍝ Find maximum clique (greedy)
    n ← ≢adj
    clique ← ,1
    
    :For i :In 2⍳n
        can_add ← 1
        :For j :In clique
            :If adj[i;j] = 0
                can_add ← 0
                →skip
            :EndIf
        :EndFor
        clique ← clique,i
    skip:
    :EndFor
    
    size ← ≢clique
∇

∇ (avg max) ← MonteCarloClique n p trials;adj;clique;total
    ⍝ Monte Carlo estimation of clique size
    total ← 0
    max ← 0
    
    :For trial :In ⍳trials
        adj ← RandomGraph n p
        clique ← MaxClique adj
        total ← total + clique
        :If clique > max
            max ← clique
        :EndIf
    :EndFor
    
    avg ← total ÷ trials
∇

∇ n_lower ← EstimateRamseyBound k;n;prob
    ⍝ Estimate Ramsey number lower bound
    ⍝ R(k,k) > n if C(n,k) × 2^(1-C(k,2)) < 1
    n ← k
    :While 1
        prob ← (Combination n k) × 2*1-Combination k 2
        :If prob ≥ 1
            →done
        :EndIf
        n ← n + 1
        :If n > 100
            →done
        :EndIf
    :EndWhile
done:
    n_lower ← n
∇

∇ c ← Combination n k;num;den
    ⍝ Compute binomial coefficient C(n,k)
    num ← ×/n-⍳k
    den ← ×/⍳k
    c ← num ÷ den
∇

⍝ Example usage:
⍝ (avg max) ← MonteCarloClique 10 0.5 1000
⍝ n_lower ← EstimateRamseyBound 4
