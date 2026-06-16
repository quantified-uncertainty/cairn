---
title: The Construction Catalogue
description: ~50 named hardening constructions for reasoning processes — each with its bound or estimate, the threat model it buys, its maturity, and a source — grouped by the six lever families, with full derivations for the strongest ten.
sidebar:
  order: 6
---

*The companion to [Hardening Techniques](/concepts/hardening-techniques/): a working catalogue of specific constructions for building robust reasoning processes. Where the [Process Catalogue](/concepts/process-catalogue/) rates the processes the field inherits, this one collects the moves for engineering better ones — each tagged with the lever family it pulls, a bound or estimate, the threat model it buys, and how mature it is. The strongest ten get full derivations below the tables.*

:::note[Status]
Draft v0 · updated June 2026 · maintained by [QURI](https://quantifieduncertainty.org/). A companion to Chapter 11. Most entries are first-pass: the bounds are either imported from an adjacent rigorous field or sketched here to be argued with and replaced by measurement. Many constructions pull more than one lever; each is filed under its primary one.
:::

## How to read this

Each construction is rated on:

- **Bound / estimate** — the quantitative handle, graded **[exact]** (correct by construction), **[standard shape]** (precedent in an adjacent field), or **[heuristic]** (a sketch).
- **Threat model it buys** — what corruption or error the construction actually defends against. A construction is only as good as the threat it closes.
- **Maturity** — *deployed* (running in real systems), *prototyped* (demonstrated in experiments), *theoretical* (has a proof but not built for this use), or *speculative* (plausible, no bound or evidence yet).

The six families are defined in [Hardening Techniques](/concepts/hardening-techniques/). The recurring multiplier — the [machine-oversight affordances](/concepts/hardening-techniques/#the-cross-cutting-multiplier-machine-oversight-affordances) that let each construction run at superhuman intensity — is noted where it is load-bearing.

## Family 1 — Calibration

*Make the output's confidence claims true, so the only dangerous state (confident-wrong) is rare and priced.*

| Construction | Bound / estimate | Threat model it buys | Maturity | Source |
|---|---|---|---|---|
| Tail-calibration certification | confident-wrong rate $\le (1-c)+\varepsilon$ above threshold $c$ **[heuristic]** | over-commitment on confident claims; deception (a tail miscalibration) | prototyped | [Allen 2024](https://arxiv.org/abs/2407.03167) |
| Priced abstention | risk-coverage curve; abstain when expected loss > cost **[standard shape]** | hallucinated confidence on out-of-knowledge queries | prototyped | [Geifman & El-Yaniv 2017](https://arxiv.org/abs/1705.08500); [Zhang 2024](https://arxiv.org/abs/2311.09677) |
| Kelly bankruptcy league | overconfident agents removed at rate $e^{-n D_{KL}(\text{true}\Vert\text{stated})}$ **[exact]** | systematic overconfidence in a population | theoretical | [Kleinberg 2023](https://arxiv.org/abs/2307.00168) |
| Sharpness floor (anti-laundering) | Brier $=$ reliability $-$ resolution $+$ uncertainty **[exact]** | calibration faked by retreat to base rates | deployed (forecasting) | [Murphy 1973](https://doi.org/10.1175/1520-0450(1973)012%3C0595:ANVPOT%3E2.0.CO;2) |
| Self-insurance pricing | premium demanded $=$ stated error probability **[heuristic]** | unstated overconfidence | speculative | — |
| Reverse-Brier bounty | score $=$ adversary's failure-to-find-confident-error rate **[heuristic]** | confident errors an honest test misses | speculative | — |
| Cross-horizon hazard consistency | deviation from the martingale-implied decay path **[standard shape]** | inconsistent confidence trajectories over time | prototyped | [Augenblick & Rabin 2021](https://academic.oup.com/qje/article-abstract/136/2/933/6127317) |

## Family 2 — Verifiability asymmetry

*Make checking cheaper than producing, then spot-check.*

| Construction | Bound / estimate | Threat model it buys | Maturity | Source |
|---|---|---|---|---|
| PCP-analogue for estimates | spot-check fraction $f$ → detection $\ge 1-(1-f)^{g(\Delta)}$ **[heuristic]** | fabricated estimate distributed across a decomposition | speculative | [Arora & Safra 1998](https://doi.org/10.1145/273865.273901) |
| Forced precision (Quine–Duhem) | defended-falsehood prior decays $\sim p^{k_R}$ **[heuristic]** | bold-but-vague claims that dissolve under resolution | speculative | — |
| Bayes-net / decomposition disclosure | check $O(1)$ nodes of a stated causal graph **[heuristic]** | hidden load-bearing assumptions | prototyped | [Necula 1997](https://doi.org/10.1145/263699.263712) |
| Entailment-web check | $N$ related questions must satisfy mutual entailments **[standard shape]** | a confident wrong answer that can't stay coherent | prototyped | (consistency line) |
| Held-out retrodiction | scored by held-out log-loss, not self-report **[standard shape]** | rhetorical "comprehensive worldview" with no predictive content | prototyped | [Mallen 2023](https://arxiv.org/abs/2312.01037) |
| Retrodiction banks (decay-accounted) | each item priced by leak probability per release **[heuristic]** | contamination eroding a held-out test set | prototyped | — |
| Throttle-vs-unlimited divergence | gap between tiny- and large-compute answers **[heuristic]** | answers driven by heuristics/persuasion, not depth | speculative | — |

## Family 3 — Independence / decorrelation

*Manufacture genuinely independent signals so corruption must beat all of them.*

| Construction | Bound / estimate | Threat model it buys | Maturity | Source |
|---|---|---|---|---|
| Commit-reveal forecasting | restores $n_{\text{eff}}\!\to\! n$; error $\sigma/\sqrt{n_{\text{eff}}}$ **[standard shape]** | herding; deadline info-hoarding; move-the-median attacks | deployed (crypto) | [Naor 1991](https://doi.org/10.1007/BF00196774) |
| Checkpoint-fork cross-examination | defect appears in all $k$ branches; artifact doesn't **[heuristic]** | coerced/role-played interrogation artifacts | speculative | (machine affordance) |
| Mind-wiped re-derivation | reproducible conclusions vs. motivated drift **[heuristic]** | motivated reasoning toward a pre-chosen answer | speculative | (machine affordance) |
| n-version reasoning | corruption must beat $k$ stacks; discount by measured correlation **[standard shape]** | single-model failure modes; prompt-transfer attacks | prototyped | [Avizienis 1985](https://doi.org/10.1109/TSE.1985.231893) |
| Decorrelated-probe interrogation | SPRT: error $\to 0$ iff bad-rate $b>$ fine-rate $f$ **[standard shape]** | both false confessions and missed defects | prototyped | [Pacchiardi 2024](https://arxiv.org/abs/2309.15840) |
| Self-transcript confrontation | cross-context incoherence surfaced **[heuristic]** | incoherence a model can't see across windows | prototyped | — |
| Steelman-then-break | second model rates steelman quality **[heuristic]** | sandbagged self-criticism | speculative | — |
| Confidence-under-pressure | legitimate confidence is reframing-invariant **[heuristic]** | compliance/coercion mistaken for knowledge | speculative | — |
| Collusion-bounded peer prediction | truthful iff inter-agent non-truth MI < threshold **[standard shape]** | colluding model copies | prototyped | [Shnayder 2016](https://arxiv.org/abs/1603.03151); [Kong & Schoenebeck 2016](https://arxiv.org/abs/1605.01021) |

## Family 4 — Invariance / low sensitivity

*Make the output insensitive to anything the agent or adversary controls.*

| Construction | Bound / estimate | Threat model it buys | Maturity | Source |
|---|---|---|---|---|
| Breakdown-point ratings | rate by corrupted-fraction survived (mean 0%, median 50%) **[exact]** | a minority of corrupted inputs swinging the output | theoretical | [Donoho & Huber 1983](https://doi.org/10.1214/aoms/1177703732) |
| Byzantine-robust aggregation | no linear rule tolerates 1 adversary; use Krum/trimmed mean **[exact]** | adversarial inputs to an aggregator | prototyped | [Blanchard 2017](https://arxiv.org/abs/1703.02757); [Yin 2018](https://arxiv.org/abs/1803.01498) |
| Influence-function audit | cap any source whose removal moves the verdict **[standard shape]** | one source dominating the conclusion | prototyped | (Hampel et al. 1986) |
| DP-noise corruption ceiling | $k$ adversarial inputs move output $\le k\varepsilon$ **[exact]** | bounded-count input manipulation | theoretical | [Dwork 2006](https://doi.org/10.1007/11681878_14) |
| Randomize-everything harness | report the invariant; variance = corruption-exposure **[heuristic]** | prompt/format/order/persona manipulation | prototyped | (opinion fuzzing) |
| Gauge-invariance tests | score violations of should-be-invariant transforms **[heuristic]** | hidden dependence on arbitrary framing | speculative | — |
| Identity-masking gap | masked-vs-revealed affiliation swing **[heuristic]** | source-identity / funding bias | prototyped | [Lundh 2017](https://doi.org/10.1002/14651858.MR000033.pub3) |
| Minimal-sufficient-input reduction | commit to the smallest determining input set **[heuristic]** | attacks via provably non-load-bearing inputs | speculative | — |
| Reasoning fuzzer (CI) | monitor for output cliffs under perturbation **[heuristic]** | discontinuities an adversary can sit on | speculative | — |
| Extremizing / recalibration | logit-pool with an extremizing parameter **[standard shape]** | shared-information under-confidence in pools | deployed (forecasting) | [Satopää 2014](https://doi.org/10.1016/j.ijforecast.2013.09.009) |

## Family 5 — Incentive-compatibility

*Make honest reporting the agent's best strategy.*

| Construction | Bound / estimate | Threat model it buys | Maturity | Source |
|---|---|---|---|---|
| Mandatory two-sided quotes | bid-ask spread reveals withheld uncertainty **[standard shape]** | stated confidence the agent won't stand behind | prototyped | (LMSR) |
| Decision-contingent bets | proper scoring randomized over the decision rule **[standard shape]** | persuasion when forecasts feed actions | prototyped | [Singh 2025](https://arxiv.org/abs/2503.16395) |
| Escrow-and-clawback credit | persuasion surplus $\le$ unvalidated weight (see below) **[exact]** | paying out on belief-movement before resolution | prototyped | — |
| Peer-relative bets | truthful equilibrium without ground truth **[standard shape]** | unresolvable-soon claims | prototyped | [Prelec 2004](https://doi.org/10.1126/science.1102081) |
| Long-short research portfolios | producers must short over-stated competitors **[heuristic]** | unincentivized criticism / consensus burial | speculative | — |
| Self-auditing pricing desk | two coherence identities checkable w/o ground truth **[exact]** | a mispriced value-of-information quote | prototyped | (EIA) |

## Family 6 — Deterrence

*Off-equilibrium penalties that cost little on the honest path and a lot to an adversary.*

| Construction | Bound / estimate | Threat model it buys | Maturity | Source |
|---|---|---|---|---|
| Randomized deep-audit lottery | safe stake $S^\*=(c+pB)/(1-p)$ (see below) **[standard shape]** | cheap-process corruption up to stake $S^\*$ | prototyped | (inspection games) |
| Merkle-logged reasoning traces | post-hoc tamper detection w.p. $\approx 1$ **[exact]** | silent after-the-fact tampering | deployed | [RFC 6962](https://www.rfc-editor.org/rfc/rfc6962); [Crosby & Wallach 2009](https://www.usenix.org/legacy/event/sec09/tech/full_papers/crosby.pdf) |
| Provenance-bonded sources | source stake slashed if later shown corrupt **[heuristic]** | citing sources later revealed biased | speculative | (funding effect) |
| Clawback-with-interest | penalty multiplier on false resolutions **[standard shape]** | claims optimized to resolve just past the horizon | prototyped | [Becker 1968](https://doi.org/10.1086/259394) |
| Confidence-scaled bonds | bond $\propto$ stated confidence, forfeited on error | overconfidence as a cheap strategy | speculative | — |
| Reputation bankroll with ruin | identity-bound standing funds high-stakes assertions | sets the enforceable penalty $B$ | speculative | (identity infra) |
| Revision rate-limiting | manipulation requires a slow, visible trail **[heuristic]** | instant reversal as a cheap-attack signature | speculative | — |

## Worked constructions

The ten with the most load-bearing math, derived.

### 1. Randomized escalation with bonds — the inspection-game frontier

Wrap a cheap process (corruption cost $c$) in an audit that escalates to an expensive robust process with probability $p$, and require a participant to post an enforceable bond $B$ forfeited on detection. An adversary corrupts the cheap stage at cost $c$, is caught on escalation (probability $p$), and otherwise wins stake $S$. Expected payoff $(1-p)S - pB - c$ is negative iff

$$S < S^\* = \frac{c + pB}{1-p}. \qquad \textbf{[standard shape]}$$

With $B=0$ (today's bare LLM-judge world) $S^\*=c/(1-p)$, so robustness demands $p\to 1$ — full verification, the trap cheap processes are in. With $B$ large, $S^\*$ grows without bound for *any* $p>0$. **Robustness is bounded by the maximum enforceable penalty, not by verification spend** — the formal reason identity/escrow infrastructure is the most leveraged missing institution.

### 2. A PCP-analogue for estimates

All cheap robustness runs on verification being cheaper than production. For proofs, the field has Lean and the PCP theorem ([Arora & Safra 1998](https://doi.org/10.1145/273865.273901)). For *estimates* there is no analogue — you cannot spot-check a probability. The construction: require a structured decomposition (a Fermi tree, a Squiggle model) as a certificate and spot-check a fraction $f$ of its nodes. If a distortion of size $\Delta$ can be forced to corrupt at least $g(\Delta)$ nodes, detection is $\ge 1-(1-f)^{g(\Delta)}$ **[heuristic]**. The open research question is whether estimation tasks can be *encoded* so any large distortion forces inconsistency in a constant number of checkable nodes — the dual of counterexample-shrinking in [Consistency Evaluations](/proposals/consistency-evals/).

### 3. Tail-calibration certification

The dangerous regime is confident error. Certify $P(\text{false}\mid \text{asserts}\ge c)$ directly: if it is $\le \varepsilon$, then acting only on assertions above $c$ caps the confident-wrong rate at $(1-c)+\varepsilon$ **[heuristic]**. A forecast can be calibrated overall yet miscalibrated in exactly this tail ([Allen et al. 2024](https://arxiv.org/abs/2407.03167)), so the measurement must be tail-specific — which is also where deception lives.

### 4. The Kelly bankruptcy league

Run agents in a continuous market where each bets its stated credences with Kelly (log-optimal) sizing. An agent's bankroll growth rate equals the information it actually has; an overconfident agent's is *negative*, and it is driven out at rate $e^{-n\,D_{KL}(\text{true}\Vert\text{stated})}$ **[exact]**. A betting environment is therefore an exponential overconfidence filter — the mechanism behind "force big bets on forecasts," and the bridge from calibration to [U-calibration](https://arxiv.org/abs/2307.00168) (unexploitability by any bettor). Caveat: betting only grounds resolvable claims on workable horizons.

### 5. The persuasion-budget bound

In the metering proposals, a producer paid on belief-movement before resolution can harvest "surprise now." How much? A coherent forecaster's expected total squared movement on a binary question is bounded by $q_0(1-q_0)\le \tfrac14$ ([Augenblick & Rabin 2021](https://academic.oup.com/qje/article-abstract/136/2/933/6127317)), so the **total unvalidated persuasion surplus across a portfolio is $\le \sum_i w_i\, q_i(1-q_i)\le \tfrac14\sum_i w_i$** **[exact]**. Three consequences: the attack surface is finite and pre-computable; it concentrates in high-weight, high-uncertainty ($q\approx 0.5$) questions, so escrow/clawback budget should be allocated $\propto w_i q_i(1-q_i)$; and any producer inducing movement past budget is provably over-reacting (free detection). This turns [Overseeing Automated Research's](/proposals/overseeing-automated-research/) "persuasion gradient survives in proportion to unvalidated weight" into a number.

### 6. Commit-reveal and the √n recovery

Herding collapses the *effective* number of independent forecasts: copying the visible median can drive $n_{\text{eff}}$ from $n$ toward $O(1)$, and aggregate error scales $\sigma/\sqrt{n_{\text{eff}}}$. Sealed hashed forecasts revealed simultaneously ([Naor 1991](https://doi.org/10.1007/BF00196774); [Blum 1981](https://doi.org/10.1145/1008908.1008911)) remove the copy channel, restoring $n_{\text{eff}}\to n$ minus the irreducible shared-information correlation — a near-free protocol change recovering a $\sqrt n$ factor **[standard shape]** while simultaneously killing the cheap move-the-median attack. Improves both axes at once.

### 7. Breakdown-point ratings and the Krum impossibility

The corruption gain of an aggregating process is the Lipschitz constant of its output with respect to adversary-controllable inputs, and the **breakdown point** — the fraction of inputs that must be corrupted to move the output arbitrarily — is its single-number metric. The mean has breakdown 0; the median, 50%. Sharpened: **no linear aggregation rule tolerates even one Byzantine input** ([Blanchard et al. 2017](https://arxiv.org/abs/1703.02757)) **[exact]** — the rigorous form of "averaging LLM judges is maximally corruptible" — so robust pooling (coordinate-wise median, trimmed mean) is mandatory, not optional. Differential privacy is the same property from the other side, bounding per-contributor influence to $\varepsilon$.

### 8. Decorrelated-probe interrogation

Intense interrogation faces a false-positive wall: you can push any model into "confessing." The fix is the invariance principle — a coerced confession is highly sensitive to framing, a real defect is invariant across resets and decorrelated framings. Define a confession as the fraction of $m$ decorrelated probes that elicit it; this is a sequential test (SPRT) whose error rates both go to zero **iff the genuinely-bad confession rate $b$ exceeds the fine-but-pushed rate $f$** **[standard shape]**. The whole research question reduces to designing probes with that separating property, decorrelated enough that artifacts don't correlate — with black-box lie detection by unrelated follow-ups ([Pacchiardi et al. 2024](https://arxiv.org/abs/2309.15840)) as a starting primitive.

### 9. Forced precision — the Quine–Duhem cost

Demand that a bold claim be cashed into a precise operationalization *and* a comprehensive model linking it to checkable facts. A false claim can always be saved by adjusting auxiliaries — but keeping it coherent at resolution $R$ costs $k_R$ improbable auxiliary commitments, and the defended position's joint prior decays like $p^{k_R}$ **[heuristic]**. The mechanism forces a confident liar to either lower confidence (back to the objective) or expose a checkable contradiction, and it "breaks down for many claims" precisely where there are too few checkable connections — the unresolvable residue that [judge-grounded protocols](/concepts/oversight-protocols/) exist for.

### 10. Provenance bonds and the funding-effect discount

Make every cited source post a stake, slashed if it is later shown corrupt or biased. This prices the [funding-effect](/case-studies/the-funding-effect/) likelihood-ratio discount directly into the mechanism: a source whose favorable conclusions are $k$ times more likely regardless of truth carries an attenuated likelihood ratio, and the bond makes that expected attenuation a cost the source internalizes ex ante. It is the deterrence-family counterpart to the invariance-family identity-masking gap — one prices the bias, the other measures it.

## Open questions

- Is "cost per validated bit" comparable enough across constructions to put numbers, not L/M/H maturity tags, on this table — the same open problem the [Process Catalogue](/concepts/process-catalogue/) flags for processes?
- Which constructions compose multiplicatively (corruption costs add or multiply) and which merely inherit the weakest link?
- For the speculative rows with no bound yet (gauge-invariance tests, minimal-sufficient-input reduction, steelman-then-break), is there a real guarantee to be had, or are they only heuristics?
- Does the PCP-analogue for estimates exist in any non-trivial form, and if so what is $g(\Delta)$ for realistic decompositions?
- How many of these survive an adversary who knows the construction — i.e., which are robust to Goodharting once public, the standing question for every rating system in [Untrustworthy Sources](/concepts/untrustworthy-sources/)?
