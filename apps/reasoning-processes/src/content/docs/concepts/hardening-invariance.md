---
title: "Hardening: Invariance & Low Sensitivity"
description: Make the output a function of truth-relevant variables and near-invariant to whatever an adversary controls; rate processes by their breakdown point.
sidebar:
  order: 9
---

*Family 4 of the [Hardening overview](/concepts/hardening-techniques/). The design law behind "the answer shouldn't depend on anything the agent can change," made quantitative by fifty years of robust statistics. The lever, its limit, the constructions, and a worked bound.*

:::note[Status]
Draft v0 · updated June 2026 · maintained by [QURI](https://quantifieduncertainty.org/). Part III, family page. Exploratory. Grades per [The Core Model](/concepts/core-model/).
:::

## The lever

A robust process's output should depend on the truth-relevant variables and be near-invariant to the nuisance variables an adversary controls — phrasing, format, order, persona, which study to cite, how to frame the question. The **corruption gain** is the Lipschitz constant $\lVert\partial(\text{output})/\partial(\text{adversary levers})\rVert$, and the **breakdown point** — the fraction of inputs that must be corrupted to move the output arbitrarily — is its off-the-shelf metric ([Huber 1964](https://doi.org/10.1214/aoms/1177703732); Donoho & Huber 1983). This is robust statistics, imported wholesale.

## The limit

Invariance trades against signal and against correlated error. Reducing sensitivity to nuisance variables also blunts sensitivity to genuine ones — a maximally robust estimator (the median) discards information a mean would use, so the breakdown point buys robustness at a stated efficiency cost. And invariance is silent against the failure that hits every input equally: if a shared prior or a correlated-error mode is *built into* the truth-relevant channel, no amount of low sensitivity to nuisance helps — the whole population can be confidently wrong together. Invariance bounds what a *single* manipulated input can do, not what a systematically biased world can do.

## Constructions

| Construction | Bound / estimate | Threat it buys | Maturity | Source |
|---|---|---|---|---|
| Byzantine-robust aggregation | no linear rule tolerates 1 adversary; use Krum/trimmed mean **[exact]** | adversarial inputs to an aggregator | prototyped | [Blanchard 2017](https://arxiv.org/abs/1703.02757); [Yin 2018](https://arxiv.org/abs/1803.01498) |
| Breakdown-point ratings | rate by corrupted-fraction survived (mean 0%, median 50%) **[exact]** | a minority of corrupted inputs swinging the output | theoretical | [Donoho & Huber 1983](https://doi.org/10.1214/aoms/1177703732) |
| Influence-function audit | cap any source whose removal moves the verdict **[standard shape]** | one source dominating the conclusion | prototyped | (Hampel et al. 1986) |
| DP-noise corruption ceiling | $k$ adversarial inputs move output $\le k\varepsilon$ **[exact]** | bounded-count input manipulation | theoretical | [Dwork 2006](https://doi.org/10.1007/11681878_14) |
| Randomize-everything harness | report the invariant; variance = corruption-exposure **[heuristic]** | prompt/format/order/persona manipulation | prototyped | (opinion fuzzing) |
| Identity-masking gap | masked-vs-revealed affiliation swing **[heuristic]** | source-identity / [funding bias](/case-studies/the-funding-effect/) | prototyped | [Lundh 2017](https://doi.org/10.1002/14651858.MR000033.pub3) |
| Extremizing / recalibration | logit-pool with an extremizing parameter **[standard shape]** | shared-information under-confidence in pools | deployed | [Satopää 2014](https://doi.org/10.1016/j.ijforecast.2013.09.009) |
| Gauge-invariance tests | score violations of should-be-invariant transforms **[heuristic]** | hidden dependence on arbitrary framing | speculative | — |
| Minimal-sufficient-input reduction | commit to the smallest determining input set **[heuristic]** | attacks via provably non-load-bearing inputs | speculative | — |
| Reasoning fuzzer (CI) | monitor for output cliffs under perturbation **[heuristic]** | discontinuities an adversary can sit on | speculative | — |

## Worked bound

**Breakdown-point ratings and the Krum impossibility.** The corruption gain of an aggregating process is its Lipschitz constant w.r.t. adversary-controllable inputs, and the breakdown point is its single-number metric: the mean has breakdown 0, the median 50%. Sharpened: **no linear aggregation rule tolerates even one Byzantine input** ([Blanchard et al. 2017](https://arxiv.org/abs/1703.02757)) **[exact]** — the rigorous form of "averaging LLM judges is maximally corruptible" — so robust pooling (coordinate-wise median, trimmed mean) is mandatory, not optional. Differential privacy is the same property from the other side, bounding per-contributor influence to $\varepsilon$.

## Open questions

- What is the right efficiency-vs-breakdown trade for LLM-judge aggregation — how much accuracy do you give up for a 50%-breakdown pool?
- Can sensitivity to *nuisance* be driven down without also blunting sensitivity to genuine signal, or is there a conservation law?
- Is there an invariance construction that addresses correlated error rather than only single-input manipulation?
