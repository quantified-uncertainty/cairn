---
title: Evaluation Engineering
description: What evaluation engineering is, why treat evaluation as a systems problem that includes its incentives, and how it relates to AI-model evals.
---

*Status: draft, revised October 2026. This page states a framing, not a settled position.*

## The one-sentence version

**Evaluation engineering is the design of systems that produce large numbers of estimates and evaluations at known cost, under incentives that keep them honest.**

We know how to produce one careful evaluation: hire a capable person, give them time, read the report. We are bad at producing the ten-thousandth as cheaply and reliably as the first, keeping all ten thousand consistent as the world changes, and keeping the system trusted once the evaluated start to care about the scores.

## What problem this responds to

Prediction markets, forecasting tournaments and proposals like futarchy looked promising and, two decades on, are little used in government, firms, or even the communities that champion them. One diagnosis is that prediction was never the whole product. Getting from "we can forecast this clean, verifiable question" to "we can put a defensible number on what the decision turns on" needs a structured set of questions (ontology), calculation that chains inputs into derived estimates, prediction to keep the system calibrated, and evaluation to resolve questions with no clean ground truth ([The Four Components](/concepts/components/)). Nobody was building the whole machine.

## Why "engineering", and what it has to include

The framing borrows from systems disciplines (lean manufacturing, software architecture) rather than from the philosophy of value or from program evaluation, whose centre of gravity is the individual study ([Adjacent Fields §3](/reference/adjacent-fields/)). The questions are throughput, cost per item, consistency, failure modes, and how a change to one estimate propagates to the estimates that depend on it. At scale, optimizing any single evaluation is usually the wrong objective.

Certification economics complicates this: who pays a certifier shapes what it certifies ([Patterns §3](/concepts/patterns-and-failure-modes/#3-incentives-and-funding-shape-trustworthiness)). When the [catalogue](/concepts/evaluation-systems-in-the-wild/#does-who-pays-predict-failure) was coded, neither payer type nor method predicted documented failure, but systems paid by the parties they rate had about three times the odds of one, mostly through gaming by the rated party. A purely technical programme would miss that variable. This wiki therefore treats payer, metric ownership, disclosure and appeal as design variables alongside staffing and data, and treats robustness to gaming and legitimacy as properties a design must deliver alongside accuracy and cost ([Evaluation as a System](/concepts/the-systems-view/#the-design-space)). Mechanism design is part of the engineering.

## The core split: estimation vs. evaluation

**Estimation** is producing numbers a careful analyst could check: Fermi estimates, models, sums. **Evaluation** is judgment on messy questions, where the result is useful only if its audience trusts it ("how much did this organization reduce existential risk?"). The design heuristic is divide and conquer: push as much as possible into cheap, verifiable estimation, and confine judgment-bound evaluation to a smaller, more expensive layer. See [Estimation vs. Evaluation](/start-here/estimation-vs-evaluation/).

## The core pattern

The technique this wiki leans on most is the [prediction–evaluation system](/concepts/techniques/#predictionevaluation-systems): a cheap layer (forecasters, a statistical model, now an LLM) predicts what an expensive, trusted evaluator would conclude on every item; a hidden random subset is sent to the expensive evaluator; the cheap layer's agreement on that subset is measured against how often two expensive evaluators agree with each other. QURI's founder wrote this up in 2018, but it was not new. Automated essay scoring has run it for years, DARPA's SCORE program ran it on social-science replication, and prediction-powered inference supplies its statistics ([Lineage](/start-here/lineage/#outside-precedents-for-the-core-pattern)).

## Why evaluation, specifically?

The founding draft's slogan is that highly optimized evaluations are "(almost) all you need". Two claims sit behind it:

- **Evaluation may be most of the valuable output.** Many high-stakes processes are evaluation problems: courts, grantmaking, hiring, impact assessment, policy choice. It is plausible that more resources flow into evaluation than into clean estimation. Nobody has measured this.
- **The accuracy bar is lower than it looks.** Outputs need only beat what people would otherwise have done, cheaply enough to be used. People already make vast numbers of noisy informal judgments ([Objections](/reference/objections/)).

The slogan is the least-supported claim in the wiki and nothing else depends on it.

## Not AI model evals, though they overlap

In current AI usage, "evals" means test suites and judges that measure AI models and AI products: capability and safety evaluations by groups such as [METR](https://metr.org/), whose time-horizon metric tracks the length of tasks models can complete ([Kwa et al. 2025](https://arxiv.org/abs/2503.14499)); open frameworks such as the UK AI Security Institute's [Inspect](https://inspect.aisi.org.uk/); and rubric-based testing of LLM applications. That field is large and well funded. This wiki uses "evaluation" in the older sense of judging grants, organizations, policies and research, where an AI is a possible *evaluator* rather than the thing evaluated.

The two meet wherever an LLM is the judge. Validating a judge against humans, putting error bars on results ([Miller 2024](https://arxiv.org/abs/2411.00640)), and watching a leaderboard get gamed (selective disclosure of privately tested model variants biased Chatbot Arena scores; [Singh et al. 2025](https://arxiv.org/abs/2504.20879)) are shared problems, and the [LLM chapter](/concepts/llm-evaluators/) and [Measuring an Evaluator](/concepts/measuring-an-evaluator/) draw on the AI-evals literature for them. Whether the name should change is [crux 12](/start-here/key-questions/#on-the-field-itself).

## Why this might be worth a field

- **Generality.** Better evaluation systems would help impact assessment, policy, research prioritization and grantmaking at once.
- **Neglect, partly.** The components (forecasting, decision analysis, survey methodology, LLM judging) are each studied. Their integration into audited, high-throughput systems for judging grants, organizations and policies is not, as far as this wiki can tell. The AI-evals boom weakens this claim for anything that looks like judging model outputs.
- **Timing.** LLMs make the labor-intensive steps (drafting evaluations, structuring questions, running calculations) cheap. Whether they make them trustworthy is the open question ([LLMs as Evaluators](/concepts/llm-evaluators/)).

## What this wiki is not yet

It does not commit to a software stack, an institutional form, or claims about cost-effectiveness; those depend on experiments not yet run. Its [capability ladder](/concepts/capability-ladder/) is a v0 graded on eight systems, and its one fully priced design is the fictional [worked example](/concepts/worked-example/).
