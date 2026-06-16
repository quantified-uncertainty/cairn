---
title: Lineage
description: Where evaluation engineering comes from — the 2021–22 "advanced / symbolic evaluation systems" program and what changed with LLMs.
sidebar:
  order: 5
---

*Status: early draft.*

Evaluation engineering is not a new idea so much as a renamed and re-timed one. This page traces the lineage so the framing's assumptions are visible.

## The 2021–22 program

The direct ancestor is a draft post series written in 2021–22 under the banner **advanced evaluation systems** — and, for the particular paradigm it focused on, **symbolic evaluation systems**. Its core moves:

- **From prediction to evaluation systems.** Prediction markets and tournaments had underwhelmed in practice. The diagnosis: prediction is one component of a larger architecture, and the larger architecture — not better markets — is the right research target.
- **A component decomposition.** Serious systems combine **prediction**, **calculation**, **ontology**, and **evaluation**, sitting on a background of **epistemic foundations** and **epistemic culture**. (See [The Four Components](/concepts/components/).)
- **The estimation/evaluation split** as the foundational distinction, with a divide-and-conquer design strategy. (See [Estimation vs. Evaluation](/start-here/estimation-vs-evaluation/).)
- **A set of techniques** — prediction–evaluation systems, scalable structured forecasting, estimation functions, automated trust networks, and cultural change toward candidness. (See [Techniques](/concepts/techniques/).)

The word *symbolic* was borrowed from symbolic AI: systems built out of explicit, inspectable structure (functions, ontologies, rules), with the matching trade-off — easy to understand and study, sometimes inefficient to run.

## What was missing then

The 2021–22 version had a hole it was honest about: the symbolic machinery needed a cheap, general *executor* for the labor-intensive parts — drafting evaluations, structuring ontologies, chasing down inputs. Without one, the whole architecture was either prohibitively expensive (armies of analysts) or limited to the few questions a small team could hand-craft. The notes explicitly hoped that "AI advancements will greatly augment" the program, while assuming the work had to stand without them.

## The bridge draft: "Evaluations Are All You Need"

Between the 2021–22 series and this wiki sits a later, still-in-progress redraft of the founding post, titled **"(Highly Optimized) Evaluations Are All You Need"** (drafted in September, LLM-aware). It keeps the architecture but shifts the emphasis in three ways that this wiki inherits directly:

- **Evaluation moves to the center.** Where the original treated *estimation* as the more fundamental operation, the redraft argues that *evaluation* is plausibly the bulk of the valuable output — and that "highly optimized" evaluation is the thing to chase. This wiki's name and framing follow that move.
- **It adds use cases and a scale estimate.** Charity evaluation/prioritization joins futarchy, certificates of impact, felicific calculators, and Guesstimate; the effort is sized at roughly autonomous-driving / ending-aging scale (~\$100B over 20 years), with companies expected to do most of it. See [Why It Matters](/start-here/use-cases/).
- **It records objections and outside feedback.** An "objections and responses" section and external commentary (e.g. from Mark Xu) are folded into [Objections & FAQ](/reference/objections/).

The redraft is explicitly provisional — the author flags being "really not sure about much of this." This wiki treats it the same way: as the current best statement of a moving target, not a settled position.

## What changed

Large language models are a plausible candidate for that missing executor. They are uneven and untrustworthy in exactly the places evaluation is hardest, but they are cheap and general in exactly the places the architecture was bottlenecked. That shifts the program from "interesting if we ever get the labor" to "buildable now, with the labor question reframed as a quality-and-trust question."

This is why the present wiki re-centers the word **engineering**: the open problems are now less "could such a system exist in principle" and more "how do we actually build, staff, calibrate, and trust one."

## The naming trail

The label has moved more than once, and is still provisional:

> advanced evaluation systems → symbolic evaluation systems → (general-purpose, large-scale) estimation systems → "highly optimized evaluations" → **evaluation engineering**

Each rename tracked where the emphasis was: the *advance* over existing systems, then the *symbolic* paradigm, then *estimation* as the more fundamental operation, then back to *evaluation* as the dominant output to optimize, and now the *engineering* of high-throughput systems. None of these is meant as a final name. (See crux 12 on [Cruxes](/start-here/key-questions/).)

## Sibling project

This wiki is a sibling to **Robust Reasoning Processes (RRP)**, which inherited a different slice of the same 2021–22 corpus — the "processes over forecasts" move and the measurement of how processes resist corruption. Where RRP centers *trustworthiness under adversarial pressure*, evaluation engineering centers *high-throughput production at known cost*. They share ancestry and overlap at the edges (both care about calibration, oversight, and trust networks), but ask different primary questions.
