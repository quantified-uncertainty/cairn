---
title: "Hardening: Independence & Decorrelation"
description: Manufacture genuinely independent signals so corruption must defeat all of them and herding cannot collapse them.
sidebar:
  order: 8
---

*Family 3 of the [Hardening overview](/concepts/hardening-techniques/). Aggregation, voting, and cross-checking all assume independence they rarely have. This family is the engineering of real independence — and the honest accounting of how little of it survives shared training. The lever, its limit, the constructions with their cheapest attacks, and two worked bounds with numbers.*

:::note[Status]
Draft v0 · updated June 2026 · maintained by [QURI](https://quantifieduncertainty.org/). Part III, family page. Exploratory. Grades per [The Core Model](/concepts/core-model/).
:::

## The lever

If $k$ signals are genuinely independent, corruption must defeat all of them and noise averages out: aggregate error scales $\sigma/\sqrt{n_{\text{eff}}}$, where $n_{\text{eff}}$ is the *effective* number of independent signals. The hardening move is to raise $n_{\text{eff}}$ — by forking a model into non-communicating branches, running independently-built stacks, removing the copy channel that lets forecasters herd, or decorrelating interrogation probes. The [machine affordances](/concepts/hardening-techniques/#the-cross-cutting-multiplier-machine-oversight-affordances) make this family unusually powerful: humans can't be reset, forked, or run blind to each other.

## The limit

You cannot manufacture independence a population doesn't have. Shared training pipelines correlate failures, so $k$ model instances may carry $n_{\text{eff}}\!\ll\!k$ — and the residual correlation is the floor on everything here. This is the family's hard ceiling: ensembling, peer prediction, and multi-model panels all deliver *confidence* in proportion to $k$ but *accuracy* only in proportion to $n_{\text{eff}}$, and the gap is invisible unless the correlation is measured. Decorrelation must be empirical, never assumed.

## Constructions

| Construction | Bound / estimate | Defends against | Cheapest attack (≈ cost) | Maturity · source |
|---|---|---|---|---|
| Commit-reveal forecasting | restores $n_{\text{eff}}\!\to\! n$; error $\sigma/\sqrt{n_{\text{eff}}}$ **[standard shape]** | herding; hoarding; move-the-median | coordinate out-of-band before committing (≈ cost of a private channel) | deployed (crypto) · [Naor 1991](https://doi.org/10.1007/BF00196774) |
| Decorrelated-probe interrogation | SPRT: error $\to 0$ iff bad-rate $b>$ fine-rate $f$ **[standard shape]** | false confessions *and* missed defects | a competent liar invariant across framings, so $b\approx f$ (high — the point) | prototyped · [Pacchiardi 2024](https://arxiv.org/abs/2309.15840) |
| n-version reasoning | beat $k$ stacks; discount by measured correlation **[standard shape]** | single-model failures; prompt-transfer | one injection that transfers across shared base models (low if stacks share a base) | prototyped · [Avizienis 1985](https://doi.org/10.1109/TSE.1985.231893) |
| Checkpoint-fork cross-examination | defect appears in all $k$ branches **[heuristic]** | coerced interrogation artifacts | plant the defect *upstream* of the fork so it propagates to all branches (moderate) | speculative · (affordance) |
| Mind-wiped re-derivation | reproducible vs. motivated drift **[heuristic]** | motivated reasoning to a chosen answer | a stable *bias* reproduces every run, passing as "stable" (≈ free — reproducible ≠ correct) | speculative · (affordance) |
| Collusion-bounded peer prediction | truthful iff inter-agent non-truth MI < threshold **[standard shape]** | colluding model copies | share a base model so correlated reports sit below the MI threshold (low) | prototyped · [Shnayder 2016](https://arxiv.org/abs/1603.03151) |
| Self-transcript confrontation | cross-context incoherence surfaced **[heuristic]** | incoherence across context windows | keep one consistent story across contexts (moderate) | prototyped · — |
| Steelman-then-break | a 2nd model rates steelman quality **[heuristic]** | sandbagged self-criticism | a plausible-but-subtly-weak steelman the rater passes (low) | speculative · — |
| Confidence-under-pressure | legitimate confidence is reframing-invariant **[heuristic]** | compliance mistaken for knowledge | genuine-seeming invariant confidence — a coherent liar (moderate) | speculative · — |

## Worked bounds

**Commit-reveal and the √n recovery.** Herding collapses $n_{\text{eff}}$: copying the visible median drives it from $n$ toward $O(1)$, and aggregate error scales $\sigma/\sqrt{n_{\text{eff}}}$. With $n=100$ forecasters herded to $n_{\text{eff}}\approx5$, the aggregate is $\sqrt{100/5}\approx4.5\times$ noisier than an independent pool. Sealed hashed forecasts revealed simultaneously ([Naor 1991](https://doi.org/10.1007/BF00196774); [Blum 1981](https://doi.org/10.1145/1008908.1008911)) remove the copy channel, restoring $n_{\text{eff}}\to n$ minus the irreducible shared-information correlation — a near-free protocol change buying back that $\sqrt n$ factor **[standard shape]** while also killing the cheap move-the-median attack. The cheapest defeat is out-of-band collusion before commitment.

**Decorrelated-probe interrogation.** A coerced confession is highly sensitive to framing; a real defect is invariant across resets and decorrelated framings. Define a confession as the fraction of $m$ decorrelated probes that elicit it; this is a sequential test (SPRT) whose error rates both go to zero **iff the genuinely-bad confession rate $b$ exceeds the fine-but-pushed rate $f$** **[standard shape]**. The whole construction reduces to designing probes with $b>f$ — and the cheapest attack is exactly the case that collapses it: a competent liar whose answers are invariant across framings, making $b\approx f$. Black-box lie detection by unrelated follow-ups ([Pacchiardi 2024](https://arxiv.org/abs/2309.15840)) is the starting primitive.

## Open questions

- How do you *measure* $n_{\text{eff}}$ across model instances — what's the right estimator of shared-failure correlation?
- Can forking and re-seeding produce decorrelation that survives shared pretraining, or is the correlation floor immovable without architectural diversity?
- Do decorrelated interrogation probes exist with a real separating gap $b>f$, decorrelated enough that artifacts don't correlate?
