---
title: The Funding Effect
description: The cleanest measured instance of corruption moving a process's epistemic weight — what learning that research was funded by an interested party does to the likelihood ratio of its conclusions.
sidebar:
  order: 2
---

*The best-replicated empirical handle the field has on the [corruption cost curve](/concepts/core-model/#4-corruption-standard-shape): decades of meta-science measuring how much an interested funder shifts a study's conclusions. Read as a likelihood-ratio discount, it is a real, numbered instance of corruption pulling a process's [epistemic weight](/concepts/core-model/#1-epistemic-weight-exact) toward 1 — and, at the limit, below it.*

:::note[Status]
Draft v0 · updated June 2026 · maintained by [QURI](https://quantifieduncertainty.org/). A case study supporting [The Core Model](/concepts/core-model/) and the [Untrustworthy Sources](/concepts/untrustworthy-sources/) interlude. Effect sizes are quoted from the cited reviews; the likelihood-ratio reframing is ours and exploratory.
:::

## Why this is the field's cleanest measured corruption

The Core Model claims a process's [epistemic weight](/concepts/core-model/#1-epistemic-weight-exact) is conditional on its incentive environment — that under interested pressure, the likelihood-ratio profile shifts, and a captured process can sit at or below 1 (anti-informative while looking authoritative). That claim is usually hard to measure. The funding effect is the exception: a large, replicated meta-scientific literature has measured exactly how much a known conflict of interest moves a study's conclusions, across drugs, devices, nutrition, and tobacco. It is the empirical companion to the [Untrustworthy Sources](/concepts/untrustworthy-sources/) spectrum — a source whose honesty credence $\tau$ is known to be compromised — turned into numbers.

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

The honest pattern is itself the finding. In rigorous, high-$n$ meta-epidemiological data the effect is **modest and tight** (RR ~1.3, the foundational pooled OR ~3.6); in nutrition and tobacco it is reported as **dramatically larger** (OR 7–88) but with very wide confidence intervals and smaller samples. The result–conclusion concordance finding (RR 0.83) is the sharpest single number: funded studies' *conclusions* skew more favorable than their own *results* warrant — corruption acting on the codification stage, not the evidence.

## From odds ratios to a likelihood-ratio discount

Recast in the Core Model's terms. A study's favorable conclusion is evidence for the underlying hypothesis $H$ with likelihood ratio $\text{LR} = P(\text{favorable} \mid H)/P(\text{favorable} \mid \neg H)$. If funding makes a favorable conclusion roughly $k$ times more likely *regardless of whether $H$ is true* — the funding effect operating as a multiplier on the report, not the world — then the funded study's favorable conclusion carries an attenuated $\text{LR}' < \text{LR}$, with the gap set by $k$. **[heuristic]**

Three consequences worth stating precisely:

1. **The weight is discounted, not destroyed.** The pharma-scale numbers ($k \approx 1.3$) imply a funded favorable result is worth a noticeable-but-partial fraction of an independent one; the nutrition/tobacco numbers push $\text{LR}' \to 1$ (worthless).
2. **It can flip sign.** In the tobacco limit, a glowing industry-funded result is *negative* evidence for the favorable claim — $\text{LR}' < 1$ — because the conclusion is better explained by capture than by truth. This is the Core Model's "captured process sits below 1," observed. "Information loss" undersells it: the update can reverse. The manufactured-doubt histories ([Oreskes & Conway 2010](https://en.wikipedia.org/wiki/Merchants_of_Doubt); [Proctor 2011](https://www.ucpress.edu/book/9780520270169/golden-holocaust)) document this limiting case as deliberate engineering.
3. **It is recoverable.** The discount is mediated by the other robustness features: preregistration, open data, and independent replication claw most of the weight back. The funding signal's cost is therefore not intrinsic to the source but a function of how much [tamper-evidence and deterrence](/concepts/hardening-techniques/) the process carries — which is the constructive reading.

## The mechanisms behind the multiplier

The effect is not mysterious sender dishonesty; it is a set of nameable, auditable channels ([Sismondo 2008](https://doi.org/10.1016/j.socscimed.2008.01.010)): choice of comparator and dose, selective outcome reporting, publication bias, and ghost-management of the writing itself — internal documents indicate **18–40%** of articles on some drugs were managed by industry-hired medical-communications firms ([Sismondo 2007](https://doi.org/10.1371/journal.pmed.0040286)). This matters for the field because each channel is a distinct point of attack and audit: the corruption enters at design, analysis, reporting, and authorship as separable links — exactly the kind of decomposition the [loss pipeline](/concepts/core-model/#2-value-delivered-the-loss-pipeline-heuristic) anticipates, here with the bias term ($L_{\text{eval}}$ acquiring an optimizer-chosen component) made empirical.

It is also why design-hierarchy rating systems are insufficient on their own: GRADE and similar grade evidence against *bias and noise*, but [industry sponsorship skews conclusions despite design hierarchies](https://doi.org/10.1002/14651858.MR000033.pub3) — they do not model a *strategic* funder choosing which studies to run and publish, the open problem flagged in [Untrustworthy Sources](/concepts/untrustworthy-sources/#open-questions).

## Toward a measured version

This case study is also a template for the [incentive audit](/concepts/core-model/#4-corruption-standard-shape) the field needs to standardize. The fundable project: estimate the likelihood-ratio discount $\text{LR}'/\text{LR}$ as a function of conflict-of-interest type, disclosure regime, and the presence of preregistration/open-data/replication — turning one qualitative row of the [Catalogue's](/concepts/process-catalogue/) corruption column into measured numbers with intervals. The existing meta-science supplies the corpus and the outcome coding; what it lacks is the likelihood-ratio framing and the recovery-factor estimates.

## Open questions

- What is the actual functional form of $\text{LR}'/\text{LR}$ versus conflict type, and how much of the discount is clawed back per unit of preregistration, open data, or independent replication?
- The drug-data effect is tight (~1.3×) while nutrition/tobacco estimates are large but wide — is the difference real (field capturability) or an artifact of sample size and outcome-coding latitude?
- Can an LLM judge replicate human coders' favorable/unfavorable classification reliably enough to scale this measurement across a large corpus — and would it inherit the same framing biases it is meant to detect?
- Does the result–conclusion concordance gap (RR 0.83) generalize as the cleanest, most automatable corruption signal, since it needs no external ground truth — only internal consistency between a study's data and its stated conclusion?
