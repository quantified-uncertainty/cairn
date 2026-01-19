---
title: "Financial Risk Budgeting Methods"
description: "Euler allocation, coherent risk measures, hierarchical risk cascading, and lessons from LTCM, 2008, and risk parity failures"
---

Deep research into how financial institutions decompose portfolio risk to components, and what AI safety can learn from both the mathematics and the failures.

## Euler Allocation and Risk Decomposition

### Mathematical Foundation

The mathematical foundation rests on **Euler's theorem for homogeneous functions**. For any risk measure R(x) that is homogeneous of degree 1:

**R(x) = Σᵢ xᵢ · ∂R(x)/∂xᵢ**

This enables "full allocation" - component risk contributions sum exactly to total portfolio risk, with no gaps and no waste.

### Component VaR, Marginal VaR, Incremental VaR

| Measure | Formula | Use |
|---------|---------|-----|
| **Component VaR** | CoVaR_i = x_i · β_i · VaR_p | Dollar contribution to portfolio VaR. Σ CoVaR_i = Total VaR |
| **Marginal VaR** | MVaR_i = ∂VaR(P)/∂x_i | Sensitivity to position size changes |
| **Incremental VaR** | IVaR = VaR(P+a) - VaR(P) | Actual VaR change from adding position (not additive) |

### Expected Shortfall vs VaR

Expected Shortfall (ES/CVaR) = expected loss in the worst α% of cases:

**ES_α(X) = E[X | X ≥ VaR_α(X)]**

**Why ES is preferred:**
1. **Coherent** - satisfies all four axioms (VaR fails subadditivity)
2. **Subadditive** - diversification always reduces risk
3. **Tail sensitive** - captures severity beyond VaR threshold
4. **Regulatory adoption** - Basel FRTB shifted from VaR to ES at 97.5%

### Hierarchical Risk Cascading in Banks

**Level 1 - Board:** 50-100 high-level quantitative metrics defining risk appetite

**Level 2 - Business Units:** Risk committees allocate limits to lines of business

**Level 3 - Trading Desks:** Market Risk Management allocates to divisions and desks

**Level 4 - Individual Positions:** Traders manage within allocated limits, real-time monitoring

Key distinction: **Limits** are hard constraints (breach blocks business), **thresholds** require reporting to higher instance.

### FSB Risk Appetite Framework (2013)

Required elements:
- Written Risk Appetite Statement linked to strategic/capital plans
- Quantitative limits under normal and stressed conditions
- Hierarchical framework across business lines and legal entities
- Clear roles for board, CEO, CRO, CFO
- Independent assessment by internal audit or third party

---

## Risk Budgeting in Practice

### Risk Parity

Allocate capital so each asset class contributes equally to total portfolio risk:

**σ_p² = Σᵢ RC_i where RC_i = w_i · σ_i · ρ_ip · σ_p**

For equal risk contribution: **RC_i = σ_p²/N** for all i

Since bonds have lower volatility than stocks, risk parity uses **leverage** to scale up bond positions.

**Vulnerability:** Relies on low-to-negative stock-bond correlation. Failed in March 2020 when both declined simultaneously.

### RAROC (Risk-Adjusted Return on Capital)

**RAROC = Risk-Adjusted Return / Economic Capital**

Applications:
- Capital allocation across business units
- Performance comparison on like-for-like basis
- Limit setting: unit creates value if RAROC > cost of equity
- Risk-based pricing

### Trading Desk Limits

Types of limits:
- **VaR Limits:** Maximum portfolio VaR (e.g., $10M daily at 99%)
- **Stress Test Limits:** Maximum loss under predefined scenarios
- **Concentration Limits:** Maximum exposure to single issuers/sectors
- **Position Limits:** Maximum notional by instrument type

Research shows limits are "meaningful and costly for traders to breach" - dealers actively manage positions away from limits.

---

## Key Failures and Lessons

### LTCM 1998

**What went wrong:**
1. **Short historical windows** - 2-3 years of data, missing regime changes
2. **Extreme leverage** - 25:1 on balance sheet, 100:1+ with derivatives ($1.25T notional)
3. **Model overconfidence** - worked in normal conditions, failed in crisis
4. **Correlation breakdown** - historically loose markets became tightly coupled
5. **Liquidity assumptions** - couldn't exit when Russia default triggered flight to quality

In August 1998 alone, LTCM lost 44% of its value. Fed facilitated $3.6B bailout.

**Key insight:** "Separation of quantitative analysis and qualitative analysis" - overconfidence in models, ignored embedded risks.

### 2008 Financial Crisis

**VaR failures:**
- Normal distribution assumption when reality had fat tails
- VaR "significantly underestimated probability of extreme losses"
- UBS acknowledged "shortcuts" excluding risks from calculations
- Correlations assumed stable became 1.0 during crisis
- Liquidity risk largely unmodeled

**Research finding:** "VaR underestimated the risk of loss, while the conditional EVT model performed more accurately" (2010 study).

### March 2020 Risk Parity

Risk parity funds suffered 13-43% drawdowns when COVID triggered simultaneous stock and bond declines.

**What happened:** "Fixed Income as volatility reducer and hedge for equities broke down" - negative stock-bond correlation that persisted since late 1990s rapidly increased to >+0.60.

### Basel Evolution

| Basel | Year | Key Changes |
|-------|------|-------------|
| Basel I | 1988 | Risk-based capital requirements |
| Basel II | 2004 | Internal VaR models permitted |
| Basel III | 2010 | Raised capital minimums, added stressed VaR, leverage ratio |
| FRTB | 2025 | Replace VaR with Expected Shortfall at 97.5% |

---

## Shapley Values for Risk Attribution

### The Shapley Value

For cooperative game with value function v:

**φ_i(v) = Σ_{S⊆N\{i}} [|S|!(n-|S|-1)!/n!] · [v(S∪{i}) - v(S)]**

Averages each player's marginal contribution across all possible coalitions.

### Axiomatic Foundation

Shapley is the **only** solution satisfying:
1. **Efficiency:** Σ_i φ_i(v) = v(N) - all risk allocated
2. **Symmetry:** Equal contributors get equal shares
3. **Additivity:** φ_i(v+w) = φ_i(v) + φ_i(w)
4. **Null Player:** Zero contributors get zero

### Euler vs Shapley

| Property | Euler | Shapley |
|----------|-------|---------|
| Basis | Calculus (derivatives) | Combinatorics (coalitions) |
| Requirements | Differentiable, homogeneous | Any value function |
| Complexity | O(n) | O(2ⁿ) |
| Best for | Continuous weights | Discrete components |

### Computational Challenges

Shapley complexity is O(2ⁿ) - "usually too time expensive" for >25 players.

**Approximations:**
- Monte Carlo sampling
- Ergodic sampling with negatively correlated pairs
- Machine learning approximators (MLSVA)

---

## Coherent Risk Measures

### The Artzner et al. (1999) Axioms

A risk measure ρ is **coherent** if for all X, Y:

1. **Monotonicity:** X ≤ Y ⟹ ρ(Y) ≤ ρ(X)
2. **Translation Invariance:** ρ(X + α) = ρ(X) − α
3. **Positive Homogeneity:** ρ(λX) = λρ(X) for λ > 0
4. **Subadditivity:** ρ(X + Y) ≤ ρ(X) + ρ(Y)

**VaR fails subadditivity** - can discourage diversification.
**Expected Shortfall satisfies all four** - coherent risk measure.

### Subadditivity and Diversification

Subadditivity captures: "a merger does not create extra risk"

- Encourages diversification
- Prevents perverse incentives
- Reflects economic reality: combined risk ≤ sum of individual risks

---

## Applicability to AI Safety

### Required Properties for Decomposition

**For Euler allocation:**
1. Homogeneity of degree 1: R(λx) = λR(x)
2. Differentiability: ∂R/∂x_i must exist
3. Continuity: smooth response to parameters

**For coherence:**
1. Monotonicity: more capable → higher harm measure
2. Translation invariance
3. Positive homogeneity: scaling deployment scales harm
4. Subadditivity: two systems together ≤ sum of individual harms

### Proposed AI Harm Measures

**Multiplicative (CBRA style):**
System Risk = Criticality × Autonomy × Permission × Impact

**Additive (attack surface style):**
AI_Capability_Surface = Σ (capability_class × damage_potential × accessibility)

### Critical Challenges for AI

1. **Systematic vs Random:** Finance assumes random failures with known distributions. AI failures are systematic (bugs, misalignment, emergent capabilities).

2. **Non-stationarity:** Historical AI behavior may not predict future behavior due to learning/adaptation.

3. **Emergence:** Complex interactions may create superlinear risk composition.

4. **Unknown unknowns:** AI uncertainty exceeds financial uncertainty.

### Lessons for AI Safety

From LTCM/2008/2020 failures:
- **Don't trust short historical windows** - regime changes happen
- **Leverage amplifies model errors** - conservative margins essential
- **Correlations break under stress** - independence assumptions fail precisely when needed
- **Tail risks matter** - use ES not VaR, capture severity not just probability
- **Liquidity/capability crises cascade** - model interconnections

---

## Key Citations

### Seminal Papers

1. **Artzner, P., Delbaen, F., Eber, J.-M., & Heath, D. (1999)**. "Coherent Measures of Risk." *Mathematical Finance*, 9(3), 203-228.

2. **Acerbi, C., & Tasche, D. (2002)**. "Expected Shortfall: A Natural Coherent Alternative to Value at Risk." *Economic Notes*, 31(2), 379-388.

3. **Tasche, D. (2007)**. "Capital Allocation to Business Units and Sub-Portfolios: the Euler Principle." arXiv:0708.2542

4. **McNeil, A.J., Frey, R., & Embrechts, P. (2005)**. *Quantitative Risk Management.* Princeton University Press.

### Regulatory Documents

5. **Financial Stability Board (2013)**. "Principles for an Effective Risk Appetite Framework."

6. **Basel Committee**. "Fundamental Review of the Trading Book (FRTB)."

### Historical Failures

7. **Federal Reserve History**. "Long-Term Capital Management and the Federal Reserve's Response."

8. **Wikipedia**. "2008 Financial Crisis."

9. **Advisor Perspectives (2020)**. "Risk Parity in the Time of COVID."
