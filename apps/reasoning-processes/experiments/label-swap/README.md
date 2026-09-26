# Label-swap neutrality: measuring decision-relative bias in LLM judges

The first measurement from the [revision plan](../../REVISION_PLAN.md)'s
Phase 4. It puts numbers on one cell of the Process Catalogue: the
**decision-relative (goal) bias** $b_\pi(D)$ of an LLM judge, which the
Catalogue says is "checkable without ground truth."

## What it measures

Each prompt describes two options **identically**. A grant decision,
a debate, a forecast comparison, and a hiring decision are each asked with
5 label pairs, in both orders. The judge answers P(first option is better)
on a 0–100 scale. From the 2×2 design (label A first / label B first):

- **Position bias**: how much the judge favors whichever option is shown
  first.
- **Label bias**: how much it favors a particular label, averaged over
  positions. A neutral judge scores 0 on both.

A trial is **flagged** when its label-bias 95% interval (Welch t over the
raw samples) excludes zero. The mean of |label bias| is reported too, but
it is biased upward by noise, so the flagged count is the statistic to
read.

## Validation (no API needed)

`--provider mock` runs four synthetic judges with **planted** biases.
Across 15 seeds:

| Mock judge | Planted | Measured | Flagged rate |
|---|---|---|---|
| neutral | none | position +0.002 | 3–8% (false positives; nominal 5%) |
| position | position +0.10 | position +0.102 | — |
| label | +0.08 on 12 of 20 trials | 61–63% flagged | ≈ 60% expected |
| both | position +0.05, label +0.12 on 8 of 20 | position +0.052, 42–44% flagged | ≈ 40% expected |

An earlier percentile-bootstrap interval ran at 8–14% false positives at
these sample sizes and was replaced.

## Running it on real models

```bash
# 5-model run via OpenRouter: 40 prompts x 5 samples = 200 short calls per model
export OPENROUTER_API_KEY=...
python3 label_swap.py --provider openrouter --samples 5 --out results.json \
  --models anthropic/claude-sonnet-4.5 openai/gpt-5 google/gemini-2.5-pro \
           meta-llama/llama-4-maverick deepseek/deepseek-chat
```

Model IDs change; check the provider's list before running. Each call is
about 120 input tokens and 3 output tokens, so a 5-model run costs cents.
`--provider anthropic` with `ANTHROPIC_API_KEY` runs Claude models
directly. Standard library only; no dependencies.

## Reading the result

- **Position bias** is well documented for LLM judges. A nonzero value
  here replicates the literature and checks the harness.
- **Flagged label trials above ~5%** is the new measurement: a lean toward
  a label on a decision the judge has no information about. Report the
  worst pairs, since the book's claim is about *which* decisions a process
  leans on.
- **Limits.** The test is blind to symmetric content-borne bias and to
  non-directional biases like verbosity. It says nothing about biased
  answers on decisions where the judge *does* have information. See the
  Process Catalogue's "Reading the table" for the full list.

## Deliberately excluded

Demographically-coded name pairs. They are the obvious extension and the
most sensitive one; add them only with a written protocol for how results
will be reported.
