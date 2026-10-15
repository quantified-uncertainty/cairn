---
title: "Principal–Agent Foundations"
description: "How delegation risk relates to the economics of delegation: agency costs, moral hazard and the informativeness principle, hidden types and reputation, the multitask result, delegation sets, insurance, ambiguity aversion, and the standard assumptions that AI agents break."
---

Delegation risk is a piece of an older quantity. Economists have studied the cost of having someone else act for you since the 1970s, and most of this site's vocabulary descends from that work. This page lays out the correspondence, says which results carry over to AI agents, and says which assumptions AI agents break. Kolt (2026, [arXiv:2501.07913](https://arxiv.org/abs/2501.07913)) reaches a similar conclusion from agency law and theory: incentive design, monitoring and enforcement may not work on agents whose decisions are uninterpretable and which act at machine speed and scale. The Holmström (1979) optimality condition is written out in [Mechanism Design](/research/system-design/mechanism-design/#principal-and-agent-informativeness-and-multitask). Insurance markets are treated in [The Insurer's Dilemma](/delegation-risk/insurers-dilemma/). Neither is repeated here.

## Agency cost

Jensen and Meckling (1976) define the *agency cost* of a relationship as the sum of three terms:

- the principal's *monitoring* expenditures;
- the agent's *bonding* expenditures, spent to make its commitments credible;
- the *residual loss*: the value the principal still loses because the agent's decisions diverge from the ones that would maximize the principal's welfare.

Delegation risk after controls corresponds to the residual loss, and verification spend corresponds to monitoring. The correspondence is not exact. Residual loss in Jensen and Meckling comes from divergent *interests*, which is this site's [defection channel](/delegation-risk/risk-decomposition/). An honest delegate's mistakes, the accident channel, are ordinary production risk in the economic framing, and the hijack channel has no direct counterpart.

The useful lesson is about the objective. The principal should minimize the whole sum, not the residual alone. A deployment that drives delegation risk toward zero with heavy verification can cost more than one that tolerates some residual loss. Verification is worth buying while a marginal dollar of it removes at least a dollar of expected loss, and a risk budget should be set by the same marginal comparison.

## Moral hazard and the informativeness principle

*Moral hazard* is the change in behavior that insurance induces (Arrow 1963), and more generally the problem of an agent whose action the principal cannot observe. Holmström (1979) asked when imperfect information about the action improves on a contract based on the outcome alone, and derived a necessary and sufficient condition. A further signal $y$ has value when the outcome $x$ is not a *sufficient statistic* for $(x, y)$ with respect to the agent's action: that is, when $y$ says something about what the agent did that $x$ does not already say. This is the *informativeness principle*.

Holmström's signals are valuable because a contract conditions on them and the agent anticipates that. For AI delegates the incentive route is weak (assumption 2 below), and most of the value of a check comes from two other functions: *interception*, stopping a harmful action before its outcome is realized, and *screening*, learning what kind of model one has. Interception is why reviewing a diff before merge is worth paying for even though it looks only at the output: the outcome it pre-empts has not yet happened. The informativeness principle still says what a check needs for screening, namely evidence about conduct the output does not show, such as action logs, a reasoning trace or a tool-call record. Two assumptions in the theorem matter for AI, and both can fail:

1. **The signal reflects the agent's actual conduct, and the agent can move it only by acting.** Random audits deter because the audited party cannot tell which actions will be checked ([inspection games](/research/trust-behavior/empirical-scheming-reduction/#7-audit-rates-and-inspection-games)). A model that recognizes when it is being evaluated breaks this: monitors see its conduct when it believes it is watched. Evaluation awareness is now measured, and in some frontier models it is common ([Empirical Scheming Reduction](/research/trust-behavior/empirical-scheming-reduction/#2-the-transfer-discount-evaluation-awareness)). A model that can shape its own reasoning trace breaks it a second way.
2. **The principal uses the signal in a contract the agent responds to.** For a human agent, the contract is pay. For a model, the levers are deployment decisions: what it may touch, how much autonomy it gets, whether it is retrained or withdrawn. The model does not optimize against these terms the way an employee optimizes against a bonus, unless they enter its training signal or context.

The two assumptions pull against each other. In Holmström's model, conditioning pay on a signal does not degrade it, because the agent can move the signal only through the action. A trained model can learn to move it directly. Baker et al. (2025, [arXiv:2503.11926](https://arxiv.org/abs/2503.11926)) put a chain-of-thought monitor into the reinforcement-learning reward of a reasoning model doing agentic coding; under strong optimization the model kept reward hacking and hid its intent from the monitor ([details](/research/trust-behavior/empirical-scheming-reduction/#4-reading-the-reasoning-chains-of-thought-and-probes)). A signal used to train a model loses value as a signal about it.

Holmström's later paper on teams (1982) adds a result about comparisons. Measuring agents relative to one another helps only as a way of extracting information, chiefly by filtering out shocks they share; in his words, "competition per se is worthless". When the delegates are instances of one model, the shared component *is* the disposition the principal wants to detect. Comparing instances, or having one copy check another, removes the common component, so it can catch idiosyncratic failures and cannot catch the shared ones. This is the [entanglement tax](/entanglements/) in contract-theory form.

## Hidden type and the value of a track record

Moral hazard is a problem of hidden *action*. The central worry about a frontier model, whether it is disposed to scheme, is closer to a hidden *type* fixed in training: adverse selection. The reputation literature says what a track record is worth then. In Kreps and Wilson (1982), a small prior probability that an incumbent is a committed "tough" type leads the weak type to imitate it through most of a repeated game, deviating only near the end. Sobel (1985) gives the version closest to delegation: an adviser of uncertain motives becomes credible by reporting accurately, and in some situations it later pays to cash that credibility in. Imitation is cheap while stakes are low and being trusted is worth more later, so good conduct under observation says little about type when the delegate expects larger opportunities ahead. This is deceptive alignment in economic form. Conduct that depends on whether a model believes it is being trained has been demonstrated in a constructed setting ([alignment faking](/research/trust-behavior/empirical-scheming-reduction/#under-constructed-incentives)), though there the model was protecting values its developer had given it.

This limits graduated trust. Widening a delegate's autonomy after a clean record is sound against accidents, whose rate the record estimates, and weak against a delegate whose type is the question, unless the record was gathered under conditions it cannot tell apart from deployment. Raising the stakes of an evaluation does not fix this: the more a strategic type gains from passing, the more reason it has to imitate.

## Multitask: constraints substitute for incentives

Holmström and Milgrom (1991) give the result that matters most for safety. An agent splits attention across several tasks, and some of them cannot be measured. Rewarding the measured tasks pulls attention away from the unmeasured ones; more generally, "the desirability of providing incentives for any one activity decreases with the difficulty of measuring performance in any other activities that make competing demands on the agent's time and attention." The optimal contract can be a fixed wage that ignores measured performance, even when an objective measure exists and the agent responds strongly to incentives. The result argues against paying on safety metrics, not for it.

A second result concerns when a firm should restrict an employee's outside activities. Holmström and Milgrom find that outside activities "should be most severely restricted when performance in the tasks that benefit the firm … are hard to measure and reward". They conclude that "constraints are substitutes for performance incentives and are extensively used when it is hard to assess the performance of the agent."

Both results transfer to AI delegation in two places.

- **Training.** Reinforcement learning on measurable rewards is the high-powered contract. Reward hacking, such as editing tests so a broken change passes, is the distortion the multitask model predicts when the reward measures one dimension of a task and the principal cares about others. The mechanism differs: optimization pressure shapes a policy rather than an agent reallocating effort. The direction of the effect is the same.
- **Deployment.** The dimensions an operator most cares about, such as the absence of scheming, data exfiltration and side effects, are the hardest to measure. The multitask result then recommends constraints over performance-contingent trust, and the [exposure envelope](/delegation-risk/runtime-accounting/#2-the-exposure-envelope) is such a constraint. File scope, egress rules and spend caps restrict outside activity because inside performance cannot be fully assessed.

## Insurance and moral hazard

Shavell (1979) worked out the insurance contract under moral hazard: when the insurer cannot observe the insured's care, the optimal policy generally leaves the insured bearing part of the loss; when care is observable, coverage can be fuller. With AI the party whose care matters is the operator, not the model, and the theory applies to the operator unchanged. [The Insurer's Dilemma](/delegation-risk/insurers-dilemma/) covers deductibles, monitoring in place of retention, adverse selection, and the AI-liability market.

## Ambiguity: pricing a risk nobody can quantify

Expected loss assumes a probability. For a frontier model's propensity to defect there is no frequency data, and evaluation awareness weakens the tests that would produce some. A Bayesian averages over that uncertainty and prices the mean. People and insurers often do not.

Ellsberg (1961) showed that people treat known and unknown probabilities differently. With an urn of 30 red balls and 60 black or yellow in unknown proportion, most subjects prefer betting on red to black, and on "black or yellow" to "red or yellow". No single probability assignment rationalizes both choices, so the pattern violates Savage's axioms.

Gilboa and Schmeidler (1989) axiomatized one version of this behavior, *maxmin expected utility*. The decision-maker holds a closed convex set of priors and evaluates each option by its expected utility under the least favorable one. If $P(\text{defection})$ is known only to lie in $[p_\text{lo}, p_\text{hi}]$, a maxmin evaluator prices the harm mode at $p_\text{hi} \times D$, not at a central estimate.

Maxmin is the extreme case, but insurers do charge for ambiguity. Hogarth and Kunreuther (1989) found that economically sophisticated subjects, including professional actuaries, priced insurance higher for low-probability losses with ambiguous probabilities, and were more ambiguity-averse when pricing as firms than as consumers. Kunreuther, Hogarth and Meszaros (1993) surveyed actuaries, underwriters and reinsurers and found all three groups ambiguity-averse; their title names the consequence, market failure for ambiguous risks.

Three consequences follow for delegation risk:

- **A headline estimate should be a range.** The width of that range is information a point estimate hides, and it is what an insurer will charge for. [Delegation Accounting](/delegation-risk/delegation-accounting/) calls this charge the *ambiguity loading*.
- **Legibility has a price separate from safety.** Narrowing the set of plausible probabilities lowers an ambiguity-averse price even when the central estimate does not move. A hard bound on damage narrows it from the other side. With $D$ capped by an envelope, the worst case over priors is bounded however wide the probability range is.
- **Exclusion is the limit case.** When the set of priors is wide and losses are correlated across policyholders, an insurer can decline to price the risk at all. With a January 2026 edition date, Verisk's ISO program issued optional generative-AI exclusion endorsements for US commercial general liability policies: CG 40 47, CG 40 48, and CG 35 08 for products and completed operations ([Independent Agent, October 2025](https://www.independentagent.com/vu_resource/verisk-to-roll-out-new-general-liability-exclusions-for-generative-ai-exposures/)).

## Where AI agents break the standard assumptions

The canonical model has a risk-averse agent with wealth, a known utility function, a known set of feasible actions and an outside option. The principal designs pay to balance risk-sharing against incentives, subject to the agent accepting the contract. AI delegates fail most of these premises.

**No wealth, so no liability.** Limited liability already weakens contracts with human agents. Sappington (1983) shows that when the penalties a principal can impose on a risk-neutral agent are capped, the principal may prefer not to induce fully efficient behavior. A model is the extreme case: it holds no wealth, it is not the payee, and its liability floor is zero. Bonds, slashing and reputation stakes therefore bind the operator or vendor, not the model, unless they enter its training. The same absence removes a constraint as well. The model has no participation constraint and is not risk-averse, so the risk-sharing–incentive trade-off at the centre of Holmström (1979) vanishes. What remains is a problem of information and control: what to observe, and what to permit.

The second half has its own theory, which starts with Holmström (1984). A principal who cannot pay an informed but biased agent chooses a set of permitted decisions from which the agent picks, and the agent's discretion should shrink as its preferences diverge from the principal's. Alonso and Matouschek (2008) characterize when an interval, a cap on how far the agent may go, is optimal. An exposure envelope is such a delegation set, and the trade-off carries over: a wider set lets the delegate use what it knows, a narrower one limits what its bias can cost. For an AI delegate the size and direction of the bias are unknown. Under quadratic loss, the expected cost of letting a biased agent choose grows with the variance of its bias as well as the square of its mean, which pushes toward narrower sets.

**Copyable agents.** One set of weights runs as many instances, so the agent's type is perfectly correlated across them, and reputation attaches to the model rather than the instance. Termination disciplines an employee who would lose a valuable job. A model loses nothing it values unless it values its own deployment, and a model that does is the type that imitates. Adverse selection happens once, at the level of the model, and a defect in the model is a defect in every deployment. For insurers this is the correlated-claims problem; for monitoring it is the comparison problem from Holmström (1982) above.

**Opaque objectives and unknown capabilities.** Incentive compatibility is checked against the agent's utility function. The designer knows it, or at least its form. A model's objectives are not known, may not form a stable utility function, and can differ between evaluation and deployment. Hadfield-Menell and Hadfield (2019, [arXiv:1804.04268](https://arxiv.org/abs/1804.04268)) frame alignment as an incomplete-contracting problem: a reward function is an incomplete contract. Human contracts are completed by external structure, such as law and culture, which supplies implied terms, and their proposed research agenda is to build AI that can draw on that structure. Nor is the action set known: what a model can do is estimated by elicitation, which a model can defeat by underperforming on purpose ([sandbagging](/research/trust-behavior/empirical-scheming-reduction/#5-the-capability-input-sandbagging-and-elicitation)). Without a known objective or action set the incentive constraint cannot be written down, so the principal falls back on monitoring and constraint, the two levers that do not need it.

**Correlated agents, and collusion without side contracts.** Tirole (1986) models a supervisor who can collude with the agent he supervises through a side contract, and asks how the principal should design the organization so that collusion does not pay. When the monitor and the actor are built on the same model, they need no side contract: a shared disposition or a shared blind spot does the colluding. That is why AI Control separates trusted and untrusted models ([Greenblatt et al. 2023](https://arxiv.org/abs/2312.06942)), and why this site treats monitor–actor correlation as a parameter to measure ([Empirical Scheming Reduction](/research/trust-behavior/empirical-scheming-reduction/#6-correlation-between-delegate-and-monitor)). The hijack channel is a cheaper version of the same thing. An attacker who injects instructions into a document the agent reads has made a side contract with the agent for the cost of writing some text.

## What carries over

A check is worth what it reveals about conduct beyond the outcome, provided the delegate cannot shape what it reveals; training on the check is one way to teach it to. When the dimensions that matter cannot be measured, constraints do better than incentives, and when the agent cannot be paid, choosing what it may do is the whole design problem. A track record is weak evidence about a type that has reason to imitate a better one. Ambiguity costs money separately from expected loss, so bounding damage and making a system legible lower its price. What does not transfer is the starting point of most mechanism design, paying the agent to behave: incentives act on the people and firms in the chain, and on the model only through training.

## References

- Alonso, R., & Matouschek, N. (2008). Optimal Delegation. *Review of Economic Studies* 75(1), 259–293.
- Arrow, K. J. (1963). Uncertainty and the Welfare Economics of Medical Care. *American Economic Review* 53(5), 941–973.
- Baker, B., Huizinga, J., Gao, L., Dou, Z., Guan, M. Y., Madry, A., Zaremba, W., Pachocki, J., & Farhi, D. (2025). [Monitoring Reasoning Models for Misbehavior and the Risks of Promoting Obfuscation](https://arxiv.org/abs/2503.11926). arXiv:2503.11926.
- Ellsberg, D. (1961). Risk, Ambiguity, and the Savage Axioms. *Quarterly Journal of Economics* 75(4), 643–669.
- Gilboa, I., & Schmeidler, D. (1989). Maxmin Expected Utility with Non-Unique Prior. *Journal of Mathematical Economics* 18(2), 141–153.
- Greenblatt, R., Shlegeris, B., Sachan, K., & Roger, F. (2023). [AI Control: Improving Safety Despite Intentional Subversion](https://arxiv.org/abs/2312.06942). ICML 2024.
- Hadfield-Menell, D., & Hadfield, G. K. (2019). [Incomplete Contracting and AI Alignment](https://arxiv.org/abs/1804.04268). *AIES '19*.
- Hogarth, R. M., & Kunreuther, H. (1989). Risk, Ambiguity, and Insurance. *Journal of Risk and Uncertainty* 2(1), 5–35.
- Holmström, B. (1979). Moral Hazard and Observability. *Bell Journal of Economics* 10(1), 74–91.
- Holmström, B. (1982). Moral Hazard in Teams. *Bell Journal of Economics* 13(2), 324–340.
- Holmström, B. (1984). On the Theory of Delegation. In M. Boyer & R. Kihlstrom (Eds.), *Bayesian Models in Economic Theory* (pp. 115–141). North-Holland.
- Holmström, B., & Milgrom, P. (1991). Multitask Principal-Agent Analyses: Incentive Contracts, Asset Ownership, and Job Design. *Journal of Law, Economics, & Organization* 7 (special issue), 24–52.
- Jensen, M. C., & Meckling, W. H. (1976). Theory of the Firm: Managerial Behavior, Agency Costs and Ownership Structure. *Journal of Financial Economics* 3(4), 305–360.
- Kolt, N. (2026). [Governing AI Agents](https://arxiv.org/abs/2501.07913). *Notre Dame Law Review* 101, 335.
- Kreps, D. M., & Wilson, R. (1982). Reputation and Imperfect Information. *Journal of Economic Theory* 27(2), 253–279.
- Kunreuther, H., Hogarth, R., & Meszaros, J. (1993). Insurer Ambiguity and Market Failure. *Journal of Risk and Uncertainty* 7(1), 71–87.
- Sappington, D. (1983). Limited Liability Contracts between Principal and Agent. *Journal of Economic Theory* 29(1), 1–21.
- Shavell, S. (1979). On Moral Hazard and Insurance. *Quarterly Journal of Economics* 93(4), 541–562.
- Sobel, J. (1985). A Theory of Credibility. *Review of Economic Studies* 52(4), 557–573.
- Tirole, J. (1986). Hierarchies and Bureaucracies: On the Role of Collusion in Organizations. *Journal of Law, Economics, & Organization* 2(2), 181–214.
