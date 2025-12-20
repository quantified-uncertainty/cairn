---
title: Mechanistic Interpretability
description: Understanding AI systems by reverse-engineering their internals.
---

**The approach**: Reverse-engineer neural network computations into human-understandable algorithms and concepts.

## Evaluation Summary

| Dimension | Assessment | Notes |
|-----------|------------|-------|
| Tractability | Medium | Making progress, but scaling unclear |
| If alignment hard | High | Could detect deception, verify alignment |
| If alignment easy | Low | Less necessary if behavioral methods work |
| Neglectedness | Medium | Growing field, major labs investing |

## What This Approach Does

- Identifies interpretable features in neural networks
- Maps circuits that implement specific behaviors
- Could enable detection of deceptive or misaligned cognition
- Provides mechanistic understanding, not just behavioral testing

## Key Techniques

- Sparse autoencoders
- Activation patching
- Circuit analysis
- Logit lens variants

## Crux 1: Will It Scale?

| Scales to frontier models | Doesn't scale |
|---------------------------|---------------|
| Larger models may be cleaner | Complexity grows faster than understanding |
| Automation can help | Fundamentally too complex |
| Principles transfer | Current successes don't generalize |

**Current evidence**: Mixed. Some features generalize; full understanding remains elusive.

## Crux 2: Can It Detect Deception?

| Can detect | Cannot detect |
|------------|---------------|
| Deception has signatures | Deception designed to evade detection |
| Can find "lying circuits" | Hidden in uninterpretable parts |
| Better than behavioral tests | No ground truth for verification |

## Crux 3: Is Completeness Necessary?

| Need complete understanding | Partial is enough |
|----------------------------|-------------------|
| Any blind spot is exploitable | Just need key behaviors |
| Can't verify what you don't see | Combined with other methods |
| Deception hides in gaps | Safety-relevant parts may be interpretable |

## Who Should Work on This?

**Good fit if you believe**:
- Alignment is hard, need robust verification
- Deceptive alignment is a real risk
- Current techniques will scale with effort

**Less relevant if you believe**:
- Behavioral alignment is sufficient
- Interpretability won't scale in time
- Other methods (oversight, governance) are enough
