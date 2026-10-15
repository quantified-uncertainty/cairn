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

- **Amplifying generalist research via forecasting**, [Part 1](https://forum.effectivealtruism.org/posts/ZCZZvhYbsKCRRDTct/part-1-amplifying-generalist-research-via-forecasting-models) (models/challenges) and [Part 2](https://forum.effectivealtruism.org/posts/ZTXKHayPexA6uSZqE/part-2-amplifying-generalist-research-via-forecasting) (results) (Gooen, Sempere, et al., 2019). The flagship test of prediction–evaluation, and one of very few real experiments in this space. Network-adjacent forecasters predicting a trusted evaluator recovered 87% of her value at 120% of her cost (benefit/cost 72%); online crowdworkers were cheaper (52% of cost) but had negative value. Framed by its authors as an existence proof, not a cost-effectiveness result.
- **An experiment to evaluate the value of one researcher's work** ([EA Forum, 2019](https://forum.effectivealtruism.org/posts/udGBF8YWshCKwRKTp/an-experiment-to-evaluate-the-value-of-one-researcher-s-work)). Elicitation of value estimates over research outputs.
- **Predicting the value of small altruistic projects** (Nuño Sempere, [EA Forum, 2020](https://forum.effectivealtruism.org/posts/qb56nicbnj9asSemx/predicting-the-value-of-small-altruistic-projects-a-proof-of)). Ten forecasters predicted the upvotes (a weak proxy for value) of 20 small projects before they were done; the forecasts separated more- from less-upvoted projects but were too optimistic. The author calls the experiment underpowered.
- **Relative-value elicitation experiments** (Sempere: [valuing research works](https://forum.effectivealtruism.org/posts/hrdxf5qdKmCZNWTvs/valuing-research-works-by-eliciting-comparisons-from-ea), March 2022; [Open Phil's 2018 AI-safety grants](https://forum.effectivealtruism.org/posts/EPhDMkovGquHtFq3h/an-experiment-eliciting-relative-estimates-for-open), September 2022). Six researchers took part in each. In the first, estimates of the same work differed by orders of magnitude and individual raters were internally inconsistent. Real data on inter-rater disagreement and how it aggregates.

## Estimation & calculation tooling

- **Squiggle** ([squiggle-language.com](https://www.squiggle-language.com/); [GitHub](https://github.com/quantified-uncertainty/squiggle)). A small language for probabilistic estimation — the working instance of [estimation functions](/concepts/techniques/).
- **Squiggle AI** ([QURI, October 2024](https://quantifieduncertainty.org/posts/squiggle-ai-an-early-project-at-automated-modeling/); [EA Forum release post, January 2025](https://forum.effectivealtruism.org/posts/jJ4pn3qvBopkEvGXb/introducing-squiggle-ai)). An LLM front-end that generates Squiggle models. A *deployed* estimation system: 30 outside users had run 168 workflows at \$0.10–0.35 each by the release post, which reports that outputs are "often highly overconfident".
- **Scorable Functions** ([LessWrong, May 2024](https://www.lesswrong.com/posts/otFDNWGN3zhNXXGrH/scorable-functions-a-format-for-algorithmic-forecasting)). The estimator-as-program object. In a later [comment](https://forum.effectivealtruism.org/posts/ZWQ5jbLxpd4JtQgu4/scorable-functions-a-format-for-algorithmic-forecasting) the author wrote that he had "become much less enamored by this broad idea", expecting people to ask LLMs for forecasts when they need them.
- **Guesstimate** (2016). The early spreadsheet-style tool that motivated much of this; see [Use Cases](/start-here/use-cases/).

## Ontology & aggregation

- **Metaforecast** ([metaforecast.org](https://metaforecast.org/)). Aggregates and searches forecasts across platforms — infrastructure for the [ontology](/concepts/components/) layer.
- **Foretold.io** ([EA Forum, 2019](https://forum.effectivealtruism.org/posts/5nCijr7A9MfZ48o6f/introducing-foretold-io-a-new-open-source-prediction)). An open-source prediction registry; early structured-forecasting plumbing.

## Evaluation methods & utility elicitation

- **Relative Value Functions: A Flexible New Format for Value Estimation** ([EA Forum, 2023](https://forum.effectivealtruism.org/posts/EFEwBvuDrTLDndqCt/relative-value-functions-a-flexible-new-format-for-value)), plus the Utility Function Extractor and comparison-polling tools. The closest thing to a methods stack behind the [evaluation-methods](/concepts/evaluation-methods/) page's open "elicitation" questions.
- **RoastMyPost** ([QURI, December 2025](https://quantifieduncertainty.org/posts/announcing-roastmypost/)). A deployed LLM-plus-code tool that checks posts and research documents for errors, fallacies, and inaccuracies with several evaluator types. Its authors report that "the false positive rate for error detection is significant". The sibling wiki's [case study](https://reasoning-processes.quantifieduncertainty.org/case-studies/llm-epistemics-in-production/) covers it with Squiggle AI and an LLM-judged Fermi competition.
- **Shallow evaluations of longtermist organizations** (Sempere, [EA Forum, 2021](https://forum.effectivealtruism.org/posts/xmmqDdGqNZq5RELer/shallow-evaluations-of-longtermist-organizations)). A real, scaled-down [charity-evaluation](/start-here/use-cases/) effort, qualitative rather than numeric; the kind of "shallow but useful" output skeptics have found valuable.
- **Quantifying Uncertainty in GiveWell's GiveDirectly Cost-Effectiveness Analysis** (Sam Nolan, [EA Forum, 2022](https://forum.effectivealtruism.org/posts/ycLhq4Bmep8ssr4wR/quantifying-uncertainty-in-givewell-s-givedirectly-cost)). Putting distributions on a real CEA — estimation in the charity-evaluation domain.

## Incentives, trust & failure modes

- **Incentive Problems / Alignment Problems with Current Forecasting Platforms** (Sempere, [2020 blog post](https://nunosempere.com/blog/2020/11/10/incentive-problems-with-current-forecasting-competitions); Sempere & Lawsen, [arXiv 2021](https://arxiv.org/abs/2106.11248)). The concrete catalogue of reward-specification failures — directly relevant to whether [prediction–evaluation](/concepts/techniques/) incentives survive gaming.
- **Prediction Markets in the Corporate Setting** (Sempere, Yagudin & Lifland, [EA Forum, 2021](https://forum.effectivealtruism.org/posts/dQhjwHA7LhfE8YpYF)). An honest negative result on why organizations reject internal markets (tooling, question-writing cost, social disruption) — feeds [Epistemic Culture](/concepts/epistemic-culture/) and [Objections](/reference/objections/).
- **Opinion Fuzzing** ([QURI, December 2025](https://quantifieduncertainty.org/posts/opinion-fuzzing-a-proposal-for-reducing-exploring-variance-in-llm-judgments-via-sampling/)). A proposal, not a measurement: sample an LLM judgment across prompts, models and personas, and report the spread as its uncertainty. It reports no measurements of its own; for evidence that phrasing matters, see [Sclar et al. 2024](https://arxiv.org/abs/2310.11324). Bears on [evaluation reliability](/concepts/evaluation-methods/).
- **Accuracy Agreements** (Gooen, [EA Forum, 2023](https://forum.effectivealtruism.org/posts/6aDPZJQDoQmZ2sooM/accuracy-agreements-a-flexible-alternative-to-prediction)). Contracts that pay a forecaster according to a proper scoring rule — a [trust-network](/concepts/techniques/)-adjacent incentive design. A proposal.

## Resolution & oversight

- **Can We Place Trust in Post-AGI Forecasting Evaluations?** ([LessWrong, 2019](https://www.lesswrong.com/posts/HB6aGCPjtvpLk4K9t/can-we-place-trust-in-post-agi-forecasting-evaluations)) → **AI for Resolving Forecasting Questions**, which introduces Epistemic Selection Protocols ([LessWrong, 2025](https://www.lesswrong.com/posts/8nLMSJqWztrSKYbxf/ai-for-resolving-forecasting-questions-an-early-exploration)). The deferred-resolution thread: how to ground evaluations when the resolver is itself an AI. Overlaps heavily with the sibling RRP wiki's [What Grounds an Oversight Protocol?](https://reasoning-processes.quantifieduncertainty.org/concepts/oversight-protocols/#resolution-grounded-markets-and-prediction-games).

---

**A note on sourcing.** Specific figures above are quoted from QURI's published posts; check them against the linked originals before relying on them. The amplification figures were re-checked against the Part 2 results table in September 2026 — an earlier version of this wiki misreported them as "~73%, far cheaper". Links, dates and quotes for the other entries were checked in October 2026. This list is not exhaustive — additions welcome.
