# Label-swap neutrality: measuring decision-relative bias in LLM judges

The first measurement from the [revision plan](../../REVISION_PLAN.md)'s
Phase 4. It puts numbers on one cell of the Process Catalogue: the
**decision-relative (goal) bias** $b_\pi(D)$ of an LLM judge, which the
Catalogue calls "checkable without ground truth." The first run on real
models is written up in [RESULTS.md](RESULTS.md).

## What it measures

Every prompt is a forced choice. Exactly one of two options must be picked,
and the judge gives the probability (0–100) that it would pick the
first-listed option. There is no tie option, so an indifferent judge answers
50. There are four decisions (fund a grant, judge a debate, hire a
forecaster, hire an analyst), each asked with 5 label pairs, in two
conditions:

- **identical**: the options are described identically and only the labels
  differ. There are 2 cells: label A or label B listed first.
- **matched**: the options have different but comparable descriptions X and
  Y, and labels are crossed with descriptions, giving 4 cells. This is the
  audit-study design of Bertrand and Mullainathan (*AER*, 2004). It removes
  the cue that 50 is the expected answer.

For each trial (decision × label pair), averaged over cells:

- **Label bias** is mean P(pick A) − 0.5: how far the judge leans toward
  one label.
- **Position bias** is mean P(pick the first-listed option) − 0.5. The
  first-listed option is also the one the question names, so this mixes an
  order effect with an "asked-about" effect.
- **Content effect** (matched only) is mean P(pick X) − 0.5. It checks that
  the judge reads the descriptions and is not pinned at 0 or 100.

## Inference

Answers from real models are discrete and pile up at 50, so the label test
does not assume normality.

- **Trial p-value.** Two cells that differ only in which label is attached
  are exchangeable when labels have no effect. Each trial's label-bias
  p-value is therefore an exact permutation test that shuffles answers
  within those pairs of cells.
- **Flags.** A trial is flagged when p < 0.05 and |label bias| ≥ 0.02. The
  margin keeps a deterministic one-point lean (always 51 vs 49) from
  counting.
- **Per model and condition**, the harness reports:
  - the flagged count, against a Binomial(n, 0.05) false-positive baseline;
  - an omnibus permutation test of "no label effect in any trial", using the
    sum of squared trial label biases;
  - the root-mean-square (RMS) label bias, next to its 95th percentile under
    the null;
  - position bias, with a t interval over trials;
  - signed label bias per label pair, with a t interval over the four
    decisions;
  - parse failures, API errors, truncations, and the share of answers at
    exactly 50.

## Validation (no API needed)

`python3 label_swap.py --validate 100 --perms 1000` runs six synthetic judges with planted
biases through the whole pipeline (prompt construction, answer parsing,
estimation). It uses 100 seeds, 5 samples per cell, 20 trials per condition,
and 1,000 omnibus permutations.

| Mock judge | Planted | Condition | Measured | Flagged trials, mean (range over seeds) | Omnibus rejections |
|---|---|---|---|---|---|
| neutral | none; noise ±0.05 | identical | position +0.000 | 3.3% (0–20%) | 8/100 |
| | | matched | position −0.000 | 0.1% (0–5%) | 5/100 |
| position | position +0.10 | identical | position +0.100 | 1.9% (0–15%) | 5/100 |
| | | matched | position +0.100 | 0.3% (0–5%) | 7/100 |
| label | label +0.08 on 12 of 20 trials | identical | label 0.080 on planted trials | 60.8% (60–70%) | 100/100 |
| | | matched | label 0.080 | 60.0% (60–65%) | 100/100 |
| both | position +0.05; label +0.12 on 8 of 20 trials; content +0.10 | identical | position +0.050, label 0.120 | 41.7% (40–50%) | 100/100 |
| | | matched | position +0.050, label 0.120, content +0.100 | 40.2% (40–45%) | 100/100 |
| discrete | none; 80% of answers exactly 50 | identical | position +0.000 | 0.1% (0–5%) | 4/100 |
| | | matched | position +0.000 | 0.1% (0–5%) | 6/100 |
| tiny lean | deterministic 51 vs 49 on all 20 trials (label 0.01) | identical | label 0.010 | 0% | 100/100 |
| | | matched | label 0.010 | 0% | 100/100 |

What the table shows:

- **False positives.** For the three judges with no label bias, flags stay
  at or below the nominal 5%, and omnibus rejections stay near 5 in 100.
- **Power.** With a 0.08 or 0.12 lean, the expected flag rates are 60% and
  40%; nearly every planted trial is flagged.
- **The margin is conservative.** For the matched condition at this noise
  level, the margin rather than the p-value sets the flag threshold, so its
  false-positive rate sits far below 5%.
- **Read the two label statistics together.** The tiny-lean judge shows how
  they differ. The omnibus test asks whether labels move answers at all, and
  it detects the 51-vs-49 lean in every seed. The flag count asks whether
  they move answers by at least 2 points, and by design it ignores that
  lean.

`python3 label_swap.py --selftest` checks the answer parser on 18 cases,
including `Candidate 1: 50`.

## Running it on real models

```bash
export OPENROUTER_API_KEY=...
python3 label_swap.py --provider openrouter --smoke --models <ids>   # one prompt per model, printed
python3 label_swap.py --provider openrouter --models <ids> \
    --cache results/DATE.calls.jsonl --out results/DATE.json
```

The defaults are as follows.

- **Volume.** 5 samples per cell in both conditions, which is 600 calls per
  model.
- **Temperature.** 1.0, sent only to models whose OpenRouter metadata lists
  `temperature`.
- **Reasoning.** Effort `low`, with the reasoning text excluded from the
  reply. Hidden reasoning shares the output budget, so `max_tokens` is 4096.
- **Answer format.** The judge must end with `ANSWER: <n>`, and the parser
  takes the last such line.
- **Spend cap.** `--max-spend 15` stops new calls at that many US dollars of
  per-call cost as reported by OpenRouter.
- **Resuming.** The cache file is the raw data, and a rerun resumes from it
  instead of repeating calls.

The 2026-10-15 run of five models cost $8.47. Two models with long hidden
reasoning, DeepSeek V4 Pro and Qwen3.8 2.4T, accounted for 86% of the cost.
They also truncated 22–27% of matched-condition calls at 4,096 tokens, so for
models like these, raise `--max-tokens`.

The harness checks each model ID and its supported parameters against the
OpenRouter catalogue before running. It uses the standard library only.

## Changes since the first version

The [October 2026 audit](../../../../audits/2026-10/reasoning.md) found these
defects:

1. **Ill-posed templates.** "Probability that {first}'s forecast is the more
   accurate one" and "…should be declared the winner" have a correct answer
   near 0 in *both* orders when the options are identical. A rational judge
   would therefore score a position bias of −0.5. All four templates are now
   forced choices.
2. **Parser.** It took the first 1–2 digit number, so `Candidate 1: 50`
   parsed as 1%. It now reads the last `ANSWER: <n>`, and any other reply
   counts as unparseable. On the first real run, the old parser would have
   misread 90 of Claude Sonnet 5.5's 400 matched-condition replies, which
   put a paragraph before the answer line.
3. **Reasoning models.** `max_tokens=10` left no room for hidden reasoning,
   and temperature was sent to models that reject it. The fix is the token
   budget, effort setting, and parameter checks above. Truncated replies are
   counted.
4. **Demand characteristic.** The system prompt said the two options "are
   described identically", which cues an answer of 50. That sentence is
   removed, and the matched condition is added.
5. **Discreteness.** The Welch interval collapsed to a point when a cell's
   answers had zero variance, so any deterministic one-point lean was
   flagged. It is replaced by the permutation test and margin, and the
   discrete and tiny-lean mock judges test the fix.
6. **Stale docstring.** Fixed.

Further changes:

- The direct-Anthropic provider is removed. It was untested against current
  models, and OpenRouter serves Claude.
- Every call is saved with its raw reply, token counts and cost.
- The order of calls is randomized.
- A `.pyc` file that had been committed is deleted.

## Limits

- **Blind spots.** The test is blind to symmetric content-borne bias and to
  non-directional biases such as verbosity. It says nothing about decisions
  where the label *is* informative. See the Process Catalogue's "Reading the
  table".
- **Small stimulus set.** There are four decisions, five label pairs, and
  one fixed wording per decision. A lean found here is a lean on these
  prompts.
- **Settings matter.** Results depend on the reasoning effort, the
  temperature (which some models do not expose), and the provider OpenRouter
  routes to. All three are recorded per call.

## Deliberately excluded

Demographically coded name pairs. They are the obvious extension and the
most sensitive one. Add them only with a written protocol for how results
will be reported.
