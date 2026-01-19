---
title: "Mitigation Effectiveness"
description: "Estimated risk reduction from various safety interventions"
sidebar:
  order: 4
---

# Mitigation Effectiveness

This page provides estimates for how much risk reduction various safety interventions provide. Use these to calculate the ROI of different mitigations.

## Mitigation Categories

### 1. Verification & Review

#### Human Review
```squiggle
// Human reviewer catches what fraction of issues?
humanReview_catchRate = beta(85, 15)
// Mean: 85%, 90% CI: [72%, 94%]

// False positive rate (flags non-issues)
humanReview_falsePositive = beta(5, 95)
// Mean: 5%, 90% CI: [2%, 10%]

// Risk reduction factor
humanReview_riskReduction = humanReview_catchRate
// Residual risk = baseRisk * (1 - catchRate)
```

| Metric | Point Est. | Distribution | 90% CI | Confidence |
|--------|------------|--------------|--------|------------|
| Catch rate | 85% | `beta(85, 15)` | [72%, 94%] | Medium |
| False positive | 5% | `beta(5, 95)` | [2%, 10%] | Medium |

**Factors affecting effectiveness**:
- Reviewer expertise (±20%)
- Time allocated (rushed review: -30%)
- Review fatigue (declines over session)
- Adversarial vs. random errors (lower catch rate for adversarial)

#### AI Verifier (Secondary Model)
```squiggle
// AI verifier checking primary AI's output
aiVerifier_catchRate = beta(70, 30)
// Mean: 70%, 90% CI: [54%, 84%]

aiVerifier_falsePositive = beta(10, 90)
// Mean: 10%, 90% CI: [5%, 18%]

// Correlation penalty - same model family may miss same errors
correlationPenalty = uniform(0.7, 1.0)
effective_aiVerifier_catchRate = aiVerifier_catchRate * correlationPenalty
```

| Metric | Point Est. | Distribution | 90% CI | Confidence |
|--------|------------|--------------|--------|------------|
| Catch rate | 70% | `beta(70, 30)` | [54%, 84%] | Low |
| False positive | 10% | `beta(10, 90)` | [5%, 18%] | Medium |
| Correlation penalty | 0.85 | `uniform(0.7, 1.0)` | [70%, 100%] | Low |

#### Formal Verification
```squiggle
// For properties that CAN be formally verified
formalVerification_catchRate = beta(99, 1)
// Mean: 99%, essentially complete for verified properties

// But only covers limited property space
formalVerification_coverage = beta(20, 80)
// Mean: 20% of relevant failure modes can be formally specified
```

| Metric | Point Est. | Distribution | 90% CI | Confidence |
|--------|------------|--------------|--------|------------|
| Catch rate (verified) | 99% | `beta(99, 1)` | [95%, 100%] | High |
| Property coverage | 20% | `beta(20, 80)` | [10%, 35%] | Low |

### 2. Runtime Monitoring

#### Output Filtering
```squiggle
// Pattern-based filtering (blocklists, regexes)
outputFilter_catchRate = beta(60, 40)
// Mean: 60%, catches obvious violations

outputFilter_falsePositive = beta(3, 97)
// Mean: 3%, low false positive with good patterns
```

| Metric | Point Est. | Distribution | 90% CI | Confidence |
|--------|------------|--------------|--------|------------|
| Catch rate | 60% | `beta(60, 40)` | [45%, 74%] | Medium |
| False positive | 3% | `beta(3, 97)` | [1%, 7%] | Medium |

#### Anomaly Detection
```squiggle
// Statistical anomaly detection
anomalyDetection_catchRate = beta(50, 50)
// Mean: 50%, depends heavily on baseline quality

anomalyDetection_falsePositive = beta(8, 92)
// Mean: 8%, tunable threshold tradeoff
```

| Metric | Point Est. | Distribution | 90% CI | Confidence |
|--------|------------|--------------|--------|------------|
| Catch rate | 50% | `beta(50, 50)` | [35%, 65%] | Low |
| False positive | 8% | `beta(8, 92)` | [4%, 14%] | Medium |

#### Tripwires (Canary Inputs)
```squiggle
// Tripwires catch deliberate circumvention
tripwire_catchRate = beta(40, 60)
// Mean: 40%, highly dependent on tripwire design

// Very low false positive if tripwires are distinctive
tripwire_falsePositive = beta(1, 99)
```

| Metric | Point Est. | Distribution | 90% CI | Confidence |
|--------|------------|--------------|--------|------------|
| Catch rate | 40% | `beta(40, 60)` | [26%, 55%] | Low |
| False positive | 1% | `beta(1, 99)` | [0.1%, 4%] | Medium |

### 3. Architectural Constraints

#### Sandboxing
```squiggle
// Prevents damage from escaping sandbox
sandbox_containment = beta(95, 5)
// Mean: 95%, some escape vectors exist

// Performance overhead
sandbox_overhead = lognormal(log(0.2), 0.5)
// Mean: 25% overhead, varies by workload
```

| Metric | Point Est. | Distribution | 90% CI | Confidence |
|--------|------------|--------------|--------|------------|
| Containment | 95% | `beta(95, 5)` | [86%, 99%] | High |
| Overhead | 20% | `lognormal(log(0.2), 0.5)` | [7%, 50%] | Medium |

#### Rate Limiting
```squiggle
// Limits damage accumulation speed
rateLimit_damageReduction = beta(70, 30)
// Mean: 70%, prevents runaway scenarios

// May reduce utility
rateLimit_utilityLoss = beta(10, 90)
// Mean: 10%, depends on limit tightness
```

| Metric | Point Est. | Distribution | 90% CI | Confidence |
|--------|------------|--------------|--------|------------|
| Damage reduction | 70% | `beta(70, 30)` | [54%, 84%] | Medium |
| Utility loss | 10% | `beta(10, 90)` | [5%, 18%] | Medium |

#### Permission Scoping
```squiggle
// Least privilege reduces blast radius
permissionScoping_damageReduction = beta(60, 40)
// Mean: 60%, limits what can go wrong

// Very low overhead
permissionScoping_overhead = beta(2, 98)
```

| Metric | Point Est. | Distribution | 90% CI | Confidence |
|--------|------------|--------------|--------|------------|
| Damage reduction | 60% | `beta(60, 40)` | [45%, 74%] | Medium |
| Overhead | 2% | `beta(2, 98)` | [0.5%, 5%] | High |

### 4. Redundancy & Diversity

#### N-Version Implementation
```squiggle
// Two independent implementations, both must agree
// Assumes independence (often violated!)
singleVersion_failure = 0.05  // 5% each
nVersion_failure = singleVersion_failure^2  // 0.25% if independent

// But implementations are often correlated
correlation_factor = uniform(0.3, 0.7)
actual_nVersion_failure = singleVersion_failure^(2 - correlation_factor)
// ~1-2% in practice
```

| Metric | Point Est. | Distribution | 90% CI | Confidence |
|--------|------------|--------------|--------|------------|
| Ideal improvement | 20× | deterministic | - | - |
| Actual improvement | 3-5× | varies | [2×, 10×] | Low |
| Correlation factor | 0.5 | `uniform(0.3, 0.7)` | [30%, 70%] | Low |

#### Ensemble Voting
```squiggle
// Majority vote among K models
ensemble_improvement(K) = {
  // Improvement factor over single model
  // Assumes some independence
  K^0.5  // Square root scaling due to correlation
}
// 3 models: ~1.7× improvement
// 5 models: ~2.2× improvement
```

### 5. Testing & Validation

#### Red Team Testing
```squiggle
// Red team finds what fraction of exploitable issues?
redTeam_discoveryRate = beta(50, 50)
// Mean: 50%, depends on team skill and time

// Issues found can then be mitigated
redTeam_riskReduction = redTeam_discoveryRate * 0.9
// 90% of found issues get fixed
```

| Metric | Point Est. | Distribution | 90% CI | Confidence |
|--------|------------|--------------|--------|------------|
| Discovery rate | 50% | `beta(50, 50)` | [35%, 65%] | Low |
| Risk reduction | 45% | derived | [30%, 60%] | Low |

#### Automated Testing Suite
```squiggle
// Coverage of failure modes
autoTest_coverage = beta(70, 30)
// Mean: 70%, depends on test quality

// Catch rate within covered modes
autoTest_catchRate = beta(90, 10)
// Mean: 90%, tests usually work if present

effective_autoTest = autoTest_coverage * autoTest_catchRate
// ~63% effective overall
```

| Metric | Point Est. | Distribution | 90% CI | Confidence |
|--------|------------|--------------|--------|------------|
| Coverage | 70% | `beta(70, 30)` | [54%, 84%] | Medium |
| Catch rate | 90% | `beta(90, 10)` | [77%, 97%] | High |
| Effective | 63% | derived | [45%, 78%] | Medium |

---

## Combining Mitigations

### Serial (Defense in Depth)
```squiggle
// Error must pass through all layers undetected
residualRisk_serial(baseRisk, mitigations) =
  baseRisk * product(1 - m.catchRate for m in mitigations)

// Example: Human review (85%) + AI verifier (70%) + output filter (60%)
residualRisk = baseRisk * (1-0.85) * (1-0.70) * (1-0.60)
// = baseRisk * 0.15 * 0.30 * 0.40 = baseRisk * 0.018
// 98.2% reduction
```

### Diminishing Returns
Real mitigations have correlated failures:
```squiggle
// Correlated mitigations
effectiveCatchRate_correlated(catchRates, correlation) = {
  // Simplified model: each additional mitigation is less effective
  cumulative = 0
  for i, rate in enumerate(catchRates):
    marginal = rate * (1 - cumulative) * (1 - correlation)^i
    cumulative += marginal
  return cumulative
}
```

---

## Cost-Effectiveness Comparison

| Mitigation | Risk Reduction | Monthly Cost | Cost per 1% Reduction |
|------------|----------------|--------------|----------------------|
| Output filtering | 60% | $100 | $1.67 |
| Automated testing | 63% | $500 | $7.94 |
| Permission scoping | 60% | $200 | $3.33 |
| AI verifier | 70% | $1,000 | $14.29 |
| Human review | 85% | $3,000 | $35.29 |
| Sandboxing | 95%* | $500 | $5.26 |
| Red team testing | 45% | $5,000 | $111.11 |

*Sandboxing reduces damage, not probability. Different risk model.

---

## Recommendations by Risk Level

### Low Risk ($0-500/mo budget)
- Output filtering
- Permission scoping
- Automated testing

### Medium Risk ($500-2000/mo budget)
- Add: AI verifier
- Add: Sandboxing
- Add: Rate limiting

### High Risk ($2000-10000/mo budget)
- Add: Human review (sampled)
- Add: Red team testing
- Add: N-version for critical paths

### Critical Risk (>$10000/mo budget)
- Full human review
- Formal verification where possible
- Multiple independent architectures
- Continuous red teaming
