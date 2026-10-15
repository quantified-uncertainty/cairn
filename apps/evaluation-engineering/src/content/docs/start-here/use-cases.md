---
title: Why It Matters — Use Cases
description: Where cheap, audited evaluation at scale would change decisions — grant and research triage, peer review, charity evaluation — and the speculative mechanisms that first motivated the field.
---

*Status: draft, revised October 2026. The first section uses deployed or tested systems; the second keeps the founding posts' speculative cases, which never shipped.*

The point of an evaluation system is end-to-end value: resources in, better decisions out. An accurate evaluation that nobody acts on is worth nothing, so the motivating question is which decisions improve when adequate evaluations get cheap.

## Cases with real systems behind them

**Grant portfolios.** Many funders read closely only the grants a program officer has time for; the rest are renewed on momentum. The [worked example](/concepts/worked-example/) prices four designs for a funder with 1,000 grants a year and shows what a 50-item audit can and cannot establish.

**Research triage.** DARPA's SCORE program priced the replicability of claims from about 3,000 papers and validated the forecasts against a small replicated subset; human forecasts carried real signal and AI imitators did not ([Lineage](/start-here/lineage/#outside-precedents-for-the-core-pattern)). A cheap replicability prior over a literature is useful to funders, reviewers and meta-analysts even when it is wrong on many individual claims.

**Peer review.** At AAAI-26 every main-track paper received a labelled AI review alongside the human ones, and surveyed authors and committee members preferred it on most criteria while about half of committee respondents said it missed points a human would have caught ([LLMs as Evaluators](/concepts/llm-evaluators/#what-the-judge-literature-measures)). Review is the clearest live case of an LLM taking a slot in a judgment-bound evaluation system, and of the gaming that follows: hidden "positive review only" prompts turned up in arXiv preprints in 2025 ([evidence](/concepts/llm-evaluators/#evidence-under-optimization-pressure)).

## Charity evaluation and prioritization

This is the case closest to the founding notes. GiveWell, Open Philanthropy, 80,000 Hours and others put serious effort into evaluating charities and causes, and it has been hard to scale; there are perennial calls for a "GiveWell for X".

The framing here is augmentation, not replacement:

> for every prioritization or evaluation researcher we have, can we eventually get x% more value out of them?

A system that let existing teams cover far more questions at lower per-item quality could change which questions get asked at all. How large that multiplier is has not been measured. Small instances exist: QURI's [shallow evaluations of longtermist organizations](/reference/related-work/) (2021) and Sam Nolan's uncertainty-quantified rebuild of GiveWell's GiveDirectly analysis. The strongest skeptical reply, that even perfect evaluations might not more than double useful work because the binding constraint is capable people, is in [Objections & FAQ](/reference/objections/#external-commentary).

## The founding posts' speculative cases

The 2021–22 notes motivated the field with mechanisms that each need cheap, trusted estimates at scale. None has been deployed at meaningful scale, so they show what the field would enable rather than demand for it.

- **Futarchy.** Hanson's proposal ([drafted from 2000, published 2013](https://mason.gmu.edu/~rhanson/futarchy2013.pdf)) to "vote on values, bet on beliefs" needs a welfare metric that resists corruption and policy forecasts cheap enough to commission routinely. Both are evaluation problems whatever the forecasting mechanism.
- **Certificates of impact.** [Christiano's 2014 proposal](https://forum.effectivealtruism.org/posts/yNn2o3kEhixZHkRga/certificates-of-impact), trialled with Katja Grace as the 2015 [Impact Purchase](https://impactpurchase.org/certificates-of-impact/), needs value estimates for many projects, and faces the candidness problem: publicly priced impact gives organizations reason to withhold their weaker work ([Epistemic Culture](/concepts/epistemic-culture/#the-candidness-problem)).
- **General cost–benefit calculators.** QALYs and welfare economics put numbers on acts in narrow domains. A general calculator for individuals and organizations would need cheap large-scale estimation, and probably a way to plug in different value functions; nobody has shown that is feasible.
- **Estimation tooling.** Guesstimate (2016) made uncertain estimation accessible and then hit diminishing returns; the later bet is on composable [estimation functions](/concepts/techniques/) and LLM-generated models such as Squiggle AI ([Related Work](/reference/related-work/)).

## The common thread

None of these needs near-perfect accuracy. Each needs outputs better than what decision-makers would otherwise have used, at a cost low enough that they get used, and robust enough that they survive the evaluated caring about them. See [Evaluation as a System](/concepts/the-systems-view/) for the design target and [Objections & FAQ](/reference/objections/) for the case against.
