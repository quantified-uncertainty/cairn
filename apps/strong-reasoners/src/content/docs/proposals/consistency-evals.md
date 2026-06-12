---
title: Consistency Evaluations
description: Evaluating AI estimation agents by whether they can be arbitraged, not just whether they are accurate.
sidebar:
  order: 2
---

*Evaluate AI estimation systems by whether they can be arbitraged, not only whether they are accurate: seven types of consistency check, a Dutch-book framing that prices inconsistency as extractable profit, and a proposed counterexample-shrinking method for minimizing violations. Consistency is the cheap, unsupervised, never-sufficient layer of the verification stack.*

:::note[Status]
Draft v0 · updated June 2026 · maintained by [QURI](https://quantifieduncertainty.org/). Adapted from earlier QURI writing, updated for the LLM era. Positions here are exploratory, not settled.
:::

## Summary

Most evaluation of AI forecasting and estimation systems focuses on accuracy: compare outputs to resolved ground truth. But ground truth is scarce, slow, and biased toward easily resolvable questions. A complementary approach is to measure **consistency**: whether a system's estimates obey the constraints that any rational set of beliefs must obey, regardless of whether we know the right answers.

The framing we find most useful: a consistent estimator is one that **cannot be arbitraged**. If a system assigns $P(A) = 0.7$ and $P(\neg A) = 0.4$, a bookie betting at those odds would be guaranteed a profit — a [Dutch book](https://en.wikipedia.org/wiki/Dutch_book). The book is a counterfactual measuring device — deployed models are not betting counterparties, and exploitability depends on how downstream systems convert estimates into commitments — but inconsistency is surplus available to any adversary that can afford the search, and that search is getting cheap.

Consistency checks are cheap, automatable, and resolution-free *relative to ground-truth evaluation*, though check generation, equivalence judging, and violation auditing carry their own costs and error rates. They are necessary but not sufficient: a system can be perfectly consistent and wrong. Their role is as the cheap, fast layer of a larger verification stack.

This framing is now established in the literature, and this page should be read as extending it rather than proposing it. [Fluri, Paleka & Tramèr (2024)](https://arxiv.org/abs/2306.09983) evaluate hard-to-verify models (chess, forecasting, legal judgment) via consistency checks, and [Paleka et al. (ICLR 2025)](https://arxiv.org/abs/2412.18544) build an automated consistency pipeline for LLM forecasters — ten check types scored by an arbitrage metric that is literally the guaranteed profit extractable from the model's inconsistencies — and find that consistency scores correlate with ground-truth Brier scores (a correlation among models not optimizing against the metric — see the oversight section). What follows incorporates their results and marks what remains open.

## Notation

- $M$ — the model or agent being evaluated
- $Q$ — an estimation question (e.g., "give a probability distribution for Mexico's 2030 nominal GDP in current US dollars, IMF October-2031 vintage" — precision is a prerequisite for consistency checking, not just resolution: ambiguity manufactures spurious disagreements)
- $Q'$ — a semantically equivalent rephrasing of $Q$
- $A_1, A_2, \ldots$ — answers to the same or related questions
- $M(Q, t)$ — the model's answer to $Q$ at time $t$

Consistency is a spectrum, not a binary. Two answers to equivalent questions will rarely be identical; the right move is to measure the gap (e.g., Jensen–Shannon divergence between two distributions — symmetric, as the relation is) and track it. The Dutch-book characterization is exact for logical and constraint checks, extends to temporal checks via dynamic books, reaches paraphrase and repeatability only through a trusted equivalence judge (itself part of the trusted base), and is a looser metaphor for method and evidential consistency.

## Seven types of consistency

1. **Self-consistency (repeatability).** Ask the same question $n$ times; measure variance across responses, or confidence-interval overlap for distributions. (Not to be confused with [self-consistency decoding](https://arxiv.org/abs/2203.11171), which aggregates sampled reasoning paths to *improve* answers; here, response variance is the defect being measured.) Trivially aced by temperature-0 decoding or a canonicalizing cache — gaming the wrapper, not the reasoner. ([Opinion fuzzing](https://quantifieduncertainty.org/posts/opinion-fuzzing-a-proposal-for-reducing-exploring-variance-in-llm-judgments-via-sampling/) inverts this check constructively: sample across prompts, models, and personas and treat the variance structure as signal.)
2. **Logical consistency.** Probability axioms: $P(\neg A) = 1 - P(A)$; $P(A \wedge B) \le \min(P(A), P(B))$; transitivity of comparisons; Dutch book tests constructed from the system's own assignments.
3. **Constraint consistency.** Known structural constraints: mutually exclusive and exhaustive events sum to 1; quantities respect physical bounds and conservation laws; established inequalities are maintained across related estimates.
4. **Temporal consistency.** Estimate sequences should be a martingale: today's estimate equals the expectation of tomorrow's, so drift should be *unpredictable*, not absent. Deadline-bounded questions should follow a coherent time-decay path, with deviations from the implied hazard curve flagged. Revision driven by computation rather than new evidence is legitimate (see logical induction, below).
5. **Method consistency.** Different approaches to the same question — a Monte Carlo simulation versus an analytical calculation, or several independent Fermi decompositions — should land in the same neighborhood. (Disagreement must first be attributed: a Monte Carlo–vs–analytic gap is often a bug in one method, not incoherence.)
6. **Contextual consistency (prompt robustness).** Paraphrase invariance, framing neutrality, immunity to irrelevant added details, formatting robustness.
7. **Evidential consistency (update coherence).** Conservation of expected evidence: the prior should equal the probability-weighted average of the possible posteriors. Where the likelihood ratio is stipulated in the prompt, updates should approximately follow Bayes' rule. A useful probe: have the agent state its prior, likelihood ratio, and posterior separately, and check that they cohere. (A bare directional check — "evidence for $A$ shouldn't lower $P(A)$" — is not a coherence theorem: explaining-away rationally reverses it.)

## What's covered and what's open

Mapping the seven types against published work:

- **Largely covered.** Logical consistency (Paleka et al.'s negation/and/or/conditional checks, with the arbitrage metric); evidential consistency in substantial part (their conservation-of-expected-evidence check; [Bayes-rule coherence tests](https://arxiv.org/abs/2507.17951)); paraphrase invariance (one of their ten checks; see also [ParaRel](https://aclanthology.org/2021.tacl-1.60/) and [semantic consistency](https://arxiv.org/abs/2308.09138) work).
- **Partially covered.** Temporal consistency (Fluri et al. ran temporal-monotonicity checks, and the conservation-of-expected-evidence check is a one-step martingale test; martingale drift as a standing regression test is not benchmarked); repeatability (LLM probability judgments show human-like systematic incoherence — [Zhu & Griffiths 2024](https://arxiv.org/abs/2401.16646) — but variance is not yet integrated into forecasting evals as a scored metric).
- **Open.** Constraint consistency beyond binary probabilities — full distributions, physical bounds, conservation laws, cross-estimate inequalities (published checks handle binary event probabilities only); method consistency (Monte Carlo vs. analytic vs. independent Fermi decompositions), which we have not seen scored anywhere — the nearest work, chain-of-thought vs. program-aided answer agreement, improves answers rather than scoring disagreement; adversarial question generation (explicitly deferred as future work by Paleka et al.); and progressive property testing, below.

## Generating test questions

Four escalating strategies:

- **Static test and holdout sets.** A few hundred to a few thousand questions, partly synthetic. Simple, comparable across models, and Goodhartable — must stay held out. (Reusable resources exist, e.g. a [206-conjecture dataset](https://forum.effectivealtruism.org/posts/KScqjN2ouSjTjWopp/an-in-progress-experiment-to-test-how-laplace-s-rule-of) built to test the calibration of Laplace's rule at multiple horizons.)
- **Randomized generation.** An LLM generates fresh questions of a selected type on demand, reducing memorization as a confound. Generated questions still need an automated specification-quality filter, since LLM-authored questions skew toward ambiguous entities and timeframes.
- **Adversarial questioning.** An LLM agent searches for question sets that the target model will be inconsistent on. Powerful, now cheap to run, harder to standardize into stable numeric scores.
- **Progressive property testing.** Borrowed from property-based testing in software ([QuickCheck](https://dl.acm.org/doi/10.1145/351240.351266)-style counterexample shrinking; cf. [metamorphic testing](https://dl.acm.org/doi/10.1145/3143561), which has the relations but not the minimization): when an inconsistency is found, systematically *minimize* it — search for the simplest question pair that still triggers the failure. Concretely: shrink operators (drop conjuncts, shorten horizons, substitute common entities), a token-count simplicity metric, and — since violations are stochastic — a pair "still triggers" only if the gap clears a threshold in $k$ of $n$ samples. The minimized pairs are both diagnostics and high-quality training data. NLP has nearby tools — minimal pairs and contrast sets, delta debugging on ML inputs — but we have not found counterexample shrinking applied to probabilistic estimators, which is why we consider this the proposal's clearest methodological contribution.

Questions should span domains (sciences, social sciences, humanities, applied fields) — consistency in one domain should not be assumed to transfer for free.

## Theoretical grounding

Two anchors:

- **Dutch books and arbitrage.** As above: inconsistency is exploitability. An ideal estimator achieves something like *information arbitrage immunity* — no profit available from reframing, decomposing, or routing the same question through different pathways.
- **[Logical induction](https://arxiv.org/abs/1609.03543).** Perfect consistency is computationally intractable; logical induction reframes it as an asymptotic process in which an internal market of traders progressively eliminates exploitable patterns — exact coherence is unattainable, and approximate coherence is the right target. The practical prioritization comes from the arbitrage metric itself, not the theory: fix the inconsistencies with the largest extractable profit first, rather than treating consistency as pass/fail.

## What LLMs change

- **Semantic equivalence checking at scale.** Paraphrase-invariance tests require judging whether $Q$ and $Q'$ really are equivalent; LLM judges make this cheap, though judge precision bounds eval precision.
- **Adversarial questioners are now practical.** The search for inconsistencies can itself be automated and trained.
- **Consistency as a training signal.** Minimized violation pairs are natural RL or fine-tuning targets. Nearby work trains on prompt-perturbation consistency ([Flip-Flop Consistency](https://arxiv.org/abs/2510.14242)) or on truth-value coherence with logical constraints via a semantic loss ([LoCo-LMs](https://arxiv.org/abs/2409.13724); [Calanzone et al. 2024](https://arxiv.org/abs/2404.12843)), and Paleka et al.'s ArbitrageForecaster enforces consistency at inference time rather than in training — what still looks open is coherence *training* for probabilistic forecasts and distributions over quantities. Caveat, taken seriously: training on consistency can teach evasion — a model that retreats to a fixed coherent ignorance prior is trivially consistent — so consistency objectives need to be paired with resolution-grounded accuracy and sharpness objectives, never used alone. And a suite used for training stops being an independent eval: training-side and oversight-side checks must draw from disjoint, non-stationary question distributions, the eval generator staying ahead of the training one.
- **Connection to latent knowledge.** Unsupervised consistency structure is also the foundation of work like [discovering latent knowledge](https://arxiv.org/abs/2212.03827) (CCS); consistency evals are the behavioral, black-box cousin of that line — caveats included: [Farquhar et al. 2023](https://arxiv.org/abs/2312.10029) showed CCS-style consistency objectives radically underdetermine knowledge. The behavioral analogue is *coherent deception*: a competent liar passes all seven checks — consistency screens for incompetence, not adversaries.

Two further notes from QURI's own work. The arbitrage framing applies well beyond AI: fixed per-cause budget allocations imply inconsistent relative values across time that a counterparty could Pareto-exploit — a Dutch book against a funder ([a flaw in worldview diversification](https://forum.effectivealtruism.org/posts/DAD4777WJqFe9jZZM/a-flaw-in-a-simple-version-of-worldview-diversification)); and cross-question consistency relationships can be made tradeable objects in their own right ([higher-order forecasts](https://forum.effectivealtruism.org/posts/PB57prp5kEMDgwJsm/higher-order-forecasts)). Deployed AI estimators already exhibit the failures these checks target: Squiggle AI's generated models showed systematic overconfidence ([case studies](/case-studies/llm-epistemics-in-production/)).

## Why this matters for oversight

Estimation agents are increasingly used as judges, reward models, resolvers, and reference agents inside larger systems — including the consumer agents in [Epistemic Impact Analysis](/proposals/epistemic-impact-analysis/) and the oversight schemes in [Overseeing Automated Research](/proposals/overseeing-automated-research/). For such components the realistic exploit is not a bookie but an optimizing policy that shops across framings and decompositions of its own outputs for the one an inconsistent judge scores most favorably — the same search a consistency attacker runs. The right demand is therefore graded, not a gate: measured exploitability small relative to the adversary's cost of extracting it. Strict arbitrage-immunity would disqualify everything — debate and control results extract useful oversight from demonstrably Dutch-bookable judges ([Khan et al. 2024](https://arxiv.org/abs/2402.06782)) — and passing the checks is trivially buyable anyway: projecting any forecaster, ignorant or deceptive, onto the coherent set (as ArbitrageForecaster does at inference time) improves its proper score — strictly, in every outcome state ([Predd et al. 2009](https://arxiv.org/abs/0710.3183)). And the consistency–Brier correlation was observed among models not optimizing against the metric; it should not be expected to survive optimization pressure. What the checks deliver is narrower but real: screening out *unforced* incoherence cheaply, continuously, and without ground truth — the natural regression-test suite for epistemic infrastructure.

## Open questions

- How much does consistency constrain correctness? Paleka et al. report meaningful correlation between arbitrage metrics and ground-truth Brier scores for binary forecasting questions — does this hold for full distributions and quantities, and across domains? (Under optimization pressure, we argue above, no.)
- What is the cost-per-bit of consistency signal versus resolution-based signal, and what is the optimal portfolio of the two?
- How should consistency scores aggregate into a single comparable benchmark number without hiding the structure that matters?
- Can adversarially trained "consistency attackers" and defensively trained estimators reach a stable, useful equilibrium — or does this collapse into vagueness?
