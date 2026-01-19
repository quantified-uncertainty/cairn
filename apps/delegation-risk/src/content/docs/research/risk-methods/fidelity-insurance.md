---
title: "Fidelity Insurance: Pricing Defection Risk"
sidebar:
  order: 10
---

# Fidelity Insurance: Pricing Defection Risk

:::note[TL;DR]
Fidelity insurance (crime insurance, employee dishonesty bonds) is a mature market that prices defection risk. Premiums are typically 0.3-2% of coverage, reduced significantly by control systems. Political fidelity insurance doesn't exist due to adverse selection and moral hazard, but the theoretical design space is interesting. Dynamic, control-linked insurance products could create tighter feedback loops between delegation risk and pricing.
:::

This document explores the insurance industry's approach to pricing "bad actor" risk—directly relevant to the delegation accounting framework. If we can price defection risk actuarially, we can make delegation balance sheets more precise.

---

## Part 1: The Existing Market

### 1.1 Primary Product Categories

**Employee Dishonesty / Fidelity Bonds**

The core product covering theft, fraud, and embezzlement by employees.

| Attribute | Typical Range |
|-----------|---------------|
| Coverage limits | $50K - $5M+ |
| Annual premium | 0.3% - 2% of coverage |
| Deductible | $1K - $50K |
| Required controls | Background checks, dual controls, segregation of duties |

**Example pricing**: A $1M policy for a small organization with minimal controls costs ~$2,000-3,000/year. With strong controls, this drops to ~$600-1,000/year.

**Directors & Officers (D&O) Liability**

Covers wrongful acts by leadership, including fraud, self-dealing, and breach of fiduciary duty.

| Attribute | Typical Range |
|-----------|---------------|
| Coverage limits | $1M - $100M+ |
| Annual premium | $2K - $15K for $1M (small org) |
| Key exclusions | Criminal acts (usually), prior known claims |
| Critical for | Nonprofits, startups (protects personal assets) |

**Cyber Crime / Social Engineering**

Growing category covering wire transfer fraud, invoice manipulation, phishing attacks.

| Attribute | Typical Range |
|-----------|---------------|
| Coverage limits | $100K - $10M |
| Annual premium | $1K - $20K+ |
| Key exclusions | Voluntary transfers (tricky with social engineering) |
| Evolution | Insurers learned painful lessons 2015-2020 |

---

### 1.2 Why This Is Actually Insurable

Contrary to intuition, defection risk has favorable properties for insurance:

**Actuarial data exists**
- Decades of claims history from commercial insurers
- FBI Uniform Crime Reports provide baseline theft rates
- Association of Certified Fraud Examiners publishes biennial studies

**Moral hazard is manageable**
- Required controls as policy conditions
- Regular audits verify compliance
- Deductibles ensure skin in the game

**Limited correlation**
- Employee theft doesn't cluster like natural disasters
- Economic downturns increase theft, but effect is modest (~20-30% increase)
- Not catastrophically correlated (unlike pandemic, earthquake)

**Recovery infrastructure exists**
- Forensic accounting recovers ~30-40% of fraud losses
- Criminal restitution adds additional recovery
- Subrogation allows insurers to pursue perpetrators

**The Fundamental Equation**

```
Premium = (Base Rate × Coverage) × Risk Multipliers × Control Discounts + Expense Loading

where:
  Base Rate ≈ 0.5-1% (reflects historical loss ratio)
  Risk Multipliers = f(industry, employee count, cash handling, prior claims)
  Control Discounts = 0.3-0.7 (strong controls → big discount)
  Expense Loading ≈ 20-30% (admin, investigation reserves)
```

---

### 1.3 Key Limitations and Exclusions

**Standard exclusions (~90% of policies):**

| Exclusion | Rationale |
|-----------|-----------|
| Known bad actors | Can't insure pre-existing fraud |
| Acts by owners/principals | Moral hazard too severe |
| Failure to prosecute | Requires criminal charges to claim |
| Collusion with insured | Prevents insurance fraud |
| Inventory shrinkage (general) | Too hard to prove employee theft vs. other loss |

**Underwriting friction:**
- Extensive questionnaires about internal controls
- Background check requirements for covered employees
- May require audited financials
- Higher premiums (or denial) for prior claims
- Annual control attestations

---

## Part 2: Control Systems and Pricing

### 2.1 The Control-Premium Relationship

This is directly relevant to delegation accounting: **better controls = lower exposure = lower premiums**.

**Tier 1 Controls (10-30% premium reduction)**

| Control | Mechanism | Detection Rate |
|---------|-----------|----------------|
| Segregation of duties | Different people authorize, execute, record | High |
| Dual signatures | Required for transactions >$X | High |
| Mandatory vacation | Forces job rotation, catches ongoing fraud | Medium |
| Background checks | Criminal, credit, reference verification | Medium |

**Tier 2 Controls (additional 10-20%)**

| Control | Mechanism | Detection Rate |
|---------|-----------|----------------|
| External audits | CPA reviews annually minimum | High |
| Reconciliation procedures | Daily cash counts, monthly bank recs | High |
| Access controls | Time-locked safes, multi-person vault | Medium |
| Surveillance | Cameras in cash-handling areas | Medium |

**Tier 3 Controls (additional 5-15%)**

| Control | Mechanism | Detection Rate |
|---------|-----------|----------------|
| Universal bonding | All employees bonded, not just high-risk | Medium |
| Anonymous hotline | Operational fraud tipline | High (tips catch ~40% of fraud) |
| Regular training | Annual fraud awareness refreshers | Low-Medium |
| IT audit trails | Complete logging for financial systems | High |

**Tier 4 / Extreme Controls (additional 5-10%, diminishing returns)**

| Control | Mechanism | Detection Rate |
|---------|-----------|----------------|
| Biometric access | Fingerprint/retina for financial systems | High |
| Real-time monitoring | AI/ML fraud detection | Medium-High |
| Third-party escrow | For large transactions | Very High |
| Blockchain audit trails | Immutable transaction records | Very High |

### 2.2 The Optimization Problem

```
Total Cost = Premium + Control Implementation + Control Maintenance + Expected Uninsured Loss

Optimize where: d(Total Cost)/d(Control Investment) = 0
```

**Practical breakpoints:**

| Organization Size | Optimal Control Level | Reasoning |
|-------------------|----------------------|-----------|
| <$500K budget | Tier 1 only | Control costs exceed premium savings |
| $500K-$2M budget | Tier 1 + partial Tier 2 | External audit may be +EV |
| $2M-$10M budget | Tier 1-2 + partial Tier 3 | Hotline, training worthwhile |
| >$10M budget | Full Tier 1-3 | All controls +EV for insurance alone |

**The catch**: Tier 4 controls are rarely +EV purely for premium reduction. They're justified by:
- Regulatory requirements
- Reputational protection
- Deterrence beyond insured losses
- Grant/contract requirements

### 2.3 Dynamic Considerations

**Substitution effects**: Strong controls on cash → fraud shifts to procurement, travel expenses, phantom vendors. Insurers learned this and now require holistic control environments.

**Control decay**: Controls degrade over time as people find workarounds. Insurers assume ~10-20% annual decay without refresher training and audits.

**Moral hazard from insurance**: Better coverage → less vigilant monitoring. Optimal contracts include:
- Deductibles (skin in the game)
- Coverage caps (catastrophic only)
- Co-insurance provisions (insured bears percentage)
- Required control maintenance

---

## Part 3: Political Fidelity Insurance

### 3.1 Why This Market Doesn't Exist

Direct insurance against politician fraud is essentially non-existent. The theoretical barriers:

**Adverse selection dominates**

| Politician Type | Willingness to Buy | Effect |
|-----------------|-------------------|--------|
| Clean politicians | Low (overpaying for risk they won't create) | Exit market |
| Corrupt politicians | High (cheap money laundering) | Dominate market |
| Result | Only bad risks remain | Market collapse |

**Moral hazard is catastrophic**
- Insurance removes personal deterrent effect
- Politician knows they're covered → more willing to steal
- Unlike employee theft, politician controls enforcement

**Principal-agent problem**
- Who's the beneficiary? Taxpayers can't contract with politician
- If politician is beneficiary, they profit from their own fraud
- Government as beneficiary creates circular incentives

**Enforcement nightmare**
- Proving "fraud" requires conviction
- Politicians influence prosecution
- Long delays between act and conviction
- Statutes of limitations

### 3.2 What Actually Exists

**Campaign liability insurance**
- Covers campaign staff errors and omissions
- Does NOT cover candidate fraud
- Protects against volunteer mistakes, event injuries

**Government official surety bonds**
- Some jurisdictions require for treasurers, tax collectors
- Surety (guarantor) pays, then recovers from official
- This is NOT insurance—official still owes the money
- Functions as credit enhancement, not risk transfer

**D&O for appointed officials**
- Covers negligence and honest mistakes
- Explicitly excludes fraud and criminal acts
- Protects against lawsuit defense costs

### 3.3 Theoretical Design Space

If you wanted to design political fidelity insurance, what would it look like?

**Beneficiary structure options:**

| Structure | Mechanism | Problems |
|-----------|-----------|----------|
| Taxpayer fund | Insurance pays government treasury | Politician doesn't care (not their money) |
| Bond market | Municipal bond insurers pay bondholders | Incentivizes bondholder monitoring, but limited scope |
| Escrow/bond posting | Politician posts bond, forfeits on conviction | Functions as delayed compensation, not insurance |
| Victim restitution | Insurance pays fraud victims directly | Verification nightmare, coverage scope unclear |

**Pricing impossibility:**

| Parameter | Estimate | Uncertainty |
|-----------|----------|-------------|
| Baseline corruption charge rate | 2-5% of politicians | High variance by jurisdiction |
| Conviction rate if charged | 60-70% | Varies by offense type |
| Average theft amount | Bimodal: $10K vs $10M+ | Extreme variance |
| Detection rate | 20-40% of fraud detected | Very uncertain |

**Implied pricing:**
- Actuarially fair premium: ~1-3% of coverage annually
- With adverse selection adjustment: 10-20%+
- At 20% premium, corrupt politician stealing $1M pays $200K for $800K net—still profitable
- No equilibrium exists where clean politicians participate

### 3.4 Better Mechanisms Than Insurance

**Performance bonds (infrastructure model)**
- Contractor posts bond for project completion
- Third-party surety monitors performance
- Works because completion is observable
- Applicable: Politician posts bond, forfeits if convicted

**Clawback provisions (executive comp model)**
- Deferred compensation recovered if fraud discovered
- Pension forfeiture for convicted officials
- Many jurisdictions have these laws
- Problem: Enforcement is discretionary

**Prediction markets**
- Bet on whether official will be convicted within N years
- Information aggregation, not insurance
- Legal in some jurisdictions for research
- Example: Polymarket has had markets on politician investigations

**Escrow mechanisms**
- Politician's salary held in escrow for N years post-service
- Released only if no conviction
- Creates substantial contingent liability without insurance

---

## Part 4: Research Literature

### 4.1 Actuarial Foundations

**Association of Certified Fraud Examiners (ACFE)**

The ACFE's biennial *Report to the Nations* is the primary data source on occupational fraud:

| Finding | Value | Implication |
|---------|-------|-------------|
| Median loss per case | ~$117,000 | Significant but insurable |
| Median duration before detection | 12 months | Controls that accelerate detection are valuable |
| Tip-based detection | ~40% of cases | Hotlines are highly effective |
| Internal audit detection | ~15% of cases | Audits catch less than expected |
| Owner/executive fraud | 5× higher losses than employee fraud | But harder to insure |

**Key papers:**

- Holtfreter, K. (2005). "Is occupational fraud 'typical' white-collar crime?" *Journal of Criminal Justice*. — Demographic analysis of fraud perpetrators
- Hollow, M. (2014). "Money, Morals and Motives: An Exploratory Study into Why Bank Employees Commit Fraud." *Journal of Financial Crime*. — Qualitative analysis of rationalization
- Murphy, P. (2012). "Attitude, Machiavellianism and the rationalization of misreporting." *Accounting, Organizations and Society*. — Why people convince themselves fraud is acceptable

### 4.2 Insurance Economics

**Moral hazard and adverse selection:**

- Rothschild, M. & Stiglitz, J. (1976). "Equilibrium in Competitive Insurance Markets." *QJE*. — Foundation of adverse selection theory
- Shavell, S. (1979). "On Moral Hazard and Insurance." *QJE*. — Optimal insurance under moral hazard
- Winter, R. (2000). "Optimal Insurance Under Moral Hazard." *Handbook of Insurance*. — Comprehensive treatment

**Crime insurance specifically:**

- Boyer, M. (2007). "Resistance (to fraud) is futile." *Journal of Risk and Insurance*. — Models optimal enforcement vs. insurance
- Dionne, G. & Wang, K. (2013). "Does insurance fraud in automobile insurance increase claims?" *Journal of Risk and Uncertainty*. — Empirical evidence on moral hazard in fraud contexts

### 4.3 Political Economy

**Corruption pricing:**

- Mauro, P. (1995). "Corruption and Growth." *QJE*. — Cross-country evidence on corruption costs
- Fisman, R. (2001). "Estimating the Value of Political Connections." *AER*. — Uses firm values to price political relationships
- Khwaja, A. & Mian, A. (2005). "Do Lenders Favor Politically Connected Firms?" *QJE*. — Banks price political connections into loans

**The "selectorate theory" framing:**

Bueno de Mesquita et al.'s *The Logic of Political Survival* (2003) provides a framework where politician behavior is predictable based on:
- Size of selectorate (who could potentially support leader)
- Size of winning coalition (who actually keeps leader in power)
- Private vs. public goods provision

This maps to insurance: smaller winning coalitions → more extraction → higher "premiums" would be needed.

### 4.4 Mechanism Design

**Relevant theory:**

- Holmström, B. (1979). "Moral Hazard and Observability." *Bell Journal of Economics*. — Optimal contracts under partial observability
- Tirole, J. (1986). "Hierarchies and Bureaucracies." *Journal of Law, Economics, & Organization*. — Delegation chains and information
- Aghion, P. & Tirole, J. (1997). "Formal and Real Authority in Organizations." *JPE*. — When delegation is optimal despite agency costs

**Corruption-specific mechanism design:**

- Becker, G. & Stigler, G. (1974). "Law Enforcement, Malfeasance, and Compensation of Enforcers." *JLE*. — Efficiency wages as corruption prevention
- Mookherjee, D. & Png, I. (1995). "Corruptible Law Enforcers." *RAND Journal of Economics*. — Optimal monitoring under corruption risk

---

## Part 5: Novel Insurance Structures

### 5.1 Parametric Triggers

Traditional insurance requires proving a specific fraud occurred. Parametric insurance pays based on observable indices:

**Potential design:**

| Trigger | Threshold | Payout |
|---------|-----------|--------|
| "Financial irregularity index" | >2 standard deviations | Automatic |
| Audit findings count | >N material findings | Scaled |
| Whistleblower reports | Verified reports >X | Per-report |
| Forensic accounting score | Below threshold | Automatic |

**Advantages:**
- Eliminates investigation costs
- Faster payout
- Less litigation
- Objective triggers

**Disadvantages:**
- Gaming the index
- False positives
- Index construction is hard
- May not cover actual losses

### 5.2 Prediction Market Hybrid

Premium adjusts based on internal prediction market on fraud risk:

```
Premium_t = Base_Premium × f(Market_Probability_of_Fraud_t)

where Market_Probability comes from internal betting market
```

**Mechanism:**
- Employees bet on whether fraud will be discovered in next N months
- Betting reveals private information
- Premium adjusts in real-time
- Information aggregation + incentive alignment

**Challenges:**
- Manipulation (bet against, then report)
- Thin markets in small organizations
- Legal/regulatory issues
- Cultural acceptance

### 5.3 Mutual Insurance Cooperatives

Industry peers cross-insure each other:

**Structure:**
- Pool of similar organizations contributes to fund
- Claims paid from pool
- Surplus returned as dividends
- Members have information advantages over commercial insurers

**Existing examples:**
- Credit union leagues (mutual fidelity coverage)
- Church denominations (clergy misconduct pools)
- Trade associations (industry-specific risks)

**Advantages:**
- Better information sharing
- Aligned incentives (peers monitor each other)
- Lower overhead than commercial carriers
- Specialized underwriting expertise

**Disadvantages:**
- Limited capital for large losses
- Correlation risk within industry
- Governance challenges
- Adverse selection within pool

### 5.4 Dynamic/Real-Time Pricing

Insurance that adjusts continuously based on observed risk indicators:

**Data inputs:**
- Access pattern anomalies (from IT systems)
- Transaction velocity changes
- Segregation of duties violations
- Employee sentiment indicators
- Financial ratio changes

**Mechanism:**
```
Premium_daily = Base × Σ(Risk_Factor_i × Weight_i)

where Risk_Factors update daily based on telemetry
```

**Enabling technologies:**
- API integration with financial systems
- ML anomaly detection
- Real-time audit trail analysis
- Behavioral analytics

**Current status:**
- Cyber insurance moving this direction (Coalition, Corvus)
- Fidelity insurance lags (data integration harder)
- Regulatory barriers in some jurisdictions

---

## Part 6: Implications for Delegation Accounting

### 6.1 Pricing Delegation Risk

The insurance market provides **market prices** for defection risk. This makes delegation balance sheets more concrete:

| Balance Sheet Item | Insurance Analog | Market Price |
|--------------------|------------------|--------------|
| Exposure (theft) | Fidelity bond premium | 0.3-2% of coverage |
| Exposure (executive fraud) | D&O premium | 0.2-1.5% of coverage |
| Contingent liability (if caught) | Policy limits + exclusions | Defines maximum recovery |

**Example**: Alice delegating $1M to Bob

If Alice can buy fidelity coverage at 0.5% ($5,000 premium):
- Market is pricing Bob's defection risk at ~$5,000 expected
- This is Alice's **insurable exposure**
- Uninsurable exposure (coverage exclusions) adds to this

### 6.2 Control Investment as Exposure Reduction

The control-premium relationship maps directly to delegation accounting:

| Control Investment | Premium Reduction | Implied Exposure Reduction |
|--------------------|-------------------|---------------------------|
| $0 (baseline) | 0% | 0% |
| $5K (Tier 1 controls) | 25% | 25% |
| $15K (Tier 1-2) | 45% | 45% |
| $30K (Tier 1-3) | 60% | 60% |

**Marginal analysis**: If $10K in controls reduces exposure by $15K (premium savings + uninsured loss reduction), invest.

### 6.3 Why Political Insurance Fails Inform Oversight Design

The impossibility of political fidelity insurance reveals what makes delegation risky:

| Insurance Failure Mode | Oversight Implication |
|-----------------------|----------------------|
| Adverse selection | Need universal coverage (like bonding requirements) |
| Moral hazard | Need monitoring independent of the insured |
| Enforcement capture | Need external enforcement (not self-policing) |
| Detection difficulty | Need information systems politician doesn't control |

**Design principle**: If you can't insure it, you need structural controls instead.

### 6.4 Research Directions

**Open questions:**

1. **Optimal control portfolios**: Which combinations of controls maximize exposure reduction per dollar?

2. **Dynamic pricing feasibility**: Can real-time risk indicators predict fraud well enough to price dynamically?

3. **Political mechanism design**: What non-insurance mechanisms best approximate insurance for political delegation?

4. **Cross-organizational mutual insurance**: Could EA/rationalist organizations create a mutual fidelity pool with information advantages?

5. **Parametric trigger construction**: What observable indices best predict fraud without being gameable?

6. **Moral hazard quantification**: How much does insurance actually increase fraud? (Empirical estimates vary widely.)

---

## Summary

| Concept | Key Finding |
|---------|-------------|
| Fidelity insurance exists | Mature market, 0.3-2% of coverage |
| Controls reduce premiums | 30-70% reduction possible |
| Political insurance doesn't exist | Adverse selection + moral hazard + enforcement capture |
| Novel structures possible | Parametric, prediction market hybrid, mutual, dynamic |
| Implication for delegation accounting | Insurance premiums provide market prices for defection risk |

The insurance industry has spent decades pricing defection risk. Their methods—actuarial analysis, control requirements, exclusion design—are directly applicable to delegation accounting. Where insurance fails (political contexts), the failure modes tell us what structural controls are needed instead.

---

## Further Reading

### Academic
- ACFE (2024). *Report to the Nations: Occupational Fraud*. — Primary data source
- Rothschild & Stiglitz (1976). "Equilibrium in Competitive Insurance Markets." — Adverse selection foundation
- Holmström (1979). "Moral Hazard and Observability." — Contract design under partial observability
- Bueno de Mesquita et al. (2003). *The Logic of Political Survival*. — Selectorate theory

### Industry
- International Risk Management Institute (IRMI). *Crime Coverage Guide*. — Practitioner reference
- Nonprofit Risk Management Center. *Coverage Guides*. — Sector-specific
- Surety & Fidelity Association of America. *Loss Statistics*. — Claims data

### Related Pages
- [Delegation Accounting Overview](/delegation-risk/delegation-accounting/) — Balance sheet framework
- [Power Struggles](/case-studies/anomaly-chronicles/power-struggles/) — Application to political contexts
- [Risk Decomposition](/delegation-risk/risk-decomposition/) — Accidents vs. defection
