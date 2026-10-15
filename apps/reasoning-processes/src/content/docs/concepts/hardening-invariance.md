---
title: "Hardening: Invariance & Low Sensitivity"
description: Make the output a function of truth-relevant variables and near-invariant to whatever an adversary controls; rate processes by their breakdown point.
sidebar:
  order: 9
---

*Family 4 of the [Hardening overview](/concepts/hardening-techniques/). The design law behind "the answer shouldn't depend on anything the agent can change," made quantitative by fifty years of robust statistics. The lever, its limit, the constructions with their cheapest attacks, and a worked bound with numbers.*

## The lever

A robust process's output should depend on the truth-relevant variables and be near-invariant to the nuisance variables an adversary controls — phrasing, format, order, persona, which study to cite, how to frame the question. The **corruption gain** is the Lipschitz constant $\lVert\partial(\text{output})/\partial(\text{adversary levers})\rVert$, and the **breakdown point** — the fraction of inputs that must be corrupted to move the output arbitrarily — is its off-the-shelf metric ([Huber 1964](https://doi.org/10.1214/aoms/1177703732); Donoho & Huber 1983). This is robust statistics, imported wholesale.

## The limit

Invariance trades against signal and against correlated error. Reducing sensitivity to nuisance variables also blunts sensitivity to genuine ones — a maximally robust estimator (the median) discards information a mean would use, so the breakdown point buys robustness at a stated efficiency cost. And invariance is silent against the failure that hits every input equally: if a shared prior or a correlated-error mode is *built into* the truth-relevant channel, no amount of low sensitivity to nuisance helps — the whole population can be confidently wrong together. Invariance bounds what a *single* manipulated input can do, not what a systematically biased world can do.

## Constructions

| Construction | Bound / estimate | Defends against | Cheapest attack (≈ cost) | Maturity · source |
|---|---|---|---|---|
| Byzantine-robust aggregation | no linear rule tolerates 1 adversary; median 50% **[exact]** | adversarial aggregator inputs | corrupt just past the breakdown fraction (e.g. >50% for median) | prototyped · [Blanchard 2017](https://arxiv.org/abs/1703.02757) |
| Breakdown-point ratings | corrupted-fraction survived (mean 0%, median 50%) **[exact]** | a minority swinging the output | exceed the breakdown fraction (cost scales with it) | theoretical · Donoho & Huber 1983 |
| Influence-function audit | cap any source whose removal flips the verdict **[standard shape]** | one source dominating | spread manipulation across many sources, each below the cap (≈ cost of many Sybils) | prototyped · (Hampel et al. 1986) |
| DP-noise corruption ceiling | $k$ adversarial inputs change any output probability by at most a factor $e^{k\varepsilon}$ **[exact]** | bounded-count manipulation | control many inputs so $k\varepsilon$ is large (≈ cost of $k$ inputs) | theoretical · [Dwork et al. 2006](https://doi.org/10.1007/11681878_14); group privacy, [Dwork & Roth 2014](https://doi.org/10.1561/0400000042) Thm 2.2 |
| Randomize-everything harness | report the invariant; variance = exposure **[heuristic]** | prompt/format/persona manipulation | find a bias invariant across the fuzz distribution (moderate) | prototyped · (opinion fuzzing) |
| Identity-masking gap | masked-vs-revealed affiliation swing **[heuristic]** | source-identity / [funding bias](/case-studies/the-funding-effect/) | leak affiliation through *content/style* the mask can't hide (low) | prototyped · [Tomkins et al. 2017](https://doi.org/10.1073/pnas.1707323114) |
| Label-swap decision-neutrality | output invariant under relabeling a no-information decision; residual asymmetry $= b_\pi(D)$ **[heuristic]** | decision-relative (goal) bias | carry the bias in *content* a label-swap can't reach — symmetric cue, or asymmetric evidence vs. a planted lean (low–moderate) | measured once · five LLM judges: leans of a few points at most, no consistent label favored; identical-description prompts uninformative ([log](/case-studies/measurement-log/)) · [Kusner 2017](https://arxiv.org/abs/1703.06856), [Wang 2023](https://arxiv.org/abs/2305.17926) |
| Extremizing / recalibration | logit-pool with an extremizing parameter **[standard shape]** | shared-info under-confidence | feed correlated forecasts that extremizing wrongly sharpens (low) | deployed · [Satopää 2014](https://doi.org/10.1016/j.ijforecast.2013.09.009) |
| Gauge-invariance tests | score violations of invariant transforms **[heuristic]** | hidden framing dependence | use a bias that respects tested gauges but not an untested one (moderate) | speculative · — |
| Minimal-sufficient-input reduction | commit to the smallest determining set **[heuristic]** | attacks via non-load-bearing inputs | put the manipulation *inside* the minimal sufficient set (moderate) | speculative · — |
| Reasoning fuzzer (CI) | monitor for output cliffs under perturbation **[heuristic]** | discontinuities an adversary sits on | make the manipulation smooth — no cliff to detect (moderate) | speculative · — |

## Worked bound

**Breakdown-point ratings and the Krum impossibility.** The corruption gain of an aggregating process is its Lipschitz constant w.r.t. adversary-controllable inputs, and the breakdown point is its single-number metric. With $n=10$ judges: the **mean** has breakdown 0 — one corrupted judge can drag the average arbitrarily far — while the **median** survives up to 4 corrupted judges (breakdown 50%). Sharpened: **no linear aggregation rule tolerates even one Byzantine input** ([Blanchard et al. 2017](https://arxiv.org/abs/1703.02757)) **[exact]**, the rigorous form of "averaging LLM judges is maximally corruptible," so robust pooling (coordinate-wise median, trimmed mean) is mandatory, not optional. Differential privacy bounds per-contributor influence from the other side, on the output *distribution* (a factor $e^{\varepsilon}$), not on the output value. The cheapest defeat is simply to exceed the breakdown fraction — so the breakdown point *is* the attack budget.

**What the label-swap run adds.** The first measurement of an invariance construction ([Measurement Log](/case-studies/measurement-log/)) shows that the test design matters. When the two options were described identically, all five models answered 50 every time, which says nothing about latent lean. Once the options differed, the label effects could be measured, and they were small. The one sizeable asymmetry was a position effect: +8 points on the 0–100 scale for one model, mostly from one prompt. An invariance check is informative only when the inputs do not make the invariant answer obvious.

## Open questions

- What is the right efficiency-vs-breakdown trade for LLM-judge aggregation — how much accuracy do you give up for a 50%-breakdown pool?
- Can sensitivity to *nuisance* be driven down without also blunting sensitivity to genuine signal, or is there a conservation law?
- Is there an invariance construction that addresses correlated error rather than only single-input manipulation?
