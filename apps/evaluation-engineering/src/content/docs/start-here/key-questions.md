---
title: Cruxes
description: The open questions evaluation engineering turns on — the things that, if resolved, would most change the shape of the field.
sidebar:
  order: 4
---

*Status: early draft. These are the questions the rest of the wiki circles around. Most are unresolved.*

These are framed as cruxes: questions where a confident answer would meaningfully redirect effort. They are grouped loosely by the part of the system they bear on. See also the running list on [Open Problems](/open-questions/).

## On the premise

1. **Is the bottleneck really the system, not the estimate?** The field's founding bet is that we know how to make one good evaluation and fail at making ten thousand cheaply. Is that true, or is single-evaluation quality still the binding constraint in the domains we care about?
2. **Does scale actually unlock value, or just volume?** Ten thousand mediocre estimates may be worth less than ten excellent ones. What's the evidence that high-throughput evaluation produces decisions that wouldn't otherwise be made?

## On estimation vs. evaluation

3. **How much can be demoted from evaluation to estimation?** The divide-and-conquer strategy is only as good as the fraction of judgment-bound questions you can convert into model-bound ones. Where does that fraction top out?
4. **Can LLMs do trustworthy evaluation, or only cheap evaluation?** Evaluation's defining requirement is *trust*. Cheap judgments that no one trusts don't move decisions. Under what conditions, if any, does an LLM-produced evaluation earn the trust an expert panel's does?

## On the components

5. **Does scalable structured forecasting work?** Most forecasting platforms rely on small sets of hand-written, unstructured questions. Can we forecast over large structured ontologies ("for each country, each month, 20 metrics, 20 years") without the quality collapsing?
6. **Is ontology the silent bottleneck?** The 2021–22 notes flag data/ontology infrastructure as suspiciously absent from forecasting work. Is structuring the questions the real hard part, more than answering them?
7. **What is the right interface for estimation functions?** If the unit of reuse is a cached function from parameters to an estimate, what does the tooling need to look like for these to compose at scale?

## On bridging cheap and expensive judgment

8. **Do prediction–evaluation systems actually calibrate cheap predictors?** The proposal: have many predictors forecast a large set, evaluate a random subset expensively, reward the best. Does the incentive structure hold up, especially against gaming and against deceptive participants?
9. **How do you price an evaluation?** To trade accuracy against cost you need a value-of-information story for messy, normative, long-horizon questions. What's the unit, and can it be made operational?

## On the environment

10. **Is culture the real adoption bottleneck?** The claim that systems fail for cultural rather than technical reasons (people don't *want* loud public ratings of their work) is strong. Is it right, and if so, is culture actually more tractable than the technical problems?
11. **How do you avoid building a corrupt or captured truth agency?** A trusted, high-throughput evaluator is a target. What keeps it honest — trust networks, meta-evaluation, decentralization — and do any of those actually work?

## On the field itself

12. **Is "evaluation engineering" the right frame and name?** The lineage went *advanced evaluation systems → symbolic evaluation systems → estimation systems*; the present reframe centers engineering. Does the engineering framing carve the problem at its joints, or is it one more provisional label?

---

If you have a candidate answer — or a crux this list is missing — that's exactly the kind of contribution this wiki wants.
