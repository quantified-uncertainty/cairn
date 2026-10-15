---
title: The Four Components
description: Prediction, calculation, ontology and evaluation, the reusable parts of an evaluation system, and how they depend on each other.
---

*Status: draft, adapted from the 2021–22 estimation-theory notes.*

An evaluation system decomposes into four reusable parts. Each has its own literature, tooling and failure modes, which is the reason to separate them. [Techniques](/concepts/techniques/) covers how they are wired together; [epistemic culture](/concepts/epistemic-culture/) is a precondition for running any of them, not a part.

## Prediction

Probabilistic forecasts that can be scored against outcomes and aggregated, in the sense of Tetlock & Gardner's *Superforecasting* (2015). Scoring gives the system a feedback signal; aggregation lets it combine many cheap judgments. Human prediction without calculation is limited to what people can intuit, which suffices for hundreds of hand-written questions and not for thousands. LLM forecasters lift the volume limit at a shrinking cost in accuracy ([LLMs as Evaluators](/concepts/llm-evaluators/#what-llms-cheapen-component-by-component)).

## Calculation

The multi-step machinery that turns inputs into derived numbers: Fermi chains, models, spreadsheets, algorithms. This is the engine of the [estimation](/start-here/estimation-vs-evaluation/) layer. Calculation without prediction produces elaborate numbers with no evidence of calibration. Prediction supplies trust, calculation supplies reach; the boundary between them is fuzzy, but separating them helps both research and software design.

## Ontology

The structured list of things the system estimates, and the data plumbing beneath it: taxonomies, definitions, knowledge graphs. Large structured item sets are what let a system predict or calculate over thousands of questions. The founding notes flagged this as the neglected bottleneck, since forecasting platforms mostly rely on small sets of hand-written questions. That has started to change: ForecastBench generates and refreshes its 1,000 forecasting questions automatically ([Karger et al. 2024](https://arxiv.org/abs/2409.19839)). Whether automated question generation extends from resolvable forecasts to evaluation targets is open.

## Evaluation

Judgment on questions that are normative, long-horizon or otherwise lack clean ground truth: the residue the estimation layer cannot reduce. Evaluation counts only if its audience believes it, so it depends on legitimacy more than the other components do. It is usually the *target* of prediction: the expensive, trusted judgment that cheaper predictors are scored against. The concrete methods are compared on [Evaluation Methods](/concepts/evaluation-methods/).

## Dependencies

Ontology defines the questions. Calculation and prediction populate the estimation layer over them. Evaluation handles what cannot be estimated and supplies the ground truth that prediction is scored against. The integration is not a thin layer: keeping thousands of outputs consistent across components, and propagating updates between them, is where large systems fail ([Evaluation as a System](/concepts/the-systems-view/#consistency-and-propagation)).
