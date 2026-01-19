---
title: "Damage Distributions"
description: "Probability distributions for damage magnitudes by category"
sidebar:
  order: 3
---

# Damage Distributions

Damage estimates should reflect uncertainty, especially for rare-but-severe events. This page provides distributions for different damage categories.

## Why Distributions Matter for Damage

Point estimates like "damage = $5,000" miss crucial information:

- **Variability**: Similar incidents can have very different costs
- **Tail risk**: Rare severe events may dominate expected loss
- **Decision sensitivity**: Actions may change based on confidence intervals

## Damage Categories

### 1. Infrastructure Damage

Direct costs from system failures: compute, storage, service disruptions.

```squiggle
// Small-scale infrastructure failure
infra_small = lognormal(log(100), 0.8)
// Mean: ~$150, Median: $100, 90% CI: [$20, $600]

// Medium infrastructure incident
infra_medium = lognormal(log(2000), 0.7)
// Mean: ~$2,600, Median: $2,000, 90% CI: [$500, $10,000]

// Major infrastructure outage
infra_major = lognormal(log(50000), 1.0)
// Mean: ~$82,000, Median: $50,000, 90% CI: [$6,000, $400,000]
```

| Severity | Point Est. | Distribution | 90% CI | Confidence |
|----------|------------|--------------|--------|------------|
| Small | $100 | `lognormal(log(100), 0.8)` | [$20, $600] | High |
| Medium | $2,000 | `lognormal(log(2000), 0.7)` | [$500, $10k] | High |
| Major | $50,000 | `lognormal(log(50000), 1.0)` | [$6k, $400k] | Medium |

### 2. Data Damage

Costs from data corruption, loss, or breach.

```squiggle
// Minor data issue (recoverable)
data_minor = lognormal(log(500), 0.6)
// Mean: ~$600, Median: $500, 90% CI: [$150, $1,500]

// Data corruption requiring restore
data_corruption = lognormal(log(10000), 0.8)
// Mean: ~$15,000, Median: $10,000, 90% CI: [$2,000, $60,000]

// Data breach (includes notification, legal, etc.)
data_breach = lognormal(log(200000), 1.2)
// Mean: ~$410,000, Median: $200,000, 90% CI: [$20,000, $2M]
```

| Severity | Point Est. | Distribution | 90% CI | Confidence |
|----------|------------|--------------|--------|------------|
| Minor | $500 | `lognormal(log(500), 0.6)` | [$150, $1.5k] | High |
| Corruption | $10,000 | `lognormal(log(10000), 0.8)` | [$2k, $60k] | Medium |
| Breach | $200,000 | `lognormal(log(200000), 1.2)` | [$20k, $2M] | Medium |

**Note**: Data breach costs vary enormously by scale and jurisdiction. The IBM Cost of a Data Breach Report provides calibration data.

### 3. Reputational Damage

Costs from customer loss, brand damage, trust erosion.

```squiggle
// Minor PR issue (limited visibility)
reputation_minor = lognormal(log(1000), 1.0)
// Mean: ~$1,600, Median: $1,000, 90% CI: [$120, $8,000]

// Moderate PR incident (some media coverage)
reputation_moderate = lognormal(log(25000), 1.2)
// Mean: ~$51,000, Median: $25,000, 90% CI: [$2,500, $250k]

// Major reputational crisis
reputation_major = lognormal(log(500000), 1.5)
// Mean: ~$1.5M, Median: $500,000, 90% CI: [$30k, $5M]
```

| Severity | Point Est. | Distribution | 90% CI | Confidence |
|----------|------------|--------------|--------|------------|
| Minor | $1,000 | `lognormal(log(1000), 1.0)` | [$120, $8k] | Low |
| Moderate | $25,000 | `lognormal(log(25000), 1.2)` | [$2.5k, $250k] | Low |
| Major | $500,000 | `lognormal(log(500000), 1.5)` | [$30k, $5M] | Low |

**Note**: Reputational damage is notoriously hard to quantify. These are rough estimates with high uncertainty.

### 4. Regulatory/Legal Damage

Fines, legal fees, compliance costs.

```squiggle
// Minor compliance issue
regulatory_minor = lognormal(log(5000), 0.7)
// Mean: ~$6,500, Median: $5,000, 90% CI: [$1,200, $20,000]

// Regulatory investigation
regulatory_investigation = lognormal(log(100000), 1.0)
// Mean: ~$160,000, Median: $100,000, 90% CI: [$12k, $800k]

// Major regulatory action (GDPR, etc.)
regulatory_major = lognormal(log(2000000), 1.3)
// Mean: ~$4.7M, Median: $2M, 90% CI: [$150k, $25M]
```

| Severity | Point Est. | Distribution | 90% CI | Confidence |
|----------|------------|--------------|--------|------------|
| Minor | $5,000 | `lognormal(log(5000), 0.7)` | [$1.2k, $20k] | Medium |
| Investigation | $100,000 | `lognormal(log(100000), 1.0)` | [$12k, $800k] | Medium |
| Major | $2,000,000 | `lognormal(log(2000000), 1.3)` | [$150k, $25M] | Low |

### 5. Safety/Human Harm

Costs from physical harm, including medical, legal, and human costs.

```squiggle
// Minor injury
safety_minor = lognormal(log(10000), 0.8)
// Mean: ~$15,000, Median: $10,000, 90% CI: [$2k, $60k]

// Serious injury
safety_serious = lognormal(log(500000), 1.0)
// Mean: ~$820,000, Median: $500,000, 90% CI: [$60k, $4M]

// Fatality (statistical value of life)
safety_fatality = lognormal(log(10000000), 0.5)
// Mean: ~$11.3M, Median: $10M, 90% CI: [$4M, $27M]
```

| Severity | Point Est. | Distribution | 90% CI | Confidence |
|----------|------------|--------------|--------|------------|
| Minor injury | $10,000 | `lognormal(log(10000), 0.8)` | [$2k, $60k] | Medium |
| Serious injury | $500,000 | `lognormal(log(500000), 1.0)` | [$60k, $4M] | Medium |
| Fatality | $10,000,000 | `lognormal(log(10000000), 0.5)` | [$4M, $27M] | High |

**Note**: Value of Statistical Life (VSL) estimates from US DOT and EPA range from $7M-$12M. We use $10M as a central estimate.

---

## Composite Damage Models

Real incidents often involve multiple damage categories. Here's how to combine them:

### Additive Model (Independent)
```squiggle
// If damage categories are independent
totalDamage_independent = infra_damage + data_damage + reputation_damage + regulatory_damage
```

### Correlated Model
```squiggle
// Major incidents tend to have correlated damages
// Use a copula or simplified multiplier
correlationFactor = 1.3  // Damages tend to co-occur
totalDamage_correlated = (infra + data + reputation + regulatory) * correlationFactor
```

### Mixture Model (Severity Classes)
```squiggle
// Different severity levels with different probabilities
incidentSeverity = mixture(
  [minor_incident, moderate_incident, major_incident],
  [0.7, 0.25, 0.05]  // 70% minor, 25% moderate, 5% major
)
```

---

## Domain-Specific Adjustments

### Internal Tools
Multiply damages by 0.3-0.5 (limited exposure, easier recovery)

### Customer-Facing Products
Use base estimates (calibrated to this context)

### Financial Services
Multiply regulatory damage by 2-5× (stricter oversight)

### Healthcare
Multiply safety damage by 2-3× (vulnerable population, stricter liability)

### Critical Infrastructure
Multiply all categories by 3-10× (cascading effects, regulatory scrutiny)

---

## Time-Based Adjustments

### Duration Multiplier
```squiggle
durationMultiplier(hours) = {
  if hours < 1: 0.5      // Quick resolution
  if hours < 8: 1.0      // Standard
  if hours < 24: 2.0     // Extended
  if hours < 168: 5.0    // Week-long
  else: 10.0             // Prolonged
}
```

### Detection Delay
```squiggle
detectionDelayMultiplier(days) = {
  if days < 1: 1.0       // Caught quickly
  if days < 7: 1.5       // Week delay
  if days < 30: 3.0      // Month delay
  else: 5.0              // Prolonged undetected
}
```

---

## Example: Calculating Expected Damage

For a code deployment agent that might cause production issues:

```squiggle
// Failure mode: Deploys buggy code to production
failureProb = 0.02  // 2% chance per deployment

// Damage distribution (moderate infrastructure + some reputation)
damageIfFailure = lognormal(log(5000), 0.9) + lognormal(log(2000), 1.0)
// Combined median: ~$7,000, mean: ~$12,000

// Expected damage per deployment
expectedDamage = failureProb * mean(damageIfFailure)
// ~$240 per deployment

// Monthly expected damage (20 deployments/month)
monthlyRisk = 20 * expectedDamage
// ~$4,800/month
```

---

## Calibration Sources

1. **IBM Cost of a Data Breach Report** - Annual survey of breach costs
2. **Ponemon Institute studies** - IT security incident costs
3. **US DOT/EPA** - Value of Statistical Life estimates
4. **Insurance industry data** - Claims distributions by category
5. **SEC enforcement actions** - Regulatory fine distributions
6. **OSHA injury statistics** - Workplace safety costs

## Limitations

1. **Organizational variation**: Costs vary greatly by company size, industry
2. **Temporal changes**: Inflation, regulation changes affect costs over time
3. **Tail uncertainty**: Extreme events are hardest to estimate
4. **Intangible costs**: Trust, morale, innovation are hard to quantify
5. **Attribution difficulty**: Hard to isolate AI-caused vs. other damages
