---
title: "Interlude: A Worked Example"
description: One evaluation problem — a funder reviewing 1,000 grants a year — carried through four system designs with explicit costs, what each design can and cannot learn, and why a 50-item audit needs chance-corrected agreement.
---

*Status: early draft, September 2026; agreement analysis corrected October 2026. **Every cost and rate assumed on this page is illustrative**, chosen to be round and plausible, not measured, and no ranking of designs rests on them. They are stated so each can be swapped for a real figure. The point is the shape of the trade-off, and which design questions become quantitative once you write the numbers down. This page answers the most-repeated request in [external commentary](/reference/objections/#external-commentary): a concrete, even fictional, case showing what better evaluation buys.*

## The problem

A funder makes or renews about **1,000 grants a year** and wants each one evaluated after a year: did it deliver roughly what it promised, and should it be renewed? Today the funder does what most do. A few program officers read the reports they have time for, and most grants get renewed on momentum.

**Assumptions** (all illustrative; swap in real numbers):

| Quantity | Value | Basis |
|---|---|---|
| Expert review of one grant | one reviewer, 4 hours at \$150/hour = **\$600** | a careful read of the report, outputs, and a call. A three-person panel would cost \$1,800 |
| LLM evaluation, marginal | **\$1** per grant | several runs across prompts and models (opinion-fuzzed), not one call |
| LLM evaluation, fixed | **\$10,000–30,000** a year | rubric design, a calibration set, engineering, re-validation after model updates. The sibling wiki's [study of QURI's deployments](https://reasoning-processes.quantifieduncertainty.org/case-studies/llm-epistemics-in-production/) calls prompt engineering "a recurring tax, not a setup cost" |
| Share of grants an expert would renew | **80%** | "renewed on momentum" suggests a high rate |
| Agreement between two experts reviewing the same grant | **unknown** | has to be measured. Journal peer review averages κ ≈ 0.17 ([Patterns §2](/concepts/patterns-and-failure-modes/#2-the-ratings-you-collect-are-a-biased-sample)); grant renewal may differ |

## Four designs

| Design | What runs | Annual cost | Grants an expert sees | What you learn |
|---|---|---|---|---|
| **A. Artisanal, full** | experts review all 1,000 | \$600,000 | 1,000 | the best available judgment on everything, at a price few funders pay |
| **A′. Artisanal, what actually happens** | experts review the 100 they get to | \$60,000 | 100 | expert judgment on 10%; nothing on the other 900; no estimate of what was missed |
| **B. LLM only** | the model scores all 1,000 | \$11,000–31,000 | 0 | a score on everything, and *no idea how good the scores are* |
| **C. Prediction–evaluation** | the model scores all 1,000; a hidden random 50 get two independent expert reviews each | \$71,000–91,000 in year one | 50 | a score on everything **plus a measured agreement rate**, against a measured expert–expert baseline |
| **D. C + escalation** | as C, plus one expert review of the ~100 grants where the model's runs disagree most | \$131,000–151,000 | ~150 | as C, with expert judgment concentrated where the model is least sure |

C's cost is the model (\$1,000), its fixed cost, 50 audit reviews (\$30,000), and 50 second reviews to measure how often two experts agree (\$30,000); without annual second reviews it falls to \$41,000–61,000. So C costs somewhat more than A′ in year one and about the same or less later, while covering ten times as many grants. That comparison turns on the fixed cost and the price of expert time, so it is not a finding. What does not depend on the numbers: only C and D measure their own error rate, and B's low price buys scores of unknown worth.

## What 50 audits buy

The audit estimates how often the model's renew/don't call matches the expert's. Because the 50 are drawn at random, the sample agreement rate is an unbiased estimate of agreement across all 1,000. Its 95% interval is about ±11 points at 80% agreement (binomial, $1.96\sqrt{a(1-a)/n}$), ±8 points with 100 audits, and ±5.5 with 200.

Raw agreement is the wrong scale, though. If the expert renews 80% of grants, a model that renews 80% at random agrees with the expert $0.8^2 + 0.2^2 = 68\%$ of the time. The comparison has to be chance-corrected. Cohen's $\kappa = (p_o - p_e)/(1 - p_e)$ rescales observed agreement $p_o$ so that chance agreement $p_e$ scores 0 and perfect agreement scores 1:

| | expert renews 50% | expert renews 80% |
|---|---|---|
| chance agreement $p_e$ | 50% | 68% |
| raw agreement at κ = 0.17 | 58.5% | 73% |
| raw agreement at κ = 0.4 | 70% | 81% |
| κ implied by 70% raw agreement | 0.40 | 0.06 |

An earlier version of this page assumed experts agree "about 70%" of the time. At an 80% renewal rate that is barely better than chance.

Precision is the second problem. In simulation (both raters renewing 80% of grants), a κ estimated from 50 audits has a 95% interval of about ±0.3. A model whose true κ against the expert is 0.17 gets a 95% interval that excludes zero in only about 13–25% of 50-audit samples, depending on the test; 80% power takes roughly 300–350 audits. At κ = 0.4, power is about 60–75% with 50 audits and above 90% with 100. Where expert agreement is as weak as in journal peer review, then, 50 audits cannot tell a model that matches the experts from one that is guessing.

The comparison that matters is model–expert κ against expert–expert κ: if two experts reach κ = 0.17 on the same grants, a model at 0.17 is as good a proxy for "an expert" as a second expert. Design C pays for second reviews to measure the expert–expert number; both carry the sampling error above.

Two ways to get more out of each audit:

- **Score probabilities, not matches.** Have the model output the probability that the expert renews, and score it with a proper scoring rule (Brier or log loss; [Adjacent Fields §1](/reference/adjacent-fields/#1-judgmental-forecasting--prediction-markets)). This uses the model's confidence instead of discarding it at a threshold.
- **Estimate the population, not just agreement.** Prediction-powered inference ([Angelopoulos et al. 2023](https://arxiv.org/abs/2301.09633)) combines the model's scores on all 1,000 grants with the 50 audits to give a confidence interval for the expert-judged renewal rate. The interval is valid whatever the model's quality, and narrower the better the model is.

## Three refinements, and their prices

**Audit the decision boundary, then reweight.** The average agreement rate hides where errors fall. Errors among clear renewals and clear rejections cost little; errors near the funding threshold cost the most. Oversampling audits near the threshold spends the expert budget where it matters. It breaks the simple estimator, though: the sample is no longer uniform, so each audited item must be weighted by the inverse of its probability of being selected (the Horvitz–Thompson estimator) to keep the overall estimate unbiased. Stratify, but record the sampling probabilities.

**Assume applicants will learn the model.** Once grantees know a model reads their reports, they write for the model. This is [Goodhart](/concepts/patterns-and-failure-modes/#1-the-measure-reshapes-the-measured), and it arrives on the second cycle, not the first; reviewing is already [being targeted](/concepts/llm-evaluators/#evidence-under-optimization-pressure). The random audit *detects* this: agreement tracked round over round is the drift alarm, and a falling rate means the model is being gamed or the population has shifted. Either way, stop trusting the layer until it is re-validated. Given the precision above, a 50-item audit will only catch a large drop. Detection alone doesn't *deter*, though. That takes a consequence when an audit exposes a report written for the model (for example, the grant is re-reviewed in full and the gaming noted in the grantee's file), and it helps not to publish the model or prompt.

**Escalate on disagreement, not on score.** Design D sends experts the items where the model's own runs (across prompts and models) disagree most. Those are the items where the cheap layer is least reliable, so expert time buys the most there. Escalated items are chosen non-randomly, so they must not be pooled into the agreement estimate; only the random 50 measure the model's accuracy.

## What the example leaves out

- **Value.** The table prices evaluation but not what it is worth. That requires knowing how many renewal decisions would change, and how much the changed decisions improve outcomes: a value-of-information estimate ([Cruxes](/start-here/key-questions/#on-bridging-cheap-and-expensive-judgment), question 9). The sibling wiki's [Core Model](https://reasoning-processes.quantifieduncertainty.org/concepts/core-model/) sketches how to price information; this page does not apply it, so nothing here says whether any design is worth its cost.
- **Trust.** Grantees and the funder's board have to accept model-scored renewals. An audited error rate helps, but [epistemic culture](/concepts/epistemic-culture/) decides whether a published "the model agreed with experts as often as experts agree with each other (κ ≈ 0.2)" reads as reassurance or as an admission.
- **Correlated error.** If the model and the expert share a blind spot (both favor polished reports, say), agreement overstates accuracy. The audit measures agreement with experts, not with the truth.

## Try it with real numbers

Each assumption above can be replaced with a measured figure from one funder's records: hours per review, the fraction of grants actually reviewed, the renewal rate, and, most usefully, the chance-corrected agreement between two officers who review the same grant independently. A funder willing to run design C for one cycle would produce the first real data point this page asks for. If the officers' agreement turns out low, the audit has to be several times larger than 50.
