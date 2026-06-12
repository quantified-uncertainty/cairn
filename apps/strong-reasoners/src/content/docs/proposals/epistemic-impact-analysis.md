---
title: Epistemic Impact Analysis
description: A framework for quantifying the value of information by how it improves a calibrated AI agent's beliefs.
sidebar:
  order: 1
---

*A framework for putting a number on the value of a piece of information: measure how it changes a calibrated AI agent's beliefs, weight the changes by a utility function, and pay out only what survives validation. The pricing mechanism the new economy of cheap information is missing.*

:::note[Status]
Draft v0 · updated June 2026 · maintained by [QURI](https://quantifieduncertainty.org/). Adapted from earlier QURI writing, updated for the LLM era. Positions here are exploratory, not settled.
:::

## Summary

Epistemic Impact Analysis (EIA) is a framework for putting a number on the value of a piece of information. (The acronym collides with environmental impact assessment — a collision we accept, since the shape is the same: a mandated, standardized estimate of diffuse effects, priced before the project proceeds.) The core move: measure how the information changes the beliefs of a calibrated AI agent, then weight those belief changes by a utility function. Information is valuable to the extent that it produces large, validated, decision-relevant updates.

The idea descends from the classical value-of-information literature ([Howard 1966](https://ieeexplore.ieee.org/document/4082064)), but it was hard to operationalize before LLMs: you couldn't cheaply query an agent's belief state before and after exposure to arbitrary text. Now you can. A calibrated LLM gives you a *queryable belief state*, which turns value-of-information from a thought experiment into something you can measure, benchmark, and optimize against.

This matters because the marginal cost of producing plausible-looking analysis has collapsed while the cost of verifying it has not; the scarce skill is knowing which information is worth producing, reading, or paying for. A working EIA system is the pricing mechanism that the new economy of cheap information is missing.

## The framework

An EIA system takes three inputs:

- $I$ — a set of information (data, arguments, evidence, a paper, a comment)
- $A$ — an AI agent capable of making calibrated predictions across domains
- $U$ — a utility function representing some agent's preferences

It outputs $V(I, A, U)$: the expected value, in units of $U$, of agent $A$ updating its beliefs on $I$.

Writing $P(Q \mid A)$ for the agent's probability distribution over answers to question $Q$, and $P(Q \mid A, I)$ for the distribution after processing $I$, the analysis decomposes into three dimensions:

1. **Belief change magnitude.** How much do the agent's distributions move? Measured with divergence metrics, e.g. $D_{KL}\big(P(Q \mid A, I) \,\|\, P(Q \mid A)\big)$.
2. **Profundity.** How load-bearing are the changed beliefs? An update to a belief that many other beliefs depend on matters more than an isolated fact. With LLMs this is directly measurable, if expensive: query the agent on a battery of downstream questions before and after, and count what propagates.
3. **Importance.** How much do the changed beliefs matter to $U$? Not the naive difference $E[U \mid A, I] - E[U \mid A]$, which is sign-confounded by good versus bad news — unwelcome news is often the most valuable kind. Importance is decision-relevant value of information: the expected gain from re-optimizing actions under the posterior rather than the prior.

Importance is the quantity $V$ targets; magnitude and profundity are cheap proxies for when full utility evaluation is infeasible.

## Making the utility function concrete

The quiet difficulty in $V(I, A, U)$ is $U$. For an organization deploying EIA, $U$ is its mission — and mission-level utility functions are exactly the kind of messy, contested object that resists formalization.

The pragmatic move is to represent $U$ as a **weighted portfolio of questions**: a few hundred questions, each with an importance weight. The value of information is then the *validated* improvement in portfolio score — validated, because expected score under the agent's own beliefs measures confidence, not accuracy; the proxy is only as trustworthy as the fraction of the portfolio that resolves (the rest needs proxy resolution, peer prediction, or human panels). This is computable, auditable, and incrementally refinable — though question authoring and maintenance are first-class costs, and the weight vector inherits $U$'s contestedness. A research program's "key questions" document is, literally, a draft utility function.

How portfolios and weights can actually be elicited — pairwise relative-value comparisons, their statistical grounding, and the empirical record of trying — is covered in [Constructing Utility Functions](/concepts/constructing-utility-functions/).

This representation has a known blind spot: a $V$ defined over a fixed question set cannot value the discovery that you are asking the wrong questions. Partial mitigations (meta-questions like "what question, if added, would most raise portfolio value?") reintroduce human judgment. We treat this as an open problem rather than a defect to hide.

## Desired properties

Desiderata — better read as tensioned trade-offs than as jointly satisfiable axioms:

- **Monotonicity**: $V(I) \le V(I \cup J)$ — more information never has negative value (ignoring processing costs) — true only for a perfectly Bayesian $A$ and truthful information, in ex-ante expectation; it fails ex post, for foolable LLM consumers, and wherever falsehood nullification has teeth.
- **Redundancy discounting**: $V(I) + V(J) \ge V(I \cup J)$ when $I$ and $J$ overlap — redundant information isn't double-counted. But information value is not globally submodular ([Krause & Guestrin 2005](https://arxiv.org/abs/1207.1394)): complements (a ciphertext and its key) are superadditive, so greedy near-optimality guarantees don't transfer and "fund the highest marginal-$V$" predictably underfunds complementary programs.
- **Invariance to rephrasing**: $V(I) = V(I')$ when $I'$ is a paraphrase of $I$.
- **Falsehood nullification**: false claims contribute zero (or negative, counting evaluation costs) — at the claim level, since documents are mixtures and adjudicating falsity is itself costly. The sharper attack is *true-but-misleading* selection: $V$ shouldn't pay for updates a better-informed evaluator would reverse (though correctly modeling a false statement — "the minister claimed X" — can still carry value).
- **Calibration with human judgment**: $V$ should broadly track what informed humans would pay for the information.

Falsehood nullification is the load-bearing property; enforcing it *is* the hard problem of verification, reintroduced. An LLM consumer agent can be moved by rhetoric; if $V$ pays out on belief movement alone, the gradient points toward persuasion rather than truth — Goodhart's law applied to belief movement. The standard mitigation splits payment into *surprise now* plus *validation at resolution*, the surprise share escrowed and clawed back if validation fails — a tunable trade-off, not a fix: the persuasion gradient survives in proportion to the unvalidated weight, and never-resolving claims reduce to the open problems of scalable oversight. The latency cost is why fast partial validators ([consistency checks](/proposals/consistency-evals/), retrodiction against held-out data) matter so much: they let a system advance credit against slow resolution.

## The two-loop paradigm

EIA is most interesting not as a one-shot measurement but as a control loop:

- **Object loop**: agents find or create information that scores highly on $V$. "Research" becomes the activity of maximizing validated epistemic impact per unit cost.
- **Meta loop**: the $V$ function itself is improved, based on how well its scores tracked realized value — did high-$V$ information actually improve downstream decisions?

This resembles generalized policy iteration from reinforcement learning — $V$ the critic, the researchers (human or AI) the actors — but only as analogy: the real failure mode is reward-model overoptimization ([Gao, Schulman & Hilton 2023](https://arxiv.org/abs/2210.10760)), and the loop needs an evaluator-plus-protocol that resists exploitation, not a strictly stronger critic — debate-style protocols give weaker judges leverage over stronger provers. Accordingly, the meta loop must run on out-of-band signals (realized outcomes, retrodiction, human spot-evaluations), institutionally separated from the producers being scored. The producers must not mark their own book, nor choose its pages: sample validator-chosen claims, grade on randomized holdouts (outcomes are endogenous to scores), and keep critics diverse or hidden, since a known critic can be optimized against offline.

Used this way, EIA becomes an oversight mechanism for research itself — discussed further in [Overseeing Automated Research](/proposals/overseeing-automated-research/).

## Verification tests

How would we know an EIA system works?

- **Prediction shift test**: measure how a calibrated LLM's predictions change before and after exposure to $I$, on questions with known answers held out from the model. Contamination is the catch — the holdout questions and published $I$ may already be in $A$'s training data, biasing $V$ toward zero; mitigations (post-cutoff sets, snapshot models, synthetic worlds) have costs, and the test exercises only belief shift, not utility weighting or profundity.
- **Expert consensus alignment**: compare system valuations against expert rankings of information value.
- **Decision quality impact**: drop the information into simulated decision environments (including strategy games) and measure realized performance differences.
- **Source hierarchy sanity check**: the intuitive ordering — social media posts below blog posts below peer-reviewed work below formal proofs — is a prediction about *validation rates*, not about $V$: a working system should often value a fresh obscure source above canonical work the agent has already absorbed — a feature, not a failure.

## Applications

- **Research prioritization**: estimate the marginal $V$ of candidate projects before funding them.
- **Scoring contributions**: quantitatively credit the information provided by individuals, organizations, or AI agents — including, eventually, paying for it.
- **Comment and content filtering**: estimate when a comment, post, or document is epistemically net-positive, before or after publication.
- **Training signal**: hill-climb research agents on validated epistemic impact rather than human approval — with all the Goodhart caveats above taken seriously.

## Relation to existing work

The components of EIA mostly exist; the synthesis appears not to. The honest map:

- **Payment logic.** [Hanson's logarithmic market scoring rules](https://mason.gmu.edu/~rhanson/mktscore.pdf) already pay contributors in proportion to the validated improvement they induce in a shared belief state, settled at resolution. EIA's payment scheme is structurally LMSR with the market replaced by a calibrated LLM and the question set replaced by a utility-weighted portfolio — though this forfeits LMSR's path-independence: an LLM belief state is order-dependent, so manufactured belief churn no longer nets to zero, and advance credit must be escrowed and netted at resolution.
- **Prediction-shift measurement.** [Karch et al. (2025)](https://arxiv.org/abs/2502.13691) independently operationalize "value of a text = before/after shift in an LLM's question-answering performance" for corpus-acquisition decisions — the prediction shift test as a working pipeline, though without utility weighting, profundity, or an incentive layer.
- **Data valuation.** [Data Shapley](https://arxiv.org/abs/1904.02868) (Ghorbani & Zou 2019) and [influence functions](https://arxiv.org/abs/1703.04730) (Koh & Liang 2017) already price data by its measured effect on model performance — with pathologies (instability across models, evaluation-set sensitivity, gameability) EIA will inherit.
- **Mechanism design.** [Lu et al. (EC 2024)](https://arxiv.org/abs/2405.15077) already pay humans based on what their text does to an LLM's predictions, with approximate truth-telling equilibria — though the prediction target is a peer's report rather than utility-weighted world-model questions. The broader [peer prediction](https://en.wikipedia.org/wiki/Peer_prediction) and [Bayesian Truth Serum](https://en.wikipedia.org/wiki/Bayesian_truth_serum) lineage is the toolbox for pricing information whose ground truth never resolves. And when elicited beliefs feed decisions, naive proper scoring breaks ([decision scoring rules](https://www.andrew.cmu.edu/user/coesterh/DecisionScoringRules.pdf)) — directly relevant to the two-loop separation argument above.
- **Active versions.** Bayesian experimental design with LLM belief distributions ([BED-LLM](https://arxiv.org/abs/2508.21184)) chooses the next query to maximize expected information gain — the object loop run forward rather than retrospectively. Health economics has used VOI to prioritize research funding for decades ([EVPI/EVSI practice](https://www.valueinhealthjournal.com/article/S1098-3015(20)30027-9/fulltext)); EIA's novelty there is the general-purpose agent and incentive layer, not the idea. For valuing forecasting questions specifically, see [Sempere (2021)](https://nunosempere.com/blog/2021/10/22/an-estimate-of-the-value-of-metaculus-questions/).
- **QURI lineage.** The core quantities have antecedents in [Expected Error](https://www.lesswrong.com/posts/rgyjLwxvgQQ3BMZCN/expected-error-or-how-wrong-you-expect-to-be) (2016), the [RAIN framework](https://www.lesswrong.com/posts/s4TrCbCXvvWfkT2o6/the-rain-framework-for-informational-effectiveness) for informational effectiveness (2019), and [estimating the EV of general intellectual progress](https://forum.effectivealtruism.org/posts/3YeQ9LFuPnCBSu22M/how-to-estimate-the-ev-of-general-intellectual-progress) (2020). A small deployed precursor: QURI's 2025 Fermi competition scored entries with an LLM judge whose rubric weighted *surprise* at 40% — a belief-shift proxy ([case studies](/case-studies/llm-epistemics-in-production/)). And realized value depends on how updates propagate through networks of people and agents, not only on direct decisions ([Nuanced Models for the Influence of Information](https://forum.effectivealtruism.org/posts/JuqvBMELn2w9TiHR2/nuanced-models-for-the-influence-of-information)).
- **Arrow's information paradox.** The standard objection to pricing information — [you can't value it until you've seen it, and then you've already acquired it](https://en.wikipedia.org/wiki/Arrow_information_paradox) — has a classical answer: trusted intermediation (escrow, NDA-mediated diligence, journals-as-certifiers). EIA makes the intermediary cheap, automatic, and standardized: a third-party agent inspects the information, prices it by induced belief shift, and triggers payment, without the buyer seeing it first. Two residues: the quoted $V$ itself leaks the surprise's direction and rough size (coarsen it, or quote post-payment), and the buyer must now trust the pricing agent's calibration — the paradox relocated, not dissolved.

## Open questions

- How well can current LLMs serve as the consumer agent $A$? Their calibration and [consistency](/proposals/consistency-evals/) are measurable and currently imperfect — larger models update more Bayesianly, but far from perfectly ([Bayesian coherence tests](https://arxiv.org/abs/2507.17951)); $V$'s integrity is bounded by both.
- What divergence measures best capture belief change for rich objects (full probability distributions, structured models) rather than single probabilities?
- How should profundity be measured efficiently, without querying thousands of downstream questions per evaluation?
- How resistant can the system be made to adversarial information — content optimized to produce large but unjustified updates, or strategically timed contributions exploiting order-dependence? [What Can You Use from an Untrustworthy Source?](/concepts/untrustworthy-sources/) develops this into its own page.
- Can portfolio-based $U$ representations be extended to value question discovery, not just question answering?
