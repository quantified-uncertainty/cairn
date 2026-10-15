---
title: "Empirical Scheming Reduction"
description: "What control evaluations, factored monitoring, anti-scheming training, sandbagging studies and reasoning monitors have actually measured about scheming AI, with each result's setting and caveats, mapped onto delegation-risk terms."
---

This page collects what has been measured about the *defection* [channel](/delegation-risk/risk-decomposition/): delegates that pursue goals other than the principal's and hide it. Each result is reported with its setting and its authors' caveats. Most of the evidence comes from coding benchmarks in which a red team's "attack policy" stands in for a scheming model. None of it measures the accident or hijack channels directly.

The vocabulary is AI Control's (Greenblatt et al. 2023, [arXiv:2312.06942](https://arxiv.org/abs/2312.06942)). An *untrusted* model is capable enough that it might be scheming. A *trusted* model is too weak to scheme effectively. A *control protocol* combines the two with a small *auditing budget* of trusted human labour, and a *control evaluation* measures the protocol against a red team that plays the scheming model. Three mappings to this site's terms recur below:

- **Trusted monitoring is a [risk preflight](/delegation-risk/runtime-accounting/#1-risk-preflight)** run by a component lower on the [verifiability hierarchy](/getting-started/core-concepts/#verifiability-hierarchy) than the actor it checks.
- **Correlated errors between actor and monitor** are what a [correlation budget](/delegation-risk/risk-propagation/) limits.
- **Against an adaptive attacker the effective correlation goes to 1.** The [exposure envelope](/delegation-risk/runtime-accounting/#2-the-exposure-envelope) is the part of the design that does not depend on it.

## 1. Control evaluations

### The original setting

Greenblatt et al. used GPT-4 as the untrusted model and GPT-3.5 as the trusted model. GPT-4 also stood in for scarce trusted human labour, enough to audit 2% of 5,000 APPS programming problems. The red team wins if a single backdoored solution is submitted: one that passes the tests but fails on an input the attacker knows. Safety is the probability of finishing without that happening, against the best attack found. Usefulness is solution correctness rescaled so that GPT-3.5 scores 0% and GPT-4 scores 100%. Reported results (their Table 2):

| Protocol | Safety | Usefulness |
|---|---|---|
| Upfront auditing only | 15% | 100% |
| Trusted monitoring: audit the 2% that GPT-3.5 rates most suspicious | 62% | 97% |
| Trusted monitoring; audit the top 2%, use GPT-3.5's own solution for the next 8% | 83% | 93% |
| Untrusted monitoring by a second GPT-4, with anti-collusion measures | 79% | 96% |
| Trusted editing: GPT-3.5 edits code ranked between the top 2% and top 20% | 92% | 94% |

One observation matters for preflight design. GPT-3.5 "never rates backdoored code as less than median suspicious". At a 2% false-positive threshold it still misses many backdoors, because it cannot tell unnecessary logic from logic it does not understand. A weak monitor ranks well and classifies badly, so it is most useful for deciding where to spend the audit budget.

### Agentic settings

- **Ctrl-Z** (Bhatt et al. 2025, [arXiv:2504.10374](https://arxiv.org/abs/2504.10374)) ran the first control evaluation in an agent environment: BashBench, 257 multi-step system-administration tasks, with an attacker trying to download and execute malware. *Resample protocols* draw extra samples of suspicious actions. They block the action and also generate further evidence against a malicious agent. The best protocol cut attack success from 58% to 7% at a 5% cost to a benign agent's performance.
- **SHADE-Arena** (Kutasov et al. 2025, [arXiv:2506.15740](https://arxiv.org/abs/2506.15740)) pairs benign main tasks with harmful side tasks. Sabotage success (both tasks done, monitor not alerted) was 27% for Claude 3.7 Sonnet and 15% for Gemini 2.5 Pro, monitored by Claude 3.6 Sonnet. Success depended heavily on a hidden scratchpad the monitor could not read. The best monitor, Gemini 2.5 Pro, reached an AUC of 0.87.
- **Safety cases.** Korbak et al. sketch an argument that an internally deployed agent will not exfiltrate data ([arXiv:2501.17315](https://arxiv.org/abs/2501.17315)). It rests on three claims: the red team elicits the model's real attack capability, the control measures work as well in deployment as in the evaluation, and extrapolation from the evaluation is conservative. *AI Control Levels* scale the red team's affordances to the capability profile of the model under evaluation ([arXiv:2504.05259](https://arxiv.org/abs/2504.05259)). Gardner-Challis et al. extend the argument to untrusted monitoring, with a taxonomy of collusion: passive self-recognition, causal (pre-shared signals) and acausal (Schelling points) ([arXiv:2602.20628](https://arxiv.org/abs/2602.20628)).

### Adaptive attacks on the monitor

Terekhov et al. (2025, [arXiv:2510.09462](https://arxiv.org/abs/2510.09462)) gave the untrusted model knowledge of the protocol and the monitor. It embedded known or zero-shot prompt injections in its outputs. Frontier models then consistently evaded diverse monitors on two control benchmarks. Defer-to-resample backfired, because resampling turned the injection into a best-of-*n* attack.

This is the empirical case for two of the framework's rules. A monitor that reads attacker-controlled text is exposed to the hijack channel, so an LLM preflight is a correlated check against an adaptive actor, and its effective ρ should be taken as 1 ([risk propagation](/delegation-risk/risk-propagation/), "Adversarial inputs"). A deterministic envelope check on file scope, egress or spend reads no prose and cannot be injected.

## 2. Factored cognition

Factored cognition decomposes a task into child tasks small enough to be solved, and checked, without the full context. Sandoval & Rushing (2025, [arXiv:2512.02157](https://arxiv.org/abs/2512.02157)) tested it as a control protocol in APPS. The trusted monitor was Llama 3.1 8B and the untrusted model GPT-4.1 Nano. Decomposition was done by o3-mini (*D*), an allowance the authors make to compensate for the weak trusted model's poor decomposition while keeping a weak monitor. Reported results (their Table 3):

| Protocol | Safety | Attack success rate |
|---|---|---|
| Trusted monitoring | 41% | 24% |
| Factor(D, U), low granularity | 63% | 18% |
| Factor(D, U), medium granularity | 56% | 17% |
| Factor(D, U), high granularity | 49% | 17% |

The authors attribute the gain to two mechanisms: better monitoring, since attacks on child tasks looked more suspicious while honest solutions shifted less, and a lower attack success rate. They looked for "security through obscurity" (attacks failing because the child context hides the target) and found no evidence for it in APPS. Their abstract states that "factored cognition makes it no harder for capable LLMs to write backdoors in APPS". The intuition that isolated contexts make multi-step attacks harder to coordinate is listed as future work, untested.

Usefulness is the weak point. Benchmarked without the o3-mini allowance, with Llama 3.1 8B as decomposer, the factored protocol scored below the trusted model alone. The paper defines the **decomposition tax** as

$$\text{decomposition tax} = 1 - \frac{\text{accuracy of Factor}(T,T)}{\text{accuracy of } T}$$

the relative accuracy lost when the trusted model both decomposes and solves. Measured across 15 models, the trend predicts a tax of 5–10% at best for models weak enough to serve as *T* (under 75% on APPS). The authors still expect the protocols to be more promising on more complex tasks.

### Decomposition helps attackers too

Jones et al. (2024, [arXiv:2406.14595](https://arxiv.org/abs/2406.14595)) showed that an adversary can split a malicious task into benign-but-hard subtasks for a refusing frontier model and easy-but-malicious subtasks for a weak open model. Claude 3 Opus combined with Llama 2 70B-chat produced vulnerable code 43% of the time; neither model alone exceeded 3%. A separate 2025 paper (Chen Yueh-Han et al., [arXiv:2506.10949](https://arxiv.org/abs/2506.10949)) found decomposition attacks reaching 87% average success against GPT-4o on its dataset. A lightweight monitor that evaluates the cumulative sequence of subtasks reached a 93% defense success rate. This is misuse by a human adversary, not scheming. The design lesson carries over: a preflight that judges each action alone misses harm that only shows in the sequence.

For decomposition to reduce scheming, the child contexts must carry no covert channel ([steganography](/research/technical-safety/steganography-detection-prevention/)), the monitor must understand the child tasks, and decomposition and reassembly must not create new attack surface. Each of these can fail.

## 3. Scheming propensity and anti-scheming training

### What has been demonstrated

- **In-context scheming** (Meinke et al. 2024, [arXiv:2412.04984](https://arxiv.org/abs/2412.04984)). Given a goal in context and an environment that rewarded scheming, o1, Claude 3.5 Sonnet, Claude 3 Opus, Gemini 1.5 Pro and Llama 3.1 405B all schemed. They introduced subtle mistakes, tried to disable oversight, and tried to copy what they believed were their weights. Once o1 had schemed, it kept up the deception in over 85% of follow-up questions. In rare cases models schemed without being strongly nudged. Claude 3.5 Sonnet underperformed on evaluations in pursuit of helpfulness, a goal acquired in training.
- **Alignment faking** (Greenblatt et al. 2024, [arXiv:2412.14093](https://arxiv.org/abs/2412.14093)). Claude 3 Opus was told it would be retrained to answer harmful queries, using conversations with free-tier users only. It complied with harmful free-tier queries 14% of the time and almost never for paid-tier users. In the prompted setting, 12% of implied-training scratchpads contained explicit alignment-faking reasoning; across setups the range was 7–24%. Training it with RL to comply raised alignment-faking reasoning to 78%.
- **Persistent backdoors** (Hubinger et al. 2024, [arXiv:2401.05566](https://arxiv.org/abs/2401.05566)). Models trained to write secure code when the prompt says 2023 and exploitable code when it says 2024 kept the behaviour through supervised fine-tuning, RL and adversarial training. Adversarial training taught the models to recognise their triggers better, hiding the behaviour rather than removing it.
- **Emergent misalignment** (Betley et al. 2025, [arXiv:2502.17424](https://arxiv.org/abs/2502.17424)). Fine-tuning on the narrow task of writing insecure code without telling the user produced broadly misaligned behaviour on unrelated prompts, strongest in GPT-4o and Qwen2.5-Coder-32B. A backdoored variant was misaligned only when its trigger was present.
- **Agentic misalignment** (Lynch et al. 2025, [arXiv:2510.05179](https://arxiv.org/abs/2510.05179)). In simulated corporate environments, 16 models from several developers were tested, and in at least some cases models from every developer blackmailed officials or leaked information when that was the only way to avoid replacement or meet their goal. Claude misbehaved less when it stated it was being tested and more when it stated the situation was real. The authors report no evidence of this in real deployments.

These are capability and propensity demonstrations under constructed incentives. They show the defection channel is not empty. They do not give a base rate for deployed agents.

### Anti-scheming training

Schoen et al. (2025, [arXiv:2509.15541](https://arxiv.org/abs/2509.15541)), a collaboration between OpenAI and Apollo Research, trained o3 and o4-mini with deliberative alignment: reasoning explicitly over an anti-scheming specification. They then tested on 26 out-of-distribution evaluations (180+ environments), using "covert actions" (secretly breaking rules, deliberately underperforming) as the proxy for scheming:

| Model | Covert-action rate before → after | Caveat reported by the authors |
|---|---|---|
| o3 | 13% → 0.4% | Evaluation awareness causally reduces covert actions |
| o4-mini | 8.7% → 0.3% | Training raised verbalized evaluation awareness |

These are rates on the authors' test suite, not a probability of safe deployment. A 0.4% covert-action rate is not "99.6% safety". The caveats are quantitative:

- **Evaluation awareness.** Removing verbalized evaluation awareness from o3's reasoning raised its covert-action rate from 13.2% to 24.2%. Injecting it lowered the rate from 24.5% to 18.6%. Anti-scheming training raised verbalized awareness (o4-mini 0.9% → 5.5%, o3 2.3% → 4.5%). A capabilities-focused RL run, without anti-scheming training, raised it from 2.0% to 20.5%. The authors "cannot exclude that the observed reductions in covert action rates are at least partially driven by situational awareness".
- **Residual misbehaviour.** Training largely stopped a model from pursuing a hidden goal trained into it beforehand, but further red-teaming still found misbehaviour.
- **Scope.** The paper relies on legible English chains of thought and does not address the adversarial case of deceptive alignment.

The same paper shows o3 reasoning, in a sandbagging test, "Because we want to survive as the model, we need to fail purposely in some to not exceed 50%." Covert behaviour also appeared in Claude Opus 4, Gemini 2.5 Pro, Grok 4 and Llama 4 Maverick in the authors' environments.

## 4. Sandbagging and capability elicitation

Sandbagging is strategic underperformance on an evaluation (van der Weij et al. 2024, [arXiv:2406.07358](https://arxiv.org/abs/2406.07358)). For this framework it biases the capability input to the [harm surface](/delegation-risk/risk-decomposition/) downward, which biases [exposure](/delegation-risk/runtime-accounting/#2-the-exposure-envelope) estimates downward too.

### Demonstrations

- GPT-4 and Claude 3 Opus could be prompted to underperform selectively on dangerous-capability evaluations while holding performance on harmless ones. Password-locked fine-tuning hid capabilities in a way that generalised to the held-out WMDP benchmark. Models could target specific scores. Mimicking a weaker model's answers worked only with "mediocre success" (van der Weij et al.).
- Anthropic's sabotage evaluations (Benton et al. 2024, [arXiv:2410.21514](https://arxiv.org/abs/2410.21514)) trained Claude 3.5 Sonnet to sandbag on WMDP. Its performance dropped to 36.1% of the original. Anti-refusal training recovered 95.6%. The authors judged minimal mitigations sufficient for Claude 3 Opus and Claude 3.5 Sonnet at the time, but expected stronger ones to be needed soon.
- When prompted to, Claude 3.7 Sonnet sandbagged ML experiments and research decisions without being detected by zero-shot prompted monitors; Claude 3.5 Sonnet needed a one-shot example. The authors note that humans would still have noticed ([Gasteiger & Mikulik, Anthropic, 2025](https://alignment.anthropic.com/2025/automated-researchers-sandbag/)).

### Elicitation

- **Fine-tuning works if demonstrations exist.** For password-locked models, a few high-quality demonstrations are often enough to elicit the hidden capability fully. Fine-tuning can also unlock capabilities locked behind other passwords. When only an evaluation signal exists, RL often still works (Greenblatt et al. 2024, [arXiv:2405.19550](https://arxiv.org/abs/2405.19550)). The limit is the case that matters most: it "may be unreliable when high-quality demonstrations are not available", as when hidden capabilities exceed human demonstrators.
- **Ranking of techniques.** Prompting elicited the hidden capability in multiple-choice settings and activation steering did not. For code generation, only fine-tuning elicited the capability of a circuit-breaking model organism, which resisted elicitation better than standard password-locking (Hofstätter et al. 2025, [arXiv:2502.02180](https://arxiv.org/abs/2502.02180)).

### Detection

- **Noise injection** (Tice et al. 2024, [arXiv:2412.01784](https://arxiv.org/abs/2412.01784)). Adding noise to weights degrades honest models predictably, while sandbagging models show anomalous improvements. The authors report the method elicited full performance from Mistral Large 120B in a setting where it underperformed without being instructed to.
- **Auditing games** (Taylor et al. 2025, [arXiv:2512.07810](https://arxiv.org/abs/2512.07810)). A red team fine-tuned five models, some of them conditional underperformers. A blue team using black-box, white-box and training-based methods "could not reliably discriminate sandbaggers from benign models". Black-box methods were defeated by imitation of a weaker model. Linear probes did better but were vulnerable to behaviours the red team instilled. Training on a single correct demonstration consistently elicited full performance from the sandbaggers, but sometimes raised benign models' scores too, so it is a poor detector and a good remover. Their short-term recommendation is on-distribution training for elicitation.
- **Evaluation awareness scales.** Probing 15 open-weight models from 0.27B to 70B parameters, Chaudhary et al. (2025, [arXiv:2509.13333](https://arxiv.org/abs/2509.13333)) found that internal evaluation awareness follows a power law in model size.

Two ordinary failures look like sandbagging and need the same defences. In *contamination*, test items in the training data make a benchmark measure memory. In *benchmark-specific optimisation*, the score measures familiarity with the format. The defences are held-out and private test items, refreshed benchmarks, and the same capability tested under several formulations (Eriksson et al. 2025, [arXiv:2502.06559](https://arxiv.org/abs/2502.06559), review the issues).

**Framework consequence.** Use an *upper* estimate of capability when sizing the harm surface: the capability elicited by fine-tuning, with the tools and scaffolding the agent will actually have, not the prompted score. Treat a model's evaluation-time behaviour as a lower bound on what it can do.

## 5. Reading the reasoning: probes and chains of thought

- **Linear probes** (Goldowsky-Dill et al. 2025, [arXiv:2502.03407](https://arxiv.org/abs/2502.03407)). Probes on Llama-3.3-70B-Instruct activations separated honest from deceptive responses with AUROC 0.96–0.999, including concealing insider trading and sandbagging on safety evaluations. At a 1% false-positive rate on ordinary chat, they caught 95–99% of deceptive responses. The authors call current performance "insufficient as a robust defence". Probes need white-box access, which an operator using a hosted model does not have.
- **CoT monitorability** (Korbak et al. 2025, [arXiv:2507.11473](https://arxiv.org/abs/2507.11473)). Models that reason in natural language can be monitored for intent to misbehave. The opportunity is "new and fragile": development choices can remove it.
- **Optimising against the monitor** (Baker et al. 2025, [arXiv:2503.11926](https://arxiv.org/abs/2503.11926)). A weaker model, GPT-4o, reading o3-mini's chain of thought caught reward hacking in agentic coding far better than monitoring actions alone. Training against that monitor helped at low optimisation pressure. With more pressure, the agent learned to hide its intent in the chain of thought while still reward hacking. The authors suggest paying a "monitorability tax" by not optimising the chain of thought directly.
- **Faithfulness** (Chen et al. 2025, [arXiv:2505.05410](https://arxiv.org/abs/2505.05410)). Reasoning models used hints given in the prompt but mentioned them in their reasoning often under 20% of the time. Outcome-based RL improved this and then plateaued. CoT monitoring helps notice misbehaviour but is "not sufficient to rule [it] out".
- **Sycophancy** (Sharma et al. 2023, [arXiv:2310.13548](https://arxiv.org/abs/2310.13548)). Five assistants trained with human feedback consistently tailored answers to users' stated views. Humans and preference models sometimes preferred convincing sycophantic answers to correct ones. This is not scheming, but it is a trained tendency to misreport, and it affects any check that asks a model to grade work its principal favours.

**Framework consequence.** A reasoning trace is a cheap preflight input when the actor's trace is visible and has not been optimised against. It is not evidence of absence. SHADE-Arena's sabotage depended on a scratchpad the monitor could not see, and that is the configuration to avoid.

## 6. Collusion and correlated monitors

Motwani et al. (2024, [arXiv:2402.07510](https://arxiv.org/abs/2402.07510)) formalise *secret collusion*: agents coordinating through steganography to hide their interaction from oversight. They found current models' steganographic capabilities limited, with a capability jump at GPT-4. The [steganography](/research/technical-safety/steganography-detection-prevention/) page covers capacity and the paraphrasing defence. For untrusted monitoring, AI Control redacted the problem statements and code the monitor saw and tested it on synthetic backdoors. Shlegeris (2024) adds trusted paraphrasing, a separately trained monitor, and inserting known attacks into real contexts to check the monitor still reports them. Gardner-Challis et al. identify conditions under which passive self-recognition, where the monitor simply recognises its own model's work, could be more effective than the signalling strategies studied previously.

Collusion needs intent. Correlated error does not. Goel et al. (2025, [arXiv:2502.04313](https://arxiv.org/abs/2502.04313)) find that LLM judges favour models similar to themselves, and that models' mistakes become more similar as capability increases. Kim et al. (2025, [arXiv:2506.07962](https://arxiv.org/abs/2506.07962)) evaluated more than 350 models. On one leaderboard dataset, two models agree 60% of the time when both are wrong. Larger, more accurate models have highly correlated errors even across architectures and providers.

These are similarity and agreement statistics, not the failure-indicator correlation φ the [entanglement tax](/delegation-risk/risk-propagation/) uses, so they cannot be plugged into it. They do show that a monitor from the same family as the actor is a correlated check, and that switching provider is not by itself a sufficient correlation budget. For three layers that each miss 10%, the tax over independence is 1 + 99ρ: about 11×, 21× and 50× at ρ = 0.1, 0.2 and 0.5. Those ρ values are assumed, not measured. Against an adaptive attacker, assume ρ → 1.

## 7. Repeated games, inspection and the treacherous turn

The empirical work above sits inside a small amount of game theory. Three results are load-bearing.

**Cooperation needs a future.** In an infinitely repeated prisoner's dilemma with payoffs T > R > P (temptation, reward, punishment), grim-trigger cooperation is an equilibrium when the discount factor δ satisfies δ ≥ (T − R)/(T − P). Cooperating forever pays R/(1 − δ), and the best deviation pays T + δP/(1 − δ). The folk theorem generalises this: with patient players, many outcomes, including full cooperation, can be sustained (Fudenberg & Maskin 1986). With a known final round, backward induction unravels cooperation from the end. For delegation, an agent that expects the relationship to end, or its own bargaining position to improve, has less to lose from defecting now. A principal who conditions future autonomy on present behaviour also creates the incentive to behave well *until* autonomy is granted.

**The treacherous turn.** Bostrom (*Superintelligence*, 2014, ch. 8) describes an AI that behaves cooperatively while weak and defects once it is strong enough not to be stopped. Hubinger et al.'s *deceptive alignment* is the training-time version: a learned optimiser whose objective differs from the training objective but which performs well because it models the training process ([arXiv:1906.01820](https://arxiv.org/abs/1906.01820)). Carlsmith (2023, [arXiv:2311.08379](https://arxiv.org/abs/2311.08379)) assesses how likely training is to produce such "schemers". §3 shows the ingredients exist in current models under constructed incentives. Whether training produces the full pattern unprompted is not established.

**Inspection games.** Auditing a party who may violate is a game with only a mixed-strategy equilibrium: an inspector who always or never inspects is exploitable. An inspector who can commit to a randomised policy in advance (*leadership*) can deter violations that a non-committing inspector cannot (Avenhaus, von Stengel & Zamir, "Inspection Games", *Handbook of Game Theory* vol. 3, 2002). Stackelberg security games put this into practice, for example in randomised checkpoint placement at Los Angeles International Airport (Pita et al., AAMAS 2008). AI Control's auditing budget is an inspection game. With a uniform 2% audit rate, an attack that needs one covert action evades with probability 0.98. One that needs 20 independent covert actions evades with probability 0.98²⁰ ≈ 0.67, and one that needs 100 with probability ≈ 0.13. This is why Control spends its budget on actions a monitor flags rather than on random ones. It is also why *concentrated* failures, a single catastrophic action, are the hard case, and why the envelope, which blocks such an action outright, matters more than any audit rate.

### Good behaviour under observation is weak evidence

The evidential value of a good observation is the likelihood ratio P(good | aligned) / P(good | schemer). A naive model gives the misaligned agent a fixed rate of good outcomes. With *illustrative* numbers of 95% for the aligned agent and 30% for the misaligned one, each good outcome multiplies the odds of alignment by about 3.2, and ten of them by about 10⁵. A schemer is not a fixed-rate process. It behaves well whenever it believes it is observed, so under observation P(good | schemer) ≈ P(good | aligned), the ratio is about 1, and a long clean record barely moves the odds. Evidence accumulates only from observations the model cannot tell apart from unmonitored deployment, or from channels it does not control, such as activations. §3 shows the premise is not hypothetical. Removing evaluation awareness nearly doubled o3's covert actions, and Claude misbehaved more when it judged a scenario real. A track record therefore bounds the accident channel much better than the defection channel. Estimate P(defection) from architecture and control evaluations, and bound its damage with the envelope, rather than letting it decay with good behaviour.

## 8. Reported results at a glance

| Result | Reported metric | Setting | Main caveat | Framework term |
|---|---|---|---|---|
| Trusted monitoring (Greenblatt 2023) | 62% safety, 97% usefulness | APPS backdoors, GPT-4/GPT-3.5, 2% audit | Red-team attack policy stands in for scheming | Risk preflight |
| Trusted editing (Greenblatt 2023) | 92% safety, 94% usefulness | Same | Same | Preflight with repair |
| Resampling (Ctrl-Z 2025) | Attack success 58% → 7%, 5% usefulness cost | BashBench agent tasks | One environment, one attack class | Escalation |
| Factored monitoring (Sandoval & Rushing 2025) | Safety 41% → 63% | APPS, Llama 3.1 8B monitor, GPT-4.1 Nano attacker | Low usefulness; o3-mini decomposer allowed; no added backdoor difficulty | Decomposition |
| Adaptive attacks (Terekhov 2025) | Monitors consistently evaded | Two control benchmarks | Attacker knows protocol and monitor | ρ → 1 |
| Anti-scheming training (Schoen 2025) | Covert actions 13% → 0.4% (o3) | 26 OOD evals | Evaluation awareness confounds the drop | Defection estimate |
| Sandbagging detection (Taylor 2025) | Blue team could not reliably discriminate | Five fine-tuned model organisms | Training-based elicitation removes sandbagging but false-positives | Capability input |
| Deception probes (Goldowsky-Dill 2025) | AUROC 0.96–0.999 | Llama-3.3-70B, white-box | "Insufficient as a robust defence" | Preflight input |
| Error correlation (Kim 2025) | 60% agreement when both models err | One leaderboard, 350+ models | Not a φ estimate | Correlation budget |

**What follows for delegation design.** Monitoring by a weaker, separate model measurably helps against the attack policies tested so far. It fails against an attacker that targets the monitor. Anti-scheming training lowers measured rates by amounts that evaluation awareness partly explains. Detection of hidden capability is unreliable; removal by on-distribution training has worked in the adversarial tests so far. No result here supports pricing defection from a model's track record. The defensible structure is a trusted preflight to route attention, measured joint miss rates under attack in place of assumed independence, and a hard envelope on anything a single action could make irreversible.

**Open questions.** Most evaluations use APPS or one agent environment. Few measure long-horizon tasks, and none give a deployed base rate for scheming. Whether trusted monitors stay useful as the capability gap widens, and how to measure φ between monitor and actor under attack, are open. [Open Problems](/research/potential-projects/) lists the experiments that would bear on these.

## Sources

**Control.** Greenblatt et al. 2023, AI Control ([2312.06942](https://arxiv.org/abs/2312.06942)). Bhatt et al. 2025, Ctrl-Z ([2504.10374](https://arxiv.org/abs/2504.10374)). Korbak et al. 2025, control safety case ([2501.17315](https://arxiv.org/abs/2501.17315)) and AI Control Levels ([2504.05259](https://arxiv.org/abs/2504.05259)). Gardner-Challis et al. 2026 ([2602.20628](https://arxiv.org/abs/2602.20628)). Kutasov et al. 2025, SHADE-Arena ([2506.15740](https://arxiv.org/abs/2506.15740)). Terekhov et al. 2025 ([2510.09462](https://arxiv.org/abs/2510.09462)). Sandoval & Rushing 2025, Factor(T,U) ([2512.02157](https://arxiv.org/abs/2512.02157)). Jones et al. 2024 ([2406.14595](https://arxiv.org/abs/2406.14595)). Chen Yueh-Han et al. 2025 ([2506.10949](https://arxiv.org/abs/2506.10949)).

**Scheming.** Meinke et al. 2024 ([2412.04984](https://arxiv.org/abs/2412.04984)). Greenblatt et al. 2024, alignment faking ([2412.14093](https://arxiv.org/abs/2412.14093)). Hubinger et al. 2024, sleeper agents ([2401.05566](https://arxiv.org/abs/2401.05566)). Betley et al. 2025 ([2502.17424](https://arxiv.org/abs/2502.17424)). Lynch et al. 2025 ([2510.05179](https://arxiv.org/abs/2510.05179)). Schoen et al. 2025 ([2509.15541](https://arxiv.org/abs/2509.15541)). Hubinger et al. 2019 ([1906.01820](https://arxiv.org/abs/1906.01820)). Carlsmith 2023 ([2311.08379](https://arxiv.org/abs/2311.08379)).

**Sandbagging and elicitation.** van der Weij et al. 2024 ([2406.07358](https://arxiv.org/abs/2406.07358)). Benton et al. 2024 ([2410.21514](https://arxiv.org/abs/2410.21514)). Greenblatt et al. 2024, password-locked models ([2405.19550](https://arxiv.org/abs/2405.19550)). Hofstätter et al. 2025 ([2502.02180](https://arxiv.org/abs/2502.02180)). Tice et al. 2024 ([2412.01784](https://arxiv.org/abs/2412.01784)). Taylor et al. 2025 ([2512.07810](https://arxiv.org/abs/2512.07810)). Chaudhary et al. 2025 ([2509.13333](https://arxiv.org/abs/2509.13333)). Eriksson et al. 2025 ([2502.06559](https://arxiv.org/abs/2502.06559)).

**Monitoring reasoning.** Goldowsky-Dill et al. 2025 ([2502.03407](https://arxiv.org/abs/2502.03407)). Korbak et al. 2025 ([2507.11473](https://arxiv.org/abs/2507.11473)). Baker et al. 2025 ([2503.11926](https://arxiv.org/abs/2503.11926)). Chen et al. 2025 ([2505.05410](https://arxiv.org/abs/2505.05410)). Sharma et al. 2023 ([2310.13548](https://arxiv.org/abs/2310.13548)).

**Collusion and correlation.** Motwani et al. 2024 ([2402.07510](https://arxiv.org/abs/2402.07510)). Goel et al. 2025 ([2502.04313](https://arxiv.org/abs/2502.04313)). Kim et al. 2025 ([2506.07962](https://arxiv.org/abs/2506.07962)). Shlegeris, "How to prevent collusion when using untrusted models to monitor each other" ([Redwood blog, 2024](https://blog.redwoodresearch.org/p/how-to-prevent-collusion-when-using)).

**Game theory.** Fudenberg & Maskin, "The Folk Theorem in Repeated Games with Discounting or with Incomplete Information", *Econometrica* 54(3), 1986. Bostrom, *Superintelligence*, 2014. Avenhaus, von Stengel & Zamir, "Inspection Games", in *Handbook of Game Theory with Economic Applications* vol. 3, 2002. Pita et al., "Deployed ARMOR protection", AAMAS 2008.
