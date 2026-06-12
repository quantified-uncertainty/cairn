---
title: LLM Epistemics in Production
description: QURI's deployed systems — RoastMyPost, Squiggle AI, and an LLM-judged Fermi competition — as small working instances of this wiki's abstractions.
sidebar:
  order: 1
---

*Three deployed systems — RoastMyPost, Squiggle AI, and an LLM-judged Fermi competition — read as case studies of this book's abstractions, with published numbers and admitted failures: significant false-positive rates, systematic overconfidence, and a miscounted competition. What production teaches that proposals don't.*

:::note[Status]
Draft v0 · updated June 2026 · maintained by [QURI](https://quantifieduncertainty.org/). Synthesized from QURI's published deployment write-ups (2024–2025). Positions here are exploratory, not settled.
:::

## Why this page

Most of this wiki is proposal-grade: frameworks, desiderata, open questions. This page is the closest thing to deployment evidence we have — self-reported, but with published numbers and admitted failures. QURI has shipped a handful of small LLM epistemics systems with real users. None is a controlled experiment, but each is a deployed instance of an abstraction the wiki treats theoretically, and each attached concrete magnitudes to costs the theoretical treatments mostly price abstractly or not at all. We present them as case studies, including the parts that look bad.

## RoastMyPost: the taxonomy's verification sources as a product

[RoastMyPost](https://quantifieduncertainty.org/posts/announcing-roastmypost/) (2025) runs automated critique over submitted documents — optimized for 200–10,000 word posts, returning results in one to five minutes — using seven evaluators: spell check, fact check (via Perplexity lookups), fallacy check, math check (Math.js where the arithmetic is mechanically checkable, an LLM otherwise), link check, forecast check (extract binary predictions and assess them), and an "EA Epistemic Auditor" producing a high-level numeric review. A companion post catalogs [fifteen automatable writing-quality checks](https://quantifieduncertainty.org/posts/beyond-spell-check-15-automatable-writing-quality-checks/), framed as "generalized automated proofreading" — necessary but not sufficient for good writing.

Two design decisions matter for the rest of the wiki.

First, architecture: the evaluators are deliberately **simple programmatic workflows** — chunk the document, run each verification per section — rather than agentic loops, which the team tested and found "substantially more expensive and slower for marginal gains" — a product-scoped data point, not a law about verification.

Second, and more interesting: QURI's tooling uses three of the four groundings' *verification sources* from [our oversight-protocol taxonomy](/concepts/oversight-protocols/) — minus the incentive layer, and at zero optimization pressure: a strict lower bound on the oversight setting.

- **External resolution**: link checks resolve against the live web; Math.js checks against a deterministic interpreter — though only the final step — an untrusted LLM formalizes the math upstream — and link checks have their own infrastructure false positives (bot-blocking, paywalls, soft-404s).
- **LLM verdict**: the fallacy check, fact check (judge-grounded with retrieval), forecast check (unresolvable at evaluation time), and Epistemic Auditor. The false-positive problem below is plausibly concentrated here — QURI's notes call the fallacy check "overly critical" — though unmeasured; see Open Questions.
- **Cross-model agreement**: the [Claim Evaluator](https://www.roastmypost.org/tools) — a companion tool, not one of the seven evaluators — polls multiple LLMs (Claude, GPT, Grok) for a 0–100 agreement score: peer prediction's verification source (scoring a report against other agents' reports) without the incentive machinery that makes it truth-conducive, leaving majority vote among heavily correlated models.

The fourth grounding, coherence, is absent entirely — see the gap below.

The published limitations are blunt: "the false positive rate for error detection is significant," and the system is "not reliable enough to treat results as publicly authoritative." The stated use case is draft polishing by knowledgeable users — explicitly not gatekeeping. That positioning is itself a finding: the judge-grounded verdicts cheap enough to run on every draft are not yet trustworthy enough to gate anything downstream.

## Squiggle AI: auditable models, with documented failure modes

[Squiggle AI](https://quantifieduncertainty.org/posts/squiggle-ai-an-early-project-at-automated-modeling/) (2024) generates probabilistic models in [Squiggle](https://www.squiggle-language.com/), QURI's estimation language. The core loop is iterative error-correction against real execution: the LLM writes code, the interpreter runs it, errors and custom lint checks feed back, repeat. The output is an artifact a human can read, run, and modify — auditability is the point, versus asking a model for a number and trusting its chain of thought.

The [usage data](https://forum.effectivealtruism.org/posts/jJ4pn3qvBopkEvGXb/introducing-squiggle-ai) is small but concrete: 168 workflows from 30 external users in the months preceding the January 2025 write-up, at \$0.10–0.35 per workflow — pilot scale, too small to estimate retention, with frequent stalls from rate limits and API balance issues. The developer reports his own model-creation time dropping from 2–3 hours hand-built to 10–30 minutes; no external-user time or quality measurements exist. Later [model-comparison work](https://quantifieduncertainty.org/posts/updated-llm-models-for-squiggleai/) found newer models improving baseline generation quality at sharply different price points, though complex models still need multiple iterations regardless of model.

The documented failure modes are the valuable part. Generated estimates are systematically **overconfident** — "highly overconfident (despite some warnings in the prompts)," which is worth dwelling on: the obvious mitigation was tried and did not suffice. Models also routinely **omit key considerations** — a distribution can only be as honest as the factor list behind it. QURI's own guidance is to treat outputs as "starting points rather than definitive analyses." Related quality dimensions — uncertainty handling, coverage — were flagged as evaluation targets in [earlier QURI work on LLM mathematical modeling](https://quantifieduncertainty.org/posts/enhancing-mathematical-modeling-with-llms-goals-challenges-and-potential-evaluations/); production surfaced both failures anecdotally, before any formal evaluation measured them, and the observations come from the same team that built the system.

## The \$300 Fermi Model Competition: a deployed LLM judge

In early 2025 QURI ran a [\$300 competition for Fermi estimates](https://quantifieduncertainty.org/posts/300-fermi-model-competition/) judged by an LLM — Claude 3.5 Sonnet, three runs averaged — with the QURI team as co-judge, against a published rubric: **Surprise 40%**, Topic Relevance 20%, Robustness 20%, Model Quality 20%. Surprise was defined as how unexpected the findings would be to the rationalist and EA communities: contradiction of expectations, counterintuitiveness, magnitude of deviation from common belief.

The weighting is the interesting move. Putting 40% on surprise makes belief shift the dominant scoring term — a crude proxy for the magnitude dimension of [Epistemic Impact Analysis](/proposals/epistemic-impact-analysis/) (scoring research by how much it moves audience beliefs), deployed with real (small) money attached. It also inherits EIA's central vulnerability in miniature: surprise without validation pays for persuasion as readily as truth — and all four rubric terms shared one judge, so persuading the judge optimized robustness along with surprise. The only out-of-band signal was a human Goodharting penalty of up to -100% for entries gaming the LLM metrics — a veto that concedes the rubric can't catch its own gaming (in the event, never applied). Run-averaging addressed judge noise, not bias.

The run's one documented production failure is more instructive than the rubric: participants caught calculation errors in the hastily AI-coded evaluation app, the recount raised one entry's Surprise score enough to change the winner, and the originally announced first-place entrant was paid a \$100 second-place prize for the confusion. As a precursor it is tiny; as evidence that such a rubric can be written down and run cheaply, it is real.

## What production teaches that proposals don't

- **False-positive economics dominate.** A critic that cries wolf transfers verification cost back to the human; RoastMyPost's "significant" false-positive rate — QURI's qualitative self-assessment, with no precision numbers published — is why it is a drafting aid, not an oversight layer. Control designs do price this (audit budgets, suspicion thresholds), but for rare attacks; here the same economics bind in a benign, every-draft regime.
- **Prompt engineering is a recurring tax, not a setup cost.** Squiggle AI's anti-overconfidence warnings were partially ineffective, and every model upgrade reopens the question.
- **Cost ceilings shape architecture.** Chunked pipelines beat agentic loops at RoastMyPost; sub-dollar workflow budgets bound how much checking Squiggle AI can afford. Cheap-per-document regimes inherit these product economics; high-stakes oversight inherits control-style budgets instead. The transferable point: some budget always binds, and pipelines beat agents under tight ones.
- **Auditability is bounded by the reader's budget.** Squiggle AI's 100–200-line generated models are auditable in principle; in practice unconventional generated assumptions are, per QURI, "challenging to interpret" — auditability is a property of the reader's budget, not just the artifact.
- **The gap:** no formal calibration, accuracy, or per-evaluator precision evaluation of any of these systems has been published — the evaluation designs sketched in the [mathematical-modeling post](https://quantifieduncertainty.org/posts/enhancing-mathematical-modeling-with-llms-goals-challenges-and-potential-evaluations/) remain unexecuted. Coherence — the grounding none of this tooling uses — is where to start: the documented overconfidence is exactly the kind of failure a [Consistency Evaluations](/proposals/consistency-evals/) battery is positioned to measure systematically rather than anecdotally.

## Open questions

- What false-positive rate makes an automated critic net-positive for a given reader, and how should evaluators expose confidence so users can set their own threshold?
- Does the grounding decomposition predict where RoastMyPost's evaluators fail — judge-grounded evaluators producing the false positives, resolution-grounded ones staying clean? Checkable only by human-labeling a sample of logged flags — an adjudication cost that is itself an instance of the first lesson above.
- Can Squiggle AI's overconfidence be fixed at the system level — calibration layers, [consistency checks](/proposals/consistency-evals/) at generation time — or only inherited from better-calibrated base models?
- The Fermi competition judged surprise without validation. What is the smallest deployable version that escrows surprise against later [resolution](/concepts/oversight-protocols/)?
