---
title: LLMs as Evaluators
description: What language models change in an evaluation system — which components they cheapen, what the LLM-as-judge literature measures about their reliability, the two system-level failures (correlated error and Goodhart), and how to use them as the cheap layer of a prediction–evaluation system.
---

*Status: early draft, September 2026. This chapter develops the claim the whole wiki rests on: that LLMs are the cheap, general executor the 2021–22 program lacked (see [Lineage](/start-here/lineage/)). Citations are from the [LLM-evaluation section](/reference/adjacent-fields/#4-llm-based-evaluation--ai-evals) of Adjacent Fields and from QURI's own deployments.*

## The claim, and what would falsify it

The founding program stalled on labor. Its architecture needed someone to draft evaluations, structure ontologies, and run calculations for thousands of items, and paying analysts for that made the whole system too expensive to run at scale. The "why now" of this wiki is that language models do much of that labor at a small fraction of the cost.

Stated as a testable claim: **for a meaningful class of evaluation questions, an LLM-based evaluator reaches accuracy comparable to the human process it replaces, at a cost per item one or more orders of magnitude lower, and keeps that accuracy under the optimization pressure of deployment.** The first two parts have real support. The third, holding up under pressure, is where the evidence runs out, and it is the part that decides whether LLM evaluation is engineering or a demo.

## What LLMs cheapen, component by component

Mapped onto [the four components](/concepts/components/):

| Component | What an LLM does | State of the evidence |
|---|---|---|
| **Ontology** | drafts structured question sets, definitions, resolution criteria | cheap to generate; quality control is the bottleneck. LLM-authored questions skew toward ambiguous entities and timeframes |
| **Calculation** | writes and debugs estimation code | deployed: [Squiggle AI](/reference/related-work/#estimation--calculation-tooling) generates probabilistic models at \$0.10–0.35 per workflow, with documented systematic overconfidence |
| **Prediction** | forecasts directly, or predicts an expensive evaluator | forecasting scaffolds approach crowd accuracy mainly on easier, near-resolution questions ([Halawi et al. 2024](https://arxiv.org/abs/2402.18563)) |
| **Evaluation** | judges quality, scores against rubrics, critiques documents | the most-studied use: the LLM-as-judge literature below; deployed as [RoastMyPost](/reference/related-work/#evaluation-methods--utility-elicitation), whose authors report a "significant" false-positive rate |

The pattern across the column: LLMs are cheapest where the output can be *checked*. Code runs or fails; forecasts resolve; a rubric score does not check itself. So the accuracy-vs-cost question has to be asked separately for each component, and it is hardest for evaluation.

## What the judge literature measures

The research on LLMs as judges has moved from "can they judge?" to cataloguing how they fail:

- **Agreement.** On open-ended chat responses, a strong LLM judge agreed with human preferences about as often as humans agreed with each other: over 80% in the landmark study ([Zheng et al. 2023](https://arxiv.org/abs/2306.05685)). That is the accuracy half of the claim, for one task class.
- **Biases that are truth-independent.** The same study names *position* bias (favoring whichever answer appears first), *verbosity* bias (favoring longer answers), and *self-enhancement* (favoring the judge's own model family). Each has a known partial fix: judge both orderings and treat residual asymmetry as bias ([Wang et al. 2023](https://arxiv.org/abs/2305.17926)); regress out length ([Dubois et al. 2024](https://arxiv.org/abs/2404.04475)); use a judge from a different family.
- **Sensitivity to phrasing.** Formatting changes alone move LLM outputs by double-digit percentages ([Sclar et al. 2024](https://arxiv.org/abs/2310.11324)). QURI's [opinion fuzzing](https://quantifieduncertainty.org/posts/opinion-fuzzing-a-proposal-for-reducing-exploring-variance-in-llm-judgments-via-sampling/) proposal treats this as something to measure: sample across prompts, models, and personas, and report the spread as the judgment's uncertainty.
- **Teams beat either alone.** On catching bugs in real assistant code, trained critic models' critiques were preferred over human critiques 63% of the time, and human–model teams caught about as many bugs as the model alone while hallucinating fewer ([McAleese et al. 2024](https://arxiv.org/abs/2407.00215)). The cheapest reliable deployment may be making each expensive evaluator faster, not removing them. That is the use-case page's [augmentation framing](/start-here/use-cases/#charity-evaluation-and-prioritization), measured.

What this literature mostly does *not* measure is judgment without ground truth: normative, long-horizon evaluations, the [evaluation side](/start-here/estimation-vs-evaluation/) of the field's core distinction. Agreement with human raters on chat quality says little about agreement with a trusted panel on "how much did this organization reduce risk?"

## The two system-level failures

Per-item biases can be engineered around. Two failures show up only at the level of the whole system, which makes them this wiki's concern.

**1. Correlated error.** The standard move with a noisy judge is to average several. That works only if their errors are independent, and LLMs' are not: when two models are both wrong they tend to agree on the same wrong answer, far above chance ([Kim et al. 2025](https://arxiv.org/abs/2506.07962)), and error similarity rises with capability ([Goel et al. 2025](https://arxiv.org/abs/2502.04313)). A panel of five models can deliver the *confidence* of five judges with the *accuracy* of one or two. Human expert panels are correlated too, but through different channels (shared training, groupthink), so mixing human and model judges buys more independence than adding models. The sibling RRP wiki calls correlated error [the field's largest undefended threat](https://reasoning-processes.quantifieduncertainty.org/concepts/hardening-techniques/#what-each-family-defends--and-the-gaps).

**2. Goodhart under optimization.** An LLM judge validated on a fixed test set is validated at zero optimization pressure. Deploy it as a gate that anything valuable depends on, and whoever is being evaluated starts optimizing against it. The reward-modeling literature shows what follows: optimizing against a proxy evaluator raises the proxy score while the true objective first rises and then falls, predictably ([Gao, Schulman & Hilton 2022](https://arxiv.org/abs/2210.10760)). That is [Goodhart's law](/concepts/patterns-and-failure-modes/#1-the-measure-reshapes-the-measured) with a measured curve. The design consequence: **a judge's validity is indexed to the optimization pressure it was validated under.** Re-validate when the stakes attached to its scores rise, when the evaluated population changes, and whenever the underlying model is updated.

## The design pattern: LLMs as the cheap layer

Put together, these findings suggest one architecture, which is the [prediction–evaluation system](/concepts/techniques/#predictionevaluation-systems) with the cheap predictor now a model:

1. **Keep an expensive, trusted evaluator.** Humans, or a slow, heavily checked process. It is the ground truth, and nothing replaces it.
2. **Have the LLM predict that evaluator** on every item, not judge in the abstract. "What would the panel say?" can be scored; "what is true?" often cannot.
3. **Audit a hidden random subset** with the expensive evaluator. Randomness means the evaluated parties cannot tell which items will be checked. That keeps optimizing against the LLM costly, because any item might be the one that gets graded.
4. **Report agreement against the human–human baseline**, not against perfection. The question is whether the model is as good a proxy for the panel as a second panel would be.
5. **Escalate disagreement.** Items where fuzzed prompts disagree, or where the model's confidence is low, go to the expensive layer first.
6. **Re-validate on drift.** New model version, new stakes, or new population means a fresh audit sample before trusting old agreement numbers.

The [worked example](/concepts/worked-example/) puts numbers on this pattern for a grantmaking use case.

## What LLMs do not fix

Evaluation's defining requirement is that the audience [trusts the result](/start-here/estimation-vs-evaluation/#evaluation). Cheap judgments nobody believes move no decisions. A model can match a panel's accuracy and still carry none of its standing, because trust in an evaluator comes partly from accountability: a named panel can be questioned, blamed, and replaced. This is [crux 4](/start-here/key-questions/#on-estimation-vs-evaluation), and nothing in the literature above resolves it. Nor do LLMs change the [cultural constraint](/concepts/epistemic-culture/): a cheaper evaluator of people and organizations meets the same pushback, faster.

## Open questions

- For which classes of *judgment-bound* questions (not chat quality, not resolvable forecasts) has LLM–panel agreement been measured at all, and how does it compare to panel–panel agreement?
- How fast does an LLM judge's accuracy decay as the evaluated parties start optimizing against it, and does randomized auditing measurably slow the decay?
- How much independence does a mixed human–model panel buy over a model-only panel, per dollar?
- What audit fraction keeps a deployed LLM evaluator honest, as a function of the stakes attached to its scores? The sibling wiki's [inspection-game bound](https://reasoning-processes.quantifieduncertainty.org/concepts/hardening-deterrence/#worked-bounds) is one starting model.
