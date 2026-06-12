---
title: Robust Reasoning Processes
description: A small textbook for a new field — the study and engineering of reasoning processes that deliver trustworthy conclusions at known cost and resist corruption.
sidebar:
  order: 1
---

*Robust reasoning processes (RRP) is the proposed field that studies and engineers procedures — peer review, prediction markets, audits, LLM judge pipelines — that turn effort and evidence into trustworthy conclusions, and keep doing so under adversarial pressure. This chapter states what the field is, its three core quantities, how it differs from its nearest neighbors, and where its foundations are most uncertain.*

:::note[Status]
Draft v0 · updated June 2026 · maintained by [QURI](https://quantifieduncertainty.org/). The opening chapter of a deliberately small textbook (~20 chapters, most short, several still planned) — a working draft of a field that does not exist yet. The full table of contents lives on the [front page](/#the-book).
:::

## What the field is

**Robust reasoning processes (RRP)** is the study and engineering of procedures that turn effort and evidence into trustworthy conclusions — *and keep doing so when interested parties try to corrupt them*. Its objects are processes, not people or models: peer review, prediction markets, audits, expert panels, LLM judge pipelines, debate protocols. Its central activity is measurement: what does a process deliver, what does it cost, and what does it cost to corrupt?

The field sits at the intersection of information economics, mechanism design, and AI oversight, with debts to metrology, security engineering, and the epistemology of reliable processes. Its founding observations:

1. **Civilization runs on unbenchmarked reasoning processes.** Peer review was adopted without an experiment. Courts, committees, and audits evolved rather than being designed, and almost none of them have measured error rates — let alone measured *corruption* rates.
2. **The processes were always the leverage point.** History's great epistemic gains were procedural — double-entry bookkeeping, controlled trials, statistical inference, proper scoring rules. A method scales in a way brilliance never does.
3. **AI just made processes studyable.** An LLM-based reasoning process is an executable artifact: it can be run a thousand times, perturbed, versioned, and attacked on purpose. Method evaluation becomes an experimental science, and method *discovery* becomes a search loop.
4. **AI also made the problem urgent.** The marginal cost of producing plausible reasoning has collapsed; the cost of verifying it has not. Whoever consumes reasoning at scale — funders, labs, governments, or a weak agent delegating to stronger ones — needs processes whose reliability is measured, not asserted.

## The core quantities

A reasoning process $\pi$ is characterized by three things. [The Core Model](/concepts/core-model/) develops each as a candidate formalism, graded by how far to trust it; here they are in words.

**What it delivers — epistemic weight.** The judge's master question: *given a claim from process $\pi$, how much should I update?* The answer is the process's likelihood-ratio profile, given its track record and its corruption exposure. This quantity is **[exact]** — it is probability theory; everything hard is estimation — and it is the hinge of the whole framework.

**What it costs.** Information degrades through a lossy pipeline from source to decision — codification, evaluation, interpretation each take a cut — and running the process costs money that must be amortized across its consumers. The comparable figure of merit is **cost per validated bit**: the price of information that survived checking, not the price of text. (The pipeline decomposition is **[heuristic]** — an audit template, not a law.)

**What it costs to corrupt.** Under pressure, every process leaks. The **corruption cost curve** is the minimum an adversary of given capability must spend to shift the process's output by a given amount; a process is robust when corrupting it costs more than the distortion is worth — a rating against a threat model, never an adjective. This third quantity is the field's namesake and its least-measured one. Measuring it empirically — paying red teams to corrupt a process and recording the price — is the practice this book calls an **incentive audit**.

The framework has a prospective twin: pricing information *before* anyone pays to produce it. Coherence forces a model's quoted expected update to equal its expected uncertainty reduction, which makes prospective quotes checkable without ground truth — the field's intended flywheel, developed in [The Core Model](/concepts/core-model/#5-pricing-information-before-it-arrives-exact) and built into a pricing system by [Epistemic Impact Analysis](/proposals/epistemic-impact-analysis/).

## The three layers

The field organizes into three layers, top-down:

**The Judge** — the consumer of reasoning, who cannot check the work object-level. What the judge needs: a utility function over information (what is worth knowing, with weights), a way to price information against it, and the process-conditional weights that say how much each source should move them.

**The Processes** — the procedures themselves: their anatomy, their grounding (what their verdicts bottom out in), their measured properties, the catalogue comparing them, and the attack-and-hardening cycle that makes them robust.

**The Environment** — the game the processes live inside: the players (producers, resolvers, accreditors, adversaries), the identity and track-record infrastructure every incentive scheme silently assumes, the market structure that decides who pays for verification, and the legal and cultural constraints that make some robust methods impossible in practice.

The full chapter list, with status per chapter, is on the [front page](/#the-book).

## The nearest neighbors

A reader from AI safety will pattern-match this field to several existing programs. The honest differences:

| Neighbor | Shared ground | Where RRP differs |
|---|---|---|
| **Scalable oversight / debate** | a weak principal extracting truth from a stronger agent | oversight verifies *one claim at a time*; RRP prices and allocates verification across thousands of claims — the missing economics ([What Grounds an Oversight Protocol?](/concepts/oversight-protocols/#the-missing-economics)) |
| **AI control** | explicit budgets, audits, distrust of the agent | control catches bad *actions*; RRP prices true *information* — metering the product, not policing the process ([Overseeing Automated Research](/proposals/overseeing-automated-research/)) |
| **ELK** | the resolution problem — what do verdicts bottom out in? | RRP treats it as an economics and infrastructure problem (resolvers, escrow, track records), not a training problem |
| **Forecasting research** | resolution, calibration, proper scoring rules | the object of study is the *process* and its corruption cost, not forecast accuracy; forecasting platforms are catalogue rows, not the field |
| **Epistemic security (CSER)** | adversaries attacking a society's ability to evaluate information | RRP's scope is formal reasoning procedures with measurable error rates, not public discourse at large |

And what the field is *not*: not the study of smart agents — capability without measured reliability is upstream of nothing here; an agent is interesting exactly insofar as it executes a strong process ([What Is a Strong Reasoner?](/concepts/what-is-a-strong-reasoner/)). And not *trust* in the relational sense: where this book succeeds, trust becomes unnecessary — you do not need to trust an operator whose process you can audit, re-run, and price.

## The honest center of uncertainty

Every measurement in this book ultimately leans on some resolution layer — somewhere, a claim must be checked against the world. If trustworthy resolution can be extended (retrodiction, selection protocols, consistency floors) faster than adversaries learn to game it, the field is buildable. If not, it fails at its foundation. And the field must apply to itself: a test battery for processes is itself a process, with its own corruption cost curve. We track these in [Cruxes](/start-here/key-questions/).
