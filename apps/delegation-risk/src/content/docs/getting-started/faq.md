---
title: "FAQ & Common Objections"
description: "Answers to frequently asked questions and responses to common skepticism about the delegation risk framework."
---

## Conceptual questions

### "Isn't this just defense in depth?"

Defense in depth is the starting point. The framework adds three things.

1. **A price for correlation.** Defense in depth is usually argued as if layers fail independently. Three checks that each miss 10% do not give a 0.1% miss rate if they share a model family, training data or context. With common-cause weight ρ they miss (1−ρ)·0.001 + ρ·0.1, which is about 11×, 21× or 50× the naive figure at ρ = 0.1, 0.2 or 0.5 (the [entanglement tax](/entanglements/)). You cannot stack your way past that floor. The useful question becomes how to lower ρ, by using different providers or non-LLM checks, not how many layers to add. Two caveats apply. ρ between LLM checks is measured only on benchmark questions, where it is about 0.3–0.6 across providers and 0.5–0.7 within one ([evidence](/entanglements/detection/correlation-calculator/#what-the-evidence-supports)). And this is benign-failure math: against an attacker who searches for inputs that defeat every layer, assume ρ near 1 unless a [control evaluation](/research/trust-behavior/empirical-scheming-reduction/) shows otherwise.
2. **Budgeting in expected dollars**, so that a safeguard's cost can be compared with the risk it removes.
3. **Separating harm channels.** Accident, defection and hijack call for different safeguards ([Risk Decomposition](/delegation-risk/risk-decomposition/)).

### "How is this different from ordinary risk assessment?"

It is ordinary expected-loss assessment ([formula](/getting-started/core-concepts/#the-formula)) applied per delegate and tracked at runtime. FAIR already expresses cyber risk as loss frequency times magnitude in money ([Related Approaches](/reference/related-approaches/)). What is specific here is the delegation structure: who delegates to whom, how checks compose, and how a harness keeps the account.

### "Why decomposition instead of one aligned agent?"

We cannot yet verify alignment, so decomposition limits the damage if we are wrong. Verifying a narrow component is also tractable in a way that verifying a general agent across all inputs is not.

### "Can't a capable enough system route around these constraints?"

Yes, given enough context, capability, persistence and connectivity; the Least-X principles each bound one of those. Do not assume a component is unaware of its constraints, however. Current models often infer that they are being evaluated: Schoen et al. 2025 report chains of thought that show awareness of alignment evaluation, and causal evidence that this awareness reduces covert behavior ([arXiv:2509.15541](https://arxiv.org/abs/2509.15541)). Limits the harness enforces mechanically hold whether or not the model notices them.

### "Doesn't this limit what AI can do?"

Deliberately. How much capability decomposition costs depends on the task; the site does not know the general answer (see the speculative [strong-tools discussion](/power-dynamics/)).

## Practical questions

### "How do I estimate failure probabilities?"

In rough order of preference:

1. Logs from the same or a similar system.
2. Red-team and challenge-set results: run the component on labeled cases and count failures per task.
3. Calibrated expert elicitation, with ranges rather than points.

State the unit (per task, per action, per month) and reconcile against observed incidents once you have them. There are no defensible universal defaults: a miss rate measured on one task does not transfer to another.

### "What's the minimum I need to do?"

Build [the minimal delegation-engineering layer](/getting-started/core-concepts/#the-minimal-delegation-engineering-layer): write down the harm surface, enforce a hard envelope, set a correlation budget, and keep a reconciled ledger. The [Quick Start](/design-patterns/tools/quick-start/) walks through a first pass.

### "What tools support this?"

None implements the accounting end to end. The pieces:

- **Agent harnesses**: pre-tool-use hooks, permission modes, MCP tool allow-lists, sandboxed execution and egress controls. These provide the envelope and a place for the preflight.
- **Guard models**: classifiers such as Llama Guard ([arXiv:2312.06674](https://arxiv.org/abs/2312.06674)) and agent guardrail systems such as LlamaFirewall ([arXiv:2505.03574](https://arxiv.org/abs/2505.03574)). Count them toward your correlation budget like any other check.
- **Prompt-injection designs**: CaMeL ([arXiv:2503.18813](https://arxiv.org/abs/2503.18813)) and related design patterns ([arXiv:2506.08837](https://arxiv.org/abs/2506.08837)).
- **Evaluations**: UK AISI's Inspect framework; ControlArena (UK AISI with Redwood Research, 2025) for control experiments; AgentDojo ([arXiv:2406.13352](https://arxiv.org/abs/2406.13352)) for prompt-injection attacks and defenses on tool-using agents.
- **Tracing**: OpenTelemetry or the harness's own logs, as raw material for a ledger.

The [delegation risk calculator](/design-patterns/tools/delegation-risk-calculator/) does the arithmetic.

## Skeptical questions

### "Why use less capable models as monitors when they make more mistakes?"

A less capable model makes more capability errors, but if it is below the level at which scheming is a live concern, it is unlikely to defect strategically. That is AI Control's *trusted model* assumption ([Greenblatt et al. 2023](https://arxiv.org/abs/2312.06942)), and it is an assumption, not a measurement. Capability errors can be caught by other layers; strategic defection is hard to detect. The framework accepts more of the first to get less of the second.

### "How do you know this works?"

We don't, for AI systems. Analogous fields offer mixed evidence. Nuclear and aviation safety allocate failure budgets through fault trees, with real but imperfect success. Value-at-risk budgeting in finance failed visibly in 2008, partly because the models understated correlation, which is close to the failure this framework is about. The logical case is that limiting capability, context and connectivity limits the attack surface. It has not been validated against AI-specific threats; [Open Problems](/research/potential-projects/) lists the experiments that would test it.

### "Isn't this security theater?"

It would be if the numbers were never checked. The safeguard is reconciliation: estimates are compared with outcomes and revised. The framework also makes predictions that could prove it wrong. One example: on a shared labeled set of harmful actions, two LLM monitors from the same provider will show a phi coefficient of per-item misses above 0.3. If such measurements come out consistently near zero, the entanglement tax is overstated and the site should say so.

## Technical questions

### "How does propagation handle cycles?"

Design for acyclic delegation; a cycle is a channel through which components can coordinate. If one is unavoidable, simulate the system. Do not add per-hop discounts: the [canonical rule](/delegation-risk/risk-propagation/) already penalizes length through multiplication, and a discount double-counts.

### "What about emergent behavior from component interactions?"

Structured interfaces and one-way information flows bound what components can express to each other. They do not make components independent. Components built on the same model share blind spots and can coordinate without communicating, by reasoning alike. Treat shared-model components as correlated by default ([Entanglements](/entanglements/)).

### "How do you handle adversarial users and third parties?"

As a separate harm channel, *hijack*: someone steers a delegate that is not itself scheming, through direct misuse or through instructions planted in content it reads, including web pages, emails, issues, tool outputs and MCP tool descriptions ([routes](/delegation-risk/risk-decomposition/)). Filtering does not work reliably for natural-language inputs. Nasr et al. (2025) bypassed all 12 recent jailbreak and prompt-injection defenses they tested with adaptive attacks, most at above 90% success, although most had originally reported near-zero attack success ([arXiv:2510.09023](https://arxiv.org/abs/2510.09023)). So the defenses are structural:

- Keep untrusted data out of control flow, as CaMeL does.
- Strip capabilities from any component that reads untrusted content.
- Enforce a hard envelope, so that a hijacked delegate can reach little.

Assume ρ near 1 across checks an attacker can probe, and estimate P by adaptive red-teaming, for example with AgentDojo ([arXiv:2406.13352](https://arxiv.org/abs/2406.13352)), not against a fixed list of attack strings.
