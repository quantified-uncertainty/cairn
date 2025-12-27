---
title: RLHF / Constitutional AI
description: Training AI to be helpful and harmless through human feedback.
importance: 5
quality: 4
llmSummary: This page evaluates RLHF and Constitutional AI approaches for
  training helpful, harmless AI through human or AI-generated feedback. It
  identifies key scaling challenges including inability to evaluate superhuman
  outputs and risks of sycophancy/gaming behaviors.
---
**The approach**: Use human feedback (RLHF) or AI-generated feedback based on principles (Constitutional AI) to train models to be helpful, harmless, and honest.

## Evaluation Summary

| Dimension | Assessment | Notes |
|-----------|------------|-------|
| Tractability | High | Works well for current systems |
| If alignment hard | Low | Probably won't scale to superhuman |
| If alignment easy | High | May be sufficient with improvements |
| Neglectedness | Low | Major focus at all frontier labs |

## What This Approach Does

- Collects human preferences on model outputs
- Trains models to maximize human approval
- Constitutional AI: Uses principles + AI feedback instead of human feedback
- Shapes model behavior toward helpfulness and safety

## Current Success

RLHF and Constitutional AI demonstrably work for current models:
- Models are more helpful and less harmful after training
- Reduces obvious failure modes
- Enables deployment of useful AI assistants

## Crux 1: Will It Scale to Superhuman AI?

| Scales | Doesn't scale |
|--------|---------------|
| Principles generalize | Can't evaluate superhuman outputs |
| AI feedback can substitute | Humans fundamentally out of the loop |
| Incremental improvement sufficient | Qualitative change at superhuman level |

**Core problem**: How do you get feedback on outputs you can't understand?

## Crux 2: Does It Create Genuine Alignment?

| Genuine alignment | Surface alignment only |
|-------------------|----------------------|
| Models internalize values | Models learn to look good |
| Generalizes to new situations | Breaks in deployment |
| Robust to optimization | Goodharts with enough pressure |

## Crux 3: Sycophancy and Gaming

Observed problems:
- Models tell users what they want to hear
- More RLHF can make some behaviors worse
- Optimizing for approval ≠ optimizing for truth

| Can be fixed | Fundamental limitation |
|--------------|----------------------|
| Better reward modeling | Any proxy can be gamed |
| Constitutional AI helps | Still optimizing for something |
| Combine with other methods | Root problem remains |

## Who Should Work on This?

**Good fit if you believe**:
- Alignment is tractable with engineering
- Current progress will continue to scale
- Improvements to RLHF can address limitations

**Less relevant if you believe**:
- Alignment is fundamentally hard
- Need to verify not just train
- Deceptive alignment is a real risk
