---
title: The Funding Effect
description: A measured case of distortion by an interested party — what learning that research was funded by one does to the likelihood ratio of its conclusions.
sidebar:
  order: 2
---

*Decades of meta-science measure how much an interested funder shifts a study's conclusions. Read through a likelihood ratio, the numbers say funding bias can weaken a favorable conclusion toward worthlessness; turning it into evidence against the claim takes a second mechanism, selection on the truth. The data measure distortion given funding, not what the distortion cost.*

:::note
The interlude closing Part I, supporting [The Core Model](/concepts/core-model/) and [Untrustworthy Sources](/concepts/untrustworthy-sources/) (Ch. 6). Effect sizes are quoted from the cited reviews; the likelihood-ratio models are ours.
:::

## Why this case

The Core Model says a process's [epistemic weight](/concepts/core-model/#1-epistemic-weight-exact) depends on its incentive environment. That is usually hard to measure. Here a large literature has measured how much a known conflict of interest moves a study's conclusions, across drugs, devices, nutrition, and tobacco. It is the empirical companion to the [Untrustworthy Sources](/concepts/untrustworthy-sources/#the-spectrum-of-forms) spectrum: a source whose goal-divergence on the decision is known.

## The numbers

All effect sizes below are favorable-conclusion (or favorable-result) measures for industry-funded versus independent work, quoted from the cited reviews:

| Domain | Metric | Estimate (95% CI) | Source |
|---|---|---|---|
| Biomedical (foundational synthesis) | OR, pro-industry conclusions | **3.60** (2.63–4.91) | [Bekelman et al. 2003](https://doi.org/10.1001/jama.289.4.454) |
| Drug/device, favorable results | RR | **1.27** (1.17–1.37) | [Lundh et al. 2017](https://doi.org/10.1002/14651858.MR000033.pub3) |
| Drug/device, favorable conclusions | RR | **1.34** (1.19–1.51) | Lundh et al. 2017 |
| Drug/device, result–conclusion concordance | RR | **0.83** (0.70–0.98) | Lundh et al. 2017 |
| Nutrition (pooled) | RR, favorable conclusion | **1.31** (0.99–1.72, n.s.) | [Chartres et al. 2016](https://doi.org/10.1001/jamainternmed.2016.6721) |
| Nutrition articles (interventional) | OR, favorable conclusion | **7.6** (1.3–45.7) | [Lesser et al. 2007](https://doi.org/10.1371/journal.pmed.0040005) |
| SSB systematic reviews ("no association") | adj. RR | **5.16** (1.30–20.48) | [Bes-Rastrollo et al. 2013](https://doi.org/10.1371/journal.pmed.1001578) |
| Passive-smoking reviews ("not harmful") | OR | **88** (16–477) | [Barnes & Bero 1998](https://doi.org/10.1001/jama.279.19.1566) |

In large meta-epidemiological data the effect is **modest and tight** (RR ~1.3; pooled OR ~3.6); in nutrition and tobacco it is **much larger** (OR 7–88) but with very wide intervals. The result–conclusion concordance finding (RR 0.83) is the sharpest single number: funded studies' *conclusions* skew more favorable than their own *results* warrant, so at least part of the distortion acts on the write-up, not the evidence.

## From odds ratios to a likelihood-ratio discount

An independent study reaches a favorable conclusion with probability $\alpha$ when the hypothesis $H$ is true and $\beta$ when it is false, so a favorable conclusion carries $\text{LR}=\alpha/\beta$. What funding does to that ratio depends on how the funding acts.

**A pure multiplier cancels.** If funding makes a favorable conclusion $k$ times more likely whether or not $H$ is true, then $\text{LR}' = k\alpha/k\beta = \text{LR}$. More favorable conclusions, each worth the same. **[exact]**

**Spin attenuates.** Suppose instead that, with probability $s$, a study whose honest conclusion would be unfavorable is reported as favorable, whatever the truth. Then

$$\text{LR}'(s) = \frac{\alpha + s(1-\alpha)}{\beta + s(1-\beta)},$$

which falls toward 1 as $s \to 1$ and stays above 1 for every $s<1$ when $\alpha>\beta$. **[exact, given the model]** A multiplier that saturates, taking $\alpha$ and $\beta$ to $\min(1,k\alpha)$ and $\min(1,k\beta)$, behaves the same way once $k\alpha$ reaches 1.

**A sign flip needs selection.** Under any bias applied regardless of the truth, a funded favorable conclusion stays (weak) evidence *for* $H$. It becomes evidence against $H$ only if the funder's behavior depends on $H$ itself. If funders whose product fails commission studies, or publish the favorable ones, at a rate $r_{\neg H}$ above the rate $r_H$ of funders whose product works, the observed ratio is $\text{LR}'(s)\cdot r_H/r_{\neg H}$, which drops below 1 once $r_{\neg H}/r_H > \text{LR}'(s)$. The manufactured-doubt histories ([Oreskes & Conway 2010](https://en.wikipedia.org/wiki/Merchants_of_Doubt); [Proctor 2011](https://www.ucpress.edu/book/9780520270169/golden-holocaust)) describe it used deliberately. Selection can also run the other way: a sponsor that funds trials of products it expects to work raises the favorable rate with no spin at all. The ratios in the table cannot separate these.

**A worked number (illustrative).** Take $\alpha=0.8$, $\beta=0.2$ ($\text{LR}=4$), a prior of 0.5, and read Lundh's favorable-conclusions RR of 1.34 as pure spin. Then $s\approx0.34$ and $\text{LR}'\approx1.8$: a funded favorable conclusion keeps about 44% of an independent one's log-odds weight. The passive-smoking OR of 88, read the same way, gives $s\approx0.98$ and $\text{LR}'\approx1.01$: nearly worthless, not negative. At that level of spin any selection toward $\neg H$ flips the sign, which makes tobacco the plausible case for a reversal. If sponsors instead pick products likely to work, these conversions overstate $s$.

Two things follow. The discount belongs to the funding arrangement, not the source's character: spin works through nameable channels (below) that preregistration and open data target, though how much weight they recover is, to our knowledge, unmeasured. And the table measures *distortion given funding*, not its cost, so it is not a point on the [corruption cost curve](/concepts/core-model/#4-corruption-standard-shape).

## The mechanisms behind the spin

Spin runs through nameable, auditable channels ([Sismondo 2008](https://doi.org/10.1016/j.socscimed.2008.01.010)): choice of comparator and dose, selective outcome reporting, publication bias, and ghost-management of the writing itself — internal documents indicate **18–40%** of articles on some drugs were managed by industry-hired medical-communications firms ([Sismondo 2007](https://doi.org/10.1371/journal.pmed.0040286)). Each is a separate point of attack and audit, the kind of decomposition the [loss pipeline](/concepts/core-model/#2-value-delivered-the-loss-pipeline-heuristic) anticipates.

The funding effect is one instance of a general pattern — when the rated party pays, certifiers drift toward lenient signals — surveyed with the credit-rating and audit cases in the sibling wiki's [Patterns & Failure Modes](https://evaluation-engineering.quantifieduncertainty.org/concepts/patterns-and-failure-modes/#3-incentives-and-funding-decide-trustworthiness--more-than-method-does). Design-hierarchy rating systems such as GRADE grade evidence against *bias and noise*, yet [industry sponsorship skews conclusions despite them](https://doi.org/10.1002/14651858.MR000033.pub3): they do not model a *strategic* funder choosing which studies to run and publish, the selection term above and an open problem in [Untrustworthy Sources](/concepts/untrustworthy-sources/#open-questions).

## Toward a measured version

A template for an [incentive audit](/concepts/core-model/#4-corruption-standard-shape): estimate the spin rate $s$ and the selection ratio $r_{\neg H}/r_H$ separately, by conflict-of-interest type, disclosure regime, and the presence of preregistration, open data, or replication. Separating them needs the truth about $H$ for funded products, which later independent trials or regulatory outcomes can sometimes supply; the existing meta-science supplies the corpus and outcome coding.

## Open questions

- How large are $s$ and $r_{\neg H}/r_H$ by conflict type, and how much do preregistration, open data, or independent replication reduce $s$?
- Is the gap between the tight drug estimates (~1.3×) and the large, wide nutrition/tobacco ones real, or an artifact of sample size and coding latitude?
- Can an LLM judge replicate human coders' favorable/unfavorable classification well enough to scale this measurement, without inheriting the framing biases it is meant to detect?
- Does the result–conclusion concordance gap (RR 0.83) generalize as an automatable spin signal? It needs no ground truth, only consistency between a study's data and its conclusion.
