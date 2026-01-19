---
title: "Delegation Economics"
---

# Delegation Economics

## Trust Production Function

How is trust produced? What are the inputs?

**Inputs to trust production**:

- Time (trust builds slowly)
- Information (observations of behavior)
- Verification (testing, auditing, proving)
- Structure (architectural constraints)
- Reputation (third-party attestations)

**Production function**:

```
Trust = f(time, information, verification, structure, reputation)
```

**Properties**:

- Increasing in all inputs (more of any → more trust)
- Diminishing returns (harder to increase high trust)
- Complementarities (verification more valuable with information)

## Trust Depreciation

Trust as capital stock that depreciates:

```
Trust(t+1) = Trust(t) × (1 - depreciation) + Investment(t)
```

**Depreciation causes**:

- Memory decay (forget past evidence)
- Context change (old evidence less relevant)
- Capability change (agent abilities shift)
- Threat evolution (new attacks discovered)

**Steady state**: Trust stabilizes when investment = depreciation

```
Trust* = Investment / depreciation
```

Higher depreciation → need more investment to maintain trust.

## Trust Arbitrage

If trust is mispriced, arbitrage opportunities exist:

**Scenario**: Market undervalues Agent A's trustworthiness

- A requires trust premium to be hired
- Principal knows A is actually more trustworthy
- Principal can "buy" A's services cheap, capture value

**Reverse scenario**: Market overvalues Agent B

- B demands low trust premium
- Principal hires B, suffers trust violation
- Loss to principal

**Market efficiency**: In efficient trust markets, prices reflect actual trustworthiness.

:::caution[Market Failures]
Information asymmetry (agent knows own trustworthiness, principal doesn't), adverse selection (untrustworthy agents willing to work for less), and moral hazard (agent behavior changes after trust granted).
:::

## Trust Insurance

:::tip[Deep Dive]
For extensive coverage of how the insurance industry actually prices defection risk, see [Fidelity Insurance: Pricing Defection Risk](/research/fidelity-insurance/).
:::

**Insurance structure**:

- Principal pays premium P
- If trust violation causes damage D, insurer pays D
- Insurer prices premium: P = E[D] × P(violation) × (1 + margin)

**Insurer incentives**:

- Verify trustworthiness before insuring (underwriting)
- Monitor during coverage (loss prevention)
- Recover from violator after loss (subrogation)

**Moral hazard**: With insurance, principal might be less careful about trust.

**Mitigation**:

- Deductibles (principal bears first $X of loss)
- Co-insurance (principal bears Y% of loss)
- Experience rating (premium depends on past claims)

## Trust Derivatives (Speculative)

**Trust future**: Contract to buy/sell trust capacity at future date

- "I commit to trusting you for X tasks in Q3 at trust level Y"

**Trust option**: Right but not obligation to grant trust

- "I can grant you trust for deployment if you pass evaluation"

**Trust swap**: Exchange trust obligations

- "I'll trust your agent for my tasks if you trust my agent for yours"

## Trust and Incentive Compatibility

**Revelation principle applied to trust**:

For any mechanism achieving trustworthy behavior in equilibrium, there exists a direct mechanism where reporting true trustworthiness is optimal.

:::tip
Implication: can focus on designing mechanisms where honest trust reporting is incentive compatible. This is the core insight enabling principled trust markets.
:::

**VCG for trust allocation**:

- Agents report trust requirements for tasks
- Tasks allocated to minimize total trust
- Payments make truthful reporting dominant strategy

**Payment rule**:

```
Payment_i = Trust_cost_to_others_if_i_absent - Trust_cost_to_others_with_i
```

Agent pays based on externality they impose on others.

## Trust Market Design

**Desirable properties**:

1. **Efficiency**: Trust allocated to highest-value uses
2. **Truthfulness**: Honest reporting is optimal
3. **Individual rationality**: Participation is voluntary and beneficial
4. **Budget balance**: Payments in ≥ payments out

**Challenges**:

- Trust is not perfectly fungible
- Verification is costly
- History matters (reputation effects)
- Trust failures have externalities

**Potential mechanisms**:

- Posted prices for trust services
- Auctions for trust-requiring tasks
- Reputation systems with economic stakes
- Insurance markets for trust violations
