---
title: "Decision Framework"
description: "When is diversity worth the cost? Making practical trade-offs"
sidebar:
  order: 6
---

# Decision Framework

Reducing correlation has costs. This page provides frameworks for deciding when and how much to invest in diversity.

---

## The Core Trade-off

```
Investment = Cost(adding diverse component)
Return = Risk_reduction × Value_at_stake

Invest when: Return > Investment
```

But both sides of this equation are difficult to estimate:
- Costs are tangible (money, complexity, latency)
- Benefits are probabilistic (reduced risk of rare events)
- Value at stake depends on scenario

This framework provides structured approaches to navigating this trade-off.

---

## Stakes × Correlation Matrix

Use current correlation level and stakes to determine action:

| Stakes | Correlation Low (<0.3) | Correlation Medium (0.3-0.5) | Correlation High (>0.5) |
|--------|------------------------|------------------------------|-------------------------|
| **Low** | ✅ Accept | ✅ Accept | ⚠️ Consider monitoring |
| **Medium** | ✅ Accept with monitoring | ⚠️ Add one orthogonal check | ⚡ Invest in diversity |
| **High** | ⚠️ Verify estimate; add monitoring | ⚡ Significant investment | 🚨 **Major redesign required** |
| **Existential** | ⚡ Assume worst-case | 🚨 Assume worst-case | 🚨 **Stop until resolved** |

### Interpreting the Matrix

- **✅ Accept**: Current architecture is adequate for the risk level
- **⚠️ Consider/Verify**: Investigate further, add monitoring, or make targeted improvements
- **⚡ Invest**: Allocate resources to diversification
- **🚨 Major action**: This is a serious problem requiring significant intervention

### Defining Stakes Levels

| Level | Definition | Examples |
|-------|------------|----------|
| **Low** | Mistakes are cheap and reversible | Draft generation, internal tools, prototypes |
| **Medium** | Mistakes cause meaningful cost but are recoverable | Customer-facing features, financial transactions < $10K |
| **High** | Mistakes cause serious harm, partially recoverable | Production deployments, medical recommendations, legal advice |
| **Existential** | Mistakes could be catastrophic or irreversible | Safety-critical systems, actions affecting many people, irreversible decisions |

---

## Costs of Diversity

### Direct Costs

| Cost Type | Description | Typical Range |
|-----------|-------------|---------------|
| **Multiple vendors** | Contracts, integration, relationship management | 2-5× single vendor |
| **Diverse expertise** | Specialists for each approach | 1.5-3× homogeneous team |
| **Integration complexity** | Making different systems work together | 20-50% additional dev time |
| **Operational overhead** | Monitoring, maintaining multiple systems | 1.5-2× single system |
| **Latency** | Additional verification steps take time | +50-200ms per layer |

### Indirect Costs

| Cost Type | Description | Mitigation |
|-----------|-------------|------------|
| **Coordination overhead** | Different systems must agree on interfaces | Strong contracts, versioning |
| **Conflicting results** | Different methods may disagree | Clear escalation rules |
| **Lowest common denominator** | Output constrained by weakest link | Weight by reliability |
| **Expertise fragmentation** | No one understands the whole system | Documentation, cross-training |
| **Debugging difficulty** | Harder to trace issues across diverse components | Comprehensive logging |

### Cost Estimation Framework

```
Total Diversity Cost =
    (Vendor costs × number of vendors) +
    (Personnel cost × expertise breadth) +
    (Dev time × integration complexity factor) +
    (Ops cost × number of systems) +
    (Latency cost × latency sensitivity)

Example:
- 3 vendors at $50K/year each = $150K
- 2 additional specialists at $200K = $400K
- 6 months integration at $50K/month = $300K
- 3× ops overhead at $100K = $100K additional
- 200ms latency acceptable = $0

Total: ~$950K first year, ~$650K ongoing
```

---

## Benefits of Diversity

### Risk Reduction Calculation

```
Risk = P(threat) × P(all defenses fail | threat) × Impact

Without diversity (high correlation):
P(all fail) ≈ P(one fails) = 0.1

With diversity (low correlation):
P(all fail) ≈ P(one fails)^N = 0.1^3 = 0.001

Risk reduction factor = 100×
```

### Value of Correlation Tax Reduction

```
Expected Loss = Risk × Impact

Before:
- Risk: 5% (high correlation)
- Impact: $10M
- Expected Loss: $500K/year

After diversity investment:
- Risk: 0.1% (low correlation)
- Impact: $10M
- Expected Loss: $10K/year

Value of diversity: $490K/year in reduced expected loss
```

### Non-Monetary Benefits

| Benefit | Value | Notes |
|---------|-------|-------|
| Reputational protection | High | One major incident can cost years of trust |
| Regulatory compliance | Variable | Some industries require diversity |
| Sleep at night | Priceless | Confidence in system robustness |
| Organizational learning | Medium | Diverse approaches bring diverse insights |
| Incident response | High | More options when one system fails |

---

## When to Accept Correlation

Correlation is acceptable when:

### 1. Prototyping and Early Development
- Learning what works
- Requirements still evolving
- Stakes genuinely low

**Transition point**: When moving from prototype to production, reassess correlation.

### 2. Low Stakes
- Mistakes are cheap
- Quick recovery possible
- Limited blast radius

**Watch for**: Scope creep that increases stakes without reassessing architecture.

### 3. Homogeneous Threat Model
- All threats come from same source (rare in practice)
- One type of verification genuinely sufficient
- Attack surface is narrow

**Caution**: Threat models often underestimate diversity of threats.

### 4. Cost-Prohibitive Diversity
- Diverse approaches don't exist
- Cost truly exceeds benefit
- Better to have correlated protection than none

**But**: Revisit as new approaches become available.

### 5. Explicit Risk Acceptance
- Stakeholders informed of correlation
- Residual risk formally accepted
- Compensating controls in place (e.g., insurance)

**Document**: Risk acceptance decisions for future reference.

---

## When Correlation Is Unacceptable

Correlation is unacceptable when:

### 1. Safety-Critical Systems
- Human life or safety at stake
- Healthcare decisions
- Infrastructure control
- Weapons systems

**Standard**: Assume worst-case correlation; require fundamentally different methods.

### 2. Irreversible Actions
- Deletions that can't be undone
- Financial transfers
- Public communications
- Physical actions

**Standard**: Correlation tax of 10× or less; human oversight for high-stakes.

### 3. Adversarial Environments
- Sophisticated attackers expected
- Nation-state threat models
- High-value targets

**Standard**: Assume attackers will find and exploit correlations.

### 4. High-Value Targets
- Financial systems with large exposure
- Critical infrastructure
- Widely-used platforms

**Standard**: Worth attacker's investment to find correlated weaknesses.

### 5. Regulatory Requirements
- Industry standards require diversity
- Audit requirements
- Compliance obligations

**Standard**: Meet or exceed regulatory requirements.

---

## Decision Process

### Step 1: Assess Stakes

```
Questions:
- What's the worst-case outcome if all verification fails?
- Is the outcome reversible?
- How many people/dollars affected?
- What's the reputational impact?

Stakes Level: [ Low | Medium | High | Existential ]
```

### Step 2: Estimate Current Correlation

```
Questions:
- Do verification layers use the same provider?
- Were they designed by the same team?
- Do they share training data or methodology?
- Can red team find inputs that evade multiple layers?

Evidence-based correlation estimate: ___
Confidence in estimate: [ Low | Medium | High ]
```

### Step 3: Consult Matrix

```
Stakes: ___
Correlation: ___
Matrix recommendation: ___
```

### Step 4: Cost-Benefit Analysis

```
If matrix recommends investment:

Estimated cost: $___
Estimated risk reduction: ___ %
Value of risk reduction: $___
ROI: ___

Proceed? [ Yes | No | Need more information ]
```

### Step 5: Implementation Planning

```
If proceeding:

Priority interventions:
1. ___
2. ___
3. ___

Timeline: ___
Resources: ___
Success metrics: ___
Review date: ___
```

---

## Special Cases

### Uncertainty About Correlation

When you're uncertain about correlation level:

```
Conservative approach:
- Assume correlation is one level higher than estimated
- Verify before assuming independence
- Treat "I don't know" as "probably correlated"

When to investigate further:
- Stakes are Medium or higher
- Correlation estimate confidence is Low
- System is changing rapidly
```

### Rapidly Changing Systems

When the system is evolving quickly:

```
Risks:
- New connections added without review
- Optimizations introduce coupling
- Team changes affect organizational diversity

Mitigations:
- Architecture review gates
- Automated correlation monitoring
- Regular re-assessment schedule
- "Coupling budget" with explicit limits
```

### Resource Constraints

When ideal diversity isn't affordable:

```
Prioritization framework:
1. Highest-stakes components first
2. Highest-correlation pairs first
3. Cheapest interventions first
4. Monitoring before mitigation

Partial measures:
- Diverse monitoring even if execution is homogeneous
- Human oversight at critical points
- Strong rollback capabilities
- Incident response preparation
```

---

## Summary

```
Decision Heuristics:

1. When in doubt, assume correlation is higher than it appears
2. Stakes determine how much correlation is acceptable
3. Diversity has costs—don't over-engineer low-stakes systems
4. Some correlation is irreducible—know your limits
5. Document risk acceptance decisions
6. Reassess when stakes, system, or threat model change
```

---

See also:
- [Solutions](/entanglements/mitigation/solutions/) - How to reduce correlation
- [Modeling](/entanglements/detection/modeling/) - Quantifying correlation
- [Examples](/entanglements/case-studies/examples/) - Decisions in practice
