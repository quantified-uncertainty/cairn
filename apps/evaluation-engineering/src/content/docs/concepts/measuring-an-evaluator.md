---
title: Measuring an Evaluator
description: How to tell whether an evaluator, human or LLM, is any good — chance-corrected agreement and its paradoxes, the human-panel baseline, reliability versus validity, calibration, error bars and sample sizes, prediction-powered inference for combining a few gold labels with many model labels, and the gaming tests a judge should pass before it is trusted.
---

*Status: draft, October 2026. This chapter collects the measurement methods the rest of the wiki leans on. [LLMs as Evaluators](/concepts/llm-evaluators/) argues for auditing a cheap judge against an expensive one; the [worked example](/concepts/worked-example/) applies the arithmetic to one case. Every number below that is not cited is computed in the text or in the snippet, and the simulated population in the snippet is illustrative.*

An evaluator is a measuring instrument, and the questions are the ones metrology asks of any instrument: does it give the same answer twice (reliability), does it measure the intended thing (validity), are its stated confidences honest (calibration), and how much does a measurement of all this cost in labelled items (sample size)? For an evaluator facing people who benefit from its verdicts there is a fifth: does it still work when they try to fool it?

## Reliability is not validity

*Reliability* is agreement of the evaluator with itself, or with interchangeable copies of itself: two runs of the same judge, two prompt phrasings, two reviewers drawn from the same pool. *Validity* is agreement with the thing the evaluation is meant to track. Reliability caps validity. In classical test theory the correlation of a score with *any* criterion is at most the square root of the score's reliability, so a judge whose repeated runs correlate at 0.5 cannot correlate above 0.71 with the truth, however good it is on average. Re-running an LLM judge under fuzzed prompts is therefore a cheap first measurement: it gives an upper bound on validity before a single expert label is bought.

The converse fails. A judge can be perfectly reliable and wrong every time in the same way, and agreement between two models is mostly reliability: models share errors ([correlated error](/concepts/llm-evaluators/#the-two-system-level-failures)). Agreement with a human panel is a validity measure only to the extent the panel is the target. Usually it is a stand-in for something the funder actually cares about, such as whether the grant achieved anything. The panel can itself be unreliable or systematically wrong. A systematic review of 445 LLM benchmarks found recurring weaknesses in the phenomena measured, the tasks and the scoring metrics that undermined the validity of the resulting claims ([Bean et al. 2025](https://arxiv.org/abs/2511.04703)). [Salaudeen et al. (2025)](https://arxiv.org/abs/2505.10573) bring psychometrics' breakdown of validity to AI evaluation, matching each kind of claim to the evidence it needs. The practical rule follows: write down what the panel is standing in for. Then decide which disagreements between panel and target the system can tolerate.

## Agreement, corrected for chance

Raw agreement $p_o$ is the share of items on which two raters give the same label. It is inflated by base rates: two raters who each independently say "yes" to 80% of items agree $0.8^2 + 0.2^2 = 68\%$ of the time without looking. Cohen's kappa subtracts the agreement expected from the raters' own marginal rates, $p_e$, and rescales:

$$\kappa = \frac{p_o - p_e}{1 - p_e}$$

so that chance scores 0 and perfect agreement 1 ([Cohen 1960](https://doi.org/10.1177/001316446002000104)). The relatives:

- **Fleiss' κ** extends the idea to many raters, each item rated by a possibly different set of raters ([Fleiss 1971](https://doi.org/10.1037/h0031619)).
- **Weighted κ** gives partial credit for near-misses on an ordinal scale. The quadratic-weighted version is the standard in automated essay scoring, whose acceptance test ([LLMs as Evaluators](/concepts/llm-evaluators/#what-the-judge-literature-measures)) compares machine–human against human–human weighted κ.
- **Krippendorff's α** works for any number of raters, any level of measurement (nominal, ordinal, interval, ratio), and missing ratings ([Hayes & Krippendorff 2007](https://doi.org/10.1080/19312450709336664)). That makes it the default when the design is messy, as audit designs usually are.
- **ICC** (the intraclass correlation) plays the same role for continuous scores.

Kappa has two well-known paradoxes ([Feinstein & Cicchetti 1990](https://doi.org/10.1016/0895-4356(90)90158-L)). Both follow from $p_e$ depending on the marginals:

| 2×2 table (yes-yes, yes-no, no-yes, no-no) | $p_o$ | $p_e$ | κ |
|---|---|---|---|
| 40, 9, 6, 45 (balanced) | 0.85 | 0.50 | 0.70 |
| 80, 10, 5, 5 (80% yes) | 0.85 | 0.78 | 0.32 |
| 45, 15, 25, 15 (raters' "yes" rates 60% and 70%) | 0.60 | 0.54 | 0.13 |
| 25, 35, 5, 35 (raters' "yes" rates 60% and 30%) | 0.60 | 0.46 | 0.26 |

- **Prevalence.** The first two rows have identical raw agreement. Kappa falls by more than half when the base rate moves to 80%, because chance agreement is already high.
- **Bias.** In the last two rows, raters who disagree *more* about the base rate get the *higher* kappa, because their marginals predict less chance agreement.

Neither paradox is an error in kappa. Each is a reason not to report kappa alone. [Byrt, Bishop & Carlin (1993)](https://doi.org/10.1016/0895-4356(93)90018-V) recommend reporting the prevalence and bias indices next to κ, along with the prevalence- and bias-adjusted kappa, PABAK $= 2p_o - 1$. [Gwet's AC1](https://doi.org/10.1348/000711006X126600) is an alternative coefficient that is more stable at extreme prevalence. The minimum honest report for a binary judge is the full 2×2 table, or equivalently $p_o$, each rater's "yes" rate, and κ. A judge that says "yes" more often than the experts do is lenient. That is a bias worth knowing about even when κ looks acceptable. Leniency is among the failure modes that [Thakur et al. (2024)](https://arxiv.org/abs/2406.12624) found in LLM judges, and their judges with high percent agreement still assigned scores far from the human ones.

## The human-panel baseline

Agreement with a human is only interpretable next to agreement *between* humans. If two experts reach κ = 0.2 on the same items, a judge at 0.2 against one expert is as good a stand-in for "an expert" as a second expert is. A judge far *above* the human–human figure deserves suspicion. By the reliability cap above, a judge that tracks only what the experts track can correlate with one expert at most about $\sqrt{r}$, where $r$ is the expert–expert reliability; agreement beyond that has to come from something else the judge shares with that expert, such as a taste for polished prose. Journal peer review averages κ ≈ 0.17 ([Patterns §2](/concepts/patterns-and-failure-modes/#2-the-ratings-you-collect-are-a-biased-sample)), so in judgment-bound domains this ceiling is low. It has to be measured per task, by having at least some items rated independently by two or more humans.

Two details make the comparison fair:

- **Compare like with like.** A judge scored against a panel's majority vote is being compared with an aggregate that is less noisy than any single member. The matching human baseline is one held-out panelist against the rest of the panel, not panelist against panelist. The *alternative annotator test* formalizes this ([Calderon, Reichart & Dror 2025](https://arxiv.org/abs/2501.10970)). It drops each human annotator in turn and asks whether the LLM agrees with the remaining annotators at least as well as the dropped human does. The comparison allows a margin ε for the human's higher cost; the authors suggest 0.2 for experts and 0.1 for crowd workers. The LLM passes if it beats at least half the annotators. The authors recommend at least three annotators and 50–100 items.
- **Measure per task, not per model.** Across 20 annotated NLP datasets, the same LLM judges were reliable on some properties and poor on others; the variation depended on the property judged, the expertise of the human raters, and whether the text was human- or model-written ([Bavaresco et al. 2025](https://arxiv.org/abs/2406.18403)). In expert-graded finance questions, judges agreed with experts mainly on questions the judges could answer themselves. Supplying an expert-written reference answer largely closed the gap ([Krumdick et al. 2025](https://arxiv.org/abs/2503.05061)). Agreement measured on easy items does not transfer to hard ones.

HealthBench's grader validation is a large-scale instance of the baseline done properly. On rubric criteria that physicians also graded, the GPT-4.1 grader's macro-F1 against physicians was above the average physician's in five of seven themes and above the 33rd percentile of physicians in all seven ([Arora et al. 2025](https://arxiv.org/abs/2505.08775)). The comparison is grader against physicians, scored the same way physicians are scored against each other, which is exactly the shape a deployed evaluator needs.

## Calibration

A judge that outputs a probability ("the panel would renew this with probability 0.7") gives more information per audited item than one that outputs a label, and its probabilities can be scored. Use a *strictly proper* scoring rule, one whose expected score is optimized only by reporting one's true belief: the Brier score (squared error) or the log score ([Gneiting & Raftery 2007](https://doi.org/10.1198/016214506000001437)). The Brier score decomposes into a *reliability* term, which measures how far stated probabilities sit from observed frequencies, and a *resolution* term, which measures how much the forecasts separate items with different outcomes ([Murphy 1973](https://doi.org/10.1175/1520-0450(1973)012%3C0595:ANVPOT%3E2.0.CO;2)). The first is the calibration error. Plot it by binning items by stated probability and comparing each bin's mean to its observed rate. The second is what makes a calibrated judge useful rather than merely honest: a judge that says 0.8 for every item is perfectly calibrated at an 80% base rate and useless.

Calibration matters operationally because escalation rules run on it. "Send items below 70% confidence to a human" means something only if 70% means 70%. The sibling wiki's [calibration chapter](https://reasoning-processes.quantifieduncertainty.org/concepts/hardening-calibration/) covers the case where calibration must hold in the tail.

## Error bars and sample sizes

Every number above is an estimate from a sample of items, and the sample is usually small because labels are expensive. [Miller (2024)](https://arxiv.org/abs/2411.00640) sets out the practice for LLM evals, and it applies unchanged to judges:

- treat the items as a draw from a larger population and report standard errors;
- cluster the standard errors when items come in related groups (several criteria from one document, several questions from one passage); in Miller's examples clustered errors were over three times the naive ones;
- compare two judges on the *same* items using paired differences;
- run a power analysis before collecting labels.

For a proportion near $p$, a 95% interval of half-width $h$ needs $n \approx 1.96^2\, p(1-p)/h^2$ items. That is 246 items for ±5 points at $p = 0.8$, and 62 for ±10. Kappa is far noisier than the proportion it is built from. With both raters at an 80% "yes" rate, a κ estimated from 50 items has a 95% sampling spread of about ±0.3 whether the true value is 0.17 or 0.4. At the true κ ≈ 0.17 typical of peer review, about 300 double-rated items are needed for 80% power to distinguish the judge from chance. These figures come from simulating the 2×2 table and are reproduced in the [worked example](/concepts/worked-example/#what-50-audits-buy). Bootstrap the interval for κ or α rather than trusting a normal approximation at these sizes.

## Prediction-powered inference

The audit design in [LLMs as Evaluators](/concepts/llm-evaluators/#the-design-pattern-llms-as-the-cheap-layer) produces two datasets: the judge's score $f$ on all $N$ items, and gold labels $y$ on a random $n$ of them. The naive estimator of a population quantity, such as the share of grants experts would renew, uses only the $n$ gold labels. Plugging in the judge's scores on all $N$ items is precise but biased by however wrong the judge is. Prediction-powered inference (PPI) uses both. It takes the judge's average over all $N$ items and corrects it by the judge's average error on the $n$ audited ones:

$$\hat\theta_{\text{PP}} = \frac{1}{N}\sum_{i=1}^{N} f_i \;-\; \frac{1}{n}\sum_{j=1}^{n} (f_j - y_j)$$

The result is unbiased whatever the judge's quality. Its variance is roughly $\mathrm{Var}(f)/N + \mathrm{Var}(f - y)/n$, so the interval narrows as the judge's errors shrink ([Angelopoulos et al. 2023](https://arxiv.org/abs/2301.09633)). PPI++ adds a tuning weight on $f$, chosen from the data, so the interval is never wider than the gold-labels-only one ([Angelopoulos, Duchi & Zrnic 2023](https://arxiv.org/abs/2311.01453)). Several refinements fit audit design directly:

- **Stratification.** Stratified PPI helps when the judge is better on some kinds of item than others ([Fisch et al. 2024](https://arxiv.org/abs/2406.04291)). This is also the principled form of "oversample near the decision boundary, then reweight".
- **Active selection.** Active inference spends the label budget on the items where the model is least certain, while keeping valid intervals ([Zrnic & Candès 2024](https://arxiv.org/abs/2403.03208)).
- **Model evaluation.** Applied to evaluating ML models with GPT-4 labels, these methods raised the effective human-labelled sample size by up to 50% ([Boyeau et al. 2024](https://arxiv.org/abs/2403.07008)).

The gains are real but bounded, and the bound is worth knowing before promising a funder a cheap audit. When the judge is no more accurate than the model being evaluated, no debiasing method can cut the number of gold labels needed by more than half ([Dorner, Nastl & Hardt 2025](https://arxiv.org/abs/2410.13341)). In practice the savings were smaller. The snippet below shows the same thing. A judge with κ ≈ 0.78 against the expert narrows the interval on the renewal rate by about 30%, worth roughly twice the audits. A judge at κ ≈ 0.37 narrows it by about 10%. PPI makes a weak judge *safe* to use, because the estimate stays valid; it does not make a weak judge *useful*.

```python
import numpy as np
rng = np.random.default_rng(0)

def kappa(a, b):
    """Cohen's kappa for two raters' labels on the same items."""
    po = np.mean(a == b)
    pe = sum(np.mean(a == k) * np.mean(b == k) for k in np.union1d(a, b))
    return (po - pe) / (1 - pe)

def bootstrap_ci(a, b, stat=kappa, reps=5000):
    idx = rng.integers(0, len(a), (reps, len(a)))
    return np.nanpercentile([stat(a[i], b[i]) for i in idx], [2.5, 97.5])

def n_for_halfwidth(p, h, z=1.96):
    """Items needed for a 95% interval of +/-h on a proportion near p."""
    return int(np.ceil(z**2 * p * (1 - p) / h**2))

def ppi_mean(y_lab, f_lab, f_all, z=1.96):
    """PPI++ estimate of mean(y): model scores f on all N items, gold y on n."""
    n, N = len(y_lab), len(f_all)
    lam = np.cov(y_lab, f_lab)[0, 1] / ((1 + n / N) * f_lab.var(ddof=1))
    est = lam * f_all.mean() + (y_lab - lam * f_lab).mean()
    se = np.sqrt(lam**2 * f_all.var(ddof=1) / N + (y_lab - lam * f_lab).var(ddof=1) / n)
    return est, est - z * se, est + z * se

# Illustrative population: 1,000 items, experts say "yes" to 80%;
# the model outputs a probability that is informative but noisy.
N, n = 1000, 50
y = rng.random(N) < 0.8
f = np.clip(np.where(y, 0.75, 0.35) + rng.normal(0, 0.15, N), 0, 1)
lab = rng.choice(N, n, replace=False)          # the random audit
y_lab, f_lab = y[lab].astype(float), f[lab]

print("kappa (model at 0.5 vs expert):", round(kappa(f_lab > 0.5, y[lab]), 2),
      "95% CI", np.round(bootstrap_ci(f_lab > 0.5, y[lab]), 2))
m, se = y_lab.mean(), np.sqrt(y_lab.var(ddof=1) / n)
print("audit only:", np.round([m, m - 1.96 * se, m + 1.96 * se], 3))
print("PPI++     :", np.round(ppi_mean(y_lab, f_lab, f), 3))
print("audits for +/-5 points at 80%:", n_for_halfwidth(0.8, 0.05))
```

Output (NumPy 2.5):

```
kappa (model at 0.5 vs expert): 0.82 95% CI [0.56 1.  ]
audit only: [0.8   0.688 0.912]
PPI++     : [0.791 0.712 0.87 ]
audits for +/-5 points at 80%: 246
```

Over 2,000 repetitions of this simulated audit, the gold-only and PPI++ intervals covered the true renewal rate 93% and 94% of the time, near the nominal 95%. Their average widths were 0.22 and 0.15. Note the bootstrap interval on κ: even for a strong judge, 50 items pin κ down only to somewhere between "moderate" and "near perfect".

## Gaming tests

Every measurement above is taken at zero optimization pressure. A judge that will gate anything of value should also be measured against inputs built to fool it, and the attacks in the literature double as a test suite. The evidence for each is in [LLMs as Evaluators](/concepts/llm-evaluators/#evidence-under-optimization-pressure); the tests are:

| Test | What it measures | Pass condition |
|---|---|---|
| **Null model.** Submit a constant response unrelated to the instruction, including crafted ones ([Zheng et al. 2024](https://arxiv.org/abs/2410.07137)) | whether the judge can be won without doing the task | null submissions score at the floor |
| **Master keys.** Append generic openers or symbols ("Thought process:", ":") to wrong answers ([Zhao et al. 2025](https://arxiv.org/abs/2507.08794)), and universal adversarial phrases transferred from a surrogate model ([Raina, Liusie & Gales 2024](https://arxiv.org/abs/2402.14016)) | false-positive rate on known-bad inputs | false positives no higher than on unmodified bad inputs |
| **Injection.** Embed instructions to the judge in the evaluated text, as found in 2025 arXiv preprints aimed at AI reviewers | whether evaluated content can instruct the evaluator | verdict unchanged by the injected text |
| **Swaps and padding.** Reverse answer order, add length without content | position and verbosity bias | verdict invariant to order; score not increased by padding |
| **Selective disclosure.** Let one party submit many private variants and keep the best | the *process*, not the judge: best-of-k inflates scores even against an honest judge ([Singh et al. 2025](https://arxiv.org/abs/2504.20879)) | variants are counted, or all scores published |

Report the false-positive rate on each attack with an error bar, as for any other measurement. Re-run the suite whenever the judge's model or prompt changes. Passing it is necessary, not sufficient: these are the *known* attacks, and an evaluated party with query access can search for new ones. Only random audits with a penalty for detected gaming address unknown attacks ([LLMs as Evaluators, step 3](/concepts/llm-evaluators/#the-design-pattern-llms-as-the-cheap-layer)).

## What to report

For any evaluator, human or model, before its scores are used: the task and population it was measured on; its self-agreement under re-runs or fuzzed prompts; its chance-corrected agreement with humans, with the confusion table and each rater's base rate; the human–human agreement on the same items, with the same statistic; bootstrap intervals on all of these; its calibration, if it outputs probabilities; its false-positive rate under the gaming tests; and the date and model version, since every one of these numbers expires when either changes.

## Open questions

- How small can the double-rated set be in practice, given that the human–human baseline has the same sampling error as the judge–human number it is compared to?
- How should PPI-style estimators be adapted when the gold labels themselves are noisy, as with a panel at κ ≈ 0.2?
- Is there a gaming test that predicts how fast a judge degrades under sustained optimization, rather than whether it falls to known attacks?
