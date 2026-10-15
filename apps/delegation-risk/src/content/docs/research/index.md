---
title: Research
description: Background reading for the framework — literature reviews of the AI-safety evidence, surveys of precedents from other fields, and the list of open problems. Non-canonical; definitions live in the Delegation Risk section.
---

This section holds background for the framework, not its foundations. The definitions and the math (delegation risk as Σ P × D, risk propagation, the entanglement tax, runtime accounting) live in [Delegation Risk](/delegation-risk/). The pages here review what other work has measured, survey fields that solved similar problems, and list what is still open. None of them validates the framework. Site policy is that every number comes from a cited source or is labelled illustrative; one that is neither is a bug worth reporting.

## AI-safety evidence

| Page | What it is | Status |
|---|---|---|
| [Empirical Scheming Reduction](/research/trust-behavior/empirical-scheming-reduction/) | What control evaluations, factored monitoring, anti-scheming training, sandbagging studies and reasoning monitors have measured, with settings and caveats | Literature review; the evidence behind the defection channel |
| [Formal Verification Limits](/research/technical-safety/formal-verification-limits/) | What can be proved about neural networks and AI systems, runtime verification, and why statistics cannot certify rare failures | Literature review |
| [Steganography and Encoded Reasoning](/research/technical-safety/steganography-detection-prevention/) | Covert channels between LLM components: capacity bounds, paraphrasing defences, experimental status | Literature review |

## Precedents from other fields

These pages describe how other fields budget and bound delegated risk. They are analogies with stated limits, not evidence that the same methods work for AI agents.

| Page | Field | Status |
|---|---|---|
| [Nuclear and Aerospace PRA](/research/system-design/nuclear-aerospace-deep-dive/) | Probabilistic risk assessment, common-cause failure, certification targets | Precedent survey |
| [Financial Risk Budgeting](/research/risk-methods/financial-risk-budgeting/) | Risk budgets, Euler allocation, and where they failed | Precedent survey |
| [Mechanism Design](/research/system-design/mechanism-design/) | Incentive-compatible reporting and its impossibility results | Precedent survey |
| [Access Control Systems](/research/system-design/access-control-systems/) | Least privilege and compartmentation in intelligence and enterprise security | Precedent survey |

## Open problems

[Open Problems in Delegation Engineering](/research/potential-projects/) is the worklist: experiments whose first results would show whether the framework's mechanisms work on real agents. Those include a preflight prototype, measured correlation between monitors on agentic harm tasks, and multi-tenant entanglement. Start there if you want to contribute.

## Reading order

If you are checking whether the framework's AI-specific claims rest on anything, read [Empirical Scheming Reduction](/research/trust-behavior/empirical-scheming-reduction/) first, then [Risk Propagation](/delegation-risk/risk-propagation/) for how its correlation results enter the math. If you want to know which guarantees are achievable at all, read [Formal Verification Limits](/research/technical-safety/formal-verification-limits/). [Relationship to Existing Approaches](/reference/related-approaches/) places the framework among AI Control, safety cases and frontier safety frameworks.
