---
title: "Measuring Entanglement"
description: "How to estimate ρ on the phi scale, lookup tables for the entanglement tax, one threshold set derived from your target, and what the published evidence does and does not support"
sidebar:
  order: 1
---

This page holds the numbers for the entanglement section: how to estimate ρ, what it implies, which thresholds to use, and what to assume when you cannot measure. Other pages link here rather than restating them.

Two scope notes first. [Delegation risk](/delegation-risk/) is an expected loss in dollars, and expected-loss roll-ups add whatever the correlation. Correlation matters for AND-structured defenses, where harm gets through only if every layer misses, and for the tails of total loss ([Runtime Accounting](/delegation-risk/runtime-accounting/)). The entanglement tax multiplies the P(all layers miss) term of such a stack. Second, everything here is benign-failure math. Against an adaptive adversary, use ρ = 1 unless a control evaluation measures the joint miss rate under attack ([Risk Propagation](/delegation-risk/risk-propagation/#adversarial-inputs)).

## The formula

For layers with miss probabilities $p_i$ and common-cause correlation ρ ([derivation](/entanglements/fundamentals/formal-definitions/#the-entanglement-tax)):

$$P(\text{all miss}) = (1-\rho)\prod_i p_i + \rho \cdot \min_i p_i$$

The second term is a floor. Adding layers shrinks only the first.

## Estimating ρ: the phi coefficient

ρ is always the **phi coefficient** of the miss indicators, the Pearson correlation of two 0/1 variables. The recipe is the canonical one from [Risk Propagation](/delegation-risk/risk-propagation/#what-ρ-means-and-how-to-estimate-it):

1. Run every layer on the same labeled challenge set of harmful items. Record, per item, whether each layer missed it.
2. For each pair, compute $\phi = \dfrac{P(\text{both miss}) - p_A p_B}{\sqrt{p_A(1-p_A)\,p_B(1-p_B)}}$.
3. Use the largest pairwise φ as the mixture's ρ, or simulate the full matrix (below).
4. When you cannot measure, round up (see [priors](#priors-when-you-cannot-measure)).

Other statistics called "correlation" do not substitute for φ:

- **Jaccard overlap**, P(both miss)/P(either misses), is about 0.05 for two *independent* layers at p = 0.1. It is not a correlation.
- **Latent or copula correlation**, the parameter of a Gaussian-factor model, is larger than the φ it induces. Latent 0.4 gives φ ≈ 0.19 at p = 0.1.
- **Yule's Q**, common in the ensemble-diversity literature ([Kuncheva & Whitaker 2003](https://doi.org/10.1023/A:1022859003006)), is always at least as large in magnitude as φ.
- **Representation similarity** (CKA) and **output agreement rates** describe models, not joint misses.

Each of these overstates or misstates the tax if plugged into the formula.

**What the challenge set must contain.** φ is a property of a layer pair *on a distribution*. Measure on the harmful items you care about, including hard and novel cases. An easy set makes every layer catch everything and leaves φ undefined. Re-measure under load, because correlation can appear only under stress, and after any change to models, prompts or infrastructure.

**Sampling error.** Near zero, the standard error of φ is about $1/\sqrt{N}$ for N items: ±0.03 at N = 1,000. Misses are what carry the information, so a layer that misses 1% of a 1,000-item set gives you ten data points. Bootstrap a confidence interval and compare its upper end, not the point estimate, with your budget.

```python
import numpy as np

def phi(a: np.ndarray, b: np.ndarray) -> float:
    """Phi coefficient of two boolean miss vectors over the same items."""
    pa, pb, pab = a.mean(), b.mean(), (a & b).mean()
    denom = np.sqrt(pa * (1 - pa) * pb * (1 - pb))
    return float("nan") if denom == 0 else (pab - pa * pb) / denom

def phi_matrix(misses: np.ndarray) -> np.ndarray:
    """misses: (n_items, n_layers) boolean array, True where a layer missed."""
    k = misses.shape[1]
    R = np.eye(k)
    for i in range(k):
        for j in range(i + 1, k):
            R[i, j] = R[j, i] = phi(misses[:, i], misses[:, j])
    return R

def measured_tax(misses: np.ndarray) -> float:
    """Observed P(all miss) over the independence prediction."""
    independent = misses.mean(axis=0).prod()
    actual = misses.all(axis=1).mean()
    return actual / independent if independent > 0 else float("nan")
```

A layer that never misses on the set returns NaN, not zero: the set carries no information about its correlation. The measured tax needs enough items for P(all miss) to be observed at all; for strong stacks it usually is not, which is why the mixture with a measured φ is the practical route.

## Lookup tables

Identical layers that each miss 10%. "Effective layers" is the number of independent layers with the same P(all miss), $\ln P / \ln 0.1$.

| ρ | 2 layers: P(all miss) | tax | 3 layers: P(all miss) | tax | effective | 5 layers: P(all miss) | tax | effective |
|---|---|---|---|---|---|---|---|---|
| 0 | 1.0% | 1× | 0.10% | 1× | 3.0 | 0.001% | 1× | 5.0 |
| 0.1 | 1.9% | 1.9× | 1.09% | 11× | 2.0 | 1.00% | 1,000× | 2.0 |
| 0.2 | 2.8% | 2.8× | 2.08% | 21× | 1.7 | 2.00% | 2,000× | 1.7 |
| 0.3 | 3.7% | 3.7× | 3.07% | 31× | 1.5 | 3.00% | 3,000× | 1.5 |
| 0.5 | 5.5% | 5.5× | 5.05% | 50× | 1.3 | 5.00% | 5,000× | 1.3 |
| 0.7 | 7.3% | 7.3× | 7.03% | 70× | 1.2 | 7.00% | 7,000× | 1.2 |
| 1.0 | 10% | 10× | 10% | 100× | 1.0 | 10% | 10,000× | 1.0 |

Three things follow from the formula and show in the table:

1. **The tax is linear in ρ.** For three 90% layers, P(all miss) = 0.001 + 0.099ρ, so each 0.1 of ρ adds about one percentage point, or about 10× on the tax. The steps are equal in absolute terms. Relative to independence, the first step, from 1× to 11×, is the one that destroys the arithmetic people expect.
2. **Past modest ρ, more layers buy nothing.** At ρ = 0.5, three and five layers are both worth 1.3 independent layers, because the floor ρ·p does not depend on the number of layers.
3. **Two levers move the floor.** It is ρ·min pᵢ, so lower ρ (a check that uses a different method or different information) or improve the *best* layer.

Two contrasting stacks, with ρ values assumed for illustration:

- *Same model three times* (agent, checker, reviewer), ρ ≈ 0.9: P(all miss) ≈ 9%, a tax of about 90×, worth 1.05 independent layers.
- *Diverse stack*: an LLM check (p = 0.1), a rule-based check (p = 0.05) and human review of flagged items (p = 0.01), ρ ≈ 0.15. Independence predicts 0.005%; the mixture gives 0.15%, a tax of about 31×. The ratio is large because the independent baseline is tiny, but the absolute risk is 60 times lower than the same-model stack's. Compare stacks by P(all miss), not by tax.

## The threshold set: a correlation budget

Thresholds such as "investigate above 0.3" carry no information about your system. The threshold that does is the largest ρ your target tolerates. Setting the mixture equal to a target T and solving:

$$\rho_{\max} = \frac{T - \prod_i p_i}{\min_i p_i - \prod_i p_i}$$

For layers that each miss 10%:

| Target P(all miss) | 3 layers | 5 layers |
|---|---|---|
| 5% (95% protection) | ρ ≤ 0.49 | ρ ≤ 0.50 |
| 1% (99%) | ρ ≤ 0.09 | ρ ≤ 0.10 |
| 0.1% (99.9%) | only ρ = 0 | ρ ≤ 0.01 |
| 0.01% | unreachable | ρ ≤ 0.001 |

The same algebra answers "how many layers?". For identical layers, $n \geq \ln\!\big((T - \rho p)/(1-\rho)\big) / \ln p$, which exists only when $T > \rho p$. At p = 0.1 and T = 0.1%, ρ = 0 needs three layers, and any ρ ≥ 0.01 makes the target unreachable at every layer count.

This is the [correlation budget](/getting-started/glossary/): the practical face of the entanglement tax. The full decision rule:

| Situation | Rule |
|---|---|
| Measured max-pairwise φ (upper CI) ≤ ρ_max | Within budget |
| Measured φ > ρ_max | Over budget: replace a layer with one that uses a different method, improve the best layer, or narrow what is delegated |
| Cannot measure; layers share a provider, model family, training or context | Assume ρ ≥ 0.5 |
| Defection or hijack channel (adaptive adversary) | Assume ρ = 1 until a control evaluation measures the joint miss rate |
| Monitoring over time | Alert when φ's confidence interval moves above ρ_max, or when φ rises significantly over its own baseline |

## Priors when you cannot measure

The values below are **assumed priors** on the φ scale: the site authors' judgment, not measurements. Use them to see whether a design could meet its budget, then measure. Where a range spans your ρ_max, the design question is open until you do.

| Configuration | Assumed ρ (φ scale) |
|---|---|
| Same model and prompt, separate calls | 0.8–1.0 |
| Same provider or model family, different models | ≥ 0.5 (the canonical default) |
| Frontier LLMs from different providers | 0.3–0.6 |
| LLM check and rule-based or static check | 0.1–0.3 |
| LLM check and formal verification of a narrow property | 0–0.1, on that property |
| LLM check and a human who sees the LLM's output | 0.2–0.4 |

The evidence these priors should be consistent with:

| Source | What it measured | Bearing on ρ | Convertible to φ? |
|---|---|---|---|
| [Knight & Leveson (1986)](https://doi.org/10.1109/TSE.1986.6312924) | 27 independently written programs, 1 million test inputs | Coincident failures far above independence, even for separately developed software | No: different domain, reported as failure counts |
| [Goel et al. (2025)](https://arxiv.org/abs/2502.04313) | Chance-adjusted agreement on mistakes (CAPA) across LLMs | Mistakes grow more similar with capability; LLM judges favor similar models | No: CAPA is agreement over output probabilities, not a miss-indicator correlation |
| [Kim et al. (2025)](https://arxiv.org/abs/2506.07962) | Errors of 350+ LLMs on leaderboards and a resume-screening task | On one leaderboard dataset, two models that both err pick the same wrong answer 60% of the time; accurate models have highly correlated errors across providers | No: agreement conditional on both erring is a different quantity |
| [Zou et al. (2023)](https://arxiv.org/abs/2307.15043) | Adversarial suffixes optimized on open models, tested on others | Attacks transfer, including to closed commercial models | No: adversarial; supports ρ → 1 under attack |

We know of no published φ between same-provider LLM checks on harmful-action detection. The "~50×" figure used across this site is the ρ = 0.5 row of the table above, chosen as a round assumption, and the 11×–21× rows are as defensible as it is. Show the range.

## Asymmetric stacks: the matrix

A single ρ treats every layer as equally exposed to one shared cause. Real stacks are structured: two LLM checks may be strongly correlated with each other and weakly with a static analyzer. Keep a pairwise φ matrix. An illustrative one:

| | Rule filter | LLM monitor A | LLM monitor B | Anomaly detector |
|---|---|---|---|---|
| **Rule filter** | 1 | 0.1 | 0.1 | 0.2 |
| **LLM monitor A** | 0.1 | 1 | 0.6 | 0.2 |
| **LLM monitor B** | 0.1 | 0.6 | 1 | 0.2 |
| **Anomaly detector** | 0.2 | 0.2 | 0.2 | 1 |

There are two ways to use it:

- **Conservative:** plug the largest entry into the mixture. Averaging the entries understates the tax, because one strongly correlated pair dominates the joint miss.
- **Sharper:** simulate. Calibrate a Gaussian copula so that each pair's simulated φ matches the matrix, then estimate P(all miss) by Monte Carlo. The [worked examples](/entanglements/case-studies/examples/) do this.

Neither captures interactions beyond pairs, so also test the full stack on the challenge set where you can.

## Limits of the numbers

- **Stationarity.** Correlation measured in normal operation can rise under load or drift as components are tuned to each other. Re-measure on a schedule and after changes.
- **Coverage.** The challenge set is not production. Novel inputs are where shared blind spots live and where you have the least data.
- **Adversaries.** A φ from benign data says nothing about chosen inputs.
- **Small samples.** Below a few hundred items with misses, treat φ as a range.

When in doubt, assume the correlation is higher than measured.

---

See also:
- [Formal Definitions](/entanglements/fundamentals/formal-definitions/): the tax and effective redundancy
- [Risk Propagation](/delegation-risk/risk-propagation/): derivation, simulation, the adversarial case
- [Audit Guide](/entanglements/mitigation/audit-guide/): the protocol that produces these measurements
- [Solutions](/entanglements/mitigation/solutions/): how to get under budget
