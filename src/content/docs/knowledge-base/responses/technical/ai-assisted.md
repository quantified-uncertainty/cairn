---
title: AI-Assisted Alignment
description: Using AI systems to help solve alignment problems.
importance: 4
quality: 4
llmSummary: This page analyzes using current AI systems to help solve alignment
  problems, covering applications from red-teaming to interpretability. It
  identifies key risks including the bootstrapping problem (using potentially
  misaligned AI to align future AI) and loss of human understanding as AI
  assistance scales.
---
**The approach**: Use current AI systems to help with alignment research—from red-teaming to interpretability to developing new safety techniques.

## Evaluation Summary

| Dimension | Assessment | Notes |
|-----------|------------|-------|
| Tractability | High | Already doing this |
| If alignment hard | Medium | Bootstrapping may fail |
| If alignment easy | High | Accelerates solutions |
| Neglectedness | Low | Major focus, but strategic risks underexplored |

## What This Approach Does

- AI assists with red-teaming and finding failure modes
- AI helps with interpretability research
- AI evaluates outputs humans can't assess
- AI helps develop safety techniques
- "Superalignment": AI helps align more powerful AI

## Current Uses

| Application | Status | Promise |
|-------------|--------|---------|
| Red-teaming | Deployed | Finding novel attacks |
| Code review | Deployed | Catching bugs |
| Interpretability | Research | Labeling features |
| Alignment research | Research | Generating hypotheses |
| Recursive oversight | Research | Scaling evaluation |

## Crux 1: Is It Safe?

| Safe to use | Dangerous |
|-------------|-----------|
| Current AI is aligned enough | Subtle misalignment propagates |
| Can verify AI contributions | AI sabotages alignment work |
| Limited to narrow tasks | Dependency on AI judgment grows |

**The bootstrapping problem**: Using AI to align more powerful AI only works if the helper is aligned.

## Crux 2: Will It Scale?

| Scales | Doesn't scale |
|--------|---------------|
| AI assistance gets better with AI | At some point, helper is as dangerous as target |
| Maintains human oversight | Eventually humans out of the loop |
| Incremental trust building | Trust building is circular |

## Crux 3: Loss of Understanding?

| Understanding preserved | Understanding lost |
|------------------------|-------------------|
| AI explains its work | Humans can't verify explanations |
| AI assists, humans lead | AI increasingly autonomous |
| Transparency is possible | Complexity exceeds human grasp |

**Risk**: Humans become dependent on AI-generated safety claims they can't verify.

## Who Should Work on This?

**Good fit if you believe**:
- AI assistance is necessary (problems too hard for humans alone)
- Can build trust incrementally
- Short timelines require AI help
- Careful use is better than abstaining

**Less relevant if you believe**:
- Bootstrapping is fundamentally dangerous
- Better to maintain human-only understanding
- Current AI is too unreliable
