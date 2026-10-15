---
title: Cruxes
description: The open questions evaluation engineering turns on — the things that, if resolved, would most change the shape of the field.
---

*Status: draft, updated October 2026. Numbers are stable; other pages cite them.*

A crux is a question where a confident answer would redirect effort. Each entry says what evidence exists as of late 2026. The longer, per-chapter list is [Open Problems](/open-questions/).

## On the premise

1. **Is the bottleneck the system, not the estimate?** The founding bet is that we can make one good evaluation and fail at making ten thousand cheaply. In domains where experts barely agree with each other (grant review is one), single-evaluation quality may still be the binding constraint.
2. **Does scale unlock value, or just volume?** Ten thousand mediocre estimates may be worth less than ten excellent ones. As far as this wiki knows, no study yet shows a high-throughput system for judging grants, organizations or policies changing decisions that would not otherwise have changed.

## On estimation vs. evaluation

3. **How much can be demoted from evaluation to estimation?** Divide and conquer is only as good as the fraction of judgment-bound questions that can be turned into model-bound ones. No one has estimated that fraction for any real portfolio.
4. **Can LLMs do trustworthy evaluation, or only cheap evaluation?** Agreement with human panels is now measured for chat responses, essays, clinical rubrics and paper review, and at AAAI-26 every main-track paper received an AI review, which surveyed authors and committee members found useful ([LLMs as Evaluators](/concepts/llm-evaluators/#what-the-judge-literature-measures)). None of that measures normative, long-horizon judgment, and none of it measures trust in the accountability sense: whether people accept an unappealable model verdict.

## On the components

5. **Does scalable structured forecasting work?** Can we forecast over large structured ontologies ("for each country, each month, 20 metrics, 20 years") without quality collapsing, now that LLM forecasters make the volume cheap?
6. **Is ontology the silent bottleneck?** Is structuring the questions the hard part, more than answering them?
7. **What is the right interface for estimation functions?** If the unit of reuse is a cached function from parameters to an estimate, what tooling lets these compose at scale?

## On bridging cheap and expensive judgment

8. **Do prediction–evaluation systems calibrate cheap predictors?** Partly answered. In DARPA's SCORE program, human forecasters predicting replication outcomes reached an AUC of about 0.76 against 37 audited replications, while AI systems built to imitate the human judgments failed to discriminate ([Lineage](/start-here/lineage/#outside-precedents-for-the-core-pattern)). Open: whether the pattern survives deceptive participants and evaluated parties who optimize against the cheap layer, and whether it works when the expensive evaluator is a panel's judgment rather than a replication.
9. **How do you price an evaluation?** Trading accuracy against cost needs a value-of-information story for messy, normative, long-horizon questions. The sibling wiki's [Core Model](https://reasoning-processes.quantifieduncertainty.org/concepts/core-model/) offers one; it has not been applied to a real portfolio.

## On the environment

10. **Is culture the real adoption bottleneck?** Documented cases show the evaluated exiting (the 2022 US News law-school boycott) and an inspectorate losing its coarsest output (Ofsted's single-word grades, removed in 2024) ([Epistemic Culture](/concepts/epistemic-culture/)). Whether such pushback binds harder than technical limits, and whether it is more tractable, is unknown.
11. **Does payment buy the evaluator, or mark high stakes?** A coding of 161 catalogued systems found that neither payer type nor method predicted documented failure, but systems paid by the parties they rate had about 3.5 times the odds of one ([catalogue](/concepts/evaluation-systems-in-the-wild/#does-who-pays-predict-failure)). Most of those failures were gaming by the rated party rather than lenient rating, which fits either reading. If payment buys the evaluator, the main work is designing payer and governance; if it marks stakes, the main work is robustness to gaming.

## On the field itself

12. **Is "evaluation engineering" the right frame and name?** The lineage went from advanced evaluation systems through estimation systems to the present framing. The name also collides with AI-model "evals" ([Chapter 1](/start-here/introduction/#not-ai-model-evals-though-they-overlap)). Renaming would avoid confusion; keeping it claims the overlap with a large, funded community.
13. **Does shared infrastructure make errors systemic?** If many funders adopt the same few LLM judges, their mistakes may correlate across institutions, so that the same applicants are rejected everywhere ([Kleinberg & Raghavan 2021](https://arxiv.org/abs/2101.05853); [Bommasani et al. 2022](https://arxiv.org/abs/2211.13972)). Scaled evaluation may need deliberate diversity of judges, which costs some of the savings.

---

Candidate answers, and cruxes this list is missing, are the contribution this wiki most wants.
