---
title: Glossary
description: Key terms used across the evaluation-engineering wiki.
---

*Status: draft, updated October 2026. Terms are defined as this wiki uses them; several are contested or provisional.*

**Evaluation engineering** — The design of systems that produce large numbers of estimates and evaluations at known cost, under incentives that keep them honest. The unit of analysis is the *system*, not the individual evaluation. Distinct from AI-model "evals", which measure AI systems. See [Evaluation Engineering](/start-here/introduction/).

**Estimation** — The calculation of specific numbers, usually under uncertainty, where disagreement is about facts and models rather than values, so correctness can in principle be checked. Leans on math, models, and data. See [Estimation vs. Evaluation](/start-here/estimation-vs-evaluation/).

**Evaluation** — A judgment, often numeric, on something *messy* — hard to verify and dependent on the evaluator being *trusted*. Audience effects matter; explanation is usually needed. See [Estimation vs. Evaluation](/start-here/estimation-vs-evaluation/).

**Evaluation system** — Standing machinery that produces evaluations repeatedly, of a consistent type. Defined by system-level properties (throughput, cost-per-item, consistency, propagation) that no single evaluation has. See [Evaluation as a System](/concepts/the-systems-view/).

**Design space** — The properties that decide whether an evaluation system is worth running: accuracy, unit cost (fixed plus marginal per item), robustness under optimization, and legitimacy, with quantity as the scale it runs at. Earlier drafts used a three-way "accuracy × quantity × cost" trade-off. See [Evaluation as a System](/concepts/the-systems-view/#the-design-space).

**Robustness to gaming** — Whether a system's accuracy survives once the evaluated learn what it rewards. One of the four design properties. See [Evaluation as a System](/concepts/the-systems-view/#the-design-space).

**Legitimacy** — Whether the audience trusts a system's outputs enough to act on them and the evaluated accept them enough not to exit, sue or capture it. One of the four design properties. See [Evaluation as a System](/concepts/the-systems-view/#the-design-space).

**Institutional design variables** — Who pays the evaluator, who controls the metric's definition, whether the system depends on the evaluated for data, what it discloses, and whether the evaluated can appeal; treated as design parameters alongside the technical ones. See [Evaluation as a System](/concepts/the-systems-view/#technical-and-institutional-design-variables).

**Divide and conquer** — The strategy of handling as much as possible as cheap, verifiable estimation and sequestering genuinely judgment-bound work into a separate evaluation layer. See [Estimation vs. Evaluation](/start-here/estimation-vs-evaluation/).

**The four components** — Prediction, calculation, ontology, and evaluation: the reusable parts of an evaluation system. See [The Four Components](/concepts/components/).

**Prediction** — The component focused on calibration, scorability, and aggregation; keeps the system honest. See [The Four Components](/concepts/components/).

**Calculation** — The component that chains raw inputs into derived numbers via models, algorithms, and logic; the engine of the estimation layer.

**Ontology** — The component that structures the set of things a system estimates over: taxonomies, definitions, data engineering, knowledge graphs. Flagged as a likely silent bottleneck.

**Symbolic (system)** — Built from explicit, inspectable structure (functions, ontologies, rules), as opposed to opaque end-to-end models. Borrowed from symbolic AI; trade-off is understandability vs. runtime efficiency. Symbolic vs. nonsymbolic is a gradient, not a binary: a system can present a symbolic *interface* (named parameters, structured outputs) over a nonsymbolic *implementation* (e.g. a black-box model populating those parameters). See [Lineage](/start-here/lineage/).

**Advanced evaluation system** — The founding notes' term for a system that is cost-effective, general, and valuable to those who use its outputs, whether or not its internals are symbolic. Graded by the [Capability Ladder](/concepts/capability-ladder/).

**Evaluations are all you need** — The founding draft's slogan for the thesis that evaluation (not estimation) is plausibly the bulk of the valuable output of these systems. Unmeasured. See [Evaluation Engineering](/start-here/introduction/#why-evaluation-specifically).

**Prediction–evaluation system** — A technique in which many predictors forecast a large set, a small random subset is resolved by expensive evaluation, and the best predictors are rewarded — letting a tiny evaluation budget calibrate forecasts at scale. DARPA's SCORE program ran it at scale on research replicability; automated essay scoring uses the same structure. See [Techniques](/concepts/techniques/) and [Lineage](/start-here/lineage/#outside-precedents-for-the-core-pattern).

**Estimation function** — A (typically cached) programming function returning estimates for large parameter sets; the unit of reuse for the estimation layer, and what makes propagation/consistency tractable. See [Techniques](/concepts/techniques/).

**Automated trust network** — A web of evaluation agencies that evaluate each other and can apply declared, composable adjustments to each other's outputs, as an alternative to a single centralized truth agency. See [Techniques](/concepts/techniques/).

**LLM judge** — A language model used to score or compare outputs in place of a human evaluator. Its validity is indexed to the optimization pressure it was validated under; undefended judges have been gamed by constant responses, adversarial phrases and hidden prompts. See [LLMs as Evaluators](/concepts/llm-evaluators/#evidence-under-optimization-pressure).

**Agreement baseline** — How often two independent expert panels agree, measured chance-corrected (e.g. Cohen's κ), because raw agreement rises as the base rate moves away from 50%. The bar for a cheap evaluator is model–panel agreement near panel–panel agreement; it is a bar, not a ceiling, since a model of a noisy panel can predict outcomes better than the panel ([Lineage](/start-here/lineage/#outside-precedents-for-the-core-pattern)). See [A Worked Example](/concepts/worked-example/#what-50-audits-buy).

**Prediction-powered inference** — A statistical method that combines a model's labels on every item with human labels on a random subset to give confidence intervals that stay valid whatever the model's quality ([Angelopoulos et al. 2023](https://arxiv.org/abs/2301.09633)). It corrects estimates of aggregate quantities (a renewal rate, a mean score), not individual verdicts. The formal version of a prediction–evaluation audit. See [LLMs as Evaluators](/concepts/llm-evaluators/#the-design-pattern-llms-as-the-cheap-layer).

**Escalation** — Routing items on which the cheap layer is unsure to a more expensive evaluator. Trust or Escalate gives a cascade with a provable human-agreement guarantee ([Jung, Brahman & Choi 2024](https://arxiv.org/abs/2407.18370)). Catches honest uncertainty, not attacks.

**Algorithmic monoculture** — Many decision-makers relying on the same model, so that their errors correlate across institutions ([Kleinberg & Raghavan 2021](https://arxiv.org/abs/2101.05853)). See [Objections](/reference/objections/).

**Correlated error** — Evaluators that err on the same items; averaging them buys confidence without accuracy. Pronounced among LLMs that share training pipelines. See [LLMs as Evaluators](/concepts/llm-evaluators/#the-two-system-level-failures).

**Partial evaluation** — A method (e.g. a survey or statistical measure) used as an input or proxy feeding a fuller judgment rather than standing in for it. See [Evaluation Methods](/concepts/evaluation-methods/).

**Composite measure** — An index, scale, or typology combining narrower measures into an approximation of a broader variable. See [Evaluation Methods](/concepts/evaluation-methods/).

**Candidness problem** — The tendency for the evaluated to become less open with an evaluator once its outputs matter to them. See [Epistemic Culture](/concepts/epistemic-culture/).

**Epistemic culture** — The norms (candidness, tolerance of public judgment) that decide whether an evaluation system survives deployment, and the pushback it meets when they are absent. See [Epistemic Culture](/concepts/epistemic-culture/).
