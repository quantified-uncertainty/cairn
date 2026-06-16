---
title: "Hardening: Overview"
description: The constructive layer — eliminate confident error, and turn six families of lever (calibration, verifiability asymmetry, independence, invariance, incentive-compatibility, deterrence) using oversight affordances no human consultant would tolerate.
sidebar:
  order: 5
---

*The opening of Part III: given the [Core Model's](/concepts/core-model/) quantities, how do you engineer good values of them? One objective — eliminate confident error — and six families of mechanism that achieve it, each developed on its own page. This overview states the objective, maps the families onto the field's two axes, gives the threat-coverage picture and the composition algebra that span families, and notes the machine affordances that let every mechanism run at superhuman intensity.*

:::note[Status]
Draft v0 · updated June 2026 · maintained by [QURI](https://quantifieduncertainty.org/). Chapter 11, opening Part III. The six-family taxonomy is a working organizing scheme, not a settled one; families overlap and several constructions pull more than one lever. Grades follow [The Core Model](/concepts/core-model/): **[exact]**, **[standard shape]**, **[heuristic]**, plus **[speculative]**.
:::

## The objective: eliminate confident error

The only epistemic state that can hurt a judge *unboundedly* is being confidently wrong. A calibrated process — whose stated confidence $c$ means it is wrong a $(1-c)$ fraction of the time — converts an open-ended tail risk into a bounded, priceable one: the judge sizes its commitment to $c$, and a deceiver, being *confidently wrong by construction*, shows up as a tail-calibration failure. So the safety-relevant target is not accuracy but **tail calibration**, $P(\text{false}\mid \text{asserts} \ge c)$ for $c$ near 1 — and the agenda becomes "make the process never confidently wrong" (achievable: it can always hedge or abstain) rather than "make it accurate" (often impossible) ([Allen et al. 2024](https://arxiv.org/abs/2407.03167); trained for in [Wessel et al. 2025](https://arxiv.org/abs/2506.13687)). **[heuristic]** Every family below is, ultimately, a way to make confident error rare or expensive.

## Two axes, six families

A hardening mechanism moves a process on one of the [field's two axes](/concepts/process-catalogue/) — it makes validated information cheaper, or it makes the output costlier to corrupt. The six families sort onto those axes, and the sort explains the Catalogue's empty quadrant:

| Family | What it does | Primarily buys |
|---|---|---|
| [**Calibration**](/concepts/hardening-calibration/) | make stated confidence match reality | cheaper trustworthy bits (the output self-rates) |
| [**Verifiability asymmetry**](/concepts/hardening-verifiability/) | make checking cheaper than producing | cheaper validated bits |
| [**Independence / decorrelation**](/concepts/hardening-independence/) | manufacture genuinely independent signals | cheaper validated bits + higher corruption cost |
| [**Invariance / low sensitivity**](/concepts/hardening-invariance/) | output insensitive to controllable inputs | higher corruption cost |
| [**Incentive-compatibility**](/concepts/hardening-incentives/) | make honesty the best strategy | higher corruption cost |
| [**Deterrence**](/concepts/hardening-deterrence/) | off-equilibrium penalties | higher corruption cost *at near-zero information cost* |

The non-obvious structural point: most corruption-resistance is bought with verification, which costs real information-extraction work *every time the process runs* — so it raises both axes together and never reaches the cheap-and-incorruptible corner. **Deterrence is the exception** — bonds, clawbacks, tamper-evidence cost almost nothing on the honest path — which is why the empty quadrant is reachable only through it, and why identity/track-record infrastructure (which sets the maximum enforceable penalty) is the field's most leveraged missing institution. Each family is developed on its own page, with its mechanism, its limit, its constructions, and worked bounds.

## What each family defends — and the gaps

Sorting the families by the *threats* they close shows both the coverage and, more usefully, where the field has none. (Primary defenders listed; many threats are addressed weakly by several families.)

| Threat | Primary defending families | Where coverage is thin |
|---|---|---|
| Sybil / identity forgery | Deterrence, Invariance | needs identity infrastructure to bind bonds |
| Prompt-injection / framing | Invariance, Calibration | — |
| Persuasion / sycophancy | Incentive-compatibility, Verifiability, Calibration | claims that never resolve |
| Collusion | Independence, Incentive-compatibility | shared-training correlation |
| Sandbagging / capability-hiding | Independence, affordances (read-state) | interpretability is unreliable |
| Resolution-criteria gaming | Deterrence, Incentive-compatibility | who defines the criteria |
| Selection / optional-stopping | Verifiability, Deterrence | — |
| **Correlated error** | Independence (weakly) | **largely undefended — the field's biggest hole** |
| Goodhart-after-publication | Deterrence, externally-grounded families | style-mimicry of high-tier forms |

The standout is **correlated error**: every aggregation-, ensemble-, and panel-based defense assumes an independence that shared training pipelines erode, and no family closes it cleanly. That empty row is a research priority, not a footnote.

## Composition: families stack, but how?

The family pages treat constructions as atoms; real systems are stacks, and the catalogue's value is conditional on how stacking behaves. Model a hardened stack as an attack graph: its corruption cost is the **min-cut** over attack paths. Series composition without randomization inherits the *cheapest* stage (the weakest link); randomized escalation with probability $p$ to an expensive stage adds roughly $p\cdot C_{\text{expensive}}$ to every path that must survive escalation — the [inspection-game frontier](/concepts/hardening-deterrence/) made compositional. Whether real stacks multiply corruption costs or merely add the weakest link is the central unmeasured question, the same one the [Process Catalogue](/concepts/process-catalogue/) flags.

## The cross-cutting multiplier: machine-oversight affordances

The [Process Catalogue](/concepts/process-catalogue/) lists processes evolved for *humans* — who have rights, privacy, fatigue, and exist as single un-forkable instances. None bind for an AI reasoner, and the slack is the field's largest untapped resource. The affordances are not a seventh family; each lets you turn one of the six cranks harder than any human process allows:

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

## The family pages

- [**Calibration**](/concepts/hardening-calibration/) — make confidence claims true; tail calibration, abstention, the Kelly filter.
- [**Verifiability asymmetry**](/concepts/hardening-verifiability/) — check cheaper than produce; the PCP-analogue for estimates, forced precision.
- [**Independence & decorrelation**](/concepts/hardening-independence/) — manufacture independent signals; commit-reveal, forking, decorrelated interrogation.
- [**Invariance & low sensitivity**](/concepts/hardening-invariance/) — breakdown point, Byzantine-robust aggregation, randomize-everything.
- [**Incentive-compatibility**](/concepts/hardening-incentives/) — scoring rules, bets, the persuasion-budget bound.
- [**Deterrence**](/concepts/hardening-deterrence/) — the inspection-game frontier, tamper-evident logs, provenance bonds.

The capstone — one fully-worked hardened stack on a real task — is planned as the closing chapter of this Part.

## Open questions

- Are six families the right cut, or do calibration and verifiability collapse into one (both make the output self-checkable), and does independence belong under invariance?
- Which families compose multiplicatively and which merely add the weakest link?
- Is there a single inequality the whole Part is special cases of — corruption cost as a function of sensitivity, enforceable penalty, and effective independence?
- What closes the correlated-error row, the one threat with no clean defender?
