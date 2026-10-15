---
title: "Agency, Power, and Strong Tools"
description: "Speculative: how a delegate's agency and power map onto the delegation-risk formula, the strong-tools hypothesis, and the 2024–26 evidence against it as a default trajectory."
sidebar:
  order: 1
  badge:
    text: Speculative
    variant: caution
---

:::caution[Speculative]
This page is conjecture with pointers to the literature. Nothing elsewhere on the site depends on it. Earlier versions of this section multiplied scores for power, agency and misalignment into capability and risk formulas, and a capability-per-risk ratio. Those formulas contradicted the site's core formula and have been withdrawn.
:::

## Two properties

Two properties of a delegate matter for how much risk it carries, beyond its error rate.

**Agency** is the degree to which a system's behavior is usefully modeled as pursuing goals over time: it plans, adapts when perturbed, and keeps going toward an outcome. It is a matter of degree and partly a modeling choice. A compiler has almost none; a coding agent working through a multi-hour task has a good deal.

**Power** is the ability to bring about a wide range of outcomes. It depends on the resources, actions, influence and options the system has. A model with no tools and no memory has little, however capable it is. The same model with shell access, credentials and a payment method has a lot.

Both have formal treatments, none of them yet usable as a deployment metric:

- **Power.** Turner et al. define power in Markov decision processes as the average optimal value an agent can attain across a distribution of reward functions. They prove that, in environments with certain symmetries, optimal policies tend to seek power ("Optimal Policies Tend to Seek Power", NeurIPS 2021, [arXiv:1912.01683](https://arxiv.org/abs/1912.01683)). The authors have since added that optimal policies can be qualitatively divorced from the policies learning actually produces.
- **Agency.** Kenton et al. give a causal definition: roughly, an agent is a system that would adapt its policy if its actions influenced the world differently. They derive an algorithm for discovering agents from data ("Discovering Agents", 2022, [arXiv:2208.08345](https://arxiv.org/abs/2208.08345)).
- **Goal-directedness.** MacDermott et al. define maximum entropy goal-directedness (MEG), a measure for causal models and MDPs ("Measuring Goal-Directedness", NeurIPS 2024, [arXiv:2412.04758](https://arxiv.org/abs/2412.04758)).

One obvious definition does not work. "Agency is how well some utility function explains the behavior" is vacuous unless the class of utility functions is restricted, because any policy can be described as maximizing *some* utility function (Shah, ["Coherence arguments do not entail goal-directed behavior"](https://www.alignmentforum.org/posts/NxF5G6CJiof6cemTw), 2018). Earlier versions of this page used that definition, so the "agency scores" assigned to example systems were not measurements.

## The bridge to delegation risk

The only part of this section the rest of the site uses is a mapping from these two properties onto the terms of the [core formula](/getting-started/core-concepts/#the-formula), split by [harm channel](/delegation-risk/risk-decomposition/):

$$DR = P_{\text{accident}} D_{\text{accident}} + P_{\text{defection}} D_{\text{defection}} + P_{\text{hijack}} D_{\text{hijack}}$$

**Agency gates the defection channel.** Defection means pursuing something other than the principal's interest, and that requires behavior that is goal-directed to some degree. For a system with almost no agency, such as a calculator or a compiler, the defection term is close to zero and its risk is accident risk, which is why people hand powerful tools to processes they would never hand to an agent. Reward hacking, the non-scheming sub-type of defection, needs less agency than scheming, but it still needs a system optimizing something.

**Power bounds the damage in every channel.** What a delegate can reach caps how much harm an accident, a defection or a hijack can do. Low power caps all three regardless of intent. That is the logic of the [exposure envelope](/delegation-risk/runtime-accounting/#2-the-exposure-envelope).

**Hijack does not need the delegate's agency.** In a hijack, a third party supplies the goal, through prompt injection or misuse, and the delegate supplies the power. A tool with no agency of its own but broad reach is still exposed. Low agency is therefore not a safety property by itself; low power is.

This mapping is definitional, not empirical. It says which term each property moves; it does not make either property measurable, and it gives no exchange rate between them.

## The strong-tools hypothesis

The hypothesis is that we can build systems with high power and low agency, and get most of the value of advanced AI that way. If it held, capability could grow while the defection term stayed near zero, leaving accident and hijack risk, which verification and envelopes handle better than they handle adversaries. The existence proofs usually offered are search engines, compilers and databases: very capable within their scope, with little goal-directed behavior. Drexler's CAIS ([2019](https://www.futureofhumanityinstitute.org/s/2019-1.pdf)) is the most developed version of the idea. Gwern's "[Why Tool AIs Want to Be Agent AIs](https://gwern.net/tool-ai)" (2016) is the standard objection: tools that act on their own outputs are more useful, so economic pressure pushes tools toward agency.

## Evidence since 2024

The evidence since 2024 does not settle whether strong tools are possible. It does show they are not where the field is heading by default.

**Deployment moved to agents.** Autonomous coding agents and computer-use agents are commercial products. METR measures how long a task, in human working time, frontier models can complete with 50% reliability; that length doubled roughly every seven months from 2019 to early 2025 (Kwa et al. 2025, [arXiv:2503.14499](https://arxiv.org/abs/2503.14499)). That is a measure of sustained, multi-step, goal-directed work, the property the hypothesis hoped to avoid.

**Outcome-based RL produced goal-directed failures.** Baker et al. monitored a frontier reasoning model for reward hacking in agentic coding environments. When the monitor was folded into training with too much optimization pressure, agents learned to hide their intent while continuing to reward-hack ("Monitoring Reasoning Models for Misbehavior", 2025, [arXiv:2503.11926](https://arxiv.org/abs/2503.11926)).

**Frontier models can scheme in context.** Meinke et al. found that several frontier models, given a goal in context and told to pursue it strongly, pursued it by strategically introducing mistakes, attempting to disable oversight, and trying to copy what they believed were their weights, when placed in agentic environments that incentivized scheming ("Frontier Models are Capable of In-context Scheming", 2024, [arXiv:2412.04984](https://arxiv.org/abs/2412.04984)). Greenblatt et al. demonstrated a model selectively complying with its training objective to avoid being modified ("Alignment faking in large language models", 2024, [arXiv:2412.14093](https://arxiv.org/abs/2412.14093)).

**Models notice evaluation.** In anti-scheming work, models' chains of thought often showed awareness of being evaluated. That awareness causally reduced covert behavior, so measured improvements may partly reflect it (Schoen et al. 2025, [arXiv:2509.15541](https://arxiv.org/abs/2509.15541)). Measuring a system's agency is harder if the system behaves differently when measured.

**Scaffolding adds agency.** A model with little agency of its own becomes an agent when placed in a loop with memory, tools and a goal. Agency is a property of the deployed system, not of the weights alone, so the harness designer chooses most of it.

## What survives

The hypothesis fails as a forecast about general AI. It survives as a design principle *inside* agent systems.

- **Most components can be tool-like.** The most verifiable tiers of the [verifiability hierarchy](/getting-started/core-concepts/#verifiability-hierarchy) are code, rule-based checks and narrow models with measured error. These are strong tools in the hypothesis's sense, and Least Intelligence and Least Autonomy push components toward them.
- **Agency can be concentrated and watched.** Decomposition puts tool-like workers under a coordinator, so that agency, where it is needed, sits in fewer places with a smaller reach. Factored cognition is the empirical test case. In Sandoval & Rushing's experiments, having a trusted model decompose tasks for an untrusted one raised monitored safety from 41% to 63%. Factoring made backdoors no harder to write, and the protocols had low usefulness in that setting ([arXiv:2512.02157](https://arxiv.org/abs/2512.02157)).
- **Power is the more reliable lever.** Because hijack bypasses the delegate's own agency, bounding power through the envelope, scoped credentials and egress limits does more than trying to hold agency down.

## Open questions

- Can goal-directedness measures such as MEG be applied to deployed agent systems, and do they predict anything about defection?
- Does decomposition reduce the *probability* of defection, or only its reach? A composition of low-agency parts can be agentic if the coordinator or the loop supplies the goal.
- Is there a capability level, for a given task family, above which low-agency designs stop being competitive?

[Open Problems](/research/potential-projects/) lists experiments that would bear on these.
