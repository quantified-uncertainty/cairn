---
title: "Mechanism Design"
description: "What incentive-compatible reporting can and cannot deliver for delegation risk: the revelation principle, VCG and its impossibility results, the multitask warning, and tools for eliciting honest probabilities."
---

A delegation-risk estimate depends on numbers supplied by people with a stake in them: a developer's estimate of how often its agent fails, a vendor's claims about its model, a team's request for a share of the risk budget. Mechanism design asks how to make honest reporting the reporter's best strategy. This page summarizes what that literature offers and where it stops.

The strategic agents here are developers, vendors and internal teams, not the AI components. The VCG results below assume agents whose utility is value minus money, and a model inside a scaffold has no such utility. Whether a model behaves strategically against its overseers is a question for control evaluations ([Greenblatt et al. 2023](https://arxiv.org/abs/2312.06942); see [Empirical Scheming Reduction](/research/trust-behavior/empirical-scheming-reduction/)), not for payment rules.

## The revelation principle

If some mechanism implements an outcome in equilibrium, a direct mechanism in which each agent simply reports its private information, and truthful reporting is an equilibrium, implements the same outcome (Gibbard 1973 for dominant strategies; Myerson 1979 for Bayesian-Nash equilibrium). Designers can therefore restrict attention to truthful direct mechanisms.

The principle does not say that a good outcome is implementable, or implementable cheaply. The truthful equilibrium need not be unique, and the Bayesian version assumes a common prior. It narrows the search; it does not make a market in honest risk reports possible.

## VCG and the impossibility results

The Vickrey-Clarke-Groves mechanism chooses the outcome $a^*$ that maximizes total reported value and charges each agent the Clarke pivot payment:

$$p_i = \max_{a} \sum_{j \ne i} v_j(a) \;-\; \sum_{j \ne i} v_j(a^*)$$

the welfare others would get if $i$ were absent, minus the welfare they get with $i$ present. Truthful reporting is a dominant strategy. Written in costs, with $C_{-i}$ the cost borne by everyone except $i$:

$$p_i = C_{-i}(a^*) \;-\; \min_a C_{-i}(a) \;\ge\; 0$$

Agent $i$ pays the extra cost its presence imposes on others. An earlier page on this site wrote the difference the other way round, which pays the agent for the harm it causes.

A delegation-risk use: teams or vendors compete for a fixed risk budget. Each reports the value its deployment creates and the risk it adds; the allocation maximizes reported value net of risk cost, and each pays for the risk it displaces from others.

Three results limit this:

- **No budget balance.** Green and Laffont (1977) show that, for general quasi-linear preferences, no mechanism is efficient, dominant-strategy truthful and budget-balanced. VCG runs a surplus or a deficit.
- **No efficient bilateral trade.** Myerson and Satterthwaite (1983) show that with privately known values, no mechanism is efficient, Bayesian incentive compatible, individually rational and budget-balanced without an outside subsidy. A market in which efficiency, truthfulness, voluntary participation and budget balance all hold is not available; one of them has to give.
- **Collusion and computation.** VCG is vulnerable to collusion between bidders, and computing the efficient allocation can be intractable when allocations are combinatorial.

For attributing a total risk to components rather than charging for it, see the Shapley and Euler allocations in [Risk Budgeting and Tail Measures](/research/risk-methods/financial-risk-budgeting/).

## Principal and agent: informativeness and multitask

Holmström (1979) characterizes the optimal contract when the principal sees an outcome $x$ but not the agent's effort $a$. With $G$ the principal's utility, $U$ the risk-averse agent's, and $f(x \mid a)$ the outcome density, the optimal sharing rule $s(x)$ satisfies

$$\frac{G'(x - s(x))}{U'(s(x))} = \lambda + \mu \,\frac{f_a(x, a)}{f(x, a)}$$

where $\lambda$ and $\mu$ are the multipliers on the participation and incentive constraints. Pay rises with the likelihood ratio $f_a/f$, which measures how strongly an outcome indicates effort. The informativeness principle follows: an additional signal is worth putting in the contract when it carries information about effort that the outcome does not already carry.

Holmström and Milgrom (1991) supply the warning. When an agent splits effort across several tasks and only some of them are measurable, strong incentives on the measured tasks pull effort away from the unmeasured ones. The optimal response can be weak incentives or none. For safety this is the central result. Paying a team on red-team pass rates or incident counts rewards effort that moves those numbers, which is not the same as effort that reduces risk. It is Goodhart's law in contract form, and a precise version of approval theater. An earlier version of this site cited Holmström and Milgrom for the opposite conclusion, that every safety metric should enter compensation.

The practical reading: treat measured safety metrics as inputs to judgment, audit the dimensions the metrics miss, and keep incentive weights low on any metric that is cheap to move without reducing risk.

## Eliciting probabilities honestly

VCG allocates resources. The tools for eliciting honest probability estimates are different:

- **Proper scoring rules.** Under a strictly proper rule (Brier, logarithmic), a forecaster maximizes expected score by reporting their true belief (Gneiting and Raftery 2007). The rule needs an outcome to score against.
- **Peer prediction.** Miller, Resnick and Zeckhauser (2005) score each report against other agents' reports, which makes truthful reporting an equilibrium when outcomes are never observed. Uninformative equilibria, in which everyone reports the same thing, also exist.
- **Bayesian Truth Serum.** Prelec (2004) asks for an answer and a prediction of how others will answer, and rewards answers that are more common than predicted. Truth-telling is an equilibrium in large populations under a common-prior assumption.
- **Prediction markets** aggregate many such reports into a price.

These map onto the inputs of a risk estimate unevenly. Frequent harm modes and near-miss rates resolve, so scoring rules apply. Catastrophic tail probabilities rarely resolve; peer prediction and Bayesian Truth Serum are the candidates there, and their common-prior assumptions are exactly what a strategic developer may not share. [Expert Elicitation](/design-patterns/tools/expert-elicitation/) covers the non-strategic case.

## Insurance and liability

An insurer prices a policy at roughly

$$\text{premium} = P(\text{violation}) \times E[D \mid \text{violation}] \times (1 + \text{loading})$$

Using the unconditional $E[D]$ in place of $E[D \mid \text{violation}]$ counts the violation probability twice. Insurers address the moral hazard that coverage creates with deductibles, co-insurance and experience rating (bonus-malus premiums that move with claims history). [The Insurer's Dilemma](/delegation-risk/insurers-dilemma/) applies this to AI delegation, and [Regulatory Approaches](/entanglements/cross-domain/regulatory-approaches/) covers the incident-reporting duties now in force.

In US federal procurement, OMB memo M-24-18 (2024) was rescinded and replaced by M-25-22 (April 2025), issued alongside M-25-21 on agency use of AI. Procurement terms that make payment contingent on demonstrated safety are subject to the multitask problem above.

## References

- Gibbard, A. (1973). Manipulation of voting schemes: a general result. *Econometrica* 41(4).
- Green, J., & Laffont, J.-J. (1977). Characterization of satisfactory mechanisms for the revelation of preferences for public goods. *Econometrica* 45(2), 427–438.
- Gneiting, T., & Raftery, A. E. (2007). Strictly proper scoring rules, prediction, and estimation. *JASA* 102(477), 359–378.
- Holmström, B. (1979). Moral hazard and observability. *Bell Journal of Economics* 10(1), 74–91.
- Holmström, B., & Milgrom, P. (1991). Multitask principal-agent analyses: incentive contracts, asset ownership, and job design. *Journal of Law, Economics, & Organization* 7, 24–52.
- Miller, N., Resnick, P., & Zeckhauser, R. (2005). Eliciting informative feedback: the peer-prediction method. *Management Science* 51(9), 1359–1373.
- Myerson, R. (1979). Incentive compatibility and the bargaining problem. *Econometrica* 47(1).
- Myerson, R., & Satterthwaite, M. (1983). Efficient mechanisms for bilateral trading. *Journal of Economic Theory* 29(2), 265–281.
- Prelec, D. (2004). A Bayesian truth serum for subjective data. *Science* 306(5695), 462–466.
- Vickrey (1961), Clarke (1971) and Groves (1973) for the VCG mechanism.
