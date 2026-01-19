---
title: "Interactive Tools"
description: "Calculators and visualizations for delegation risk analysis"
sidebar:
  order: 0
---

# Interactive Tools

These tools help you apply the Delegation Risk Framework to your specific situation with probabilistic modeling and visualization.

## Available Tools

### [Risk Calculator](/experimental/probabilistic-estimation/tools/risk-calculator)
Monte Carlo simulation-based risk calculator with:
- Probability distributions for harm modes
- Budget confidence analysis
- Visual risk distribution histograms
- Squiggle code export

### [Trust Updater](/experimental/probabilistic-estimation/tools/trust-updater)
Bayesian belief updating for component trust:
- Set prior beliefs about component reliability
- Input observed successes and failures
- Visualize posterior distributions
- Track trust evolution over time

### [Sensitivity Dashboard](/experimental/probabilistic-estimation/tools/sensitivity-dashboard)
Discover which parameters drive your risk:
- Tornado diagrams showing parameter importance
- One-at-a-time sensitivity analysis
- Interaction effects between parameters
- Focus optimization efforts effectively

### [Architecture Comparator](/experimental/probabilistic-estimation/tools/architecture-comparator)
Compare different delegation architectures:
- Side-by-side risk decomposition
- Trade-off visualization
- Component-level comparison
- Migration path analysis

---

## Using the Tools

### 1. Start with Risk Calculator
Input your harm modes with probability and damage estimates. The calculator will simulate thousands of scenarios and show you the distribution of potential outcomes.

### 2. Calibrate with Trust Updater
As you gather operational data, use the Trust Updater to convert track records into calibrated trust estimates. These can feed back into the Risk Calculator.

### 3. Focus with Sensitivity Dashboard
When you need to reduce risk, use the Sensitivity Dashboard to identify which parameters have the biggest impact. This helps prioritize mitigation investments.

### 4. Compare with Architecture Comparator
When evaluating architectural changes, use the comparator to visualize trade-offs between different delegation structures.

---

## Technical Notes

These tools use Monte Carlo simulation to propagate uncertainty through calculations. Key distributions:

- **Beta distributions** for probabilities (bounded 0-1)
- **Lognormal distributions** for damages (heavy-tailed, positive)
- **10,000 samples** per simulation for statistical stability

Results should be interpreted as approximations. For critical decisions, consider using the exported Squiggle code with the full [Squiggle](https://www.squiggle-language.com/) toolchain.
