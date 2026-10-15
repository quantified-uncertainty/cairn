---
title: "Information Patterns"
description: "Need-to-know compartments as context and capability separation against prompt injection, selective amnesia for agent memory, caches and logs, and expiring grants with one renewal rule"
sidebar:
  order: 3
---

Information patterns control what an agent knows and how long its access lasts. For LLM agents the data an agent reads and the instructions it follows arrive through the same channel, the context window, so controlling information also controls instructions. [Expiring Grants](#expiring-grants) is the time dimension of the same control.

## Need-to-Know Compartments

Give each task access only to the data categories it needs, filtered to the fields it needs. Classify data at its source, put unclassified data in the most restricted compartment, and make cross-compartment access an explicit, logged, approved request that returns a filtered or derived view rather than raw records. The aim is to bound what a compromised or mistaken agent can leak, and to stop it assembling a sensitive picture from pieces that are each harmless.

For agents, the compartment boundary that matters most runs between trusted instructions and untrusted data. An agent that reads a web page, email, document or tool result can be instructed by it. This is the hijack channel, and for agents that read untrusted content it is the most practical threat ([Risk Decomposition](/delegation-risk/risk-decomposition/)). Simon Willison's ["lethal trifecta"](https://simonwillison.net/2025/Jun/16/the-lethal-trifecta/) (June 2025) names the combination that turns injection into data theft: access to private data, exposure to untrusted content, and the ability to communicate externally. Compartmentalization breaks the trifecta by never giving one context all three. Meta's ["Agents Rule of Two"](https://ai.meta.com/blog/practical-ai-agent-security/) (October 2025) states it as a session rule: process untrusted input, access sensitive systems or data, change state or communicate externally, and hold at most two in one session. A session that needs all three should not run autonomously.

Two published designs do this architecturally. In CaMeL ([Debenedetti et al. 2025](https://arxiv.org/abs/2503.18813)), the control and data flow are extracted from the trusted user query alone, so data retrieved from untrusted sources cannot change the program's flow. Values carry capability labels, and a policy checked at each tool call blocks flows such as private data to an unapproved recipient. On the AgentDojo benchmark CaMeL solved 77% of tasks with provable security, against 84% for an undefended agent. [Beurer-Kellner et al. (2025)](https://arxiv.org/abs/2506.08837) catalogue related design patterns for prompt-injection resistance and their utility costs. The shared principle is that untrusted data may fill in values but may not choose actions.

**Prior art.** Need-to-know and compartmented clearances; least privilege (Saltzer & Schroeder 1975); data minimization; information-flow control and taint tracking.

**What is different for 2026 agents.** In human organizations, compartments protect data from the people who read it. For agents they also protect the agent from the data it reads. Classification by provenance (who could have written this?) therefore matters as much as classification by sensitivity. Tool outputs, retrieved documents, MCP server responses and subagent results are untrusted by default unless everything upstream of them is trusted.

## Selective Amnesia

Use sensitive data for the step that needs it, then keep only a derived result: "identity verified" instead of the ID number, the last four digits, a category instead of a diagnosis, a range instead of a salary. Scope retention to the use: immediate for credentials, the end of the task for case data, a time limit for session state.

The hard part for agents is finding every place data persists. Dropping a variable does not remove its value from:

- the conversation history the agent keeps in context, and any summary of it;
- agent memory stores, scratch files and retrieval indexes written during the task;
- provider-side request logs and prompt caches, which follow the provider's retention policy, not yours;
- tool-server logs, observability traces and the [flight recorder](/design-patterns/monitoring/#flight-recorder).

Map these stores before deployment and choose a policy for each. Either do not send the data (redact it before the model sees it), send it but do not persist it (zero-retention settings where offered, no memory writes), or persist it with an expiry. Encrypting stored data under a key you can destroy turns later deletion into deleting the key.

**Prior art.** Data minimization and storage limitation (GDPR Art. 5(1)(c) and (e)); tokenization of card numbers; crypto-shredding.

**What is different for 2026 agents.** Persistent memory is also a way for a hijack to persist. If an injected document gets an instruction written into long-term memory, the instruction runs again in every later session that loads that memory. Treat memory written from a context that has read untrusted content as untrusted, and make memory inspectable and deletable by the operator.

## Expiring Grants

This pattern merges Capability Sunset, Data Shelf Life and Trust Decay. Every grant expires: access to a capability, to a dataset, or to a level of autonomy. Expiry is the default outcome. One rule covers all three cases:

1. **A grant gets a time-to-live when it is issued,** sized to the task it was issued for. Credentials and customer data get the task's duration; standing grants get a review interval.
2. **At expiry the grant lapses.** The system holding the resource enforces revocation, so an expired grant fails even if the agent still holds the token.
3. **Renewal is a new grant.** It needs a current justification and approval by someone other than the holder, under the same rules as the original. There is no automatic renewal and no renewal counter. A grant that keeps being needed should be reissued with a longer time-to-live and a named owner.
4. **A material change to the delegate expires its grants.** A new model version, system prompt or tool set is a different delegate for the purposes of evidence.

A common alternative is a "trust score" that decays without activity and maps to permission levels. Unless that score is defined as P(faithful execution) on a task class and re-estimated from data, it has no units, and its decay rate and thresholds are arbitrary. What actually goes stale is the evidence behind a grant. It was collected about one configuration under one mix of tasks, and it loses value as either changes. Rule 4 handles the configuration; review intervals handle the task mix.

Expiring grants are the countermeasure to privilege creep, the process by which an agent's privilege overhang (the gap between what it can do and what its current task needs) grows over time.

**Prior art.** Kerberos tickets and short-lived OAuth access tokens; just-in-time privileged access; periodic access recertification; records-retention schedules.

**What is different for 2026 agents.** Agents pick up credentials mid-task: API keys in environment variables, tokens in configuration files, OAuth grants a user clicks through. Long-lived keys in an agent's environment are the common failure, because the agent, or an injected instruction, can read them and reuse them outside the task. Issue short-lived, task-scoped credentials from the [gateway](/design-patterns/structural/#exposure-envelope-gateway) instead, so the agent never holds a standing secret. The MCP authorization specification moves remote tool servers in this direction: authorization servers should issue short-lived access tokens, and each server must reject tokens not issued for it ([MCP specification, 2025-06-18](https://modelcontextprotocol.io/specification/2025-06-18/basic/authorization)). Local servers still take credentials from the environment. Vendors also update models behind stable names, so rule 4 can be applied only if the model version is pinned and logged.
