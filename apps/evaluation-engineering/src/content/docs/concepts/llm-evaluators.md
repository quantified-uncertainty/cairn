---
title: LLMs as Evaluators
description: What language models change in an evaluation system — which components they cheapen, what the LLM-as-judge literature measures about their reliability, the two system-level failures (correlated error and Goodhart), and how to use them as the cheap layer of a prediction–evaluation system.
---

*Status: early draft, September 2026. This chapter develops the claim the whole wiki rests on: that LLMs are the cheap, general executor the 2021–22 program lacked (see [Lineage](/start-here/lineage/)). Citations are from the [LLM-evaluation section](/reference/adjacent-fields/#4-llm-based-evaluation--ai-evals) of Adjacent Fields and from QURI's own deployments.*

## The claim, and what would falsify it

The founding program stalled on labor. Its architecture needed someone to draft evaluations, structure ontologies, and run calculations for thousands of items, and paying analysts for that made the whole system too expensive to run at scale. The "why now" of this wiki is that language models do much of that labor at a small fraction of the cost.

Stated as a testable claim: **for a given class of evaluation questions, an LLM-based evaluator agrees with a trusted panel about as often as a second, independent panel would, at a cost per item at least ten times lower, and keeps that agreement on audited items after months of deployment, when the evaluated parties have had time to optimize against it.** The claim is falsified for a question class if post-deployment LLM–panel agreement on randomly audited items falls clearly below panel–panel agreement.

The evidence is uneven across the three parts. Accuracy and cost have real support, but only for *checkable* or chat-style tasks: code that runs, forecasts that resolve, preferences between chat responses. For judgment without ground truth, the evaluation side of this field, agreement has barely been measured (below). The third part, holding up under pressure, has no direct evidence at all, and it is what decides whether LLM evaluation is engineering or a demo.

## What LLMs cheapen, component by component

Mapped onto [the four components](/concepts/components/):

| Component | What an LLM does | State of the evidence |
|---|---|---|
| **Ontology** | drafts structured question sets, definitions, resolution criteria | cheap to generate; quality control is the bottleneck. LLM-authored questions skew toward ambiguous entities and timeframes |
| **Calculation** | writes and debugs estimation code | deployed: [Squiggle AI](/reference/related-work/#estimation--calculation-tooling) generates probabilistic models at \$0.10–0.35 per workflow, with documented systematic overconfidence |
| **Prediction** | forecasts directly, or predicts an expensive evaluator | a retrieval-augmented system nears but does not match a forecasting crowd overall (Brier .179 vs. .149); it beats the crowd where the crowd is uncertain and early in a question's life, and lags near resolution because it hedges ([Halawi et al. 2024](https://arxiv.org/abs/2402.18563)) |
| **Evaluation** | judges quality, scores against rubrics, critiques documents | the most-studied use: the LLM-as-judge literature below; deployed as [RoastMyPost](/reference/related-work/#evaluation-methods--utility-elicitation), whose authors report a "significant" false-positive rate |

The pattern across the column: the cost per call is similar everywhere, but LLM output is cheapest to *validate* where it can be checked. Code runs or fails; forecasts resolve; a rubric score does not check itself. So the accuracy-vs-cost question has to be asked separately for each component, and it is hardest for evaluation.

## What the judge literature measures

The research on LLMs as judges has moved from "can they judge?" to cataloguing how they fail:

- **Agreement.** On open-ended chat responses, a strong LLM judge agreed with human preferences about as often as humans agreed with each other: over 80% in the landmark study ([Zheng et al. 2023](https://arxiv.org/abs/2306.05685)). That is the accuracy half of the claim, for one task class.
- **Biases that are truth-independent.** The same study names *position* bias (favoring whichever answer appears first), *verbosity* bias (favoring longer answers), and *self-enhancement* (favoring answers the judge generated itself; later work finds judges also favor models similar to themselves, [Goel et al. 2025](https://arxiv.org/abs/2502.04313)). Each has a known partial fix: judge both orderings and average ([Wang et al. 2023](https://arxiv.org/abs/2305.17926)); regress out length ([Dubois et al. 2024](https://arxiv.org/abs/2404.04475)); use a judge from a different family.
- **Sensitivity to phrasing.** Meaning-preserving formatting changes alone can swing few-shot task accuracy by up to 76 points ([Sclar et al. 2024](https://arxiv.org/abs/2310.11324)). That result is for classification tasks, not judging, but judges run on the same prompt machinery. QURI's [opinion fuzzing](https://quantifieduncertainty.org/posts/opinion-fuzzing-a-proposal-for-reducing-exploring-variance-in-llm-judgments-via-sampling/) proposal treats this as something to measure: sample across prompts, models, and personas, and report the spread as the judgment's uncertainty.
- **Teams match the model and hallucinate less.** On catching bugs in real assistant code, trained critic models' critiques were preferred over human critiques 63% of the time, and human–model teams caught about as many bugs as the model alone while hallucinating fewer ([McAleese et al. 2024](https://arxiv.org/abs/2407.00215)). The cheapest reliable deployment may be making each expensive evaluator faster, not removing them. That is the use-case page's [augmentation framing](/start-here/use-cases/#charity-evaluation-and-prioritization), measured.

What this literature mostly does *not* measure is judgment without ground truth: normative, long-horizon evaluations, the [evaluation side](/start-here/estimation-vs-evaluation/) of the field's core distinction. Agreement with human raters on chat quality says little about agreement with a trusted panel on "how much did this organization reduce risk?"

## The two system-level failures

Per-item biases can be engineered around. Two failures show up only at the level of the whole system, which makes them this wiki's concern.

**1. Correlated error.** The standard move with a noisy judge is to average several. That works only if their errors are independent, and LLMs' are not: when two models are both wrong they tend to agree on the same wrong answer, far above chance ([Kim et al. 2025](https://arxiv.org/abs/2506.07962)), and error similarity rises with capability ([Goel et al. 2025](https://arxiv.org/abs/2502.04313)). So a panel of five models can deliver the *confidence* of five judges with the accuracy of fewer; how many fewer depends on correlation that has to be measured per task. Human expert panels are correlated too, but through different channels (shared training, groupthink). That makes mixing human and model judges a plausible way to buy independence that adding models cannot, though it is untested (see Open questions). The sibling RRP wiki calls correlated error [the field's largest undefended threat](https://reasoning-processes.quantifieduncertainty.org/concepts/hardening-techniques/#what-each-family-defends--and-the-gaps).

**2. Goodhart under optimization.** An LLM judge validated on a fixed test set is validated at zero optimization pressure. Deploy it as a gate that anything valuable depends on, and whoever is being evaluated starts optimizing against it. The reward-modeling literature shows the shape of what follows: under gradient-based optimization against a proxy reward model, the proxy score keeps rising while the true objective (there, a larger "gold" reward model) first rises and then falls ([Gao, Schulman & Hilton 2022](https://arxiv.org/abs/2210.10760)). Grant applicants rewriting reports optimize far more weakly than RL does, so the curve's numbers don't transfer. Its shape is [Goodhart's law](/concepts/patterns-and-failure-modes/#1-the-measure-reshapes-the-measured), and there is no reason to expect the shape to differ. The design consequence: **a judge's validity is indexed to the optimization pressure it was validated under.** Re-validate when the stakes attached to its scores rise, when the evaluated population changes, and whenever the underlying model is updated.

## The design pattern: LLMs as the cheap layer

Put together, these findings suggest one architecture, which is the [prediction–evaluation system](/concepts/techniques/#predictionevaluation-systems) with the cheap predictor now a model:

1. **Keep an expensive, trusted evaluator.** Humans, or a slow, heavily checked process. It is the reference the rest of the system is scored against.
2. **Have the LLM predict that evaluator** on every item, not judge in the abstract. "What would the panel say?" can be scored; "what is true?" often cannot. This makes the *question* scorable, not the answer true: the LLM inherits the panel's errors, and the panel is itself a target for the same optimization.
3. **Audit a hidden random subset** with the expensive evaluator. Random audits *measure* how much gaming is happening; by themselves they don't deter it. In [Techniques](/concepts/techniques/#predictionevaluation-systems), random resolution disciplines *predictors* because they are paid on the audited items. Here the gamer is the evaluated party, and if the model is public or queryable it can search for a winning report offline for almost nothing. Deterrence needs a penalty when an audit exposes gaming (disqualification, a forfeited deposit), which is the [inspection-game bound](https://reasoning-processes.quantifieduncertainty.org/concepts/hardening-deterrence/#worked-bounds) in the sibling wiki. Keeping the model and prompt private raises the cost of the offline search.
4. **Report agreement against a second panel**, not against perfection or a single rater. A model predicting a panel's consensus can beat an individual rater just by averaging, so the fair bar is panel–panel agreement. Two caveats: where panels rarely agree, parity is easy and means little; and parity says nothing about *where* the errors fall. Weight agreement by decision impact (errors near the funding line matter most), and measure it on audited items after deployment, not only on a fixed pre-deployment set.
5. **Escalate disagreement.** Items where fuzzed prompts disagree, or where the model's confidence is low, go to the expensive layer first. This catches *honest* uncertainty, not attacks: an input optimized against the model tends to produce a confident, consistent verdict, and a known escalation rule becomes one more target. Random audits (step 3) remain the only check on gaming.
6. **Re-validate on drift.** New model version, new stakes, or new population means a fresh audit sample before trusting old agreement numbers.

The [worked example](/concepts/worked-example/) puts numbers on this pattern for a grantmaking use case.

## What LLMs do not fix

Evaluation's defining requirement is that the audience [trusts the result](/start-here/estimation-vs-evaluation/#evaluation). Cheap judgments nobody believes move no decisions. A model can match a panel's accuracy and still carry none of its standing, because trust in an evaluator comes partly from accountability: a named panel can be questioned, blamed, and replaced. This is [crux 4](/start-here/key-questions/#on-estimation-vs-evaluation), and nothing in the literature above resolves it. Nor do LLMs change the [cultural constraint](/concepts/epistemic-culture/): a cheaper evaluator of people and organizations meets the same pushback, faster.

## Open questions

- For which classes of *judgment-bound* questions (not chat quality, not resolvable forecasts) has LLM–panel agreement been measured at all, and how does it compare to panel–panel agreement?
- How fast does an LLM judge's accuracy decay as the evaluated parties start optimizing against it, and how large a penalty on audit failure is needed to slow the decay?
- How much independence does a mixed human–model panel buy over a model-only panel, per dollar?
- What audit fraction keeps a deployed LLM evaluator honest, as a function of the stakes attached to its scores? The sibling wiki's [inspection-game bound](https://reasoning-processes.quantifieduncertainty.org/concepts/hardening-deterrence/#worked-bounds) is one starting model.
