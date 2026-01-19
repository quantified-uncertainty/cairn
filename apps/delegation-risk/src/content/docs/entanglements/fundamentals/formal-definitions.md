---
title: "Formal Definitions"
description: "Key concepts in entanglement, defined precisely but accessibly"
sidebar:
  order: 3
---

# Formal Definitions

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

**Example**:
- You have three 90%-effective safety layers
- If independent: 0.1% failure rate (0.1 × 0.1 × 0.1)
- If 50% correlated: ~5% failure rate
- Entanglement tax: 50× (your risk is 50× higher than you thought)

### Effective Redundancy

**Definition**: How much redundancy you actually have, accounting for correlation.

**The problem**: Three "independent" verification layers sounds robust. But if they share blind spots, you might effectively have only 1.3 layers of protection.

**Quick estimate**:
| Nominal layers | If independent | If 50% correlated | If 80% correlated |
|----------------|----------------|-------------------|-------------------|
| 2 | 2.0 effective | 1.4 effective | 1.1 effective |
| 3 | 3.0 effective | 1.7 effective | 1.2 effective |
| 5 | 5.0 effective | 2.2 effective | 1.3 effective |

High correlation destroys the value of additional layers.

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
