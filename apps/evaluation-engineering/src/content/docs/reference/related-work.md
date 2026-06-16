---
title: Related Work
description: QURI's published work that this wiki draws on — the framing, the deployed tools, and the scarce empirical results behind evaluation engineering.
---

*Status: early draft / working bibliography. Evaluation engineering is not a standalone idea — it's the accumulated agenda of the [Quantified Uncertainty Research Institute (QURI)](https://quantifieduncertainty.org/) and collaborators, restated. This page maps the most relevant published work to the parts of the field it bears on. See the [EA Forum QURI topic](https://forum.effectivealtruism.org/topics/quantified-uncertainty-research-institute) for the broader list, and [Adjacent Fields & Literature](/reference/adjacent-fields/) for the external academic literatures (forecasting, decision analysis, program evaluation, LLM evals, scalable oversight, estimation/ontology tooling).*

Two things in this corpus are scarce and worth foregrounding: **empirical results** (small but real experiments, listed below) and **deployed implementations** (running systems with published usage data and honest failure admissions). They are what distinguish a considered agenda from one more framework post.

## Foundational framing

- **Prediction-Augmented Evaluation Systems** (Ozzie Gooen, [LessWrong, 2018](https://www.lesswrong.com/posts/kMmNdHpQPcnJgnAQF/prediction-augmented-evaluation-systems)). The original "predict the evaluation" idea — the direct ancestor of [prediction–evaluation systems](/concepts/techniques/). The wiki's whole estimation/evaluation-bridging move is implicit here.
- **(Highly Optimized) Evaluations Are All You Need** and the earlier *Advanced / Symbolic Evaluation Systems* drafts. The cause-area statement this wiki is built from. See [Lineage](/start-here/lineage/).

## Empirical results (the scarce, valuable part)

These are quotable, dated experiments — exactly the "concrete case studies" the field is short on (see [Objections & FAQ](/reference/objections/)).

- **Amplifying generalist research via forecasting**, [Part 1](https://forum.effectivealtruism.org/posts/ZCZZvhYbsKCRRDTct/part-1-amplifying-generalist-research-via-forecasting-models) (models/challenges) and [Part 2](https://forum.effectivealtruism.org/posts/ZTXKHayPexA6uSZqE/part-2-amplifying-generalist-research-via-forecasting) (results) (Gooen, Sempere, et al., 2019). The flagship test of prediction–evaluation: crowd forecasters predicting a trusted evaluator recovered a large share (reported ~73%) of the evaluator's benefit-cost signal, far cheaper. One of very few real experiments in this space.
- **An experiment to evaluate the value of one researcher's work** ([EA Forum, 2019](https://forum.effectivealtruism.org/posts/udGBF8YWshCKwRKTp/an-experiment-to-evaluate-the-value-of-one-researcher-s-work)). Elicitation of value estimates over research outputs.
- **Predicting the value of small altruistic projects** (Nuño Sempere, 2020). Proof-of-concept that forecasters can discriminate project value pre-execution — with a documented failure mode: systematic optimism.
- **Relative-value elicitation experiments** (Open Phil AI-safety grants, 2022; valuing research works, 2022). Real data on inter-rater disagreement and how it aggregates.

## Estimation & calculation tooling

- **Squiggle** ([squiggle-language.com](https://www.squiggle-language.com/); [GitHub](https://github.com/quantified-uncertainty/squiggle)). A small language for probabilistic estimation — the working instance of [estimation functions](/concepts/techniques/).
- **Squiggle AI** (2025). An LLM (Claude) front-end that generates Squiggle models — a *deployed* estimation system, with published early usage data and a frank writeup of **systematic overconfidence** in generated estimates.
- **Scorable Functions** (2024). The estimator-as-program object, later partially retracted (the author flagged that LLM-on-demand estimates may dominate pre-built functions) — useful lessons-learned.
- **Guesstimate** (2016). The early spreadsheet-style tool that motivated much of this; see [Use Cases](/start-here/use-cases/).

## Ontology & aggregation

- **Metaforecast** ([metaforecast.org](https://metaforecast.org/)). Aggregates and searches forecasts across platforms — infrastructure for the [ontology](/concepts/components/) layer.
- **Foretold.io** ([EA Forum, 2019](https://forum.effectivealtruism.org/posts/5nCijr7A9MfZ48o6f/introducing-foretold-io-a-new-open-source-prediction)). An open-source prediction registry; early structured-forecasting plumbing.

## Evaluation methods & utility elicitation

- **Relative Value Functions: A Flexible New Format for Value Estimation** ([EA Forum, 2023](https://forum.effectivealtruism.org/posts/EFEwBvuDrTLDndqCt/relative-value-functions-a-flexible-new-format-for-value)), plus the Utility Function Extractor and comparison-polling tools. The closest thing to a methods stack behind the [evaluation-methods](/concepts/evaluation-methods/) page's open "elicitation" questions.
- **RoastMyPost** (2025). A deployed LLM-plus-code tool that evaluates posts and research documents for errors, fallacies, and inaccuracies — a running [evaluation system](/concepts/the-systems-view/) with multiple evaluator types.
- **Shallow evaluations of longtermist organizations** (Sempere, 2021). A real, scaled-down [charity-evaluation](/start-here/use-cases/) effort; the kind of "shallow but useful" output skeptics have found valuable.
- **Quantifying Uncertainty in GiveWell's GiveDirectly Cost-Effectiveness Analysis** (Sam Nolan, 2021). Putting distributions on a real CEA — estimation in the charity-evaluation domain.

## Incentives, trust & failure modes

- **Incentive Problems / Alignment Problems with Current Forecasting Platforms** (Sempere & Lawsen, 2020–21). The concrete catalogue of reward-specification failures — directly relevant to whether [prediction–evaluation](/concepts/techniques/) incentives survive gaming.
- **Prediction Markets in the Corporate Setting** (Sempere & Yagudin, 2021). An honest negative result on why organizations reject internal markets (tooling, question-writing cost, social disruption) — feeds [Epistemic Culture](/concepts/epistemic-culture/) and [Objections](/reference/objections/).
- **Opinion Fuzzing** (2025). Evidence that LLM judgments shift substantially on prompt phrasing alone, and more across models/personas — a caution for [evaluation reliability](/concepts/evaluation-methods/).
- **Accuracy Agreements** (2023). Pay-per-bit scoring contracts — a [trust-network](/concepts/techniques/)-adjacent incentive design.

## Resolution & oversight

- **Can We Place Trust in Post-AGI Forecasting Evaluations?** (2019) → **AI for Resolving Forecasting Questions / Epistemic Selection Protocols** (2025). The deferred-resolution thread: how to ground evaluations when the resolver is itself an AI. Overlaps heavily with the sibling [RRP](https://github.com/quantified-uncertainty/cairn) wiki.

---

**A note on sourcing.** Specific figures above (e.g. the ~73% amplification result) are quoted from QURI's published posts and the wiki's internal corpus survey; check them against the linked originals before relying on them. This list is not exhaustive — additions welcome.
