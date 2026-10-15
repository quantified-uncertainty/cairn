---
title: Open Problems
description: The unresolved problems in evaluation engineering, grouped by chapter, as of October 2026.
---

*Status: updated October 2026. The higher-level questions are on [Cruxes](/start-here/key-questions/); this page lists narrower problems by chapter and does not repeat them.*

## The systems view

- **Separate payment from stakes.** The [catalogue coding](/concepts/evaluation-systems-in-the-wild/#does-who-pays-predict-failure) links rated-party payment to documented failure but cannot say why ([crux 11](/start-here/key-questions/#on-the-environment)). A second, blind coder and a stakes measure for each system would separate capture from gaming.
- **Test the capability ladder.** The [v0 ladder](/concepts/capability-ladder/#open-questions) grades eight hand-picked systems. Grading the whole catalogue would show whether the rungs discriminate and whether rung predicts documented failure.
- **Measuring legitimacy.** Accuracy and cost have standard measures; legitimacy does not. Candidate proxies include exit rates of the evaluated, appeal and reversal rates, and whether audiences act on the outputs.
- **Automatic consistency and propagation.** Detecting contradictions across thousands of outputs, and re-deriving downstream estimates when an input changes, cheaply enough to be the default.

## Components

- **Ontology:** what tooling makes large structured question sets cheap to build and maintain?
- **Prediction:** how far can aggregation and calibration be pushed when most predictors are models that share training data and errors?
- **Estimation functions:** what do uncertainty, caching, composition and dependency tracking need to look like for these to compose?

## Methods and measurement

- **Pricing:** a defensible value per evaluation for messy, normative, long-horizon questions, so it can be traded against accuracy.
- **Composite measures:** non-arbitrary choice and weighting of sub-measures that hold up under adversarial pressure.
- **Audit size under weak agreement.** Where experts agree with each other only weakly (κ ≈ 0.2), the [worked example](/concepts/worked-example/#what-50-audits-buy) needs hundreds of audited items, not 50. SCORE validated its forecasts on 37 replications. How small can an audit be before the agreement figure means nothing?
- **Fixed costs.** Rubric design, calibration sets and re-validation after every model update are recurring. How they amortize over $N$ decides whether scale pays ([Evaluation as a System](/concepts/the-systems-view/#the-design-space)).

## LLMs as evaluators

- For which judgment-bound question classes has chance-corrected LLM–panel agreement been measured against panel–panel agreement, beyond essays, paper review and clinical rubrics ([LLMs as Evaluators](/concepts/llm-evaluators/#open-questions))?
- How fast does a judge's accuracy decay once the evaluated optimize against it, and how much do random audits with penalties slow the decay?
- Can a cheaper model learn to imitate a human middle layer well enough to be useful? SCORE's AI systems matched the humans' distribution of judgments but not their discrimination ([Lineage](/start-here/lineage/#outside-precedents-for-the-core-pattern)).
- How much independence does a mixed human–model panel buy over a model-only panel, per dollar?

## Bridging cheap and expensive judgment

- Do prediction–evaluation incentives survive deceptive participants? Random resolution keeps a proper score proper but divides each item's expected reward by the audit ratio; at 50 audits in 10,000 items, each forecast carries 1/200 of the stake.
- What is the best allocation of a fixed audit budget across a large question set: uniform random, stratified by stakes, or concentrated near decision thresholds and reweighted?

## The environment

- What rollout sequence lets a public evaluation system of people or organizations survive lawsuits, boycotts and capture? The [cases](/concepts/epistemic-culture/) show failure modes, not a tested sequence.
- What do the EU AI Act's high-risk rules (for AI that evaluates learning outcomes, job candidates or creditworthiness, applying from December 2027) and GDPR Article 22 require of an LLM-scored evaluation system in practice ([Epistemic Culture](/concepts/epistemic-culture/#rollout))?
- Do automated trust networks prevent capture, or relocate it?

## Demonstrating the value

- **A measured case study.** The [worked example](/concepts/worked-example/) is fictional. A real one would report cost per evaluation, coverage, and a human-audited error rate for a deployed system such as RoastMyPost or Squiggle AI ([Related Work](/reference/related-work/)).
- **Is the bottleneck people, not tooling?** Much evaluation, grantmaking included, is limited by the number of people able to do it. Does tooling relieve that or relocate it?
- **How much does it add?** One outside estimate holds that even perfect evaluations might not more than double useful work, because the obviously good things are already funded ([Objections](/reference/objections/#external-commentary)).
- **Where to start.** Which domain should the first end-to-end system target to learn the most per dollar?
