---
title: "Compositional Risk Measures"
description: "Coherent risk measures, Euler allocation, Markov categories, linear logic, and spectral measures"
---

Mathematical foundations for risk measures that compose properly across AI system components.

## Coherent Risk Measures (Artzner et al. 1999)

### The Four Axioms

A risk measure ρ is **coherent** if it satisfies:

| Axiom | Formula | Meaning |
|-------|---------|---------|
| **Monotonicity** | X ≤ Y a.s. ⟹ ρ(X) ≤ ρ(Y) | Lower losses = lower risk |
| **Translation Invariance** | ρ(X + α) = ρ(X) − α | Adding cash reduces risk by that amount |
| **Positive Homogeneity** | ρ(λX) = λρ(X) for λ ≥ 0 | Double position = double risk |
| **Subadditivity** | ρ(X + Y) ≤ ρ(X) + ρ(Y) | Diversification doesn't increase risk |

**Subadditivity is the most critical axiom** - it captures "a merger does not create extra risk."

### Why VaR Fails Subadditivity

VaR can violate subadditivity with heavy-tailed distributions:

**Bond portfolio example:**
- Concentrated portfolio (100 units of 1 bond): VaR₀.₉₅ = −500 (a gain!)
- Diversified portfolio (1 unit each of 100 bonds): VaR₀.₉₅ = 25

VaR says diversified portfolio is riskier - contradicts financial intuition.

**General result:** VaR is subadditive for normal distributions but **fails for heavy tails**.

### Why Expected Shortfall is Coherent

**Expected Shortfall (ES/CVaR):** Average loss in the worst (1-α)% of cases.

**ES_α(X) = E[X | X ≥ VaR_α(X)]**

ES satisfies all four axioms. It overcomes VaR's limitations by:
- Providing information about losses beyond VaR threshold
- Averaging tail losses rather than focusing on single quantile
- Encouraging diversification through subadditivity

**Regulatory adoption:** Basel III shifted from VaR to ES at 97.5%.

### The Representation Theorem

**Any coherent risk measure can be written as:**

**ρ(X) = sup_{Q ∈ P} E_Q[−X]**

where P is a set of probability measures (the "risk envelope").

**Interpretation:** Coherent risk = worst-case expected loss across multiple probability models.

---

## Euler's Theorem and Risk Allocation

### Homogeneous Functions

A function f is **homogeneous of degree k** if:

**f(cx) = c^k · f(x)** for any c > 0

For degree 1: f(cx) = c·f(x) (linear scaling).

### Euler's Theorem

For homogeneous functions of degree k:

**k·f(x) = Σᵢ xᵢ·(∂f/∂xᵢ)**

For degree 1 risk measures:

**RM(x) = Σᵢ xᵢ·(∂RM/∂xᵢ)**

### Why This Enables Full Allocation

The **risk contribution** of component i is:

**RC_i = x_i · (∂RM/∂x_i)**

Key property: **Σᵢ RC_i = RM** (full allocation)

This means component risk contributions sum exactly to total risk - no gaps, no waste.

### Key Equivalences

| Property | Risk Measure Property |
|----------|----------------------|
| Positive homogeneity | Full allocation |
| Subadditivity | "No undercut" |
| Translation invariance | Riskless allocation |

**Critical result:** Full allocation and RORAC compatibility hold simultaneously **if and only if** risk measure is homogeneous of degree 1.

### Risk Measures with This Property

- Portfolio standard deviation σ_p(x)
- Value-at-Risk VaR
- Expected Shortfall ES
- All spectral risk measures
- All coherent risk measures

---

## Compositional Properties

### Types of Composition

| Type | Formula | When It Applies |
|------|---------|-----------------|
| **Additive** | R_total = Σ R_i | Independent linear risks |
| **Multiplicative** | R_total = Π R_i | Series reliability |
| **Sub-additive** | R_total < Σ R_i | Diversification benefit |
| **Super-additive** | R_total > Σ R_i | Common-cause failures |

### Fault Tree Logic

**OR Gate:** Output fails if ANY input fails
- P(failure) ≈ Σp_i for small probabilities
- Models "parallel in failure space"

**AND Gate:** Output fails only if ALL inputs fail
- P(failure) = Πp_i
- Models redundancy success

### Assume-Guarantee Contracts

**Contract structure:** (Assumptions, Guarantees)
- Assumptions: Properties environment must satisfy
- Guarantees: Properties component delivers under assumptions

**Compositional verification:** Verify component contracts individually, compose to prove system properties.

**Recent tools:** Pacti for efficient contract computation, AGREE for architectural verification.

---

## Markov Categories

### Fritz (2020) Framework

**Markov categories** provide categorical foundations for compositional probability.

**Core idea:** A symmetric monoidal category where morphisms behave like "random functions."

### Morphisms as Probabilistic Processes

| Morphism | Interpretation |
|----------|----------------|
| p : 1 → X | Probability distribution on X |
| k : X → Y | Markov kernel / channel |
| Δ_X : X → X ⊗ X | Copy information |
| !_X : X → I | Delete information |

### Composition Operations

**Sequential:** f : X → Y and g : Y → Z compose to g ∘ f : X → Z

**Parallel:** f : X → Y and g : W → Z compose to f ⊗ g : X ⊗ W → Y ⊗ Z

### Relevance to AI Safety

Markov categories provide:
1. Rigorous foundations for composing probabilistic AI components
2. Formal treatment of conditional independence
3. Comparison of statistical experiments
4. Foundation for probabilistic contracts between components

---

## Linear Logic and Resource Tracking

### Girard (1987) Linear Logic

**Key distinction:** Disallows contraction and weakening for unmarked formulas.

**Resource interpretation:**
- Proposition = resource
- Proof = process consuming resources
- Each assumption used **exactly once**

### Linear Types

Values of linear type must be used exactly once:
- No implicit copying (contraction forbidden)
- No implicit deletion (weakening forbidden)

**Applications:** Memory management, file handles, cryptographic keys, protocol states.

### Bounded Linear Types

**Extension:** Instead of "use exactly once," allow "use at most k times."

**QBAL (Quantified Bounded Affine Logic):** Quantification over resource variables, preserving polynomial time soundness.

### Object Capabilities

**Capability:** Unforgeable token granting authority to perform operations.

**Security:** Objects interact only via messages on references. Security relies on not being able to forge references.

**Languages:** E, Joe-E, Pony, Cadence, Austral.

### Enforcing Risk Budgets

**Combining linear types with capabilities:**

```
type RiskBudget[R: Real] = LinearCapability[R]

fn risky_operation(budget: RiskBudget[0.1]) -> Result
```

Type system ensures:
- Budget can't be duplicated (linear)
- Total risk ≤ sum of allocated budgets (conservation)
- Risk-taking operations require explicit budget allocation

---

## Spectral Risk Measures

### Definition

**Spectral risk measure:** Weighted average of loss quantiles.

**M_φ(X) = ∫₀¹ φ(p) · q(p) dp**

where φ(p) is the risk aversion function and q(p) is the quantile function.

### Coherence Conditions

φ must satisfy:
1. **Positivity:** φ(p) ≥ 0
2. **Normalization:** ∫₀¹ φ(p) dp = 1
3. **Increasingness:** φ non-decreasing (φ'(p) ≥ 0)

Condition 3 reflects risk aversion - weight higher losses at least as much as lower losses.

### Relationship to Expected Shortfall

ES_α is a spectral measure with:

**φ(p) = 1/(1-α) if p ≥ α, else 0**

Uniform weight on worst (1-α)% of outcomes.

**General result:** Any spectral measure = positively weighted average of ES at different levels.

### Kusuoka Representation

Any law-invariant coherent risk measure can be written as:

**ρ(X) = sup_{μ ∈ M} ∫₀¹ ES_α(X) dμ(α)**

---

## Practical Questions for AI Safety

### Can We Define Coherent AI Harm Measures?

**Challenges:**
- Measurement difficulties for AI catastrophic risk
- Collective risk: multiple "safe" models may collectively exceed thresholds
- Discontinuous behavior near critical parameters

**Promising directions:**
1. **Harm as loss distribution:** Define harm H, use ρ(H) for coherent measure
2. **Spectral measures:** Heavily weight catastrophic tail events
3. **ES for AI:** ES_α(Harm) = average harm in worst α% scenarios

**Critical requirement:** Subadditivity must reflect reality. If combining AI systems creates emergent super-additive risks, coherent measures need modification.

### Systematic vs Random Failures

**Systematic risk (common cause):**
- All AI systems fail for same reason
- Shared training data, common vulnerabilities
- **Does not diversify away**

**Random failures (idiosyncratic):**
- Independent across systems
- Diversification helps
- Subadditivity applies

**Handling approaches:**
1. Separate risk components (systematic + idiosyncratic)
2. Use convex measures for systematic (relax subadditivity)
3. Worst-case scenario sets including correlated failures
4. Fault tree analysis with explicit common-cause modeling

### When Does Diversification Help?

**Helps when:**
- Failures are independent
- Risk measure is subadditive
- Normal or light-tailed distributions
- No common-cause vulnerabilities

**Hurts when:**
- Systematic risk dominates
- Heavy-tailed distributions
- Risk monoculture (all systems use same approach)
- Increased attack surface from complexity
- Series reliability (all must succeed)

**AI-specific:**
- **Helps:** Diverse training data, multiple architectures, ensemble methods
- **Hurts:** Oligopolistic AI vendors create illusory diversification, sophisticated adversaries exploit weakest component

---

## Key Citations

### Coherent Risk Measures
- Artzner, Delbaen, Eber, Heath (1999) - "Coherent Measures of Risk" - *Mathematical Finance* 9(3)
- Delbaen (2002) - Coherent risk measures on general probability spaces
- Föllmer & Schied (2002, 2016) - *Stochastic Finance*

### Expected Shortfall
- Acerbi & Tasche (2002) - "Expected Shortfall: A Natural Coherent Alternative to Value at Risk"
- Basel III FRTB - Shift from VaR to ES

### Euler Allocation
- Tasche (2007) - "Capital Allocation to Business Units: the Euler Principle" - arXiv:0708.2542
- McNeil, Frey, Embrechts (2005) - *Quantitative Risk Management*

### Spectral Measures
- Acerbi (2002) - "Spectral Measures of Risk"
- Kusuoka (2001) - Representation theorem

### Markov Categories
- Fritz (2020) - "A Synthetic Approach to Markov Kernels" - *Advances in Mathematics* 370
- Cho & Jacobs (2019) - Disintegration and Bayesian inversion

### Linear Logic
- Girard (1987) - "Linear Logic" - *Theoretical Computer Science* 50
- Girard, Scedrov, Scott (1992) - Bounded Linear Logic

### Object Capabilities
- Miller (2006) - Robust Composition: Towards a Unified Approach to Access Control and Concurrency Control
- Dennis & Van Horn (1966) - Original capability concept

### Compositional Verification
- Benveniste et al. (2018) - Contracts for System Design
- Pacti tool - Incer et al. (2022)
