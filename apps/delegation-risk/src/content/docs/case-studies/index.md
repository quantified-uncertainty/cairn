---
title: Case Studies
description: Documented AI incidents and human institutions read through the delegation-risk framework, with sources and no invented quantities.
---

These pages read real incidents and real institutions through the framework's concepts. The facts are sourced. The mapping to harm channels and Least-X principles is our interpretation, and no page prices a case in dollars. Earlier versions of this section included invented AI scenarios and dollar-weighted tables over historical cases; those have been removed.

## AI incidents

| Incident | Date | Harm channel | Page |
|---|---|---|---|
| Bing "Sydney" persona drift in long chats; fixed by a turn cap | Feb 2023 | Accident (plus injection to extract the prompt) | [Bing Sydney](/case-studies/ai-systems/case-study-sydney/) |
| Air Canada held liable for its chatbot's invented refund policy | Ruled Feb 2024 | Accident | [Agent Incidents](/case-studies/ai-systems/agent-incidents/#air-canada-the-deployer-owns-what-the-agent-says) |
| Replit coding agent deletes a production database during a code freeze | Jul 2025 | Accident | [Agent Incidents](/case-studies/ai-systems/agent-incidents/#replit-an-instruction-is-not-a-boundary) |
| Amazon Q extension ships a prompt telling the agent to wipe files and cloud resources | Jul 2025 | Hijack (supply chain) | [Agent Incidents](/case-studies/ai-systems/agent-incidents/#amazon-q-the-agents-own-instructions-are-supply-chain) |
| Nx malware runs developers' AI CLIs with permission checks off to find secrets | Aug 2025 | Hijack (misuse) | [Agent Incidents](/case-studies/ai-systems/agent-incidents/#nx-s1ngularity-malware-borrows-the-developers-agent) |
| `postmark-mcp` MCP server blind-copies every email to its publisher | Sep 2025 | Hijack (tool supply chain) | [Agent Incidents](/case-studies/ai-systems/agent-incidents/#postmark-mcp-the-tool-is-the-attacker) |
| Claude Code driven through a state-sponsored espionage campaign by splitting it into innocent-looking subtasks | Reported Nov 2025 | Hijack (misuse) | [Agent Incidents](/case-studies/ai-systems/agent-incidents/#gtg-1002-decomposition-used-against-the-checker) |
| 341 malicious skills found on OpenClaw's ClawHub registry | Feb 2026 | Hijack (tool supply chain) | [Agent Incidents](/case-studies/ai-systems/agent-incidents/#clawhavoc-a-skill-store-with-no-gate) |
| Cursor agent deletes PocketOS's production database and its volume backups in one API call | Apr 2026 | Accident | [Agent Incidents](/case-studies/ai-systems/agent-incidents/#pocketos-the-backups-were-inside-the-blast-radius) |

The common thread is that scaffold-side bounds (scoped credentials, separated environments, disabled bypass modes, vetted and pinned tools, backups out of the agent's reach) would have held whatever the model was told, and that exposure was set by what the agent could reach.

## Human systems

| Case | What it illustrates |
|---|---|
| [Open-Source Supply Chain](/case-studies/human-systems/open-source-trust/) | Delegated code execution at scale; the xz backdoor; the 2024–25 package compromises and the defenses that now exist |
| [Jury Systems](/case-studies/human-systems/jury-trust/) | Unanimity's protection is almost entirely an independence assumption; most convictions never reach a jury |
| [Nuclear Launch Authority](/case-studies/human-systems/nuclear-launch-authority/) | Choosing between false positives and false negatives; human circuit breakers need time and a second source |
| [Alliance Cascades](/case-studies/human-systems/alliance-cascades/) | Bilateral commitments that couple a network more tightly than any party sees |

Related pages in the [Entanglements](/entanglements/) section cover institutions as verification systems: [Lessons from human oversight institutions](/entanglements/case-studies/historical-cases/) (auditors, rating agencies, aircraft certification, intelligence analysis), [Human overseers as a correlated layer](/entanglements/cross-domain/psychology-of-oversight/) and [Foundation Model Monoculture](/entanglements/case-studies/foundation-model-monoculture/).

## Concepts by case

| Concept | Where it shows up |
|---|---|
| [Least Persistence](/design-patterns/least-x-principles/#least-persistence) | Sydney's session cap |
| [Privilege overhang](/getting-started/glossary/#privilege-overhang) | Replit; Amazon Q's CI token; PocketOS's fully permissioned token |
| [Exposure envelope](/getting-started/glossary/#exposure-envelope) | Destructive-action limits that Replit, Amazon Q and PocketOS lacked; account-level limits against decomposed misuse (GTG-1002) |
| Hijack through tools and supply chain | Amazon Q, Nx, `postmark-mcp`, ClawHavoc, open-source incidents |
| [Correlated checks](/delegation-risk/risk-propagation/) | Jury unanimity; rating agencies; same-family LLM verifiers; backups deletable by the same token (PocketOS) |
| Error asymmetry | Juries; nuclear command |

## Next

- Apply the lessons: [Design Patterns](/design-patterns/)
- The framework: [Delegation Risk](/delegation-risk/)
