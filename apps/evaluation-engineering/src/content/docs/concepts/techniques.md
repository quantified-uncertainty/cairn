---
title: Techniques
description: The system-level patterns that tie the components together — prediction–evaluation systems, scalable structured forecasting, estimation functions, and automated trust networks.
sidebar:
  order: 2
---

*Status: early draft, adapted from the 2021–22 estimation-theory notes.*

The [components](/concepts/components/) are the parts; these are the patterns for wiring them into a working system. Most of them are answers to one question: *how do you get a small amount of expensive, trusted judgment to subsidize a large amount of cheap judgment — and keep the whole thing consistent and honest?*

## Prediction–evaluation systems

The flagship technique, and the cleanest bridge across the [estimation/evaluation gap](/start-here/estimation-vs-evaluation/).

The setup: ask predictors to forecast a large set of items — say 10,000 — and announce that a small random subset — say 50 — will be resolved by an expensive, trusted [evaluation](/concepts/evaluation-methods/). Reward the best predictors of that subset.

Why it works: expensive evaluation gives you *trust and ground truth*; cheap prediction gives you *calibration and scale*. The random-subset-resolution trick lets a tiny evaluation budget calibrate forecasts across an enormous question set, because predictors must treat every item as if it might be the one that gets graded.

The pattern can chain into **multiple training steps**. Once you have 10,000 human predictions calibrated against a small evaluated subset, those predictions themselves become a labeled dataset — you can train cheaper ML predictors on them, evaluate *those* against a fresh subset, and repeat. Each step trades a little accuracy for a large drop in marginal cost. (The earlier write-up called this "prediction-augmented evaluation systems"; "prediction–evaluation" is the same idea, renamed for legibility.)

This is elegant on paper and surely messier in practice. The live questions: does the incentive hold up under gaming, and what happens when some participants are actively deceptive? (See [Cruxes](/start-here/key-questions/), and the sibling [RRP](https://github.com/quantified-uncertainty/cairn) wiki's work on oversight under adversarial conditions.)

This isn't only theory. The idea was first written up as [*Prediction-Augmented Evaluation Systems*](https://www.lesswrong.com/posts/kMmNdHpQPcnJgnAQF/prediction-augmented-evaluation-systems) (2018), and it has been tested: in [*Amplifying generalist research via forecasting*](https://forum.effectivealtruism.org/posts/ZTXKHayPexA6uSZqE/part-2-amplifying-generalist-research-via-forecasting) (2019), crowd forecasters predicting a trusted evaluator recovered a large share (reported ~73%) of the evaluator's benefit-cost signal at much lower cost. See [Related Work](/reference/related-work/) for the empirical record and its caveats.

## Scalable forecasting over structured ontologies

Almost all Tetlock-style platforms rely on small sets of hand-written, unstructured questions. That's fine for a few hundred items and breaks past that. Many questions worth forecasting are inherently structured:

> "For each country, each month for the next 20 years, what will each of 20 key metrics be?"

Today's judgmental platforms choke on this. Making structured — and ideally continuous-domain — forecasting work at scale is one of the field's central unsolved tooling problems, and it leans directly on the [ontology](/concepts/components/) component. Fully continuous domains would be even more valuable and are harder still.

## Estimation functions

A convenient unit of reuse for the [estimation](/start-here/estimation-vs-evaluation/) layer: **a programming function that efficiently returns estimates for large sets of parameters** (often via caching).

In principle a plain Python or JavaScript function suffices; in practice you want a lot of tooling on top — uncertainty handling, caching, composition, dependency tracking — before these become powerful. [Squiggle](https://www.squiggle-language.com/) is one early piece of work in this direction, and [Squiggle AI](/reference/related-work/) is a deployed LLM front-end that generates such models (with documented overconfidence in its outputs). (Guesstimate was an earlier, more limited gesture at the same vision.) The *Scorable Functions* (2024) writeup is worth reading alongside its own partial retraction — the author later flagged that LLM-on-demand estimates may dominate pre-built functions. See [Related Work](/reference/related-work/).

Estimation functions matter for the systems view because they're what make [propagation and consistency](/concepts/the-systems-view/) tractable: if estimates are produced by composable functions over shared inputs, an update to one input can flow through to everything downstream automatically, instead of leaving a pile of silently-stale reports.

## Automated trust networks

Centralized "truth agencies" tend to be more corrupt and less competent than their reputations suggest, and over-trust in them is a real hazard. The proposed alternative is **networks of trust and reputation**: many evaluation agencies that evaluate the big ones and each other, with at least a few good ones earning appropriate trust from the parties that matter.

The more advanced version: let agencies write *functions that adjust other agencies' outputs*. Trusted group X might accept group Y's economic forecasts but believe Y is overconfident about the steel industry — and so apply an automatic, declared correction to everything Y publishes. This turns "who do you trust" into composable, inspectable structure rather than a binary.

This is the technique that most directly addresses the capture/corruption crux, and it overlaps heavily with the sibling RRP wiki's work on identity and track-record infrastructure.

## Cultural change toward candidness

The least technical technique, and possibly the most important — important enough to get [its own page](/concepts/epistemic-culture/). No amount of tooling helps if the community is too uncomfortable to use it. Imagine an agency that, starting tomorrow, published "pretty good" impact estimates for every politician, bill, organization, and person. Even if the estimates were sound, the rollout would be chaotic, the pushback fierce, and the agency likely shut down or captured. Getting from here to a world where high-throughput public evaluation is *tolerated* is partly a cultural-engineering problem, not just a technical one.

## How these fit together

A toy end-to-end system: an **ontology** defines a large structured question set; **estimation functions** populate the parts that calculation can reach; a **prediction–evaluation system** calibrates cheap forecasts against a small budget of expensive **evaluation**; **trust networks** let consumers decide whose outputs to weight; and a supportive **epistemic culture** is what lets any of it be deployed without being destroyed on contact. None of these is solved — see [Open Problems](/open-questions/).
