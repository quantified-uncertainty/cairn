---
title: "Estimates Registry"
description: "Centralized registry of quantitative estimates used throughout the framework"
sidebar:
  order: 1
---

# Estimates Registry

This section provides a centralized registry of all quantitative estimates used in the Delegation Risk Framework. Each estimate includes:

- **Point estimate**: A single representative value
- **Distribution**: Uncertainty quantification in Squiggle notation
- **Confidence level**: How certain we are about this estimate
- **Source**: Where the estimate comes from
- **Last updated**: When the estimate was last reviewed

## Why Formalize Estimates?

Most risk frameworks use point estimates like "probability = 2%" or "damage = $5,000". This understates uncertainty and can lead to:

1. **Overconfidence** in risk calculations
2. **Poor decisions** when parameters are near critical thresholds
3. **Inability to identify** which uncertainties matter most
4. **No path to improvement** through better calibration

By expressing estimates as probability distributions, we can:

- Calculate **confidence intervals** on total risk
- Perform **sensitivity analysis** to find critical parameters
- **Update estimates** as we gather more data
- **Compare architectures** under parameter uncertainty

## Estimate Categories

### [Probability Priors](/experimental/probabilistic-estimation/estimates/probability-priors/)
Default failure probabilities by component type (deterministic code, narrow ML, general LLM, RL agents). These are the priors before observing any track record.

### [Damage Distributions](/experimental/probabilistic-estimation/estimates/damage-distributions/)
Damage magnitude distributions by category (infrastructure, data, reputation, regulatory, catastrophic). Heavy-tailed distributions for rare-but-severe events.

### [Mitigation Effectiveness](/experimental/probabilistic-estimation/estimates/mitigation-effectiveness/)
How much risk reduction do various interventions provide? Verifiers, sandboxing, rate limiting, human review, formal verification.

### [Trust Calibration](/experimental/probabilistic-estimation/estimates/trust-calibration/)
How to update trust based on track record. Bayesian updating formulas and calibrated priors.

### [Cross-Domain Benchmarks](/experimental/probabilistic-estimation/estimates/cross-domain-benchmarks/)
Reference points from nuclear safety, aviation, finance, and other domains with mature risk quantification.

### [Expert Elicitation Guide](/experimental/probabilistic-estimation/estimates/expert-elicitation/)
How to gather calibrated probability and damage estimates from domain experts when historical data is unavailable.

### [Incident Database Integration](/experimental/probabilistic-estimation/estimates/incident-database/)
How to ground your risk estimates in real-world AI incident data from public databases.

## Using These Estimates

### For Practitioners
Use these as **starting points** for your own risk assessment. Adjust based on:
- Your specific domain (healthcare vs. internal tools)
- Your organization's risk appetite
- Your observed track record
- Expert judgment from your team

### For Researchers
These estimates are **hypotheses to be tested**. Help improve them by:
- Analyzing AI incident databases
- Conducting expert elicitation studies
- Publishing calibration results
- Proposing better distribution families

## Notation Guide

We use [Squiggle](https://www.squiggle-language.com/) notation for distributions:

| Notation | Meaning | Example |
|----------|---------|---------|
| `beta(a, b)` | Beta distribution with shape parameters a, b | `beta(10, 100)` → ~9% mean |
| `lognormal(mu, sigma)` | Lognormal with log-mean μ, log-std σ | `lognormal(log(1000), 0.5)` |
| `normal(mean, std)` | Normal/Gaussian distribution | `normal(0.1, 0.02)` |
| `uniform(low, high)` | Uniform between bounds | `uniform(0.01, 0.1)` |
| `mixture([d1, d2], [w1, w2])` | Weighted mixture of distributions | `mixture([normal(0,1), normal(5,1)], [0.8, 0.2])` |

### Interpreting Confidence Levels

| Level | Meaning |
|-------|---------|
| **High** | Based on substantial data or expert consensus; unlikely to change significantly |
| **Medium** | Reasonable estimate with some uncertainty; may change with new data |
| **Low** | Educated guess or extrapolation; significant revision possible |
| **Speculative** | Placeholder for discussion; not yet suitable for decisions |

## Contributing

We welcome contributions to improve these estimates:

1. **Data-driven updates**: If you have incident data or calibration studies
2. **Domain expertise**: If you can provide better priors for specific domains
3. **Methodological improvements**: Better distribution families, aggregation methods
4. **Error corrections**: If you find mistakes or inconsistencies

See our [contribution guidelines](/reference/contributing/) for how to submit improvements.
