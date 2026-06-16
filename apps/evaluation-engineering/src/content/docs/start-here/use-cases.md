---
title: Why It Matters — Use Cases
description: Concrete things highly optimized evaluation systems would unlock — futarchy, certificates of impact, felicific calculators, Guesstimate-scale tooling, and charity prioritization.
sidebar:
  order: 3
---

*Status: early draft, adapted from the founding posts (see [Lineage](/start-here/lineage/)).*

The point of an evaluation system is **end-to-end value**: resources in, better decisions out. An evaluation that is highly accurate but completely ignored is worth nothing. So the right way to motivate the field is not "wouldn't accurate numbers be nice" but "here are decisions that get meaningfully better when good evaluations get cheap." This page collects the recurring examples.

```mermaid
flowchart LR
  subgraph inputs[Inputs]
    pred[Prediction]
    calc[Calculation]
    ont[Ontology]
    evalm[Evaluation methods]
    culture[Epistemic culture]
  end
  inputs --> sys[Highly optimized<br/>evaluation systems]
  sys --> uc
  subgraph uc[Use cases]
    fut[Futarchy / policy]
    impact[Impact estimates]
    life[Life & work optimization]
    meta[Meta-evaluation]
  end
  uc --> value[Decisions that<br/>wouldn't otherwise be made]
```

## Futarchy and policy

Robin Hanson's [futarchy](https://en.wikipedia.org/wiki/Futarchy) (2007) uses prediction markets to choose policies that optimize a single welfare metric ("GDP+"). The appealing core isn't the market mechanism specifically — it's the ambition of letting *calibrated estimation directly drive coordination*:

> How can we ambitiously use systematized estimation systems to optimize policy decisions?

Two buckets of work fall out, independent of whether the estimator is a market: (1) **building the target metric** — a GDP+ that is both high-quality and publicly acceptable, against active attempts to corrupt it; and (2) **making the forecasting cheap enough** that policy-grade forecasts (which must be very good, hence very expensive) become palatable.

## Certificates of impact

[Certificates of impact](https://forum.effectivealtruism.org/tag/certificate-of-impact) (Paul Christiano) require estimating the value of a long list of interventions. Setting aside the financial-instrument details, the core is an evaluation problem with two bottlenecks the field directly addresses:

- **Cost-effectiveness.** Producing all those value estimates is expensive; if the resources-to-estimates conversion is poor, the scheme can't work.
- **Candidness.** If certificate prices were public and roughly accurate, some organizations would get far worse ratings than they expected. Imagine a small market concluding — publicly — that most longtermist researchers are near-useless or slightly harmful. Even if true, that's too uncomfortable to be tolerated if done crudely; expect pushback and strategic non-participation. Good evaluation systems must offer **deliberate trade-offs between truth and discomfort**, not just accuracy. (See [Epistemic Culture](/concepts/epistemic-culture/).)

## Felicific calculators

Bentham's felicific calculus — quantifying the moral weight of acts — has only ever been realized in narrow corners (QALYs, welfare economics). Broad-purpose calculators that estimate the costs and benefits of actions for individuals and organizations remain out of reach. Most of the difficulty reduces to "cost-effective large-scale estimation," which is exactly the field's competence. Advanced versions should work for nearly any utility function, so almost any consequentialist framework could plug in.

## Guesstimate, and the tooling gap

Guesstimate (2016) gestured at making quantified, uncertain estimation accessible. Development hit diminishing returns: the remaining bottlenecks weren't incremental fixes but called for fundamentally different tooling — exactly what the [estimation-functions](/concepts/techniques/) line of work is about. The slogan version: *if you've ever thought "Guesstimate is neat, but I wish much more of the world worked like that," this field is the attempt to build that world.*

## Charity evaluation and prioritization

This is the use case closest to existing practice. GiveWell, Open Philanthropy, 80,000 Hours, and others pour serious effort into evaluating charities and causes — and it's been hard to scale. There are perennial calls for "GiveWell for X" (environment, political reform, s-risk, general philanthropy), and clear limits even within existing domains.

Evaluation engineering reframes the goal as **augmentation, not replacement**: not "automate GiveWell," but

> for every prioritization or evaluation researcher we have, can we eventually get x% more value out of them?

A system that let existing teams scale output 10–100× — even at lower per-item quality — could change which questions get asked at all. There are already small instances to learn from: QURI's [shallow evaluations of longtermist organizations](/reference/related-work/) (2021) and Sam Nolan's uncertainty-quantified rebuild of GiveWell's GiveDirectly cost-effectiveness analysis both show "shallow but useful" evaluation at reduced cost. (For the strongest version of the skeptical reply — that perfect evaluations might not increase useful work by more than ~2×, and that the real bottleneck is *capable people* — see [Objections & FAQ](/reference/objections/).)

## The common thread

Across all five, the bottleneck is the same: **cheap, large-scale, trusted estimation and evaluation**. None of these requires AGI-level accuracy. They require outputs that are *better than what people would otherwise have done* — and a system that produces them at a cost low enough that they actually get used. That is the bet of the whole field; see [Evaluation as a System](/concepts/the-systems-view/) for the optimization target, and [Objections & FAQ](/reference/objections/) for the case against.
