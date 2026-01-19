---
title: "Common Mistakes"
description: "What teams get wrong when implementing delegation risk frameworks"
sidebar:
  order: 10
---

# Common Mistakes

Learn from others' failures. These are the most frequent mistakes teams make when implementing delegation risk frameworks.

---

## Mistake 1: Jumping to Patterns Without Theory

### What It Looks Like
Team reads the Design Patterns section, picks some patterns that sound good, implements them without understanding the underlying theory.

### Why It Happens
- Patterns feel actionable; theory feels academic
- Time pressure to ship
- "We just want the solution, not the lecture"

### The Problem
Patterns are solutions to specific problems. Without understanding the problem space, you'll:
- Apply patterns to wrong situations
- Miss edge cases the pattern was designed for
- Fail to recognize when patterns conflict

### How to Avoid
**Minimum reading before implementing patterns:**
1. [Core Concepts](/getting-started/core-concepts/) — 20 min
2. [Delegation Risk Overview](/delegation-risk/overview/) — 15 min
3. *Then* [Design Patterns Index](/design-patterns/) — pick patterns

---

## Mistake 2: Assuming Independence (The Entanglement Trap)

### What It Looks Like
"We have three verification layers that each catch 90% of issues, so we only miss 0.1% (0.1 × 0.1 × 0.1)."

### Why It Happens
- Independence is mathematically convenient
- Hard to see correlations between components
- Optimistic about architectural isolation

### The Problem
If verifiers share:
- Same training data → same blind spots
- Same base model → correlated failures
- Shared context → can be attacked together

Three 90% verifiers might only give you 92% overall, not 99.9%.

### How to Avoid
- **Check for shared ancestors** — Do components use the same base model?
- **Diversity by design** — Use different architectures, training data, paradigms
- **Test for correlation** — Do failures happen together?
- **Read** [Entanglements](/entanglements/) if your system has multiple AI components

---

## Mistake 3: Cargo-Culting Without Threat Models

### What It Looks Like
"Big Company X uses this pattern, so we should too."

### Why It Happens
- Easier to copy than to think
- Prestigious examples feel safe
- Threat modeling is hard

### The Problem
Patterns address specific threats. Big Company X may have:
- Different threat model than you
- More resources for overhead
- Regulatory requirements you don't have
- Problems you don't have

### How to Avoid
**Before implementing any pattern:**
1. What harm am I preventing?
2. How likely is this harm for *my* system?
3. What's the cost of this pattern?
4. Is the cost justified by the risk reduction?

---

## Mistake 4: Over-Engineering Low-Risk Systems

### What It Looks Like
Internal productivity tool with no customer exposure gets the same security architecture as the payment system.

### Why It Happens
- Fear of getting blamed for incidents
- "Better safe than sorry" mentality
- Unclear risk assessment

### The Problem
- Slows development for no benefit
- Creates resentment ("safety theater")
- Wastes resources that could protect high-risk systems
- Makes the framework seem unreasonable

### How to Avoid
**Use tiered risk levels:**

| Risk Level | Examples | Suggested Controls |
|------------|----------|-------------------|
| Low | Internal tools, experiments | 5 essential patterns |
| Medium | Customer-facing, B2B | + Human review, tripwires |
| High | Financial, health, safety | + Formal verification, defense in depth |

---

## Mistake 5: Under-Engineering High-Risk Systems

### What It Looks Like
"It's just an AI chatbot, what could go wrong?"

Then: reputation damage, data leaks, regulatory fines, or worse.

### Why It Happens
- Underestimating AI capability
- Not imagining adversarial users
- "We'll add safety later" (you won't)
- Optimism bias

### The Problem
AI systems can:
- Leak training data (PII, proprietary info)
- Generate harmful content at scale
- Be manipulated by adversarial prompts
- Take unexpected actions with real consequences

### How to Avoid
**Ask the "Sydney Question":** If this system went maximally adversarial for 5 minutes, what's the worst that happens?

If the answer is scary, you need serious controls.

---

## Mistake 6: Ignoring the Insurer's Dilemma

### What It Looks Like
Setting risk budgets without understanding who bears the risk.

### Why It Happens
- Risk budgets feel abstract
- Unclear accountability
- "Someone else's problem"

### The Problem
If the development team sets the risk budget but users bear the harm, incentives are misaligned. Team will systematically underestimate acceptable risk.

### How to Avoid
- **Make risk-bearers set budgets** — Users, not developers
- **Skin in the game** — Team compensation tied to safety outcomes
- **Independent audit** — Third party reviews risk assessments
- **Read** [The Insurer's Dilemma](/delegation-risk/insurers-dilemma/)

---

## Mistake 7: Single Point of Failure

### What It Looks Like
All safety checks depend on one component. If it fails, everything fails.

### Why It Happens
- Simpler architecture
- One component to maintain
- "It works, don't touch it"

### The Problem
Single points of failure are:
- More likely to be compromised by adversaries
- More likely to fail under unusual conditions
- Harder to recover from

### How to Avoid
- **Defense in depth** — Multiple independent layers
- **Diversity** — Different approaches to the same goal
- **Graceful degradation** — System remains partially safe if one layer fails

---

## Mistake 8: Set and Forget

### What It Looks Like
Implement safety measures at launch, never revisit them.

### Why It Happens
- Safety feels "done"
- No ongoing budget for safety
- Other priorities emerge

### The Problem
- **Capabilities drift** — Models get better, old controls may be insufficient
- **Attacks evolve** — Adversaries find new bypasses
- **Context changes** — Use cases expand beyond original scope
- **Normalization of deviance** — Small violations compound

### How to Avoid
- **Scheduled reviews** — Quarterly risk budget reviews
- **Continuous monitoring** — Track failure rates over time
- **Trigger-based reviews** — After incidents, capability upgrades, use case changes

---

## Meta-Mistake: Thinking Safety Competes with Capability

### The Reframe
Good safety architecture often *improves* capability:
- Better monitoring → faster debugging
- Modular systems → easier upgrades
- Human escalation → better decisions
- Audit trails → easier compliance

The real tradeoff is usually between **short-term velocity** and **long-term robustness**.

---

## See Also

- [Minimal Framework](/getting-started/minimal-framework/) — What you actually need
- [Quick Reference](/getting-started/quick-reference/) — Checklists and formulas
- [Anti-Patterns](/case-studies/ai-systems/anti-patterns/) — Detailed failure patterns
- [FAQ](/getting-started/faq/) — Common objections answered
