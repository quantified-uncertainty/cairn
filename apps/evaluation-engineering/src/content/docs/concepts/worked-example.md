---
title: "Interlude: A Worked Example"
description: One evaluation problem — a funder reviewing 1,000 grants a year — carried through four system designs with explicit costs, what each design can and cannot learn, and the arithmetic behind a 50-item audit.
---

*Status: early draft, September 2026. The numbers here are **illustrative assumptions**, chosen to be round and plausible, not measured. They are stated so each can be swapped for a real figure. The point is the shape of the trade-off, and which design questions become quantitative once you write the numbers down. This page answers the most-repeated request in [external commentary](/reference/objections/#external-commentary): a concrete, even fictional, case showing what better evaluation buys.*

## The problem

A funder makes or renews about **1,000 grants a year** and wants each one evaluated after a year: did it deliver roughly what it promised, and should it be renewed? Today the funder does what most do. A few program officers read the reports they have time for, and most grants get renewed on momentum.

**Assumptions** (swap in real numbers):

| Quantity | Value | Basis |
|---|---|---|
| Expert evaluation of one grant | 4 hours at \$150/hour = **\$600** | a careful read of the report, outputs, and a call |
| LLM evaluation of one grant | **\$1** | several runs across prompts and models (opinion-fuzzed), not one call; well above a single call's cost |
| Agreement of two independent expert panels on the renew/don't decision | unknown; assume **~70%** | expert agreement is low in comparable settings: peer-review meta-analysis finds mean agreement ICC ≈ 0.34 ([Patterns §2](/concepts/patterns-and-failure-modes/#2-the-ratings-you-collect-are-a-biased-sample)) |

## Four designs

| Design | What runs | Annual cost | Items an expert sees | What you learn |
|---|---|---|---|---|
| **A. Artisanal, full** | experts evaluate all 1,000 | \$600,000 | 1,000 | the best available judgment on everything, at a price few funders pay |
| **A′. Artisanal, what actually happens** | experts evaluate the 100 they get to | \$60,000 | 100 | good judgment on 10%; nothing on the other 900; no estimate of what was missed |
| **B. LLM only** | the model scores all 1,000 | \$1,000 | 0 | a score on everything, and *no idea how good the scores are* |
| **C. Prediction–evaluation** | the model scores all 1,000; experts evaluate a hidden random 50 | \$31,000 | 50 | a score on everything **plus a measured error rate** for those scores |
| **D. C + escalation** | as C, plus experts review the ~100 items where the model's runs disagree most | \$91,000 | ~150 | as C, with expert judgment concentrated where the model is least sure |

The accuracy × quantity × cost [frontier](/concepts/the-systems-view/#the-design-space-accuracy--quantity--cost) shows up directly. Design **C** costs about half of **A′**, covers ten times as many grants, and — the part artisanal evaluation never delivers — *knows its own error rate*. Design **B** looks cheapest, but its cost is misleading: without the audit, nobody knows whether its scores are worth \$1 or worth nothing.

## What 50 audits buy

The audit in design C does one job: estimate how often the model's renew/don't call matches what the expert panel would have said. Because the 50 are drawn at random, the sample agreement rate is an unbiased estimate of agreement across all 1,000. Its precision follows from the binomial standard error, $\sqrt{a(1-a)/n}$:

| True agreement $a$ | Audits $n$ | 95% interval (±) |
|---|---|---|
| 80% | 50 | ±11 points |
| 80% | 100 | ±8 points |
| 80% | 200 | ±5.5 points |
| 60% | 50 | ±14 points |

So 50 audits distinguish "the model agrees with experts about as often as experts agree with each other" (around 70% under the assumption above) from "the model is near chance". They cannot distinguish 75% from 80%. That is enough to decide *whether to trust the layer at all*, and not enough to fine-tune it. The funder buys precision at \$600 per additional audit, and the table says how much each purchase buys.

The comparison that matters is not model vs. perfect but **model–panel agreement vs. panel–panel agreement**. If two expert panels would agree only 70% of the time, a model at 70% is as good a proxy for "the panel" as a second panel would be, at 1/600th of the cost. That bar is low because human evaluation is noisy, and the [LLM chapter](/concepts/llm-evaluators/#the-design-pattern-llms-as-the-cheap-layer) argues it is the right bar.

## Three refinements, and their prices

**Audit the decision boundary, then reweight.** The average agreement rate hides where errors fall. Errors among clear renewals and clear rejections cost little; errors near the funding threshold cost the most. Oversampling audits near the threshold spends the expert budget where it matters. It breaks the simple estimator, though: the sample is no longer uniform, so each audited item must be weighted by the inverse of its probability of being selected to keep the overall estimate unbiased. Stratify, but record the sampling probabilities.

**Assume applicants will learn the model.** Once grantees know a model reads their reports, they write for the model. This is [Goodhart](/concepts/patterns-and-failure-modes/#1-the-measure-reshapes-the-measured), and it arrives on the second cycle, not the first. The random audit is the defense: the evaluated parties cannot tell which reports an expert will read, and agreement tracked round over round is the drift alarm. A falling agreement rate means the model is being gamed or the population has shifted. Either way, stop trusting the layer until it is re-validated.

**Escalate on disagreement, not on score.** Design D sends experts the items where the model's own runs (across prompts and models) disagree most. Those are the items where the cheap layer is least reliable, so expert time buys the most there. Escalated items are chosen non-randomly, so they must not be pooled into the agreement estimate; only the random 50 measure the model's accuracy.

## What the example leaves out

- **Value.** The table prices evaluation but not what it is worth. That requires knowing how many renewal decisions would change, and by how much the changed decisions improve outcomes: a value-of-information estimate this wiki does not yet have a method for ([Cruxes](/start-here/key-questions/#on-bridging-cheap-and-expensive-judgment), question 9). The design C comparison survives this gap only because C costs *less* than what the funder already spends.
- **Trust.** Grantees and the funder's board have to accept model-scored renewals. An audited error rate helps, but [epistemic culture](/concepts/epistemic-culture/) decides whether a published "the model agreed with experts 78% of the time" reads as reassurance or as an admission.
- **Correlated error.** If the model and the expert panel share a blind spot (both favor polished reports, say), agreement overstates accuracy. The audit measures agreement with experts, not with the truth.

## Try it with real numbers

Each assumption above can be replaced with a measured figure from one funder's records: hours per evaluation, the fraction of grants actually reviewed, and, most usefully, the agreement rate between two officers who review the same grant independently. A funder willing to run design C for one cycle would produce the first real data point this page asks for.
