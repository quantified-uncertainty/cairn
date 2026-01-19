---
title: "Expert Elicitation Guide"
description: "How to gather calibrated probability and damage estimates from domain experts"
sidebar:
  order: 7
---

# Expert Elicitation Guide

When historical data is unavailable or sparse, **expert judgment** is often the best source of probability and damage estimates. This guide explains how to elicit well-calibrated estimates.

## Why Expert Elicitation?

Many AI delegation risks lack historical data:
- Novel systems with no track record
- Rare but high-consequence events
- Domain-specific failure modes
- Emerging capability risks

Expert judgment can fill these gaps, but only if elicited carefully to avoid biases.

---

## The Elicitation Process

### 1. Identify Experts

Good experts have:
- **Domain knowledge**: Understand the technical system and failure modes
- **Calibration awareness**: Understand probability concepts
- **Diverse perspectives**: Include operators, developers, security, and users

**Avoid**:
- Single-expert estimates (no diversity)
- Only optimists or pessimists (bias)
- Experts with conflicts of interest

### 2. Define Questions Precisely

Bad question:
> "What's the probability this AI will fail?"

Better question:
> "Over the next 12 months, given 1,000 customer queries processed by this LLM, how many would you expect to result in factually incorrect responses that the customer acts on?"

Key elements:
- **Specific outcome** (what counts as failure)
- **Time horizon** (when)
- **Reference class** (per what unit)
- **Observable** (how would you verify)

### 3. Elicit Distributions, Not Points

Ask for uncertainty ranges, not single numbers:

```
"Please estimate the 5th, 50th, and 95th percentiles for monthly damage cost
if this failure mode occurs. In other words:
- What's the cost you'd be surprised if it went below? (5th percentile)
- What's your best guess? (50th percentile)
- What's the cost you'd be surprised if it exceeded? (95th percentile)"
```

### 4. Use Anchoring Carefully

Provide reference points without biasing:
- Give ranges from similar systems
- Present multiple anchors (high and low)
- Explicitly ask experts to consider if anchors are relevant

### 5. Aggregate Multiple Experts

With multiple experts:
- Collect estimates independently (avoid groupthink)
- Aggregate using geometric mean (for probabilities) or median (for damages)
- Capture disagreement as additional uncertainty

---

## Common Biases and Mitigations

### Overconfidence

**Problem**: Experts' 90% confidence intervals contain the true value only 50-70% of the time.

**Mitigation**:
- Ask for 80% intervals instead of 90%
- Explicitly ask "What could make this higher/lower than your estimate?"
- Widen reported intervals by 1.5×

### Anchoring

**Problem**: First number mentioned dominates estimates.

**Mitigation**:
- Present ranges, not single anchors
- Ask for estimate before showing any numbers
- Use multiple diverse anchors

### Availability Bias

**Problem**: Recent or vivid events are overweighted.

**Mitigation**:
- Ask about base rates, not specific incidents
- Provide historical data when available
- Ask "How often does this happen in general, not just recently?"

### Confirmation Bias

**Problem**: Experts fit evidence to preexisting beliefs.

**Mitigation**:
- Include experts with opposing views
- Explicitly ask for disconfirming evidence
- Use structured disagreement protocols

### Groupthink

**Problem**: Experts converge on consensus without independent thought.

**Mitigation**:
- Collect estimates independently before discussion
- Use anonymous submission
- Delphi method (iterate without face-to-face)

---

## Elicitation Protocols

### Protocol 1: Three-Point Estimate

For each quantity:
1. "What's the minimum plausible value?" (optimistic)
2. "What's the most likely value?" (base case)
3. "What's the maximum plausible value?" (pessimistic)

Convert to distribution:
```squiggle
// Triangular distribution from three points
estimate = triangular(minimum, most_likely, maximum)

// Or fit lognormal through points
// If min=100, mode=500, max=5000
estimate = lognormal(log(500), 1.0)
```

### Protocol 2: Percentile Elicitation

Ask for specific percentiles:
1. "What value are you 90% sure it won't go below?" (10th percentile)
2. "What's your median estimate?" (50th percentile)
3. "What value are you 90% sure it won't exceed?" (90th percentile)

Convert to distribution:
```squiggle
// Fit lognormal through p10 and p90
// If p10=$100, p90=$10000
// Ratio = 100, so log(ratio) = 4.6
// For 80% CI (p10 to p90), z = 1.28
// sigma = 4.6 / (2 * 1.28) = 1.8
// median falls at geometric mean of p10 and p90

estimate = lognormal(log(1000), 1.8)
```

### Protocol 3: Reference Class Forecasting

1. Identify similar historical cases
2. Find base rates in reference class
3. Adjust for specific case differences
4. Document adjustment rationale

Example:
```
Reference class: LLM chatbot deployments (n=50)
Base rate of major incidents: 15%
Adjustments:
- Our system has more guardrails: -5%
- But higher-stakes domain: +5%
- Smaller initial deployment: -3%
Final estimate: 12%
```

### Protocol 4: Delphi Method

Round 1:
- Experts submit estimates independently
- Collect rationales anonymously

Round 2:
- Share aggregated results and rationales
- Experts revise estimates with new information
- Identify areas of disagreement

Round 3:
- Final estimates after discussion
- Document remaining uncertainty

---

## Converting Estimates to Distributions

### Probability Estimates → Beta Distribution

From expert confidence interval:
```squiggle
// Expert says: "70-90% likely, probably around 80%"
// This suggests beta(8, 2) or similar

// Method: Match mean and variance
// Mean = 0.8, Variance = 0.02 (rough)
// alpha + beta = (mean * (1-mean) / variance) - 1 = 7
// alpha = mean * (alpha + beta) = 5.6
// beta = (1-mean) * (alpha + beta) = 1.4

probabilityEstimate = beta(6, 2)  // Approximately
```

### Damage Estimates → Lognormal Distribution

From expert percentiles:
```squiggle
// Expert says: "Damage probably $500-5000, rarely above $50000"
// Interpret as: p25=$500, p75=$5000, p95=$50000

// Fit lognormal to middle 50%
// log(5000/500) = 2.3
// For 50% CI, z = 0.67
// sigma = 2.3 / (2 * 0.67) = 1.7
// median = geometric mean = sqrt(500 * 5000) = 1580

damageEstimate = lognormal(log(1500), 1.5)
```

---

## Quality Checks

### Coherence

Probabilities must be coherent:
- P(A or B) ≥ P(A) and P(A or B) ≥ P(B)
- P(A and B) ≤ P(A) and P(A and B) ≤ P(B)
- Probabilities of exhaustive alternatives sum to 1

### Calibration

Track expert accuracy over time:
- Did 90% CIs contain reality 90% of the time?
- Use Brier score to measure probability accuracy
- Feed back to improve future estimates

### Sensitivity

Check if decisions change with reasonable estimate variations:
- If decision is robust, estimate precision matters less
- If decision is sensitive, invest in better estimates

---

## Documentation Template

For each elicited estimate, document:

```markdown
## Estimate: [Description]

**Expert(s)**: [Names/roles]
**Date**: [Date]
**Method**: [Protocol used]

### Question Asked
[Exact wording of the question]

### Raw Responses
- Expert 1: [Response with rationale]
- Expert 2: [Response with rationale]

### Aggregated Estimate
- Distribution: [e.g., beta(8, 2) or lognormal(log(1000), 1.0)]
- Mean: [Value]
- 90% CI: [Low, High]

### Key Assumptions
1. [Assumption 1]
2. [Assumption 2]

### Sensitivity Notes
[What would change this estimate significantly?]

### Update Triggers
[When should this estimate be revisited?]
```

---

## Resources

### Calibration Training
- Superforecasting (Tetlock & Gardner)
- Calibration games (e.g., Metaculus)
- Probability training workshops

### Elicitation Software
- SHELF (Sheffield Elicitation Framework)
- Elicit (structured elicitation tool)
- Spreadsheet templates

### Further Reading
- "Structured Expert Judgment" (Cooke, 1991)
- "Expert Knowledge and Its Application" (Kadane & Wolfson)
- "Probability Methods for Cost Uncertainty Analysis" (Garvey)
