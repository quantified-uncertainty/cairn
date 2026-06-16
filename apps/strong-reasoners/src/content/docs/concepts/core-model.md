---
title: The Core Model
description: The field's basic quantities — epistemic weight, the loss pipeline, unit economics, the corruption cost curve, and prospective information pricing — each graded by how much to trust it.
sidebar:
  order: 1
---

*Candidate formalisms for the field's basic quantities: what a reasoning process delivers (epistemic weight), what it costs (the loss pipeline and unit economics), what it costs to corrupt (the corruption cost curve), and how to price information before it exists. Each formalism carries an explicit grade, and each is anchored to the rigorous literature it descends from.*

:::note[Status]
Draft v0 · updated June 2026 · maintained by [QURI](https://quantifieduncertainty.org/). These are *candidate* formalisms — equations that might organize the field, not a settled model. Each carries an explicit grade: **[exact]** — correct by construction, hard only to estimate; **[standard shape]** — a form with precedent in an adjacent rigorous field, imported with stated assumptions; **[heuristic]** — a deliberately simple decomposition for audits and discussion, not a law. A field about robust reasoning should grade its own reasoning first.
:::

## Setup

A **judge** $J$ must make decisions under uncertainty. Their preferences over knowledge are summarized by a utility function $U$, represented in practice as a weighted question portfolio ([Constructing Utility Functions](/concepts/constructing-utility-functions/)). A **reasoning process** $\pi$ — peer review, a prediction market, an LLM pipeline, an expert panel — consumes effort and evidence and emits claims, estimates, or evaluations. The judge cannot verify the claims object-level; the field is about what they can do instead.

Three families of quantities characterize $\pi$: what it delivers, what it costs, and what it costs to corrupt. (All symbols are indexed in the [Glossary & Notation](/reference/glossary/).)

## 1. Epistemic weight **[exact]**

The judge's master question: a claim arrives from process $\pi$ — how much should I update? The Bayesian answer runs through the process, not the claim:

$$\frac{P(H \mid \text{report})}{P(\neg H \mid \text{report})} = \frac{P(H)}{P(\neg H)} \cdot \frac{P(\text{report} \mid H, \pi)}{P(\text{report} \mid \neg H, \pi)}$$

:::tip[Definition — epistemic weight]
A process's **epistemic weight** is its likelihood-ratio profile: how strongly its outputs discriminate truth from falsehood, by domain and conditions, conditional on its incentive environment.
:::

The formula is probability theory and cannot be wrong; everything hard is estimation. Reports are high-dimensional, so the profile is over report-space, not a single number; and the profile is conditional on the process's incentive environment, so it shifts when the threat model does — quoting a track-record weight under a changed threat model is the canonical way judges get exploited.

The classical foundation here is **Blackwell's comparison of experiments**: a process is, formally, an experiment, and Blackwell's theorem gives the exact sense in which one process is more informative than another — $\pi_A$ dominates $\pi_B$ if and only if *every* decision-maker, whatever their utility function, weakly prefers $\pi_A$. This is the rigorous backbone under the [Process Catalogue's](/concepts/process-catalogue/) comparisons: where Blackwell dominance holds, the comparison is utility-free; where it doesn't (the usual case), comparisons are $U$-relative, which is why the judge layer comes first.

Operationalizations, in increasing availability: **track record** (resolved outputs estimate the profile directly — expensive, hard to fake, which is why it works); **replacement cost** (a 2021 QURI proposal: weight a claim by what a calibrated reference team would charge to produce an estimate of the same resolution); **process audit** (infer weight from measured components — calibration, consistency, and corruption exposure below). Limiting cases: an ideal process has likelihood ratios far from 1; a worthless one sits at 1; a *captured* process can sit below 1 — anti-informative while looking authoritative.

## 2. Value delivered: the loss pipeline **[heuristic]**

Information degrades between the world and the decision. As a first-order audit template:

$$V_{delivered} \approx V_{source} \cdot (1 - L_{cod}) \cdot (1 - L_{eval}) \cdot (1 - L_{interp})$$

- $L_{cod}$ — **codification loss**: the format discards source information (a four-field rubric cannot carry what the evaluator saw).
- $L_{eval}$ — **evaluator loss**: noise and bias introduced by whoever or whatever executes the process.
- $L_{interp}$ — **interpretation loss**: the consumer misunderstands, half-reads, or distrusts the output.

Treat this exactly as one treats the Drake equation: a decomposition that tells an auditor *where to look* — each loss is separately measurable (constrained-vs-rich report comparisons; inter-evaluator experiments; consumer quizzes) — not a formula that computes anything. Three known failure modes of the model itself:

1. **Value is not a conserved fluid.** Decision-relevance is concentrated: losing 20% of the bits can lose 0% or 100% of the value. The honest version prices losses in $U$-units per stage, which requires the judge layer, not just the pipeline.
2. **The stages are coupled by design.** Heavier codification often *reduces* interpretation loss — that is what rubrics, probabilities, and standard formats are *for*. The central design problem is this joint trade-off, which a product of independent terms hides.
3. **Bias is not attenuation.** A corrupted or motivated stage produces *misleading* information — negative value — which a model floored at zero cannot express. Corruption needs its own treatment (§4).

The rigorous ancestors, for when the heuristic runs out: codification loss is bounded by **channel-capacity** style arguments (with the caveat that semantic value ≠ bits); evaluator loss under misaligned incentives is an *equilibrium quantity*, not a free parameter — **Crawford–Sobel cheap talk** derives how transmitted information falls as the evaluator's interests diverge from the judge's, which is the theory-backed version of "incentive audits matter"; interpretation loss is the subject of **rational inattention**, which models the consumer as a capacity-limited channel.

### The exact skeleton underneath **[exact]**

The heuristic has a rigorous core. Model the stages as a Markov chain — World → Evidence → Report → Interpretation — and the **data-processing inequality** ([Cover & Thomas, Thm 2.8.1](https://onlinelibrary.wiley.com/doi/book/10.1002/047174882X)) gives, with no independence or conservation assumptions:

$$I(\text{World};\, \text{Interpretation}) \;\le\; I(\text{World};\, \text{Report}) \;\le\; I(\text{World};\, \text{Evidence})$$

Information about the world is monotonically non-increasing along the pipeline, and each stage's loss becomes a *measurable mutual-information gap* rather than a free parameter. Two caveats keep this from retiring the heuristic outright. Mutual information is value-blind — it counts bits, not decision-relevance; the $U$-weighted analogue replaces MI with the drop in achievable expected utility, $\max_a E[U \mid a, \cdot]$, at each stage, monotone by the same argument but dearer to estimate. And the inequality bounds only *loss*, never bias: a stage can destroy no information while still pointing the judge the wrong way — which is §4's subject.

## 3. Cost: unit economics **[standard shape]**

For $n$ consumers, each spending $c_{interp}$ to absorb the output, and a process costing $c_{process}$ to run:

$$\text{Net benefit} = (V_{delivered} - c_{interp}) \cdot n - c_{process}$$

An accounting identity, with the assumptions stated: homogeneous consumers, value additive across them (information is non-rival), no second-order effects. Its use is structural: high-$n$ processes (indices, market prices) tolerate enormous process cost; $n{=}1$ processes must be cheap or precious. The comparable figure of merit across processes is **cost per validated bit** — the price of information that survived checking, not the price of text — with the honest caveat that defining a common "validated bit" across output types (probabilities, rulings, models) is itself an open problem flagged in [the Process Catalogue](/concepts/process-catalogue/).

## 4. Corruption **[standard shape]**

Everything above assumed the process is left in peace. Following security economics' cost-to-break tradition:

:::tip[Definition — corruption cost curve]
$$C_\pi(\Delta, g, t) = \text{the minimum an adversary of capability } g \text{ must spend, at time } t \text{, to distort } \pi\text{'s delivered output by } \Delta$$

where $\Delta$ is measured in $U$-units — the judge's utility loss from the distortion — which keeps the definition meaningful for non-scalar outputs. The **robustness condition**: $C_\pi(\Delta, g, t) > \text{(adversary's stake in } \Delta)$, evaluated per threat model — there is no threat-model-free robustness.
:::

For participants inside the process, the **corruption surplus** is the maximum expected gain from deviating from honest effort; surplus is what attackers harvest, the cost curve is what they pay. Consequences:

- **Robustness is a rating, not an adjective**: a process is robust against capability $g$, for stakes $s$, as of time $t$ — like a crash rating, and like a crash rating it decays as attacks improve, so the $t$ index is not decoration. Measuring $C_\pi$ empirically (red-team producers paid to corrupt the output) is the practice this book calls an **incentive audit**.
- **Detection can substitute for prevention.** A tamper-*evident* process — corruption succeeds but is always discovered — often achieves the inequality more cheaply than tamper-*proofing*, because discovery destroys the adversary's stake retroactively (clawbacks, reputation). Many catalogue entries are best hardened this way.
- **A rational judge is not a defense.** **Bayesian persuasion** (Kamenica–Gentzkow) proves that an actor who controls the *information structure* can profitably manipulate even a fully rational Bayesian receiver. The corruption channel is closed by controlling who designs the process and verifying what was run — never by judge intelligence alone. This is the formal reason the field is about processes rather than smarter judges.
- **Weight and corruption are coupled**: the likelihood-ratio profile of §1 is conditional on the incentive environment; under attack, $L_{eval}$ acquires an optimizer-chosen component that does not average out like noise.

How fast $C_\pi$ falls as adversary capability $g$ rises — the *corruption-capacity curve*, per process — is among the most decision-relevant unmeasured quantities in AI oversight ([Overseeing Automated Research](/proposals/overseeing-automated-research/)).

## 5. Pricing information before it arrives **[exact]**

The master question of §1 has a prospective twin: not "how much should I update on this claim?" but *how much would this information move me — quoted before anyone pays to produce it?* Classical value-of-information theory answers only relative to a single fixed decision. A judge usually wants something broader: how much a source would reduce uncertainty across the whole portfolio of questions they care about.

The math here is unusually kind. For a forecast $q$ on a question and an anticipated information source $X$, coherence forces two identities. The expected update is zero (conservation of expected evidence), and the expected *squared* update equals the expected reduction in uncertainty:

$$\underbrace{\mathbb{E}\big[(q_X - q)^2\big]}_{\text{expected movement}} \;=\; \underbrace{q(1-q) - \mathbb{E}\big[q_X(1-q_X)\big]}_{\text{expected uncertainty resolved}}$$

(In log-score terms: expected KL update $=$ expected entropy reduction $=$ the mutual information $I(Q; X)$.) "How much will this move my forecast?" and "how much will this shrink my uncertainty?" are the same question asked twice — so a model's prospective quotes are checkable *without ground truth*: the two phrasings must agree, quotes for a bundle of sources must decompose by the chain rule, and realized updates must match quoted magnitudes on average. The decision-free value of a source is then a portfolio sum, $\sum_i w_i\, I(Q_i; X)$, with weights supplied by the judge's utility function over information — the prospective version of what [Epistemic Impact Analysis](/proposals/epistemic-impact-analysis/) calls profundity.

The single-step identity extends across whole forecast streams: over any horizon, a coherent forecaster's expected *cumulative* sum of squared belief moves equals its expected total uncertainty reduction ([Augenblick & Rabin 2021](https://academic.oup.com/qje/article-abstract/136/2/933/6127317)). Each question carries a fixed expected **movement budget** — $q_0(1-q_0)$ for a binary question — so persistent excess movement is quantitative evidence of over-reaction, and a deficit of under-reaction, scored from the stream alone with no resolutions required. This is the cumulative form of the martingale condition in [Consistency Evaluations](/proposals/consistency-evals/), and it was already a working statistical test on human forecaster data before LLMs existed.

This is the field's intended flywheel: a model calibrated at first-order estimation *and* consistent at these second-order quotes can price information before it exists, which is what lets a judge commission measurement rather than merely react to it — and every realized update is free calibration data for the next round of quotes. The identities are **[exact]**; what is unmeasured is how well current models satisfy them. [Consistency Evaluations](/proposals/consistency-evals/) supplies the check battery; [Epistemic Impact Analysis](/proposals/epistemic-impact-analysis/) builds the pricing system on top.

## What would make this chapter trustworthy

The grades are the agenda. The **[exact]** parts need estimation methods (how to bound a likelihood-ratio profile from finite, unresolved track records; how closely current models satisfy the pricing identities). The **[standard shape]** parts need their assumptions stress-tested in our setting (does cost-to-break behave for information attacks the way it does for cryptographic ones?). The **[heuristic]** part is half-replaced: §2 now has its exact information-theoretic skeleton, but the cheap-talk and rational-inattention rebuilds — losses derived as equilibrium quantities rather than asserted — remain to be done. Until then, use the pipeline for audits, the identity for budgeting, the likelihood ratio for updating, and the cost curve for threat modeling — and trust each exactly as far as its grade.

## Where each piece is developed

Value and its pricing: [Epistemic Impact Analysis](/proposals/epistemic-impact-analysis/). The portfolio behind $U$: [Constructing Utility Functions](/concepts/constructing-utility-functions/). What validation bottoms out in: [What Grounds an Oversight Protocol?](/concepts/oversight-protocols/). Cheap unsupervised floors on evaluator loss: [Consistency Evaluations](/proposals/consistency-evals/). The comparison table: [The Process Catalogue](/concepts/process-catalogue/).
