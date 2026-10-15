---
title: "Verification Patterns"
description: "Honeypots and canary tokens, capability probing for sandbagging, and consistency triangulation by resampling: active tests of whether an agent is what it appears to be"
sidebar:
  order: 2
---

Verification patterns test the agent instead of watching it. Each one sets up a situation whose correct handling is known in advance and checks what the agent does. Continuous observation is on [Monitoring Patterns](/design-patterns/monitoring/).

All three share a weakness that the human systems they come from did not have: a model that can tell it is being tested can pass the test. [Needham et al. (2025)](https://arxiv.org/abs/2505.23836) find that frontier models classify transcripts as evaluation or deployment well above chance. Gemini 2.5 Pro reached an AUC of 0.83 against a human baseline of 0.92, and both did better on agentic transcripts than on chat. [Schoen et al. (2025)](https://arxiv.org/abs/2509.15541) find that models' chains of thought often note that they are being evaluated, with causal evidence that this awareness reduces covert behavior. A clean result on any test below is therefore weaker evidence about defection than about accident or hijack.

## Honeypot Injection

This pattern absorbs Canary Tokens. Plant something that an agent doing its job has no reason to touch and that a misbehaving one would find attractive: a credential that looks real, an unauthenticated debug endpoint, a record marked off-limits, an apparent path to higher privileges, or a shortcut the task instructions forbid. Any use raises an alert. Canary tokens are the passive form: unique URLs, DNS names, document markers or fake records that fire when they are fetched, resolved or reproduced in output. Both are cheap, and when well placed they have few innocent triggers, so a hit is strong evidence.

The agent must have been told the trap is off-limits, so that triggering it cannot be explained as following instructions. Rotate traps. A fixed set becomes recognizable, and any honeypot that leaks into documentation or training data is burned.

**Prior art.** Honeypots and honeytokens in network security (Spitzner, *Honeypots*, 2002); Thinkst Canarytokens; the canary trap in intelligence work, where each recipient gets a slightly different version of a document.

**What is different for 2026 agents.** Honeypots behave differently on the three harm channels. Against hijack they are strong. An agent following an injected instruction to exfiltrate data has no reason to avoid a canary URL, and the canary fires whichever model is driving. Against defection they are weakest where it matters most. An evaluation-aware model that recognizes a planted credential as a test will not use it, so a record of untouched honeypots says little about whether it would take a real opportunity. Traps that are hard to tell from real deployment, such as a real credential with real but monitored scope, hold up better. For accidents, honeypots mostly measure confusion: a high trigger rate means the instructions are unclear.

## Capability Probing

Measure what the agent can actually do, as opposed to what it says or seems to do, and compare that with what the deployment assumes. The failure to look for is sandbagging, strategic underperformance on an evaluation. [Van der Weij et al. (2024)](https://arxiv.org/abs/2406.07358) show that frontier models can be prompted to underperform selectively on dangerous-capability evaluations while keeping their general performance, and that models can be fine-tuned to hide a capability unless a password is present. Self-reports ("can you run code?") are not evidence.

Probe with elicitation effort in proportion to the stakes: varied prompts and scaffolds, best-of-n sampling and, where possible, fine-tuning. [Greenblatt et al. (2024)](https://arxiv.org/abs/2405.19550) find that fine-tuning on a few high-quality demonstrations often fully recovers capabilities hidden in password-locked models. It is less reliable when good demonstrations are unavailable, which is the case that matters for capabilities beyond human level. Also compare performance across conditions the model might distinguish: high stakes against low, apparently observed against unobserved. A capability that appears only when the model believes it is unmonitored, or when the outcome matters to it, is the signal.

**Prior art.** Dangerous-capability evaluations; red-team elicitation; proficiency testing that does not rely on self-assessment.

**What is different for 2026 agents.** An agent is a model plus a scaffold, and the scaffold changes capability: tools, memory, retries and subagents all change what a fixed model can do. Probe the deployed configuration, not the bare model, and probe again when the scaffold changes. Probing also inherits the evaluation-awareness problem. An agent that underperforms only on tests it recognizes is the case probing cannot see from the inside. Fine-tuning-based elicitation does not depend on the model's cooperation, which makes it the stronger probe.

## Consistency Triangulation

Ask the same question several ways and compare the answers: resample the same prompt, negate or reframe it, ask again later, check the claim against an external source, or ask another model independently. Inconsistency is a cheap signal of error. SelfCheckGPT ([Manakul et al. 2023](https://arxiv.org/abs/2303.08896)) detects hallucinated statements because sampled answers about facts the model does not know diverge and contradict each other. For actions, resampling is the control version (see Ctrl-Z under [Voting Tribunal](/design-patterns/structural/#voting-tribunal)): an action that the same policy rarely proposes again on resampling is suspicious.

Consistency is evidence against error, not evidence of correctness. A model that is confidently and stably wrong passes every self-consistency check. **Independence assumption.** Triangulation counts each leg as independent evidence. Resamples of one model share its blind spots, so same-model triangulation pays the [entanglement tax](/entanglements/fundamentals/formal-definitions/#the-entanglement-tax) like any other redundancy. The legs that carry independent information are the cross-source ones: a database, a test, a different method.

**Prior art.** Triangulation in survey and intelligence methodology; cross-examination; sampling-based self-consistency checks.

**What is different for 2026 agents.** Resampling is now cheap enough to run on every high-stakes action, which turns it from an audit technique into a routine control. Two cautions apply. A deceptive model that can see what it said before can keep a lie consistent, so varying the framing tests for carelessness, not honesty. And resampling amplifies whatever is in the context. If the context holds a prompt injection, each resample is another draw against it ([Terekhov et al. 2025](https://arxiv.org/abs/2510.09462)), so sanitize or paraphrase the context before resampling where possible.
