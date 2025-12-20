---
title: Scalable Oversight
description: Extending human supervision to superhuman AI systems.
---

**The approach**: Develop methods to maintain meaningful human oversight of AI systems even as they become more capable than humans at specific tasks.

## Evaluation Summary

| Dimension | Assessment | Notes |
|-----------|------------|-------|
| Tractability | Medium | Active research, unclear if sufficient |
| If alignment hard | High | Addresses core scalability problem |
| If alignment easy | Medium | Still useful for verification |
| Neglectedness | Medium | Major research direction at Anthropic, OpenAI |

## What This Approach Does

- AI Debate: AI systems argue, humans judge
- Recursive reward modeling: AI helps evaluate AI
- Decomposition: Break hard tasks into human-verifiable pieces
- Weak-to-strong generalization: Train strong models from weak supervision

## Core Techniques

| Technique | How it works | Promise |
|-----------|--------------|---------|
| Debate | Two AIs argue; humans pick winner | Honest AI should win debates |
| Market making | AI predicts what informed human would say | Scalable without querying humans |
| Recursive reward modeling | AI helps human give feedback | Scales human judgment |
| Prover-verifier games | AI proves claims, other AI verifies | Asymmetric verification |

## Crux 1: Does Debate Actually Work?

| Works | Doesn't work |
|-------|--------------|
| Truth has natural advantage | Deception can be convincing |
| Judges can learn | Experts can be fooled |
| Empirical success in tests | Won't scale to real problems |

**Open question**: Does honest AI actually win debates, or can sophisticated deception prevail?

## Crux 2: Can Humans Remain Meaningful?

| Meaningful role | Humans become rubber stamps |
|-----------------|----------------------------|
| Decomposition preserves oversight | Can't decompose everything |
| AI assistance enhances judgment | AI subtly manipulates judges |
| Verification is easier than generation | Verification also gets hard |

## Crux 3: Does This Solve Alignment or Defer It?

| Solves alignment | Just defers the problem |
|------------------|------------------------|
| Keeps humans in control | Eventually humans out of loop |
| Scales incrementally | Breaks at some capability level |
| Catches misalignment | Misaligned AI games the oversight |

## Who Should Work on This?

**Good fit if you believe**:
- Alignment requires human oversight at some level
- Clever protocols can extend human judgment
- The core problem is scalability, not impossibility

**Less relevant if you believe**:
- Humans will inevitably be outmatched
- Deceptive AI will game any oversight
- Need interpretability, not oversight
