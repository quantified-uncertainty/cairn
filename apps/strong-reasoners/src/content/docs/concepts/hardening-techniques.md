---
title: Hardening Techniques
description: The constructive layer — eliminate confident error, and turn six families of lever (calibration, invariance, verifiability asymmetry, incentive-compatibility, deterrence, independence) using oversight affordances no human consultant would tolerate.
sidebar:
  order: 5
---

*The constructive half of the field: given the [Core Model's](/concepts/core-model/) quantities, how do you engineer good values of them? This chapter is the spine — one objective (eliminate confident error) and six families of mechanism that achieve it — and points to [The Construction Catalogue](/concepts/construction-catalogue/) for the ~50 specific constructions, their bounds, and the threat models they buy. The recurring multiplier is that a machine reasoner can be subjected to each mechanism at an intensity no human process allows.*

:::note[Status]
Draft v0 · updated June 2026 · maintained by [QURI](https://quantifieduncertainty.org/). Chapter 11 of the book. The taxonomy here is a working organizing scheme, not a settled one; the families overlap at the edges and several constructions pull more than one lever. Grades follow [The Core Model's](/concepts/core-model/) convention — **[exact]**, **[standard shape]**, **[heuristic]** — plus **[speculative]** for moves whose load-bearing assumption is not yet measurable.
:::

## The objective: eliminate confident error

The only epistemic state that can hurt a judge *unboundedly* is being confidently wrong. A calibrated process — whose stated confidence $c$ means it is wrong a $(1-c)$ fraction of the time — converts an open-ended tail risk into a bounded, priceable one: the judge sizes its commitment to $c$, and a deceiver, being *confidently wrong by construction*, shows up as a tail-calibration failure. So the safety-relevant target is not accuracy but **tail calibration**, $P(\text{false}\mid \text{asserts} \ge c)$ for $c$ near 1 — and the agenda becomes "make the process never confidently wrong" (achievable: it can always hedge or abstain) rather than "make it accurate" (often impossible). The literature is specific and recent: a forecast can be calibrated on average yet badly miscalibrated in its tail ([Allen et al. 2024](https://arxiv.org/abs/2407.03167)), the dangerous regime, and tail reliability can be trained for ([Wessel et al. 2025](https://arxiv.org/abs/2506.13687)). **[heuristic]**

Every mechanism below is, ultimately, a way to make confident error rare or expensive.

## Two axes, six families

A hardening mechanism moves a process on one of the [field's two axes](/concepts/process-catalogue/) — it makes validated information cheaper, or it makes the output costlier to corrupt. The six families sort onto those axes, and the sort explains the Catalogue's empty quadrant:

| Family | What it does | Primarily buys |
|---|---|---|
| **Calibration** | make stated confidence match reality | cheaper trustworthy bits (the output self-rates) |
| **Verifiability asymmetry** | make checking cheaper than producing | cheaper validated bits |
| **Independence / decorrelation** | manufacture genuinely independent signals | cheaper validated bits + higher corruption cost |
| **Invariance / low sensitivity** | output insensitive to controllable inputs | higher corruption cost |
| **Incentive-compatibility** | make honesty the best strategy | higher corruption cost |
| **Deterrence** | off-equilibrium penalties | higher corruption cost *at near-zero information cost* |

The non-obvious structural point: most corruption-resistance is bought with verification, which costs real information-extraction work *every time the process runs* — so it raises both axes together and never reaches the cheap-and-incorruptible corner. **Deterrence is the exception** — bonds, clawbacks, tamper-evidence cost almost nothing on the honest path — which is why the empty quadrant is reachable only through it, and why identity/track-record infrastructure (which sets the maximum enforceable penalty) is the field's most leveraged missing institution.

## The six families

**Calibration** — make the output's confidence claims true, so over-commitment is impossible. Anchor: act only above threshold $c$ and the confident-wrong rate is $\le (1-c)+\varepsilon$; pair with a sharpness floor (the reliability–resolution decomposition of [Murphy 1973](https://doi.org/10.1175/1520-0450(1973)012%3C0595:ANVPOT%3E2.0.CO;2); [Gneiting et al. 2007](https://doi.org/10.1111/j.1467-9868.2007.00587.x)) so calibration isn't bought by retreating to base rates, and note that [U-calibration](https://arxiv.org/abs/2307.00168) makes a calibrated process unexploitable by *any* downstream bettor. Constructions: tail-calibration certification, priced abstention, the Kelly bankruptcy league, the sharpness floor.

**Verifiability asymmetry** — make checking cheaper than producing, then spot-check; this is the engine under SAT, proof-carrying code, and the PCP theorem. Anchor: forcing a structured decomposition and checking a fraction $f$ of its nodes catches any distortion spread across $g(\Delta)$ nodes with probability $1-(1-f)^{g(\Delta)}$; the Quine–Duhem version makes a defended false claim's prior decay like $p^{k_R}$. Constructions: a PCP-analogue for estimates, forced precision, entailment-web checks, retrodiction.

**Independence / decorrelation** — manufacture genuinely independent signals so corruption must defeat all of them and herding cannot collapse them. Anchor: aggregate error scales $\sigma/\sqrt{n_{\text{eff}}}$, and decorrelation restores $n_{\text{eff}}$ toward $n$; the standing caveat is that shared training pipelines correlate failures, so independence must be *measured*, never assumed. Constructions: n-version reasoning, checkpoint-forking, commit-reveal forecasting, decorrelated interrogation probes.

**Invariance / low sensitivity** — make the output a function of truth-relevant variables and near-invariant to whatever an adversary controls; the corruption gain is the Lipschitz constant $\lVert\partial(\text{output})/\partial(\text{adversary levers})\rVert$, and the **breakdown point** is its off-the-shelf metric ([Huber 1964](https://doi.org/10.1214/aoms/1177703732); Donoho & Huber 1983). Anchor: no linear aggregator tolerates even one adversarial input ([Krum, Blanchard et al. 2017](https://arxiv.org/abs/1703.02757)) while the median tolerates 50%, and differential privacy bounds per-contributor influence to $\varepsilon$ ([Dwork et al. 2006](https://doi.org/10.1007/11681878_14)). Constructions: breakdown-point ratings, influence audits, DP ceilings, randomize-everything.

**Incentive-compatibility** — make honest reporting the agent's best strategy through scoring rules and markets, so distortion costs the agent. Anchor: proper scoring rules and market scoring (LMSR); peer-prediction mechanisms with *informed-truthful* equilibria ([Shnayder et al. 2016](https://arxiv.org/abs/1603.03151)); decision scoring rules when forecasts feed actions ([Singh et al. 2025](https://arxiv.org/abs/2503.16395)). Constructions: mandatory two-sided quotes, decision-contingent bets, escrow-and-clawback credit, peer-relative bets.

**Deterrence** — off-equilibrium penalties that bite only the adversary. Anchor: the inspection-game frontier $S^\* = (c+pB)/(1-p)$ for a cheap process wrapped in randomized escalation (probability $p$) with enforceable bond $B$ — robustness scales with the *penalty*, not verification spend — and detection can be driven toward certainty cheaply via tamper-evident logging ([RFC 6962](https://www.rfc-editor.org/rfc/rfc6962)), the classical [detection × penalty](https://doi.org/10.1086/259394) logic. Constructions: randomized audit lottery, Merkle-logged traces, provenance bonds, reputation-with-ruin.

## The cross-cutting multiplier: machine-oversight affordances

The [Catalogue](/concepts/process-catalogue/) is a list of processes evolved for *humans* — who have rights, privacy, fatigue, and exist as single un-forkable instances. None of those bind for an AI reasoner, and the slack is the field's largest untapped resource. The affordances are not a seventh family; each one lets you turn one of the six cranks harder than any human process allows:

| Affordance | Turns up which family | Example construction |
|---|---|---|
| Reset / re-run | Independence | mind-wiped re-derivation |
| Fork mid-reasoning | Independence | checkpoint-fork cross-examination |
| Decorrelated resampling | Independence | confession-as-invariant interrogation |
| Sandboxed information diet | Invariance | reject conclusions resting on un-logged retrievals |
| Narrow, fixed action space | Invariance | lower the Lipschitz constant by removing levers |
| Full logging / no privacy | Deterrence | tamper-evident reasoning trace, free |
| Forced bets / bonds | Deterrence + Incentives | set the enforceable penalty $B$ |
| Read internal state | (all, weakly) | activation-honesty cross-check — **[speculative]** |

The "read their minds" affordance is the highest-leverage and the **least reliable**: truth appears linearly represented in activations ([Marks & Tegmark 2024](https://arxiv.org/abs/2310.06824); [Goldowsky-Dill et al. 2025](https://arxiv.org/abs/2502.03407)), but chain-of-thought is often unfaithful ([Chen et al. 2025](https://arxiv.org/abs/2505.05410)), deception survives safety training ([Hubinger et al. 2024](https://arxiv.org/abs/2401.05566)), and training against an honesty probe can induce evasion ([Cundy et al. 2025](https://arxiv.org/abs/2505.13787)). Use it as corroboration, never as the load-bearing check.

## Where the constructions are

This chapter is deliberately the map, not the territory. The ~50 specific constructions — each with its bound or estimate, the threat model it buys, its maturity, and a citation — live in **[The Construction Catalogue](/concepts/construction-catalogue/)**, with full derivations for the strongest ten. The catalogue is the analogue of the [Process Catalogue](/concepts/process-catalogue/): where that one rates the processes the field inherits, this one collects the moves for building better ones.

## Open questions

- Are six families the right cut, or do calibration and verifiability collapse into one (both make the output self-checkable), and does independence belong under invariance?
- Which families compose multiplicatively and which merely add the weakest link? The inspection-game frontier predicts a value for randomized escalation; composition across families is unmeasured.
- How much enforceable penalty $B$ is reachable without identity infrastructure, and how much does that infrastructure raise $S^\*$ across the Catalogue's rows?
- Which affordances degrade capability when imposed (narrow action spaces, capability throttling), and what is the robustness-for-capability exchange rate?
