---
title: Lineage
description: Where evaluation engineering comes from — QURI's 2021–22 "advanced / symbolic evaluation systems" program, the outside precedents for its core audit pattern, and its relation to AI-model evals.
---

*Status: draft, revised October 2026.*

This page traces where the framing comes from, inside QURI and outside it, so its assumptions are visible.

## The 2021–22 program

The direct ancestor is a draft post series written in 2021–22 under the banner **advanced evaluation systems**, and, for the paradigm it focused on, **symbolic evaluation systems**. Its core moves:

- **From prediction to evaluation systems.** Prediction markets and tournaments had underwhelmed in practice. The diagnosis was that prediction is one component of a larger architecture, and that the architecture, not better markets, is the research target.
- **A component decomposition.** Serious systems combine prediction, calculation, ontology and evaluation, on a background of epistemic foundations and culture ([The Four Components](/concepts/components/)).
- **The estimation/evaluation split**, with a divide-and-conquer design strategy ([Estimation vs. Evaluation](/start-here/estimation-vs-evaluation/)).
- **A set of techniques**: prediction–evaluation systems, scalable structured forecasting, estimation functions, automated trust networks, and cultural change toward candidness ([Techniques](/concepts/techniques/)).

*Symbolic* was borrowed from symbolic AI: systems built from explicit, inspectable structure (functions, ontologies, rules), easy to study and sometimes inefficient to run.

The program's acknowledged gap was a cheap, general executor for the labor-intensive parts: drafting evaluations, structuring ontologies, chasing inputs. Without one, the architecture needed armies of analysts or stayed confined to the few questions a small team could hand-craft. The notes hoped that "AI advancements will greatly augment" the program while assuming it had to stand without them.

## The bridge draft and the LLM turn

A later, unpublished redraft, **"(Highly Optimized) Evaluations Are All You Need"**, keeps the architecture and moves evaluation to the centre: evaluation, not estimation, is plausibly most of the valuable output. It adds use cases (charity prioritization alongside futarchy, certificates of impact and Guesstimate), sizes the effort at roughly autonomous-driving scale (an *illustrative* \$100B over 20 years, with no model behind it), and records objections and outside feedback, now in [Objections & FAQ](/reference/objections/). Its author flags being "really not sure about much of this".

Large language models are a plausible candidate for the missing executor: cheap and general where the architecture was bottlenecked, uneven and hard to trust where evaluation is hardest. That moves the program from "interesting if we ever get the labor" to "buildable, with the labor question recast as a question of quality and trust". Hence the present name.

## Outside precedents for the core pattern

Ozzie Gooen's [*Prediction-Augmented Evaluation Systems*](https://www.lesswrong.com/posts/kMmNdHpQPcnJgnAQF/prediction-augmented-evaluation-systems) (2018) proposed letting cheap predictors forecast an expensive evaluator on many items and checking them on a random few. Other fields reached the same pattern independently, and most have more evidence than QURI's own experiments.

**Automated essay scoring.** Large testing programs have scored essays by machine for years and validated the machine against human raters. The usual acceptance criterion, attributed to [Williamson, Xi & Breyer (2012)](https://doi.org/10.1111/j.1745-3992.2011.00223.x), compares machine–human agreement with human–human agreement and accepts the machine if its quadratic-weighted kappa is no more than 0.10 below the human–human figure ([ACT 2023](https://www.act.org/content/dam/act/unsecured/documents/R2304-CRASE-Essay-Scoring-Model-Performance-02-2023.pdf) applies it). That is the panel–panel baseline this wiki recommends, already an industry standard ([Measuring an Evaluator](/concepts/measuring-an-evaluator/)).

**Replication forecasting and DARPA SCORE.** Prediction markets run alongside replication projects forecast which published findings would replicate; across four such studies they called 73% of 104 outcomes correctly ([Dreber et al. 2015](https://doi.org/10.1073/pnas.1516179112); summary in [Liu et al. 2020](https://arxiv.org/abs/2005.04543)). DARPA's SCORE program (from 2019) scaled this up. Forecasters priced claims from about 3,000 social- and behavioural-science papers, and only a small fraction would ever be replicated, so Replication Markets used decision markets and surrogate scoring rules to keep incentives intact (Liu et al. 2020). The results appeared in April 2026:

- The expensive evaluator: 274 claims from 164 papers were replicated with high power, and 55.1% (95% CI 49.2–60.9%) replicated in the original pattern ([Tyner et al. 2026](https://doi.org/10.1038/s41586-025-10078-y), *Nature*).
- The middle layer: human forecasts were informative. Replication Markets reached a median AUC of 0.76 and 73% classification accuracy; repliCATS, a structured group-deliberation protocol, reached AUC 0.76 and 68%. Both were validated against only 37 independent high-power replications ([Mody et al. 2026](https://osf.io/preprints/metaarxiv/vgyed_v1), preprint).
- The cheapest layer: three AI systems built to predict the human assessments achieved "modest calibration" to the human judgments but "failed to discriminate between replicable and non-replicable claims" ([Rajtmajer et al. 2026](https://osf.io/preprints/metaarxiv/bdmte_v1), preprint).

Three lessons for this wiki. The pattern worked one layer down: cheap human forecasts recovered real signal about an expensive evaluator. It did not yet work two layers down: models built to imitate the human judgments did not inherit their discrimination. And the audit that validated everything was 37 items; how far a small audit can be trusted is worked through in [What 50 audits buy](/concepts/worked-example/#what-50-audits-buy).

**Prediction-powered inference.** The statistics for "model labels everything, humans label a random subset" now exist. [Angelopoulos et al. (2023, *Science*)](https://arxiv.org/abs/2301.09633) give confidence intervals that stay valid whatever the model's quality and narrow as it improves; [Dorner, Nastl & Hardt (2025)](https://arxiv.org/abs/2410.13341) show that when the judge is no more accurate than the model it evaluates, such debiasing can at most halve the human labels needed. See [Measuring an Evaluator](/concepts/measuring-an-evaluator/#prediction-powered-inference).

**Selective escalation.** [Trust or Escalate (Jung, Brahman & Choi 2024)](https://arxiv.org/abs/2407.18370) formalizes the cheap layer deferring to a stronger one when unsure, with a provable guarantee of a user-specified level of human agreement on the items it does judge. It is the escalation step in the [LLM chapter's design pattern](/concepts/llm-evaluators/#the-design-pattern-llms-as-the-cheap-layer).

## AI-model evals: a parallel line

In AI, "evals" has come to mean measuring AI models: benchmark suites, LLM-as-judge pipelines, frontier-model testing by groups such as [METR](https://metr.org/), and open tooling such as the UK AI Security Institute's [Inspect](https://inspect.aisi.org.uk/). That line descends from machine-learning benchmarking, not from forecasting or program evaluation, and it judges models rather than grants or organizations. It has independently produced the tools this wiki needs for its cheap layer: judge validation, error bars ([Miller 2024](https://arxiv.org/abs/2411.00640)), and a growing record of gamed leaderboards ([Singh et al. 2025](https://arxiv.org/abs/2504.20879)). The overlap is discussed in [Chapter 1](/start-here/introduction/#not-ai-model-evals-though-they-overlap).

## The naming trail

> advanced evaluation systems → symbolic evaluation systems → (general-purpose, large-scale) estimation systems → "highly optimized evaluations" → **evaluation engineering**

Each rename tracked the emphasis of the moment: the advance over existing systems, the symbolic paradigm, estimation as the more fundamental operation, evaluation as the dominant output, and now the design of high-throughput systems. None is meant as final, and the last collides with AI-evals usage ([crux 12](/start-here/key-questions/#on-the-field-itself)).

## Sibling project

**Robust Reasoning Processes (RRP)** inherited a different slice of the same 2021–22 corpus: the "processes over forecasts" move and how processes resist corruption. RRP centres trustworthiness under adversarial pressure; this wiki centres high-throughput production at known cost. Since this wiki now counts robustness to gaming as a design property, the two overlap more than they did.
