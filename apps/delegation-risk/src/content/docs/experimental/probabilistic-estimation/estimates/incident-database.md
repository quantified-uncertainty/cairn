---
title: "Incident Database Integration"
description: "Grounding risk estimates in real-world AI incident data"
sidebar:
  order: 8
---

# Incident Database Integration

Risk estimates should be grounded in real-world data when available. This page explains how to use public AI incident databases to calibrate your delegation risk models.

## Why Use Incident Data?

Expert judgment is useful but can be:
- **Biased** by recent events or personal experience
- **Overconfident** about well-understood risks
- **Underconfident** about novel risks

Incident databases provide:
- **Base rates** for calibration
- **Failure mode taxonomies** for comprehensive analysis
- **Trend data** for forecasting

---

## Key Databases

### AI Incident Database (AIID)

**URL**: [incidentdatabase.ai](https://incidentdatabase.ai/)

**Coverage**: 1,000+ documented AI incidents across industries

**Useful for**:
- Understanding failure mode variety
- Finding reference classes for new systems
- Tracking incident trends over time

**Limitations**:
- Selection bias (only reported/public incidents)
- Variable documentation quality
- No systematic severity scoring

### AIAAIC Repository

**URL**: [aiaaic.org/repository](https://www.aiaaic.org/aiaaic-repository)

**Coverage**: AI and algorithmic incidents with ethical implications

**Useful for**:
- Bias and fairness incidents
- Regulatory and compliance cases
- Stakeholder harm patterns

### CVE Database (for AI security)

**URL**: [cve.org](https://cve.org/)

**Coverage**: Security vulnerabilities including ML/AI systems

**Useful for**:
- Adversarial attack vectors
- Model security vulnerabilities
- Prompt injection cases

---

## Extracting Base Rates

### Method 1: Direct Frequency Estimation

Count incidents in a reference class:

```squiggle
// Example: LLM chatbot incidents
// AIID shows ~50 chatbot-related incidents over 2 years
// Estimated ~10,000 production LLM chatbots deployed

incidentsObserved = 50
systemsDeployed = 10000
yearsObserved = 2

annualIncidentRate = incidentsObserved / (systemsDeployed * yearsObserved)
// = 50 / 20000 = 0.0025 = 0.25% per system-year

// With uncertainty (Poisson-based)
incidentRate = beta(50 + 1, 20000 - 50 + 1)
// Mean: 0.25%, 90% CI: [0.19%, 0.33%]
```

**Caveats**:
- Underreporting (multiply by 5-20× for total incidents)
- Survivorship bias (failed systems not tracked)
- Deployment estimates are rough

### Method 2: Comparative Analysis

Compare your system to incidents in similar systems:

```squiggle
// Reference: Image classification in healthcare
// AIID shows 12 diagnostic AI incidents over 3 years
// Approximately 500 deployed systems

referenceRate = 12 / (500 * 3)  // ~0.8% per year

// Adjustment for our system
ourSystem_adjustment = mixture(
  [0.5, 1.0, 2.0],  // Could be better, same, or worse
  [0.3, 0.4, 0.3]   // Prior on which applies
)

ourIncidentRate = referenceRate * ourSystem_adjustment
```

### Method 3: Trend Extrapolation

Use historical trends to forecast:

```squiggle
// LLM incidents by year (example data)
// 2022: 10 incidents
// 2023: 35 incidents
// 2024: 80 incidents (projected)

growthRate = log(80 / 10) / 2  // ~1.0 (100% per year)

// Forecast for 2025
projected2025 = 80 * exp(growthRate)  // ~220 incidents

// With uncertainty
incidentForecast = lognormal(log(220), 0.5)
```

---

## Severity Estimation from Incidents

### Damage Distribution from Reported Incidents

```squiggle
// Categorize AIID incidents by reported/estimated damage
// Minor: <$10K (60% of incidents)
// Moderate: $10K-$1M (30% of incidents)
// Major: >$1M (10% of incidents)

damageSeverity = mixture(
  lognormal(log(5000), 0.5),      // Minor
  lognormal(log(100000), 0.8),    // Moderate
  lognormal(log(5000000), 1.0),   // Major
  weights: [0.6, 0.3, 0.1]
)

// Expected damage per incident
// ≈ 0.6 × $5K + 0.3 × $100K + 0.1 × $5M = $533K
```

### Failure Mode Frequencies

From AIID taxonomy:

| Failure Mode | Frequency | Typical Damage |
|--------------|-----------|----------------|
| Incorrect output | 35% | Low-Medium |
| Bias/discrimination | 20% | Medium-High |
| Privacy breach | 15% | High |
| Security exploit | 10% | High |
| Availability failure | 10% | Medium |
| Physical harm | 5% | Very High |
| Other | 5% | Varies |

```squiggle
// Map to harm mode probabilities
incorrectOutput_share = 0.35
bias_share = 0.20
privacy_share = 0.15
security_share = 0.10
availability_share = 0.10
physicalHarm_share = 0.05

// Given an incident occurs, damage distribution
damageGivenIncident = mixture(
  lognormal(log(5000), 0.8),    // Incorrect output
  lognormal(log(50000), 1.0),   // Bias
  lognormal(log(200000), 1.2),  // Privacy
  lognormal(log(100000), 1.0),  // Security
  lognormal(log(30000), 0.7),   // Availability
  lognormal(log(1000000), 1.5), // Physical harm
  weights: [0.35, 0.20, 0.15, 0.10, 0.10, 0.05]
)
```

---

## Updating Your Model with Incident Data

### Prior → Posterior with Incident Counts

```squiggle
// Your prior belief about monthly failure rate
priorFailureRate = beta(5, 95)  // ~5%

// Observed in similar systems: 3 failures in 100 system-months
observedFailures = 3
observedSystemMonths = 100

// Update
posteriorFailureRate = beta(5 + 3, 95 + (100 - 3))
// = beta(8, 192)
// Mean: 4.0%, 90% CI: [2%, 7%]
```

### Adjusting for Reporting Bias

Incident databases capture only a fraction of actual incidents:

```squiggle
// Reporting rate estimate
reportingRate = beta(10, 90)  // ~10% of incidents get reported

// If database shows 50 incidents
observedIncidents = 50
estimatedActualIncidents = observedIncidents / mean(reportingRate)
// ≈ 500 actual incidents

// With uncertainty
actualIncidents = observedIncidents / reportingRate
// Heavy right tail due to uncertain reporting rate
```

### Domain-Specific Adjustments

Different domains have different reporting cultures:

| Domain | Estimated Reporting Rate |
|--------|--------------------------|
| Healthcare | 20-40% (regulated) |
| Finance | 30-50% (regulated) |
| Social media | 5-15% (less regulated) |
| Internal tools | 1-5% (rarely public) |

---

## Building Your Incident Tracking

### What to Track

For each incident:
1. **Date/Time**: When did it occur?
2. **System**: Which component(s) failed?
3. **Failure Mode**: What type of failure?
4. **Detection**: How/when was it detected?
5. **Damage**: Estimated cost/impact
6. **Root Cause**: Why did it happen?
7. **Resolution**: How was it fixed?

### Tracking Template

```markdown
## Incident Report #[ID]

**Date**: YYYY-MM-DD
**Severity**: Minor / Moderate / Major / Critical
**Status**: Open / Investigating / Resolved / Post-mortem

### Summary
[One-line description]

### Affected System(s)
- [Component 1]
- [Component 2]

### Timeline
- HH:MM - Issue detected
- HH:MM - Investigation started
- HH:MM - Root cause identified
- HH:MM - Resolution deployed

### Impact
- Users affected: [count]
- Estimated damage: $[amount]
- Damage type: [infrastructure / data / reputation / regulatory]

### Root Cause
[Description]

### Failure Mode Classification
- [ ] Incorrect output
- [ ] Bias/discrimination
- [ ] Privacy breach
- [ ] Security exploit
- [ ] Availability failure
- [ ] Physical harm
- [ ] Other: [specify]

### Contributing Factors
1. [Factor 1]
2. [Factor 2]

### Resolution
[What was done to fix it]

### Prevention
[What will prevent recurrence]
```

### Using Your Data

Quarterly analysis:
1. Calculate incident rate trends
2. Update harm mode probabilities
3. Compare to predictions
4. Revise model parameters

Annual analysis:
1. Full calibration check
2. Brier score for probability predictions
3. Damage prediction accuracy
4. Model revision if needed

---

## Resources

### Incident Databases
- [AI Incident Database](https://incidentdatabase.ai/)
- [AIAAIC Repository](https://www.aiaaic.org/aiaaic-repository)
- [CVE Database](https://cve.org/)
- [NIST AI RMF Resources](https://www.nist.gov/itl/ai-risk-management-framework)

### Analysis Tools
- [AIID Explorer](https://incidentdatabase.ai/apps/discover)
- Spreadsheet templates for incident tracking
- SQL queries for incident analysis

### Further Reading
- "Categorizing Variants of AI Incidents" (McGregor et al.)
- "Learning from AI Failures" (Yampolskiy)
- "Incident Response for ML Systems" (Google)
