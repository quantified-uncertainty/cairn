---
title: "Trust Calibration"
description: "How to update trust based on track record using Bayesian methods"
sidebar:
  order: 5
---

# Trust Calibration

This page explains how to convert observed track records into calibrated trust estimates using Bayesian updating.

## The Trust Update Problem

You have:
- A **prior belief** about component reliability
- **Observations** of successes and failures
- Need: **Posterior belief** for risk calculations

## Bayesian Framework

### Model Setup

Let θ = true reliability (probability of success per task).

```squiggle
// Prior: What we believe before observations
// Beta distribution is conjugate prior for binomial likelihood
prior = beta(alpha_0, beta_0)

// Observation model
// P(success | θ) = θ
// P(failure | θ) = 1 - θ

// Posterior after n successes, m failures
posterior = beta(alpha_0 + n, beta_0 + m)
```

### Prior Selection

The prior encodes what we believe before seeing any data:

```squiggle
// Uninformative prior (know nothing)
uninformative = beta(1, 1)
// Uniform over [0, 1]

// Skeptical prior (expect ~50% reliability)
skeptical = beta(5, 5)
// Mean: 50%, concentrated around middle

// Optimistic prior (expect ~90% reliability)
optimistic = beta(9, 1)
// Mean: 90%, assumes competence

// Pessimistic prior (expect ~10% reliability)
pessimistic = beta(1, 9)
// Mean: 10%, assumes unreliability

// Informative prior based on component type
prior_deterministicCode = beta(100, 1)    // ~99% reliable
prior_narrowML = beta(19, 1)              // ~95% reliable
prior_generalLLM = beta(9, 1)             // ~90% reliable
prior_RLAgent = beta(4, 1)                // ~80% reliable
```

### Prior Strength

The sum α₀ + β₀ determines how much data is needed to move the posterior:

| Prior Strength | α₀ + β₀ | Data to Move Significantly |
|----------------|---------|---------------------------|
| Very weak | 2 | 5-10 observations |
| Weak | 10 | 20-50 observations |
| Moderate | 50 | 100-200 observations |
| Strong | 200 | 500+ observations |

---

## Updating Examples

### Example 1: New LLM-Based Component

```squiggle
// Prior: General LLM, expect ~90% reliability
prior = beta(9, 1)

// After 50 successes, 3 failures
posterior = beta(9 + 50, 1 + 3)
// = beta(59, 4)
// Mean: 93.7%
// 90% CI: [86%, 98%]
```

**Interpretation**: Started at 90% prior, observed 94% success rate, posterior is 94% with tightened uncertainty.

### Example 2: Critical Security Component

```squiggle
// Prior: Skeptical for security-critical (trust must be earned)
prior = beta(5, 5)
// Mean: 50%, wide uncertainty

// After 100 successes, 0 failures
posterior = beta(5 + 100, 5 + 0)
// = beta(105, 5)
// Mean: 95.5%
// 90% CI: [90%, 98%]

// After 100 successes, 2 failures
posterior_with_failures = beta(5 + 100, 5 + 2)
// = beta(105, 7)
// Mean: 93.8%
// 90% CI: [88%, 97%]
```

### Example 3: Established Production System

```squiggle
// Prior: Strong optimistic prior (long track record)
prior = beta(900, 100)
// Mean: 90%, narrow uncertainty

// After 10 new failures in 1000 tasks
posterior = beta(900 + 990, 100 + 10)
// = beta(1890, 110)
// Mean: 94.5%

// Prior barely moved - strong prior dominates
```

---

## Converting Track Record to Risk Modifier

The framework uses a **track record modifier** in risk calculations:

```squiggle
// Base risk from component type
baseRisk = probabilityPrior * damageEstimate

// Track record modifier (0 to 2, where 1 = no adjustment)
trackRecordModifier(posterior, prior) = {
  posteriorMean = posterior.alpha / (posterior.alpha + posterior.beta)
  priorMean = prior.alpha / (prior.alpha + prior.beta)

  // Ratio adjustment
  return priorMean / posteriorMean
  // > 1 if posterior is worse than prior (bad track record)
  // < 1 if posterior is better than prior (good track record)
}

// Adjusted risk
adjustedRisk = baseRisk * trackRecordModifier(posterior, prior)
```

### Example Track Record Modifiers

| Scenario | Prior | Observed | Modifier | Effect |
|----------|-------|----------|----------|--------|
| New, untested | 90% | - | 1.0 | Baseline |
| Good track record | 90% | 98% | 0.92 | 8% reduction |
| Excellent record | 90% | 99.5% | 0.90 | 10% reduction |
| Mediocre record | 90% | 85% | 1.06 | 6% increase |
| Bad track record | 90% | 70% | 1.29 | 29% increase |

---

## Time-Weighted Observations

Recent observations should count more than old ones:

### Exponential Decay

```squiggle
// Weight observation by recency
weight(age_days, halfLife_days) = 0.5^(age_days / halfLife_days)

// Example: 30-day half-life
// Today's observation: weight = 1.0
// 30 days ago: weight = 0.5
// 60 days ago: weight = 0.25

// Effective observation count
effectiveSuccesses = sum(weight(age) for success in successes)
effectiveFailures = sum(weight(age) for failure in failures)

posterior = beta(
  alpha_0 + effectiveSuccesses,
  beta_0 + effectiveFailures
)
```

### Sliding Window

```squiggle
// Only consider last N observations
windowSize = 100

recentSuccesses = count(successes in last windowSize)
recentFailures = count(failures in last windowSize)

posterior = beta(
  alpha_0 + recentSuccesses,
  beta_0 + recentFailures
)
```

---

## Observation Quality Adjustments

Not all observations are equally informative:

### Task Complexity Weighting

```squiggle
// Complex tasks are more informative
complexityWeight(complexity) = {
  if complexity <= 3: 0.5   // Easy tasks tell us less
  if complexity <= 6: 1.0   // Standard weight
  if complexity <= 9: 1.5   // Hard tasks more informative
  else: 2.0                  // Very hard tasks most informative
}

weightedSuccesses = sum(complexityWeight(task.complexity) for task in successes)
```

### Adversarial vs. Random Errors

```squiggle
// Adversarial failures are more concerning
// Use different update for adversarial vs. benign failures

// Standard failure
standardFailure_weight = 1.0

// Adversarial failure (e.g., red team found exploit)
adversarialFailure_weight = 3.0  // Counts as 3 failures

// Random/benign error
benignFailure_weight = 0.7  // Less concerning
```

---

## Multi-Component Trust

When multiple components form a pipeline:

### Independent Components

```squiggle
// Pipeline reliability = product of component reliabilities
pipelineReliability = product(componentReliabilities)

// Update each component independently based on its observations
```

### Correlated Components

```squiggle
// Components may share failure modes
// Use hierarchical model

// Global factor affecting all components
globalReliability = beta(alpha_global, beta_global)

// Component-specific deviation
componentReliability[i] = globalReliability * componentFactor[i]

// Observations from any component inform global estimate
```

---

## Calibration Checks

### Prediction Intervals

After updating, check if predictions match reality:

```squiggle
// Posterior predicts next 100 tasks will have X failures
// where X ~ BetaBinomial(100, posterior.alpha, posterior.beta)

// If actual failures fall outside 90% prediction interval,
// model may be miscalibrated
```

### Brier Score

```squiggle
// Track prediction accuracy over time
brierScore = mean((predicted_prob - actual_outcome)^2)

// Perfect calibration: Brier score ≈ predicted_prob * (1 - predicted_prob)
```

---

## Practical Recommendations

### For New Components
1. Start with informative prior based on component type
2. Use weak prior strength (α₀ + β₀ ≈ 10) to allow quick updates
3. Monitor first 50-100 tasks carefully
4. Tighten prior as track record accumulates

### For Established Components
1. Use moderate prior strength based on historical volume
2. Apply time-weighting (30-90 day half-life)
3. Weight complex tasks higher
4. Review calibration quarterly

### For Critical Components
1. Use skeptical prior (must earn trust)
2. Weight adversarial failures heavily
3. Consider worst-case bounds, not just mean
4. Require statistical significance before trust increases

---

## Reference Tables

### Quick Prior Lookup

| Component Type | Prior | Mean | 90% CI |
|----------------|-------|------|--------|
| Deterministic code | beta(99, 1) | 99% | [95%, 100%] |
| Narrow ML | beta(19, 1) | 95% | [82%, 99%] |
| General LLM | beta(9, 1) | 90% | [67%, 99%] |
| RL/Agentic | beta(4, 1) | 80% | [45%, 98%] |
| New/Unknown | beta(1, 1) | 50% | [5%, 95%] |
| Skeptical | beta(1, 9) | 10% | [1%, 33%] |

### Observations Needed for Confidence

| Starting Prior | Target Confidence | Successes Needed (0 failures) |
|----------------|-------------------|------------------------------|
| beta(1, 1) | 90% ± 5% | ~35 |
| beta(1, 1) | 95% ± 3% | ~60 |
| beta(1, 1) | 99% ± 1% | ~200 |
| beta(9, 1) | 95% ± 3% | ~30 |
| beta(9, 1) | 99% ± 1% | ~100 |
