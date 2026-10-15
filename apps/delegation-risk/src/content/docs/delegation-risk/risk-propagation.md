---
title: "Risk Propagation: One Rule, Not a Menu"
description: "Why multiplicative composition is the canonical propagation rule, where it breaks, the common-cause correction that unifies the alternatives, and why the correction does not apply to adversarial inputs"
sidebar:
  badge:
    text: Core
    variant: tip
  order: 4
---

Earlier versions of this framework offered a menu of propagation rules (multiplicative, minimum, harmonic, discounted) to pick from. That was a mistake: for a two-link chain at 0.8 and 0.7 they give anywhere from 0.50 to 0.75, and at most one can be right. This page fixes the rule:

> **Compose multiplicatively. Correct for common-cause correlation. Treat the minimum rule as the fully correlated limit, not an alternative. Against an adaptive adversary, assume the fully correlated limit.**

## Two composition problems, one piece of math

Propagation questions come in two shapes that behave oppositely:

1. **Serial chains** (delegation). A delegates to B, and B to C. The chain works only if *every* link works. Each link has working probability $t_i$ = P(the link executes faithfully).
2. **Parallel defenses** (stacks of checks). A harmful action gets through only if *every* layer misses it. Each layer has miss probability $p_i$.

Under independence, both compose by multiplication. This is not a modeling choice; it is the definition of independence:

$$P(\text{chain works}) = \prod_i t_i \qquad P(\text{all layers miss}) = \prod_i p_i$$

So the multiplicative rule is the correct baseline.

## The common-cause correction

Components are rarely independent. They share providers, training methods, infrastructure and context (see [the entanglement taxonomy](/entanglements/fundamentals/types/)). The standard one-parameter fix comes from common-cause failure analysis in nuclear [probabilistic risk assessment](/research/system-design/nuclear-aerospace-deep-dive/), the **beta-factor model**. With weight $\rho$, a shared cause takes down all the correlated components together; with weight $1-\rho$, they fail independently:

$$P(\text{all fail}) \;\approx\; (1-\rho)\prod_i p_i \;+\; \rho \cdot \min_i p_i$$

The formula is exact for the mixture model it describes. It gives the product rule at $\rho = 0$ and the minimum rule at $\rho = 1$. **The menu was a correlation parameter in disguise.**

## Simulation: which rule matches ground truth

We modeled ground truth as a one-factor Gaussian copula: each component's failure is driven partly by a shared latent factor with correlation $\rho$, and each component fails with probability 0.1. The values below are computed by numerical integration over the shared factor; a 400,000-sample Monte Carlo agrees to within sampling error.

**Parallel stack: P(all layers miss), two and three layers.**

| $\rho$ (latent) | True (k=2) | Product | Mixture | True (k=3) | Product | Mixture |
|------|-----------|---------|---------|-----------|---------|---------|
| 0.0 | 0.0100 | 0.0100 | 0.0100 | 0.0010 | 0.0010 | 0.0010 |
| 0.2 | 0.0172 | 0.0100 | 0.0280 | 0.0042 | 0.0010 | 0.0208 |
| 0.4 | 0.0267 | 0.0100 | 0.0460 | 0.0107 | 0.0010 | 0.0406 |
| 0.6 | 0.0390 | 0.0100 | 0.0640 | 0.0219 | 0.0010 | 0.0604 |
| 0.8 | 0.0562 | 0.0100 | 0.0820 | 0.0408 | 0.0010 | 0.0802 |

At latent $\rho = 0.4$, the product rule understates the true risk by 2.7× for two layers and 11× for three. That is the safety-critical failure. The mixture column overshoots because the table's $\rho$ is the copula's latent correlation, a stronger scale than the mixture's: latent 0.4 is a failure-indicator correlation of about 0.19 at $p = 0.1$ (see [what ρ means](#what-ρ-means-and-how-to-estimate-it)). Fed 0.19, the mixture gives exactly the true 0.0267 for two layers, and 0.019 against a true 0.011 for three. On matched scales it is exact for two layers and conservative beyond, the right side to err on.

**Serial chain: P(both links work), $t = (0.8, 0.7)$.**

| $\rho$ (latent) | True | Product | Mixture | Minimum |
|------|------|---------|---------|---------|
| 0.0 | 0.560 | 0.560 | 0.560 | 0.70 |
| 0.3 | 0.591 | 0.560 | 0.602 | 0.70 |
| 0.6 | 0.629 | 0.560 | 0.644 | 0.70 |
| 0.9 | 0.680 | 0.560 | 0.686 | 0.70 |

## The bias flips direction

Compare the two tables:

- **Serial chains:** correlation *helps*, because failures bunch together. The product rule errs conservative and is safe unadjusted.
- **Parallel defenses:** correlation *hurts*. Layers miss together. The product rule errs optimistic, by an order of magnitude at moderate correlation. Using it unadjusted is how a stack of three 90% layers ends up paying the [entanglement tax](/entanglements/fundamentals/formal-definitions/#the-entanglement-tax).

So the operational rule is asymmetric:

| Situation | Rule |
|---|---|
| Serial delegation chain, any $\rho$ | Product of link reliabilities (conservative as is) |
| Parallel defenses, benign failures, $\rho$ estimated | Mixture: $(1-\rho)\prod p_i + \rho \min p_i$ |
| Parallel defenses, $\rho$ unknown, layers share a provider, training or context | **Minimum**: count only your single best layer |
| Parallel defenses against an adaptive adversary | **Minimum**, unless a control evaluation measures the joint miss rate (see [below](#adversarial-inputs)) |

## How sensitive the tax is to ρ

For three layers that each miss 10%, the mixture gives P(all miss) = 0.001 + 0.099ρ, so the tax over the independence figure is 1 + 99ρ:

| ρ (phi scale) | P(all miss) | Tax over independence |
|---|---|---|
| 0 | 0.001 | 1× |
| 0.1 | 0.011 | ~11× |
| 0.2 | 0.021 | ~21× |
| 0.5 | 0.051 | ~50× |
| 1 | 0.100 | 100× |

The "~50×" figure quoted elsewhere on this site is the ρ = 0.5 row. **That ρ is assumed, not measured.** We know of no published measurement of φ between same-provider LLM checks on harmful-action detection. Two 2025 studies show that LLM errors are substantially correlated. [Goel et al.](https://arxiv.org/abs/2502.04313) find that models' mistakes grow more similar as capability increases. [Kim et al.](https://arxiv.org/abs/2506.07962) find, across more than 350 models, that shared architecture and provider drive error correlation, but that larger, more accurate models have highly correlated errors even across providers. Their statistics are similarity and agreement measures, not φ, so they cannot be plugged in, but they suggest that "use a different provider" is not by itself a sufficient correlation budget. Until φ is measured for your stack, show the whole table, not one row.

## Adversarial inputs

The mixture is benign-failure math. It assumes inputs arrive independently of the defenses, and that layers fail together only through shared causes such as a common blind spot. The ρ in the recipe below is estimated on a fixed challenge set for the same reason.

An adaptive adversary breaks that assumption. A scheming component, the author of a prompt injection, or someone holding a jailbreak that transfers between models *chooses* inputs that defeat every layer at once. On those inputs, the layers' misses are not a random draw from their benign miss rates. The effective correlation approaches 1, and the stack is worth at most its best single layer against that attack. It can be worth less, if the attacker searches until one input beats them all.

So for the defection and hijack [channels](/delegation-risk/risk-decomposition/):

1. **Default to the minimum rule (ρ = 1).** Count the stack as its best layer.
2. **Replace the default only with a measurement under attack.** That means a control evaluation: a red team that knows the stack builds attacks against it, and you measure the joint miss rate on those attacks ([Greenblatt et al. 2023](https://arxiv.org/abs/2312.06942)). A φ computed on benign data does not transfer.
3. **Prefer defenses whose guarantee does not depend on ρ.** A hard envelope blocks an action whatever the input. An architecture that keeps untrusted data out of control flow ([Debenedetti et al. 2025](https://arxiv.org/abs/2503.18813)) removes a class of attack instead of making it less likely.

The ~50× tax is therefore the *benign-failure* tax. Against an adaptive adversary, the honest prior is that three layers give you one.

## What happened to the other rules

- **Harmonic mean** is incoherent for chains: for links (0.8, 0.7) it gives 0.747, *higher than the weaker link*. Retired.
- **Discounted product** (an extra 0.9 per hop) double-counts, since multiplication already penalizes length. A residual worry about long chains is unmodeled correlation or context contamination; model those directly. Retired.
- **Minimum** survives as the $\rho = 1$ limit of the mixture: the honest bound when you cannot estimate $\rho$ or face an adversary.

## What ρ means and how to estimate it

The $\rho$ in the mixture is the beta-factor mixing weight: the share of failure probability attributable to a single shared cause. For layers with equal miss probability, it equals the Pearson correlation of the failure indicators (the phi coefficient). That is the scale on which $\rho$ should be estimated and reported.

It is *not* interchangeable with other numbers called "correlation":

- A **latent or copula correlation**, the kind a Gaussian-factor simulation is parameterized by, is larger than the indicator correlation it induces: latent 0.4 gives an indicator correlation of about 0.19 at $p = 0.1$. Plugging a latent-scale number into the mixture or the tables overstates the tax.
- The **raw joint-failure share** $P(\text{both fail})/P(\text{either fails})$ (a Jaccard index) is nonzero even for *independent* layers (about 0.05 at $p = 0.1$), so it is not a correlation at all.

**The canonical estimation recipe** (other pages reference this; do not substitute alternatives):

1. Run all layers on the same labeled challenge set, recording each layer's miss or catch on each item.
2. For each pair of layers, compute the phi coefficient: $\phi = \dfrac{P(\text{both miss}) - p_A p_B}{\sqrt{p_A(1-p_A)\,p_B(1-p_B)}}$.
3. Use the largest pairwise $\phi$, or a deliberately high estimate, as the mixture's $\rho$.
4. When you cannot measure, round up. For layers that share a provider, training method or context, assume $\rho \geq 0.5$.

This recipe estimates benign-failure correlation only. For adversarial channels, see [above](#adversarial-inputs).

Every $\rho$ in this page's mixture columns and in the [correlation calculator](/entanglements/detection/correlation-calculator/) tables is on this indicator (phi) scale. The calculator's per-configuration ρ values are assumptions of the same kind as the ~50× row, not measurements.

## Limitations

The mixture assumes one common cause shared symmetrically. Real systems have *structured* correlation: A and B share a provider, while C shares context with A. For those, build the pairwise matrix as in the [entanglement worked examples](/entanglements/case-studies/examples/), or simulate. Neither approach captures correlation beyond the pairwise; see [Formal Definitions](/entanglements/fundamentals/formal-definitions/).

## See also

- [Correlation Calculator](/entanglements/detection/correlation-calculator/): lookup tables built from the mixture
- [Runtime Accounting](/delegation-risk/runtime-accounting/): where expected-loss roll-ups add and where correlation matters
- [Exposure Cascade](/delegation-risk/exposure-cascade/): how a risk budget divides down a tree
