---
title: "Multi-Agent Patterns"
description: "Adversarial collaboration and debate, limits on delegation depth for subagent chains, and incentives that bind the operators, vendors and deployers behind agents"
sidebar:
  order: 6
---

These patterns concern systems with more than one agent or more than one responsible party: agents that check each other, agents that delegate to subagents, and the people and firms who deploy them. Adding parties adds safety only when their failures are independent and their incentives really are opposed. Both are easy to assume and hard to arrange.

## Adversarial Collaboration

Have agents argue opposed positions before a judge. One proposes and another critiques, or two debaters each defend a different answer. Agreement between genuinely opposed parties is evidence, and disagreement shows a human where to look.

The evidence comes from research on AI safety via debate. [Irving, Christiano & Amodei (2018)](https://arxiv.org/abs/1805.00899) proposed debate as a way for a weaker judge to supervise stronger agents. [Michael et al. (2023)](https://arxiv.org/abs/2311.08702) ran human debates on hard reading-comprehension questions. Judges who had not read the passage reached 84% accuracy under debate, against 74% under consultancy, where a single expert argues one side. [Khan et al. (2024)](https://arxiv.org/abs/2402.06782) found that debate helped both non-expert models and humans (76% and 88% accuracy, against naive baselines of 48% and 60%), and that optimizing debaters for persuasiveness made judges better at finding the truth. [Kenton et al. (2024)](https://arxiv.org/abs/2407.04622), using weaker LLM judges, found that debate beat consultancy across a range of tasks. Against direct question answering, though, debate's results were mixed outside tasks with information asymmetry.

The opposition has to be real in two ways. The parties must not share what they optimize. Two instances of one model, from one developer, trained on one signal are not opposed in any sense their training cares about, whatever roles their prompts assign. And the judge must not favor one side's style: [Goel et al. (2025)](https://arxiv.org/abs/2502.04313) find that LLM judges favor models similar to themselves.

**Independence assumption.** Read "the proposer and the critic agree" as two votes in a [Voting Tribunal](/design-patterns/structural/#voting-tribunal), with the same correlation caveat and the same [entanglement tax](/delegation-risk/risk-propagation/). Collusion between debaters is covered under [Channel Integrity](/design-patterns/channel-integrity/).

**Prior art.** The adversarial legal process; red teams; adversarial collaboration in science (Mellers, Hertwig & Kahneman 2001); AI safety via debate.

**What is different for 2026 agents.** Critic-and-reviser loops and multi-agent review steps are now common in agent frameworks. Most use the same model for both roles with different prompts, which gives the form of debate without the opposition. When the critic's job is catching errors, give it different information or a different method (run the tests, read the diff, query the source), not only a different prompt.

## Trust Transitivity Limits

When A delegates to B and B delegates to C, C should not inherit A's authority by default. Three rules:

1. **Attenuation only.** Each hop passes on at most the permissions it holds, narrowed to the sub-task, never more. A subagent's envelope is a subset of its parent's.
2. **A depth limit.** Set a maximum delegation depth, and enforce it where credentials are issued, not by asking agents to respect it.
3. **Direct grants for sensitive capabilities.** Production code execution, data deletion, granting permissions, and external communication on the principal's behalf need a grant from the root principal (a human or a policy), not one relayed through a chain.

If a number is wanted for a chain, it is the serial-chain product. With $t_i$ = P(link $i$ executes faithfully), P(chain executes faithfully) = $\prod_i t_i$. That product is already conservative under positive correlation ([Risk Propagation](/delegation-risk/risk-propagation/)). A per-hop discount on top double-counts chain length and is retired with the other alternative propagation rules. The depth limit is the policy tool for long chains, not an extra factor in the arithmetic.

**Prior art.** Certificate path-length constraints (X.509 `pathLenConstraint`, RFC 5280); attenuable capability tokens such as macaroons (Birgisson et al. 2014) and SPKI/SDSI delegation; the agency-law rule that a delegate may not sub-delegate without authority.

**What is different for 2026 agents.** Orchestrator–subagent architectures make delegation chains routine. An orchestrator spawns subagents, which call tools and MCP servers, which may call further models. Two failure modes are specific to this stack. Unless configured otherwise, a subagent may run with its parent's full tool set and credentials, which silently violates attenuation. And results travel *up* the chain as text: a subagent that read an injected document can return the injected instructions to the orchestrator as "findings". Treat subagent output as untrusted data to the parent, under the same rules as any tool output ([Need-to-Know Compartments](/design-patterns/information/#need-to-know-compartments)).

## Operator Incentives

This pattern merges Bonding & Slashing, Bounty System and Insurance Requirement. Economic mechanisms such as forfeitable bonds, rewards for finding problems, and insurance that prices risk act on parties that hold money and respond to it: the operators who run agents, the vendors who build them, and the deployers who integrate them. They do not act on the model. A deployed model does not experience reputation points or forfeited collateral unless these are part of its training signal or its prompt, and a prompt-level incentive is just another instruction. Incentives reach the model only through training, where they are reward design and reward hacking is the failure mode.

Applied to the principal hierarchy, the three mechanisms do real work:

- **Bonds and liability.** An operator that posts collateral or accepts liability for an agent's actions has a reason to constrain the agent. This is ordinary moral-hazard mechanism design. The hard part is attributing an incident after the fact, which the [Flight Recorder](/design-patterns/monitoring/#flight-recorder) has to support.
- **Bounties.** Paying outsiders to find jailbreaks, injection paths and unsafe behavior buys red-team coverage at the price of findings. Guard against the usual gaming: reporters causing the issue they report, and one issue split into many reports.
- **Insurance.** An insurer that has to pay claims has a reason to price risk and to demand controls as a condition of cover. The market exists: Munich Re has offered AI performance cover since 2018, and AIUC, launched in July 2025, pairs its AIUC-1 standard for AI agents with insurance. [The Insurer's Dilemma](/delegation-risk/insurers-dilemma/) covers the market and where insurance stops working against adversarial agents.

**Prior art.** Performance and fidelity bonds; staking and slashing in proof-of-stake protocols; bug-bounty programs; liability insurance; the principal–agent literature on moral hazard (Holmström 1979).

**What is different for 2026 agents.** The parties are now concrete: model vendors, the providers of agent frameworks and MCP servers, and the enterprises that deploy them, with contracts that allocate liability among them. For any deployment the incentive question is which of them bears the loss when the agent errs, defects or is hijacked, and whether that party controls the relevant safeguard. Incentives bind well when the party bearing the loss can also change the system. They bind badly when the loss falls on a deployer who cannot see into the model, or on a vendor who cannot see the deployment.
