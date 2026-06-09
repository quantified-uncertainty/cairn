---
title: "Risk Propagation: One Rule, Not a Menu"
description: "Why multiplicative composition is the canonical propagation rule, where it breaks, and the common-cause correction that unifies the alternatives"
sidebar:
  order: 5
---

# Risk Propagation: One Rule, Not a Menu

Earlier versions of this framework presented risk propagation as a menu: multiplicative, minimum, harmonic, or discounted — pick whichever "fits your situation." That was a mistake. The choice between rules is not a matter of taste; the rules give wildly different answers (a two-link chain at 0.8 and 0.7 yields effective trust anywhere from 0.50 to 0.75 depending on the rule), and at most one of them can be right for a given system.

This page fixes the rule. The short version:

> **Compose multiplicatively. Correct for common-cause correlation. Treat the minimum rule as the fully-correlated limit, not an alternative.**

## Two composition problems, one piece of math

Propagation questions come in two shapes that look similar and behave oppositely:

1. **Serial chains** (delegation): A delegates to B, B delegates to C. The chain works only if *every* link works. Working probabilities $t_i$.
2. **Parallel defenses** (verification stacks): a harmful action gets through only if *every* layer misses it. Miss probabilities $p_i$.

Under **independence**, both compose by multiplication. This is not a modeling choice — it is the definition of independence:

$$P(\text{chain works}) = \prod_i t_i \qquad P(\text{all layers miss}) = \prod_i p_i$$

So the multiplicative rule is the correct *baseline*. Every other rule on the old menu is either a special case of correlation (minimum), or incoherent (harmonic — see below).

## The common-cause correction

Components are rarely independent — they share providers, training paradigms, infrastructure, and context (see [the entanglement taxonomy](/entanglements/fundamentals/types/)). The standard single-parameter fix comes from nuclear safety's common-cause failure analysis (the **beta-factor model**, used in [probabilistic risk assessment](/cross-domain-methods/nuclear-safety-pra/) since the 1970s): with weight $\rho$, a shared cause takes down all correlated components together; with weight $1-\rho$, they behave independently.

$$P(\text{all fail}) \;\approx\; (1-\rho)\prod_i p_i \;+\; \rho \cdot \min_i p_i$$

This formula is exact for the mixture model it describes, recovers the product rule at $\rho = 0$, and recovers the minimum rule at $\rho = 1$. **The "menu" was a correlation parameter in disguise.**

## Simulation: which rule matches ground truth

We simulated ground truth with a one-factor Gaussian copula (each component's failure driven partly by a shared latent factor, correlation $\rho$; 400,000 samples per cell; marginal failure probability 0.1 per component).

**Parallel verification stack — P(all layers miss), two and three layers:**

| $\rho$ | True (k=2) | Product | Mixture | True (k=3) | Product | Mixture |
|------|-----------|---------|---------|-----------|---------|---------|
| 0.0 | 0.0099 | 0.0100 | 0.0100 | 0.0010 | 0.0010 | 0.0010 |
| 0.2 | 0.0171 | 0.0100 | 0.0280 | 0.0040 | 0.0010 | 0.0208 |
| 0.4 | 0.0267 | 0.0100 | 0.0460 | 0.0108 | 0.0010 | 0.0406 |
| 0.6 | 0.0389 | 0.0100 | 0.0640 | 0.0217 | 0.0010 | 0.0604 |
| 0.8 | 0.0566 | 0.0100 | 0.0820 | 0.0410 | 0.0010 | 0.0802 |

Read the third row: at moderate correlation ($\rho = 0.4$), the product rule understates true risk by **2.7× for two layers and 11× for three layers**. The mixture overstates it — deliberately. For safety budgeting you want the conservative side, and the mixture formula is exactly that: an upper envelope that is exact at both ends.

**Serial trust chain — P(both links work), $t = (0.8, 0.7)$:**

| $\rho$ | True | Product | Mixture | Minimum |
|------|------|---------|---------|---------|
| 0.0 | 0.560 | 0.560 | 0.560 | 0.70 |
| 0.3 | 0.592 | 0.560 | 0.602 | 0.70 |
| 0.6 | 0.628 | 0.560 | 0.644 | 0.70 |
| 0.9 | 0.681 | 0.560 | 0.686 | 0.70 |

## The bias direction flips — this is the safety-critical point

Compare the two tables:

- **Serial chains:** correlation *helps* (failures clump, so the chain works more often than the product predicts). The product rule errs **conservative** — it understates trust. Using it unadjusted is safe.
- **Parallel defenses:** correlation *hurts* (layers miss together). The product rule errs **optimistic** — it understates risk, by an order of magnitude at correlations that are entirely realistic for same-provider LLM stacks ($\rho \approx 0.5$–$0.7$; see [realistic correlation estimates](/entanglements/detection/correlation-calculator/)). Using it unadjusted is how systems with "five 90% layers" fail at the [entanglement tax](/entanglements/fundamentals/formal-definitions/#the-entanglement-tax) rate.

So the operational rule is asymmetric:

| Situation | Rule |
|---|---|
| Serial delegation chain, any $\rho$ | Product of link trusts (conservative as-is) |
| Parallel defenses, $\rho$ estimated | Mixture: $(1-\rho)\prod p_i + \rho \min p_i$ |
| Parallel defenses, $\rho$ unknown, components share provider/training/context | **Minimum** — i.e., assume only your single best layer counts |

## What happened to the other rules

- **Harmonic mean** is incoherent for chains: for links (0.8, 0.7) it yields 0.747 — *higher than the weaker link alone*. No serial composition can be more trustworthy than its weakest stage. Retired.
- **Discounted product** (multiply by an extra $0.9$ per hop) double-counts: chain-length penalty already emerges from multiplication. If long chains worry you beyond that, the thing you're worried about is accumulated *unmodeled* correlation or context contamination — model that explicitly instead.
- **Minimum** survives, demoted from "alternative rule" to what it actually is: the $\rho = 1$ limit of the mixture, and the honest bound when you can't estimate $\rho$.

## Limitations

The single-parameter mixture treats all components as sharing one common cause symmetrically. Real systems have *structured* correlation (A and B share a provider; C shares context with A). For those, build the pairwise correlation matrix as in the [entanglement worked examples](/entanglements/case-studies/examples/), or simulate. The mixture formula is the right back-of-envelope; it is not a substitute for the matrix when the architecture is asymmetric. Higher-order effects (three-way correlations beyond pairwise) are not captured by either — see the caveat in [Formal Definitions](/entanglements/fundamentals/formal-definitions/).

## See also

- [Exposure Cascade](/delegation-risk/exposure-cascade/) — how budgets flow down hierarchies once the rule is fixed
- [Correlation Calculator](/entanglements/detection/correlation-calculator/) — lookup tables built from the mixture formula
- [Trust Propagation (research)](/research/theory/trust-propagation/) — survey of alternative formalisms, multi-path combination, PageRank-style approaches
