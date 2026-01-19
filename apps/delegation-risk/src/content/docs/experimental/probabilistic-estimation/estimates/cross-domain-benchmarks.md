---
title: "Cross-Domain Benchmarks"
description: "Reference points from nuclear, aviation, finance, and other mature risk domains"
sidebar:
  order: 6
---

# Cross-Domain Benchmarks

Other industries have decades of experience quantifying and managing risk. This page provides reference points for calibrating AI delegation risk estimates.

## Why Cross-Domain Benchmarks?

AI risk quantification is new. Established industries provide:

1. **Calibration anchors**: What risk levels are achievable?
2. **Methodological guidance**: How do mature domains quantify risk?
3. **Regulatory precedents**: What standards do regulators accept?
4. **Cost-benefit data**: What does risk reduction cost?

---

## Nuclear Safety

### Key Metrics

| Metric | Definition | Typical Target | Best Achieved |
|--------|------------|----------------|---------------|
| **CDF** | Core Damage Frequency (per reactor-year) | < 10⁻⁴ | ~10⁻⁵ |
| **LERF** | Large Early Release Frequency | < 10⁻⁵ | ~10⁻⁶ |
| **SCRAM rate** | Emergency shutdowns per year | < 1 | ~0.5 |

### Risk Quantification Methods

```squiggle
// Fault tree analysis: AND/OR gates
// Top event probability = product/sum of basic events

// Example: Coolant system failure
pumps_fail = 10^-3           // per demand
valves_fail = 10^-4          // per demand
backup_fails = 10^-2         // conditional on primary failure

// With redundancy: P(both primary AND backup fail)
coolant_failure = pumps_fail * backup_fails + valves_fail * backup_fails
// ~10^-5 per demand
```

### AI Mapping

| Nuclear Concept | AI Analog | Typical AI Value |
|-----------------|-----------|------------------|
| CDF ~10⁻⁵/year | Critical system failure | ~10⁻²/year (needs improvement) |
| SCRAM ~0.5/year | Emergency human takeover | ~10/year (much higher) |
| Defense in depth | Layered verification | Partially implemented |
| Common cause failure | Correlated AI errors | Major concern |

**Insight**: Nuclear achieves 10⁻⁵ failure rates through:
- Extensive redundancy
- Formal safety analysis
- Continuous monitoring
- Strong safety culture

AI systems are ~1000× less reliable for critical failures.

---

## Aviation Safety

### Key Metrics

| Metric | Definition | Current Level |
|--------|------------|---------------|
| **Fatal accident rate** | Per million flights | ~0.2 |
| **Catastrophic failure** | Per flight hour | < 10⁻⁹ |
| **Software criticality** | DO-178C Level A | ~10⁻⁹ per hour |

### Software Assurance Levels (DO-178C)

| Level | Failure Condition | Probability Target | AI Equivalent |
|-------|-------------------|-------------------|---------------|
| **A** | Catastrophic | < 10⁻⁹ | Safety-critical autonomous |
| **B** | Hazardous | < 10⁻⁷ | Mission-critical AI |
| **C** | Major | < 10⁻⁵ | Important AI functions |
| **D** | Minor | < 10⁻³ | Convenience features |
| **E** | No effect | No requirement | Internal tools |

### Verification Requirements by Level

| Level | MC/DC Coverage | Reviews | Testing |
|-------|----------------|---------|---------|
| A | 100% | Formal | Exhaustive |
| B | 100% | Independent | Extensive |
| C | Statement | Peer | Moderate |
| D | - | Self | Basic |

**AI Implication**: Most AI systems would not pass Level C requirements, let alone Level A.

### Failure Rate Calibration

```squiggle
// Commercial aviation: ~0.2 fatal accidents per million flights
// Flight duration: ~2 hours average
// Fatal accident rate: ~10⁻⁷ per flight hour

// AI task: ~1000 tokens, ~30 seconds
// To match aviation safety:
// AI critical failure rate should be < 10⁻⁷ × (30/3600) ≈ 10⁻⁹ per task
// This is far below current AI reliability

// Realistic AI critical failure: ~10⁻⁴ per task
// Gap: ~100,000× worse than aviation
```

---

## Financial Risk Management

### Value at Risk (VaR)

```squiggle
// VaR: Maximum loss at confidence level over time horizon
// Example: 1-day 99% VaR = $1M means
// P(loss > $1M in one day) < 1%

// For AI delegation risk:
delegationVaR(confidence, horizon) = {
  // Quantile of risk distribution
  return quantile(riskDistribution, confidence) * horizon
}

// Example: 30-day 95% VaR for AI system
// If monthly risk ~ lognormal(log(1000), 1.0)
// 95th percentile ≈ $5,000/month
```

### Expected Shortfall (ES)

```squiggle
// ES: Average loss given loss exceeds VaR
// Better captures tail risk than VaR

// ES = E[Loss | Loss > VaR]

// For heavy-tailed AI damages:
// If VaR_95 = $5,000
// ES_95 might be $15,000 (tail is 3× the threshold)
```

### Risk Budgeting Principles

| Principle | Financial Application | AI Application |
|-----------|----------------------|----------------|
| **Risk parity** | Equal risk per asset | Equal risk per component |
| **Marginal contribution** | Risk added by position | Risk added by capability |
| **Euler allocation** | Total = sum of contributions | Budget = sum of component risks |

---

## Healthcare Safety

### Medical Error Rates

| Category | Rate | Source |
|----------|------|--------|
| Diagnostic errors | 10-15% | Meta-analyses |
| Medication errors | 1-2% of administrations | Hospital data |
| Surgical complications | 3-17% | Procedure-dependent |
| Preventable adverse events | 2-4% of hospitalizations | IOM estimates |

### AI Calibration Points

```squiggle
// Human diagnostic accuracy: ~85-90%
// AI triage should match or exceed: > 90%

// Human medication error: ~1.5%
// AI dosing recommendations should be: < 0.5%

// False negative rate (miss serious condition)
// Human: ~5-10%
// AI should be: < 2% (higher bar for safety-critical)
```

### Regulatory Standards

| Standard | Requirement | AI Mapping |
|----------|-------------|------------|
| FDA 510(k) | Substantial equivalence | Match human performance |
| FDA De Novo | Novel with reasonable assurance | Exceed human + demonstrate safety |
| FDA PMA | Highest scrutiny | Extensive clinical evidence |

---

## Cybersecurity

### Breach Statistics

| Metric | Value | Source |
|--------|-------|--------|
| Average breach cost | $4.45M | IBM 2023 |
| Mean time to identify | 204 days | IBM 2023 |
| Mean time to contain | 73 days | IBM 2023 |
| Breaches with AI involvement | Growing | Emerging |

### Attack Success Rates

```squiggle
// Phishing click rate: 3-5%
// Successful exploitation given click: 20-40%
// End-to-end compromise rate: ~1-2%

// AI-assisted attacks may have higher success:
aiAssistedAttack_success = baseRate * 2-5×
// ~2-10% success rate

// Defense evasion by AI:
// Traditional filters catch: 80-90%
// Against AI-crafted content: 40-60%
```

---

## Software Engineering

### Defect Rates

| Quality Level | Defects per KLOC | Industry |
|---------------|------------------|----------|
| Typical commercial | 15-50 | General |
| High-quality | 5-10 | Well-tested |
| Safety-critical | 0.5-2 | Aerospace, medical |
| Best-in-class | < 0.1 | NASA, formal methods |

### Testing Effectiveness

```squiggle
// Defect detection by method:
codeReview_detection = beta(50, 50)    // ~50%
unitTest_detection = beta(40, 60)      // ~40%
integrationTest_detection = beta(45, 55) // ~45%
systemTest_detection = beta(35, 65)    // ~35%

// Combined (with overlap):
combined_detection = 1 - (1-0.5)*(1-0.4)*(1-0.45)*(1-0.35)
// ~88% detection rate

// Residual defects: ~12% escape to production
```

---

## Comparison Table

| Domain | Critical Failure Target | Achieved | AI Current | Gap |
|--------|------------------------|----------|------------|-----|
| Nuclear | 10⁻⁵/year | 10⁻⁵ | 10⁻²/year | 1000× |
| Aviation | 10⁻⁹/hour | 10⁻⁷ | 10⁻⁴/hour | 1000× |
| Medical devices | 10⁻⁶/use | 10⁻⁵ | 10⁻³/use | 100× |
| Financial trading | 10⁻⁴/day | 10⁻³ | 10⁻²/day | 10× |
| General software | 10⁻³/operation | 10⁻² | 10⁻¹/operation | 10× |

---

## Implications for AI Delegation Risk

### Short-Term (1-3 years)
- AI reliability similar to general software (~10⁻²)
- Appropriate for low-stakes, human-in-loop applications
- Need extensive monitoring and fallback

### Medium-Term (3-7 years)
- Target financial-grade reliability (~10⁻³ to 10⁻⁴)
- Suitable for moderate-stakes with verification
- Formal methods for critical paths

### Long-Term (7+ years)
- Target medical-device-grade (~10⁻⁵ to 10⁻⁶)
- Required for safety-critical autonomous systems
- May require fundamental advances

### Likely Never (without breakthrough)
- Aviation/nuclear-grade (~10⁻⁹)
- Uncertain if achievable with current approaches
- May require formal verification of AI systems

---

## Methodological Imports

### From Nuclear: Probabilistic Risk Assessment
- Fault trees and event trees
- Common cause failure analysis
- Importance measures (Fussell-Vesely, Risk Achievement Worth)

### From Aviation: Assurance Levels
- Criticality classification
- Verification requirements scaling
- Independence requirements

### From Finance: Portfolio Theory
- Risk aggregation
- Diversification benefits
- Coherent risk measures

### From Healthcare: Clinical Validation
- Prospective studies
- Sensitivity/specificity tradeoffs
- Subgroup analysis

### From Cybersecurity: Threat Modeling
- Attack surface analysis
- Defense in depth
- Assume breach mentality
