---
title: "Formal Definitions"
description: "Entanglement defined relative to an input distribution; the entanglement tax and its beta-factor derivation; why adaptive adversaries break it; effective redundancy; and the bounds on what diversity can buy"
sidebar:
  badge:
    text: Core
    variant: tip
  order: 3
---

This page states the entanglement concepts precisely. [Types of Entanglement](/entanglements/fundamentals/types/) gives the overview and examples.

## Definitions

Let $M_A(x) = 1$ when component A fails on input $x$, with $x$ drawn from a stated input distribution $\mathcal{D}$. Every definition below is relative to $\mathcal{D}$: change the distribution and the entanglement changes.

- **Passive entanglement:** $P(M_A = 1, M_B = 1) \neq P(M_A = 1)\,P(M_B = 1)$ under $\mathcal{D}$. It is symmetric, and its size is the phi coefficient of the miss indicators ([Measuring Entanglement](/entanglements/detection/correlation-calculator/)). Positive values erode redundancy. Negative values, where one layer tends to catch what the other misses, are better than independence.
- **Conditional entanglement:** independence under normal conditions $\mathcal{D}$, dependence under a stress distribution $\mathcal{D}_s$ such as high load or a degraded shared dependency. Testing under $\mathcal{D}$ cannot reveal it.
- **Active entanglement:** A's output causally affects B's decision: $\mathbb{E}[B \mid do(A = a)] \neq \mathbb{E}[B \mid do(A = a')]$ for some $a, a'$, with the underlying input held fixed. It is directional. *Context contamination* is the special case in which B sees only A's processed version of the input; by the data-processing inequality, B cannot recover what A removed.
- **Adversarial entanglement:** joint failure on inputs chosen by an optimizer rather than drawn from $\mathcal{D}$. The relevant quantity is no longer a frequency but whether the joint-miss region is non-empty and how costly it is to find ([below](#adaptive-adversaries-the-wrong-model)). Collusion between an agent and its verifier is the case where the optimizer is one of the components.
- **Logical correlation:** similarly trained models reach the same decision without communicating because they compute similar functions. The mechanism is passive, but a scheming model can use it to coordinate on a Schelling point, and there is no channel to monitor.
- **Capture:** a verifier's decisions come to depend on the agent's interests and not only on the work. Measure it on work of known quality, comparing approval rates for items of the same true quality when the agent does and does not signal that it wants approval. A raw ratio of approval rates is confounded: agents want approval most for work that deserves it, so an honest verifier paired with an honest agent shows a high ratio.

## Risk Concepts

### The Entanglement Tax

The entanglement tax is the ratio of the actual probability that every layer misses to the probability the product rule predicts.

**Canonical derivation** (this is the site's single source of truth for the tax; the [measurement page](/entanglements/detection/correlation-calculator/) tables are generated from it). Model correlation with the **beta-factor common-cause model**, borrowed from nuclear safety (see [Reliability Engineering & CCF — the closest prior art](/entanglements/research/research-connections/#reliability-engineering--common-cause-failure-the-closest-prior-art)): with weight $\rho$, one shared cause defeats all correlated layers at once; with weight $1-\rho$, layers fail independently. For $n$ layers with miss probabilities $p_i$:

$$P(\text{all fail}) = (1-\rho)\prod_i p_i + \rho \cdot \min_i p_i$$

$$\text{Tax}(\rho) = \frac{(1-\rho)\prod_i p_i + \rho \min_i p_i}{\prod_i p_i}$$

For $n$ identical layers at miss rate $p$, this simplifies to $\text{Tax} = (1-\rho) + \rho\, p^{1-n}$ — the tax grows *exponentially in layer count*, because each added layer improves your perceived risk but barely moves the common-cause floor.

**The tax as a function of ρ.** For three layers that each miss 10%, independence predicts 0.1% and the tax is $1 + 99\rho$:

| ρ | 0 | 0.1 | 0.3 | 0.5 | 0.7 | 1 |
|---|---|---|---|---|---|---|
| P(all fail) | 0.10% | 1.1% | 3.1% | 5.1% | 7.0% | 10% |
| Tax | 1× | 11× | 31× | 50× | 70× | 100× |

Which row applies depends on what the layers share. Benchmark data, allowing for label noise, put ρ between strong LLMs at roughly 0.3–0.6 across providers and 0.5–0.7 within one ([evidence and assumptions](/entanglements/detection/correlation-calculator/#what-the-evidence-supports)): a tax of about 30–60× and 50–70× for three layers. The "about 50×" used elsewhere on this site sits inside both ranges. No harm-detection stack has been measured.

**Why this model**: it is exact for its stated mechanism (a genuine shared cause), and it recovers the product rule at $\rho = 0$ and the single-best-layer bound at $\rho = 1$. Calibrated to each pair's joint miss rate (for equal miss rates, ρ is then the phi coefficient of the miss indicators; for unequal ones it is larger, see [the recipe](/entanglements/detection/correlation-calculator/#estimating-ρ-from-joint-misses)), it is exact for two layers and, against a smoother correlation structure (a Gaussian copula), conservative for three or more, which is the right direction for safety budgeting. The derivation, the simulation and the serial-chain counterpart are in [Risk Propagation: One Rule, Not a Menu](/delegation-risk/risk-propagation/).

**Limitation — higher-order structure**: a single $\rho$ treats all layers as symmetrically coupled to one shared cause. Real architectures have *structured* correlation (layers A and B share a provider; C shares context with A) and possible three-way interactions that no single parameter captures. Use the pairwise correlation-matrix method from the [worked examples](/entanglements/case-studies/examples/) when the architecture is asymmetric, and simulation when precision matters. Reliability engineering's established answer is the multiple Greek letter and alpha-factor models, which estimate separately how often a common-cause event fails 2, 3, … of $n$ components ([Research Connections](/entanglements/research/research-connections/#nuclear-common-cause-failure-analysis)).

### Adaptive adversaries: the wrong model

The beta-factor model describes *passive* common cause: shared defects that a randomly arriving input happens to trigger. Its ρ is a frequency over the input distribution. An adversary does not sample from that distribution. It searches for inputs in the region where every layer misses, and the question becomes whether that region is non-empty and how expensive it is to find, not how much probability it carries.

When attacks transfer between layers, an input found to beat one layer tends to beat the others, so P(all miss | attack) approaches P(best layer misses | attack): ρ → 1. The evidence that they transfer and that layered defenses fall to adaptive search is direct. Adversarial suffixes optimized on open models worked on commercial ones ([Zou et al. 2023](https://arxiv.org/abs/2307.15043)). Attacks tuned to each defense's design bypassed 12 published jailbreak and prompt-injection defenses with success above 90% for most, though most had reported near-zero attack success ([Nasr et al. 2025](https://arxiv.org/abs/2510.09023)). Against a pipeline of input classifier, model and output classifier with 0% attack success on a catastrophic-misuse set, a staged attack that defeated the components one at a time reached 71%, and 33% when developed without access to the target pipeline ([McKenzie et al. 2025](https://arxiv.org/abs/2506.24068)).

For design this means:

- **Credit an LLM stack with its best layer** on the defection and hijack channels until a control evaluation, in which a red team that knows the full stack attacks it, measures the joint miss rate ([Greenblatt et al. 2023](https://arxiv.org/abs/2312.06942)).
- **Rely on controls whose guarantee does not depend on the input**: permission scopes, hard limits on what an action can touch, rate limits, and rollback. An adversary cannot search its way past a capability the component does not have.
- **Make the joint-miss region expensive to search.** The strongest staged attack relied on seeing which component had blocked a query. Uniform refusals, running every stage even after one flags, and keeping safeguard models private and unlike public models the attacker could use as proxies all raise the cost ([McKenzie et al. 2025](https://arxiv.org/abs/2506.24068)).
- **Do not drop diverse checks because the tax calculation no longer credits them.** Diversity raises the attacker's search cost and still lowers ρ for benign failures. It just cannot be counted as multiplying the protection.

### Effective Redundancy

Effective redundancy is the number of independent layers that would give the same protection: $n_{\text{eff}} = \ln P(\text{all fail}) / \ln p$. For layers that each miss 10%, two, three or five of them at ρ = 0.5 are all worth about 1.3 independent layers under the beta-factor model: past modest correlation, effective redundancy is set by ρ, not by the layer count. The flatness is partly a property of the model, which assumes some inputs defeat every layer at once. A smoother structure fitted to the same pairwise joint misses still rewards extra layers, with quickly diminishing returns ([both, tabulated](/entanglements/detection/correlation-calculator/#lookup-tables)). Under either, defense in depth is defeated by common cause, not by independent bad luck.

## Bounds and Limits

### Irreducible Entanglement

**Claim**: Two AI systems with similar architectures and training should be assumed to have a baseline failure correlation that engineering will not remove.

**Why**: Even independently built versions fail together when inputs vary in difficulty. If $\theta(x)$ is the chance that a randomly built version fails on $x$, two independently built versions both fail with probability $\mathbb{E}[\theta^2] \geq (\mathbb{E}[\theta])^2$, with equality only if every input is equally hard ([Eckhardt & Lee 1985](https://doi.org/10.1109/TSE.1985.231895)). Shared training data and methods add to this. Measured LLM errors are substantially correlated, more so for more capable models ([Goel et al. 2025](https://arxiv.org/abs/2502.04313); [Kim et al. 2025](https://arxiv.org/abs/2506.07962)). On MMLU, strong models from different providers have a miss correlation of about 0.5, only a little below that of two models from one provider, about 0.6 ([computed from Kim et al.'s data](/entanglements/detection/correlation-calculator/#what-the-evidence-supports)). Adversarial inputs found on one model often transfer to others ([Zou et al. 2023](https://arxiv.org/abs/2307.15043)).

**Implication**: Independence between AI verifiers comes mainly from different methods and different information, which change *which* inputs are hard, not from different providers. Forced diversity of method can in principle beat independence, when the methods find different inputs hard ([Littlewood & Miller 1989](https://doi.org/10.1109/32.58771)).

### The Verification Ceiling

**Claim**: A verifier cannot directly check work it cannot evaluate. The limit binds where checking is no easier than producing. Where checking is easier (running tests, checking a proof, confirming that a cited source says what is claimed), a weaker verifier can check a stronger actor. Where it is not (judging a strategy, an unfamiliar design, a long informal argument), AI checking a more capable AI is limited. Scalable-oversight protocols try to relax the limit by making the strong system's reasoning checkable in small pieces; debate is the best-studied case, with theoretical guarantees under idealized assumptions ([Brown-Cohen et al. 2023](https://arxiv.org/abs/2311.14125)) and mixed empirical results (see [Research Connections](/entanglements/research/research-connections/#ai-debate)).

### Collusion Detection Limits

**Claim**: If agents coordinate through shared reasoning rather than explicit communication, monitoring communication will not detect the coordination. Collusion resistance then needs diversity of method, or [controls whose guarantee does not depend on the input](#adaptive-adversaries-the-wrong-model).

---

See also:
- [Types of Entanglement](/entanglements/fundamentals/types/) — Conceptual overview
- [Measuring Entanglement](/entanglements/detection/correlation-calculator/) — φ, lookup tables, thresholds and priors
- [Risk Propagation](/delegation-risk/risk-propagation/) — derivation, simulation and the adversarial case
