---
title: "Core Concepts"
description: "Key ideas of the Delegation Risk framework, plus the minimal viable version for teams starting small."
sidebar:
  order: 3
---

# Core Concepts

This page introduces the key ideas without mathematical formalism. For quantitative details, see [Delegation Risk](/delegation-risk/overview/).

## Framework Overview

How all the pieces fit together:

```mermaid
flowchart TB
    subgraph Foundation["Foundation: What We're Managing"]
        RISK["Delegation Risk<br/>(the expected cost of delegating)"]
    end

    subgraph Theory["Theory: How Risk Behaves"]
        PROP["Risk Propagation<br/>How risk flows through chains"]
        COMP["Composition<br/>How component risks combine"]
    end

    subgraph Methods["Methods: Established Approaches"]
        BUDGET["Risk Budgeting<br/>Allocate, monitor, enforce"]
        MECH["Mechanism Design<br/>Incentive-compatible reporting"]
    end

    subgraph Principles["Principles: How We Constrain"]
        LEASTX["Least X Principles<br/>Capability, Privilege, Context..."]
        DECOMP["Decomposition<br/>Many limited components"]
    end

    subgraph Application["Application: AI Systems"]
        ARCH["Architecture<br/>Decomposed coordination"]
        SAFETY["Safety Mechanisms<br/>Tripwires, gates, verifiers"]
    end

    RISK --> PROP
    RISK --> COMP
    PROP --> BUDGET
    COMP --> BUDGET
    BUDGET --> MECH
    MECH --> LEASTX
    LEASTX --> DECOMP
    DECOMP --> ARCH
    ARCH --> SAFETY
```

**Reading the diagram**: Delegation Risk is the foundation. Theory explains how it behaves. Methods provide established approaches from other fields. Principles give actionable constraints. Application shows how to build systems (with AI as primary focus).

## Delegation Risk

When you delegate a task, you're accepting **risk**—the potential for harm if the delegate fails or misbehaves.

**Delegation Risk** quantifies this: for each delegate, sum over all possible bad outcomes, weighted by their probability. A delegate with access to your bank account has higher Delegation Risk than one that can only read public web pages.

:::tip
Risk is finite and should be budgeted. Just as organizations allocate compute and money, they should allocate delegation risk—tracking how much they're accepting, from which delegates, for what purposes.
:::

### The Formula

**Delegation Risk = Σ P(harm mode) × Damage(harm mode)**

For each way something could go wrong (harm mode), multiply:
- The probability it happens
- The damage if it does

Sum across all harm modes to get total Delegation Risk.

:::note[Canonical definition]
This is the single canonical statement of the Delegation Risk formula. Other pages cross-link to this anchor rather than restating it.
:::

### Example: Employee with Check-Writing Authority

| Harm Mode | Probability | Damage | Risk Contribution |
|-----------|-------------|--------|-------------------|
| Clerical error | 0.01 | \$1,000 | \$10 |
| Unauthorized payment | 0.001 | \$50,000 | \$50 |
| Fraud | 0.0001 | \$500,000 | \$50 |

**Delegation Risk** = \$10 + \$50 + \$50 = **\$110** expected cost

This doesn't mean you'll lose \$110. It means that over many such delegations, you'd expect \$110 in losses on average. You can compare this to the value the delegation provides and decide if it's worth it.

## Risk Propagation

When delegates delegate to other delegates, risk relationships form networks. If A trusts B with weight 0.8, and B trusts C with weight 0.7, how much should A trust C?

The canonical rule is **multiplicative**: T(A→C) = 0.8 × 0.7 = 0.56. Each hop is a separate chance of failure, so reliabilities multiply — and longer chains are automatically penalized, with no separate length discount needed.

```mermaid
graph LR
    A((A)) -->|"0.8"| B((B))
    B -->|"0.7"| C((C))
    A -.->|"0.56"| C
```

Multiplication assumes the hops fail **independently**. When stages share a failure cause — same model provider, same training data, same context — correct for the correlation ρ with the mixture:

> P(all fail) = (1−ρ) · ∏ pᵢ + ρ · min(pᵢ)

In the fully correlated limit (ρ = 1) this reduces to the **minimum**: the chain is only as strong as its weakest link. The minimum is that limiting case, not a separate rule to choose by taste. Other rules you may encounter — harmonic means, ad-hoc per-hop discounts — are retired: the first can rate a chain above its weakest serial link, and the second double-counts chain length, which multiplication already prices in. See [Risk Propagation](/delegation-risk/risk-propagation/) for the derivation and the simulation evidence behind this choice.

:::note[Related: Social Choice Theory]
Trust aggregation across multiple delegates relates to [social choice theory](https://en.wikipedia.org/wiki/Social_choice_theory)—how to combine individual inputs into collective outcomes. [Arrow's impossibility theorem](https://en.wikipedia.org/wiki/Arrow%27s_impossibility_theorem) has implications for trust aggregation: no perfect rule exists.
:::

## Decomposition Over Monoliths

A single powerful delegate is dangerous because it concentrates capability, context, and control. If it fails or acts against you, the damage is unbounded.

**Decomposition** breaks this pattern:
- Split tasks across many specialized components
- Each component has limited capability and context
- No single component can cause catastrophic harm
- Components can't easily coordinate against the system

Think of it like [separation of powers](https://en.wikipedia.org/wiki/Separation_of_powers) in government, or [microservices](https://en.wikipedia.org/wiki/Microservices) in software architecture.

### Example: Organizational Analogy

| Aspect | Centralized | Decomposed |
|--------|-------------|------------|
| **Single point of failure** | CEO makes all decisions | Authority distributed across roles |
| **Blast radius** | Bad CEO decision affects everything | Bad decision contained to department |
| **Coordination risk** | CEO can pursue personal agenda | Requires multiple people to collude |
| **Verification** | Must verify CEO's judgment on everything | Verify narrow, specific behaviors |

The same logic applies to software systems and AI agents.

## The "Least X" Principles

Security engineering has the [principle of least privilege](https://en.wikipedia.org/wiki/Principle_of_least_privilege): give each component minimum necessary access. We extend this across multiple dimensions:

- **Least Capability**: Minimum ability to take actions
- **Least Privilege**: Minimum permissions and access rights
- **Least Context**: Minimum information about the broader system
- **Least Persistence**: Minimum state maintained across invocations
- **Least Autonomy**: Minimum ability to act without oversight
- **Least Connectivity**: Minimum communication paths between components

Each principle bounds a different attack surface. Applied together, they create components that are limited in what they can do, know, remember, and coordinate.

<details>
<summary>Why each principle matters</summary>

| Principle | What it limits | Risk bounded |
|-----------|---------------|--------------|
| Least Capability | Ability to act | Direct damage from actions |
| Least Privilege | Access rights | Scope of potential harm |
| Least Context | System knowledge | Strategic planning against system |
| Least Persistence | Memory across calls | Long-term planning, accumulating leverage |
| Least Autonomy | Unsupervised action | Scope of damage before intervention |
| Least Connectivity | Communication paths | Coordination between components |

</details>

## Risk Budgeting

Borrowed from finance and nuclear safety: set a total acceptable risk level for the system, then allocate risk budgets to components.

Key requirements:
- **Compositional guarantees**: Component risks must aggregate predictably
- **Principled allocation**: Methods like [Euler allocation](/cross-domain-methods/euler-allocation/) ensure budgets sum correctly
- **Incentive-compatible reporting**: Mechanisms that make honest risk reporting optimal
- **Verification infrastructure**: Independent confirmation that claimed levels match reality
- **Conservative margins**: Buffer for uncertainty and unknowns

:::note
This isn't theoretical—nuclear plants operate at 10⁻⁹ failure probability per reactor-year by flowing system targets down to component budgets through fault trees.
:::

```mermaid
flowchart TD
    S[System Risk Target<br/>e.g. $10,000/year] --> A[Component A<br/>Budget: $3,000]
    S --> B[Component B<br/>Budget: $4,000]
    S --> C[Component C<br/>Budget: $3,000]
    A --> V[Verification Layer]
    B --> V
    C --> V
```

## Architectural Safety

The central claim: safety can be a property of system architecture, not just individual component behavior.

If you can't guarantee a delegate is trustworthy, you can still:
- Limit what they can access (least privilege)
- Limit what they know (least context)
- Limit what they can coordinate (decomposition)
- Limit how much damage they can cause (risk budgets)
- Verify their behavior matches claims (verification layers)

:::caution
These structural constraints provide defense in depth. They don't replace selecting trustworthy delegates—they bound the damage when trust is misplaced.
:::

---

## Application to AI Systems

The framework applies generally, but AI systems are our primary focus. For AI specifically:

### Verifiability Hierarchy

Not all implementations are equally trustworthy:

1. **Provably secure code** — Mathematical guarantees of correctness
2. **Regular code** — Auditable, testable, deterministic
3. **Fine-tuned narrow models** — Predictable within a specific domain
4. **Constrained general models** — LLMs with extensive prompting and evaluation
5. **Base LLMs** — General capability, harder to verify
6. **RL systems** — Learned policies, least predictable

:::note[Design Principle]
Use the most verifiable implementation that achieves the required functionality. Don't use a frontier LLM for tasks that can be done with code or a narrow model.
:::

```mermaid
graph TB
    subgraph "Most Verifiable"
        A[Provably Secure Code]
    end
    A --> B[Regular Code]
    B --> C[Fine-tuned Narrow Models]
    C --> D[Constrained General Models]
    D --> E[Base LLMs]
    E --> F[RL Systems]
    subgraph "Least Verifiable"
        F
    end
```

<details>
<summary>When to use each level</summary>

| Level | Use when... | Example |
|-------|-------------|---------|
| Provably secure code | Correctness is critical, logic is simple | Access control checks, rate limiters |
| Regular code | Behavior is fully specifiable | Data transformation, API routing |
| Fine-tuned narrow models | Task is well-defined, training data exists | Sentiment classification, entity extraction |
| Constrained general models | Judgment needed, outcomes recoverable | Draft generation, summarization |
| Base LLMs | Maximum flexibility needed, heavy oversight | Creative tasks, complex reasoning |
| RL systems | Learning from feedback is essential | Rarely recommended for safety-critical paths |

</details>

### Architectural Spectrum: Monolithic vs Decomposed

Real systems exist on a spectrum. This diagram shows two stylized endpoints:

```mermaid
flowchart TB
    subgraph Before["Monolithic Agent"]
        direction TB
        M["Single Agent<br/>────────────<br/>• Full context access<br/>• All capabilities<br/>• High autonomy<br/>• Single point of failure"]
        M --> OUT1[Any Output]
    end

    subgraph After["Decomposed System"]
        direction TB
        subgraph Coord["Coordination (Code)"]
            R[Router]
        end
        subgraph Workers["Narrow Components"]
            W1["Searcher<br/>Read-only"]
            W2["Summarizer<br/>Text only"]
            W3["Analyzer<br/>No actions"]
        end
        subgraph Safety["Safety Layer"]
            V[Verifier]
            G[Human Gate]
        end
        R --> W1 & W2 & W3
        W1 & W2 & W3 --> V
        V --> G
        G --> OUT2[Verified Output]
    end
```

| Aspect | Monolithic | Decomposed |
|--------|------------|------------|
| **Single point of failure** | Yes—one bad output, system fails | No—failure isolated to component |
| **Attack surface** | Entire model capability | Only exposed component interfaces |
| **Verification** | Must verify everything the model can do | Verify narrow, specific behaviors |
| **Blast radius** | Unlimited—model can do anything | Bounded—each component has limits |
| **Coordination risk** | Model coordinates with itself | Components can't easily collude |

---

## The Minimal Viable Framework

You don't need all 45 patterns. If you implement nothing else, implement these five. This is the 80/20 version for teams starting small.

### The 5 Essential Patterns

#### 1. Least Privilege
**Give the minimum permissions needed for the task.**

```
❌ AI has admin access to everything
✓ AI can only read/write files in /workspace
```

#### 2. Human Escalation
**High-stakes decisions go to humans.**

```
❌ AI executes all actions autonomously
✓ Actions over $1000 require human approval
```

#### 3. Output Filtering
**Check outputs before they reach the world.**

```
❌ AI response goes directly to user
✓ Filter checks for PII, harmful content, policy violations
```

#### 4. Sandboxing
**Limit what can go wrong.**

```
❌ AI runs on production server
✓ AI runs in isolated container with no network access
```

#### 5. Audit Logging
**Record everything for when things go wrong.**

```
❌ No logs, can't investigate incidents
✓ All inputs, outputs, and decisions logged with timestamps
```

### Low-Risk vs High-Risk Decision

```mermaid
flowchart TD
    Start[What are you building?] --> Q1{Can it access<br/>sensitive data?}
    Q1 -->|No| Q2{Can it take<br/>real-world actions?}
    Q1 -->|Yes| High[High Risk Path]
    Q2 -->|No| Q3{Does it talk to<br/>customers?}
    Q2 -->|Yes| High
    Q3 -->|No| Low[Low Risk Path]
    Q3 -->|Yes| Medium[Medium Risk Path]

    Low --> L1[5 Essential Patterns]
    Medium --> M1[+ Tripwire Monitoring<br/>+ Rate Limiting]
    High --> H1[+ Human Review<br/>+ Formal Verification<br/>+ Defense in Depth]

    style Low fill:#e8f5e9
    style Medium fill:#fff3e0
    style High fill:#ffebee
```

### Minimum Viable Implementation Checklist

**Phase 1: Foundation (1 day)**
- [ ] Define your harm modes (what could go wrong?)
- [ ] Set a risk budget (how much harm is acceptable?)
- [ ] Implement least privilege (minimum permissions)

**Phase 2: Safety Basics (1 week)**
- [ ] Add output filtering
- [ ] Implement human escalation for high-stakes
- [ ] Set up audit logging
- [ ] Create a sandbox environment

**Phase 3: Monitoring (2 weeks)**
- [ ] Add basic anomaly detection
- [ ] Set up alerting for unusual patterns
- [ ] Review logs weekly

**Phase 4: Iteration (Ongoing)**
- [ ] Track actual vs. expected harm
- [ ] Adjust risk budgets based on data
- [ ] Add patterns as needed

### When to Expand

Add more patterns when:

| Signal | Suggested Addition |
|--------|-------------------|
| Failures are correlated | Read Entanglements, add diversity |
| Human review bottleneck | Add AI verifiers, graduated autonomy |
| Novel attacks detected | Add tripwires, adversarial testing |
| Cascading failures | Add bulkheads, blast radius containment |
| Trust is miscalibrated | Add trust decay, capability sunset |

### Which Sections Can I Skip?

- **Entanglements** — Skip if your system has < 3 components, or you use completely different models for each component. Don't skip if you have multiple AI verifiers, use the same base model in multiple places, or components share training data.
- **Power Dynamics** — Skip if you just want to implement patterns, not understand the theory. Don't skip if you need to justify decisions to stakeholders or want to optimize capability/risk tradeoffs.
- **Research** — Skip if you're implementing, not doing research. Read if you want to understand the theoretical foundations or contribute improvements.
- **Cross-Domain Methods** — Skip if you trust the patterns as-is. Read if you want to understand why these methods work (nuclear, finance precedents).

### What This Framework Is NOT

- **Not an alignment solution** — Assumes components may be misaligned
- **Not formal verification** — Probabilistic, not provable
- **Not a substitute for good models** — Better models reduce accident risk
- **Not zero-risk** — Manages risk, doesn't eliminate it

---

## What This Framework Provides

1. **Vocabulary**: Precise terms for discussing risk, delegation, and containment
2. **Theory**: Mathematics for risk propagation, capability quantification, and optimization
3. **Methods**: Established approaches adapted from finance, nuclear safety, mechanism design
4. **Principles**: Actionable design constraints (the "Least X" family)
5. **Patterns**: Decomposed coordination, verification layers, safety mechanisms

The goal is infrastructure for safely delegating at scale—not a complete solution to trust, but a foundation for managing risk as capabilities increase.

### The Optimization Problem

The framework isn't just about minimizing risk—it's about **maximizing capability subject to risk constraints**:

$$\max \text{Capability} \quad \text{s.t.} \quad \text{DelegationRisk} \leq \text{Budget}$$

Where **Capability = Power × Agency**:
- **Power**: Ability to achieve diverse goals (what can the system accomplish?)
- **Agency**: Coherence of goal-pursuit (how optimizer-like is the system?)

See [Agent, Power, and Authority](/power-dynamics/agent-power-formalization/) for full formalization.

---

## Key Takeaways

:::note[Key Takeaways]
1. **The goal is maximizing capability subject to risk constraints**: Not minimizing risk to zero
2. **Capability = Power × Agency**: We want high power, minimum necessary agency
3. **Delegation Risk quantifies the downside**: the expected cost of delegating, summed over harm modes ([the formula](#the-formula))
4. **Decompose, don't centralize**: Many limited components are safer than one powerful delegate
5. **Apply "Least X" principles**: Minimize capability, privilege, context, persistence, autonomy, connectivity
6. **Budget both risk AND power**: Allocate, verify, and enforce limits on both sides
7. **High power + low agency may be optimal**: "Strong tools" provide capability without coherent optimization pressure
:::

## See Also

- [The Core Path](/getting-started/reading-order/#the-core-path) — The guided route through the framework's strongest material
- [Introduction](/getting-started/introduction/) — The full problem statement and approach
- [Delegation Risk Overview](/delegation-risk/overview/) — The quantitative foundation
- [Least X Principles](/design-patterns/least-x-principles/) — Deep dive into each principle
- [Quick Start](/design-patterns/tools/quick-start/) — Apply these concepts step-by-step
