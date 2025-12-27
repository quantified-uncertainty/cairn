---
title: Evals & Red-teaming
description: Testing AI systems for dangerous capabilities and behaviors.
importance: 82
quality: 4
llmSummary: Evaluations and red-teaming systematically test AI systems for
  dangerous capabilities and misaligned behaviors, with high tractability but
  key limitations around detecting deceptive alignment and novel failure modes.
  The approach is already a major focus at labs but faces fundamental questions
  about whether sophisticated AI systems could game evaluation processes.
---**The approach**: Systematically evaluate AI systems for dangerous capabilities, misalignment, and failure modes before and during deployment.

## Evaluation Summary

| Dimension | Assessment | Notes |
|-----------|------------|-------|
| Tractability | High | Can always do more testing |
| If alignment hard | Medium | May not catch deception |
| If alignment easy | High | Core part of safety process |
| Neglectedness | Low | Major focus at all labs |

## What This Approach Does

- Tests for dangerous capabilities (bio, cyber, manipulation)
- Probes for misaligned behavior
- Red-teams find failure modes adversarially
- Develops benchmarks and standards
- Informs deployment decisions

## Types of Evaluation

| Type | Purpose | Limitation |
|------|---------|------------|
| Capability evals | What can the model do? | Doesn't test intent |
| Behavioral evals | How does it behave? | Can be gamed |
| Red-teaming | Find adversarial failures | May miss subtle issues |
| Interpretability evals | What's happening inside? | Hard to validate |

## Crux 1: Can Evals Catch What Matters?

| Can catch | Cannot catch |
|-----------|--------------|
| Obvious dangerous capabilities | Deceptive alignment |
| Common failure modes | Novel deployment failures |
| Known attack patterns | Sophisticated adversaries |

**Core limitation**: Can only test for what you think to look for.

## Crux 2: Deceptive AI and Evals

| Evals work | Deceptive AI defeats evals |
|------------|---------------------------|
| Deception is hard, has tells | Sophisticated deception possible |
| Red-teamers are clever | AI may be cleverer |
| Combine with other methods | All methods can be gamed |

**Key question**: If an AI wanted to pass evals while being misaligned, could it?

## Crux 3: Standards and Adoption

| Good standards emerging | Standards insufficient |
|------------------------|----------------------|
| Industry coordination happening | Race to deploy undermines testing |
| Government pressure for evals | Evals are box-checking |
| Continuous improvement | Don't test what matters |

## Who Should Work on This?

**Good fit if you believe**:
- Catching problems early is valuable
- Can design evals that detect real risks
- Standards improve industry practice
- Practical impact now

**Less relevant if you believe**:
- Evals can't catch the real risks
- Deceptive alignment defeats testing
- Need deeper solutions first
