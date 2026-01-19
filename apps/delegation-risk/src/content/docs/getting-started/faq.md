---
title: "FAQ & Common Objections"
sidebar:
  order: 4
---

# FAQ & Common Objections

Answers to frequently asked questions and responses to common skepticism.

## Conceptual Questions

### "Isn't this just defense in depth? That's not new."

Yes, defense in depth is the core principle—but applied systematically to AI systems with quantified delegation risk budgets. The novelty is:

1. **Trust as the primary resource**: Not just "add more checks" but "budget expected harm across components"
2. **Formal propagation rules**: Mathematical framework for how trust compounds through delegation chains
3. **AI-specific constraints**: The "Least X" principles address AI-unique risks like context accumulation and optimization pressure

Defense in depth tells you *what* to do. This framework attempts to provide structure for reasoning about *how much* and *where*—though the estimates are often uncertain.

### "How is Delegation Risk different from regular risk assessment?"

Delegation Risk (Delegation Risk) is a specific instantiation of expected value calculation:

```
Delegation Risk = Σ P(outcome) × Damage(outcome)
```

The key differences from traditional risk assessment:

| Traditional Risk | Delegation Risk Approach |
|-----------------|--------------|
| Often qualitative (High/Medium/Low) | Always quantified (dollars) |
| Per-hazard analysis | Per-component allocation |
| Static assessment | Dynamic budget tracking |
| Compliance-focused | Optimization-focused |

Delegation Risk lets you make tradeoffs: "Is adding verification worth $50/month in reduced Delegation Risk?"

### "Why decomposition instead of one aligned agent?"

Two reasons:

1. **Alignment is uncertain**: We don't know how to guarantee alignment. Decomposition limits damage if we're wrong.

2. **Verification is easier**: Verifying a narrow component is tractable. Verifying a general agent's behavior across all possible inputs is not.

Even if we solved alignment tomorrow, decomposition would still be valuable for auditability, modularity, and incremental deployment.

### "Can't a sufficiently intelligent system route around these constraints?"

Theoretically, yes—if it has:
- Enough context to understand the constraints
- Enough capability to find exploits
- Enough persistence to execute multi-step plans
- Enough connectivity to coordinate attack

The "Least X" principles specifically bound each of these. A component that doesn't know it's constrained, can't remember previous invocations, and can't communicate with other components has limited ability to "route around."

This isn't a proof of safety—it's defense in depth that makes attacks harder.

### "Doesn't this severely limit what AI can do?"

Yes, deliberately. The question is: **limited compared to what?**

| Approach | Capability | Safety |
|----------|------------|--------|
| Unrestricted agent | Maximum | Minimal |
| Decomposed system | High (but slower) | Bounded |
| Tool AI only | Limited | Higher |

Decomposed systems may be able to accomplish many tasks—they do it through many narrow components rather than one powerful agent. The tradeoff is latency and complexity; how much capability is lost depends on the specific task and implementation.

---

## Practical Questions

### "How do I estimate failure probabilities?"

Start with rough estimates and refine:

| Estimate Type | When to Use |
|--------------|-------------|
| **Historical data** | If you have logs of similar systems |
| **Red team results** | Run adversarial testing, measure failure rate |
| **Expert judgment** | For novel systems, calibrated estimates |
| **Conservative defaults** | P=0.1 for LLM outputs, P=0.01 for code |

The specific number matters less than:
1. Consistent methodology across components
2. Regular updates as you gather data
3. Conservative bias (overestimate risk)

### "What's the minimum I need to do?"

For low-risk internal tools:

1. **List components** (5 min)
2. **Estimate worst-case damage** per component (10 min)
3. **Apply basic Least X checklist** (15 min)
4. **Add monitoring** (varies)

See the [Quick Start](/design-patterns/tools/quick-start/) for the full process, but you can start with just steps 1-3.

### "How does this work with existing ML infrastructure?"

This framework is infrastructure-agnostic. Components can be:

- API calls to hosted models (OpenAI, Anthropic)
- Self-hosted models (Llama, Mistral)
- Traditional code (Python, TypeScript)
- Hybrid systems

The constraints are applied at the **interface** level—permissions, context windows, output validation—not the implementation.

### "What tools support this?"

Currently, implementing requires manual engineering. Useful building blocks:

- **LangChain/LlamaIndex**: Component orchestration
- **Guardrails AI**: Output validation
- **OpenTelemetry**: Monitoring and tracing
- **Semgrep**: Static analysis for code components

See the [Interactive Calculators](/design-patterns/tools/delegation-risk-calculator/) for Delegation Risk computation.

### "How do I convince my team/manager to adopt this?"

Focus on risk reduction ROI:

1. **Quantify current risk**: "Our current system has ~$X/month expected harm"
2. **Show mitigation cost**: "Adding verification reduces this to $Y for Z engineering effort"
3. **Compare alternatives**: "Versus incident response, prevention is N times cheaper"

The Delegation Risk framework gives you concrete numbers to make the business case.

---

## Skeptical Questions

### "This seems like a lot of overhead for uncertain benefit."

Fair concern. The framework is most valuable when:

| Situation | Framework Value |
|-----------|-----------------|
| Low-stakes internal tools | Low—simple safeguards sufficient |
| Customer-facing products | Medium—reputation/liability risk |
| Autonomous systems | High—limited human oversight |
| Safety-critical applications | Essential—regulatory/catastrophic risk |

Start with high-risk components. Apply lighter versions elsewhere.

### "Don't the Least X principles conflict with each other?"

Sometimes, yes. For example:
- **Least Intelligence** vs. **task requirements**: Some tasks need capable models
- **Least Context** vs. **task performance**: More context often improves quality

The resolution: **apply constraints proportionate to risk**. A public FAQ bot needs less constraint than a code deployment system.

Use the [Decision Guide](/design-patterns/tools/decision-guide/) to navigate tradeoffs.

### "Why trust old/dumb models for coordination when they make more mistakes?"

Two types of mistakes:

1. **Capability errors**: Wrong answer due to insufficient intelligence
2. **Alignment failures**: Correct execution of wrong goal (including deception)

Old/dumb models make more Type 1 errors but fewer Type 2 errors. For coordination:
- Type 1 errors → caught by verification layers
- Type 2 errors → potentially catastrophic, hard to detect

The framework accepts higher capability error rates in exchange for lower alignment failure rates.

### "How do you know this actually works?"

Honestly: **we don't have proof for AI systems specifically**. The evidence is:

1. **Analogous domains**: Nuclear, finance, and aerospace use similar principles with demonstrated success
2. **Logical argument**: Limiting capability, context, and connectivity necessarily limits attack surface
3. **Red team results**: Systems designed with these constraints are harder to exploit

The [Empirical Tests](/design-patterns/tools/empirical-tests/) page outlines how to gather evidence for your specific deployment.

### "Isn't this just security theater?"

Security theater provides the *appearance* of security without substance. This framework differs:

| Security Theater | This Framework |
|-----------------|----------------|
| Qualitative ("more secure") | Quantified (Delegation Risk in dollars) |
| Checkbox compliance | Budget allocation and monitoring |
| Static assessment | Continuous measurement |
| Unfalsifiable claims | Testable predictions |

If your Delegation Risk estimates are wrong, production data should eventually show it. That's the intent, at least—whether it works in practice for AI systems specifically is still being validated.

---

## Technical Questions

### "How does risk inheritance handle cycles?"

For acyclic graphs: straightforward path calculation.

For cycles: several approaches:
1. **Iteration to convergence**: Repeatedly apply propagation until stable
2. **Maximum path length**: Ignore paths longer than k
3. **Damping factor**: Each hop reduces trust (like PageRank)

Most practical systems should be acyclic by design—cycles indicate potential coordination channels.

### "What about emergent behavior from component interactions?"

Emergent behavior is limited by:
1. **Information bottlenecks**: Components can only share structured outputs
2. **No direct communication**: Must go through verified channels
3. **Independent implementations**: Different components, different failure modes

This doesn't prevent all emergence, but bounds the complexity of emergent behavior to what can be expressed through the defined interfaces.

### "How do you handle adversarial users, not just adversarial AI?"

Same principles apply:
- **Least Privilege**: Users get minimum necessary access
- **Input validation**: All inputs sanitized/validated
- **Rate limiting**: Prevent rapid exploitation attempts
- **Monitoring**: Detect anomalous usage patterns

The framework handles both AI-origin and human-origin threats.

---

## See Also

- [Quick Start](/design-patterns/tools/quick-start/) — Practical application checklist
- [Decision Guide](/design-patterns/tools/decision-guide/) — Navigating tradeoffs
- [Related Approaches](/reference/related-approaches/) — How this compares to alternatives
- [Empirical Tests](/design-patterns/tools/empirical-tests/) — Validation methodology
