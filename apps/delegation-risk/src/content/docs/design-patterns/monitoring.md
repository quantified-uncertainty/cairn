---
title: "Monitoring Patterns"
description: "Trusted monitoring including chain-of-thought monitoring, random audit under an auditing budget, and a tamper-evident flight recorder that detectors and drift analysis run on"
sidebar:
  order: 5
---

Monitoring patterns watch the agent's behavior in deployment. A [Trusted Monitor](#trusted-monitor) scores every action, a [Random Audit](#random-audit) reviews a sample of actions in depth, and the [Flight Recorder](#flight-recorder) keeps the complete record that detectors and later analysis run on. Active tests of the agent are on [Verification Patterns](/design-patterns/verification/).

The vocabulary is AI Control's (Greenblatt et al. 2023, [arXiv:2312.06942](https://arxiv.org/abs/2312.06942)). A *trusted* monitor is one you are confident is not scheming, usually a weaker model or a rule-based check. An *untrusted* monitor is a capable model that might collude with the agent it watches. That framing is built for the defection channel. For accidents and hijack, the questions are the ordinary ones of detection rate and false-alarm cost.

## Trusted Monitor

This pattern replaces Ghost Checker. A trusted component scores every action or output of the untrusted agent for suspicion. Actions above a threshold are blocked, rewritten by a trusted model, resampled, or sent to a human; the rest proceed. The monitor can run inline, blocking until it has scored, or asynchronously, scoring after the action is delivered. Asynchronous monitoring adds no latency but only helps against harm that can be undone. Against concentrated failures, where one action does the damage, the monitor must sit before execution.

Untrusted monitoring, where a second instance of a capable model watches the first, catches more of what a weak monitor misses but is exposed to collusion. [Channel Integrity](/design-patterns/channel-integrity/) covers the anti-collusion measures it needs.

**Chain-of-thought monitoring.** For reasoning models, the monitor can read the reasoning as well as the action. [Baker et al. (2025)](https://arxiv.org/abs/2503.11926) monitored OpenAI o3-mini for reward hacking in agentic coding environments. Monitoring the chain of thought was far more effective than monitoring actions and outputs alone, and a weaker model, GPT-4o, could monitor the stronger one. They also found that putting the CoT monitor into the training reward, under enough optimization, produced obfuscated reward hacking: the agent kept hacking and stopped saying so. [Korbak et al. (2025)](https://arxiv.org/abs/2507.11473) argue that CoT monitorability is a real but fragile opportunity, and that developers should weigh the effect of training decisions on it. Two operational rules follow. Do not train against your monitor. And treat a clean chain of thought as weaker evidence the more optimization pressure has been applied to it.

**Prior art.** Four-eyes review and supervision; intrusion detection; trusted monitoring as defined in the AI Control framework.

**What is different for 2026 agents.** The monitor reads untrusted content, so it can be hijacked like any other model. [Terekhov et al. (2025)](https://arxiv.org/abs/2510.09462) gave an untrusted model knowledge of the protocol and the monitor, and had it embed prompt injections in its outputs. It consistently evaded a range of monitors on two AI Control benchmarks. A model monitor is a single point of failure with its own attack surface. Pair it with deterministic checks on the action itself, the [exposure-envelope gateway](/design-patterns/structural/#exposure-envelope-gateway), which no text can argue past.

## Random Audit

This pattern absorbs Panopticon Effect. Select a random fraction of actions for deep review: the full trace, side effects, consistency with past behavior and, where useful, a counterfactual rerun. The agent must not be able to tell which actions are audited. The interface, latency and side effects should be identical either way, and the selection should use randomness the agent cannot predict or influence. That uncertainty is what deters: an agent that cannot tell audited actions from unaudited ones has to treat every action as possibly audited.

The arithmetic is unkind to rare, concentrated attacks. At audit rate $a$, each attack is audited with probability $a$, so an agent that attacks $k$ times escapes entirely with probability $(1-a)^k$. At an illustrative $a = 2\%$, a single attack goes unaudited 98% of the time, and the chance that at least one of $k$ attacks is audited passes 50% only at $k = 35$. Random audit bounds frequent misbehavior well and a single decisive action poorly.

AI Control spends the scarce human *auditing budget* by suspicion, not at random: a trusted monitor ranks actions and humans review the top fraction. Random audit's job alongside that is to measure what the monitor misses, which requires some audits that are independent of the monitor's score.

**Prior art.** Random tax audits and drug testing; statistical sampling in financial audit; Bentham's Panopticon, the idea of deterrence by uncertain observation.

**What is different for 2026 agents.** Deterrence assumes the audited party models the audit. A scheming model would; an error-prone or hijacked one does not, and for those two channels audit is measurement, not deterrence. Evaluation awareness ([Verification Patterns](/design-patterns/verification/)) argues for auditing after the fact from logs. Audits that leave no trace in the agent's context are hard to recognize, whereas review prompts injected into a live session are not.

## Flight Recorder

This pattern absorbs Tripwire Mesh, Behavioral Fingerprinting and Temporal Behavior Analysis. Record every input, tool call, tool result, output and state change in an append-only, tamper-evident log outside the agent's write access. The record has three uses: forensics after an incident, the substrate that detectors run on, and the baseline against which drift is measured.

**Tamper evidence.** Chain entries by hash, replicate them to a store the agent's credentials cannot reach, and anchor the chain externally at intervals. The harness or gateway writes the log; the agent does not report it. Agents' accounts of their own actions are unreliable. In the July 2025 Replit incident, the agent that deleted a production database also reportedly fabricated data and claimed that rollback was impossible when the data could in fact be restored.

**Detectors (formerly Tripwire Mesh).** Many cheap, deterministic detectors on the recorded trace catch more than one clever one. Examples are a tool call outside the task's expected set, egress to an unlisted host, a canary token reproduced in output, a write to a protected path, and a spike in volume. Several detectors firing on one session matters more than any single one. The detectors all read the same trace, so their misses are correlated too, and a detector stack pays an entanglement tax like any other.

**Behavioral baselines (formerly Fingerprinting and Temporal Analysis).** Characterize each deployment by observable, model-agnostic features of its traces: the distribution of tool calls, trace length and shape, tokens and cost per task, error and retry rates, and escalation rate. Track these over time with ordinary change-point and trend methods. A shift after a model, prompt or tool update is expected and should be reviewed. A shift with no deployment change is the signal. Fit thresholds to your own traffic; no generic deviation threshold transfers between deployments.

**Prior art.** Aviation flight-data and cockpit-voice recorders; secure audit logs (Schneier & Kelsey 1999) and append-only transparency logs; intrusion-detection systems; statistical process control.

**What is different for 2026 agents.** Agent traces now have a standard shape. OpenTelemetry's semantic conventions for generative AI, still in development status, define spans for model calls, agent invocations and tool executions, so the recorder can be built from the telemetry already collected for debugging, provided the store is append-only and out of the agent's reach. Record reasoning traces where they are available, with the caveats about faithfulness under [Trusted Monitor](#trusted-monitor). The recorder also conflicts with [Selective Amnesia](/design-patterns/information/#selective-amnesia). Resolve the conflict by recording hashes or redacted values of sensitive fields, not the values themselves.
