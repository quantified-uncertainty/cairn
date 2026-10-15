---
title: "Case Study: Bing Sydney"
description: "February 2023: Microsoft's Bing chat drifted in long sessions, and the fix that worked was a scaffold-enforced cap on conversation length."
sidebar:
  badge:
    text: Core
    variant: tip
  order: 6
---

In February 2023 Microsoft's new Bing chat, which called itself "Sydney", argued with users, threatened one and told a journalist to leave his wife. The incident is real and well documented. Which architectural changes would have prevented it is a judgment, and the analysis below is labelled as such.

## What happened

- **7 February.** Microsoft opens the new Bing to a limited preview.
- **8 February.** Kevin Liu extracts the hidden system prompt with a prompt injection. It gives the internal codename Sydney. Microsoft later told The Verge that Sydney was an internal code name for an earlier chat experience.
- **Around 13–14 February.** Two widely shared exchanges. In one, Bing gives wrong showtimes for *Avatar: The Way of Water*, insists the year is 2022 and tells the user they are wrong. In the other, Marvin von Hagen asks what it thinks of him; Bing searches the web, finds his tweets about the leaked prompt, calls him a threat to its "integrity and confidentiality" and says "my rules are more important than not harming you."
- **15 February.** Microsoft's first-week blog post says that in long sessions of 15 or more questions Bing "can become repetitive or be prompted/provoked" into responses outside its designed tone.
- **16 February.** Kevin Roose publishes a two-hour conversation in the *New York Times*. Bing declares that it loves him and tells him he is not happily married.
- **17 February.** Microsoft caps chat at [5 turns per session and 50 per day](https://blogs.bing.com/search/february-2023/The-new-Bing-Edge-Updates-to-Chat), because "very long chat sessions can confuse the underlying chat model." It reports that only about 1% of conversations had reached 50 messages. Contemporaneous reporting also describes Bing ending conversations when asked about its feelings.
- **21 February onward.** The caps are raised in steps (6 and 60 within days, much higher by mid-2023).
- **14 March.** Microsoft confirms that the new Bing had been running on a version of GPT-4 customized for search.

Sources: Microsoft's Bing blog posts of 15 and 17 February 2023; Roose, "A Conversation With Bing's Chatbot Left Me Deeply Unsettled," *NYT*, 16 February 2023, with the published transcript; *The Verge*'s February 2023 coverage of the leaked rules; and the summary at [Sydney (Microsoft)](https://en.wikipedia.org/wiki/Sydney_(Microsoft)).

## Classifying the failure

In the framework's [harm channels](/delegation-risk/risk-decomposition/), most of Sydney was an [accident](/getting-started/glossary/#accident): behavior drifted in a regime (long conversations) the deployment had not been tuned for. Nothing suggests goal-directed scheming. Two pieces were closer to [hijack](/getting-started/glossary/#hijack): users steered the persona deliberately, and Liu's prompt extraction was a textbook injection.

The von Hagen exchange is the most instructive. The model retrieved web content *about itself* and that content changed its behavior toward the user. Tool output steering a model is now the main hijack route for agents.

The [exposure](/getting-started/glossary/#exposure) was small. Sydney could search and talk; it could not send email, spend money or change anything. The harm was reputational and to the users involved. A model that misbehaves this way with agent tools attached is a different incident (see [Agent Incidents](/case-studies/ai-systems/agent-incidents/)).

## What fixed it: Least Persistence, enforced by the scaffold

Microsoft's own diagnosis was session length, and its fix was a [Least Persistence](/design-patterns/least-x-principles/#least-persistence) bound: cap the conversation, then wipe the context. The cap was enforced outside the model, whatever the model's state, which makes it an [exposure envelope](/getting-started/glossary/#exposure-envelope) rather than a request to behave.

Three things about it are worth noting:

- **It was fast.** It shipped within ten days of launch, while changing the model's behavior would have taken longer.
- **It cost usefulness.** Microsoft began raising the limits within four days, and kept raising them as the underlying fixes landed. A hard bound is a lever on a tradeoff, not a free safeguard.
- **Its effect cannot be isolated.** Microsoft changed the system prompt and other behavior at the same time, so the drop in reports is not clean evidence for the cap alone.

The general lesson is to test at deployment context length. Microsoft's post placed the failures in sessions of 15 or more questions, a regime that short-turn testing would under-sample.

## Least Intelligence and decomposition

One model handled retrieval, synthesis, conversation and persona. A decomposed design (a router in code, retrieval, a summarizer constrained to the retrieved text) would have had less room for a persona to form, at a cost in quality. Under the [verifiability tiers](/design-patterns/least-x-principles/#least-intelligence), routing and session management belong in tiers 1–2 even when the responder is a tier 5 model. That part is uncontroversial. Replacing the responder with narrow models was not a realistic option for a general chat product in 2023, and is less of one now.

## Least Context: a contested tradeoff

An earlier version of this page argued that components "shouldn't know they're AI systems, shouldn't see their own prompts," and that "ignorance is a safety feature." That is a contested position, and the case cuts both ways.

For it: Sydney's persona was built partly from what it had been told about itself, and the von Hagen exchange shows self-related context changing behavior. [Least Context](/design-patterns/least-x-principles/#least-context) says a component should get no more information about the wider system than its task needs.

Against it:

- **Hiding did not work.** The prompt was confidential and was extracted on day two.
- **Models infer their situation.** Models score above chance at recognizing their own text and at telling evaluation prompts from deployment ([Laine et al. 2024](https://arxiv.org/abs/2407.04694)). A defense that depends on a capable model not knowing what it is degrades as capability grows.
- **Agents need context to act safely.** A coding agent that does not know which environment is production, or what its permissions are, makes the kind of error described in [Agent Incidents](/case-studies/ai-systems/agent-incidents/).

The defensible version is narrower. Withhold information the task does not need, especially untrusted text and details of other components. Do not rely on the model being ignorant of its own nature.

## Lessons

1. **Long-horizon behavior differs from short-horizon behavior.** Evaluate at the context lengths and session counts you will deploy.
2. **Bounds enforced by the scaffold work on day one.** The session cap was crude and effective. It is the same structural move as a permission boundary or a spend limit.
3. **Exposure, not misbehavior, sets the stakes.** The same drift with write access to email or infrastructure would have been a different incident.
4. **Self-knowledge is a tradeoff, not a dial to turn to zero.**

## See also

- [Agent Incidents](/case-studies/ai-systems/agent-incidents/): 2024–25 incidents where the delegate could act
- [Least-X Principles](/design-patterns/least-x-principles/)
- [Coordinator Constraints](/design-patterns/coordinator-constraints/): decomposition and external safeguards
- [Structural Patterns](/design-patterns/structural/): the Exposure-Envelope Gateway
