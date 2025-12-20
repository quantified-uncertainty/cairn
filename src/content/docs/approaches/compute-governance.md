---
title: Compute Governance
description: Controlling AI development through compute infrastructure.
---

**The approach**: Use the physical nature of compute hardware as a control point for AI governance—monitoring, restricting, or allocating compute resources.

## Evaluation Summary

| Dimension | Assessment | Notes |
|-----------|------------|-------|
| Tractability | Medium | Hardware is physical, but enforcement complex |
| If alignment hard | High | Could slow dangerous development |
| If alignment easy | Medium | Less critical but still useful |
| Neglectedness | Medium | Growing interest, limited implementation |

## Why Compute?

Unlike software, compute is:
- **Physical**: Can't be copied infinitely
- **Concentrated**: Few manufacturers (NVIDIA, TSMC)
- **Visible**: Large training runs are detectable
- **Expensive**: Natural barrier to frontier AI

## Mechanisms

| Mechanism | How it works | Feasibility |
|-----------|--------------|-------------|
| Export controls | Restrict chip sales to certain countries | Already happening (US-China) |
| Licensing | Require approval for large training runs | Possible but new |
| Monitoring | Detect large compute usage | Technically feasible |
| Allocation | Government allocates compute for safety | Requires major policy shift |

## Crux 1: Is Compute a Durable Control Point?

| Durable | Not durable |
|---------|-------------|
| Hardware is physical | Algorithmic efficiency improves |
| Manufacturing is concentrated | More manufacturers emerge |
| Large gaps in access | Training becomes cheaper |

**Key uncertainty**: How much can algorithmic progress reduce compute needs?

## Crux 2: Can We Actually Monitor/Control?

| Can control | Cannot control |
|-------------|----------------|
| Data centers are visible | Distributed computing evades detection |
| Few large players | Proliferation already happened |
| Chips can have hardware controls | Controls can be circumvented |

## Crux 3: Desirable to Control?

| Desirable | Undesirable |
|-----------|-------------|
| Slows dangerous development | Centralizes power dangerously |
| Enables verification | Stifles beneficial research |
| Levels playing field | Creates black markets |

## Who Should Work on This?

**Good fit if you believe**:
- Technical solutions need time to develop
- Physical control points are underexploited
- Policy can influence development trajectories
- Hardware/supply chain expertise

**Less relevant if you believe**:
- Compute isn't a durable bottleneck
- Controls will backfire or be circumvented
- Better to focus on technical alignment
