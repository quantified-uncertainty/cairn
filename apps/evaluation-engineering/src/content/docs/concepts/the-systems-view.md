---
title: Evaluation as a System
description: Why an evaluation system is a different object from an evaluation, the four properties that define its design space (accuracy, unit cost, robustness to gaming, legitimacy), and its technical and institutional design variables.
---

*Status: draft, revised October 2026.*

## A system is not a big pile of evaluations

An evaluation is an artifact: a number, a grade, a report. An **evaluation system** is the standing machinery that produces such artifacts repeatedly, of a roughly consistent type: a health department grading restaurants, an analyst team scoring acquisition targets, a charity evaluator publishing cost-effectiveness estimates. Each lives or dies on properties no single evaluation has: cost per item, consistency across items, how it absorbs change, and whether the people it rates can bend it.

Optimizing a system means accepting that some outputs are rougher than a bespoke study, in exchange for producing enough of them, cheaply enough, that they get used.

Program evaluation has studied such standing "evaluation systems" (performance monitoring, accreditation, institutionalized impact evaluation) and names a cost of them: they tend to produce routinized information that serves day-to-day adjustment but rarely prompts a fundamental reassessment of a programme ([Leeuw & Furubo 2008](https://doi.org/10.1177/1356389007087537)). A high-throughput design inherits that risk.

## The design space

Four properties decide whether a system is worth running:

- **Accuracy**: how close outputs come to what a much more expensive, trusted process would conclude, measured on a random audit ([Measuring an Evaluator](/concepts/measuring-an-evaluator/)). This is agreement with a reference, not validity: a system that matches a biased panel inherits the bias, and the audit cannot see it.
- **Unit cost**: a fixed cost $F$ (design, calibration, tooling, re-validation) plus a marginal cost $c$ per item. Quantity $N$ is the scale the system runs at, not a separate axis: total cost is $F + Nc$.
- **Robustness to gaming**: whether accuracy survives once the evaluated learn what the system rewards. A judge validated at zero optimization pressure is validated only for zero pressure ([LLMs as Evaluators](/concepts/llm-evaluators/#evidence-under-optimization-pressure)).
- **Legitimacy**: whether the audience trusts the outputs enough to act on them and the evaluated accept them enough not to exit, sue or capture the system. Trust is evaluation's [defining requirement](/start-here/estimation-vs-evaluation/#evaluation).

Earlier drafts used a three-way "accuracy × quantity × cost" trade-off. It double-counted (total cost is quantity times unit cost) and left out robustness and legitimacy.

As accounting, a system run over $N$ items is worth roughly $N\bar{v} - (F + Nc)$, where $\bar{v}$ is the average decision value an output adds. Because the most decision-relevant items tend to be evaluated first, $\bar{v}$ usually falls as $N$ grows; scale pays up to the item whose value drops to $c$, and only if the total covers $F$. Accuracy enters through $\bar{v}$, and so does latency: a verdict that arrives after the decision is worth little. Robustness and legitimacy act as multipliers on $\bar{v}$: a gamed output, or one nobody believes, has $\bar{v}$ near zero, and a system that loses legitimacy may lose $N$ as well when the evaluated refuse to take part ([Epistemic Culture](/concepts/epistemic-culture/)). The sibling RRP wiki's [Core Model](https://reasoning-processes.quantifieduncertainty.org/concepts/core-model/) develops the same unit economics and how to price information before it is produced.

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

Certification economics predicts that the institutional variables matter: a certifier paid by the rated party prefers coarse, lenient signals, and issuer-pays invites ratings shopping ([Patterns §3](/concepts/patterns-and-failure-modes/#3-incentives-and-funding-shape-trustworthiness)). A coding of the catalogue's 161 systems gives partial support ([Does who pays predict failure?](/concepts/evaluation-systems-in-the-wild/#does-who-pays-predict-failure)). Neither the payer typology nor method predicted documented failure. One contrast held: where the rated party pays the evaluator anything, 27 of 67 systems had an established failure, against 10 of 62 where it pays nothing (odds ratio about 3.5, 90% CI 1.6–7.8). Most of those failures were gaming by the rated party, not lenient rating, so payment may mark high-stakes ratings rather than buy the evaluator. The evidence is weak: one unblinded coder, and only failures someone documented.

The institutional choices are:

- **Payer.** Rated party pays (credit ratings, fee-for-certification), audience pays (subscriptions), a third party pays (foundation, government, a funder evaluating its own grantees), or advertisers and affiliates pay. Each has a known conflict; the [catalogue](/concepts/evaluation-systems-in-the-wild/) groups systems this way. A funder evaluating its own portfolio has the mildest external conflict and the strongest internal one: the evaluators report to the people whose decisions they judge.
- **Metric ownership.** Whoever defines the metric can move it. Keeping the definition with a party that does not benefit from its level is the analogue of auditor independence.
- **Data independence.** A system that gathers its own inputs cannot be starved of them; one that relies on self-reported data can be boycotted or fed false numbers.
- **Disclosure.** Publishing the method makes the system auditable and also easier to game. A common compromise is to publish the rubric and keep the audit sample and the model's exact prompts private ([LLMs as Evaluators](/concepts/llm-evaluators/#the-design-pattern-llms-as-the-cheap-layer)).
- **Appeal and aggregation rules.** Recourse for the evaluated buys legitimacy at some cost to throughput. Aggregation rules can be designed for legitimacy directly: X's Community Notes shows a note only when raters who usually disagree both rate it helpful, and in a field test such notes reduced resharing ([Wojcik et al. 2022](https://arxiv.org/abs/2210.15723)). The price is latency: once attached, notes cut a post's reposts by 46%, but by only 12% over its lifetime, because most sharing happens before a note qualifies ([Slaughter et al. 2025](https://doi.org/10.1073/pnas.2503413122)).

These are engineering choices in the sense that matters: they can be specified in advance, varied, and measured. A system is specified by its payer and governance as much as by its pipeline.

## Consistency and propagation

At small scale, inconsistency is invisible. At ten thousand items it becomes a dominant failure: estimate A implies one thing, estimate B its opposite, and nobody reads both. A serious system needs shared inputs, derived-value chains or automated checks that make "these two outputs contradict each other" a detectable event; the sibling wiki's [consistency evals](https://reasoning-processes.quantifieduncertainty.org/proposals/consistency-evals/) catalogue such checks.

Propagation is the dynamic version. A key input changes, and in a pile of static reports every downstream conclusion is silently stale. A system that knows what depends on what can re-derive or flag the affected outputs. This is the main argument for [estimation functions](/concepts/techniques/) and structured ontologies over free-text reports.

## Grading systems: a capability ladder

If the system is the unit of design, systems should be gradable, as autonomous driving has "Level 4". The [Capability Ladder](/concepts/capability-ladder/) proposes five rungs, each defined by a test: standardized, measured, monitored, gaming-tested, accountable. The last is the institutional variables above. The [Launch Checklist](/concepts/launch-checklist/) turns the rungs into steps. The founding notes called systems high on such a ladder "advanced": cost-effective, general, and valuable to the agents that consume their outputs.
