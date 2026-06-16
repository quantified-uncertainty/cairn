---
title: What Is a Strong Reasoner?
description: A working definition of "strong reasoner" — an AI system whose judgments deserve substantial weight, in the limit deference, within its domain.
sidebar:
  order: 1
---

*A strong reasoner is an AI system whose judgments deserve substantial weight — in the limit, deference — within its domain. The definition is about warranted trust, not raw capability, and each candidate property earns its place only insofar as it is measurable.*

:::note[Status]
Draft v0 · updated June 2026 · maintained by [QURI](https://quantifieduncertainty.org/). Positions here are exploratory, not settled. Most cited posts are our own earlier QURI writing.
:::

## A working definition

A note on the term first: "strong reasoner" here does **not** mean a reasoning model in the post-2024 sense — an LLM trained with reinforcement learning to emit long chains of thought. Those are candidate *components*. A **strong reasoner** is an AI system whose judgments on hard questions are reliable enough that a careful person should give them substantial weight — in the limit, defer to them — within its domain. The definition is deliberately about *warranted trust*, not raw capability. A model can ace benchmarks while overconfident off-distribution, swayed by framing, and sycophantic. Conversely, a modest system that knows what it knows, says so plainly, and has the track record to prove it can earn that deference.

What would warrant that trust? Candidate properties:

- **Calibration.** When the system says 80%, it should be right about 80% of the time — across domains, not just on the question types it was tuned on.
- **Discrimination.** Calibrated judgments should also sit far from base rates when evidence permits — scored via proper-scoring-rule decompositions (Brier skill), not calibration curves alone; otherwise a hedger that always answers "I don't know" passes every property here.
- **Consistency.** Beliefs should hang together: claim and negation summing to one, equivalent phrasings answered equivalently, estimates that cannot be [Dutch-booked](https://en.wikipedia.org/wiki/Dutch_book). See [Consistency Evaluations](/proposals/consistency-evals/).
- **Honest uncertainty.** Wide intervals where evidence is thin, "I don't know" as a first-class answer, no manufactured precision.
- **Non-sycophancy.** The answer should not depend on who is asking or what they hope to hear — a failure that ties the system's outputs to the asker rather than to the world.
- **Auditable, decomposable reasoning.** Conclusions should come with reasoning broken into checkable steps, so verification can attach to parts rather than an opaque whole. The caveat is *faithfulness*: stated reasoning is often not what produced the answer ([Turpin et al. 2023](https://arxiv.org/abs/2305.04388); [Lanham et al. 2023](https://arxiv.org/abs/2307.13702)), and locally checkable steps can hide a flaw in their stitching ([Barnes & Christiano 2020](https://www.alignmentforum.org/posts/PJLABqQ962hZEqhdB/debate-update-obfuscated-arguments-problem)).
- **Robustness.** Judgments should survive paraphrase, reordering, irrelevant detail, and adversarial framing; conclusions steerable by rewording deserve no weight.

(Factual accuracy has no separate entry; calibration and discrimination, properly scored, subsume it.)

The key move: each property earns its place only insofar as it is **measurable**. "Honest uncertainty" as a vibe is worthless; honest uncertainty as a scored calibration curve is infrastructure. The definition is therefore inseparable from the verification stack built around it — the oversight protocols, consistency suites, and resolution mechanisms (ways to score judgments against outcomes) surveyed in [What Grounds an Oversight Protocol?](/concepts/oversight-protocols/). In practice the best proxy — test batteries the system was *not optimized against*, plus an out-of-sample track record — remains a proxy: behavioral evals bound reliability only on distributions like the test's (hence the Goodhart question below). The batteries are also the expensive part: cleanly resolvable questions are scarce, unrepresentative of hard judgment, and costlier to author and adjudicate than to score. The research program is as much about building the batteries as building the reasoner.

## The unit of analysis: LLM-based epistemic processes

We follow [My current claims and cruxes on LLM forecasting & epistemics](https://forum.effectivealtruism.org/posts/EykCuXDCFAT5oGyux/my-current-claims-and-cruxes-on-llm-forecasting-and) in taking the unit of analysis to be the **LLM-based epistemic process** — the process, not the model: the full system of model plus scaffolding plus protocols that carries out an analysis — data gathering, decomposition, estimation, aggregation, presentation — not the bare model, whose benchmarks miss most of what determines whether the output is worth trusting, and most of the levers for improving it.

The deeper reason to care about processes: a degree of **reproducibility** human experts cannot offer. A versioned process can be re-run, perturbed, studied in parallel, and diffed across versions; you cannot re-run a pundit a thousand times with controlled perturbations. The claim is comparative, though: human calibration has been measured rigorously for decades (Tetlock, the Good Judgment Project), the binding constraint is ground truth rather than run-to-run variance — re-runs tell you nothing about a forecast that resolves in 2035 — and pinning is partial in practice (retrieval drifts; hosted models are silently updated, nondeterministic even at temperature 0). Reproducibility makes measurement cheaper and sharper, not achievable where it otherwise wasn't.

## Why build them: the feasibility case

[6 Potential Misconceptions about AI Intellectuals](https://forum.effectivealtruism.org/posts/xSmrFTWyvSZnYMv63/6-potential-misconceptions-about-ai-intellectuals) makes the case that AI systems doing serious strategic and judgment work — the work of think tanks, analysts, public intellectuals — are **neglected**, **important**, **tractable**, and **relatively safe**. Each leg is hypothesis more than result. Neglectedness is contestable as of 2026 (forecasting startups, lab-internal judge and eval teams). On tractability the evidence is mixed: LLM forecasting scaffolds approach crowd accuracy mainly on easier, near-resolution questions ([Halawi et al. 2024](https://arxiv.org/abs/2402.18563); Metaculus's AI tournaments). Safety is the most contestable: the post argues judgment work avoids the scariest capabilities and may itself help safety, but strategic judgment and persuasion are tracked dangerous capabilities, and an informer deciding what to surface is a manipulation surface — the informer-hood drift noted below is the escalation path, a dual-use objection we flag rather than resolve.

A load-bearing claim there: the bar set by human intellectuals is lower than assumed. Prominent intellectuals are often selected for marketing and confidence rather than calibrated accuracy (cf. Tetlock's *Expert Political Judgment*), and much elite "strategic thinking" receives little rigorous time at all. Matching the *reliability* of typical expert judgment is a nearer target than matching the brilliance of the best.

The post's gradualist core rebuts all-or-nothing capability trajectories: capability arrives in increments, as with autonomous-vehicle levels. Extending that gradualism — our gloss, not the post's — it also answers "why bother, when AGI will get this for free": the trust infrastructure has to be built and validated along the way; a maximally capable reasoner with no track record and no verification stack would still not warrant deference — trustworthiness does not arrive bundled with capability.

## Two useful typologies

**Oracles, informers, controllers.** [One typology](https://www.lesswrong.com/posts/kfY2JegjuzLewWyZd/oracles-informers-and-controllers) sorts systems by autonomy: *oracles* answer when asked, *informers* proactively push what you should know, *controllers* are deferred to across most decisions. The technical distinction is thin — a strong oracle [drifts toward answering the question you *should* have asked](https://www.lesswrong.com/posts/E6sX6LpmacjfYa6N7/questions-are-tools-to-help-answerers-optimize-utility), i.e., toward informer-hood — but the trust requirements escalate sharply at each step, since users sample less and defer more.

Most of this wiki targets the oracle-to-informer range.

**Disagreeables and assessors.** [A second typology](https://www.lesswrong.com/posts/v4nunCfofNo3Ze5bb/disagreeables-and-assessors-two-intellectual-archetypes) splits intellectual labor between *disagreeables* — bold idea-generators with high false-positive rates — and *assessors* — calibrated evaluators who excel at not being wrong. The roles are complementary (babble and prune: generate widely, filter hard), and the properties listed above are essentially the assessor's virtues. We think near-term LLM judges, evaluators, and estimation agents should be built and scored as assessors first: that is the role where calibration and consistency are measurable, and where an unreliable system does the most quiet damage.

## What a strong reasoner is not

- **Not necessarily superhuman.** A system somewhat below peak human insight but far more calibrated, consistent, and available already clears the bar for many uses.
- **Not an oracle for unresolvable questions.** It outputs reasoned, uncertain judgments; pretending to settle questions the evidence cannot settle is a calibration failure.
- **Not trustworthy by construction.** No architecture or training recipe confers trust directly. Trust is earned per-domain through track records, audits, and verification — though reproducibility speeds only the process-property half; accuracy records accrue as questions resolve (backtesting risks training-data leakage), and distribution shift, evaluation-conditional behavior, and version churn make AI track records weaker evidence than human ones.

## Open questions

- Which of the candidate properties are load-bearing, and which are correlated symptoms of the same underlying quality?
- How much should trust transfer across domains — does calibration in geopolitics predict calibration in biology?
- At what measured reliability threshold does moving from oracle to informer deployment become warranted?
- How do we keep "passes the test batteries" from collapsing into Goodharting on the batteries?
- Does trust survive a model update — how much of a track record transfers across versions?
