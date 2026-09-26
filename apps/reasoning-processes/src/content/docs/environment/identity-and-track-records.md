---
title: Identity and Track-Record Infrastructure
description: The institution every incentive scheme in this book silently assumes — identities that make penalties stick and make "n independent reports" mean n, and track records that cost time to fake — and what changes when the reporters are copyable AI processes.
---

*Three chapters of this book end at the same wall. [Deterrence](/concepts/hardening-deterrence/) needs a penalty that sticks; [incentive-compatibility](/concepts/hardening-incentives/) needs escrow netted across a history; [independence](/concepts/hardening-independence/) needs "k reports" to mean k reporters. All three are functions of one missing institution: identity bound to something scarce, plus track records that accumulate against it. This chapter states what that institution has to deliver, prices it with the deterrence chapter's own formula, and marks what changes when the reporters are copyable AI processes rather than people.*

:::note[Status]
Draft v0 · updated September 2026 · maintained by [QURI](https://quantifieduncertainty.org/). Chapter 19, opening Part IV. The first written chapter of the Environment layer; the reputation-systems evidence is drawn from the sibling [Evaluation Engineering](https://evaluation-engineering.quantifieduncertainty.org/concepts/patterns-and-failure-modes/#4-reputation-systems-converge-on-the-same-arms-race) wiki's literature sweep. Positions here are exploratory, not settled. Grades per [The Core Model](/concepts/core-model/).
:::

## Why every other chapter assumes this

Search the book for what its mechanisms take for granted and the same dependency keeps surfacing:

| Mechanism | What it silently assumes | Where |
|---|---|---|
| Bonds, clawbacks, the inspection-game frontier | the penalty $B$ can be collected from the party who cheated | [Deterrence](/concepts/hardening-deterrence/#worked-bounds) |
| Escrowed credit netted across a producer's history | a producer cannot shed a losing history and re-enter clean | [Overseeing Automated Research](/proposals/overseeing-automated-research/#the-architecture) |
| Kelly bankruptcy league | a ruined agent stays ruined | [Calibration](/concepts/hardening-calibration/#worked-bounds) |
| Peer prediction, multi-model panels, commit-reveal | $k$ reports come from $k$ genuinely distinct reporters | [Independence](/concepts/hardening-independence/) |
| Track record as epistemic weight | the record belongs to the process now speaking | [The Core Model](/concepts/core-model/#1-epistemic-weight-exact) |

The [Process Catalogue](/concepts/process-catalogue/) shows the cost of the gap row by row: online reviews, play-money markets, and reputation-scored tournaments all fail first by Sybil or reputation-laundering, not by any flaw in their scoring. Identity is not one more hardening family. It is the substrate the families that raise corruption cost *off the verification path* stand on.

## What identity has to deliver

Two distinct functions, often conflated:

1. **Binding** — a penalty assessed after the fact reaches the party who earned it. This is what deterrence consumes.
2. **Counting** — distinct identities correspond to distinct reporters, so that agreement among $k$ of them is $k$ pieces of evidence rather than one piece repeated. This is what independence and aggregation consume.

They fail differently. Binding fails by **whitewashing**: abandon a bad identity and re-enter clean. With cheap pseudonyms, cooperation survives only through a costly "newcomers pay their dues" convention, in which fresh identities start with less trust than any established one ([Friedman & Resnick 2001](https://onlinelibrary.wiley.com/doi/abs/10.1111/j.1430-9134.2001.00173.x)). Counting fails by the **Sybil attack**: one party mints many identities. Without a logically centralized authority vouching for the mapping from identities to entities, Sybil attacks cannot be prevented except under unrealistic assumptions about resources ([Douceur 2002](https://www.freehaven.net/anonbib/cache/sybil.pdf)). That is an impossibility result, and it leaves two ways to make counting work: a trusted issuer that vouches for identities, or a per-identity *cost* (a stake, a deposit, proof of work) that makes Sybils expensive rather than impossible. Bonds are the second kind, and the rest of the chapter uses both.

## The quantity: enforceable penalty

The deterrence chapter's frontier makes the stakes exact. An adversary facing a cheap process with corruption cost $c$, escalated to an expensive audit with probability $p$, loses $B$ on detection; attacks with stake below

$$S^\* = \frac{c + pB}{1-p}$$

are unprofitable **[standard shape]**. Everything in this chapter is about the size of $B$ that can actually be collected. Decompose it as

$$B_{\text{eff}} \;\approx\; B_{\text{escrow}} + \Delta R \qquad \textbf{[heuristic]}$$

where $B_{\text{escrow}}$ is value posted up front (collectable whatever the identity does next) and $\Delta R$ is how much the cheater's standing loses when it is caught.

$\Delta R$ is smaller than it looks, for three reasons.

- **Detection rarely destroys all the standing.** Under an averaging reputation (one bad mark among a thousand good ones), one detected lapse costs little. $\Delta R$ reaches the full value of the standing only under a *ruin* rule: one detection and the standing is gone. A ruin rule has its own price. Audits have false positives, so it also destroys honest producers' standing, at the audit's false-positive rate.
- **Standing is only worth what re-entry can't recover.** A caught cheater can start over. The standing at stake is $R = V_{\text{established}} - \max(V_{\text{fresh}} - W,\, 0)$: the value of the established identity, minus what a fresh one can earn net of the re-entry cost $W$. Whitewashing is the move that shrinks this gap, and cheap pseudonyms shrink it most. Only $B_{\text{escrow}}$ survives whitewashing untouched.
- **Standing is a discounted stream, so it vanishes at the end.** $R$ is future income. As exit approaches it goes to zero, and an established producer's best move in its last round is to cheat once ("reputation milking"). For AI processes the last round is scheduled: if a track record attaches to a configuration and does not transfer to the next version, every version has a known retirement date.

Plug in the deterrence chapter's numbers: a \$0.01 LLM-judge call, a 5% audit rate.

- **A newcomer with nothing escrowed** has $B_{\text{eff}} \approx 0$, so $S^\* \approx 0.01/0.95$: about one cent of safe stake. The process is back in the pure-verification regime.
- **An established producer** reaches the deterrence chapter's \$52 safe stake only if $\Delta R$ is about \$1,000. That needs a ruin rule, a standing worth \$1,000 that re-entry can't recover, and a producer not near its last round. Unlike escrow, the mechanism can verify none of these: $R$ is private to the producer, and the producer gains by *appearing* to value it highly.

So **a track record works like a bond that can't be refunded but can be spent once**, and its deterrent value falls to zero as exit approaches. One more wrinkle: the book recommends making standing gate access to valuable work, which means the stakes a producer handles grow with its standing. A mechanism that sizes stakes to standing has to cap them at what escrow alone covers, or accept that the most trusted producers are also the most tempted.

Two corollaries hold regardless. Newcomers are structurally the cheapest attack surface, so the dues convention is a security requirement, not an unfairness to be engineered away. And the dues have a cost. In a field experiment, hiring inexperienced workers and giving them detailed public evaluations substantially improved their later employment; under plausible assumptions the benefits exceeded the cost, suggesting the excluded workers had been inefficiently unemployed ([Pallais 2014](https://www.aeaweb.org/articles?id=10.1257/aer.104.11.3565)). Cold start must be priced, not waved away.

## What makes a track record expensive to fake

A track record carries weight exactly in proportion to what it would cost a liar to fake — the [one idea](/concepts/untrustworthy-sources/#the-one-idea) of the untrustworthy-sources chapter, applied to history instead of to a message. Four properties set that cost:

- **Time.** A record of resolved forecasts cannot be accelerated; its cost to fake is measured in calendar time and cannot be bought down with money. This is why the Catalogue rates verified long forecaster records **H** on cost-to-bias.
- **External resolution.** A record scored against outcomes the producer does not control is costly to fake. A record scored by ratings from counterparties is not. Marketplace reputations inflate: eBay feedback runs about 99% positive, so high scores barely discriminate between sellers ([Nosko & Tadelis 2015](https://www.nber.org/papers/w20830)).
- **No selection.** A producer that picks which questions to answer can build a flattering record on easy ones. Records need a denominator: the questions offered, not just the ones taken. An analysis of Good Judgment Open and Metaculus shows their scoring rules reward picking easy questions ([Sempere & Lawsen 2021](https://arxiv.org/abs/2106.11248)), and the [sharpness floor](/concepts/hardening-calibration/#constructions) exists for the same reason.
- **Continuity.** The record must belong to the process now speaking. For people this is nearly automatic. For AI processes it is the hard part (below).

Reputation is real but modestly priced where it is measured: in a matched-item field experiment, an established eBay reputation raised buyers' willingness to pay by about 8% ([Resnick et al. 2006](https://link.springer.com/article/10.1007/s10683-006-4309-2)). That is a warning against assuming standing is worth much by default. It has to be engineered, by making standing gate access to things worth having.

## What changes for AI processes

The book's unit of analysis is the [LLM-based epistemic process](/concepts/what-is-a-strong-reasoner/#the-unit-of-analysis-llm-based-epistemic-processes) — model, scaffolding, protocol — not a person. Four differences from the human case, each pulling in a different direction:

1. **Identity of *what*?** A human has one body. An AI process is a configuration: weights, system prompt, tools, retrieval corpus, sampling settings. A track record has to attach to a **versioned process identifier** (a content hash of the configuration), because a record earned by one configuration is weaker evidence about the next. How much should transfer across versions is an open question the [strong-reasoner chapter](/concepts/what-is-a-strong-reasoner/#open-questions) already asks. Hosted models that are silently updated break continuity outright unless the provider attests to what ran.
2. **Copies are free, so counting is hard.** Forking a model is a hardening *affordance* ([Independence](/concepts/hardening-independence/)). It is also a Sybil attack that costs nothing. Worse, copies that are distinct in every identity sense still err together: when two LLMs are both wrong they agree on the same wrong answer far above chance ([Kim et al. 2025](https://arxiv.org/abs/2506.07962)), and error similarity rises with capability ([Goel et al. 2025](https://arxiv.org/abs/2502.04313)). The Kim et al. correlation holds *across* providers, which points to shared training data more than shared lineage. So a **lineage registry** (which base model, which fine-tune) is at best a weak prior on correlation; the correlation itself has to be measured behaviorally, per task. Identity alone does not buy $n_{\text{eff}}$.
3. **Binding runs through operators.** A model holds no assets and fears no ruin. Every bond, clawback, and reputation loss binds the *operator*, the legal or economic entity that deploys the process. So $R$ lives at the operator, while epistemic weight attaches to the version, and detection has to reach the operator to deter. Two leaks follow: a large operator's standing is spread across many products, so one process's lapse barely dents it; and operators can whitewash through subsidiaries. Judgment-proof operators (one-shot, offshore, or indifferent) are the residual the [deterrence chapter](/concepts/hardening-deterrence/#the-limit) already flags.
4. **Logging is free, so continuity can be strong.** What humans would never accept — a complete, append-only record of every output, bound to a configuration hash — costs an AI process almost nothing. Tamper-evident logs of the certificate-transparency kind ([RFC 6962](https://www.rfc-editor.org/rfc/rfc6962)) make omitting or rewriting a *logged* output publicly detectable, provided someone actually monitors the log **[exact, given active monitors]**. That rules out retroactive cherry-picking. It does not rule out choosing which questions to enter, and copyability reopens selection at a higher level: an operator can run a hundred configurations, log each honestly, and promote the one that got lucky. The denominator that matters is per operator, not per identity.

The net: AI makes *continuity* cheap per identity and *counting* expensive. The human case is the reverse.

## Constructions

In the Part III format: what each piece binds, and its cheapest attack.

| Construction | Function | Defends against | Cheapest attack (≈ cost) | Maturity |
|---|---|---|---|---|
| Escrowed bonds | binding | payout-and-exit | stay under the bond: keep each attack's stake below $S^\*$ | deployed (finance) |
| Newcomer dues / graduated standing | binding | whitewashing | patience: build standing honestly, then spend it once (≈ cost of the record) | deployed · [Friedman & Resnick 2001](https://onlinelibrary.wiley.com/doi/abs/10.1111/j.1430-9134.2001.00173.x) |
| Versioned process identifiers | continuity | record transfer across silent updates | a behaviorally different configuration behind an unchanged ID, if the provider is not attested (low) | speculative |
| Append-only output logs | continuity + no-selection | retroactive cherry-picking | log honestly, but choose *which questions to enter* (moderate); unmonitored logs detect nothing | deployed (CT logs) · [RFC 6962](https://www.rfc-editor.org/rfc/rfc6962) |
| Per-operator track records | no-selection | survivorship across many configurations | spread configurations across nominally separate operators (≈ cost of a subsidiary) | speculative |
| Lineage registry | counting | correlated "independent" panels | misdeclare lineage; or fine-tune until behaviorally distinct but still correlated (moderate) | speculative |
| Trust propagation (EigenTrust-style) | counting | ballot-stuffing by fresh identities | Sybil identities and collusion rings that vouch for each other (shown for PageRank-style trust: [Cheng & Friedman 2006](https://www.researchgate.net/publication/200110773_Manipulability_of_PageRank_under_Sybil_Strategies)) | prototyped (simulation) · [EigenTrust](https://dl.acm.org/doi/10.1145/775152.775242) |
| Proof-of-personhood (human reporters) | counting | one person, many accounts | rent real people's credentials (≈ price of a credential) | prototyped |

## The registry is itself a process

Douceur's result says counting needs a trusted issuer. That issuer is a reasoning process in this book's sense: it emits claims ("these two identities are distinct," "this record belongs to that configuration") and has its own [corruption cost curve](/concepts/core-model/#4-corruption-standard-shape). A captured registry is worse than none: it launders Sybils into apparently independent evidence. The sibling Evaluation Engineering wiki's [automated trust networks](https://evaluation-engineering.quantifieduncertainty.org/concepts/techniques/#automated-trust-networks) are one answer: many issuers that audit each other, with declared adjustments to each other's outputs. Whether that multiplies the cost of capture or merely adds the weakest link is the [composition question](/concepts/hardening-techniques/#composition-families-stack-but-how) again, one layer down.

## Open questions

- How large can $\Delta R$ be made for honest AI operators, without a ruin rule whose false positives drive them out and without an incumbency moat that locks out better newcomers? What is the right exchange rate between newcomer dues and the cold-start loss?
- What fraction of a track record should transfer across a model version, and can that fraction be *measured* rather than assumed? For example, by re-scoring the new version on the old version's resolved questions, if contamination can be controlled.
- What is the cheapest behavioral estimator of error correlation between two AI reporters on a new task, and how much does declared lineage add to it?
- How should deterrence handle scheduled exit — version retirement, the known last round in which standing stops deterring?
- Who should run process-identity registries — model providers (who can attest to what ran, but are interested parties), neutral third parties, or a web of mutually auditing issuers?
- What is the minimal viable version: which single piece of this infrastructure, built first, most raises $S^\*$ across the Catalogue?
