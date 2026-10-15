---
title: "Risk Decomposition: Accident, Defection, Hijack"
description: "The three channels through which a delegation causes harm, how they differ in estimation and mitigation, and the shared worked example split by channel."
sidebar:
  badge:
    text: Core
    variant: tip
  order: 3
---

Every harm mode reaches the principal through one of three channels. The channels are estimated differently and need different mitigations, so the first job in any harm table is to say which channel each row belongs to.

- **Accident.** The delegate fails at its task: bugs, hallucinations, misread instructions, capability limits. Nobody is steering it toward harm.
- **Defection.** The delegate pursues something other than the principal's interest. *Scheming*, the strategic and concealed pursuit of a different goal, is the extreme case. *Reward hacking* is a non-scheming sub-type: the delegate exploits a flaw in what it was trained or asked to optimize, for example by special-casing tests or editing a grader, without a hidden long-term goal. [Baker et al. (2025)](https://arxiv.org/abs/2503.11926) document it in a frontier reasoning model on agentic coding tasks. [Amodei et al. (2016)](https://arxiv.org/abs/1606.06565) file reward hacking under accidents. This site puts it under defection because the behavior is goal-directed against the principal's intent, even without scheming.
- **Hijack.** A third party, or the user, steers a delegate that is not itself scheming. The routes include instructions injected into a web page, document, email or tool output, a malicious tool or server, and direct misuse. The delegate does what it is told; the problem is who is telling it.

Hijack fits neither of the other channels. The delegate is not failing at its task and not pursuing its own goal, and the probability is set by an attacker's choices rather than by the delegate's error rate or disposition. For agents that read untrusted content it is a pressing practical threat, with exploits documented against many deployed assistants. Simon Willison's ["lethal trifecta"](https://simonwillison.net/2025/Jun/16/the-lethal-trifecta/) (June 2025) names the dangerous combination: access to private data, exposure to untrusted content, and the ability to communicate externally. CaMeL ([Debenedetti et al. 2025](https://arxiv.org/abs/2503.18813)) and the design patterns of [Beurer-Kellner et al. (2025)](https://arxiv.org/abs/2506.08837) answer it architecturally: they keep untrusted data from changing what the agent does next. That is the same kind of answer this site gives to defection.

## The worked example, by channel

The [section overview](/delegation-risk/) has one harm table for a research assistant with a coordinator, a summarizer and a code deployer. Grouped by channel, its rows give:

| Channel | Rows | Risk per month | Share |
|---|---|---|---|
| Accident | misrouting, mistaken permission grants, misrepresented findings, buggy code | \$1,420 | 70% |
| Defection | deliberate permission grants, test tampering (reward hacking), malicious code (scheming) | \$500 | 25% |
| Hijack | data leak driven by injected instructions | \$100 | 5% |
| **Total** | | **\$2,020** | |

The numbers are invented, so the shares say nothing about real systems. Two structural points survive.

**The coordinator result is conditional.** The coordinator's \$500 of permission-granting risk splits into \$300 accident and \$200 defection only because the table assumes P(mistaken grant) = 0.003 and P(deliberate grant) = 0.002. Nothing measured that split. The robust part is the damage term: the coordinator carries a \$100,000 row whichever channel triggers it, because it has leverage over the other components. *If* you believe a coordinator capable of scheming would misuse that leverage more often than it errs with it, then defection dominates the permission-granting row, which is almost all of the coordinator's risk, and constraints on the coordinator are where to spend. If you believe it errs far more often than it schemes, testing and permission limits cover most of it. The table cannot tell you which.

**Rows in one component can need opposite fixes.** Tests reduce the deployer's buggy-code row. They do little for the test-tampering row, because tests are what that row games; the fix there is to lock the tests away from the deployer. The malicious-code row needs a check the deployer can neither predict nor influence.

## How the channels differ

| | Accident | Defection | Hijack |
|---|---|---|---|
| Who chooses the harmful action | nobody | the delegate | a third party or user |
| How to estimate P | testing, incident history, fuzzing | control evaluations, red-teaming, honeypots | adaptive red-teaming of the whole system |
| Main mitigations | testing, redundancy, verification | trusted monitoring, control protocols, hard envelopes | separating instructions from untrusted data, removing exfiltration paths, hard envelopes |
| Correlation between stacked checks | benign-failure ρ applies | assume ρ → 1 | assume ρ → 1 |

The last row matters most. The [beta-factor correction](/delegation-risk/risk-propagation/) models checks that happen to fail together. In the defection and hijack channels an adversary chooses the input to defeat every check at once, so treat a stack as worth no more than its best layer until a control evaluation ([Greenblatt et al. 2023](https://arxiv.org/abs/2312.06942)) shows otherwise.

Accidents also tend to leave traces in logs and tests. The other two need not: a schemer hides its actions, and a hijacked delegate's logs show it doing what it was told, which can look like normal work.

## Capability and the channels

A common claim is that accident risk falls as capability rises while defection risk grows. The first half is unreliable, because it merges two factors:

- **P(error per action)** often falls with capability, though not always ([McKenzie et al. 2023](https://arxiv.org/abs/2306.09479) collect tasks where larger models do worse).
- **Damage per error** tends to rise, because a more capable delegate is given longer, more consequential tasks.

AI Control's *trusted model* encodes a related assumption: below some capability, a model is treated as unlikely to scheme even if it errs more. Treat that as an assumption about a particular model, not a law.

Defection differs in kind. Capability raises both the chance that a strategic deviation succeeds and the chance that it goes unnoticed. Hijack scales with how much untrusted content the delegate reads and how much it is allowed to do, more than with capability.

## Architectural consequences

Damage concentrates where a component has leverage over others. So:

- Put the most verifiable components, tiers 1 and 2 of the [verifiability hierarchy](/getting-started/core-concepts/#verifiability-hierarchy), at the points of leverage: permission grants, deployment gates, outbound channels.
- Keep each coordinator's interface narrow ([Coordinator Constraints](/design-patterns/coordinator-constraints/)).
- Treat any component that reads untrusted content as a hijack surface. Its output is data for other components, never instructions to them.

## Further reading

- Greenblatt et al. (2023). [AI Control: Improving Safety Despite Intentional Subversion](https://arxiv.org/abs/2312.06942). ICML 2024.
- Baker et al. (2025). [Monitoring Reasoning Models for Misbehavior and the Risks of Promoting Obfuscation](https://arxiv.org/abs/2503.11926).
- Debenedetti et al. (2025). [Defeating Prompt Injections by Design](https://arxiv.org/abs/2503.18813) (CaMeL).
- Beurer-Kellner et al. (2025). [Design Patterns for Securing LLM Agents against Prompt Injections](https://arxiv.org/abs/2506.08837).
- Hubinger et al. (2019). [Deceptive Alignment](https://www.alignmentforum.org/posts/zthDPAjh9w6Ytbeks/deceptive-alignment), on why scheming could arise.
