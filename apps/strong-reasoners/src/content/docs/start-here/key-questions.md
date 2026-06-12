---
title: Cruxes
description: The central uncertainties this wiki is organized around — the questions whose answers would most change what we work on.
sidebar:
  order: 2
---

*The uncertainties this book is organized around, in four clusters: what a strong reasoner is, where the gains come from, what could go wrong, and who should govern any of it. A cruxes document is, loosely, a draft utility function over the field's own questions.*

:::note[Status]
Draft v0 · updated June 2026 · maintained by [QURI](https://quantifieduncertainty.org/). Reflects cruxes principally from Ozzie Gooen's [Claims & Cruxes on LLM Forecasting & Epistemics](https://forum.effectivealtruism.org/posts/EykCuXDCFAT5oGyux/my-current-claims-and-cruxes-on-llm-forecasting-and) (2024), a preliminary personal post; the question set and weights remain under revision.
:::

This wiki is organized around uncertainties, not conclusions. The questions below are the ones whose answers would most change what we work on. They cluster into four groups: what a strong reasoner *is*, where the gains will actually come from, what could go wrong, and who should be in charge of any of it. (A cruxes document is, loosely, a draft utility function — see [Epistemic Impact Analysis](/proposals/epistemic-impact-analysis/) — so treat the selection as a position we expect to revise.)

## 1. Definition and measurement

The original framing questions of the wiki: what is the object, and how would we recognize one?

- **What is a strong reasoner?** Is there a coherent target — an AI system whose judgments are reliable enough to be worth updating on — or does "reasoning strength" dissolve into unrelated capabilities per domain? See [What Is a Strong Reasoner?](/concepts/what-is-a-strong-reasoner/)
- **How would we know — what evidence would justify trusting machine judgment?** Most of the judgments we care about lack ground truth on any useful timescale, so trust has to be built from indirect evidence; the candidate groundings are mapped in [What Grounds an Oversight Protocol?](/concepts/oversight-protocols/)
- **How much does consistency constrain correctness?** Coherence checks are cheap and unsupervised, but a consistent deceiver passes them and an honest bounded reasoner fails somewhere — so where does the screen actually bind? See [Consistency Evaluations](/proposals/consistency-evals/).
- **Does [retrodiction](/concepts/oversight-protocols/) — scoring models on known facts hidden from them — survive contamination?** It could vastly expand the testable set, but held-out banks decay with each release, models infer outcomes from correlated knowledge, and questions still need hand operationalization; uncontrolled, those leaks erase a rare scalable source of ground truth.
- **What does the capability curve look like, and where are current models on it?** Judge unreliability is well documented: formatting alone moves outputs by double digits ([Sclar et al. 2024](https://arxiv.org/abs/2310.11324)), position and self-preference biases recur ([Zheng et al. 2023](https://arxiv.org/abs/2306.05685)), and QURI's [Opinion Fuzzing](https://quantifieduncertainty.org/posts/opinion-fuzzing-a-proposal-for-reducing-exploring-variance-in-llm-judgments-via-sampling/) proposal to sample across that variance is unvalidated. What stays thin is judgment without ground truth: forecasting benchmarks ([Halawi et al. 2024](https://arxiv.org/abs/2402.18563)) cover only the resolvable slice, and QURI's deployed tools ([Squiggle AI, RoastMyPost](/case-studies/llm-epistemics-in-production/)) lack any published calibration evaluation.

## 2. Where the gains come from

The strategic cruxes, drawn most directly from [Claims & Cruxes](https://forum.effectivealtruism.org/posts/EykCuXDCFAT5oGyux/my-current-claims-and-cruxes-on-llm-forecasting-and).

- **Does epistemic improvement come from base models or from scaffolding?** If the key functionality lands in the inference layer rather than in software built around it, most work outside the major labs gets obsoleted on lab timelines — the post flags this as a crux that "could significantly change what work will be valuable."
- **Who builds it — labs, startups, or nonprofits?** The post's most-likely failure mode is that projects here simply fail to make an impact — commercial capture of the obvious markets is one route; the open question is whether a meaningful nonprofit niche remains.
- **Does better epistemics differentially help safety, or just accelerate everything?** Epistemic tools could help convince developers about alignment problems — or simply be folded into capabilities work with safety neglected; the differential is the case for the whole agenda.
- **Is there demand?** Real-money markets found mass demand for elections and sports but near-zero as institutional decision inputs, and corporate prediction markets repeatedly failed ([Sempere et al. 2021](https://forum.effectivealtruism.org/posts/dQhjwHA7LhfE8YpYF/prediction-markets-in-the-corporate-setting)) — from elicitation costs, which AI removes, or aversion to forecasts leadership can be held to, which it doesn't?
- **What applications unlock at each reliability level?** Marginal reliability gains plausibly unlock discontinuous application tiers — see [The Reliability Ladder](/concepts/epistemic-applications/) for the candidate ladder.

## 3. Failure modes

What breaks, and whether the breakage is recoverable.

- **How real is AI-driven epistemic lock-in?** Reasoning agents optimized for retention rather than accuracy could fragment users into self-reinforcing belief clusters that resist empirical challenge — and false epistemics can reshape values, making this arguably worse than value lock-in ([sketch here](https://forum.effectivealtruism.org/posts/G7KnxZ3Jpuy6hQ4Ew/a-sketch-of-ai-driven-epistemic-lock-in)).
- **Does persuasion capability outpace verification?** Judge-grounded oversight trains for *what convinces*; per the [obfuscated-arguments problem](https://www.alignmentforum.org/posts/PJLABqQ962hZEqhdB/debate-update-obfuscated-arguments-problem) (Barnes & Christiano 2020), a flaw spread across many individually-plausible steps can't be efficiently located, so long honest and dishonest arguments look alike — whether such arguments are cheap to find is open; see [What Grounds an Oversight Protocol?](/concepts/oversight-protocols/)
- **How correlated are errors across model families?** Aggregation, peer prediction, and multi-model checks all assume some independence; if a handful of training pipelines share blind spots, ensembling delivers confidence without accuracy.
- **What happens when the eval becomes the objective?** Once reasoner scores gate anything valuable, measured systems and deployers optimize against the measure — Goodharted judge metrics, gamed batteries, sandbagging.
- **Does resolution-grounding break worst where we need it most?** Resolution ambiguity is pervasive across forecasting; AI-progress questions sit at the bad end of that continuum: resolution arrives too late, operationalizations are contested (five-plus reported definitions of "human-level AGI" — [Sempere 2023](https://nunosempere.com/blog/2023/11/07/hurdles-forecasting-ai/), citing Yagudin), and feedback loops never close.

## 4. Institutions

Even given working systems, the governance questions remain open.

- **Who should run oversight and metering systems for automated research?** The metering layer concentrates real power over what research counts; see [Overseeing Automated Research](/proposals/overseeing-automated-research/).
- **What consent norms should govern AI evaluation of people and organizations?** Cheap automated evaluation arrives before norms about who may be evaluated, by whom, and with what recourse ([Evaluation Consent Policies](https://quantifieduncertainty.org/posts/evaluation-consent-policies/)).
- **How risky are epistemic improvements in general?** Better collective epistemics is usually assumed safe to maximize; we treat distribution — whether gains accrue broadly or concentrate among already-powerful actors — as a crux in its own right (the source touches it only under one failure mode).
- **Can self-correcting loops cap the harms?** Claims & Cruxes proposes that builders use their own epistemic tools to evaluate — and if necessary halt — further development; whether such loops would work is a hope with little evidence either way.

Where a question has matured into a position, it gets its own page; [Open Problems](/open-questions/) aggregates the page-level residue that hasn't.
