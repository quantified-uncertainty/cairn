---
title: Evaluation Engineering
description: What evaluation engineering is, why treat evaluation as a systems problem, and what the field is trying to build.
sidebar:
  order: 1
---

*Status: early draft. This page states a framing, not a settled position.*

## The one-sentence version

**Evaluation engineering is the discipline of building systems that produce large numbers of estimates and evaluations — efficiently, consistently, and at a known cost.**

The emphasis is on every word after *systems*. We already know how to produce one careful evaluation: hire a smart person, give them time, read the report. What we are bad at is producing the *ten-thousandth* evaluation as cheaply and reliably as the first — and keeping all ten thousand consistent with each other as the world changes underneath them. That is an engineering problem, and it has been studied as one only sporadically.

## What problem this is a response to

There is a recurring disappointment in the forecasting and decision-analysis world: prediction markets, forecasting tournaments, and proposals like futarchy all *seem* promising, and yet a decade-plus in, they are barely used — not by governments, not by firms, not even by the communities most enthusiastic about them.

One diagnosis is that prediction was never the whole product. A prediction platform is one organ; a decision-support system is the body. To get from "we can forecast this clean, near-term, verifiable question" to "we can put a defensible number on the messy thing a decision actually turns on," you need more than a market:

- a **structured set of questions** to forecast over (ontology),
- **calculation** to chain raw inputs into derived estimates,
- **prediction** to keep the system calibrated and honest, and
- **evaluation** to resolve the questions that have no clean ground truth.

Nobody was building the whole machine. Evaluation engineering is the name for building the whole machine.

## Why "engineering"

Calling it engineering is a deliberate move away from two adjacent framings:

- It is **not evaluation-the-philosophy**: the project is not primarily about the theory of value or the epistemology of judgment, though it draws on both.
- It is **not evaluation-the-social-science**: there is an established academic field of program evaluation, and there are lessons there, but its center of gravity is the individual study and the long report, not the high-throughput system.

The mental models that fit best come from systems disciplines: **lean manufacturing, software architecture, engineering management**. The questions are throughput, cost-per-item, latency, consistency, failure modes, and how local changes propagate through a network of dependent estimates. When you produce evaluations at scale, optimizing any single evaluation is usually the wrong objective; you optimize the system.

A representative list of system-level questions:

- Who staffs the analyst team, and what is the cost of their time per item?
- What data infrastructure does the system stand on?
- Who is the audience, and what decisions are the outputs meant to support?
- How does an update to one estimate propagate to the estimates that depend on it?
- How do we keep ten thousand estimates *consistent* with each other?
- How is the whole thing funded, and what keeps it from being captured?

## The core split: estimation vs. evaluation

The field's foundational distinction is between **estimation** (numbers you'd trust a careful quantitative analyst to produce — Fermi estimates, models, sums) and **evaluation** (messy judgments you'd want trusted experts for — "how good a president was Obama?", "how much did this org reduce existential risk?"). The design heuristic that falls out of this is *divide and conquer*: handle as much as possible as cheap, verifiable estimation, and sequester the genuinely judgment-bound evaluation into a separate, more expensive layer. This is important enough to get [its own page](/start-here/estimation-vs-evaluation/).

## Why evaluation, specifically? ("all you need")

The sharper, more provocative version of the thesis is that **highly optimized evaluations are (almost) all you need.** Two claims sit behind it:

- **Evaluation may be the bulk of the desired output.** Forecasting discourse has under-weighted evaluation; you can get a long way on clean estimation and then hit a wall. Many of the highest-stakes processes we run are evaluation problems in disguise — courts, grantmaking, hiring, impact assessment, policy choice. It's plausible that *more* of civilization's resources flow into evaluation than into estimation, which would make optimizing it unusually valuable.
- **The accuracy bar is lower than it looks.** A common objection is that scaled evaluation is AGI-complete. But the outputs don't need to be accurate in any absolute sense — only **better than what people would otherwise have done**, and cheap enough to actually get used. People already make vast numbers of noisy, overconfident informal judgments; beating that baseline is a far more modest target. (See [Objections & FAQ](/reference/objections/).)

"Highly optimized" is doing real work in that slogan: the value comes not from any single brilliant evaluation but from *engineering the whole system* to a good point on the [accuracy × quantity × cost](/concepts/the-systems-view/) frontier.

## A capability ladder

It would help the field to be able to *grade* evaluation systems the way self-driving has "Level 4 autonomy." A shared scale — plus a formalization of the inputs and outputs of estimation/evaluation work — would let us draw historical trends, make projections, and say concretely how far along a given system is. No such ladder exists yet; building one is open work.

## Why this is worth a field

- **Generality.** Better evaluation systems would help in many domains at once — impact assessment, policy, life and work optimization, research prioritization. A broad lever, but narrow enough to be tractable.
- **Neglect.** The component fields (forecasting, data engineering, decision analysis, survey methodology) are each studied, but rarely *integrated* under one roof aimed at high-throughput output.
- **Timing.** Most of the labor-intensive steps — drafting evaluations, structuring ontologies, running calculations — are now partially automatable by LLMs. A program that needed an army of analysts to be cost-effective might now need a much smaller one. See [Lineage](/start-here/lineage/) for how the pre-LLM version of this argument maps onto the present.

## What this wiki is (and isn't)

This is a working wiki, not a manifesto and not a finished textbook. Pages are dated drafts meant to be argued with. The goal of the current version is modest: lay out the framing, the core distinction, the component architecture, the catalogue of methods, and the open questions clearly enough that the next person can disagree productively.

It deliberately does **not** yet commit to: a specific software stack, a specific institutional form, or strong claims about cost-effectiveness. Those depend on experiments that haven't been run.

## Where to go next

- [Estimation vs. Evaluation](/start-here/estimation-vs-evaluation/) — the foundational distinction, in detail.
- [Why It Matters — Use Cases](/start-here/use-cases/) — the concrete things this would unlock.
- [Evaluation as a System](/concepts/the-systems-view/) — the systems view and its trade-offs.
- [The Four Components](/concepts/components/) — prediction, calculation, ontology, evaluation.
- [Objections & FAQ](/reference/objections/) — the strongest objections and the scale of the bet.
- [Cruxes](/start-here/key-questions/) — the open questions the field turns on.
