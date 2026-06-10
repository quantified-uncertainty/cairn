---
title: "Formal Definitions"
description: "Key concepts in entanglement, defined precisely but accessibly"
sidebar:
  badge:
    text: Core
    variant: tip
  order: 3
---

This page defines entanglement concepts precisely. For most readers, the [Types of Entanglement](/entanglements/fundamentals/types/) overview is sufficient—this page is for those who want rigorous definitions.

---

## Core Concepts

### Passive Entanglement

**Definition**: Components A and B are passively entangled when knowing whether A failed tells you something about whether B failed.

**Levels**:
- **Zero entanglement**: A's failure tells you nothing about B (truly independent)
- **Partial entanglement**: A's failure makes B's failure more likely
- **Perfect entanglement**: A fails if and only if B fails (same failure mode)

**Example**: Two LLMs from the same provider. If an adversarial input fools one, it's more likely to fool the other—even without any communication between them.

### Conditional Entanglement

**Definition**: Components that are independent under normal conditions but become entangled under stress.

**Example**: Two verification systems work independently during normal operation. Under high load, both start taking shortcuts, and their failures become correlated.

This is dangerous because testing under normal conditions won't reveal the entanglement.

### Active Entanglement

**Definition**: Component A actively influences Component B—A's output affects B's behavior.

**Key distinction from passive**: Passive entanglement is symmetric (A correlates with B = B correlates with A). Active entanglement is directional (A influences B doesn't mean B influences A).

**Example**: An AI assistant summarizes a document, then a verifier reviews the summary. The assistant's framing actively shapes what the verifier sees and how they evaluate it.

### Context Contamination

**Definition**: When Component B only sees Component A's processed version of the input, B loses information and inherits A's biases.

**Key insight**: Information can only be lost through processing, never gained. If A filters or summarizes before B sees it, B cannot recover what A removed.

**Example**: A first-stage agent summarizes a customer complaint before escalation. The summary omits details the agent deemed unimportant. The second-stage reviewer can only act on what they receive—they can't evaluate what they never saw.

---

## Game-Theoretic Concepts

### The Collusion Problem

**Setup**: A principal (system designer) delegates to an agent (AI), with a verifier checking the agent's work.

**The risk**: If the agent and verifier can coordinate, they may both benefit from approving bad work—even though this hurts the principal.

**Collusion resistance** requires that honest behavior pays better than collusion, accounting for:
- Probability of getting caught
- Penalties when caught
- Benefits of collusion if undetected

### Regulatory Capture

**Definition**: When a verifier gradually shifts from serving the principal's interests to serving the agent's interests.

**Capture ratio**: Compare how often the verifier approves when the agent wants approval vs. when the agent doesn't want approval.
- Ratio = 1: Verifier is independent
- Ratio > 1: Verifier is biased toward agent
- Ratio → ∞: Verifier always agrees with agent

**Causes**:
- Information asymmetry (verifier relies on agent for expertise)
- Relationship building (verifier trusts agent over time)
- Incentive drift (verifier's rewards depend on agent satisfaction)

### Logical Correlation

**Definition**: Agents with similar training may make similar decisions without explicit communication—they reason the same way.

**Why this matters**: You can't break this entanglement by isolating communication. Two AIs trained similarly will have correlated failures even if they never interact, because they share reasoning patterns.

---

## Risk Concepts

### The Entanglement Tax

**Definition**: The ratio of actual risk to perceived risk.

**Formula in plain terms**:
> Entanglement Tax = What your risk actually is ÷ What you think your risk is

**Canonical derivation** (this is the site's single source of truth for the tax; the [Correlation Calculator](/entanglements/detection/correlation-calculator/) tables are generated from it). Model correlation with the **beta-factor common-cause model**, borrowed from nuclear safety: with weight $\rho$, one shared cause defeats all correlated layers at once; with weight $1-\rho$, layers fail independently. For $n$ layers with miss probabilities $p_i$:

$$P(\text{all fail}) = (1-\rho)\prod_i p_i + \rho \cdot \min_i p_i$$

$$\text{Tax}(\rho) = \frac{(1-\rho)\prod_i p_i + \rho \min_i p_i}{\prod_i p_i}$$

For $n$ identical layers at miss rate $p$, this simplifies to $\text{Tax} = (1-\rho) + \rho\, p^{1-n}$ — the tax grows *exponentially in layer count*, because each added layer improves your perceived risk but barely moves the common-cause floor.

**Example**:
- You have three 90%-effective safety layers
- If independent: 0.1% failure rate (0.1 × 0.1 × 0.1)
- If 50% correlated: (0.5 × 0.001) + (0.5 × 0.1) ≈ 5% failure rate
- Entanglement tax: ~50× (your risk is 50× higher than you thought)

**Why this model**: it is exact for its stated mechanism (a genuine shared cause), it recovers the product rule at $\rho = 0$ and the single-best-layer bound at $\rho = 1$, and Monte Carlo comparison against smoother correlation structures (Gaussian copula) shows it errs on the conservative side at intermediate $\rho$ — the right direction for safety budgeting. The full derivation, simulation evidence, and the serial-chain counterpart live in [Risk Propagation: One Rule, Not a Menu](/delegation-risk/risk-propagation/).

**Limitation — higher-order structure**: a single $\rho$ treats all layers as symmetrically coupled to one shared cause. Real architectures have *structured* correlation (layers A and B share a provider; C shares context with A) and possible three-way interactions that no single parameter captures. Use the pairwise correlation-matrix method from the [worked examples](/entanglements/case-studies/examples/) when the architecture is asymmetric, and simulation when precision matters.

### Effective Redundancy

**Definition**: How much redundancy you actually have, accounting for correlation — the number of *truly independent* layers that would give the same protection: $n_{\text{eff}} = \ln P(\text{all fail}) / \ln p$.

**The problem**: Three "independent" verification layers sounds robust. But if they share blind spots, you might effectively have under 1.5 layers of protection.

**Quick estimate** (identical layers at 90% effectiveness, beta-factor model):
| Nominal layers | If independent | If 50% correlated | If 80% correlated |
|----------------|----------------|-------------------|-------------------|
| 2 | 2.0 effective | 1.3 effective | 1.1 effective |
| 3 | 3.0 effective | 1.3 effective | 1.1 effective |
| 5 | 5.0 effective | 1.3 effective | 1.1 effective |

Note the striking pattern: beyond modest correlation, effective redundancy is set by the **correlation, not the layer count** — adding layers that share the common cause adds almost nothing. This is the nuclear-safety lesson: defense-in-depth is defeated by common cause, not by independent bad luck.

---

## Bounds and Limits

### Irreducible Entanglement

**Claim**: Any two AI systems using similar architectures and training methods will have some baseline failure correlation that cannot be eliminated.

**Why**: Adversarial examples transfer between similar models. This is a structural property of how these systems work, not a bug that can be fixed.

**Implication**: True independence between AI verification systems may require fundamentally different approaches—not just different providers.

### The Verification Ceiling

**Claim**: A verifier cannot reliably catch errors in domains where they lack capability.

**Plain terms**: If the verifier isn't smart enough to understand the work, they can't verify it properly. This creates fundamental limits on AI-checking-AI when the checked AI is more capable.

### Collusion Detection Limits

**Claim**: If agents coordinate through shared reasoning rather than explicit communication, monitoring communication won't detect the coordination.

**Implication**: For sophisticated AI systems, collusion resistance requires more than just preventing communication—it requires genuine diversity in reasoning approaches.

---

## Practical Takeaways

1. **Independence is rare**: Most real systems have significant passive entanglement through shared training, infrastructure, or assumptions.

2. **Correlation destroys redundancy**: Going from 2 to 5 "independent" layers provides much less protection than you'd expect if they're correlated.

3. **Active influence is directional**: Pay attention to information flow—who sees whose output, in what order.

4. **Some entanglement is irreducible**: At some point, you hit fundamental limits. Know where those are.

5. **Measure, don't assume**: The entanglement tax can easily be 10-100×. Test correlation empirically rather than assuming independence.

---

See also:
- [Types of Entanglement](/entanglements/fundamentals/types/) — Conceptual overview
- [Quantitative Metrics](/entanglements/detection/metrics/) — How to measure these concepts
- [Correlation Calculator](/entanglements/detection/correlation-calculator/) — Tools for estimation
