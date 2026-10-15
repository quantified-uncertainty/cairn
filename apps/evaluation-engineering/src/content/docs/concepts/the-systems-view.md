---
title: Evaluation as a System
description: Why an evaluation system is a different object from an evaluation, the four properties that define its design space (accuracy, unit cost, robustness to gaming, legitimacy), and its technical and institutional design variables.
---

*Status: draft, revised October 2026.*

## A system is not a big pile of evaluations

An evaluation is an artifact: a number, a grade, a report. An **evaluation system** is the standing machinery that produces such artifacts repeatedly, of a roughly consistent type: a health department grading restaurants, an analyst team scoring acquisition targets, a charity evaluator publishing cost-effectiveness estimates. Each lives or dies on properties no single evaluation has: cost per item, consistency across items, how it absorbs change, and whether the people it rates can bend it.

Optimizing a system means accepting that some outputs are rougher than a bespoke study, in exchange for producing enough of them, cheaply enough, that they get used.

## The design space

Four properties decide whether a system is worth running:

- **Accuracy**: how close outputs come to what a much more expensive, trusted process would conclude, measured on a random audit ([Measuring an Evaluator](/concepts/measuring-an-evaluator/)).
- **Unit cost**: a fixed cost $F$ (design, calibration, tooling, re-validation) plus a marginal cost $c$ per item. Quantity $N$ is the scale the system runs at, not a separate axis: total cost is $F + Nc$.
- **Robustness to gaming**: whether accuracy survives once the evaluated learn what the system rewards. A judge validated at zero optimization pressure is validated only for zero pressure ([LLMs as Evaluators](/concepts/llm-evaluators/#evidence-under-optimization-pressure)).
- **Legitimacy**: whether the audience trusts the outputs enough to act on them and the evaluated accept them enough not to exit, sue or capture the system. Trust is evaluation's [defining requirement](/start-here/estimation-vs-evaluation/#evaluation).

Earlier drafts used a three-way "accuracy × quantity × cost" trade-off. It double-counted (total cost is quantity times unit cost) and left out the two properties that the book's own evidence says decide outcomes.

As accounting, a system run over $N$ items is worth roughly $N\bar{v} - (F + Nc)$, where $\bar{v}$ is the average decision value an output adds. Scale pays only when each output adds more than its marginal cost and $N$ is large enough to cover $F$. Accuracy enters through $\bar{v}$. Robustness and legitimacy act as multipliers on it: a gamed output, or one nobody believes, has $\bar{v}$ near zero, and a system that loses legitimacy may lose $N$ as well when the evaluated refuse to take part ([Epistemic Culture](/concepts/epistemic-culture/)). The sibling RRP wiki's [Core Model](https://reasoning-processes.quantifieduncertainty.org/concepts/core-model/) develops the same unit economics and how to price information before it is produced.

The properties trade against each other in recognizable ways. An expert panel buys accuracy and legitimacy at a high marginal cost. A statistical index has a low marginal cost, is accurate only where the metric captures what matters, and is among the easiest designs to game. LLMs cut the marginal cost of the labor-intensive steps; whether robustness and legitimacy survive the substitution is open ([Cruxes](/start-here/key-questions/)).

## The questions that define a system

Designing or critiquing a system means answering, at minimum:

- **Team.** Who produces the judgments (analysts, experts, crowds, models), and at what cost per item?
- **Data.** Where do inputs come from, how fresh are they, and does the system depend on the evaluated to supply them?
- **Audience and purpose.** Who consumes the outputs, and what decisions do they support? This sets how much accuracy is needed.
- **Consistency and propagation.** How do thousands of outputs stay coherent, and how does a changed input reach everything downstream?
- **Audit.** What expensive, trusted process checks a random sample, and how often?
- **Payer and governance.** Who funds the system, who controls the metric's definition, and what recourse do the evaluated have?

Consistency and propagation make an evaluation system resemble a database with opinions; payer and governance make it resemble an institution.

## Technical and institutional design variables

The questions above mix two kinds of variable. Team, data pipeline, consistency, propagation and audit are **technical**: they are set by how the system is built. Payer, metric ownership, disclosure and appeal are **institutional**: they are set by the contracts and governance around it.

Part III's strongest pattern is that the institutional variables seem to predict trustworthiness better than method does ([Patterns §3](/concepts/patterns-and-failure-modes/#3-incentives-and-funding-decide-trustworthiness--more-than-method-does)). Issuer-paid credit ratings failed despite elaborate models; product testers funded by subscribers, using conventional lab methods, kept their reputations. The theory behind this is solid: a certifier paid by the rated party prefers coarse, lenient signals, and issuer-pays invites ratings shopping. The empirical support in this wiki is a set of contrasts, not a coded comparison across the catalogue, so treat it as a well-motivated hypothesis ([open problem](/open-questions/#the-systems-view)).

If it holds, the design choices that matter most include:

- **Payer.** Rated party pays (credit ratings, fee-for-certification), audience pays (subscriptions), a third party pays (foundation, government, a funder evaluating its own grantees), or advertisers and affiliates pay. Each has a known conflict; the [catalogue](/concepts/evaluation-systems-in-the-wild/) groups systems this way. A funder evaluating its own portfolio has the mildest external conflict and the strongest internal one: the evaluators report to the people whose decisions they judge.
- **Metric ownership.** Whoever defines the metric can move it. Keeping the definition with a party that does not benefit from its level is the analogue of auditor independence.
- **Data independence.** A system that gathers its own inputs cannot be starved of them; one that relies on self-reported data can be boycotted or fed false numbers.
- **Disclosure.** Publishing the method makes the system auditable and also easier to game. A common compromise is to publish the rubric and keep the audit sample and the model's exact prompts private ([LLMs as Evaluators](/concepts/llm-evaluators/#the-design-pattern-llms-as-the-cheap-layer)).
- **Appeal and aggregation rules.** Recourse for the evaluated buys legitimacy at some cost to throughput. Aggregation rules can be designed for legitimacy directly: X's Community Notes shows a note only when raters who usually disagree both rate it helpful, and in a field test such notes reduced resharing ([Wojcik et al. 2022](https://arxiv.org/abs/2210.15723)).

These are engineering choices in the sense that matters: they can be specified in advance, varied, and measured. A system is specified by its payer and governance as much as by its pipeline.

## Consistency and propagation

At small scale, inconsistency is invisible. At ten thousand items it becomes a dominant failure: estimate A implies one thing, estimate B its opposite, and nobody reads both. A serious system needs shared inputs, derived-value chains or automated checks that make "these two outputs contradict each other" a detectable event; the sibling wiki's [consistency evals](https://reasoning-processes.quantifieduncertainty.org/proposals/consistency-evals/) catalogue such checks.

Propagation is the dynamic version. A key input changes, and in a pile of static reports every downstream conclusion is silently stale. A system that knows what depends on what can re-derive or flag the affected outputs. This is the main argument for [estimation functions](/concepts/techniques/) and structured ontologies over free-text reports.

## Grading systems: a capability ladder

If the system is the unit of design, systems should be gradable, as autonomous driving has "Level 4". The [Capability Ladder](/concepts/capability-ladder/) proposes five rungs, each defined by a test: standardized, measured, monitored, gaming-tested, accountable. The last is the institutional variables above. The [Launch Checklist](/concepts/launch-checklist/) turns the rungs into steps. The founding notes called systems high on such a ladder "advanced": cost-effective, general, and valuable to the agents that consume their outputs.

## How the rest of the wiki hangs off this

[The Four Components](/concepts/components/) are the parts a system is assembled from. [Evaluation Methods](/concepts/evaluation-methods/) are the ways to fill the evaluation slot. [Techniques](/concepts/techniques/) are system-level patterns, most of them ways to let expensive judgment calibrate cheap judgment. [LLMs as Evaluators](/concepts/llm-evaluators/) and [the worked example](/concepts/worked-example/) cover the cheap layer when it is a model. [Evaluation Systems in the Wild](/concepts/evaluation-systems-in-the-wild/) and [Patterns & Failure Modes](/concepts/patterns-and-failure-modes/) are the evidence, and [Epistemic Culture](/concepts/epistemic-culture/) is what happens once outputs affect real people.
