---
title: "Capability Formalization"
sidebar:
  order: 1
---

# Capability Formalization

:::note[TL;DR]
This section answers: "How do we measure what AI systems can do?" We formalize **Agency** (goal-directedness), **Power** (ability to achieve goals), and explore the **Strong Tools Hypothesis**—can we get high capability with low risk?
:::

:::tip[What to Expect]
This section is more mathematical than Getting Started. If you're comfortable with utility functions and optimization, dive in. If not, start with the [Core Concepts](/getting-started/core-concepts/) which covers these ideas intuitively.
:::

This section formalizes the **positive side** of the optimization problem: what we're trying to maximize.

$$\text{Capability} = \text{Power} \times \text{Agency}$$

## Pages

| Page | Question |
|------|----------|
| [Agents, Power, and Authority](./agent-power-formalization/) | What makes something an agent? How do we measure power? |
| [Worked Examples](./agency-power-examples/) | What do these metrics look like for real systems? |
| [The Strong Tools Hypothesis](./strong-tools-hypothesis/) | Can we get high capability with low agency? |

## Key Concepts

- **Agency Score**: How well a system's behavior fits a simple utility function (0 = tool, 1 = optimizer)
- **Power Score**: Ability to achieve diverse goals
- **RACAP**: Risk-Adjusted Capability = Capability / Risk

## The Core Insight

We want AI systems that are **maximally capable while minimally risky**. This may be achievable through "strong tools"—high power with low agency.

See [The Strong Tools Hypothesis](./strong-tools-hypothesis/) for analysis.
