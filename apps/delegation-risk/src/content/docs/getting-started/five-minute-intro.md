---
title: "5-Minute Introduction"
sidebar:
  order: 2
---

# Delegation Risk in 5 Minutes

:::note
This is the compressed version. For caveats and nuance, see the [full Introduction](/getting-started/introduction/).
:::

**The problem**: AI agents can cause real harm. One powerful agent with full access is risky—if it fails or schemes, damage may be unbounded.

**The proposed solution**: Decompose into many limited components. Budget risk like money.

---

## The Core Idea

Instead of this (stylized—real systems exist on a spectrum):

```
User → [Powerful AI Agent] → Any Action
              ↑
        Full context
        Full capability
        Full autonomy
```

Consider this:

```
User → [Router] → [Narrow Component 1] → [Verifier] → Limited Action 1
                → [Narrow Component 2] → [Verifier] → Limited Action 2
                → [Narrow Component 3] → [Human Gate] → Sensitive Action
```

Each component has:
- **Limited capability** (can only do specific things)
- **Limited context** (doesn't see the whole system)
- **Limited autonomy** (verified or human-approved)

---

## The Formula

**Delegation Risk** = probability of bad outcome × damage

```
Delegation Risk = Σ P(failure) × Damage
```

Example: Component has 1% chance of causing $10,000 damage → Delegation Risk = $100

**Budget your Delegation Risk** across components. If total exceeds budget, add safeguards.

---

## The Principles

Apply "Least X" to every component:

| Principle | Meaning |
|-----------|---------|
| **Least Intelligence** | Dumbest implementation that works |
| **Least Privilege** | Minimum permissions |
| **Least Context** | Minimum information |
| **Least Persistence** | No memory between calls |
| **Least Autonomy** | Human oversight where needed |

---

## The Hierarchy

Use the most verifiable option:

```
Best → Verified Code → Regular Code → Narrow Models → General LLMs → Worst
```

Don't use GPT-4 for things a regex can do.

---

## Quick Example

**Task**: Slack bot answering questions from docs

| Component | Implementation | Delegation Risk |
|-----------|---------------|-----|
| Retriever | Code (vector search) | $5/mo |
| Answerer | Fine-tuned 7B | $50/mo |
| Poster | Code (rate limited) | $1/mo |
| **Total** | | **$56/mo** |

Budget: $500/mo → **Within budget. Ship it.**

---

## When to Use This

| Situation | Framework Value |
|-----------|-----------------|
| Internal tools, recoverable mistakes | Light application |
| Customer-facing products | Medium rigor |
| Autonomous agents with real-world actions | Full application |
| Safety-critical systems | Essential |

---

## Next Steps

- **Want the full picture?** → [Core Concepts](/getting-started/core-concepts/)
- **Ready to apply it?** → [Quick Start](/design-patterns/tools/quick-start/)
- **Want the math?** → [Delegation Risk](/delegation-risk/overview/)
- **Have questions?** → [FAQ](/getting-started/faq/)

---

**TL;DR**: Consider building many limited components instead of one powerful AI. Quantify risk. Budget it like money.
