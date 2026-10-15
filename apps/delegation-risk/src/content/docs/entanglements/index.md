---
title: "Entanglements"
description: "Why stacked AI safety checks fail together, how much that costs, and how to measure and reduce it"
sidebar:
  order: 0
---

Three safety layers that each miss 10% of harmful actions look like 99.9% protection if their failures are independent. They rarely are. Checks built on similar models share blind spots. A verifier that reads the agent's summary inherits its framing. An instruction injected into a document reaches every component that reads it. Components that work together long enough adapt to each other. **Entanglement** covers all of these: any dependence between components that the independence arithmetic ignores.

## The canonical example

Take three layers that each miss 10% of harmful actions, and common-cause correlation ρ on the phi scale. The beta-factor mixture from nuclear reliability engineering ([derivation](/entanglements/fundamentals/formal-definitions/#the-entanglement-tax)) gives

$$P(\text{all miss}) = (1-\rho)\prod_i p_i + \rho \cdot \min_i p_i$$

- Independent (ρ = 0): 0.1³ = 0.1%, or 99.9% protection.
- ρ = 0.5: 0.5 × 0.001 + 0.5 × 0.1 ≈ 5%, or about 95% protection.
- The **entanglement tax**, actual over assumed residual risk, is 1 + 99ρ: about 11×, 21× and 50× at ρ = 0.1, 0.2 and 0.5.

Three caveats travel with these numbers:

- **ρ = 0.5 is a benchmark-based prior, not a measurement of any monitor stack.** On MMLU misses, strong LLMs from different providers give ρ of about 0.3–0.6 and models from one provider about 0.5–0.7, depending on how much label noise is allowed for ([Measuring Entanglement](/entanglements/detection/correlation-calculator/#what-the-evidence-supports)). No study reports ρ for harm detection. Show the range, not one row.
- **This is benign-failure math.** Against an adaptive adversary, such as a scheming component or a prompt-injection author, inputs are chosen to beat every layer at once. Count the stack as its best single layer unless a control evaluation shows otherwise ([Risk Propagation](/delegation-risk/risk-propagation/#adversarial-inputs)).
- **Correlation does not change expected losses**, which add. It matters for defenses where every layer must miss, and for the tails of total loss.

## Start here

1. [Types of Entanglement](/entanglements/fundamentals/types/): passive, active and adversarial, with where each comes from in agent stacks.
2. [Formal Definitions](/entanglements/fundamentals/formal-definitions/): the tax, effective redundancy, and the limits of AI checking AI.
3. [Measuring Entanglement](/entanglements/detection/correlation-calculator/): estimating ρ, the lookup tables, the correlation budget, and priors for when you cannot measure.
4. [Solutions & Mitigations](/entanglements/mitigation/solutions/): what lowers ρ or bounds the damage, and when it is worth paying for.

Then, by need:

- **Running an assessment:** [Detecting Influence](/entanglements/detection/detecting-influence/) for the methods, the [Audit Guide](/entanglements/mitigation/audit-guide/) for the protocol, and [Worked Examples](/entanglements/case-studies/examples/) for four analyses end to end.
- **Background and evidence:** [Research Connections](/entanglements/research/research-connections/) covers common-cause failure analysis, correlated LLM errors and AI debate. [Foundation-Model Monoculture](/entanglements/case-studies/foundation-model-monoculture/) covers provider concentration. [Historical Cases](/entanglements/case-studies/historical-cases/) covers human institutions that failed this way, [Psychology of Oversight](/entanglements/cross-domain/psychology-of-oversight/) covers human reviewers as a correlated layer, and [Regulatory Approaches](/entanglements/cross-domain/regulatory-approaches/) covers policy.

The design-pattern view of the same problem is [Channel Integrity](/design-patterns/channel-integrity/), and the canonical propagation rule is [Risk Propagation](/delegation-risk/risk-propagation/). The sibling Reasoning Processes notes treat decorrelation as a hardening technique for any reasoning process, human or model ([Independence & Decorrelation](https://reasoning-processes.quantifieduncertainty.org/concepts/hardening-independence/)).
