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

## The Bridge to Delegation Risk

Earlier versions of this site presented Power and Agency alongside the risk accounting without saying how they connect. Here is the bridge — each score moves a specific term of the core formula.

Recall [Delegation Risk](/getting-started/core-concepts/#the-formula) = Σ P(harm) × Damage, and that [Risk Decomposition](/delegation-risk/risk-decomposition/) splits P(harm) into two channels: **accidents** (the component fails at its task) and **defection** (the component works against you).

$$DR \;=\; \underbrace{P(\text{accident}) \times D_{\text{accident}}}_{\text{any system}} \;+\; \underbrace{P(\text{defection}) \times D_{\text{defection}}}_{\text{requires agency}}$$

**Agency gates the defection channel.** Defection is goal-directed behavior against the principal's interests — it requires something that behaves like an optimizer. A system with Agency ≈ 0 (a calculator, a compiler) has *no defection term*: its entire risk budget is accident risk, which is exactly why we trust powerful tools that we'd never trust as agents. As the Agency Score rises, P(defection) becomes nonzero and grows with it.

**Power bounds the damage terms — in both channels.** A component's worst-case Damage is capped by what it can actually reach and affect (the resources, capabilities, influence, and optionality dimensions of the Power Score). High power raises the ceiling on accident damage *and* defection damage; low power caps both regardless of intent.

Putting the two together: **defection risk requires both high agency and high power** — agency to want it, power to do damage with it. That is the Strong Tools Hypothesis restated in risk-accounting terms: pushing Power up while holding Agency near zero grows capability while keeping the defection term pinned at zero, leaving only accident risk — which [verification patterns](/design-patterns/verification/) handle far more reliably than they handle adversaries. RACAP (Capability / Risk) is the ratio this trade optimizes.

:::caution[Epistemic status]
This bridge is **definitional, not empirical**. It tells you which term of the risk formula each property moves; it does not make Agency or Power measurable. The scores in the [worked examples](./agency-power-examples/) are illustrative estimates, and whether agency can really be held low as power scales is the open question of the [Strong Tools Hypothesis](./strong-tools-hypothesis/) itself.
:::
