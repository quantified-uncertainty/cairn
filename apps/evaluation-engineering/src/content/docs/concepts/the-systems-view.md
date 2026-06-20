---
title: Evaluation as a System
description: Why an evaluation system is a different object from an evaluation, and the accuracy × quantity × cost trade-offs that define its design space.
sidebar:
  order: 1
---

*Status: early draft.*

## A system is not a big pile of evaluations

The central shift in this field is treating the *system* — not the individual evaluation — as the unit of design.

An evaluation is an artifact: a number, a grade, a report. An **evaluation system** is the standing machinery that produces such artifacts repeatedly, of a roughly consistent type. A firm issuing health grades for restaurants, an analyst team scoring acquisition targets, a charity evaluator publishing cost-effectiveness estimates — each is a system, and each lives or dies on properties no single evaluation has: throughput, cost-per-item, consistency across items, latency, and how gracefully it absorbs change.

When you optimize a system, optimizing any one evaluation is usually the wrong objective. You accept that some individual outputs are rougher than a bespoke study would be, in exchange for producing thousands of them at a cost that lets the results actually get used. This is the same move lean manufacturing makes against artisanal production, and the right reference disciplines are the systems ones — **lean manufacturing, software architecture, engineering management** — not evaluation philosophy or single-study methodology.

## The design space: accuracy × quantity × cost

Every evaluation system is a point in a three-way trade-off:

- **Accuracy** — how close outputs are to what a much more expensive process would conclude.
- **Quantity** — how many items the system can cover.
- **Cost** — total resources per item (analyst time, compute, data).

You can usually buy more of any two by giving up the third. A hand-curated expert panel is high-accuracy, low-quantity, high-cost. A purely statistical index is low-cost, high-quantity, and accurate only where the metric happens to capture what matters. Most of the interesting engineering is in moving the whole frontier outward — getting more accuracy *and* quantity per dollar — rather than just sliding along it.

LLMs are interesting precisely because they promise to bend this frontier: they collapse the cost of the labor-intensive steps, which can buy back quantity without (one hopes) surrendering too much accuracy. Whether that hope holds is an open question — see [Cruxes](/start-here/key-questions/).

## The questions that define a system

Designing or critiquing a system means answering, at minimum:

- **Team.** Who produces the judgments — analysts, experts, crowds, models? At what cost per item?
- **Data infrastructure.** What does the system stand on? Where do inputs come from and how fresh are they?
- **Audience and purpose.** Who consumes the outputs, and what decisions are they meant to support? (This determines how much accuracy is actually needed.)
- **Consistency.** How do you keep thousands of estimates coherent with each other?
- **Propagation.** When one input or estimate updates, how does the change flow to everything downstream?
- **Funding and incentives.** How is the system paid for, and what stops it from being captured or corrupted?

The last two are where systems most often fail in ways a single-evaluation mindset never sees coming. Consistency and propagation are the reason an evaluation system resembles a *database with opinions* more than a stack of reports; funding and incentives are the reason it resembles an *institution* more than a tool.

## Consistency and propagation

At small scale, inconsistency is invisible. At ten thousand items it is the dominant failure mode: estimate A implies one thing, estimate B implies its opposite, and no human ever notices because no human reads both. A serious system needs some mechanism — shared inputs, derived-value chains, automated checks — that makes "these two outputs contradict each other" a detectable, ideally automatable, event.

Propagation is the dynamic version of the same problem. The world moves; a key input changes; in a pile of static reports, every downstream conclusion is now silently stale. A system worth the name knows what depends on what, and can re-derive (or at least flag) the affected outputs. This is one of the strongest arguments for [estimation functions](/concepts/techniques/) and structured ontologies over free-text reports: structure is what makes propagation possible.

## Grading systems: a capability ladder

If the system is the unit of design, we should be able to *grade* systems. Autonomous driving has "Level 4"; evaluation engineering has no equivalent yet, and would benefit from one. A shared capability ladder — backed by a formalization of the inputs and outputs of estimation/evaluation work — would let practitioners say how advanced a given system is, compare two systems, draw historical trends, and project forward.

"**Advanced**" evaluation systems, in this sense, just means high on that ladder: great cost-effectiveness, wide generality, and a real ability to create value for the agents that consume their outputs. Note the deliberate separation of *capability* from *implementation* — a system can be advanced whether its internals are [symbolic or not](/concepts/components/). Building the ladder itself is open work; see [Open Problems](/open-questions/).

## How the rest of the wiki hangs off this

The systems view is what makes the other pages cohere:

- [The Four Components](/concepts/components/) are the reusable parts you assemble a system from.
- [Evaluation Methods](/concepts/evaluation-methods/) are the menu of ways to fill the *evaluation* slot, each with its own accuracy/quantity/cost profile.
- [Techniques](/concepts/techniques/) are system-level patterns — most of them ways to get expensive judgment to subsidize cheap judgment, or to keep a large system honest and consistent.
- [Epistemic Culture](/concepts/epistemic-culture/) is the environment a system has to survive in once its outputs start affecting real people.
