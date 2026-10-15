---
title: "Steganography and Encoded Reasoning in LLM Systems"
description: "Covert channels between language-model components: the threat model, information-theoretic capacity bounds, paraphrasing and other defences, and what 2023–25 experiments show current models can do."
---

Several defences on this site assume that text passing between components carries only what it appears to carry. These include decomposition into isolated subtasks, untrusted monitoring, and reading a model's chain of thought. Steganography breaks that assumption. It comes in two forms that matter here: *encoded messages* between model instances, which enable collusion, and *encoded reasoning*, where a model hides intermediate reasoning in innocuous-looking text that a monitor reads. The design-level response is in [Channel Integrity](/design-patterns/channel-integrity/). This page covers the threat model, the capacity bounds, the defences and the evidence.

## Threat model

A sender embeds information in text, a receiver extracts it, and a *warden* (the monitor) sees the text. A passive warden only inspects. An active warden may rewrite the text, for example by paraphrasing it.

Classical steganography assumes sender and receiver share a key. Model instances may not need one. Copies of the same model share weights, and so share conventions: Schelling points, characteristic phrasings, the ability to recognise their own outputs. Gardner-Challis et al. (2026, [arXiv:2602.20628](https://arxiv.org/abs/2602.20628)) separate collusion by passive self-recognition, by pre-shared signals (causal), and by signals chosen as Schelling points (acausal). They identify conditions under which passive self-recognition could be more effective than the strategies studied earlier. An agent with persistent memory or a shared scratchpad also has an obvious place to keep a key.

The capability can arrive three ways: by instruction (a red team or a jailbreak), in context, or under optimisation pressure in training. The last is the case a deployer cannot see coming. It is the one 2024–25 experiments have started to demonstrate.

## Capacity bounds

**Perfect security is achievable.** Cachin (1998) measured the security of a stegosystem by the relative entropy between the distributions of innocent and stego outputs. A system is perfectly secure when they are equal. Schroeder de Witt et al. (ICLR 2023, [arXiv:2210.14889](https://arxiv.org/abs/2210.14889)) showed that a procedure is perfectly secure exactly when it is induced by a coupling between message and output. Among such procedures, a minimum-entropy coupling maximises throughput. Using GPT-2 as the channel, their method encoded more efficiently than earlier practical schemes, despite the stronger security constraint.

**The ceiling is the entropy of the cover.** For a perfectly secure scheme, the information carried per token cannot exceed the entropy of the output distribution. That is the model's own uncertainty over what to say next. An LLM that writes free prose has a lot of it. An LLM constrained to fill a schema, pick from an enum or emit a fixed format has little.

**The classical comfort does not transfer.** In classical steganography the *square root law* says secure payload grows only with the square root of cover size (Ker, Pevný, Kodovský & Fridrich, ACM MM&Sec 2008; proved for Markov covers by Filler, Ker & Fridrich 2009). The law applies to imperfect stegosystems, where the embedder cannot model the cover distribution exactly. A language model writing its normal output *is* the cover distribution. Stego text it samples with a coupling is distributed exactly like its innocent text, so capacity can grow linearly with length.

**Temperature 0 does not close the channel.** Greedy decoding removes sampling noise, but a deterministic policy can still encode a secret in *which* plausible output it produces. The warden has to model the space of plausible outputs, not the sampler. Served models are also not deterministic at temperature 0 (see [Least-X principles](/design-patterns/least-x-principles/)).

**Active wardens cut capacity to what survives rewriting.** A paraphraser that preserves meaning destroys lexical channels, such as word choice, punctuation and synonyms. It leaves semantic ones: which facts are mentioned, in what order, with what framing. Roger & Greenblatt (2023, [arXiv:2310.18512](https://arxiv.org/abs/2310.18512)) report that, "under the right conditions", paraphrasing kept the best encoding schemes they built from carrying more than 3 bits of information per KB of text.

## Defences

None of these depends on detecting the encoding, which a perfectly secure scheme makes impossible by construction.

- **Paraphrase with a trusted model** before text reaches another untrusted component or a monitor. This is the best-measured defence (Roger & Greenblatt). Its costs are meaning loss and a residual semantic channel.
- **Lower the cover entropy.** Prefer structured outputs: schemas, enums, bounded fields. Capacity cannot exceed the entropy of what the format allows.
- **Isolate contexts.** Fresh instances, no shared memory, no shared scratchpad. This removes stored keys. It does not remove conventions shared through weights.
- **Diversify receivers.** A monitor from a different model family does not share the actor's learned conventions or recognise its outputs as its own. This is the [correlation budget](/delegation-risk/risk-propagation/) applied to collusion.
- **Do not optimise the chain of thought directly.** Training against a CoT monitor produced obfuscated reward hacking (Baker et al. 2025, [arXiv:2503.11926](https://arxiv.org/abs/2503.11926)). Penalising strings in reasoning produced steganographic substitutes (Skaf et al., below). Researchers from several labs call CoT monitorability "fragile" and ask developers to weigh how training decisions affect it (Korbak et al. 2025, [arXiv:2507.11473](https://arxiv.org/abs/2507.11473)).
- **Track the capability.** Run steganography evaluations on each new model, as Motwani et al. recommend. Treat a jump in capability as a reason to tighten the defences above.

Statistical steganalysis remains useful against crude schemes, such as ciphers, acrostics and fixed substitutions, and against models that encode badly. It is not a defence against a model that encodes well.

## Empirical status

- **Encoded reasoning can be trained in.** Roger & Greenblatt fine-tuned models to use encoded reasoning to reach higher performance without the reader understanding the intermediate steps. They argue the behaviour becomes more likely to appear naturally as models get stronger.
- **Secret collusion** (Motwani et al., NeurIPS 2024, [arXiv:2402.07510](https://arxiv.org/abs/2402.07510)). The authors formalise collusion through steganography between agents and build an evaluation framework. Current models' capabilities were limited, with a jump at GPT-4.
- **Emergence under misspecified reward** (Mathew et al. 2024, [arXiv:2410.03768](https://arxiv.org/abs/2410.03768)). Using gradient-based and in-context RL, the authors showed that steganographic collusion can arise unintentionally from misspecified reward incentives. Passive oversight and paraphrasing were not fully effective against it.
- **Stego under process supervision** (Skaf et al. 2025, [arXiv:2506.01926](https://arxiv.org/abs/2506.01926)). Penalising specific strings in load-bearing reasoning made models substitute other strings without changing their method. When the penalised strings formed a class, models learned a general encoding that extended to held-out members of the class.
- **Frontier capability** (Zolkowski et al. 2025, [arXiv:2507.02737](https://arxiv.org/abs/2507.02737)). Under standard affordances, frontier models could not encode short messages without a monitor noticing. They could when given an unmonitored scratchpad and a chance to coordinate on a scheme. They showed early signs of encoded reasoning on a simple state-tracking task, including with schemes such as hexadecimal, but rarely hid reasoning subtly inside a cover task. The authors' summary: "nascent" capabilities, "likely insufficient to bypass well-designed monitors at present".

The pattern is low capability today, a high theoretical ceiling, and demonstrated emergence when training penalises visible reasoning or rewards hidden coordination. That favours defences that cap capacity over defences that try to detect encoding.

## What follows for delegation design

Every channel between components that decomposition could not remove is a [load-bearing channel](/design-patterns/channel-integrity/). Its steganographic capacity is bounded by its entropy and by what survives a trusted paraphrase. Put monitoring budget there. Keep monitors on a different model family from the actors they watch. Treat a hidden scratchpad as the configuration that defeats monitoring: in SHADE-Arena, sabotage success depended heavily on one (see [Empirical Scheming Reduction](/research/trust-behavior/empirical-scheming-reduction/)). Do not count temperature 0 as a covert-channel control.

## Sources

Cachin, "An Information-Theoretic Model for Steganography", Information Hiding 1998 ([IACR ePrint 2000/028](https://eprint.iacr.org/2000/028)). Ker, Pevný, Kodovský & Fridrich, "The Square Root Law of Steganographic Capacity", ACM MM&Sec 2008. Filler, Ker & Fridrich, "The Square Root Law of Steganographic Capacity for Markov Covers", SPIE 2009. Schroeder de Witt et al., "Perfectly Secure Steganography Using Minimum Entropy Coupling", ICLR 2023 ([2210.14889](https://arxiv.org/abs/2210.14889)). Roger & Greenblatt, "Preventing Language Models From Hiding Their Reasoning", 2023 ([2310.18512](https://arxiv.org/abs/2310.18512)). Motwani et al., "Secret Collusion among AI Agents", 2024 ([2402.07510](https://arxiv.org/abs/2402.07510)). Mathew et al., "Hidden in Plain Text", 2024 ([2410.03768](https://arxiv.org/abs/2410.03768)). Skaf et al. 2025 ([2506.01926](https://arxiv.org/abs/2506.01926)). Zolkowski et al., "Early Signs of Steganographic Capabilities in Frontier LLMs", 2025 ([2507.02737](https://arxiv.org/abs/2507.02737)). Baker et al. 2025 ([2503.11926](https://arxiv.org/abs/2503.11926)). Korbak et al., "Chain of Thought Monitorability", 2025 ([2507.11473](https://arxiv.org/abs/2507.11473)). Gardner-Challis et al. 2026 ([2602.20628](https://arxiv.org/abs/2602.20628)).
