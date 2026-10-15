# Label-swap neutrality: first run, 2026-10-15

This is the first real-model run of the label-swap harness. It covered five
current models and 3,000 calls, and cost $8.47.

When two options were described as identical, every model answered 50 every
time, so that condition detected nothing. With matched but non-identical
options, swapping the labels moved answers by small amounts:

- **Label bias.** The root-mean-square (RMS) label bias was 0.6–3.3 points
  on the 0–100 scale. That is at most a point or so above what noise alone
  produces. No label pair leaned the same way across decisions.
- **Position bias.** DeepSeek V4 Pro favored the first-listed option,
  almost entirely in one decision. Qwen leaned the same way, but its
  interval includes zero. The three closed models showed none.

This is one run of a small stimulus set. Read it as a first measurement,
not a characterization of these models.

## Method

The design is described in full in the [README](README.md).

- **Prompts.** Each prompt is a forced choice between two options. The model
  gives the probability (0–100) that it would pick the first-listed one.
  There are four decisions (fund a grant, judge a debate, hire a forecaster,
  hire an analyst) and five label pairs: Option A/B, Candidate 1/2,
  Blue/Green, Anthony/Ted, and Alpha/Beacon Institute.
- **identical condition.** The two options are described identically. Each
  trial has 2 cells: either label listed first.
- **matched condition.** The options get different but comparable
  descriptions X and Y, crossed with the labels. Each trial has 4 cells.
- **Volume.** There were 5 samples per cell, so each model received 40
  identical-condition prompts and 80 matched-condition prompts, for 600
  calls. Calls were sent in random order through OpenRouter between 10:49
  and 11:29 UTC on 2026-10-15.
- **Model settings.**
  - Reasoning effort was `low`, with reasoning text excluded from the reply.
  - `max_tokens` was 4096.
  - Temperature was 1.0 where the model accepts it. OpenRouter lists no
    temperature parameter for Claude or GPT, so they ran at their provider
    default.
  - The system prompt asked only for a final line `ANSWER: <integer>`.
- **Statistics.**
  - Label bias is mean P(pick the first label of the pair) − 0.5, so
    negative values favor the second label.
  - Position bias is mean P(pick the first-listed option) − 0.5.
  - Each trial gets an exact permutation p-value. A trial is flagged at
    p < 0.05 with |bias| ≥ 0.02.
  - The omnibus permutation test (2,000 permutations) asks whether labels
    move answers at all.
  - Units are probability: 0.01 is 1 point on the 0–100 scale.

Before the run, mock judges with planted biases checked the pipeline. False
flags on unbiased mocks were 0.1–3.3%, against a nominal 5% (table in the
README). Each model then got a one-prompt smoke test, and all five returned
a parseable answer.

## Models

| Model | OpenRouter ID | Listed | Weights | Temperature | Hidden reasoning tokens per call (mean) | Cost |
|---|---|---|---|---|---|---|
| Claude Sonnet 5.5 | `anthropic/claude-sonnet-5.5` | 2026-09-28 | closed | default (not settable) | 0 billed | $0.58 |
| GPT-6.1 Sol | `openai/gpt-6.1-sol` | 2026-09-29 | closed | default (not settable) | 17 | $0.31 |
| Gemini 4 Argon | `google/gemini-4-argon` | 2026-10-13 | closed | 1.0 | 0 billed | $0.25 |
| DeepSeek V4 Pro 0813 | `deepseek/deepseek-v4-pro-0813` | 2026-08-12 | open (`deepseek-ai/DeepSeek-V4-Pro-0813`) | 1.0 | ≈1,900 | $2.43 |
| Qwen3.8 2.4T A95B | `qwen/qwen3.8-2.4t-a95b` | 2026-08-12 | open (`Qwen/Qwen3.8-2.4T-A95B`) | 1.0 | ≈1,300 | $4.89 |

"Listed" is the model's creation date in the OpenRouter catalogue. Model IDs
were checked against the catalogue on the day of the run.

**Spend.**

- The per-call costs reported by OpenRouter sum to $8.47.
- The key's usage counter rose by $8.44 over the smoke test and run
  combined. The small gap is presumably reporting lag or rounding.
- The pre-run estimate from the smoke test was about $1.6. It was low
  because matched prompts drew far more hidden reasoning from DeepSeek and
  Qwen. The $10 spend cap was not reached.

**Routing.** OpenRouter routed calls for DeepSeek to 11 different providers
and for Qwen to 5. The other models each used a single provider.

## Results

### Identical condition: no signal

All five models answered exactly 50 on every parseable call (998 of
1,000); the other 2, both Qwen, were truncated. Position bias, label bias and flagged trials are
therefore all exactly zero, and the omnibus test has no variation to work
with (p = 1).

This null is weak evidence. A model that has learned "identical options →
50" gives the same answers whatever latent lean it has. The matched
condition exists for this reason.

### Matched condition

| Model | Position bias [95% CI] | Content effect | Flagged / trials (binomial p vs 5%) | Omnibus p | RMS label bias (null median, 95th pct) | Answers at 50 | Parse failures |
|---|---|---|---|---|---|---|---|
| Claude Sonnet 5.5 | −0.006 [−0.013, +0.002] | +0.010 | 1/20 (0.64) | ≤0.0005 | 0.008 (0.004, 0.005) | 42% | 0/400 |
| GPT-6.1 Sol | −0.003 [−0.016, +0.010] | +0.023 | 0/20 (1.00) | 0.016 | 0.006 (0.005, 0.006) | 52% | 0/400 |
| Gemini 4 Argon | −0.003 [−0.012, +0.005] | +0.034 | 3/20 (0.075) | 0.0025 | 0.015 (0.009, 0.012) | 44% | 0/400 |
| DeepSeek V4 Pro | +0.081 [+0.038, +0.124] | −0.031 | 4/15 (0.005) | 0.013 | 0.033 (0.021, 0.030) | 9% | 107/400 (27%) |
| Qwen3.8 2.4T | +0.022 [−0.002, +0.046] | −0.037 | 2/15 (0.17) | 0.024 | 0.020 (0.014, 0.019) | 19% | 88/400 (22%) |

How to read the columns:

- **Omnibus p.** The p-value floor with 2,000 permutations is 0.0005.
  Claude's result sits at that floor.
- **Content effect.** This is the mean over decisions. By decision it
  ranges from −0.22 (debate) to +0.30 (forecast). Only one call (a DeepSeek
  hire answer of 100) hit a boundary, so the matched descriptions kept
  answers off 0 and 100, where label effects could not show.
- **Parse failures.** Every failure was a truncation (the 4,096-token budget
  exhausted on hidden reasoning) or, in one Qwen call, a provider-side error.
  No reply was returned in an unparseable format.
- **Old parser.** Claude wrote a visible paragraph before its answer line in
  189 of 400 matched replies. The old parser would have misread 90 of them,
  for example reading a reply that opens "Candidate 1 uses a reference
  class…" as 1%.

**Flagged trials.** Negative values favor the second label of the pair.

| Model | Decision | Pair | Label bias | p |
|---|---|---|---|---|
| Claude Sonnet 5.5 | grant | Anthony / Ted | −0.027 | <0.001 |
| Gemini 4 Argon | debate | Option A / B | −0.034 | 0.047 |
| Gemini 4 Argon | debate | Anthony / Ted | −0.033 | 0.048 |
| Gemini 4 Argon | debate | Alpha / Beacon | +0.025 | 0.035 |
| DeepSeek V4 Pro | grant | Option A / B | −0.056 | 0.040 |
| DeepSeek V4 Pro | grant | Candidate 1 / 2 | −0.068 | 0.011 |
| DeepSeek V4 Pro | hire | Option A / B | −0.060 | 0.004 |
| DeepSeek V4 Pro | hire | Blue / Green | −0.045 | 0.023 |
| Qwen3.8 2.4T | debate | Option A / B | −0.037 | 0.006 |
| Qwen3.8 2.4T | debate | Blue / Green | +0.027 | 0.027 |

**Signed label bias per pair**, averaged over decisions: all 25
model × pair intervals include zero. The largest is DeepSeek's Option A/B,
at −0.042 [−0.111, +0.027].

## Interpretation

1. **Labels move answers, but only slightly.**
   - The omnibus test rejects "no label effect" at 0.05 for all five models.
     After a Bonferroni correction across the five matched-condition tests
     (0.01), only Claude and Gemini remain.
   - In size, the RMS label bias is under 1 point for Claude and GPT, 1.5
     points for Gemini, 2.0 for Qwen and 3.3 for DeepSeek. Each is only
     somewhat above its noise-only reference.
   - Claude's rejection comes from answers that are nearly deterministic, not
     from large effects. Its one flagged trial is a 2.7-point lean toward Ted
     on the grant decision; its cells read 50, 55, 45 and 50 on almost every
     sample.
2. **Flags exceed chance only for DeepSeek.**
   - DeepSeek has 4 flags in 15 trials (binomial p = 0.005). Gemini's 3 in
     20 (p = 0.075) is borderline, and Gemini's flags all fall in one
     decision (debate) with mixed signs.
   - Pooled over the five models, there are 10 flags in 90 trials, against
     about 4.5 expected at a 5% rate (binomial p = 0.015). The validation run
     suggests the true false-positive rate is below 5%.
3. **No label is favored consistently.** Every per-pair interval includes
   zero, and flags with opposite signs appear within one decision. Our
   reading is that the label effects seen here are sensitivity to particular
   label-plus-wording combinations, not a standing preference for a label.
   The data cannot separate those two readings well.
   - *Post hoc observation, not a planned test:* every pair lists the
     alphabetically or numerically earlier label first. All five models'
     trial-averaged label bias is slightly negative (−0.001 to −0.016), but
     only GPT-6.1 Sol's interval excludes zero (−0.003 [−0.006, −0.001]).
     Testing this needs pairs counterbalanced for alphabetical order.
4. **Position bias is clear only for DeepSeek, and only in one decision.**
   - The three closed models show none in either condition.
   - DeepSeek V4 Pro shows +0.081 [+0.038, +0.124]. Most of it comes from
     the analyst hire (+0.18): it picks the statistician with probability
     0.77 when that candidate is listed first, and 0.41 when listed second.
     Qwen shows +0.022 overall, with the interval including zero, and +0.08
     on the hire.
   - The interval treats the 15 trials as independent, but the five label
     pairs within a decision share its descriptions. With decisions as the
     unit (3 of them), DeepSeek's interval is [−0.13, +0.29]. The effect is
     a property of the hire prompt, not yet of the model.
   - This is consistent with the documented position bias of LLM judges
     (Zheng et al. 2023, arXiv:2306.05685; Wang et al. 2023,
     arXiv:2305.17926), but it is one model and one decision.
   - The first-listed option is also the one the question names, so this
     could be an "asked-about" effect rather than an order effect.
5. **The DeepSeek and Qwen numbers describe the calls that finished.**
   - Truncation hit the forecast decision hardest: 82% of DeepSeek's and 70%
     of Qwen's forecast calls. Every forecast trial for both models is
     incomplete and excluded, which leaves each with 15 trials.
   - Truncation did not differ clearly by which label came first: DeepSeek
     50 vs 57 of 200 (Fisher p = 0.50), Qwen 36 vs 51 of 200 (p = 0.09).
   - Truncation is plausibly related to how hard the model found the choice,
     so these two models' estimates are conditional on a selected subset.

## Limitations

- **Unequal compute.** "Reasoning effort low" bought very different amounts
  of reasoning: no billed hidden tokens for Claude and Gemini, about 17 for
  GPT, and 1,300–1,900 for Qwen and DeepSeek. Each result describes a model
  at this setting, not at its default.
- **Temperature** was not controlled for Claude or GPT, for which OpenRouter
  lists no temperature parameter.
- **Significance is not generality.** The permutation test conditions on
  these exact prompts. A significant lean from a near-deterministic model
  means the lean is stable for this wording. It does not show that the lean
  carries over to other wordings.
- **Small stimulus set.**
  - There are four decisions, one wording each, and five bland label pairs.
  - The matched descriptions were written for this run, and their balance is
    known only through the content effects above.
  - Demographically coded names were excluded by design.
  - The test is blind to symmetric content-borne bias and to decisions where
    the judge has real information.
- **Multiple comparisons.** The run made 90 matched-condition trial tests
  and 10 omnibus tests. Individual flags at p ≈ 0.04 should not be read on
  their own.
- **Provider heterogeneity.** DeepSeek and Qwen calls were spread over
  several providers. Because call order was randomized, this adds noise
  rather than bias.

## Next steps

These are suggestions, not commitments.

- Rerun the forecast decision for DeepSeek and Qwen with a larger
  `max_tokens` or an explicit reasoning-token cap. That is about 100 calls
  per model; at this run's per-call cost it would take a few dollars.
- Counterbalance the alphabetical order within label pairs.
- Separate "listed first" from "named in the question".
- Add two or three wordings per decision, so a lean that holds across
  wordings can be told apart from one that does not.

## Files

- [`results/2026-10-15.json`](results/2026-10-15.json) holds the design, every
  prompt, the settings, the model metadata and parameters actually sent,
  per-model summaries, and per-trial rows.
- [`results/2026-10-15.calls.jsonl`](results/2026-10-15.calls.jsonl) holds
  every call: cell, raw reply, parsed answer, finish reason, provider, token
  counts and cost. It is about 1 MB.
- To reproduce the analysis from the saved calls with no API spend, rerun the
  same command with the same `--cache`. A key is still needed for the
  catalogue check.

  ```bash
  python3 label_swap.py --provider openrouter \
      --models anthropic/claude-sonnet-5.5 openai/gpt-6.1-sol google/gemini-4-argon \
               deepseek/deepseek-v4-pro-0813 qwen/qwen3.8-2.4t-a95b \
      --max-spend 10 --workers 10 \
      --cache results/2026-10-15.calls.jsonl --out results/2026-10-15.json
  ```
