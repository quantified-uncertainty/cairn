---
title: "Legibility and Control"
description: "When making entanglements explicit helps vs. hurts"
sidebar:
  order: 3
---

# Legibility and Control

Making relationships explicit—creating **legibility**—is a control technology. This framework does it: map dependencies, formalize interfaces, quantify metrics. But legibility has a dark side: it can destroy the informal, adaptive systems that actually work.

---

## The Concept

James C. Scott's *Seeing Like a State* (1998) describes how states simplify:

**Before**: Local names, customary rights, variable measures, oral tradition
**After**: Standardized surnames, written records, uniform measures, formal rules

States couldn't tax what they couldn't count. **Solution**: Make society legible through standardization.

---

## When Legibility Fails

Scott identifies **high modernism**—the belief that scientific planning can optimize society, that traditional practices are inefficient superstition, that experts know better than locals.

**High modernism + state power + weak civil society = disasters:**

| Project | What Happened |
|---------|---------------|
| **Scientific forestry** (Prussia) | Monoculture plantations. Initial success, then massive die-offs. Lacked biodiversity that sustained forest health. |
| **Collectivization** (Soviet Union) | "Scientific" agriculture ignored local knowledge. Result: famines. |
| **Brasília** (Brazil) | Planned city separated functions by design. Result: sterile, alienating; informal settlements grew around it. |

**Pattern**: Replace functioning complexity with rational simplicity → system fails → informal complexity re-emerges.

---

## Métis: Knowledge That Can't Be Formalized

**Métis** = practical, local, tacit knowledge:
- A farmer's sense of when to plant (beyond weather data)
- A nurse's intuition something is wrong (before tests confirm)
- A trader's feel for the market (beyond models)

**The irony**: The more legible the system, the more it depends on illegible métis to function. Hospitals run on nurses' tacit knowledge, not just protocols. Remove the métis, and the legible system collapses.

---

## Implications for AI and Entanglement

### When Legibility Helps

- Hidden dependencies cause cascading failures → make them explicit
- Informal arrangements enable hidden coordination → formalize interfaces
- Standardization enables substitution and competition
- Measurement enables improvement

### When Legibility Hurts

| Legibility Project | Destroyed Métis | Result |
|-------------------|-----------------|--------|
| Strict API contracts | Informal flexibility for edge cases | Brittle systems |
| Mandatory documentation | Quick informal knowledge sharing | Slow, outdated docs |
| Complete isolation | Beneficial implicit coordination | Coordination failures |

### AI Has Métis Too

- **Model tacit knowledge**: Learned patterns that work but aren't understood
- **Operator tacit knowledge**: "This prompt works better even though I can't say why"
- **System tacit knowledge**: How components actually interact vs. how they're designed to

---

## Finding the Balance

**Principles**:

1. **Preserve what works** — Before standardizing, understand why the current system works
2. **Gradual legibility** — Incremental formalization allows learning
3. **Escape valves** — Formal systems need room for informal adaptation
4. **Monitor for brittleness** — Highly legible systems often fail in novel situations

**The meta-principle**: The drive to make things legible is itself a bias. Sometimes the right answer is: "This is working; don't formalize it."

---

## Key Takeaways

1. **Legibility is a control technology** — We standardize to reduce entanglement risk, like states standardize to tax
2. **High modernism fails** — Replacing functioning complexity with rational simplicity causes disasters
3. **Métis matters** — Tacit knowledge often carries crucial understanding that can't be formalized
4. **The paradox** — The more legible the system, the more it depends on illegible métis
5. **Balance is key** — Make explicit what needs to be explicit; preserve what works

---

See also:
- [Organizational Isolation](/entanglements/cross-domain/organizational-isolation/) — Control through structure
- [Software Dependency Patterns](/entanglements/cross-domain/software-dependency-patterns/) — Formalization that works
- [Solutions](/entanglements/mitigation/solutions/) — Approaches to reducing entanglement
