---
title: Objections & FAQ
description: The strongest objections to evaluation engineering, the responses on offer, the cost/scale picture, and external commentary.
---

*Status: draft, adapted from the founding posts and recorded external feedback; objections on competition, Goodhart, monoculture and standing added October 2026.*

The field is young and the framing is uncertain. This page collects the objections worth taking seriously, the responses currently on offer (often partial), and outside commentary.

## "This is too abstract to be a real field or cause area"

Granted: the area is vague. There are no crisp boundaries between evaluation systems, forecasting, institutional decision-making, epistemics, and related terms. But vagueness doesn't imply unimportance — if anything it has made the area *more* neglected than it would otherwise be. The operative test isn't "can we define it cleanly" but "does this framing help us identify valuable concrete projects?" If good projects get started, the higher-level carving can be revised later. (If you can carve the space better, that itself is a contribution — see [Cruxes](/start-here/key-questions/).)

## "Scaled evaluations can never be accurate enough"

A common reaction is that these proposals are AGI-complete — usually resting on the assumption that the outputs must be *highly accurate*. They don't. The estimates and evaluations only have to be **better than what people would have done otherwise**. People already make enormous numbers of informal evaluations and judgments; these are typically noisy, overconfident, and inaccurate. The bar is to beat that baseline cheaply, not to be correct in absolute terms.

## "Why invent so much terminology instead of engaging the literature?"

The work spans many fields, and one has to stop somewhere. The most conspicuous gap is the established academic field of **Evaluation** (program evaluation): the bet is that the bulk of this cause area lies where that field has shown little interest, but that's a bet, not a verdict. Recommendations and pointers are genuinely wanted. The decision-automation literature is also relevant and under-engaged.

## "Why write theory instead of just building?"

The author has spent years building tools and running practical experiments in the space, and concluded that (a) his thinking was unusually hard to articulate and diverged from others', and (b) hiring a large team to "just build it" is itself bottlenecked on having a clearly articulated vision. Theory first, then a return to direct work — not theory instead of it.

## "Why make evaluation specifically such a big deal?"

The short response: forecasting discourse has under-weighted evaluation, and many of the highest-stakes existing processes (courts, grantmaking, hiring, impact assessment) are evaluation problems, so plausibly more resources flow into evaluation than into clean estimation. The full statement is in [Evaluation Engineering](/start-here/introduction/#why-evaluation-specifically). The honest weakness: "plausibly more resources" is an unmeasured claim, and it is the kind of number this field should be able to estimate.

## "This is already being done, by the AI-evals industry"

Partly true. Building and validating LLM judges, error bars and benchmark-gaming defences is now a large, funded activity, and this wiki borrows from it ([Chapter 1](/start-here/introduction/#not-ai-model-evals-though-they-overlap)). Its object is AI models and products. Audited, high-throughput evaluation of grants, organizations, research claims and policies has fewer builders; the closest large effort, DARPA SCORE, was a research program, not a standing system ([Lineage](/start-here/lineage/#outside-precedents-for-the-core-pattern)). The neglect claim is weaker than the founding drafts assumed and should be stated per domain.

## "Scale makes Goodhart worse"

The more decisions ride on a score, the harder the evaluated work to move it, and the faster it stops tracking what it measured ([Patterns §1](/concepts/patterns-and-failure-modes/)). A cheap, consistent, widely used evaluator is the ideal target. This is the strongest argument against the field's premise. The response on offer is design rather than denial: hidden random audits with penalties, private prompts and audit samples, rotation of judges, and treating robustness to gaming as a property to be measured ([Evaluation as a System](/concepts/the-systems-view/#the-design-space); [Measuring an Evaluator](/concepts/measuring-an-evaluator/)). Whether these hold under sustained pressure is untested outside AI benchmarks, where the record is poor.

## "Shared models make errors systemic"

If many funders score applicants with the same few models, their errors correlate, and some applicants are rejected everywhere. Theory shows convergence on a shared algorithm can lower overall decision quality even when it is more accurate for each user alone ([Kleinberg & Raghavan 2021](https://arxiv.org/abs/2101.05853)), and shared models can concentrate bad outcomes on the same people ([Bommasani et al. 2022](https://arxiv.org/abs/2211.13972)). A human panel's idiosyncrasy is a hidden diversification. Mitigations (different judges per institution, human review near decision thresholds) cost part of the savings. Unanswered; see [crux 13](/start-here/key-questions/#on-the-field-itself).

## "A model has no standing to judge"

A panel can be questioned, blamed and replaced; a model's verdict has no author. People may reject model-scored outcomes even when the model is as accurate as the panel, and in the EU, solely automated decisions with significant effects on people are restricted ([Epistemic Culture](/concepts/epistemic-culture/#rollout)). The response is to keep a named human decision-maker and an appeal route, and to use the model to triage and predict rather than to decide. That limits how much labor is saved.

## How big is this, and who pays?

The founding draft sizes it as a challenge on the order of autonomous driving or ending aging, perhaps \$100B over 20 years. That figure is an illustrative guess with no model behind it, and no conclusion here rests on it. The expectation is *not* that effective altruists fund most of it. Companies are already working in the space and will continue to; the high-leverage role is to figure out how such work can be made useful for altruistic purposes and to nudge the field in beneficial directions. The mental model is closer to **clean meat than to AI alignment** — shaping and accelerating a field that will largely happen anyway, rather than carrying it alone.

## Who is this for?

Not individuals or small side-projects. The model is full-time specialist teams — think hedge-fund analyst desks or data-science teams — producing outputs for large organizations and the public. Small-scale benefits are a welcome side effect, not the goal. The one area where small-group work *is* on the critical path is [epistemic culture](/concepts/epistemic-culture/), which likely has to be tested in small communities first.

## External commentary

Outside reactions, especially critical ones, are worth recording. Notes from **Mark Xu** on an early version, paraphrased:

- The most exciting part is the ability to **pay for outcomes instead of processes** — and possibly to *outsource* evaluation. But much of the current bottleneck is simply **people capable of doing the evaluation work** (e.g. grantmakers), and it's unclear what concrete proposal solves that.
- The overall sketch is "a bit too vague to have strong opinions about." It seems clearly useful if done well, useless if done poorly.
- Many things he's wanted good estimates for turn out to be questions about **how the economy actually works** (e.g. "if all software engineers got 10% more productive, how much bigger does the economy get?") more than about estimation/evaluation methodology per se.
- Existing shallow evaluations (QURI's, epistemic spot checks, the ALLFED shallow eval) have already seemed useful — possibly because the current state of evaluation is so poor that even shallow work helps. A generically useful move is **"assumption unearthing"**: what has to be true about the world for an organization's claims to hold?
- A skeptical magnitude estimate: even *perfect* evaluations might not increase the amount of useful work being done by more than ~2× — because the EA funding space has already funded the obviously-good things. (Doubling would still be very good.)
- The single most wanted thing: **a few specific, concrete (even fictional) case studies** showing the value generated by better estimation and evaluation.

That last request is partly answered by the fictional [worked example](/concepts/worked-example/), by the outside evidence in [Lineage](/start-here/lineage/#outside-precedents-for-the-core-pattern), and partly by a handful of experiments and deployments — the [amplification experiment](https://forum.effectivealtruism.org/posts/ZTXKHayPexA6uSZqE/part-2-amplifying-generalist-research-via-forecasting) (2019: 87% of an evaluator's value recovered, though not yet cheaply), shallow org evaluations, pre-execution project-value prediction, and deployed tools (Squiggle AI, RoastMyPost) with published usage and failure data. They're small, but they're concrete. See [Related Work](/reference/related-work/) for the full inventory. Turning them into crisp, persuasive case studies remains a standing gap; see [Open Problems](/open-questions/).
