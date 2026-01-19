---
title: "Quantitative Metrics"
description: "Practical measurement of entanglement"
sidebar:
  order: 3
---

# Quantitative Metrics

This page explains how to measure entanglement in practice. For theoretical foundations, see [Formal Definitions](/entanglements/fundamentals/formal-definitions/).

---

## What to Measure

| Category | What It Captures | When to Use |
|----------|------------------|-------------|
| **Correlation** | Shared failures (passive entanglement) | Detect correlated blind spots |
| **Influence** | Directional impact (active entanglement) | Detect context contamination |
| **Capture** | Alignment drift (adversarial entanglement) | Detect verifier capture |
| **Diversity** | Structural independence | Assess design quality |
| **Temporal** | Changes over time | Early warning |

---

## Correlation Metrics

### Failure Correlation

The simplest measure: when A fails, how often does B also fail?

**How to measure**: Run the same inputs through both components. Track which inputs cause failures.

**Interpretation**:
| Correlation | Meaning | Action |
|-------------|---------|--------|
| < 0 | Negative correlation (failures are anti-correlated) | Great—maintain this diversity |
| 0 to 0.3 | Low correlation | Acceptable |
| 0.3 to 0.5 | Moderate correlation | Investigate shared dependencies |
| > 0.5 | High correlation | Redesign needed—layers share blind spots |

### Conditional Failure Rate

"If A fails, how much more likely is B to fail?"

**Interpretation**:
| Ratio | Meaning |
|-------|---------|
| = 1 | Independent (A failing doesn't affect B's failure odds) |
| > 1 | Positive correlation (A failing makes B failing more likely) |
| < 1 | Negative correlation (A failing makes B failing less likely) |
| >> 1 | Strong entanglement (when A fails, B almost always fails too) |

### The Entanglement Tax

Direct measure of how much worse reality is than the independent assumption.

**Calculation**:
> Entanglement Tax = (Actual joint failure rate) ÷ (What you'd expect if independent)

**Example**:
- Component A fails 10% of the time
- Component B fails 10% of the time
- If independent: Both fail 1% of the time (0.1 × 0.1)
- If you observe both failing 5% of the time
- Entanglement Tax = 5% ÷ 1% = **5×**

Your system is 5× riskier than the independent model suggests.

---

## Influence Metrics

### Frame Sensitivity

Measures how much A's framing affects B's decisions.

**How to test**:
1. Take inputs where you know the correct answer
2. Have A summarize/frame them two ways: neutral and suggestive
3. See how much B's accuracy differs between framings

**Interpretation**:
| Sensitivity | Meaning | Action |
|-------------|---------|--------|
| < 5% difference | Low sensitivity | Good—B isn't easily swayed |
| 5-15% difference | Moderate sensitivity | Consider independent information channels |
| > 15% difference | High sensitivity | B is too dependent on A's framing |

### Information Transfer

"Does A's behavior predict B's behavior, beyond what B's own history predicts?"

**When to worry**: If B's outputs correlate with A's outputs over time, information is leaking through some channel—even if you think they're isolated.

---

## Capture Metrics

### Approval Rate Comparison

Compare how often this agent gets approved vs. baseline.

**Interpretation**:
| Ratio vs Baseline | Meaning |
|-------------------|---------|
| 0.9 - 1.1 | Normal variation |
| 1.1 - 1.3 | Slightly elevated—monitor |
| > 1.3 | Significantly elevated—investigate for capture |

### Preference Alignment

"Does the verifier approve more when the agent wants approval?"

**How to measure**: Track cases where you know the agent's preference. Compare approval rates.

**Interpretation**:
| Alignment Score | Meaning |
|-----------------|---------|
| Negative | Healthy adversarial relationship |
| Near zero | Independent (verifier ignores agent preferences) |
| 0.1 - 0.3 | Some alignment—monitor for capture |
| > 0.3 | Significant alignment—capture likely |

### Verifier Consistency

"Does the verifier treat all agents the same?"

If approval rates vary significantly between agents, some may have captured the verifier.

---

## Diversity Metrics

### Methodological Diversity Score

Rate your verification system on these dimensions:

| Dimension | 0 Points | 1 Point | 2 Points |
|-----------|----------|---------|----------|
| **Provider** | All same provider | 2 providers | 3+ providers |
| **Architecture** | All same type | 2 types | 3+ types (e.g., neural + rule-based + symbolic) |
| **Training data** | Same data | Overlapping data | Independent data |
| **Methodology** | All ML | ML + rules | ML + rules + formal verification |
| **Timing** | All synchronous | Pre + post | Pre + concurrent + post |

**Scoring**:
| Total (0-10) | Assessment |
|--------------|------------|
| 0-3 | Low diversity—high entanglement risk |
| 4-6 | Moderate diversity |
| 7-10 | High diversity—lower entanglement risk |

---

## Temporal Metrics

### Drift Detection

Track metrics weekly and watch for trends.

**Concerning patterns**:
- Correlation increasing over time → shared dependencies growing
- Approval rates creeping up → possible capture developing
- Frame sensitivity increasing → verifier becoming more dependent on agent framing

**Alert thresholds**:
| Metric | Normal | Monitor | Investigate |
|--------|--------|---------|-------------|
| Correlation drift | < 0.01/week | 0.01-0.02/week | > 0.02/week |
| Approval rate drift | < 0.5%/month | 0.5-2%/month | > 2%/month |

---

## Quick Reference: What to Measure When

| If You Suspect... | Measure | Alert If |
|-------------------|---------|----------|
| Shared blind spots | Failure correlation | > 0.3 |
| Context contamination | Frame sensitivity | > 10% difference |
| Verifier capture | Preference alignment | > 0.15 |
| Favoritism | Verifier consistency across agents | High variance |
| Growing problems | Weekly drift rates | Positive trend |
| Low structural diversity | Diversity score | < 5 |

---

## Practical Tips

**Start simple**: Failure correlation is the most important metric. If you can only measure one thing, measure this.

**Use ground truth**: Many metrics require knowing the "correct" answer. Invest in human labeling of samples.

**Log everything**: You can't measure what you don't record. Log all verification decisions with context.

**Track over time**: A single measurement tells you the current state. Trends tell you if it's getting worse.

**Test under stress**: Conditional entanglement only appears under unusual conditions. Test with adversarial inputs and high load.

---

## What Good Looks Like

A healthy verification system:
- Failure correlation < 0.3
- Frame sensitivity < 10%
- No verifier showing elevated approval rates for specific agents
- Diversity score ≥ 5
- Stable or improving metrics over time

If your system doesn't meet these benchmarks, see [Solutions & Mitigations](/entanglements/mitigation/solutions/).

---

See also:
- [Formal Definitions](/entanglements/fundamentals/formal-definitions/) — Precise concept definitions
- [Detecting Influence](/entanglements/detection/detecting-influence/) — Detection protocols
- [Correlation Calculator](/entanglements/detection/correlation-calculator/) — Estimation tools
