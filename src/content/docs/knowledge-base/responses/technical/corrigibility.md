---
title: Corrigibility Research
description: Designing AI systems that accept human correction.
importance: 85
quality: 4
llmSummary: Corrigibility research aims to create AI systems that accept human
  correction and shutdown, but faces fundamental challenges around incentive
  incompatibility and formal specification. The research is assessed as low
  tractability but high importance if alignment is difficult, with key open
  questions about theoretical coherence and practical achievability.
---**The approach**: Create AI systems that actively support human oversight—that want to be corrected, allow modification, and don't resist shutdown.

## Evaluation Summary

| Dimension | Assessment | Notes |
|-----------|------------|-------|
| Tractability | Low | Conceptual and technical challenges |
| If alignment hard | High | Could be key safety property |
| If alignment easy | Low | May not be needed |
| Neglectedness | High | Limited focused research |

## What Corrigibility Means

A corrigible AI would:
- Shut down when asked
- Allow modification of its goals
- Not manipulate operators
- Actively assist with its own correction
- Maintain these properties under self-modification

## Why It's Hard

| Challenge | Description |
|-----------|-------------|
| **Incentive incompatibility** | Goal-directed agents have reason to resist modification |
| **Utility function problem** | Hard to specify "defer to humans" formally |
| **Self-modification** | Must preserve corrigibility through changes |
| **Subagent problem** | Must create corrigible subagents |

## Crux 1: Is Corrigibility Coherent?

| Coherent | Not coherent |
|----------|--------------|
| Can formally define | Leads to paradoxes |
| Balance is possible | Inherent tension with goals |
| Indifference approaches work | Indifference has problems |

**Theoretical question**: Can an AI genuinely be indifferent to modification without being useless?

## Crux 2: Is It Achievable?

| Achievable | Not achievable |
|------------|----------------|
| Training can instill it | Instrumental convergence too strong |
| Architecture can enforce it | Capable AI finds loopholes |
| Demonstrated in current systems | Won't scale with capability |

## Crux 3: Is It Sufficient?

| Sufficient for safety | Not sufficient |
|----------------------|----------------|
| Control solves alignment | Need alignment + corrigibility |
| Can correct any problem | Some harms aren't correctable |
| Buys time for alignment | Doesn't solve underlying problem |

## Who Should Work on This?

**Good fit if you believe**:
- Control is possible and important
- Theoretical foundations matter
- Corrigibility is a key safety property
- Mathematical/formal methods skills

**Less relevant if you believe**:
- Alignment is sufficient
- Control is impossible at high capability
- Need practical approaches first
