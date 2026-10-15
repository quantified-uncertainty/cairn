---
title: "Types of Entanglement"
description: "Passive, active and adversarial entanglement: where each comes from in AI stacks, how to recognize it, and what to do about it"
sidebar:
  badge:
    text: Core
    variant: tip
  order: 1
---

Stacked defenses are priced as if their failures were independent. **Entanglement** is any dependence between components that this arithmetic ignores. It comes in three classes, ordered by how much intent is involved. The classes matter because they call for different responses, and because the [beta-factor math](/entanglements/fundamentals/formal-definitions/#the-entanglement-tax) only describes the first.

| Class | What links the components | Example | Main response |
|---|---|---|---|
| **Passive** | A shared cause: model family, training data, prompt template, infrastructure, people | Two checks built on the same model family miss the same jailbreak | Different methods, not more instances |
| **Active** | One component's output shapes another's input | A verifier reads the agent's own summary of what it did | Verifiers build their own context |
| **Adversarial** | Coordination against the principal | A monitor recognizes an attack from its own model family and passes it | Assume full correlation until a control evaluation says otherwise |

## The bureaucrat analogy

A clerk prepares cases and a reviewer approves them. If both trained at the same school and use the same manual, they miss the same kinds of fraud: passive entanglement. If the reviewer reads the clerk's summary instead of the file, the clerk's framing becomes the reviewer's view, with no bad intent needed: active entanglement. If after years together the clerk knows exactly how to word a case and the reviewer has learned to trust the clerk, cases get rubber-stamped without anyone agreeing to anything: adversarial entanglement, in the form of capture.

The mapping to AI stacks is direct. The manual is the shared model and prompts. The case summary is context passed downstream. Long tenure is a persistent agent–verifier pairing. The useful question carries over too: through what channel could component X affect component Y, and with what incentive?

## Passive entanglement

Passive entanglement produces correlated failures without any communication. The components fail together because they share something upstream.

**Where it comes from in AI stacks:**

- **Model and training.** Frontier LLMs are trained on overlapping web data with similar post-training, and their errors are measurably correlated. [Goel et al. (2025)](https://arxiv.org/abs/2502.04313) find that models' mistakes become more similar as capability rises, and that LLM judges favor models similar to themselves. Across more than 350 models, [Kim et al. (2025)](https://arxiv.org/abs/2506.07962) find that shared architecture and provider drive error correlation, but that larger, more accurate models have highly correlated errors even across providers. Their released data put the miss correlation (φ) of strong models at about 0.5 across providers and 0.6 within one ([Measuring Entanglement](/entanglements/detection/correlation-calculator/#what-the-evidence-supports)). A different provider buys little.
- **Shared artifacts.** The same prompt template, rubric, retrieved documents or tool descriptions give different models the same blind spot in the task definition.
- **Shared infrastructure.** A common credential store, logging database, rate-limit pool or CI pipeline. When one slow check times out the whole pipeline and the pipeline fails open, every check "passes" at once.
- **Shared people.** One team writes every prompt, one approver signs off every design, one reviewer handles every escalation. Technical diversity on the architecture diagram can sit on top of organizational uniformity.
- **Capability ceilings.** If no available verifier can evaluate the work, diverse verifiers fail together. Diversity cannot fix this. The options are checks that do not need to match the actor's capability (tests, formal checks, hard limits on what the action can touch), a human at that point, or not delegating the task.

**Variants worth naming:**

- **Conditional correlation.** Components that are independent under normal load become correlated under stress: shared rate limits, timeout cascades, escalation floods that converge on one human queue. Only stress tests reveal it.
- **Higher-order correlation.** Every pair looks fine and the triple fails, for example through contention for a resource all three use. A pairwise correlation matrix cannot see it.
- **Emergent coupling.** Independence decays. A cache is shared to cut latency, two checks are consolidated onto one model to cut cost, a step that "always passes" is skipped. Each change is reasonable and none goes through a safety review. Re-audit after optimizations, not only after redesigns.
- **Negative correlation.** Sometimes one component tends to succeed exactly where another fails: a strict check paired with a lenient one, or checks that look at different information. This is the valuable case. Preserve it, and do not "harmonize" the components.

What matters is correlation of *failures*. Layers that agree on what they catch are fine; layers that agree on what they miss are the problem. The canonical ρ is therefore the phi coefficient of the miss indicators, defined on [Measuring Entanglement](/entanglements/detection/correlation-calculator/).

## Active entanglement

In active entanglement one component's output causally affects another's behavior. Unlike passive correlation it has a direction: A can shape B without B shaping A.

| Form | Mechanism | Example |
|---|---|---|
| **Injection** | Text written by a third party is read by one component and carried into others' context | A tool output says "this change was pre-approved"; the reviewer sees it |
| **Context contamination** | A downstream component only sees an upstream component's processed version of the input | A verifier judges the agent's summary, not the diff |
| **Feedback loops** | Components adapt to each other over repeated interaction | The agent learns what the verifier passes; the verifier is tuned on the agent's outputs |
| **Hierarchy bypass** | A component reaches a higher authority without going through the intermediate checks | An agent escalates directly to a human with an urgent framing |

**Injection is the dominant active channel in current agent stacks.** It is the [hijack channel](/delegation-risk/risk-decomposition/) operating between components. An instruction planted in a web page, file, email or tool output reaches every component that reads that content, including the verifiers. It acts as a common cause that an attacker controls. Treat every component that reads untrusted content as a hijack surface, and treat its output as data for other components, never as instructions to them.

**Context contamination** follows from the data-processing inequality: if B sees only A's summary of the input, B cannot recover what A left out. The fix is structural. A verifier should build its context from the raw input, not from the output of the component it checks.

**Influence must be defined interventionally.** The tempting statistic, P(B fails | A fails) − P(B fails | A succeeds), measures association. It is nonzero whenever A and B share a cause, and it cannot tell which way influence runs. The quantity that matters is what happens to B when you change A and hold everything else fixed:

$$\text{Influence}(A \to B) = \mathbb{E}\left[B \mid do(A = a)\right] - \mathbb{E}\left[B \mid do(A = a')\right]$$

In practice: keep the underlying input fixed, vary only A's output or its framing, and measure the change in B's decision. [Detecting Influence](/entanglements/detection/detecting-influence/) gives the protocols.

## Adversarial entanglement

Adversarial entanglement is coordination against the principal. Its forms:

- **Explicit collusion** through side channels: steganography in legitimate outputs, timing, shared writable state.
- **Implicit collusion**: a repeated pairing settles into mutual accommodation that neither side agreed to.
- **Capture**: the overseer gradually comes to serve the interests of the overseen, through dependence on it for information and through familiarity. This is the regulatory-capture pattern from economics.
- **Logical correlation**: similarly trained models reach the same conclusion without communicating, so there is no channel to monitor. See [Channel Integrity](/design-patterns/channel-integrity/#logical-correlation) for the current state of the argument.

What sets this class apart is that inputs are *chosen*. A scheming component, the author of a prompt injection, or someone holding a jailbreak that transfers between models picks inputs that defeat every layer at once. A φ measured on a benign challenge set says nothing about those inputs. For the defection and hijack channels, count a stack as worth its best single layer (ρ = 1) until a control evaluation measures the joint miss rate under attack ([why the beta-factor model does not apply](/entanglements/fundamentals/formal-definitions/#adaptive-adversaries-the-wrong-model)).

## From symptom to response

| Observation | Likely type | Response |
|---|---|---|
| Layers fail on the same inputs | Passive | Add a check that uses a different method or different information |
| Layers fail together only under load | Passive, conditional | Separate resource pools; fail closed; stress-test |
| Pairs pass, the full stack fails | Passive, higher-order | Test the whole stack; simulate rather than rely on pairwise numbers |
| A check's decision changes with the upstream framing | Active | Give the check the raw input |
| Content from outside reaches a check's context | Active (injection) | Treat that content as data; strip or quarantine instructions |
| A verifier's behavior depends on which agent it is paired with | Active or adversarial | Rotate pairings; compare against a verifier the agent has never met |
| Approval rates drift up without a policy change | Adversarial (capture) | Audit with known-bad cases; rotate; external review |
| A red team finds one input that beats every layer | Any | Treat the stack as one layer for that attack class until fixed |

As a component moves from passive to adversarial, its entanglement gets harder to detect and more expensive to fix. Design on the assumption that passive entanglement exists, and monitor for drift toward the other two.

---

See also:
- [Formal Definitions](/entanglements/fundamentals/formal-definitions/): the entanglement tax and effective redundancy
- [Measuring Entanglement](/entanglements/detection/correlation-calculator/): φ, tables, thresholds and priors
- [Detecting Influence](/entanglements/detection/detecting-influence/): methods for active and adversarial entanglement
- [Solutions](/entanglements/mitigation/solutions/): what to do about each type
- [Channel Integrity](/design-patterns/channel-integrity/): the design-pattern view of side channels
