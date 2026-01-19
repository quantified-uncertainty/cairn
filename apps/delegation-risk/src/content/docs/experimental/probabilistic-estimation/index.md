---
title: "Probabilistic Estimation"
description: "Quantifying delegation risk with probability distributions"
sidebar:
  order: 0
---

# Probabilistic Estimation

This section provides tools and reference data for quantifying delegation risk using probability distributions rather than point estimates.

## Why Probabilistic?

Most risk frameworks use point estimates like "probability = 2%" or "damage = $5,000". This approach:

- **Understates uncertainty** in our knowledge
- **Hides tail risk** from rare-but-severe events
- **Prevents sensitivity analysis** to identify critical parameters
- **Blocks Bayesian updating** as we gather more data

By expressing estimates as probability distributions, we can propagate uncertainty through calculations and make better-informed decisions.

## What's Included

### [Interactive Tools](/experimental/probabilistic-estimation/experimental/probabilistic-estimation/tools/)

Calculators and visualizations for applying probabilistic methods:

- **Risk Calculator**: Monte Carlo simulation with budget confidence analysis
- **Trust Updater**: Bayesian belief updating based on track record
- **Sensitivity Dashboard**: Identify which parameters drive your risk
- **Architecture Comparator**: Compare delegation architectures side-by-side

### [Estimates Registry](/experimental/probabilistic-estimation/estimates/)

Calibrated probability distributions for key risk parameters:

- **Probability Priors**: Failure rates by component type
- **Damage Distributions**: Cost magnitudes by category
- **Mitigation Effectiveness**: Risk reduction from various interventions
- **Trust Calibration**: Bayesian updating formulas
- **Cross-Domain Benchmarks**: Reference points from nuclear, aviation, finance
- **Expert Elicitation Guide**: How to gather calibrated estimates
- **Incident Database Integration**: Grounding estimates in real data

## Getting Started

1. **Explore the estimates** to understand the baseline distributions
2. **Use the Risk Calculator** to model your specific situation
3. **Apply the Trust Updater** as you gather operational data
4. **Run sensitivity analysis** to focus mitigation efforts

## Technical Foundation

We use [Squiggle](https://www.squiggle-language.com/) notation for distributions:

- `beta(a, b)` for probabilities (bounded 0-1)
- `lognormal(mu, sigma)` for damages (heavy-tailed, positive)
- `mixture([d1, d2], [w1, w2])` for multi-modal outcomes

The interactive tools use Monte Carlo simulation (10,000 samples) to propagate uncertainty.
