---
title: "For Engineers"
description: "The practitioner's path through the framework"
sidebar:
  order: 11
---

# For Engineers

You want to build safe AI systems. Here's the fastest path to implementation.

---

## Skip the Theory Path (15 min)

If you trust the patterns and just want to implement:

1. **[Quick Reference](/getting-started/quick-reference/)** — Core formulas and decision flowchart (5 min)
2. **[Quick Start Guide](/design-patterns/tools/quick-start/)** — Step-by-step implementation checklist (10 min)
3. **[Minimal Framework](/getting-started/minimal-framework/)** — The 5 essential patterns (5 min)

You can stop here and have a working safety layer.

---

## Understand-Then-Build Path (2 hours)

If you want to understand why the patterns work:

1. **[Five-Minute Intro](/getting-started/five-minute-intro/)** — Core problem (5 min)
2. **[Core Concepts](/getting-started/core-concepts/)** — Visual framework (20 min)
3. **[Delegation Risk Overview](/delegation-risk/overview/)** — Quantitative foundation (30 min)
4. **[Design Patterns Index](/design-patterns/)** — Pattern catalog (15 min)
5. **[Composing Patterns](/design-patterns/composing-patterns/)** — Pattern combinations (20 min)
6. **Pick your patterns** — Based on your threat model (20 min)

---

## Pattern Categories for Engineers

### Structural Patterns (How you architect)
| Pattern | What It Does | When to Use |
|---------|--------------|-------------|
| [Least-X Principles](/design-patterns/least-x-principles/) | Minimize permissions, context, autonomy | Always (default) |
| [Structural Patterns](/design-patterns/structural/) | Bulkheads, firewalls, blast radius containment | Multi-component systems |
| [Decomposed Coordination](/design-patterns/decomposed-coordination/) | Separation of powers, rotating validators | High-stakes decisions |

### Verification Patterns (How you check)
| Pattern | What It Does | When to Use |
|---------|--------------|-------------|
| [Verification Patterns](/design-patterns/verification/) | Ghost checker, consistency triangulation | Output validation |
| [Multi-Agent Verification](/design-patterns/multi-agent/) | Cross-validation, adversarial collaboration | AI-on-AI verification |
| [Monitoring Patterns](/design-patterns/monitoring/) | Tripwires, anomaly detection | Runtime safety |

### Recovery Patterns (When things go wrong)
| Pattern | What It Does | When to Use |
|---------|--------------|-------------|
| [Recovery Patterns](/design-patterns/recovery/) | Checkpoint-rollback, graceful degradation | Any production system |
| [Safety Mechanisms](/design-patterns/safety-mechanisms/) | Kill switches, capability sunset | High-autonomy systems |

---

## Implementation Checklist

### Phase 1: Risk Assessment (Day 1)

```
[ ] List all AI components in your system
[ ] For each component, identify:
    - What data can it access?
    - What actions can it take?
    - What's the worst-case outcome?
[ ] Calculate rough risk budget (see Quick Reference)
[ ] Classify as Low / Medium / High risk
```

### Phase 2: Essential Safety (Week 1)

```
[ ] Implement Least Privilege
    - Restrict file access to workspace only
    - Remove unnecessary API permissions
    - Use read-only where possible

[ ] Implement Human Escalation
    - Define escalation thresholds ($, sensitivity, confidence)
    - Build approval workflow
    - Test the escalation path

[ ] Implement Output Filtering
    - PII detection
    - Policy violation checks
    - Harmful content filtering

[ ] Implement Sandboxing
    - Containerized execution
    - Network isolation
    - Resource limits

[ ] Implement Audit Logging
    - All inputs and outputs
    - Decision traces
    - Timestamps and versions
```

### Phase 3: Enhanced Safety (Month 1)

```
[ ] Add verification layer (if high-risk)
[ ] Set up monitoring and alerting
[ ] Create incident response runbook
[ ] Schedule quarterly risk reviews
```

---

## Code-Adjacent Examples

The framework includes worked examples you can reference:

| Example | Type | Key Patterns |
|---------|------|--------------|
| [Research Assistant](/design-patterns/examples/research-assistant-example/) | Multi-step task | Escalation, checkpoints |
| [Trading System](/design-patterns/examples/trading-system-example/) | High-stakes, autonomous | Risk budgets, circuit breakers |
| [Healthcare Bot](/design-patterns/examples/healthcare-bot-example/) | Safety-critical | Output filtering, human review |
| [Code Deployment](/design-patterns/examples/code-deployment-example/) | Infrastructure | Sandboxing, rollback |

---

## Integration Points

### With Existing Frameworks

| If You Use | Integration Point |
|------------|------------------|
| LangChain | Add verification as chain step, use callbacks for monitoring |
| OpenAI Functions | Wrap function calls with permission checks |
| Anthropic Claude | Use system prompts for least-context, implement tool restrictions |
| AutoGPT-style | Add checkpoints between action cycles, implement kill switches |

### With CI/CD

```
Suggestion: Add safety layer tests to your pipeline
- Unit tests for output filters
- Integration tests for escalation paths
- Chaos testing for failure modes
```

---

## Debugging Safety Layers

### Common Issues

| Symptom | Likely Cause | Fix |
|---------|--------------|-----|
| Too many escalations | Thresholds too tight | Adjust based on false positive rate |
| Missed harmful outputs | Filter gaps | Review missed cases, expand rules |
| Slow responses | Heavy verification | Add caching, async verification |
| Verification false positives | Overfitting to training data | Diversify verifier inputs |

---

## What Engineers Often Skip (But Shouldn't)

1. **[Entanglements](/entanglements/)** — If you use the same model in multiple places, failures correlate. Your 3 independent 90% verifiers might only give you 92%, not 99.9%.

2. **[Insurer's Dilemma](/delegation-risk/insurers-dilemma/)** — If you set the risk budget but users bear the harm, you'll systematically underestimate acceptable risk.

3. **[Capability Probing](/design-patterns/monitoring/)** — Systems can hide capabilities. Periodic probing detects capability drift before it causes harm.

---

## See Also

- [Quick Reference](/getting-started/quick-reference/) — Formulas at a glance
- [Examples Catalog](/getting-started/examples-catalog/) — All worked examples
- [Composing Patterns](/design-patterns/composing-patterns/) — Combining patterns
- [Common Mistakes](/getting-started/common-mistakes/) — What to avoid

