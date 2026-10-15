---
title: "Measuring Entanglement"
description: "How to estimate ρ from joint misses, lookup tables for the entanglement tax, one threshold set derived from your target, and what the published evidence does and does not support"
sidebar:
  order: 1
---

This page holds the numbers for the entanglement section: how to estimate ρ, what it implies, which thresholds to use, and what to assume when you cannot measure. Other pages link here rather than restating them.

Two scope notes first. [Delegation risk](/delegation-risk/) is an expected loss in dollars, and expected-loss roll-ups add whatever the correlation. Correlation matters for AND-structured defenses, where harm gets through only if every layer misses, and for the tails of total loss ([Runtime Accounting](/delegation-risk/runtime-accounting/)). The entanglement tax multiplies the P(all layers miss) term of such a stack. Second, everything here is benign-failure math. Against an adaptive adversary, use ρ = 1 unless a control evaluation measures the joint miss rate under attack ([why](/entanglements/fundamentals/formal-definitions/#adaptive-adversaries-the-wrong-model)).

## The formula

For layers with miss probabilities $p_i$ and common-cause correlation ρ ([derivation](/entanglements/fundamentals/formal-definitions/#the-entanglement-tax)):

$$P(\text{all miss}) = (1-\rho)\prod_i p_i + \rho \cdot \min_i p_i$$

The second term is a floor. Adding layers shrinks only the first.

## Estimating ρ from joint misses

ρ is estimated from the **miss indicators** of each pair of layers on the same items. The starting point is the phi coefficient, the Pearson correlation of two 0/1 variables, as in the canonical recipe on [Risk Propagation](/delegation-risk/risk-propagation/#what-ρ-means-and-how-to-estimate-it); step 3 converts it for layers whose miss rates differ:

1. Run every layer on the same labeled challenge set of harmful items. Record, per item, whether each layer missed it.
2. For each pair, compute $\phi = \dfrac{P(\text{both miss}) - p_A p_B}{\sqrt{p_A(1-p_A)\,p_B(1-p_B)}}$.
3. Convert each pair to the mixture weight $\rho_{AB} = \dfrac{P(\text{both miss}) - p_A p_B}{\min(p_A, p_B) - p_A p_B}$, the share of the largest possible excess joint miss that the pair shows. It equals φ when the two miss rates are equal and exceeds it otherwise, because φ cannot reach 1 between layers with different miss rates: at p = 0.1 and 0.01 its maximum, φ_max, is 0.30. Feeding φ itself to the mixture then understates the joint miss, and diverse stacks, whose layers differ most in miss rate, are where it understates most.
4. Use the largest pairwise ρ, or simulate the full matrix (below).
5. When you cannot measure, use the upper end of the [priors](#priors-when-you-cannot-measure).

Other statistics called "correlation" do not substitute for these:

- **Jaccard overlap**, P(both miss)/P(either misses), is about 0.05 for two *independent* layers at p = 0.1. It is not a correlation.
- **Latent or copula correlation**, the parameter of a Gaussian-factor model, is larger than the φ it induces. Latent 0.4 gives φ ≈ 0.19 at p = 0.1.
- **Yule's Q**, common in the ensemble-diversity literature ([Kuncheva & Whitaker 2003](https://doi.org/10.1023/A:1022859003006)), is always at least as large in magnitude as φ.
- **Representation similarity** (CKA) and **output agreement rates** describe models, not joint misses.

Each of these overstates or misstates the tax if plugged into the formula.

**What the challenge set must contain.** φ is a property of a layer pair *on a distribution*. Measure on the harmful items you care about, including hard and novel cases. An easy set makes every layer catch everything and leaves φ undefined. Re-measure under load, because correlation can appear only under stress, and after any change to models, prompts or infrastructure.

**Sampling error.** Near zero, the standard error of φ is about $1/\sqrt{N}$ for N items: ±0.03 at N = 1,000. Misses are what carry the information, so a layer that misses 1% of a 1,000-item set gives you ten data points. The converted ρ is noisier by the factor 1/φ_max. Bootstrap a confidence interval and compare its upper end, not the point estimate, with your budget. Small budgets are expensive to demonstrate: an upper bound near 0.1 needs at least a few hundred items, and one near 0.01 tens of thousands.

```python
import numpy as np

def phi(a: np.ndarray, b: np.ndarray) -> float:
    """Phi coefficient of two boolean miss vectors over the same items."""
    pa, pb, pab = a.mean(), b.mean(), (a & b).mean()
    denom = np.sqrt(pa * (1 - pa) * pb * (1 - pb))
    return float("nan") if denom == 0 else (pab - pa * pb) / denom

def rho_pair(a: np.ndarray, b: np.ndarray) -> float:
    """Beta-factor weight that reproduces this pair's joint miss rate."""
    pa, pb, pab = a.mean(), b.mean(), (a & b).mean()
    denom = min(pa, pb) - pa * pb
    return float("nan") if denom <= 0 else (pab - pa * pb) / denom

def pair_matrix(misses: np.ndarray, stat=rho_pair) -> np.ndarray:
    """misses: (n_items, n_layers) boolean array, True where a layer missed."""
    k = misses.shape[1]
    R = np.eye(k)
    for i in range(k):
        for j in range(i + 1, k):
            R[i, j] = R[j, i] = stat(misses[:, i], misses[:, j])
    return R

def measured_tax(misses: np.ndarray) -> float:
    """Observed P(all miss) over the independence prediction."""
    independent = misses.mean(axis=0).prod()
    actual = misses.all(axis=1).mean()
    return actual / independent if independent > 0 else float("nan")
```

A layer that never misses on the set returns NaN, not zero: the set carries no information about its correlation. The measured tax needs enough items for P(all miss) to be observed at all; for strong stacks it usually is not, which is why the mixture with measured pairwise ρ is the practical route.

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
2. **Past modest ρ, more layers buy almost nothing.** At ρ = 0.5, three and five layers are both worth 1.3 independent layers, because the floor ρ·p does not depend on the number of layers. The floor is an assumption of the model: that some inputs defeat every layer at once. A Gaussian copula fitted to the same pairwise joint misses has none, and at ρ = 0.5 gives 3.9%, 2.6% and 1.6% for three, five and ten layers. Returns still fall fast, and 99.9% stays out of practical reach. Only P(all miss) measured on the full stack tells the two models apart.
3. **Two levers move the floor.** It is ρ·min pᵢ, so lower ρ (a check that uses a different method or different information) or improve the *best* layer.

Two contrasting stacks, with ρ values taken from the [priors](#priors-when-you-cannot-measure) and miss rates that are illustrative:

- *Same model three times* (agent, checker, reviewer), ρ ≈ 0.9: P(all miss) ≈ 9%, a tax of about 90×, worth 1.05 independent layers.
- *Diverse stack*: an LLM check (p = 0.1), a rule-based check (p = 0.05) and a human reviewer who sees every item (p = 0.01), ρ ≈ 0.15. (A human who reviews only flagged items is in series with the checks, not in parallel, and adds nothing to P(all miss).) Independence predicts 0.005%; the mixture gives 0.15%, a tax of about 31×. The ratio is large because the independent baseline is tiny, but the absolute risk is about 60 times lower than the same-model stack's. Compare stacks by P(all miss), not by tax.

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
| Measured max-pairwise ρ (upper CI) ≤ ρ_max | Within budget |
| Measured ρ > ρ_max | Over budget: replace a layer with one that uses a different method, improve the best layer, or narrow what is delegated |
| Cannot measure | Use the upper end of the matching [prior range](#priors-when-you-cannot-measure): 0.7 for a shared provider or model family, 0.6 across providers |
| Defection or hijack channel (adaptive adversary) | Assume ρ = 1 until a control evaluation measures the joint miss rate |
| Monitoring over time | Alert when ρ's confidence interval moves above ρ_max, or when ρ rises significantly over its own baseline |

## What the evidence supports

**Benchmark φ for LLM pairs.** [Kim et al. (2025)](https://arxiv.org/abs/2506.07962) released, for 71 models on HELM's MMLU set (14,042 multiple-choice questions; models released 2023–24), each model's accuracy and, for every pair, the both-correct rate and the agreement rates on errors ([data](https://github.com/nikhgarg/llm_correlated_errors_public)). Those fix the joint miss rate (P(both miss) = agreement-when-either-wrong × (1 − both-correct) ÷ agreement-when-both-wrong), so φ and the mixture weight ρ of the miss indicators can be computed directly. We did so; the reconstructed accuracies match the published ones to within 0.002, and with 14,042 items the sampling error of each φ is about ±0.01.

| Pair type (both models ≥ 80% accurate) | Pairs | φ of misses | Mixture ρ |
|---|---|---|---|
| Dated versions of one model (GPT-4o 05→08, Claude 3.5 Sonnet 06→10, Gemini 1.5 Pro 001→002) | 3 | 0.80, 0.77, 0.66 | 0.80, 0.79, 0.75 |
| Same provider, any two models (including the above) | 20 | median 0.61, range 0.56–0.93 | median 0.69, range 0.61–0.94 |
| Different providers | 151 | median 0.53, 80% of pairs in 0.48–0.56 | median 0.58, 80% in 0.51–0.63 |

Across providers, median φ rises from 0.30 for pairs where the weaker model scores below 60% to 0.53 above 80%. Most of that rise is φ's ceiling for pairs with unequal accuracies: among pairs whose accuracies are within three points of each other, the median is about 0.5 from 60% accuracy up, and the mixture ρ is 0.57–0.58 in every bin from 60% up. [Goel et al. (2025)](https://arxiv.org/abs/2502.04313), with a chance-adjusted metric (CAPA) on 130 models, do report similarity rising with capability; CAPA counts different wrong answers as disagreement and uses output probabilities, so it is not φ.

**Label noise biases these figures upward.** An estimated 6.49% of MMLU questions contain errors, such as wrong answer keys or no correct option ([Gema et al. 2024](https://arxiv.org/abs/2406.04127)). A strong model that answers a mis-keyed item correctly is scored as missing it, as is every other strong model. Such items count as common-cause misses. If 3% of items are missed by every model for this reason, the cross-provider median ρ falls from 0.58 to 0.49 and the same-provider median from 0.69 to 0.62; at 6.5% they fall to 0.31 and 0.49. Not every flawed item is missed by every model, so under this model the truth lies between the raw and the 6.5% figures.

**Mapping to ρ assumes:**

1. That correlation on knowledge questions resembles correlation on the harmful items your checks see. Nothing establishes this. Harm detection may have its own items that every model finds hard, and checks share a prompt and a rubric more often than benchmark runs do.
2. That the beta-factor mixture is the right model. Calibrated pairwise as above, it reproduces each pair's joint miss exactly; for three or more layers it is conservative against a Gaussian copula ([Formal Definitions](/entanglements/fundamentals/formal-definitions/#the-entanglement-tax)).
3. That the 2023–24 models represent current ones. Both studies report similarity rising with capability, though in the reanalysis above ρ is flat at matched accuracy, so the rise may be mostly φ's ceiling. Nothing suggests newer models are less correlated. For them MMLU is near saturation, and a growing share of their remaining misses are flawed items, so measure on harder, cleaner items.
4. That the failures are benign. None of this applies to inputs chosen by an attacker.

## Priors when you cannot measure

Ranges for the mixture weight ρ. The LLM rows come from the benchmark figures above, widened for label noise; the rest have no measurement behind them and are the site authors' judgment. Use them to see whether a design could meet its budget, then measure. Where a range spans your ρ_max, the design question is open until you do.

| Configuration | Range to assume | Basis | Tax, three layers at p = 0.1 |
|---|---|---|---|
| Same model and prompt, separate calls | 0.8–1.0 | Assumed; dated versions of one model already reach 0.75–0.80 | 80–100× |
| Same provider, different models | 0.5–0.7 | Benchmark median 0.69 raw, 0.49 at full noise adjustment; up to 0.94 for a derived model | 50–70× |
| Frontier LLMs from different providers | 0.3–0.6 | Benchmark median 0.58 raw, 0.31 at full noise adjustment | 31–60× |
| LLM check and rule-based or static check | 0.1–0.3 | Assumed | 11–31× |
| LLM check and formal verification of a narrow property | 0–0.1, on that property | Assumed | 1–11× |
| LLM check and a human who sees the LLM's output | 0.2–0.4 | Assumed | 21–41× |
| Any learned checks, adaptive attacker | 1 | [Adversarial case](/entanglements/fundamentals/formal-definitions/#adaptive-adversaries-the-wrong-model) | 100× (the best single layer) |

The tax column is $1 + 99\rho$; for other layer counts and miss rates use $(1-\rho) + \rho\,p^{1-n}$ or the [lookup table](#lookup-tables). The figure of about 50× that appears across this site is a point inside the cross-provider and same-provider ranges, not a measurement of anyone's stack. No published study reports φ between LLM checks on harmful-action detection.

The pre-LLM precedent points the same way: in [Knight & Leveson (1986)](https://doi.org/10.1109/TSE.1986.6312924), 27 independently written versions of one program, run on a million inputs, failed together far more often than independence predicts.

## Asymmetric stacks: the matrix

A single ρ treats every layer as equally exposed to one shared cause. Real stacks are structured: two LLM checks may be strongly correlated with each other and weakly with a static analyzer. Keep a pairwise matrix of ρ. An illustrative one:

| | Rule filter | LLM monitor A | LLM monitor B | Anomaly detector |
|---|---|---|---|---|
| **Rule filter** | 1 | 0.1 | 0.1 | 0.2 |
| **LLM monitor A** | 0.1 | 1 | 0.6 | 0.2 |
| **LLM monitor B** | 0.1 | 0.6 | 1 | 0.2 |
| **Anomaly detector** | 0.2 | 0.2 | 0.2 | 1 |

There are two ways to use it:

- **Conservative:** plug the largest entry into the mixture. Averaging the entries understates the tax, because one strongly correlated pair dominates the joint miss.
- **Sharper:** simulate. Calibrate a Gaussian copula so that each pair's simulated joint miss rate matches the measured one, then estimate P(all miss) by Monte Carlo. The [worked examples](/entanglements/case-studies/examples/) do this.

Neither captures interactions beyond pairs, so also test the full stack on the challenge set where you can.

## Limits of the numbers

- **Stationarity.** Correlation measured in normal operation can rise under load or drift as components are tuned to each other. Re-measure on a schedule and after changes.
- **Coverage.** The challenge set is not production. Novel inputs are where shared blind spots live and where you have the least data.
- **Adversaries.** A φ from benign data says nothing about chosen inputs.
- **Small samples.** Below a few hundred items with misses, treat ρ as a range.

When in doubt, assume the correlation is higher than measured.

---

See also:
- [Formal Definitions](/entanglements/fundamentals/formal-definitions/): the tax and effective redundancy
- [Risk Propagation](/delegation-risk/risk-propagation/): derivation, simulation, the adversarial case
- [Audit Guide](/entanglements/mitigation/audit-guide/): the protocol that produces these measurements
- [Solutions](/entanglements/mitigation/solutions/): how to get under budget
