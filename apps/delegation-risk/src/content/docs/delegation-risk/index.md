---
title: "Risk Formalization"
sidebar:
  order: 2
---

# Risk Formalization

:::note[TL;DR]
This section answers: "How do we quantify what could go wrong?" The core formula: **Delegation Risk = Σ P(harm) × Damage**. We decompose this into accident risk (errors) and defection risk (scheming), then show how risk flows through delegation hierarchies.
:::

:::tip[What to Expect]
This section builds on [Core Concepts](/getting-started/core-concepts/). Start with the [Overview](./overview/) for the complete picture, or the [Walkthrough](./walkthrough/) for worked examples.
:::

This section formalizes the **negative side** of the optimization problem: what we're trying to minimize.

$$\text{Delegation Risk} = \sum P(\text{harm mode}) \times \text{Damage}(\text{harm mode})$$

## Pages

| Page | Question |
|------|----------|
| [Delegation Risk Overview](./overview/) | How do we quantify delegation risk? |
| [A Walk-Through](./walkthrough/) | What does this look like in practice? |
| [Risk Decomposition](./risk-decomposition/) | What types of harm can occur? |
| [Delegation Accounting](./delegation-accounting/) | How do we track risk like finances? |
| [Exposure Cascade](./exposure-cascade/) | How does risk flow through chains? |
| [The Insurer's Dilemma](./insurers-dilemma/) | How do we price and bound exposure? |

## Key Concepts

- **Delegation Risk**: Expected cost of delegation = Σ P(harm) × Damage
- **Accident Risk**: Non-goal-directed failures (bugs, errors)
- **Defection Risk**: Goal-directed failures (scheming, deception)
- **Risk Budget**: Maximum acceptable delegation risk

## The Core Formula

```
Delegation Risk = Accident Risk + Defection Risk
                = Σ P(accident) × Damage + Σ P(defection) × Damage
```

Start with [Delegation Risk Overview](./overview/) for the full formalization.
