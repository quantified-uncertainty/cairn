---
title: "Solutions & Mitigations"
description: "How to reduce entanglement and when it is worth paying for: diversity of method, independent context, isolation, a correlation budget, stress tests, circuit breakers and rotation"
sidebar:
  order: 1
---

A correlated stack of defenses has a floor: $P(\text{all miss}) \geq \rho \cdot \min_i p_i$ ([Formal Definitions](/entanglements/fundamentals/formal-definitions/#the-entanglement-tax)). Every mitigation on this page does one of four things: lowers ρ, lowers the best layer's miss rate, limits what a joint miss can do, or detects ρ rising. The last section covers when the cost is worth paying.

## 1. Diversity of method

The main lever on ρ is a check that fails for different reasons: one that uses a different method or sees different information.

| Dimension | Diversify by | Note |
|---|---|---|
| **Method** | Mixing tiers of the [verifiability hierarchy](/getting-started/core-concepts/#verifiability-hierarchy): formally verified code, deterministic tests and rule-based checks, narrow learned models, LLMs | The strongest lever. A test suite and an LLM reviewer fail for different reasons |
| **Information** | Giving checks different inputs: the raw diff, the execution trace, the network log | Two checks reading the same text share its blind spots |
| **Model family** | Using different providers or families for LLM checks | Helps, but is not sufficient: accurate models have correlated errors across providers ([Kim et al. 2025](https://arxiv.org/abs/2506.07962)) |
| **People** | Having different teams write prompts, rules and escalation paths | Organizational uniformity re-correlates technical diversity |
| **Timing** | Checking before execution, during it and after it | Different moments see different evidence |

A workable **correlation budget** for a consequential action: no two checks share a model family, and at least one check sits at tier 1 or 2 of the hierarchy. The [measurement page](/entanglements/detection/correlation-calculator/#the-threshold-set-a-correlation-budget) turns a risk target into a numeric bound, ρ_max.

Diversity costs vendor relationships, expertise, integration work and latency, and different methods will sometimes disagree. Decide in advance which disagreements escalate to a human.

## 2. Independent context

Active entanglement mostly travels through context. Three rules cut it:

- **Verifiers build their own context** from raw inputs. A check that reads only the agent's summary of its work inherits the agent's framing and omissions.
- **Untrusted content is data, never instructions.** Anything read from a web page, file, email or tool output can carry an injected instruction to every component that reads it, including the checks. Architectures that keep untrusted data out of control flow remove this channel rather than making it less likely ([Debenedetti et al. 2025](https://arxiv.org/abs/2503.18813)).
- **Untrusted monitors see less.** Paraphrase what they see with a trusted model, and redact context they do not need ([Channel Integrity](/design-patterns/channel-integrity/#design-responses)).

## 3. Isolation boundaries

| Mechanism | Isolates | Implementation |
|---|---|---|
| Process separation | Memory, crash propagation | Separate containers or sandboxes |
| Separate state | Data, cross-component signals | Separate databases, caches and memory stores per component |
| Network segmentation | Traffic, outages | Separate subnets, egress allow-lists |
| Credential scoping | Blast radius of a compromise | A distinct key per component, scoped to its task |
| Resource pools | Contention, fail-together under load | Separate rate limits and quotas for checks and actors |

Default to deny: components cannot communicate unless a channel is sanctioned, and sanctioned channels pass a logging gateway. Make checks fail *closed*, so that a timed-out check blocks the action rather than passing it. Isolation costs latency, infrastructure and duplicated resources.

## 4. Budget for correlated risk

The naive calculation and the honest one:

```
Naive:     three 90% layers → P(all miss) = 0.1³ = 0.1% → "99.9% protection"
Corrected: assumed ρ = 0.5 (phi scale)
           P(all miss) = 0.5 × 0.001 + 0.5 × 0.1 = 5.05% → about 95% protection
           entanglement tax ≈ 50×
```

Once ρ is significant, more layers of the same kind buy almost nothing, because they only shrink the independent term:

| Layers | P(all miss) at ρ = 0.5, p = 0.1 |
|---|---|
| 2 | 5.50% |
| 3 | 5.05% |
| 5 | 5.00% |
| 10 | 5.00% |

At this correlation the floor is 5%, and 99.9% protection is unreachable at any layer count. The budget question becomes how to reduce ρ, or how to improve the strongest layer, since the floor scales with min pᵢ. How much a given intervention reduces ρ is an empirical question. Measure φ before and after rather than assuming a reduction.

**Worksheet:**

1. Set the target P(all miss) for the action class.
2. List the layers and estimate each miss rate pᵢ.
3. Estimate ρ on the phi scale ([recipe and priors](/entanglements/detection/correlation-calculator/)).
4. Compute the floor ρ · min pᵢ and the full mixture.
5. If the target is below the floor: reduce ρ, improve the best layer, accept more risk explicitly, or narrow what is delegated.

**Against adaptive adversaries the budget is different.** For the defection and hijack [channels](/delegation-risk/risk-decomposition/), count the stack as its best single layer until a control evaluation measures the joint miss rate under attack ([Risk Propagation](/delegation-risk/risk-propagation/#adversarial-inputs)). There, the useful defenses are those whose guarantee does not depend on ρ: a hard [exposure envelope](/getting-started/glossary/) that blocks out-of-bounds actions whatever the input, and rollback for what gets through.

## 5. Stress testing for coupling

| Test | What it reveals |
|---|---|
| Load testing | Whether checks degrade together, and whether any fail open |
| Fault injection | Whether one failure cascades to others |
| Adversarial red teaming | Whether single inputs evade several layers ("master keys") |
| Shared-dependency outage | What happens when a common provider, database or rate limit goes down |
| Latency injection | Race conditions between a check and the action it gates |

Measure φ and P(all miss) under each condition and compare them with normal operation and with the correlation budget. Conditional correlation, which appears only under stress, is invisible to every other method.

## 6. Correlation circuit breakers

A circuit breaker watches the joint behavior of checks and tightens the system when correlation rises. In production you only know a check missed when the item is later audited or caught downstream, so run it on that audited stream:

```python
from collections import deque
import numpy as np

class CorrelationCircuitBreaker:
    """Trips when the max pairwise phi of recent audited misses exceeds the budget."""

    def __init__(self, n_layers: int, rho_max: float, window: int = 500):
        self.rho_max = rho_max
        self.window = deque(maxlen=window)
        self.n_layers = n_layers

    def record(self, misses: list[bool]) -> bool:
        """misses[i] is True if layer i missed this audited harmful item."""
        self.window.append(misses)
        if len(self.window) < self.window.maxlen:
            return False
        m = np.array(self.window, dtype=bool)
        worst = np.nanmax([
            phi(m[:, i], m[:, j])          # phi() from the measurement page
            for i in range(self.n_layers)
            for j in range(i + 1, self.n_layers)
        ])
        return worst > self.rho_max      # True: escalate
```

Use φ, not the share of joint failures among all failures. That share is a Jaccard index, not a correlation: it is about 0.05 even for independent layers at p = 0.1. Expect noise: from 500 items the standard error of φ is roughly 0.045, so require the excess to persist before tripping. When the breaker trips, respond in proportion: raise the human review rate, route the action class to a stricter path, or pause autonomous execution of it.

## 7. Re-verify independence

Independence decays as systems are optimized. Re-check it after any change to models, prompts, infrastructure or team ownership, and on a schedule:

- **Ablation:** disable one layer on a test set. If the stack's miss rate barely changes, that layer was covering the same items as the others.
- **Transfer:** take inputs that defeat one layer and measure how often they defeat each other layer, relative to that layer's base miss rate.
- **Fresh measurement:** recompute the φ matrix on a refreshed challenge set ([Audit Guide](/entanglements/mitigation/audit-guide/)).

## 8. Rotation against capture

Repeated pairings let components adapt to each other, and capture develops gradually. Rotate verifiers across agents, weighted against recent pairings:

```python
import random
from collections import defaultdict

class PairingRotator:
    def __init__(self):
        self.pair_counts = defaultdict(int)

    def select_verifier(self, agent_id: str, verifiers: list[str]) -> str:
        weights = [1.0 / (1 + self.pair_counts[(agent_id, v)]) for v in verifiers]
        choice = random.choices(verifiers, weights=weights)[0]
        self.pair_counts[(agent_id, choice)] += 1
        return choice
```

Add periodic review by a verifier the agent has never met, and track approval-rate drift per pair ([Detecting Influence](/entanglements/detection/detecting-influence/#5-drift-and-capture-indicators)).

## 9. Dependency hygiene

Three habits from software engineering transfer directly:

- **Inject dependencies from above.** The coordinator assigns each agent its tools, subagents and checks. An agent that chooses its own verifier has chosen its own oversight.
- **Keep the dependency graph acyclic.** No check may depend on the output of the thing it checks, and no agent may supervise its own supervisor.
- **Segregate interfaces.** Give each task the narrowest tool interface it needs, such as read-only file access or a sandboxed executor, rather than a general agent with every permission.

## When independence is worth paying for

Delegation risk is an expected loss: Σ P(harm) × damage. For an AND-structured stack, the relevant term is the number of harmful actions that reach the stack, times P(all miss), times the damage per unblocked action. An intervention is worth its cost when the reduction in that term over the planning period exceeds the cost. The calculation needs the volume of harmful attempts and the damage estimate as much as ρ; without them, a lower tax is not a reason to spend.

Accepting correlation is reasonable when:

- **stakes are low and reversible**, such as drafts and internal tools (reassess when a prototype becomes production);
- **no diverse method exists** for the check. Correlated protection beats none, but document the gap and revisit it;
- **compensating controls bound the damage**: a hard envelope, rollback or insurance;
- **the residual risk is accepted explicitly** by someone accountable, in writing.

It is not reasonable when:

- **the action is irreversible**: deletions, payments, public communications, physical actions;
- **an adversary is expected**. Assume attackers will find the shared blind spot, and budget with ρ = 1;
- **the target is valuable enough** that finding a master key is worth an attacker's effort;
- **regulation or contract requires** demonstrable independence.

When you cannot estimate ρ, treat "unknown" as "correlated" (ρ ≥ 0.5 for shared provider, training or context) and invest in measuring it once stakes are more than low. With limited resources, start with the highest-stakes action classes and the most correlated pairs, take the cheap interventions first (independent context, separate prompts and teams, fail-closed checks), and remember that monitoring a correlation does not reduce it.

---

See also:
- [Types of Entanglement](/entanglements/fundamentals/types/): what you are mitigating
- [Measuring Entanglement](/entanglements/detection/correlation-calculator/): φ, thresholds and priors
- [Audit Guide](/entanglements/mitigation/audit-guide/): the assessment protocol
- [Worked Examples](/entanglements/case-studies/examples/): redesigns end to end
- [Channel Integrity](/design-patterns/channel-integrity/): the design-pattern view
