---
title: "The Core Path"
description: "The core path through the framework's strongest material, plus shorter routes by goal"
---

The site has about 65 pages, but its argument lives in about a dozen stops. If you read one route, read this one. Everything else is reference, supporting research or applied variation.

<span id="the-core-path"></span>

## The Core Path

**Before you start**, read the [Five-Minute Intro](/getting-started/five-minute-intro/). Keep [Concepts](/getting-started/core-concepts/) and the [Glossary](/getting-started/glossary/) open for reference.

1. **[Risk Decomposition](/delegation-risk/risk-decomposition/)**: the three harm channels, accident, defection and hijack. They need different mitigations. Capability affects them differently: a more capable delegate may err less per action, but it is given more consequential actions and is better at pursuing a wrong goal. Better models alone do not solve all three channels.

2. **[Risk Propagation](/delegation-risk/risk-propagation/)**: one composition rule instead of a menu. Multiply, correct for common-cause correlation with the beta-factor mixture, and note that correlation helps serial chains but hurts parallel checks.

3. **[Runtime Accounting](/delegation-risk/runtime-accounting/)**: the math moved into the agent harness. It has three parts. The risk preflight estimates expected damage before each consequential action. The exposure envelope is a hard bound enforced regardless of intent. The exposure ledger is a per-delegate account, reconciled against outcomes. This page also explains why the preflight estimator must be more verifiable than the actor it checks.

4. **[Delegation Accounting](/delegation-risk/delegation-accounting/)**: risk as a balance-sheet item. Every delegation moves exposure onto someone's books, and the same key carries different exposure for delegates of different capability.

5. **[The Insurer's Dilemma](/delegation-risk/insurers-dilemma/)**: what moral hazard and adverse selection do to transferring delegation risk to an insurer, what real fidelity and AI liability cover does, and where insurance stops working against adversarial agents.

6. **[Entanglements](/entanglements/)**, **[Types](/entanglements/fundamentals/types/)** and **[Formal Definitions](/entanglements/fundamentals/formal-definitions/)**: why stacked checks that share a model, data or context are not independent, and the entanglement tax that results. The site's most distinctive contribution.

7. **[Detecting Influence](/entanglements/detection/detecting-influence/)**: practical methods for finding the coupling your architecture diagram says isn't there.

8. **[Entanglement Worked Examples](/entanglements/case-studies/examples/)**: systems diagnosed end to end. Each builds the correlation picture, finds the hidden dependency and redesigns.

9. **[Structural Patterns](/design-patterns/structural/)**: escalation ladders, the exposure-envelope gateway, task decomposition, bulkheads. These are the building blocks that bound damage regardless of component behavior.

10. **[Channel Integrity](/design-patterns/channel-integrity/)**: side channels, and how components that never communicate can still coordinate by reasoning alike.

11. **[Composing Patterns](/design-patterns/composing-patterns/)**: how patterns interact, and the failure modes of composing them badly.

12. **Worked examples**: a [code-deployment agent](/design-patterns/examples/code-deployment-example/) and a [research assistant](/design-patterns/examples/research-assistant-example/), each with illustrative numbers.

13. **[Empirical Scheming Reduction](/research/trust-behavior/empirical-scheming-reduction/)**: what control evaluations, monitoring studies and anti-scheming training have actually measured, with their caveats.

14. **[Nuclear Launch Authority](/case-studies/human-systems/nuclear-launch-authority/)** and **[Jury Systems](/case-studies/human-systems/jury-trust/)**: two human institutions built for delegation under distrust. Nuclear command trades unauthorized launch against failure to retaliate, using two-person rules; juries show the independence arithmetic for unanimity failing when jurors share evidence and deliberate together.

15. **[Sydney / Bing Chat](/case-studies/ai-systems/case-study-sydney/)**: a real failure analysed against the framework, and the scaffold-enforced limit that contained it.

**After the Core Path**, go applied with the [Quick Start](/design-patterns/tools/quick-start/), or go deeper with the [Research section](/research/).

## Shorter routes by goal

**Building a system.** [For Engineers](/getting-started/for-engineers/) → [Concepts](/getting-started/core-concepts/) → [Quick Start](/design-patterns/tools/quick-start/) → [Design Patterns](/design-patterns/) and [Least-X Principles](/design-patterns/least-x-principles/) → [Entanglements](/entanglements/).

**Assessing an existing system.** [Concepts](/getting-started/core-concepts/) → [Delegation Risk](/delegation-risk/) → [Risk Decomposition](/delegation-risk/risk-decomposition/) → [Entanglement Audit Guide](/entanglements/mitigation/audit-guide/) → [Solutions](/entanglements/mitigation/solutions/).

**Skeptical it works.** [FAQ](/getting-started/faq/) → [Related Approaches](/reference/related-approaches/) → [Sydney](/case-studies/ai-systems/case-study-sydney/) → [Nuclear & Aerospace PRA](/research/system-design/nuclear-aerospace-deep-dive/) and [Historical Cases](/entanglements/case-studies/historical-cases/), for fields that already budget failure.

**Following the math.** [Concepts](/getting-started/core-concepts/) → [Risk Propagation](/delegation-risk/risk-propagation/) → [Formal Definitions](/entanglements/fundamentals/formal-definitions/) → [Walkthrough](/delegation-risk/walkthrough/) → [Runtime Accounting](/delegation-risk/runtime-accounting/).

**Researching.** [Research index](/research/) → [Open Problems](/research/potential-projects/) → [Empirical Scheming Reduction](/research/trust-behavior/empirical-scheming-reduction/) → the speculative [Power Dynamics](/power-dynamics/) page.
