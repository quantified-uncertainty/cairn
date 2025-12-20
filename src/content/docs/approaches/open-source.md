---
title: Open Source Safety
description: The role of open-source AI in safety outcomes.
---

**The question**: Is open-source AI development (releasing model weights publicly) net positive or negative for safety?

## Evaluation Summary

| Dimension | Assessment | Notes |
|-----------|------------|-------|
| Tractability | High | Decisions are being made now |
| If alignment hard | Unclear | Could go either way |
| If alignment easy | Positive | More researchers, more transparency |
| Neglectedness | Medium | Active debate, strong opinions |

## This Is Different

Unlike other approaches, this isn't a "thing to work on"—it's a strategic question about ecosystem structure.

## Arguments for Open Source Safety

| Benefit | Mechanism |
|---------|-----------|
| More safety research | Academics can study real models |
| Decentralization | Reduces concentration of AI power |
| Transparency | Can verify what models do |
| Accountability | Public scrutiny of capabilities |
| Red-teaming | More people finding problems |

## Arguments Against Open Source

| Risk | Mechanism |
|------|-----------|
| Misuse | Bad actors fine-tune for harm |
| Proliferation | Dangerous capabilities spread |
| Undoing safety | Can remove RLHF, safety training |
| Irreversibility | Can't recall released models |
| Race dynamics | Accelerates capability diffusion |

## Crux 1: Net Effect on Safety?

| Net positive | Net negative |
|--------------|--------------|
| More eyes find more bugs | Malicious use outweighs benefits |
| Decentralization is safer | Centralized control is safer |
| Competition prevents monopoly | Proliferation enables catastrophe |

## Crux 2: Capability Threshold

| Current models: safe to open | Eventually: too dangerous |
|-----------------------------|--------------------------|
| Misuse limited by model capability | At some capability, misuse is catastrophic |
| Benefits currently outweigh risks | Threshold may be soon |

**Key question**: At what capability level does open source become net negative?

## Crux 3: Compute vs. Weights

| Open weights matter | Compute is the bottleneck |
|---------------------|--------------------------|
| Training is expensive; inference is cheap | Without compute, can't do much |
| Weights enable fine-tuning | Algorithmic improvements need compute |

## Policy Implications

Your view on open source affects:
- Whether to support open releases (Meta's Llama, etc.)
- Whether to regulate model release
- How to structure compute governance
- Career choices (open vs. closed labs)
