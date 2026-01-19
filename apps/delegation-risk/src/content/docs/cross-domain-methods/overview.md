---
title: "Quantified Risk Budgeting: A Cross-Domain Framework for AI Safety"
---

# Quantified Risk Budgeting: A Cross-Domain Framework for AI Safety

:::note[TL;DR]
Combine three established approaches: **Euler allocation** (finance) for decomposing risk to components, **fault trees** (nuclear) for flowing targets down hierarchically, and **mechanism design** (economics) for incentive-compatible reporting. Key insight: nuclear plants achieve **10⁻⁹ failure rates** using these methods—we may be able to adapt them for AI, though the application is novel.
:::

:::caution[Transferability Warning]
These methods were developed for their original domains (finance, nuclear, aerospace) and have varying track records there. **Whether they transfer well to AI systems is an open question.** Nuclear safety deals with well-characterized physical systems; AI systems are less predictable. Financial risk management had notable failures in 2008. We present these methods as *potentially useful starting points*, not as validated solutions for AI safety.
:::

The most promising path toward a risk budgeting framework for AI safety lies in combining **[Euler allocation](https://en.wikipedia.org/wiki/Euler%27s_homogeneous_function_theorem)** from finance, **[Safety Integrity Levels](https://en.wikipedia.org/wiki/Safety_integrity_level)** from nuclear/aerospace, and **[mechanism design](https://en.wikipedia.org/wiki/Mechanism_design)** from economics—three domains with decades of operational experience managing quantified risk hierarchically.

:::tip[Critical Insight]
Successful risk budgeting requires not just quantification, but compositional guarantees that component risks aggregate predictably and incentive structures that make honest reporting optimal.
:::

Finance uses risk decomposition across portfolios with the formula RC_i = x_i · ∂R/∂x_i (though this approach had notable failures in 2008); nuclear safety has demonstrated that system-level failure probability targets like **10⁻⁹ per flight hour** can flow down to components through [fault trees](https://en.wikipedia.org/wiki/Fault_tree_analysis); and mechanism design has established conditions under which truthful risk reporting can be made incentive-compatible through [VCG-style payments](https://en.wikipedia.org/wiki/Vickrey%E2%80%93Clarke%E2%80%93Groves_mechanism).

## Five Essential Characteristics

This cross-domain analysis reveals that mature risk budgeting frameworks share five essential characteristics that any AI safety adaptation must incorporate:

**1. Mathematically principled allocation mechanisms**—Euler decomposition in finance, [fault tree](https://en.wikipedia.org/wiki/Fault_tree_analysis) propagation in nuclear, [Shapley values](https://en.wikipedia.org/wiki/Shapley_value) in cooperative games—ensure that component risk budgets sum correctly to system-level totals. Ad-hoc allocation creates either gaps (total risk exceeds sum of budgets) or waste (budgets exceed actual risk capacity). For AI systems, this requires developing risk measures that are homogeneous of degree 1 in component contributions, enabling the partial derivative computations Euler allocation requires.

**2. Explicit compositional guarantees** must specify how risks combine. Nuclear safety's fault tree semantics (AND gates multiply, OR gates sum) and [ISO 26262](https://en.wikipedia.org/wiki/ISO_26262)'s [ASIL](https://en.wikipedia.org/wiki/Automotive_Safety_Integrity_Level) decomposition rules with independence verification provide templates. AI safety needs analogous formal semantics for how component capabilities, failure modes, and safety properties combine across architectural boundaries.

**3. Incentive-compatible reporting mechanisms** address the [information asymmetry](https://en.wikipedia.org/wiki/Information_asymmetry) between those closest to risks and those setting budgets. [VCG payments](https://en.wikipedia.org/wiki/Vickrey%E2%80%93Clarke%E2%80%93Groves_mechanism), [RAROC](https://en.wikipedia.org/wiki/Risk-adjusted_return_on_capital)-based compensation, and third-party verification all serve this function. For AI safety, this might involve safety-contingent procurement, independent red teams with authority to block deployment, or liability frameworks making development teams financially responsible for safety failures.

**4. Verification and audit infrastructure** must match framework sophistication. Nuclear's three lines of defense, aviation's MC/DC coverage requirements at DAL A, finance's backtesting with green/yellow/red zones, and carbon markets' MRV systems all provide independent confirmation that claimed risk levels match reality. AI safety verification remains the weakest link—current red-teaming and evaluation approaches lack the mathematical guarantees of formal verification and the operational track record of industrial safety audits.

**5. Conservative safety margins** buffer against model uncertainty and unknown unknowns. Pharmacology's 100-1000× uncertainty factors, nuclear's [defense-in-depth](https://en.wikipedia.org/wiki/Defence_in_depth) with multiple independent barriers, and [robust optimization](https://en.wikipedia.org/wiki/Robust_optimization)'s explicit "budget of uncertainty" all acknowledge that precise probability estimates are often unavailable. Rather than pretending to precision, effective frameworks embed substantial conservatism while enabling graduated response as uncertainties resolve.

## The Gap for AI Safety

:::caution[The Gap for AI]
The most significant gap between existing frameworks and AI safety needs lies in handling systematic failures rather than random hardware faults. Nuclear PRA, reliability allocation, and SIL calculations fundamentally assume independent random failures with known probability distributions. AI systems exhibit systematic failures—emergent capabilities, adversarial vulnerabilities, distributional shift—where independence assumptions fail and historical failure rates may not predict future behavior. Addressing this gap requires extending compositional verification methods, developing importance measures for systematic rather than random failures, and potentially adopting defense-in-depth architectures with diverse AI systems and human oversight as independent barriers rather than relying solely on quantified probabilities.

The theoretical apparatus exists: [linear logic](https://en.wikipedia.org/wiki/Linear_logic) for consumable risk budgets, [mechanism design](https://en.wikipedia.org/wiki/Mechanism_design) for truthful reporting, [Shapley allocation](https://en.wikipedia.org/wiki/Shapley_value) for principled distribution, [Markov categories](https://arxiv.org/abs/1908.07021) for compositional probability. The engineering challenge is instantiating these theories in practical frameworks with appropriate conservatism for the profound uncertainties inherent in novel AI systems.
:::

## Detailed Domain Analyses

### Available Now

- [Euler Allocation (Finance)](/cross-domain-methods/euler-allocation/) — Risk decomposition using partial derivatives
- [Nuclear Safety & Probabilistic Risk Assessment](/cross-domain-methods/nuclear-safety-pra/) — Fault trees and target flow-down
- [Mechanism Design for Truthful Reporting](/cross-domain-methods/mechanism-design/) — Incentive-compatible risk disclosure
- [Attack Surface & Capability Metrics](/cross-domain-methods/attack-surface-metrics/) — Quantifying AI system exposure
- [Historical Failures](/cross-domain-methods/lessons-from-failures/) — Lessons from past risk management breakdowns
- [ASIL Decomposition (Automotive)](/cross-domain-methods/asil-decomposition/) — ISO 26262 safety levels and decomposition rules
- [Linear Logic & Type Systems](/cross-domain-methods/linear-logic-types/) — Formal foundations for trust as a consumable resource
- [Carbon Budgets & Large-Scale Allocation](/cross-domain-methods/carbon-budgets/) — Lessons from global emissions allocation
- [Access Control Systems](/cross-domain-methods/access-control-systems/) — Intelligence community and enterprise software access patterns

### Planned Topics

The following topics are referenced in this framework but not yet written:

- Chance Constraints & Robust Optimization
- Safety Factors (Pharmacology)
- Emerging AI Safety Frameworks
- Compositional Safety Properties

---

:::note[Related: Modern Portfolio Theory]
Risk budgeting in finance originated from [Modern Portfolio Theory](https://en.wikipedia.org/wiki/Modern_portfolio_theory) (Markowitz, 1952), which formalized diversification as a risk management tool. The insight that portfolio risk isn't simply the sum of individual risks—but depends on correlations—directly applies to AI system design: component failures may be correlated, and diversification (N-version programming, diverse model architectures) reduces systemic risk.
:::

---

## Further Reading

### Financial Risk Management
- [Risk Budgeting](https://en.wikipedia.org/wiki/Risk_budgeting) — Wikipedia overview of financial risk allocation
- [Portfolio Optimization](https://en.wikipedia.org/wiki/Portfolio_optimization) — Mathematical foundations
- Jorion, P. (2006). *Value at Risk: The New Benchmark for Managing Financial Risk*. McGraw-Hill.

### Nuclear & Aerospace Safety
- [NRC Probabilistic Risk Assessment](https://www.nrc.gov/about-nrc/regulatory/risk-informed/pra.html) — Official NRC guidance
- [DO-178C](https://en.wikipedia.org/wiki/DO-178C) — Software considerations in airborne systems
- NUREG-1150 (1990). *Severe Accident Risks: An Assessment for Five US Nuclear Power Plants*.

### Mechanism Design
- Myerson, R.B. (1981). *Optimal Auction Design*. Mathematics of Operations Research.
- [Algorithmic Game Theory](https://en.wikipedia.org/wiki/Algorithmic_game_theory) — Wikipedia overview

### Formal Methods
- [Linear Logic](https://en.wikipedia.org/wiki/Linear_logic) — Resource-sensitive logic foundations
- [Category Theory](https://en.wikipedia.org/wiki/Category_theory) — Mathematical foundations for compositional reasoning

See the [full bibliography](/reference/bibliography/) for comprehensive references.
