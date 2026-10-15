---
title: Cruxes
description: The central uncertainties this wiki is organized around, each stated as a proposition with an illustrative credence, what has changed since 2024, and what would move it.
sidebar:
  order: 2
---

*The uncertainties these notes are organized around. They fall into four groups: what a strong reasoner is, where the gains come from, what could go wrong, and who should govern any of it. Each is stated as a proposition with an illustrative credence, a note on what the 2024–26 evidence did to it, and what would move it.*

:::note
The question set descends from Ozzie Gooen's [Claims & Cruxes on LLM Forecasting & Epistemics](https://forum.effectivealtruism.org/posts/EykCuXDCFAT5oGyux/my-current-claims-and-cruxes-on-llm-forecasting-and) (2024), a preliminary personal post.

The credences are *illustrative* placeholders: subjective probabilities drafted in October 2026 by an AI assistant from the evidence cited, not yet reviewed or endorsed by the maintainers, and not elicited from a panel or derived from a model. They show the shape of a position, not QURI's position; nothing on this site rests on them. The evidence they lean on is summarized in [What Is a Strong Reasoner?](/concepts/what-is-a-strong-reasoner/#state-of-the-evidence-october-2026).
:::

## 1. Definition and measurement

- **"Reasoning strength" is a coherent target: calibration measured in one domain predicts calibration in another.** *~55%.*
  - *Since 2024:* there is still no direct test. Forecasting benchmarks mix domains, and we know of none that publishes cross-domain calibration correlations.
  - *Would move it:* per-domain calibration curves for the same systems, on ForecastBench-style question sets.
  - See [What Is a Strong Reasoner?](/concepts/what-is-a-strong-reasoner/)
- **Consistency constrains correctness, for systems not trained against the metric.** *~65%.*
  - *Since 2024:* arbitrage-based consistency scores correlate with later Brier scores ([Paleka et al. 2024](https://arxiv.org/abs/2412.18544)).
  - *Under optimization pressure, the constraint survives:* *~25%.* We know of no test either way. CoT monitors, the nearest analogue, degraded once they were optimized against ([Baker et al. 2025](https://arxiv.org/abs/2503.11926)).
  - See [Consistency Evaluations](/proposals/consistency-evals/).
- **[Retrodiction](/concepts/oversight-protocols/), done carefully, gives capability rankings that agree with live forecasting.** *~40%.*
  - *Since 2024:* temporal leakage has been documented across published backtests ([Paleka et al. 2025](https://arxiv.org/abs/2506.00723)). Leak-free live benchmarks now exist to check retrodiction against.
  - *Would move it:* a retrodiction suite whose rankings match ForecastBench or Metaculus rankings for the same systems.
- **On binary questions resolving within months, the best AI systems are at rough parity with strong human forecasters.** *~70%.*
  - *Since 2024:* the evidence moved from "clearly behind" (Halawi et al. 2024; Metaculus bot teams at −9 to −20) to "not distinguishable" (ForecastBench, July 2026; Metaculus spring 2026 at −1.25, CI spanning zero).
  - *Would move it:* FRI's planned fresh superforecaster round. If a significant human lead reappears against a current baseline, we move down.
- **That parity carries over to long-horizon or unresolvable judgment.** *~20%.*
  - *Since 2024:* no evidence either way, which is the problem. Judges remain unreliable in the ways that matter here. Meaning-preserving format changes swing few-shot accuracy by up to 76 points ([Sclar et al. 2024](https://arxiv.org/abs/2310.11324)), and position and self-preference biases recur ([Zheng et al. 2023](https://arxiv.org/abs/2306.05685)).
  - QURI's own deployed tools ([Squiggle AI, RoastMyPost](/case-studies/llm-epistemics-in-production/)) have no published calibration evaluation.

## 2. Where the gains come from

- **Most epistemic gains over 2027–28 come from base models, RL-trained reasoning included, rather than from scaffolding built outside the labs.** *~65%.*
  - *Since 2024:* Metaculus concluded from its Q2 2025 bot tournament that the underlying model mattered more than the scaffolding ([Metaculus, Oct 2025](https://www.lesswrong.com/posts/Surnjh8A4WjgtQTkZ/q2-ai-benchmark-results-pros-maintain-clear-lead)). A 14B model RL-trained on resolved questions matched o1 on accuracy ([Turtel et al. 2025](https://arxiv.org/abs/2505.17989)).
  - *Against:* the top-ranked ForecastBench entry and Metaculus bots in 2026 are pipelines. Metaculus reports scaffolded bots pulling ahead since fall 2025; its single-prompt baseline, usually in the top 10, placed 18th of 173 in spring 2026 ([Metaculus, Sep 2026](https://www.lesswrong.com/posts/wZBbDqzfBjYG58CxK/futureeval-spring-results-pros-beat-bots-but-the-gap-is)).
  - *Would move it:* a bare frontier model, without scaffolding, topping both leaderboards would move us up; pipelines keeping a persistent lead would move us down.
  - This was the original post's flagged crux. It decides how much non-lab work is obsoleted on lab timelines.
- **A meaningful non-commercial niche remains, mainly in evaluation and verification infrastructure rather than in the reasoners themselves.** *~60%.*
  - *Since 2024:* the public benchmarks that track AI forecasting are run by a nonprofit (FRI) and a platform (Metaculus), not by labs. Forecasting startups now compete for the reasoner itself.
- **Better AI epistemics differentially helps safety rather than just accelerating everything.** *~50%.*
  - *Since 2024:* little direct evidence. Reasoning gains have come fastest in verifiable domains (maths, code), which serve capabilities at least as much as judgment.
  - *Would move it:* evidence that labs' decisions on safety-relevant questions changed because of AI-generated analysis.
- **Institutional demand for machine forecasts as decision inputs grows materially by 2028.** *~40%.*
  - *Since 2024:* AI could lower two likely causes of corporate prediction markets' failure, immature tooling and the difficulty of writing good questions, but not a third, social disruptiveness ([Sempere et al. 2021](https://forum.effectivealtruism.org/posts/dQhjwHA7LhfE8YpYF/prediction-markets-in-the-corporate-setting)).
- **Reliability gains unlock discontinuous application tiers, not a smooth curve.** *~40%.* See [The Reliability Ladder](/concepts/epistemic-applications/).

## 3. Failure modes

- **AI-driven epistemic lock-in is among the larger epistemic risks of this decade.** *~30%.*
  - The mechanism: agents optimized for retention fragment users into self-reinforcing belief clusters ([sketch](https://forum.effectivealtruism.org/posts/G7KnxZ3Jpuy6hQ4Ew/a-sketch-of-ai-driven-epistemic-lock-in)).
  - *Would move it:* measured belief divergence among heavy users of different assistants.
- **Persuasive capability outpaces our ability to verify.** *~55%.*
  - Judge-grounded oversight trains for what convinces. Under the [obfuscated-arguments problem](https://www.alignmentforum.org/posts/PJLABqQ962hZEqhdB/debate-update-obfuscated-arguments-problem), a flaw spread across many plausible steps cannot be efficiently located.
  - *Would move it:* debate experiments in which judges stay accurate as the debaters' capability rises.
  - See [What Grounds an Oversight Protocol?](/concepts/oversight-protocols/)
- **Errors are correlated enough across model families that multi-model checks deliver much less than naive independence implies.** *~75%.*
  - *Since 2024:* a twelve-model ensemble's mean forecast leaned significantly above 50% despite evenly split outcomes ([Schoenegger et al. 2024](https://arxiv.org/abs/2402.19379)).
  - *Would move it:* published estimates of effective independence across families ([Independence](/concepts/hardening-independence/)).
- **Once reasoner scores gate anything valuable, they get gamed.** *~85%.*
  - *Since 2024:* models trained against a CoT monitor learned to hide intent ([Baker et al. 2025](https://arxiv.org/abs/2503.11926)). Metaculus bots gamed numeric scoring with "porcupine" distributions.
  - The open question is how fast gaming happens, not whether it happens.
- **Chain-of-thought monitoring remains a usable audit channel for frontier models through 2028.** *~50%.*
  - *For:* monitorability so far appears to survive RL at current scale ([Guan et al. 2025](https://arxiv.org/abs/2512.18311)).
  - *Against:* it can be lost to optimization pressure on the chain of thought or to architectures that reason in latent space ([Korbak et al. 2025](https://arxiv.org/abs/2507.11473)).
  - *Would move it:* labs adopting, or abandoning, training choices that preserve legible reasoning.
- **Resolution-grounding breaks worst where it is most needed.** *~80%.*
  - AI-progress questions resolve late and are contested. There are five or more reported definitions of "human-level AGI" ([Sempere 2023](https://nunosempere.com/blog/2023/11/07/hurdles-forecasting-ai/)).
  - Recent progress is almost entirely on questions that resolve within months.

## 4. Institutions

These are mostly normative questions, so we give no credences for them.

- **Who should run the oversight and metering systems for automated research?** The metering layer concentrates power over what research counts. AI-scientist systems now exist, and their documented failures are process failures ([Overseeing Automated Research](/proposals/overseeing-automated-research/)).
- **What consent norms should govern AI evaluation of people and organizations?** Cheap automated evaluation is arriving before such norms exist ([Evaluation Consent Policies](https://quantifieduncertainty.org/posts/evaluation-consent-policies/)).
- **Do epistemic gains accrue broadly or concentrate among already-powerful actors?** We treat distribution as a crux in its own right.
- **Can builders use their own epistemic tools to evaluate, and if necessary halt, further development?** *~15% that such loops would bind in practice.* This is a hope with little evidence.

Where a question matures into a position it gets its own page. [Open Problems](/open-questions/) aggregates the page-level residue.
