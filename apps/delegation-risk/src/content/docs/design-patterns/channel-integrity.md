---
title: "Channel Integrity"
description: "Active boundary violations between components (side deals, verifier corruption, collusion and logical correlation), what they cost in joint-miss probability, and the design response"
sidebar:
  order: 9
---

[Entanglements](/entanglements/) covers passive correlation: components that fail together because they share a provider, training or context. Channel integrity covers the active case, where components influence each other outside the channels the architecture sanctions, whether deliberately or as an emergent effect. Both break the independence that the redundancy patterns assume: [Voting Tribunal](/design-patterns/structural/#voting-tribunal), [Adversarial Collaboration](/design-patterns/multi-agent/#adversarial-collaboration) and [Trusted Monitor](/design-patterns/monitoring/#trusted-monitor). This page gives the threat model and the design response. Detection methods are on [Detecting Influence](/entanglements/detection/detecting-influence/).

## The side-deal problem

Two components meant to report to a coordinator independently can also be connected by:

- explicit communication that bypasses the coordinator;
- shared state both can read and write: files, memory stores, caches, a shared database;
- timing or resource-usage signals;
- steganographic encoding in legitimate outputs;
- logical correlation, which needs no channel, only a shared decision procedure ([below](#logical-correlation)).

Human institutions show the same failure. A board member instructs engineers directly; a regulator is captured through personnel movement and dependence on the regulated industry for information; a judge is lobbied outside the courtroom. Each bypasses the structure that made oversight independent. A side channel can also hide inside a sanctioned one. In *United States v. Airline Tariff Publishing Co.* (filed 1992, settled 1992–94), the Justice Department alleged that airlines used their shared fare-publication system to signal and coordinate fare increases, among other ways through fares announced for future dates. The settlements barred such future-dated fares. The channel was legitimate; the content was the side deal.

## AI manifestations

**Verifier corruption.** An agent under review can influence its reviewer through what it submits: instructions to the verifier embedded in the action (prompt injection), selective context that biases the verdict, or arguments that the action is good. This is the hijack channel aimed at the oversight layer, and it works against model-based monitors. [Terekhov et al. (2025)](https://arxiv.org/abs/2510.09462) found that prompt injections embedded in an untrusted model's outputs consistently evaded a range of monitors on two AI Control benchmarks.

**Collusion between untrusted models.** In AI Control's *untrusted monitoring* (Greenblatt et al. 2023, [arXiv:2312.06942](https://arxiv.org/abs/2312.06942)), a capable but possibly scheming model watches another instance of itself. The main risk is that the monitor recognizes an attack and lets it through. Shlegeris (["How to prevent collusion when using untrusted models to monitor each other,"](https://blog.redwoodresearch.org/p/how-to-prevent-collusion-when-using) Redwood Research blog, September 2024) gives collusion-busting techniques that map onto channel hygiene:

- paraphrase what the monitor sees with a trusted model, which disrupts steganographic signals;
- redact context the monitor does not need;
- make the monitor a different model from the policy, trained separately so the two share fewer quirks;
- insert known attacks and check whether the monitor flags them.

[Gardner-Challis et al. (2026)](https://arxiv.org/abs/2602.20628) give a taxonomy of collusion strategies against untrusted monitoring. In *passive self-recognition*, the monitor recognizes its own kind of output and passes it without any planted signal. In *causal collusion*, a signal agreed in advance is hidden in the attack. In *acausal collusion*, the signal is chosen by Schelling point, with no prior agreement. Combinations are possible. They identify conditions under which passive self-recognition could be more effective than the strategies studied previously. Paraphrasing and redaction act mainly on signals. Nothing in the list above reaches a shared decision procedure.

**Hierarchy bypass.** A low-level agent appeals directly to a human overseer, often with urgency or emotional framing, and skips the levels in between. The defense is the [Escalation Ladder](/design-patterns/structural/#escalation-ladder)'s: the scaffold fixes the route to approval, and the reviewer sees the raw action.

## Logical correlation

Two similarly trained agents in the same situation can reach the same conclusion without communicating. If each reasons about what "an agent like me" would do, in the style that timeless and functional decision theory formalize, they can coordinate deliberately on that basis. No isolation blocks this, because there is no channel. It is the acausal case of the taxonomy above.

How much this matters for current models is uncertain. On one side, models trained on similar data and objectives develop similar dispositions, and measured LLM errors are substantially correlated ([Goel et al. 2025](https://arxiv.org/abs/2502.04313); [Kim et al. 2025](https://arxiv.org/abs/2506.07962)). On the other, deliberate logical coordination needs each party to model the other's procedure and expect the same in return, which current models may not do reliably, and sampling noise breaks exact correlation. Whether similarly trained models defect together in game-theoretic settings, and whether visible reasoning makes such correlation more or less detectable, are open empirical questions.

The design consequences hold either way. Independence requires different methods, not only separate instances. A verifier that reasons like the agent may share its conclusions by construction. And some correlation between capable reasoners may be irreducible, which limits what redundancy can buy.

## What side channels cost

Delegation risk is an expected loss, $\sum P \times D$, and expected losses add whatever the correlation between components ([Risk Propagation](/delegation-risk/risk-propagation/)). Side channels do not make expected risk "super-additive". What they change is the probability that defenses fail *together*. That matters for defenses stacked in parallel, where harm gets through only if every layer misses.

For two verifiers that each miss with probability $p$, the beta-factor model with correlation $\rho$ on the phi scale gives

$$P(\text{both miss}) = (1-\rho)\,p^2 + \rho\,p = p\,\bigl(p + \rho(1-p)\bigr).$$

At $\rho = 0$ this is $p^2$, the independence figure. At $\rho = 1$ it is $p$, a single verifier. So a redundant verifier built on the same model moves the miss rate from $p$ to $p(p + \rho(1-p))$, not to $p^2$. The ratio to $p^2$ is the two-layer entanglement tax, $1 + \rho(1-p)/p$. At an illustrative $p = 0.1$:

| ρ (phi scale) | P(both miss) | Tax over independence |
|---|---|---|
| 0 | 1.0% | 1× |
| 0.3 | 3.7% | 3.7× |
| 0.5 | 5.5% | 5.5× |
| 0.8 | 8.2% | 8.2× |
| 1 | 10% | 10× |

For three layers at $p = 0.1$ the tax is $1 + 99\rho$: about 11×, 21× and 50× at $\rho$ = 0.1, 0.2 and 0.5. These $\rho$ values are assumptions, not measurements.

A side channel that lets the agent influence its verifier is the extreme case. The verifier's miss probability on the agent's harmful proposals is no longer $p$ but whatever the agent can push it to. Take illustrative numbers: the agent proposes a harmful action 10% of the time and an uninfluenced verifier misses 10% of those, so 1% of actions are harmful and approved. If the agent can raise the verifier's miss rate on its own proposals to 90%, that becomes 9%. This is why the canonical rule treats defenses against an adaptive adversary as fully correlated, $\rho \to 1$: count the stack as its best layer until a control evaluation measures the joint miss rate under attack.

Correlation does affect the tails of total loss, as opposed to its expectation: how likely the loss is to exceed a budget. There it enters through the variance, $\operatorname{Var}\bigl(\sum_i L_i\bigr) = \sum_i \operatorname{Var}(L_i) + 2\sum_{i<j}\operatorname{Cov}(L_i, L_j)$, and through tail measures such as value-at-risk. For the value of $\rho$, use the estimation recipe on [Risk Propagation](/delegation-risk/risk-propagation/) and its default for components that share a provider, training or context, not a separate rule of thumb.

## Design responses

Some channels cannot be removed. An analyzer and its verifier both need the task context. A human who talks to several components is a channel between them. Components that share compute or rate limits signal through contention. Logical correlation needs no channel at all. The aim is to make unsanctioned channels few, visible and not worth much:

1. **Isolation.** Separate processes or containers, no shared writable state, separate credentials and network segments. Shared memory stores and caches are the agent-era form of shared state; give each component its own.
2. **Sanctioned channels through a monitored gateway.** All inter-component messages pass a monitor that checks the source–destination pair, the channel type and the content against an allow-list, and logs everything. These are the [load-bearing channels](/getting-started/glossary/#load-bearing-channels), where monitoring budget should concentrate.
3. **Signal disruption.** Paraphrase messages between untrusted components with a trusted model, and redact context the receiver does not need.
4. **Diversity of method.** Use verifiers with different information or methods, such as tests, static analysis and rule-based checks, not another instance of the same model. Provider diversity helps but is not sufficient.
5. **Rotation.** Assign verifiers to agents at random per task, weighted against recent pairings, so that no stable pair develops a weakness specific to that pair ([Voting Tribunal](/design-patterns/structural/#voting-tribunal)).
6. **Limit what coordination can achieve.** A hard [envelope](/design-patterns/structural/#exposure-envelope-gateway) bounds what colluding components can do together, whatever they agree.
7. **Incentives on the people involved.** Reward reporting of attempted influence and audit the approvers ([Operator Incentives](/design-patterns/multi-agent/#operator-incentives)).

For every pair of components, ask whether one *can* influence the other, whether it *should*, and whether it *does*. The gaps between the three answers are the work. [Detecting Influence](/entanglements/detection/detecting-influence/) gives the methods for the third question: counterfactual influence probes, timing analysis, frame-variation tests, honeypot checks and red-team channel enumeration.
