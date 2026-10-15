---
title: Evaluation as a System
description: Why an evaluation system is a different object from an evaluation, the properties that define its design space (accuracy, unit cost, robustness under optimization, legitimacy), and its technical and institutional design variables.
sidebar:
  order: 1
---

*Status: early draft.*

## A system is not a big pile of evaluations

The central shift in this field is treating the *system* — not the individual evaluation — as the unit of design.

An evaluation is an artifact: a number, a grade, a report. An **evaluation system** is the standing machinery that produces such artifacts repeatedly, of a roughly consistent type. A firm issuing health grades for restaurants, an analyst team scoring acquisition targets, a charity evaluator publishing cost-effectiveness estimates — each is a system, and each lives or dies on properties no single evaluation has: throughput, cost-per-item, consistency across items, latency, and how gracefully it absorbs change.

When you optimize a system, optimizing any one evaluation is usually the wrong objective. You accept that some individual outputs are rougher than a bespoke study would be, in exchange for producing thousands of them at a cost that lets the results actually get used. This is the same move lean manufacturing makes against artisanal production, and the right reference disciplines are the systems ones — **lean manufacturing, software architecture, engineering management** — not evaluation philosophy or single-study methodology.

## The design space

Four properties decide whether a system is worth running:

- **Accuracy**: how close outputs come to what a much more expensive, trusted process would conclude.
- **Unit cost**: a fixed cost $F$ (design, calibration, tooling, re-validation) plus a marginal cost $c$ per item. Quantity $N$ is the scale the system runs at, not a separate axis: total cost is $F + Nc$.
- **Robustness under optimization**: whether accuracy survives once the evaluated parties learn what the system rewards. A judge validated at zero optimization pressure is validated only for zero pressure ([LLMs as Evaluators](/concepts/llm-evaluators/#evidence-under-optimization-pressure)).
- **Legitimacy**: whether the audience trusts the outputs enough to act on them, which is evaluation's [defining requirement](/start-here/estimation-vs-evaluation/#evaluation). Latency matters too in some domains.

As accounting, a system run over $N$ items is worth roughly $N\bar{v} - (F + Nc)$, where $\bar{v}$ is the average decision value an output adds. Scale pays only when each output adds more than its marginal cost and $N$ is large enough to cover $F$. Accuracy enters through $\bar{v}$. Robustness and legitimacy enter as conditions: a gamed output, or one nobody believes, has $\bar{v}$ near zero. The sibling RRP wiki's [Core Model](https://reasoning-processes.quantifieduncertainty.org/concepts/core-model/) develops the same unit economics, and how to price information before it is produced.

An expert panel buys accuracy and legitimacy at a high marginal cost. A statistical index has a low marginal cost, is accurate only where the metric captures what matters, and is among the easiest designs to game. LLMs cut the marginal cost of the labor-intensive steps; whether accuracy, robustness and legitimacy survive the substitution is open (see [Cruxes](/start-here/key-questions/)).

## The questions that define a system

Designing or critiquing a system means answering, at minimum:

- **Team.** Who produces the judgments — analysts, experts, crowds, models? At what cost per item?
- **Data infrastructure.** What does the system stand on? Where do inputs come from and how fresh are they?
- **Audience and purpose.** Who consumes the outputs, and what decisions are they meant to support? (This determines how much accuracy is actually needed.)
- **Consistency.** How do you keep thousands of estimates coherent with each other?
- **Propagation.** When one input or estimate updates, how does the change flow to everything downstream?
- **Funding and incentives.** How is the system paid for, and what stops it from being captured or corrupted?

Consistency and propagation are the reason an evaluation system resembles a *database with opinions* more than a stack of reports; funding and incentives are the reason it resembles an *institution* more than a tool.

## Technical and institutional design variables

The questions above mix two kinds of variable. Team, data, consistency and propagation are technical: they are set by how the system is built. Who pays, who controls the metric's definition, and whether the evaluated can appeal are institutional: they are set by the contracts and governance around the system.

Part III's strongest pattern is that the institutional variables seem to predict trustworthiness better than method does ([Patterns §3](/concepts/patterns-and-failure-modes/#3-incentives-and-funding-decide-trustworthiness--more-than-method-does)). Issuer-paid credit ratings failed despite elaborate models; independently funded product testers using conventional lab methods kept their reputations. That evidence is a set of contrasts plus the certification-economics theory behind them, not a coded comparison across the catalogue, so treat it as a well-motivated hypothesis. If it holds, the engineering in this wiki's title has to include incentive design: a system is specified by its payer and its governance as much as by its pipeline.

## Consistency and propagation

At small scale, inconsistency is invisible. At ten thousand items it is the dominant failure mode: estimate A implies one thing, estimate B implies its opposite, and no human ever notices because no human reads both. A serious system needs some mechanism — shared inputs, derived-value chains, automated checks — that makes "these two outputs contradict each other" a detectable, ideally automatable, event.

Propagation is the dynamic version of the same problem. The world moves; a key input changes; in a pile of static reports, every downstream conclusion is now silently stale. A system worth the name knows what depends on what, and can re-derive (or at least flag) the affected outputs. This is one of the strongest arguments for [estimation functions](/concepts/techniques/) and structured ontologies over free-text reports: structure is what makes propagation possible.

## Grading systems: a capability ladder

If the system is the unit of design, systems should be gradable. Autonomous driving has "Level 4"; evaluation engineering has no equivalent. A shared capability ladder would let practitioners say how advanced a system is, compare two systems, and track trends.

This wiki has not written one; a draft is planned, with each level defined by a measurable property (for example, whether the system publishes an error rate measured on a random audit). The sibling RRP wiki's [Reliability Ladder](https://reasoning-processes.quantifieduncertainty.org/concepts/epistemic-applications/), which grades applications of strong reasoners by the trust they require, is a candidate template. The founding notes called systems high on such a ladder "advanced": cost-effective, general, and valuable to the agents that consume their outputs, whether or not their internals are [symbolic](/concepts/components/).

## How the rest of the wiki hangs off this

The systems view is what makes the other pages cohere:

- [The Four Components](/concepts/components/) are the reusable parts you assemble a system from.
- [Evaluation Methods](/concepts/evaluation-methods/) are the menu of ways to fill the *evaluation* slot, each with its own cost, accuracy and trust profile.
- [Techniques](/concepts/techniques/) are system-level patterns — most of them ways to get expensive judgment to subsidize cheap judgment, or to keep a large system honest and consistent.
- [LLMs as Evaluators](/concepts/llm-evaluators/) covers what changes when the cheap labor is a model, and [the worked example](/concepts/worked-example/) prices one system end to end.
- [Evaluation Systems in the Wild](/concepts/evaluation-systems-in-the-wild/) and [Patterns & Failure Modes](/concepts/patterns-and-failure-modes/) are the evidence: ~100 standing systems, and what is repeatedly true across them.
- [Epistemic Culture](/concepts/epistemic-culture/) is the environment a system has to survive in once its outputs start affecting real people.
