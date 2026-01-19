---
title: "Historical Failures in Quantified Risk Management"
---

# Historical Failures in Quantified Risk Management

:::caution
Every domain studied has experienced catastrophic failures of quantified risk frameworks. These failures offer crucial lessons for AI safety.
:::

## Finance

**Long-Term Capital Management (1998)**: Collapse occurred despite sophisticated VaR models because:
- Models used only 2-3 years of history, missing regime changes
- Leverage amplified model errors to 25:1 on balance sheet and 100:1+ with derivatives

**2008 Financial Crisis** exposed VaR's limitations more broadly:
- UBS acknowledged "shortcuts" that excluded risks from calculations
- Models assumed normal distributions when reality had fat tails
- Correlations assumed stable became 1.0 during crisis
- Liquidity risk was unmodeled

**March 2020 risk parity drawdowns** (13-43% across funds) demonstrated vulnerability to simultaneous stock-bond declines violating historical correlation assumptions.

## Nuclear

**Three Mile Island (1979)** revealed inadequate human reliability modeling:
- Poor human-machine interfaces
- Operator errors overwhelmed equipment malfunctions

**Fukushima (2011)** demonstrated that beyond-design-basis external events can create common-cause failures:
- Defense-in-depth defeated when all barriers fail together
- "Regulatory capture" undermined safety culture

**Challenger (1986)** showed:
- Organizational pressure can override engineering judgment
- "Normalization of deviance" erodes safety margins

## Environment

**EU ETS Phase 1** failed because:
- Over-allocation based on poor emissions data
- Allowance prices collapsed to zero
- Initial budgets set using industry self-reports that systematically overstated emissions

## Pattern of Failures

Quantified risk frameworks fail when:

| Failure Mode | Examples | AI Safety Implication |
|--------------|----------|----------------------|
| Poor data quality | EU ETS Phase 1, LTCM | Capability evaluations may be incomplete |
| Missing regime changes | 2008 crisis | AI capabilities may jump discontinuously |
| Fat tails underestimated | VaR models | Catastrophic AI failures may be more likely than models suggest |
| Leverage amplifies errors | LTCM | AI systems may have multiplicative failure modes |
| Inadequate incentives | EU ETS self-reporting | Teams may underreport AI risks |
| Independence assumptions fail | Fukushima common-cause | AI components may fail together |
| Organizational culture | Challenger, regulatory capture | Safety culture may degrade under competitive pressure |
| Normalization of deviance | Challenger | Small safety violations accumulate |

## Lessons for AI Safety

1. **Data quality**: Risk budgeting is only as good as underlying measurements
2. **Regime changes**: Historical behavior may not predict future behavior
3. **Fat tails**: Plan for worst cases, not just expected cases
4. **Leverage**: Understand how errors multiply through the system
5. **Incentives**: Design for truthful reporting, not just compliance
6. **Independence**: Test whether components actually fail independently
7. **Culture**: Maintain safety culture under commercial pressure
8. **Deviance**: Don't normalize small safety violations

## The Meta-Lesson

:::danger
The most dangerous failure is believing your risk framework is complete. Every framework makes assumptions that will eventually be violated.
:::

AI safety must:

- Acknowledge model limitations explicitly
- Build in margins for unknown unknowns
- Test assumptions empirically
- Update frameworks as failures occur
- Maintain humility about quantification precision

## Key Takeaways

1. **Every framework fails eventually** — No risk model is complete
2. **Failure modes are predictable** — Data quality, regime changes, fat tails, leverage, incentives
3. **Culture matters as much as math** — Organizational pressure can override engineering judgment
4. **Small violations accumulate** — Normalization of deviance leads to catastrophe

## Next Steps

- **Learn from AI failures** → [Sydney Case Study](/case-studies/ai-systems/case-study-sydney/) shows what happens when constraints fail
- **See drift in action** → [Drift Case Study](/case-studies/ai-systems/case-study-drift/) demonstrates gradual degradation
- **Build better systems** → [Safety Mechanisms](/design-patterns/safety-mechanisms/) for defense in depth
- **Avoid common mistakes** → [Anti-Patterns](/case-studies/ai-systems/anti-patterns/) catalogs what not to do
