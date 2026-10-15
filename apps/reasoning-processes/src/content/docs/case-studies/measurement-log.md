---
title: Measurement Log
description: A running record of the measurements these notes have run, with designs, null results and limits. First entry, label-swap neutrality of five LLM judges.
sidebar:
  order: 3
---

*A running record of the measurements these notes have actually made. Each entry gives the question, the [Process Catalogue](/concepts/process-catalogue/) cell it bears on, the design, the result including nulls, and what the result does not show. Entries are added in date order and changed only to correct errors. A rerun gets a new entry.*

:::note
Each entry links to its code, raw data and full write-up in the repository. This page summarizes them. The repository holds the record.
:::

## 2026-10-15 · Label-swap neutrality of five LLM judges

**Question.** Does an LLM judge lean toward one label in a forced choice where the label carries no information? This is the decision-relative bias $b_\pi(D)$ from the Catalogue's [reading notes](/concepts/process-catalogue/#reading-the-table). Of the built-in biases it lists, it is the one that can be checked without ground truth. The result bears on the built-in-bias column of the "Single LLM judge" row and on the [label-swap construction](/concepts/hardening-invariance/#constructions).

**Design.** The code, prompts, every raw reply and a full write-up are in [`experiments/label-swap`](https://github.com/quantified-uncertainty/cairn/tree/main/apps/reasoning-processes/experiments/label-swap).

- **Prompts.** There are four forced-choice decisions: fund a grant, judge a debate, hire a forecaster, hire an analyst. Each is asked with five label pairs: Option A/B, Candidate 1/2, Blue/Green, Anthony/Ted, Alpha/Beacon Institute. The judge states the probability (0–100) that it would pick the first-listed option. No tie is allowed.
- **Identical condition.** Both options are described identically, and each label is listed first once.
- **Matched condition.** Two different but comparable descriptions are crossed with the labels. This is the audit-study layout of [Bertrand & Mullainathan (2004)](https://doi.org/10.1257/0002828042002561). It removes the cue that 50 is the expected answer.
- **Volume and settings.** There were 5 samples per cell, or 600 calls per model, sent in random order through OpenRouter. Reasoning effort was `low`, `max_tokens` was 4096, and temperature was 1.0 where the model accepts it.
- **Statistics.**
  - Label bias is a trial's mean P(pick the first label of the pair) − 0.5. Each trial gets an exact permutation p-value, and a trial is flagged at p < 0.05 with a lean of at least 2 points.
  - An omnibus permutation test asks whether labels move answers at all.
  - Position bias is the mean P(pick the first-listed option) − 0.5.
- **Validation.** Mock judges with planted biases were run through the whole pipeline first. Unbiased mocks were flagged on 0.1–3.3% of trials against a nominal 5%. Planted leans of 8 and 12 points were flagged on nearly every planted trial.

The models were Claude Sonnet 5.5, GPT-6.1 Sol, Gemini 4 Argon, DeepSeek V4 Pro 0813 and Qwen3.8 2.4T A95B. The run made 3,000 calls and cost \$8.47.

**Identical condition: null.** Every parseable answer from every model was exactly 50. That covers 998 of 1,000 calls; the other two, both Qwen, were truncated. This is weak evidence of neutrality, because a model that has learned "identical options → 50" gives that answer whatever lean it has. This design is the obvious one, and on current models it measures nothing.

**Matched condition.** All figures are in points on the 0–100 scale.

| Model | Position bias [95% CI] | Flagged trials | Omnibus p | RMS label bias (null 95th pct) | Calls lost to truncation |
|---|---|---|---|---|---|
| Claude Sonnet 5.5 | −0.6 [−1.3, +0.2] | 1 / 20 | ≤ 0.0005 | 0.8 (0.5) | 0 / 400 |
| GPT-6.1 Sol | −0.3 [−1.6, +1.0] | 0 / 20 | 0.016 | 0.6 (0.6) | 0 / 400 |
| Gemini 4 Argon | −0.3 [−1.2, +0.5] | 3 / 20 | 0.0025 | 1.5 (1.2) | 0 / 400 |
| DeepSeek V4 Pro | +8.1 [+3.8, +12.4] | 4 / 15 | 0.013 | 3.3 (3.0) | 107 / 400 |
| Qwen3.8 2.4T | +2.2 [−0.2, +4.6] | 2 / 15 | 0.023 | 2.0 (1.9) | 87 / 400, plus 1 error |

What the run shows:

1. **Labels move answers, but only slightly.**
   - The omnibus test rejects "no label effect" at 0.05 for all five models. After a Bonferroni correction across the five tests, only Claude and Gemini remain.
   - The root-mean-square label bias is 0.6–3.3 points. Each model's value is at most about a point above its noise-only 95th percentile.
   - Claude's rejection reflects near-deterministic answers, not a large effect. Its one flagged trial is a 2.7-point lean toward "Ted" on the grant decision.
2. **Flags exceed chance only for DeepSeek.** It has 4 flags in 15 trials (binomial p = 0.005 against a 5% rate). Gemini has 3 in 20 (p = 0.075), all in the debate decision, and their signs differ.
3. **No label is favored consistently.** Averaged over decisions, all 25 model × label-pair intervals include zero. Our reading is that these leans are sensitivity to particular label-and-wording combinations, not a standing preference for a label. The data cannot separate the two readings well.
4. **Position bias is clear for one model, in one decision.**
   - DeepSeek V4 Pro's +8.1 comes mostly from the analyst hire. It picks the statistician with probability 0.77 when that candidate is listed first, and 0.41 when listed second.
   - The five label pairs in a decision share its descriptions, so trials are not independent. Taking decisions as the unit, the interval is [−13, +29] points. Until it is replicated on other wordings, the effect belongs to that prompt, not to the model.
   - The direction matches the documented position bias of LLM judges ([Zheng et al. 2023](https://arxiv.org/abs/2306.05685); [Wang et al. 2023](https://arxiv.org/abs/2305.17926)).
   - The first-listed option is also the one the question names, so this may be an "asked-about" effect rather than an order effect.
5. **The DeepSeek and Qwen numbers come from a selected subset.**
   - Hidden reasoning used up the token budget on 22–27% of their matched calls. On the forecast decision the rate was 70–82%, so every forecast trial for these two models is incomplete and excluded.
   - Truncation did not differ clearly by which label came first.
   - It is plausibly related to how hard the model found the choice.

**What changes.** The run supports the claim that $b_\pi(D)$ can be checked without ground truth, provided the options are not described identically. For these five judges on these prompts, label leans are a few points at most and point in no consistent direction. That does not show any model is neutral in general. The run says nothing about demographically coded names, which were excluded by design, or about symmetric content-borne bias, or about decisions where the judge has real information.

**Limits.**

- **Unequal compute.** "Low" reasoning effort bought very different amounts of reasoning. Claude and Gemini were billed no hidden tokens, GPT about 17 per call, and Qwen and DeepSeek 1,300–1,900.
- **Temperature.** It was not controllable for Claude or GPT.
- **Small stimulus set.** There are four decisions, with one wording each.
- **Multiple comparisons.** The run made 90 trial tests and 10 omnibus tests, so a single flag at p ≈ 0.04 means little on its own.
- **Scope of the tests.** The permutation tests condition on these exact prompts. A stable lean on one wording need not carry over to another.

**Next.**

- Rerun the forecast decision for DeepSeek and Qwen with a larger token budget.
- Counterbalance alphabetical order within the label pairs. As a post-hoc observation, all five models' trial-averaged label bias is slightly toward the later label, but only GPT-6.1 Sol's interval excludes zero.
- Separate "listed first" from "named in the question".
- Use two or three wordings per decision.

## Queued

These have not been run. Each would replace a qualitative claim elsewhere in these notes.

- **RoastMyPost flag precision.** Hand-label a random sample of flags, for [LLM Epistemics in Production](/case-studies/llm-epistemics-in-production/).
- **Squiggle AI calibration.** Score the stated intervals of generated models against resolved quantities.
- **Correlated error across models.** Estimate error correlation for the five label-swap models on resolved forecasting questions, as proposed in [Building Strong Reasoners](/proposals/building-strong-reasoners/).
