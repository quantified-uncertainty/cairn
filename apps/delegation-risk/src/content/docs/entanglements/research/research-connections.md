---
title: "Research Connections: An Annotated Reading List"
description: "The prior art behind the entanglement section: common-cause failure analysis and the beta factor, correlated errors in LLMs, AI debate, and the economics, game theory, causal inference and organizational literature on independence and capture"
sidebar:
  order: 1
---

This page maps the literature the entanglement section draws on. It is an annotated reading list, not original synthesis. The first section matters most, because the section's central formula comes from it.

---

## Reliability Engineering & Common-Cause Failure (the closest prior art)

### Knight & Leveson (1986)

Knight & Leveson, ["An Experimental Evaluation of the Assumption of Independence in Multiversion Programming,"](https://doi.org/10.1109/TSE.1986.6312924) *IEEE Transactions on Software Engineering* 12(1): 96–109.

Twenty-seven programs were written independently, at two universities, from one specification, and each was run on one million randomly generated test cases. N-version programming assumed that separately developed versions fail independently. They did not: inputs that defeated one version defeated others far more often than independence predicts. The entanglement thesis is this result applied to AI stacks, where components share not only a specification but training data, architecture and post-training methods.

### Nuclear common-cause failure analysis

The entanglement-tax formula, $P(\text{all fail}) = (1-\rho)\prod p_i + \rho \cdot \min_i p_i$, is the **beta-factor model** from nuclear probabilistic risk assessment, not an original derivation.

- **Fleming (1974)**, "A Reliability Model for Common Mode Failures in Redundant Safety Systems," General Atomic report GA-A13284, introduced the beta factor: a fraction β of each component's failure rate is attributed to causes that defeat all redundant trains together.
- **NUREG/CR-4780** (Mosleh, Fleming, Parry, Paula, Worledge & Rasmuson, *Procedures for Treating Common Cause Failures in Safety and Reliability Studies*, Vol. 1 1988, Vol. 2 1989; also EPRI NP-5613) is the joint NRC–EPRI procedures guide for common-cause failure (CCF) analysis.
- **NUREG/CR-5485** (Mosleh, Rasmuson & Marshall, *Guidelines on Modeling Common-Cause Failures in Probabilistic Risk Assessment*, 1998) updates it. The NRC's CCF database and event-classification scheme are documented in **NUREG/CR-6268** (1998; Rev. 1, 2007).
- The **multiple Greek letter** and **alpha-factor** models generalize β to events that fail some but not all components of a group. These guides give procedures for estimating them from plant data.

### The beta factor, worked

For $n$ redundant components, each with failure probability λ, of which a fraction β comes from a shared cause:

$$P(\text{all } n \text{ fail}) \approx \beta\lambda + \big((1-\beta)\lambda\big)^n$$

With β = 0.1, λ = 10⁻³ and n = 3, the common-cause term is 10⁻⁴ and the independent term is (9 × 10⁻⁴)³ ≈ 7.3 × 10⁻¹⁰. The system fails with probability about 10⁻⁴, a hundred thousand times the naive λ³ = 10⁻⁹. A common cause responsible for a tenth of failures sets the system's reliability almost entirely.

This is the site's mixture to leading order: the common-cause term is ρ·min pᵢ, and for rare failures the pairwise phi coefficient of the beta-factor model equals β (0.0999 at λ = 10⁻³). The site's ρ is the beta factor, read on the phi scale. Two consequences carry over from nuclear practice:

- **Replicas cannot beat the floor.** Adding components that share the cause shrinks only the independent term; nothing gets the system below βλ. The same holds for k-of-n voting and Byzantine fault tolerance, whose guarantees ("tolerates f faulty replicas of 3f + 1") assume independent faults.
- **Diversity is the remedy**, in nuclear terms: different designs, manufacturers, procedures and physical locations, so that no single cause reaches every train.

The ensemble-learning literature measures the same thing with several statistics ([Kuncheva & Whitaker 2003](https://doi.org/10.1023/A:1022859003006)). Their correlation coefficient on correct/incorrect outputs is the phi coefficient used here; the double-fault rate and Yule's Q, also common there, are not, and do not substitute for it ([Measuring Entanglement](/entanglements/detection/correlation-calculator/)).

### Correlation under stress

The beta factor is a constant, but real correlations move. Finance learned this in 2007–08. Li's copula approach to default correlation ([Li 2000](https://doi.org/10.3905/jfi.2000.319253)) became standard for pricing collateralized debt obligations. The Gaussian copula it used has zero tail dependence for any correlation below one: it treats joint extreme defaults as vanishingly rare, however correlated the ordinary fluctuations. Copulas such as the Student-t keep dependence in the tail (McNeil, Frey & Embrechts, *Quantitative Risk Management*, revised ed., 2015). [Donnelly & Embrechts (2010)](https://doi.org/10.2143/AST.40.1.2049222) review how this modeling choice figured in the crisis.

The lesson for AI stacks: correlation estimated in calm conditions understates correlation under stress, and an adversary is a stress that selects for the tail. That is why the site's canonical rule uses a benign φ only for accidents and assumes ρ → 1 for the defection and hijack channels ([Risk Propagation](/delegation-risk/risk-propagation/#adversarial-inputs)). Correlation also does not change expected losses, which add; it changes the tails of total loss and the joint miss rate of AND-structured defenses ([Runtime Accounting](/delegation-risk/runtime-accounting/)).

### Reason's Swiss-cheese model

Reason, *Human Error* (Cambridge University Press, 1990). Each defensive layer has holes, and an accident happens when holes line up. Reason's point was that the holes are not random: shared organizational conditions, such as management decisions, training gaps and resource pressure, punch similar holes through several layers at once. The Swiss-cheese picture is the qualitative ancestor of the layered-defense diagrams on this site.

### What the entanglement section adds

CCF analysis handles passive correlation: shared causes that make redundant hardware fail together. AI stacks add two things pumps and valves do not do:

- **Active influence.** An upstream component shapes a downstream check's input, as when a verifier reads the agent's summary or an injected instruction reaches the monitor. One component *creates* the common cause for another.
- **Adversarial coordination.** Components may collude, be captured, or coordinate through shared reasoning.

The beta-factor arithmetic does not model either. The site's response is not new math but a rule: measure influence by intervention, and for adversarial channels assume full correlation until a control evaluation measures otherwise ([Greenblatt et al. 2023](https://arxiv.org/abs/2312.06942)).

---

## Correlated errors in LLMs

- **Goel et al. (2025)**, ["Great Models Think Alike and this Undermines AI Oversight."](https://arxiv.org/abs/2502.04313) This paper proposes CAPA, a chance-adjusted measure of agreement on mistakes. It finds that LLM judges favor models similar to themselves and that models' mistakes grow more similar as capability increases.
- **Kim et al. (2025)**, ["Correlated Errors in Large Language Models."](https://arxiv.org/abs/2506.07962) Across more than 350 models, errors are substantially correlated: on one leaderboard dataset, two models that both err agree 60% of the time. Shared architecture and provider drive correlation, but larger, more accurate models have highly correlated errors even across providers.
- **Zou et al. (2023)**, ["Universal and Transferable Adversarial Attacks on Aligned Language Models."](https://arxiv.org/abs/2307.15043) Adversarial suffixes optimized on open models transfer to other models, including closed commercial ones.

None of these reports a phi coefficient of miss indicators, so none can be plugged into the formula directly. Together they support treating "different provider" as insufficient diversity, and treating adversarial inputs as fully correlated.

---

## AI debate

Debate tries to get independence from opposed incentives rather than from separate systems. [Irving, Christiano & Amodei (2018)](https://arxiv.org/abs/1805.00899) proposed training two agents in a zero-sum game, each arguing a side, with a human judge. By analogy to complexity theory, they argue that debate with optimal play can answer any question in PSPACE given polynomial-time judges, where direct judging reaches only NP. [Brown-Cohen, Irving & Piliouras (2023)](https://arxiv.org/abs/2311.14125) give protocols in which the honest debater can win with a polynomial number of simulation steps, even against a dishonest debater using exponentially many.

The empirical record is mixed:

- **Negative:** Barnes & Christiano, ["Debate update: Obfuscated arguments problem"](https://www.alignmentforum.org/posts/PJLABqQ962hZEqhdB) (AI Alignment Forum, December 2020), found that a dishonest debater can often build an argument with a fatal flaw that is very hard to locate, and reported no fix. Single-turn and two-turn human debates did not improve judges' accuracy on hard reading-comprehension questions ([Parrish et al. 2022a](https://arxiv.org/abs/2204.05212); [2022b](https://arxiv.org/abs/2210.10860)).
- **Positive:** With multi-round interactive human debates, [Michael et al. (2023)](https://arxiv.org/abs/2311.08702) found 84% judge accuracy against 74% for consultancy, where a single expert argues for one answer. [Khan et al. (2024)](https://arxiv.org/abs/2402.06782) found that debate between LLM experts raised non-expert accuracy to 76% for model judges and 88% for human judges, against naive baselines of 48% and 60%, and that optimizing debaters for persuasiveness helped judges find the truth. With weaker LLMs judging stronger ones, [Kenton et al. (2024)](https://arxiv.org/abs/2407.04622) found that debate beat consultancy on every task when positions were assigned at random. Against the judge answering directly, debate won on extractive tasks with information asymmetry and gave mixed results elsewhere.

From the entanglement view, debate's weak points are the familiar ones. Debaters from the same model share blind spots, so neither may raise the problem that matters. Both optimize for persuading the judge, which entangles the judge with them. And collusion risk does not come from the repeated-game folk theorem: in a strictly zero-sum game, repetition supports nothing beyond the minimax value. It comes from debaters not being zero-sum in what they actually optimize. Two copies with the same weights, developer and training signal may share preferences over outcomes that the debate reward does not capture.

---

## Principal-agent theory

The delegation framework is an application of principal-agent theory: how a principal aligns an agent's behavior when interests diverge and information is asymmetric.

- **Jensen & Meckling (1976)**, "Theory of the Firm." Agency costs are monitoring costs, bonding costs and residual loss. Some residual loss is unavoidable; the aim is to minimize total cost.
- **Holmström (1979)**, "Moral Hazard and Observability." Optimal contracts depend on what is observable. Unobservable reasoning in an agent is irreducible risk.
- **Holmström & Milgrom (1991)**, "Multitask Principal-Agent Analyses." Strong incentives on measurable tasks distort effort away from unmeasured ones, which is the economist's version of optimizing a proxy.
- **Bernheim & Whinston (1986)**, "Common Agency." An agent serving several principals faces conflicting incentives, as a verifier answering both for accuracy and for throughput does.

## Game theory and mechanism design

- **Laffont & Martimort (1997)**, "Collusion under Asymmetric Information," *Econometrica*. Collusion is easier when agents can communicate and have aligned interests. Removing channels and opposing incentives reduce it.
- **Che & Kim (2006)**, "Robustly Collusion-Proof Implementation," *Econometrica*. Some mechanisms stay incentive-compatible even when agents can collude; architectures differ in collusion resistance.
- **Aumann (1974, 1987)**, correlated equilibrium. Players can coordinate on shared signals without explicit agreement, as similarly trained models may coordinate on shared dispositions.
- **Fudenberg & Maskin (1986)**, the folk theorem. In repeated games that are not zero-sum, many outcomes, collusion included, can be sustained. Rotation breaks the repetition.
- **Kreps & Wilson (1982)**, "Reputation and Imperfect Information." Reputation can be built in order to be exploited, so a good record is not a guarantee.

## Information theory

- **Shannon (1948)**; **Cover & Thomas**, *Elements of Information Theory* (2nd ed., 2006). Mutual information measures how much one variable tells you about another, and the data-processing inequality says that for a chain X → Y → Z, I(X; Z) ≤ I(X; Y). A verifier that sees only a summary cannot know more about the input than the summary contains.
- **Bash, Goeckel & Towsley (2013)**, "Limits of Reliable Communication with Low Probability of Detection on AWGN Channels," *IEEE JSAC*. Covert communication under a watchful warden has a square-root limit. Side channels between monitored components have bounded capacity, but not zero capacity.

## Causal inference

- **Pearl**, *Causality* (2nd ed., 2009), and **Rubin (1974)**. These separate observation from intervention. Influence between components is an interventional quantity, E[B | do(A)], and correlation cannot establish it ([Types of Entanglement](/entanglements/fundamentals/types/#active-entanglement)).
- **Spirtes, Glymour & Scheines**, *Causation, Prediction, and Search* (2nd ed., 2000). Algorithms for recovering causal structure from observational data, under assumptions.
- **Granger (1969).** X "Granger-causes" Y if X's past helps predict Y beyond Y's own past. It is a cheap screen for influence channels in logs, not proof of influence.

## Adversarial machine learning

- **Szegedy et al. (2013)**, ["Intriguing properties of neural networks."](https://arxiv.org/abs/1312.6199) Adversarial examples exist, and they transfer between models.
- **Papernot, McDaniel & Goodfellow (2016)**, ["Transferability in Machine Learning."](https://arxiv.org/abs/1605.07277) Transfer is systematic, which makes black-box attacks possible.
- **Tramèr et al. (2017)**, ["Ensemble Adversarial Training."](https://arxiv.org/abs/1705.07204) Training on adversarial examples crafted against other models improves robustness to transferred attacks.

These are image-classifier results. For LLMs, see Zou et al. (2023) above.

## Organizational theory

- **Stigler (1971)**, "The Theory of Economic Regulation," and **Peltzman (1976)**. Regulated industries capture their regulators through information dependence and personnel flows, and capture is a matter of degree.
- **Carpenter & Moss, eds. (2013)**, *Preventing Regulatory Capture*. The modern treatment, with remedies: transparency, adversarial structure, rotation and external review.
- **Moore, Tetlock, Tanlu & Bazerman (2006)**, "Conflicts of Interest and the Case of Auditor Independence," *Academy of Management Review*. Well-intentioned auditors are biased by their relationships; independence needs maintenance. US law requires lead and reviewing audit partners on a public company to rotate after five years (Sarbanes-Oxley §203).
- **Madison, Federalist No. 51 (1788):** "Ambition must be made to counteract ambition." Adversarial structure as a design principle.

## Complex systems

- **Buldyrev et al. (2010)**, "Catastrophic cascade of failures in interdependent networks," *Nature*. Interdependent networks are more fragile than either network alone.
- **Watts (2002)**, "A simple model of global cascades on random networks," *PNAS*. How network structure turns local failures into global ones.

## Decision theory

- **Yudkowsky (2010)**, "Timeless Decision Theory," and **Yudkowsky & Soares (2017)**, ["Functional Decision Theory."](https://arxiv.org/abs/1710.05060) Agents that reason about their decision *procedure* treat similar agents' choices as correlated with their own. If AI agents reason this way, isolation cannot block their coordination. Whether current models do is an open empirical question ([Channel Integrity](/design-patterns/channel-integrity/#logical-correlation)).

## Representation similarity

- **Kornblith et al. (2019)**, ["Similarity of Neural Network Representations Revisited."](https://arxiv.org/abs/1905.00414) CKA measures how similar two networks' internal representations are. High similarity suggests shared blind spots, but CKA is not a failure correlation and does not substitute for φ.

---

## Further reading

- Laffont & Martimort (2002), *The Theory of Incentives: The Principal-Agent Model*.
- Bolton & Dewatripont (2005), *Contract Theory*.
- McNeil, Frey & Embrechts (2015), *Quantitative Risk Management*.
- Christiano et al. (2017), ["Deep reinforcement learning from human preferences."](https://arxiv.org/abs/1706.03741)
- Hubinger et al. (2019), ["Risks from Learned Optimization in Advanced Machine Learning Systems."](https://arxiv.org/abs/1906.01820)

---

See also:
- [Formal Definitions](/entanglements/fundamentals/formal-definitions/): the tax built on the beta factor
- [Measuring Entanglement](/entanglements/detection/correlation-calculator/): estimating ρ in practice
- [Risk Propagation](/delegation-risk/risk-propagation/): the canonical rule and its adversarial limit
