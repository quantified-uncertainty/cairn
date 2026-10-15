---
title: Robust Reasoning Processes
description: A research exploration — working notes toward reasoning processes that deliver trustworthy conclusions at known cost and resist corruption.
sidebar:
  order: 1
---

*Robust reasoning processes (RRP) is our working name for procedures — peer review, prediction markets, audits, LLM judge pipelines — that turn effort and evidence into trustworthy conclusions, and keep doing so under adversarial pressure. This chapter says what the notes are about, the three quantities they organize around, how they relate to neighboring programs, and where the foundations are least certain.*

:::note
A research exploration, not a textbook: working notes and brainstorming toward a research agenda, with few results of its own so far. The table of contents, including planned chapters, is on the [front page](/#contents).
:::

## What this is about

**Robust reasoning processes (RRP)**, as we use the term, are procedures that turn effort and evidence into trustworthy conclusions — *and keep doing so when interested parties try to corrupt them*. The objects are processes, not people or models: peer review, prediction markets, audits, expert panels, LLM judge pipelines, debate protocols. The questions are about measurement: what does a process deliver, what does it cost, and what does it cost to corrupt?

The subject draws on information economics, mechanism design, and AI oversight, with debts to metrology, security engineering, and reliabilist epistemology, which already judges beliefs by the reliability of the processes that produce them ([Goldman 1979](https://doi.org/10.1007/978-94-009-9493-5_1)); most of what follows is synthesis from those fields. The motivating observations:

1. **Many important reasoning processes are unbenchmarked.** Peer review spread without an experiment. Courts, committees, and audits evolved rather than being designed, and few have measured error rates, let alone *corruption* rates.
2. **Processes may be the leverage point.** Many large epistemic gains were procedural — double-entry bookkeeping, controlled trials, statistical inference, proper scoring rules. A method scales in a way individual brilliance does not.
3. **AI makes processes studyable.** An LLM-based reasoning process is an executable artifact: it can be run a thousand times, perturbed, versioned, and attacked on purpose. Method evaluation becomes an experimental science, and method *discovery* becomes a search loop.
4. **AI also makes the problem urgent.** The marginal cost of producing plausible reasoning has collapsed; the cost of verifying it has not. Whoever consumes reasoning at scale — funders, labs, governments, or a weak agent delegating to stronger ones — needs processes whose reliability is measured, not asserted.

## The core quantities

A reasoning process $\pi$ is characterized by three things. [The Core Model](/concepts/core-model/) develops each as a candidate formalism, graded by how far to trust it; here they are in words.

**What it delivers — epistemic weight.** The judge's master question: *given a claim from process $\pi$, how much should I update?* The answer is the process's likelihood-ratio profile, given its track record and its corruption exposure. This quantity is **[exact]** — it is probability theory; everything hard is estimation — and it is the hinge of the whole framework.

**What it costs.** Information degrades through a lossy pipeline from source to decision — codification, evaluation, interpretation each take a cut — and running the process costs money that must be amortized across its consumers. The comparable figure of merit is **cost per validated bit**: the price of information that survived checking, not the price of text. (The pipeline decomposition is **[heuristic]** — an audit template, not a law.)

**What it costs to corrupt.** Under pressure, every process leaks. The **corruption cost curve** is the minimum an adversary of given capability must spend to shift the process's output by a given amount; a process is robust when corrupting it costs more than the distortion is worth — a rating against a threat model, never an adjective. It gives the project its name and is the least measured of the three; these notes contain no measurement of it yet. Measuring it — paying red teams to corrupt a process and recording the price — is what we call an **incentive audit**.

The framework has a prospective twin: pricing information *before* anyone pays to produce it. Coherence forces a model's quoted expected update to equal its expected uncertainty reduction, which makes prospective quotes checkable without ground truth — the intended flywheel, developed in [The Core Model](/concepts/core-model/#5-pricing-information-before-it-arrives-exact) and built into a pricing system by [Epistemic Impact Analysis](/proposals/epistemic-impact-analysis/).

## The three layers

The material organizes into three layers, top-down:

**The Judge** — the consumer of reasoning, who cannot check the work object-level. What the judge needs: a utility function over information (what is worth knowing, with weights), a way to price information against it, and the process-conditional weights that say how much each source should move them.

**The Processes** — the procedures themselves: their anatomy, their grounding (what their verdicts bottom out in), their measured properties, the catalogue comparing them, and the attack-and-hardening cycle that makes them robust.

**The Environment** — the game the processes live inside: the players (producers, resolvers, accreditors, adversaries), the identity and track-record infrastructure every incentive scheme silently assumes, the market structure that decides who pays for verification, and the legal and cultural constraints that make some robust methods impossible in practice.

The full chapter list, including planned chapters, is on the [front page](/#contents).

## The nearest neighbors

A reader from AI safety will pattern-match this project to several existing programs. The differences as we see them:

| Neighbor | Shared ground | Where RRP differs |
|---|---|---|
| **Scalable oversight** (debate, [amplification](https://arxiv.org/abs/1810.08575)) | a weak principal extracting truth from a stronger agent | the protocols make one answer at a time checkable; RRP prices and allocates verification across thousands of claims — the missing economics ([What Grounds an Oversight Protocol?](/concepts/oversight-protocols/#the-missing-economics)) |
| **AI control** | explicit budgets, audits, distrust of the agent | control catches bad *actions*; RRP prices true *information* — metering the product, not policing the process ([Overseeing Automated Research](/proposals/overseeing-automated-research/)) |
| **ELK** | the resolution problem — what do verdicts bottom out in? | ELK targets claims no outside resolver can check; RRP works where some resolver exists and asks how to price, extend, and protect it |
| **Forecasting research** | resolution, calibration, proper scoring rules | the object of study is the *process* and its corruption cost, not forecast accuracy; forecasting platforms are catalogue rows, not the subject |
| **[Evaluation engineering](https://evaluation-engineering.quantifieduncertainty.org/)** (sibling wiki) | the same 2021–22 corpus; prediction–evaluation systems, trust networks, Goodhart | evaluation engineering optimizes *throughput at known cost* — ten thousand evaluations cheaply; RRP optimizes *corruption cost* — the same processes under attack |
| **[Delegation risk](https://delegation-risk.quantifieduncertainty.org/)** (sibling wiki) | principals relying on agents they cannot fully check; correlated failure across checks | delegation risk budgets the expected *harm* of delegated actions; RRP prices the *information* a process delivers and the cost of corrupting it |
| **Epistemic security (CSER)** | adversaries attacking a society's ability to evaluate information | RRP's scope is formal reasoning procedures with measurable error rates, not public discourse at large |

And what this is *not*: not the study of smart agents — capability without measured reliability is upstream of nothing here; an agent is interesting exactly insofar as it executes a strong process ([What Is a Strong Reasoner?](/concepts/what-is-a-strong-reasoner/)). And not *trust* in the relational sense: where this works, trust moves off the operator and onto the audit, the re-run, and the resolver, which is where the central uncertainty below sits.

## The central uncertainty

Every measurement proposed here ultimately leans on some resolution layer — somewhere, a claim must be checked against the world. If trustworthy resolution can be extended (retrodiction, selection protocols, consistency floors) faster than adversaries learn to game it, the program is workable. If not, it fails at its foundation. And it must apply to itself: a test battery for processes is itself a process, with its own corruption cost curve. We track these in [Cruxes](/start-here/key-questions/).
