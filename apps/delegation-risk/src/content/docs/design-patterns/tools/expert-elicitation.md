---
title: "Expert Elicitation"
description: "How to elicit probability and damage distributions from experts, fit and aggregate them, and document an elicited number"
sidebar:
  order: 2
---

Most probabilities in a harm table have no historical data behind them. The system is new, the harm is rare, or the attacker adapts. Structured elicitation turns expert judgement into distributions that can be checked later.

## Ask a precise question

Bad: "What's the probability this AI will fail?"

Better: "Of the next 1,000 customer queries this agent answers, how many will contain a factual error that the customer then acts on?"

A usable question names four things:

- the outcome, meaning what counts;
- the unit, whether per action, per task or per month;
- the horizon;
- how the answer would be observed.

Without a unit, a probability cannot enter a [harm table](/design-patterns/tools/quick-start/#2-build-the-harm-table).

## Elicit quantiles, not a most likely value

Ask for the plausible range first, then the median, as 5th/50th/95th or 10th/50th/90th percentiles. Ask for the median, not the "most likely" value. For skewed quantities the two differ a lot. A lognormal's median is its mode times $e^{\sigma^2}$, so with $\sigma = 1$ a most likely damage of \$500 means a median of about \$1,360. Treating the mode as the median understates every quantile.

## Biases and what helps

- **Overconfidence.** Elicited intervals are usually too narrow: the truth falls inside a stated 80% or 90% interval much less often than that. How much less depends on how the interval is asked for ([Soll & Klayman 2004](https://doi.org/10.1037/0278-7393.30.2.299)). Ask what would put the value outside each bound, and ask for each bound as a separate question. Calibration practice helps (Tetlock & Gardner, *Superforecasting*, 2015).
- **Anchoring.** Collect estimates before showing any numbers. If reference values are needed, give several from different sources.
- **Availability and groupthink.** Ask about base rates, not the latest incident, and collect independent estimates before any discussion.
- **Interest.** Include experts who did not build the system.

## Protocols

**Percentile elicitation** is the core. Each expert gives quantiles for each quantity, privately and in writing.

**Reference classes.** Find a base rate in similar cases, then adjust for the differences and write each adjustment down. Adjustments are better made as odds ratios than as added percentage points.

**Delphi and IDEA.** In Delphi, experts estimate anonymously, see the group's results and reasons, and revise over several rounds. The IDEA protocol runs four steps ([Hemming et al. 2018](https://doi.org/10.1111/2041-210X.12857)):

1. Investigate: experts research the question and give private first estimates;
2. Discuss: they review the group's estimates and reasoning together;
3. Estimate: each gives a second private estimate;
4. Aggregate: the second-round estimates are combined mathematically.

**Cooke's Classical Model** scores each expert on seed questions whose answers the analyst knows but the experts do not. It then weights the experts by calibration and informativeness (Cooke, *Experts in Uncertainty: Opinion and Subjective Probability in Science*, Oxford University Press, 1991).

## Converting answers to distributions

**Damage, from two quantiles.** Fit a lognormal with median $\sqrt{q_{lo} q_{hi}}$ and $\sigma = \ln(q_{hi}/q_{lo}) / (2z)$. Here $z$ is 1.645 for a 5th–95th pair and 1.282 for a 10th–90th pair. With a 10th percentile of \$100 and a 90th of \$10,000, $\sigma = \ln 100 / 2.563 = 1.80$ and the median is \$1,000. In Squiggle this is `lognormal({p10: 100, p90: 10000})`.

**Check the third answer against the fit.** Suppose an expert gives quartiles of \$500 and \$5,000 and a 95th percentile of \$50,000. The quartiles imply $\sigma = \ln 10 / (2 \times 0.674) = 1.71$ and a median of \$1,581. That lognormal's 95th percentile is about \$26,000, not \$50,000, so the expert's tail is heavier than the fit. Show them the fitted percentiles and ask which answer to revise. For damage, the upper tail usually matters most. Fitting the median and the 95th percentile instead gives $\sigma = 2.10$.

**Probabilities.** Use a beta or a logit-normal. An expert says "70 to 90%, about 80%." Read "70 to 90%" as a 90% interval. That gives a standard deviation of about $0.2/3.29 = 0.061$, a variance of 0.0037, and by matching moments $\alpha + \beta = 0.8 \times 0.2 / 0.0037 - 1 \approx 42$. The result is beta(33.8, 8.5). Its 5th and 95th percentiles are 0.69 and 0.89, so the fit reproduces the statement. Take the variance from what the expert said: a variance of 0.02 would give beta(5.6, 1.4), whose 90% interval runs from 0.52 to 0.98.

For small rates, the [calculator](/design-patterns/tools/delegation-risk-calculator/) takes a 90% interval directly and fits a logit-normal.

## Aggregating several experts

- **Probabilities.** Average them in log-odds, which is the geometric mean of the odds. Do not average the probabilities themselves. For three experts at 1%, 3% and 10%, the arithmetic mean is 4.7% and the log-odds mean is 3.2%. [Satopää et al. (2014)](https://doi.org/10.1016/j.ijforecast.2013.09.009) found that this log-odds average, pushed further from 50% by a factor fitted to past outcomes ("extremizing"), outperformed several widely used aggregators on more than 1,300 forecasters' predictions of 69 geopolitical events. Extremizing needs a track record to fit. Without one, use the plain log-odds mean.
- **Quantities such as damage.** A linear opinion pool, the equal- or performance-weighted mixture of the experts' distributions, keeps their disagreement as spread. Averaging their medians throws it away. [SHELF](https://shelf.sites.sheffield.ac.uk/) and its R package implement fitting and pooling.

## After elicitation

- **Coherence.** P(A or B) ≥ max(P(A), P(B)), and exhaustive alternatives sum to 1.
- **Sensitivity.** If the decision is the same across the whole interval, precision does not matter. If it flips, that is where better data is worth buying.
- **Calibration.** Score elicited probabilities against outcomes (Brier score, interval hit rates), and [reconcile](/delegation-risk/runtime-accounting/#3-the-exposure-ledger) the harm table against incidents and near misses.

## Elicitation notes for numbers on this site

A quantity on this site that comes from neither a source nor a stated derivation is labelled *illustrative*, and no conclusion is drawn from it. A number the argument depends on instead carries a range or distribution plus a note like this:

```text
Quantity:     P(<harm mode>) per <unit>, as of <date>
Distribution: <family>, 90% interval [<low>, <high>]
Source:       <data or paper>, or "elicited" with the details below
Elicitation:  experts (roles, number), protocol, exact question, raw answers, aggregation
Assumptions:  what the number depends on
Revisit when: <trigger>
```

## Further reading

- A. O'Hagan et al., *Uncertain Judgements: Eliciting Experts' Probabilities* (Wiley, 2006).
- R. Cooke, *Experts in Uncertainty: Opinion and Subjective Probability in Science* (Oxford University Press, 1991).
- V. Hemming et al., "A practical guide to structured expert elicitation using the IDEA protocol," *Methods in Ecology and Evolution* 9 (2018): 169–180.
- J. Kadane and L. Wolfson, "Experiences in elicitation," *Journal of the Royal Statistical Society: Series D* 47 (1998): 3–19.
