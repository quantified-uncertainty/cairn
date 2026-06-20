---
title: Evaluation Methods
description: The catalogue of concrete ways to produce evaluations — expert panels, surveys, review systems, statistical measures, and composite indices — with their cost and trust profiles.
sidebar:
  order: 1
---

*Status: early draft, adapted from the 2021–22 estimation-theory notes. This is the sketchiest part of the original program and remains the most open.*

The [evaluation component](/concepts/components/) needs concrete methods. This page is the menu. Each method is a different point in the [accuracy × quantity × cost](/concepts/the-systems-view/) trade-off, and each carries a different *trust* profile — which matters, because an evaluation only moves decisions if its audience believes it.

Existing real-world evaluations come in recognizable families: audits, appraisals, rulings, academic/business/public reviews and ratings, performance assessments, actuarial assessments, and composite indices. The methods below are the building blocks behind those.

## Expert panels

The most general-purpose method: assemble a small team of recognized experts and have them produce the judgment. Metaculus has resolved questions against small expert teams; resolution councils have been set up for similar purposes.

Key parameters to tune:

- **Who counts as an expert**, and which experts *complement* each other.
- **Team size.**
- **Research duration** — two hours or two weeks?
- **Assistance** — a support team of cheaper helpers behind the experts.
- **Scoring / incentives** for correctness.

Expert evaluations behave a lot like predictions, so good scoring rules still matter — you can have panels make fast intuitive calls and later test them probabilistically against better-resourced panels. The catch is cost: experts are expensive, so there's a sharp tension between labor intensity and quality. Profile: **high accuracy, low quantity, high cost, high trust.**

## Surveys

Survey results can themselves be forecast, which can cut their cost. Surveys have a narrower but distinct value proposition from expert panels: they can capture the opinions of a *specific population* — including the actual readers of a forecast.

> "On a scale of 1–10, how valuable is this project, according to a random survey of [community] members?"

A sharper version samples only people who have actually viewed the forecast. Surveys also work as cheap data collection feeding other evaluations (e.g. asking which readers found an organization's work valuable). Profile: **moderate cost, captures real audience preferences, trust depends on sampling.**

## Review systems

Review systems are one implementation of surveys — usually public and untargeted. Setup cost is high; marginal cost is often very low. Being public and open, they demand heavy moderation against spam and malicious entries.

They're unlikely to anchor a prediction–evaluation system directly, but they're natural *targets* for more general forecasting:

- Public ratings of movies before release.
- Public ratings of future government projects.
- Amazon ratings for products under consideration.
- Goodreads quantity and average for upcoming books, conditional on title.

Profile: **high setup cost, very low marginal cost, scalable, trust limited by gaming.**

## Statistical measures

Objective, low-marginal-cost metrics. Their strengths are exactly that: cheap and trustable. Their weakness is domain — a statistical measure is only as good as the match between what's easy to measure and what actually matters, and the classic failure mode is organizations measuring what's convenient rather than what's decision-relevant.

Statistical measures are growing faster than any other method, because they're so cheap on the margin. Most existing forecasting systems already lean on them — but they rarely *invent* new ones, and the space of *possible* useful measures vastly exceeds the set in use. Discovering and implementing new measures is plausibly high-leverage work. Profile: **very low marginal cost, high quantity, high trust where applicable, narrow domain.**

## Composite measures

Indices, scales, and typologies that combine narrower measures (usually statistical ones) into an approximation of a broader variable. The aspiration: the cheapness of statistical measures with the generality of expert judgment. There are many existing social and economic indices and clearly room for more.

The hard parts:

- **Setup** is difficult — choosing sub-measures and weights is partly arbitrary.
- **Adversarial settings** (anyone trying to bias the index) usually force human judgment back into the loop somewhere.
- **Flexibility** — sub-measures and weights should ideally be adjustable on demand, and you'd like to forecast over arbitrary recompositions. That's a hard tooling problem and likely some way off.

Profile: **high setup cost, low marginal cost, broad coverage, fragile under adversarial pressure.**

## Partial vs. complete evaluations

Not every method tries to answer the whole question. Surveys and statistical measures are often best seen as **partial evaluations** — inputs and proxies that feed a more complete judgment rather than standing in for it. Designing a system means deciding which questions get full, expensive evaluation and which can ride on partial measures plus prediction.

## Open territory

This is, candidly, the least-developed area of the original program — the source notes were mostly TODOs. There is some real machinery to build on, though: QURI's [Relative Value Functions](/reference/related-work/) (2023) and Utility Function Extractor are concrete attempts at the elicitation problem, and [RoastMyPost](/reference/related-work/) is a deployed LLM-plus-code evaluator spanning several method types. See [Related Work](/reference/related-work/). Live questions include:

- **Elicitation** — how to phrase questions for evaluators; how to elicit utility and value judgments cleanly.
- **Collaboration** — how evaluators interface with forecasters and other components.
- **Reliability** — how reliable evaluations actually are, and how to keep them distinguishable from the forecasts that target them.
- **Cost** — how to put a defensible price on a messy, normative, long-horizon evaluation so it can be traded against accuracy.

These feed directly into the [techniques](/concepts/techniques/) page and the [open problems](/open-questions/).
