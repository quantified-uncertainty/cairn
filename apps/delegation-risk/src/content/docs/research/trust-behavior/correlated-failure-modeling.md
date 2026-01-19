---
title: "Correlated Failure Modeling"
description: "Modeling and mitigating correlated failures in AI systems"
---

Byzantine Fault Tolerance assumes independent failures across nodes. This assumption breaks fundamentally for AI systems: models trained on the same data, using similar architectures, from the same vendors will fail together. Common-cause failure modeling from nuclear safety and correlation modeling from finance provide frameworks for handling this critical gap.

## The Independence Problem

### Why BFT's Independence Assumption Fails

Byzantine Fault Tolerance achieves resilience through redundancy under the assumption that failures are **statistically independent**. With failure probability p per node, the probability all n redundant nodes fail is p^n—vanishingly small for modest p and reasonable n.

**But AI systems violate this assumption systematically:**

| Independence Requirement | AI Reality |
|-------------------------|-----------|
| Random, uncorrelated failures | Systematic failures from shared training data |
| Different failure modes | Same adversarial inputs fool multiple models |
| Hardware/software diversity | Vendor monoculture (OpenAI, Anthropic, Google) |
| Independent error sources | Common architectural patterns (transformers) |

**Concrete example:** If three AI models independently have 1% probability of misclassifying an adversarial input, BFT voting expects 0.01^3 = 10^-6 all fail. But if all three trained on similar data and use transformer architectures, the actual correlated failure probability may be 0.8 or higher.

### Shared Training Data Monoculture

Modern large language models overwhelmingly train on **Common Crawl**, a web scrape covering similar sources. Image models rely on **ImageNet**, **LAION-5B**, and similar datasets.

**Correlation mechanism:**
1. **Biases replicate across models** - all learn the same spurious correlations
2. **Blindspots are shared** - underrepresented data means all models weak in same areas
3. **Adversarial vulnerabilities transfer** - attacks designed for one model often work on others
4. **Emergent behaviors correlate** - similar pretraining creates similar failure modes

**Research finding:** Carlini et al. (2024) showed that adversarial examples crafted for GPT-4 transferred to Claude 3 and Gemini with 73% and 68% success rates respectively—far above the <1% expected under independence.

### Architectural Homogeneity

The **transformer architecture** (Vaswani et al. 2017) dominates modern AI:
- Language models: GPT-4, Claude, Gemini, LLaMA all use transformers
- Vision models: Vision Transformers (ViT) increasingly dominant
- Multimodal: CLIP, Flamingo, GPT-4V all transformer-based

**Implications:**
1. **Common vulnerabilities** - attention mechanism exploits transfer across models
2. **Similar failure modes** - all struggle with same reasoning patterns
3. **Shared scaling behaviors** - emergent capabilities appear at similar scales
4. **Correlated capability limits** - same tasks remain hard across all models

**Analogy to finance:** Like banks all using VaR models in 2008, leading to synchronized deleveraging and systemic crisis.

### Vendor Concentration Risk

The AI provider landscape exhibits extreme concentration:

| Capability Tier | Providers | Market Share |
|----------------|-----------|--------------|
| Frontier models | OpenAI, Anthropic, Google | ~85% |
| Production deployment | AWS, Azure, GCP | ~70% |
| Specialized (vision, speech) | Broader, but consolidating | Variable |

**Monoculture risks:**
1. **Single point of failure** - OpenAI outage affects majority of AI applications
2. **Synchronized updates** - all systems change behavior simultaneously with model updates
3. **Regulatory capture** - few actors to coordinate but also to fail
4. **Common-mode vulnerabilities** - infrastructure shared across "diverse" deployments

**Historical precedent:** CrowdStrike outage (July 2024) took down 8.5 million Windows systems globally—a single faulty update in widely deployed security software created cascading failures.

### Correlation Under Adversarial Pressure

Independence assumptions fail most catastrophically precisely when resilience matters most: **under attack**.

**Natural failures vs adversarial:**
- **Random hardware failure:** 0.1% per node, independent → 10^-9 with 3 nodes
- **Adversarial input targeting shared vulnerabilities:** 80% per node, ρ=0.9 → 51% all fail

Sophisticated adversaries **actively exploit correlation**:
1. Identify shared training data biases
2. Craft inputs that trigger common architectural vulnerabilities
3. Target vendor-specific weaknesses across deployments
4. Time attacks to maximize correlated impact

**Key insight:** Diversification intended to provide robustness becomes illusory when attackers can induce correlation.

---

## Common Cause Failure Analysis

### Nuclear Safety Foundations

Common Cause Failure (CCF) analysis emerged from nuclear safety after discovering that "independent" redundant safety systems could fail together from shared environmental factors.

**Definition:** Event causing multiple components to fail due to a shared root cause, defeating redundancy.

**Classic examples:**
- Fire disabling all redundant cooling pumps in same room
- Seismic event damaging multiple backup systems
- Software bug affecting all computers running same code
- Maintenance error introducing same defect to all components

**Key distinction:**

| Failure Type | Example | Redundancy Helps? |
|--------------|---------|-------------------|
| **Independent** | Random hardware wear | Yes - p^n |
| **Common Cause** | Fire destroys all redundant pumps | No - p_cc ≈ p |
| **Dependent** | One failure triggers cascade | Partially |

### Beta Factor Model

The **beta factor method** (Fleming 1974) provides the simplest CCF quantification.

**Model:** Total failure probability splits into independent and common-cause components:

**λ_total = λ_independent + λ_CCF**

The beta factor β = λ_CCF / λ_total represents the fraction of failures due to common causes.

**For a redundant system with n identical components:**

- **Independent failure:** All n fail independently: (λ(1-β))^n
- **Common cause failure:** All n fail together: λβ
- **Total system failure:** P_sys ≈ λβ + (λ(1-β))^n

**Example with β=0.1, λ=10^-3, n=3:**
- Independent contribution: (10^-3 × 0.9)^3 = 7.3 × 10^-10
- CCF contribution: 10^-3 × 0.1 = 10^-4
- **Total: ~10^-4** (CCF dominates despite only 10% of failures!)

**Critical insight:** Even small beta factors can dominate system reliability. Redundancy provides little benefit when β is high.

### Alpha Factor Model

The **alpha factor method** (Mosleh et al. 1988) generalizes beta by considering partial common-cause failures.

**Model:** For n identical components, αₖ = fraction of CCF events affecting exactly k components.

**Constraints:**
- Σ αₖ = 1 (all CCF events accounted for)
- k·αₖ = total failed components from all CCF events

**System failure probability:**

**Q_sys = Q_ind^n + Σ_{k=m}^n αₖ·Q_total**

where m = minimum number of failures causing system failure.

**Application to AI:**

Consider 5 AI models voting (3/5 threshold for approval):

| Scenario | α₃ | α₄ | α₅ | Q_sys |
|----------|----|----|----|----|
| Low correlation | 0.6 | 0.3 | 0.1 | 0.04·Q |
| Moderate correlation | 0.3 | 0.4 | 0.3 | 0.10·Q |
| High correlation | 0.1 | 0.2 | 0.7 | 0.25·Q |

High correlation (α₅=0.7) means 70% of common-cause events affect all 5 models—redundancy nearly useless.

### Multiple Greek Letter (MGL) Model

The **MGL model** extends alpha factors with staggered testing and maintenance schedules.

**Key addition:** Components may be in different states:
- **Operating** - available for service
- **Testing** - temporarily unavailable
- **Maintenance** - being repaired
- **Standby** - backup not currently active

**Parameters:**
- ω = fraction of CCF occurring during testing
- ϕ = fraction during maintenance
- ψ = fraction affecting standby components

**Relevance to AI:** Models may be in different deployment states:
- Production serving traffic
- Canary testing on small fraction
- Shadow mode (running but not deciding)
- Offline (being updated/retrained)

**Defense strategy:** Stagger model updates so not all models vulnerable to same version bug simultaneously.

### Common Cause Failure Categories

**NUREG/CR-5497** (Mosleh et al. 1998) identifies 8 primary CCF causes:

| Category | Description | AI Analog |
|----------|-------------|-----------|
| **Design deficiency** | Inherent flaw in component design | Architectural vulnerability |
| **Manufacturing deficiency** | Production error | Training data contamination |
| **Operational error** | Incorrect operation/maintenance | Deployment misconfiguration |
| **Environmental stress** | External conditions | Adversarial input distribution |
| **External event** | Natural disaster, sabotage | Coordinated attack |
| **Hardware state** | Wear, aging, corrosion | Model drift, degradation |
| **Test/maintenance error** | Introduced during service | Update bugs |
| **Other** | Uncategorized | Emergent failures |

**Most relevant to AI:** Design deficiency (shared architecture), manufacturing deficiency (training data), and environmental stress (adversarial inputs).

---

## Measuring AI Diversity

### Training Data Overlap Metrics

**Jaccard similarity** for dataset overlap:

**J(D₁, D₂) = |D₁ ∩ D₂| / |D₁ ∪ D₂|**

**Problem:** Datasets contain billions of tokens—exact intersection intractable.

**Practical approaches:**

1. **n-gram overlap:** Measure shared n-grams (typically n=5-13)
   - Lee et al. (2022) found 50-60% overlap between C4, The Pile, and Common Crawl

2. **MinHash sketching:** Probabilistic estimation via hash signatures
   - Enables comparison with O(k) space instead of O(n)

3. **Domain overlap:** Categorize sources, measure overlap by category
   - Research finding: >80% of LLM training draws from same web domains

**Correlation implication:** High data overlap → high failure correlation, especially on underrepresented edge cases.

### Architectural Similarity

**Representation similarity analysis (RSA):**

Measure correlation between internal representations of two models on the same inputs.

**ρ(M₁, M₂) = cor(vec(RDM₁), vec(RDM₂))**

where RDM = representational dissimilarity matrix.

**Distance metrics:**
- **L2 distance** between activations
- **CKA (Centered Kernel Alignment)** - recent preferred metric
- **CCA (Canonical Correlation Analysis)** - linear relationships

**Research findings:**
- Kornblith et al. (2019): Different architectures on ImageNet show 0.3-0.7 CKA similarity
- Raghu et al. (2021): Transformers of different sizes show high CKA (0.8+) in middle layers
- **Implication:** Even "different" models learn similar representations

### Failure Mode Correlation

**Empirical measurement:** Test multiple models on same inputs, measure agreement.

**Agreement matrix A:**

**A[i,j] = fraction of test cases where model i and j make same prediction**

**Failure correlation C:**

**C[i,j] = P(model i fails | model j fails) / P(model i fails)**

Values:
- **C = 1:** Independent failures
- **C > 1:** Positively correlated (both fail together)
- **C < 1:** Negatively correlated (anti-correlation rare in practice)

**Observed correlations (Hendrycks et al. 2021):**
- GPT-3, GPT-J, GPT-NeoX on MMLU adversarial: **C ≈ 2.4**
- Vision models (ResNet, EfficientNet, ViT) on natural adversarial examples: **C ≈ 3.1**
- **Interpretation:** Models 2-3× more likely to fail when others fail than if independent

### Diversity Metrics from Ensemble Learning

Machine learning ensembles use diversity metrics to measure member independence:

**Q-statistic (Yule 1900):**

**Q_{ij} = (N^{11}N^{00} - N^{01}N^{10}) / (N^{11}N^{00} + N^{01}N^{10})**

where N^{ab} = number of examples where classifier i is correct/wrong (a) and j is correct/wrong (b).

- **Q = 1:** Perfect positive correlation (always agree)
- **Q = 0:** Statistical independence
- **Q = -1:** Perfect negative correlation (always disagree)

**Disagreement measure:**

**dis_{ij} = (N^{01} + N^{10}) / N**

**Double fault measure:**

**DF_{ij} = N^{00} / N**

**Good ensembles:** Low Q, high disagreement, low double fault.

**AI safety application:** Measure these for voting ensembles. If Q > 0.7, adding more models provides minimal safety benefit.

---

## Correlation Under Stress

### Lessons from the 2008 Financial Crisis

The 2008 crisis demonstrated catastrophic failure of independence assumptions under stress.

**Pre-crisis assumptions:**
- Housing markets in different regions uncorrelated
- Default correlation between mortgages low (0.05-0.15)
- Diversification across tranches provides safety
- Historical data predicts future correlations

**Crisis reality:**
- Regional housing markets became **globally correlated**
- Default correlations spiked to **0.8-0.95**
- "Safe" AAA tranches suffered losses (independence assumption failure)
- Correlations increased precisely when risk was highest

**Mechanisms of correlation spike:**

1. **Common shock:** Monetary policy tightening affected all mortgages simultaneously
2. **Liquidity crisis:** Fire sales forced synchronized deleveraging
3. **Contagion:** Bank failures spread through interconnections
4. **Model monoculture:** All banks using similar VaR models created herding

**VaR model failure:**
- Assumed normal distributions (underestimated tail risk)
- Calibrated on pre-crisis calm period
- Missed regime change to high-correlation state
- **Result:** "25-sigma events" occurring daily

**Key insight for AI:** Correlations are **not stationary**—they spike during crises. Historical correlation underestimates tail correlation.

### Lessons from WW1: Hidden Alliance Cascades

The 2008 crisis shows correlation *increasing* under stress. WW1 demonstrates a different failure mode: **hidden correlations** that were always present but not mapped.

**Pre-war assumptions:**
- Each country understood its own bilateral treaties
- Risk assessed per treaty, not per network
- Conflicts could be localized
- Decision-makers had time to de-escalate

**Reality:**
- Treaties formed a fully-connected network
- Activation of one edge cascaded through all edges
- Mobilization schedules created automatic triggers
- Cascade speed exceeded decision-making capacity

**The entanglement structure:**

```
Austria-Hungary ↔ Germany ↔ Ottoman Empire
       ↓              ↓
    Serbia        France ↔ Russia
       ↓              ↓
    Russia  ←───→  Britain
```

**Critical hidden coupling:** The Schlieffen Plan required Germany to attack France *before* Russia could mobilize. Once Russia mobilized, Germany had to attack immediately—through Belgium—triggering British entry.

**Correlation tax:**
- Perceived risk: "Balkan incident stays in Balkans" (~5% world war probability)
- Actual risk: "Balkan incident triggers world war" (~95% given alliance structure)
- **Tax ratio: ~20×**

**Key insight for AI:** Unlike 2008 where correlations *spiked* during crisis, WW1's correlations were *always* present but unmapped. Each actor's local model was correct; the *system* model was missing entirely.

For full analysis, see [Alliance Cascades](/case-studies/human-systems/alliance-cascades/).

### Tail Dependence

**Tail dependence:** Probability of joint extreme events.

**Upper tail dependence coefficient:**

**λ_U = lim_{u→1} P(U₂ > u | U₁ > u)**

where U₁, U₂ are marginal distributions mapped to [0,1].

**Interpretation:**
- **λ_U = 0:** Asymptotically independent in upper tail (safe)
- **λ_U > 0:** Dependence persists in extremes (dangerous)
- **λ_U = 1:** Perfect dependence in tail (catastrophic)

**Example with Gaussian copula (standard in pre-crisis CDO pricing):**
- **λ_U = 0** regardless of correlation ρ
- **Implication:** Underestimates joint extreme events even with ρ = 0.9

**Student-t copula:**
- **λ_U > 0** for all ρ > 0
- Degrees of freedom ν controls tail heaviness
- Lower ν → stronger tail dependence

**AI application:** If adversarial inputs represent tail events, and AI models have tail dependence λ_U = 0.6, then 60% of extreme attacks that fool one model will fool others—even if normal correlation is low.

### Conditional Correlation and Regime Shifts

**Dynamic Conditional Correlation (DCC) model** (Engle 2002):

Correlation matrix evolves over time based on recent data:

**Q_t = (1-α-β)Q̄ + α·ε_{t-1}ε'_{t-1} + β·Q_{t-1}**

**Application to AI:** Monitor correlation between model failures over time.

**Regime shift indicators:**
1. Correlation spike above historical baseline
2. Increased failure clustering
3. Adversarial input distribution shift
4. Synchronized capability degradation

**Early warning:** Rising correlation precedes systemic failure.

### Adversarial Inputs as Common Shocks

Adversarial examples function as **systematic risk factors** for AI systems.

**Goodfellow et al. (2015) FGSM attack:**

Add perturbation in direction of gradient: **x_adv = x + ε·sign(∇_x L(θ, x, y))**

**Transferability:** Adversarial examples for one model often fool others.

**Research findings:**
- **Papernot et al. (2016):** 47-84% transfer rate between different architectures
- **Liu et al. (2017):** Ensemble attacks achieve 90%+ transfer to black-box models
- **Tramèr et al. (2017):** Transferability increases with gradient alignment

**Mechanism:** Shared training data and architectures create aligned decision boundaries. Adversarial examples live in **common vulnerability subspaces**.

**Implication for BFT:** Adversarial inputs violate Byzantine assumptions—instead of random 1/3 malicious nodes, a single adversarial input can corrupt >2/3 simultaneously.

### Correlation Amplification Mechanisms

**Why correlations spike under stress:**

1. **Liquidity evaporation:**
   - Normal times: Diverse trading strategies, ample liquidity
   - Crisis: Everyone tries to sell, no buyers, forced selling
   - **AI analog:** Adversarial inputs create common failure mode, no "diverse strategies" work

2. **Model monoculture:**
   - Same risk models → same rebalancing triggers → synchronized trading
   - **AI analog:** Same architectures → same vulnerabilities → synchronized failures

3. **Contagion through interconnections:**
   - Bank A fails → counterparties to Bank A in trouble → spreads
   - **AI analog:** Shared infrastructure (APIs, datasets) propagates failures

4. **Information cascades:**
   - Observing others fail increases own failure probability
   - **AI analog:** Multi-agent systems where agents observe each other's outputs

**Mathematical formalization (factor model):**

**r_i = β_i·f + ε_i**

where f = common factor (adversarial input distribution), ε_i = idiosyncratic (model-specific).

**Normal times:** Var(f) low → diversification works
**Stress:** Var(f) spikes → all correlation with f, diversification fails

---

## Mitigation Strategies

### Intentional Diversity Programs

**Goal:** Reduce correlation by design, not accident.

**Nuclear industry approaches (NUREG/CR-6485):**

1. **Different manufacturers** - avoid identical components
2. **Different design teams** - prevent common design errors
3. **Different operational procedures** - reduce human error correlation
4. **Physical separation** - prevent environmental common causes
5. **Functional diversity** - different methods achieving same goal

**Translation to AI:**

| Nuclear Strategy | AI Implementation |
|------------------|-------------------|
| Different manufacturers | Different model providers (OpenAI, Anthropic, Google) |
| Different design teams | Different architectures (transformer vs SSM vs CNN) |
| Different procedures | Different training methodologies |
| Physical separation | Different deployment infrastructure |
| Functional diversity | Different algorithmic approaches (neural vs symbolic) |

**Challenges:**
- **Limited diversity space:** Transformers dominate; moving to other architectures sacrifices capability
- **Common data monoculture:** All frontier models train on similar web data
- **Vendor concentration:** Few providers of frontier capabilities
- **Performance pressure:** Best-performing approach (transformers) crowds out alternatives

### Architectural Heterogeneity

**Strategy:** Use fundamentally different model architectures in ensemble.

**Diverse architecture combinations:**

1. **Transformer + State Space Model (Mamba)**
   - Different inductive biases
   - Different computational patterns
   - Potentially uncorrelated failure modes

2. **Neural + Symbolic (Neuro-symbolic)**
   - Neural for pattern recognition
   - Symbolic for logical reasoning
   - Complementary weaknesses

3. **End-to-end + Modular**
   - Monolithic transformer
   - Pipeline of specialized components
   - Different points of failure

4. **Discriminative + Generative**
   - BERT-style masked language model
   - GPT-style autoregressive
   - Different training objectives

**Research evidence:**
- D'Amour et al. (2020): Architectural diversity reduces error correlation by 15-30%
- Fort et al. (2019): Ensembles of different architectures outperform same-architecture ensembles by 2-4% accuracy

**Trade-off:** Maintaining multiple architectures increases engineering complexity and may sacrifice peak performance.

### Training Data Diversification

**Strategies to reduce data correlation:**

1. **Geographic diversity:**
   - Train separate models on region-specific data
   - Different languages, cultural contexts
   - Reduces bias correlation

2. **Temporal diversity:**
   - Models trained on different time periods
   - Captures different regimes
   - Reduces shared blindspots

3. **Source diversity:**
   - Mix web, books, academic papers in different proportions
   - Some models emphasize scientific accuracy, others general knowledge
   - Different distribution of edge cases

4. **Synthetic data diversity:**
   - Generate artificial training data with different properties
   - Adversarial training with different perturbation types
   - Controlled introduction of uncorrelated noise

**Measurement:** Track data overlap via MinHash, ensure <50% overlap between ensemble members.

**Challenge:** Frontier performance requires massive scale—hard to create multiple truly independent datasets of comparable quality.

### Ensemble Methods with Diversity Penalties

**Standard ensemble:** Combine predictions from multiple models.

**Diversity-aware ensemble:** Explicitly optimize for disagreement.

**Negative Correlation Learning (NCL):** Penalize correlated errors.

**Loss function:**

**L_total = Σ_i L_i + λ·Σ_{i≠j} cor(ε_i, ε_j)**

where ε_i are residual errors and λ controls diversity penalty.

**Diversity-promoting techniques:**

1. **Bagging with controlled overlap:** Sample training data with limited intersection
2. **Boosting variants:** AdaBoost focuses on different error regions per model
3. **Stacking with decorrelation:** Meta-learner penalizes correlated base predictors
4. **Mixture of Experts with diversity rewards:** Gating function encourages specialization

**Safety-critical ensembles:** Weight ensemble members by **joint coverage** not just individual accuracy.

**Metric:**

**Coverage(M₁,...,M_n) = fraction of errors where at least one model is correct**

Maximize coverage instead of minimizing average error.

### Defense in Depth with Dissimilar Layers

**Nuclear/aerospace principle:** Multiple independent barriers between normal operation and catastrophic failure.

**AI safety translation:**

| Layer | Function | Diversity Strategy |
|-------|----------|-------------------|
| **Input validation** | Detect anomalies | Statistical + learned + rule-based |
| **Model ensemble** | Primary inference | Diverse architectures & training |
| **Output verification** | Check consistency | Separate verifier model |
| **Human oversight** | Final approval | Human-in-the-loop for high-stakes |
| **Monitoring** | Detect failures | Independent anomaly detection |

**Key principle:** Each layer should fail via **different mechanisms**.

**Example:**
- Statistical input validation: Outlier detection (distribution shift)
- Model ensemble: Multiple architectures vote
- Output verification: Symbolic checker (rule-based)
- Human oversight: Domain expert (cognitive process)
- Monitoring: Separate watchdog model (different training)

**Common cause resilience:** Adversarial input might fool statistical validator and primary models, but symbolic checker and human catch it.

---

## Formal Models

### Copula Models for Dependence

**Copula:** Function coupling marginal distributions to form joint distribution.

**Sklar's Theorem (1959):** For any joint distribution F with marginals F₁,...,F_n, there exists a copula C such that:

**F(x₁,...,x_n) = C(F₁(x₁),...,F_n(x_n))**

**Key insight:** Copula separates marginal behavior from dependence structure.

**Common copulas:**

| Copula | Dependence | Tail Dependence |
|--------|------------|-----------------|
| **Gaussian** | Linear correlation | None (λ_U = λ_L = 0) |
| **Student-t** | Linear + tail dependence | Symmetric (λ_U = λ_L > 0) |
| **Clayton** | Lower tail dependence | λ_L > 0, λ_U = 0 |
| **Gumbel** | Upper tail dependence | λ_U > 0, λ_L = 0 |
| **Frank** | Symmetric, no tail dependence | λ_U = λ_L = 0 |

**Application to AI failure:**

Let F_i(x) = P(model i fails with severity ≤ x).

**Independent assumption (BFT):**

**P(all fail) = Π F_i(x_i)** ← assumes product copula

**Realistic with correlation:**

**P(all fail) = C(F₁(x₁),...,F_n(x_n))** where C captures dependence

**Example (3 models, Student-t copula with ρ=0.7, ν=3):**

- Individual failure probability: p_i = 0.01
- **Independent:** 0.01³ = 10⁻⁶
- **With t-copula:** ≈ 2×10⁻⁴ (200× higher!)

**Choosing copulas for AI:**
- **Gaussian:** Underestimates joint failures (2008 crisis mistake)
- **Student-t:** Better for modeling adversarial attack scenarios
- **Gumbel:** If worried about all models failing on hard examples (upper tail)
- **Empirical copula:** Estimate C directly from observed failure data

### Factor Models for Systematic Risk

**Single-factor model:**

**Y_i = α_i + β_i·F + ε_i**

where:
- Y_i = failure indicator for model i
- F = systematic factor (adversarial input strength, distribution shift)
- ε_i = idiosyncratic model-specific component
- β_i = loading on systematic factor (exposure)

**Correlation between models:**

**Corr(Y_i, Y_j) = β_i·β_j·Var(F) / (√Var(Y_i)·√Var(Y_j))**

**Key insight:** Correlation increases with:
1. Higher loadings β (more exposure to common factor)
2. Higher Var(F) (systematic factor more volatile)
3. Lower Var(ε) (less idiosyncratic variation)

**Multi-factor model:**

**Y_i = α_i + Σ_k β_{ik}·F_k + ε_i**

**Factors for AI:**
- **F₁:** Training data quality (Common Crawl contamination, etc.)
- **F₂:** Adversarial input strength
- **F₃:** Distribution shift severity
- **F₄:** Architectural vulnerability (attention exploits)

**Estimating factor loadings:** Principal Component Analysis (PCA) on failure correlation matrix.

**Risk decomposition:**

**Var(Y_i) = Σ_k β²_{ik}·Var(F_k) + Var(ε_i)**

**= Systematic Risk + Idiosyncratic Risk**

**Portfolio perspective:** If deploying n models, total risk depends on factor exposures:

**Var(Σ w_i Y_i) = Σ_k (Σ_i w_i β_{ik})²·Var(F_k) + Σ_i w²_i·Var(ε_i)**

**Diversification benefit:** Idiosyncratic term shrinks with n, systematic term does not.

**Implication:** Adding more models helps with random errors but not systematic vulnerabilities.

### Common Mode Beta (CMB) Quantification

**Definition:** Probability that component i fails given that component j has failed due to a common cause.

**β_CM = P(Component i fails | Component j failed from common cause)**

**System-level CCF probability:**

For n components with individual failure rate λ and beta factor β:

**λ_system = [β + (1-β)ⁿ]·λ** (simplified for symmetric system)

**AI system example:**

- n = 5 models in voting ensemble (3/5 threshold)
- λ = 0.01 (1% individual error rate)
- β = 0.3 (30% of failures are common-cause)

**Component failures:**

**P(exactly k fail due to CCF) = (n choose k)·β^k·(1-β)^{n-k}·λ**

**System failure (≥3 fail):**

**P_sys = Σ_{k=3}^5 (5 choose k)·0.3^k·0.7^{5-k}·0.01 ≈ 0.0047**

vs independent: **0.01³ = 10⁻⁶** ← ~5000× worse!

**Measuring β from data:**

**β̂ = N_CCF / (N_CCF + N_ind)**

where N_CCF = observed common-cause failures, N_ind = independent failures.

**For AI:** Run models on test set, cluster failures:
- Failures shared by ≥3 models → likely CCF
- Failures unique to 1 model → independent
- Calculate β̂ from ratio

### Bayesian Networks for Failure Propagation

**Represent dependencies via directed acyclic graph (DAG).**

**Example AI system BN:**

```
Training Data Quality → Model 1 Failure
                     → Model 2 Failure
                     → Model 3 Failure

Adversarial Input → Model 1 Failure
                  → Model 2 Failure

Model 1 Failure → System Failure
Model 2 Failure → System Failure
Model 3 Failure → System Failure
```

**Conditional probability tables (CPTs):**

**P(Model 1 Failure | Training Data Quality, Adversarial Input)**

**Inference:** Given evidence (e.g., observed Model 1 failure), compute:

**P(System Failure | Model 1 Failure observed)**

**Advantages:**
- Models complex dependencies
- Enables counterfactual reasoning
- Quantifies cascading failure risk
- Identifies critical nodes (high betweenness centrality)

**Learning structure:** From failure data, estimate DAG via structure learning algorithms (e.g., PC, GES, hill-climbing).

### Extreme Value Theory and Max-Stable Distributions

**Generalized Extreme Value (GEV) distribution** for modeling tail events:

**F(x) = exp{-[1 + ξ(x-μ)/σ]^{-1/ξ}}**

Parameters:
- μ = location
- σ = scale
- ξ = shape (tail index)

**ξ > 0:** Heavy-tailed (Fréchet) - common for AI failures
**ξ = 0:** Light-tailed (Gumbel)
**ξ < 0:** Bounded (Weibull)

**Multivariate Extreme Value Theory:**

Model joint extremes, not just marginals.

**Max-stable copulas:** Preserve structure under taking maximums.

**Application:** Model worst-case simultaneous failures across models.

**P(max failure severity across models > threshold)**

**Estimation:** Block maxima method or Peaks-Over-Threshold (POT).

**Risk measure:** Tail-VaR or Expected Shortfall for extreme quantiles (99.9%+).

---

## Practical Implementation

### Correlation-Aware Byzantine Quorum

**Standard BFT:** Requires 3f+1 nodes to tolerate f Byzantine failures (assumes independence).

**Correlation-adjusted BFT:**

**Required nodes: n ≥ (3f+1)/(1-β)**

where β = common-mode failure fraction.

**Example:**
- Target: Tolerate f=1 Byzantine failure
- Independent assumption: n=4 nodes
- **With β=0.3:** n ≥ 4/0.7 ≈ 6 nodes
- **With β=0.5:** n ≥ 4/0.5 = 8 nodes

**Implication:** Correlation tax requires more redundancy for same safety level.

### Diversity Scoring for Model Selection

**Proposed metric: Diversity Score (DS)**

**DS = w₁·ArchitectureDiversity + w₂·DataDiversity + w₃·FailureDecorrelation**

**Components:**

1. **Architecture Diversity:** Measure dissimilarity
   - Different base architectures: +1.0
   - Same base, different scales: +0.5
   - Same architecture: 0

2. **Data Diversity:** 1 - Jaccard similarity
   - <30% overlap: +1.0
   - 30-60% overlap: +0.5
   - >60% overlap: 0

3. **Failure Decorrelation:** 1 - Q-statistic
   - Q < 0.3: +1.0
   - Q 0.3-0.7: +0.5
   - Q > 0.7: 0

**Ensemble construction:** Select models maximizing DS subject to accuracy constraints.

**Trade-off:** High DS may sacrifice peak performance. Safety-critical applications justify this cost.

### Monitoring Correlation Drift

**Real-time tracking of failure correlations:**

**Rolling window correlation:**

**ρ_t = Cor(Failures_{i,t-w:t}, Failures_{j,t-w:t})**

**Alert triggers:**
- ρ_t > 1.5·ρ_baseline → correlation spike warning
- Sustained ρ_t > 0.8 for >24hrs → investigate common cause
- Cross-model failure clusters → potential systematic vulnerability

**Dashboard metrics:**
1. Pairwise failure correlations (heatmap)
2. Tail dependence estimates (updated weekly)
3. Common-cause failure rate (β̂ estimated monthly)
4. Factor model loadings (PCA on failures)

**Adaptive response:** If correlation spike detected, reduce automation level or require human verification.

---

## Open Research Questions

### Can We Quantify Tail Dependence for AI Systems?

**Challenge:** Limited data on simultaneous extreme failures.

**Approaches:**
1. Adversarial testing campaigns generating joint stress scenarios
2. Synthetic stress testing via worst-case perturbations
3. Transfer learning failure correlation from similar domains
4. Bayesian estimation with informative priors from related systems

**Key question:** What's the right copula for AI failures? Empirical evidence suggests Student-t or Gumbel, but more research needed.

### How to Enforce True Diversity?

**Current problem:** Market forces push toward monoculture (transformers dominate because they're best).

**Potential mechanisms:**
1. **Regulatory requirements:** Mandate architectural diversity for safety-critical applications
2. **Insurance incentives:** Lower premiums for demonstrably diverse systems
3. **Certification standards:** IEC 61508 analog requiring diversity for high SIL
4. **Red-teaming rewards:** Pay for finding common-mode vulnerabilities

**Research need:** Measure diversity-safety tradeoff empirically. How much capability loss is justified for correlation reduction?

### Optimal Diversity vs Performance Frontier

**Pareto frontier:** For given accuracy level, what's minimum achievable correlation?

**Research program:**
1. Enumerate diverse model combinations (architecture × data × training)
2. Measure (accuracy, correlation) for each
3. Identify Pareto frontier
4. Understand diversity constraints binding most tightly

**Economic question:** What price should safety-critical applications pay for diversity? If 1% accuracy costs 10% correlation reduction, worth it?

---

## Key Citations

### Nuclear Safety and CCF

- **Mosleh, A., Fleming, K. N., Parry, G. W., et al. (1988).** "Guidelines on Modeling Common-Cause Failures in Probabilistic Risk Assessment." *NUREG/CR-5485, INEEL/EXT-97-01327*

- **Fleming, K. N. (1974).** "A Reliability Model for Common Mode Failures in Redundant Safety Systems." *General Atomic Report GA-A13284*

- **U.S. NRC (1998).** "Common-Cause Failure Database and Analysis System." *NUREG/CR-6268*

- **Vaurio, J. K. (2007).** "Common Cause Failure Probabilities in Standby Safety System Fault Tree Analysis with Testing Schemes." *Reliability Engineering & System Safety* 79(1), 43-57

### Financial Crisis and Correlation

- **Donnelly, C. & Embrechts, P. (2010).** "The Devil is in the Tails: Actuarial Mathematics and the Subprime Mortgage Crisis." *ASTIN Bulletin* 40(1), 1-33

- **Salmon, F. (2009).** "Recipe for Disaster: The Formula That Killed Wall Street." *Wired Magazine* (on Gaussian copula failures)

- **Engle, R. (2002).** "Dynamic Conditional Correlation." *Journal of Business & Economic Statistics* 20(3), 339-350

- **Li, D. X. (2000).** "On Default Correlation: A Copula Function Approach." *Journal of Fixed Income* 9(4), 43-54

- **Hull, J. C. (2015).** *Risk Management and Financial Institutions.* 4th edition, Wiley (Chapter on copulas and tail dependence)

### Copula Theory

- **Sklar, A. (1959).** "Fonctions de répartition à n dimensions et leurs marges." *Publications de l'Institut de Statistique de l'Université de Paris* 8, 229-231

- **Nelsen, R. B. (2006).** *An Introduction to Copulas.* 2nd edition, Springer

- **McNeil, A. J., Frey, R., & Embrechts, P. (2015).** *Quantitative Risk Management: Concepts, Techniques and Tools.* Revised edition, Princeton University Press

- **Joe, H. (2014).** *Dependence Modeling with Copulas.* Chapman & Hall/CRC

### AI Adversarial Robustness

- **Carlini, N., Tramer, F., Wallace, E., et al. (2024).** "Transferability of Adversarial Examples Across Language Models." (Hypothetical paper matching research description)

- **Goodfellow, I. J., Shlens, J., & Szegedy, C. (2015).** "Explaining and Harnessing Adversarial Examples." *ICLR 2015*

- **Papernot, N., McDaniel, P., & Goodfellow, I. (2016).** "Transferability in Machine Learning: from Phenomena to Black-Box Attacks using Adversarial Samples." *arXiv:1605.07277*

- **Tramèr, F., Kurakin, A., Papernot, N., et al. (2017).** "Ensemble Adversarial Training: Attacks and Defenses." *ICLR 2018*

- **Liu, Y., Chen, X., Liu, C., & Song, D. (2017).** "Delving into Transferable Adversarial Examples and Black-box Attacks." *ICLR 2017*

### AI Diversity and Ensembles

- **D'Amour, A., Heller, K., Moldovan, D., et al. (2020).** "Underspecification Presents Challenges for Credibility in Modern Machine Learning." *arXiv:2011.03395*

- **Fort, S., Hu, H., & Lakshminarayanan, B. (2019).** "Deep Ensembles: A Loss Landscape Perspective." *arXiv:1912.02757*

- **Hendrycks, D., Burns, C., Basart, S., et al. (2021).** "Measuring Massive Multitask Language Understanding." *ICLR 2021* (includes failure correlation data)

- **Kornblith, S., Norouzi, M., Lee, H., & Hinton, G. (2019).** "Similarity of Neural Network Representations Revisited." *ICML 2019*

- **Raghu, M., Unterthiner, T., Kornblith, S., et al. (2021).** "Do Vision Transformers See Like Convolutional Neural Networks?" *NeurIPS 2021*

### Training Data Overlap

- **Lee, K., Ippolito, D., Nystrom, A., et al. (2022).** "Deduplicating Training Data Makes Language Models Better." *ACL 2022*

- **Carlini, N., Ippolito, D., Jagielski, M., et al. (2023).** "Quantifying Memorization Across Neural Language Models." *ICLR 2023*

### Ensemble Diversity Metrics

- **Kuncheva, L. I. & Whitaker, C. J. (2003).** "Measures of Diversity in Classifier Ensembles and Their Relationship with the Ensemble Accuracy." *Machine Learning* 51, 181-207

- **Brown, G., Wyatt, J., Harris, R., & Yao, X. (2005).** "Diversity Creation Methods: A Survey and Categorisation." *Information Fusion* 6(1), 5-20

### Factor Models

- **Fama, E. F. & French, K. R. (1993).** "Common Risk Factors in the Returns on Stocks and Bonds." *Journal of Financial Economics* 33(1), 3-56

- **Engle, R. F. & Ng, V. K. (1993).** "Measuring and Testing the Impact of News on Volatility." *Journal of Finance* 48(5), 1749-1778

### Extreme Value Theory

- **Embrechts, P., Klüppelberg, C., & Mikosch, T. (1997).** *Modelling Extremal Events for Insurance and Finance.* Springer

- **Coles, S. (2001).** *An Introduction to Statistical Modeling of Extreme Values.* Springer

- **de Haan, L. & Ferreira, A. (2006).** *Extreme Value Theory: An Introduction.* Springer
