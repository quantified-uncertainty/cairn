---
title: Glossary
description: Key terms used across the evaluation-engineering wiki.
---

*Status: early draft. Terms are defined as this wiki uses them; several are contested or provisional.*

**Evaluation engineering** — The discipline of designing, building, and operating systems that produce large numbers of estimates and evaluations efficiently, consistently, and at known cost. The unit of analysis is the *system*, not the individual evaluation. See [Evaluation Engineering](/start-here/introduction/).

**Estimation** — The calculation of specific numbers, usually under uncertainty, where the estimator only has to be *correct* (interpretation and audience effects don't matter). Leans on math, models, and data. See [Estimation vs. Evaluation](/start-here/estimation-vs-evaluation/).

**Evaluation** — A judgment, often numeric, on something *messy* — hard to verify and dependent on the evaluator being *trusted*. Audience effects matter; explanation is usually needed. See [Estimation vs. Evaluation](/start-here/estimation-vs-evaluation/).

**Evaluation system** — Standing machinery that produces evaluations repeatedly, of a consistent type. Defined by system-level properties (throughput, cost-per-item, consistency, propagation) that no single evaluation has. See [Evaluation as a System](/concepts/the-systems-view/).

**Accuracy × quantity × cost** — The three-way trade-off that defines an evaluation system's design space; you can usually buy more of any two by sacrificing the third. See [Evaluation as a System](/concepts/the-systems-view/).

**Divide and conquer** — The strategy of handling as much as possible as cheap, verifiable estimation and sequestering genuinely judgment-bound work into a separate evaluation layer. See [Estimation vs. Evaluation](/start-here/estimation-vs-evaluation/).

**The four components** — Prediction, calculation, ontology, and evaluation: the reusable parts of an evaluation system. See [The Four Components](/concepts/components/).

**Prediction** — The component focused on calibration, scorability, and aggregation; keeps the system honest. See [The Four Components](/concepts/components/).

**Calculation** — The component that chains raw inputs into derived numbers via models, algorithms, and logic; the engine of the estimation layer.

**Ontology** — The component that structures the set of things a system estimates over: taxonomies, definitions, data engineering, knowledge graphs. Flagged as a likely silent bottleneck.

**Symbolic (system)** — Built from explicit, inspectable structure (functions, ontologies, rules), as opposed to opaque end-to-end models. Borrowed from symbolic AI; trade-off is understandability vs. runtime efficiency. Symbolic vs. nonsymbolic is a gradient, not a binary: a system can present a symbolic *interface* (named parameters, structured outputs) over a nonsymbolic *implementation* (e.g. a black-box model populating those parameters). See [Lineage](/start-here/lineage/).

**Advanced evaluation system** — An evaluation system high on the capability ladder: great cost-effectiveness, wide generality, and real value creation — independent of whether its internals are symbolic. Analogous to "Level 4" autonomy for self-driving. See [Evaluation as a System](/concepts/the-systems-view/).

**Evaluations are all you need** — The thesis that evaluation (not estimation) is plausibly the bulk of the valuable output of these systems, and that highly *optimized* evaluation is the thing to chase. The accuracy bar is "better than people would otherwise do," not absolute correctness. See [Evaluation Engineering](/start-here/introduction/) and [Objections & FAQ](/reference/objections/).

**Prediction–evaluation system** — A technique in which many predictors forecast a large set, a small random subset is resolved by expensive evaluation, and the best predictors are rewarded — letting a tiny evaluation budget calibrate forecasts at scale. See [Techniques](/concepts/techniques/).

**Estimation function** — A (typically cached) programming function returning estimates for large parameter sets; the unit of reuse for the estimation layer, and what makes propagation/consistency tractable. See [Techniques](/concepts/techniques/).

**Automated trust network** — A web of evaluation agencies that evaluate each other and can apply declared, composable adjustments to each other's outputs, as an alternative to a single centralized truth agency. See [Techniques](/concepts/techniques/).

**Partial evaluation** — A method (e.g. a survey or statistical measure) used as an input or proxy feeding a fuller judgment rather than standing in for it. See [Evaluation Methods](/concepts/evaluation-methods/).

**Composite measure** — An index, scale, or typology combining narrower measures into an approximation of a broader variable. See [Evaluation Methods](/concepts/evaluation-methods/).

**Candidness problem** — The tendency for the incentive to be honest in an evaluation to collapse once the evaluation starts to matter to those being evaluated. See [Epistemic Culture](/concepts/epistemic-culture/).

**Epistemic culture** — The cultural background (norms of candidness, tolerance for public judgment) that an evaluation system needs to survive deployment; plausibly the binding constraint. See [Epistemic Culture](/concepts/epistemic-culture/).
