---
title: AI Safety Approaches
description: Evaluating different approaches to making AI safe.
---

This section evaluates major approaches to AI safety. For each approach, we assess key cruxes: Is it tractable? When is it important? What are the key uncertainties?

## The Evaluation Framework

Each approach is evaluated on:

| Dimension | Question |
|-----------|----------|
| **Tractability** | Can we make meaningful progress? |
| **Importance (hard alignment)** | How valuable if alignment is fundamentally hard? |
| **Importance (easy alignment)** | How valuable if alignment is tractable? |
| **Neglectedness** | How much is the field already working on this? |
| **Key uncertainty** | What's the main crux for this approach? |

## Technical Alignment Approaches

### Black-Box Safety (Behavioral)

Methods that shape AI behavior through training and inference without inspecting internals.

| Approach | Tractable? | If alignment hard | If alignment easy | Key uncertainty |
|----------|------------|-------------------|-------------------|-----------------|
| [RLHF / Constitutional AI](/approaches/rlhf) | High | Low | High | Scales to superhuman? |
| [Scalable Oversight](/approaches/scalable-oversight) | Medium | High | Medium | Actually works? |
| [Evals & Red-teaming](/approaches/evals) | High | Medium | High | Catches real risks? |

### White-Box Safety (Interpretability)

Methods that look inside AI systems to understand and verify their behavior.

| Approach | Tractable? | If alignment hard | If alignment easy | Key uncertainty |
|----------|------------|-------------------|-------------------|-----------------|
| [Mechanistic Interpretability](/approaches/interpretability) | Medium | High | Low | Will it scale? |

### AI-Assisted Approaches

Using AI systems to help solve alignment problems.

| Approach | Tractable? | If alignment hard | If alignment easy | Key uncertainty |
|----------|------------|-------------------|-------------------|-----------------|
| [AI-Assisted Alignment](/approaches/ai-assisted) | High | Medium | High | Is it safe to bootstrap? |

### Theoretical Foundations

Foundational research on agency, goals, and control.

| Approach | Tractable? | If alignment hard | If alignment easy | Key uncertainty |
|----------|------------|-------------------|-------------------|-----------------|
| [Corrigibility Research](/approaches/corrigibility) | Low | High | Low | Coherent concept? |
| [Agent Foundations](/approaches/agent-foundations) | Low | High | Low | Can we make progress? |

### Multi-Agent Safety

Addressing safety when multiple AI systems interact.

| Approach | Tractable? | If alignment hard | If alignment easy | Key uncertainty |
|----------|------------|-------------------|-------------------|-----------------|
| [Multi-Agent Coordination](/approaches/multi-agent) | Medium | High | Medium | Can we ensure safe collective behavior? |

## Governance & Coordination Approaches

| Approach | Tractable? | If alignment hard | If alignment easy | Key uncertainty |
|----------|------------|-------------------|-------------------|-----------------|
| [Lab Safety Culture](/approaches/lab-culture) | Medium | High | High | Will labs adopt? |
| [Governance & Policy](/approaches/governance) | Medium | High | High | Will it be adopted? |
| [Compute Governance](/approaches/compute-governance) | Medium | High | Medium | Technically feasible? |
| [International Coordination](/approaches/international) | Low | High | Medium | Cooperation possible? |
| [Pause Advocacy](/approaches/pause) | Low | High | Low | Politically feasible? |

## Strategic Questions

| Question | Key uncertainty |
|----------|-----------------|
| [Open Source: Net Positive?](/approaches/open-source) | Benefits vs. misuse risk at different capability levels |

## How to Use This

1. **Identify your worldview**: Which [worldview](/worldviews) are you closest to?
2. **Find relevant approaches**: Your worldview determines which approaches are highest-priority
3. **Investigate key uncertainties**: Click into each approach to understand the cruxes
4. **Form your own view**: Combine your risk assessment with approach evaluation

## Cross-Cutting Cruxes

Some questions affect many approaches:

| Crux | If true... | If false... |
|------|------------|-------------|
| Current LLMs inform future AI | Current safety research transfers | Need to focus on theoretical work |
| AI can help with alignment | AI-assisted approaches promising | Must rely on human researchers |
| Deceptive alignment is likely | Need robust detection methods | Behavioral training may suffice |
| Fast takeoff | Need solutions before AGI | Can iterate during transition |

## For Researchers: Mapping to Research Literature

This framework simplifies a richer research landscape. For deeper engagement with the literature, here's how our categories map to the [Shallow Review 2025](https://shallow-review-website.vercel.app/overview) ontology (800+ papers, 80 research agendas):

| Our Category | Shallow Review Categories | Example Agendas |
|--------------|---------------------------|-----------------|
| **Black-Box Safety** | Black-box safety (25 agendas) | Iterative alignment, inference-time methods, model psychology, goal robustness |
| **White-Box Safety** | White-box safety (14 agendas) | Concept-based interpretability, reverse engineering, deception detection, sparse coding |
| **AI-Assisted** | Make AI solve it (5 agendas) | Weak-to-strong generalization, debate, introspection training |
| **Theoretical Foundations** | Theory (9 agendas) | Corrigibility, natural abstractions, agent foundations, tiling agents |
| **Multi-Agent Safety** | Multi-agent first (6 agendas) | Context alignment, social contracts, coordination theory |
| **Evals** | Evals (12 agendas) | AGI metrics, deception detection, scheming, sandbagging |
| **Governance** | (Not covered) | — |

### Research Areas We Don't Cover

The Shallow Review includes agendas not represented here:

- **Safety by construction** (3 agendas): Guaranteed-Safe AI, Scientist AI, Brainlike-AGI Safety
- **Labs** (6 agendas): Research output by organization (OpenAI, DeepMind, Anthropic, etc.)
- **Granular black-box approaches**: Model psychology, poisoning defense, better data filtering
