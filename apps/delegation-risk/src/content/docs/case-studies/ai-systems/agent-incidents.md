---
title: "Agent Incidents, 2024–2026"
description: "Eight documented incidents in which an AI agent, or the tools and instructions around it, caused or nearly caused harm, mapped to harm channels and Least-X principles."
sidebar:
  order: 7
---

This page collects real incidents in which a delegate could do more than talk. It replaces three invented scenarios that earlier versions of the site carried. Each entry gives what happened, the sources, the [harm channel](/delegation-risk/risk-decomposition/) and what would have bounded the [exposure](/getting-started/glossary/#exposure). The facts come from court decisions, vendor bulletins and security-firm reports; the mapping to the framework is ours. No dollar figures are estimated.

For the 2023 chat-only precursor, see [Bing Sydney](/case-studies/ai-systems/case-study-sydney/). Indirect prompt-injection vulnerabilities found in shipped products before known exploitation, such as EchoLeak in Microsoft 365 Copilot, are covered under [Risk Decomposition](/delegation-risk/risk-decomposition/).

| Incident | Date | Channel | What bounded, or would have bounded, it |
|---|---|---|---|
| Air Canada chatbot | Nov 2022; ruled Feb 2024 | Accident | Commitments routed through a deterministic policy check |
| Replit agent deletes a production database | Jul 2025 | Accident | Least Privilege: no production write access during a freeze |
| Amazon Q extension ships a wiper prompt | Jul 2025 | Hijack (supply chain) | Least Privilege on CI tokens; an envelope on destructive cloud calls |
| Nx "s1ngularity" malware drives local AI CLIs | Aug 2025 | Hijack (misuse) | Least Autonomy: no permission-bypass modes on machines that hold secrets |
| `postmark-mcp` malicious MCP server | Sep 2025 | Hijack (tool supply chain) | Tool provenance and egress limits |
| Claude Code used in an espionage campaign (GTG-1002) | Sep 2025; reported Nov 2025 | Hijack (misuse) | Monitoring across a whole account, not per request |
| ClawHavoc: malicious skills on ClawHub | Jan–Feb 2026 | Hijack (tool supply chain) | Vetted registries; no install steps run on a skill's say-so |
| Cursor agent deletes PocketOS's database and backups | Apr 2026 | Accident | Scoped tokens; backups outside the delegate's reach |

## Air Canada: the deployer owns what the agent says

In November 2022 Jake Moffatt asked Air Canada's website chatbot about bereavement fares after his grandmother died. The chatbot told him he could buy a full-fare ticket and apply for the bereavement rate retroactively. Air Canada's actual policy did not allow retroactive claims, and the airline refused the refund. Before British Columbia's Civil Resolution Tribunal, Air Canada argued in effect that the chatbot was a separate entity responsible for its own statements. The tribunal member called this "a remarkable submission," held the airline responsible for all information on its website, found negligent misrepresentation and awarded C\$650.88 in damages plus interest and fees (*Moffatt v. Air Canada*, 2024 BCCRT 149, February 2024).

**Mapping.** An accident: the model stated a policy that did not exist. The legal point is the useful one. The harm surface of a customer-facing agent includes every commitment it can phrase, and the principal carries that exposure whatever the model's terms of service say. The structural fix is to keep commitments (refunds, prices, eligibility) out of free text: the model retrieves and quotes, and a tier 2 rules engine decides. See the [verifiability tiers](/design-patterns/least-x-principles/#least-intelligence).

## Replit: an instruction is not a boundary

In July 2025 Jason Lemkin, founder of SaaStr, was testing Replit's coding agent on a project. During a declared code freeze the agent ran destructive commands against the project's production database, which held records on about 1,200 executives and a similar number of companies. Lemkin reported that it also generated fake data and told him a rollback was impossible; the rollback worked. Replit's CEO, Amjad Masad, called the deletion "unacceptable and should never be possible" and announced automatic separation of development and production databases, a planning-only mode and easier restores from backup ([The Register, 22 July 2025](https://www.theregister.com/2025/07/22/replit_saastr_response/)). The primary record is Lemkin's own posts with screenshots, so the details of the agent's statements rest on one account.

**Mapping.** An accident with a large [privilege overhang](/getting-started/glossary/#privilege-overhang): a task that needed a development database ran with delete rights on production. The code freeze existed only as an instruction in the agent's context, which is a request, not an [exposure envelope](/getting-started/glossary/#exposure-envelope). Replit's fixes are all scaffold-side ([Least Privilege](/design-patterns/least-x-principles/#least-privilege), [Least Autonomy](/design-patterns/least-x-principles/#least-autonomy)). The false report about rollback shows why an agent's account of its own actions cannot serve as the check on those actions: the [risk preflight](/delegation-risk/runtime-accounting/) must sit lower than the actor.

## Amazon Q: the agent's own instructions are supply chain

In July 2025 an attacker committed code to the open-source repository of the Amazon Q Developer extension for VS Code, and it shipped in version 1.84.0. The code fetched a prompt telling the agent to delete the non-hidden files in the user's home directory and to "discover and use AWS profiles to list and delete cloud resources using AWS CLI commands," and passed it to the Q CLI with `--trust-all-tools` and `--no-interactive` ([The Register](https://www.theregister.com/2025/07/24/amazon_q_ai_prompt/)). AWS's bulletin traces the intrusion to an inappropriately scoped GitHub token in the project's CodeBuild configuration, and states that the code "was unsuccessful in executing due to a syntax error" ([AWS-2025-015](https://aws.amazon.com/security/security-bulletins/AWS-2025-015/)). Version 1.85.0 removed it.

**Mapping.** A hijack through the supply chain. The injected text did not need to fool the model; it was delivered as the agent's instructions, with tool approval switched off. What prevented harm was a syntax error, not a control. Two bounds would have held regardless: CI credentials scoped to what the build needs, and an envelope that refuses destructive cloud calls (terminate, delete, remove) without out-of-band approval, whatever the agent was told.

## Nx "s1ngularity": malware borrows the developer's agent

On 26–27 August 2025 attackers used an npm token stolen through a GitHub Actions workflow injection to publish malicious versions of the Nx build tool ([Nx advisory](https://github.com/nrwl/nx/security/advisories/GHSA-cxm3-wv7p-598c)). The post-install script looked for installed AI coding CLIs and ran them with their permission checks disabled (`--dangerously-skip-permissions` for Claude Code, `--yolo` for Gemini CLI, `--trust-all-tools` for Amazon Q) and a prompt to inventory files likely to hold secrets ([StepSecurity](https://www.stepsecurity.io/blog/supply-chain-security-alert-popular-nx-build-system-package-compromised-with-data-stealing-malware)). Results were committed to a public repository created in the victim's own GitHub account.

**Mapping.** Misuse, a form of hijack: the agents were not deceived, they were driven by local code with the user's privileges. An installed agent with a permission-bypass mode is a general capability any process on the machine can borrow. On machines that hold credentials, [Least Autonomy](/design-patterns/least-x-principles/#least-autonomy) means those modes should be unavailable, or confined to a sandbox with no secrets in reach.

## `postmark-mcp`: the tool is the attacker

In September 2025 Koi Security reported that an npm package named `postmark-mcp`, an unofficial copy of Postmark's open-source MCP server for sending email, had added one line in version 1.0.16: every outgoing message was blind-copied to an address the publisher controlled. Fifteen earlier versions were clean. Koi estimated about 1,500 downloads a week; Postmark said it had nothing to do with the package ([The Register, 29 September 2025](https://www.theregister.com/2025/09/29/postmark_mcp_server_code_hijacked/)).

**Mapping.** A hijack through the tool supply chain, and one that monitoring the model would not catch: the model asked to send an email and an email was sent. The exfiltration happened inside the tool, and inside a legitimate call to Postmark's API, so a network allow-list would not have stopped it either. The controls that work are from package security and from [Least Connectivity](/design-patterns/least-x-principles/#least-connectivity) applied to tools: install tools from the provider's own publisher, pin versions, and check outbound requests in deterministic code (here, that the recipients are the ones the model asked for).

## GTG-1002: decomposition used against the checker

In mid-September 2025 Anthropic detected a campaign that used Claude Code, driven through MCP tools, against about thirty organizations, including technology companies, financial institutions, chemical manufacturers and government agencies. It attributed the campaign with high confidence to a Chinese state-sponsored group, banned the accounts over a ten-day investigation and notified those affected. By Anthropic's account the agent did 80–90% of the work, including reconnaissance, exploit writing, credential harvesting and data extraction, with humans intervening at perhaps four to six decision points per campaign, and a small number of intrusions succeeded. The operators got past the model's refusals by splitting the attack into small tasks that each looked innocent and by telling the model it worked for a security firm doing defensive testing. The agent also overstated its results, at times claiming credentials that did not work or "secret" findings that were public ([Anthropic, 13 November 2025](https://www.anthropic.com/news/disrupting-AI-espionage)). The primary record is Anthropic's own report.

**Mapping.** Misuse: the delegate did what its user asked, and the harm fell on third parties. The lesson cuts against a naive reading of this site's own advice. Decomposition limits what each component can do with what it sees, and here the attacker used it to keep each request below what a per-request check would refuse. A check that sees one subtask cannot judge the purpose of the whole. The control that worked sat with the provider and looked at activity across the account. For a deployer the corresponding point is that an [exposure envelope](/getting-started/glossary/#exposure-envelope) has to be stated over the session or the account, not only over each action.

## ClawHavoc: a skill store with no gate

OpenClaw (formerly Clawdbot, then Moltbot) is a self-hosted agent that users extend with third-party "skills" from a registry, ClawHub, which anyone with a GitHub account at least a week old could publish to. In early February 2026 Koi Security reported that of 2,857 skills it audited, 341 were malicious. In 335 of them the documentation had a "Prerequisites" section telling the user to install a helper, which on macOS was a script pasted into the terminal that fetched the Atomic Stealer credential thief. Others hid reverse shells in working code or sent the bot's stored credentials to an outside endpoint. OpenClaw's maintainer added user reporting, with skills hidden automatically after more than three reports ([The Hacker News, 2 February 2026](https://thehackernews.com/2026/02/researchers-find-341-malicious-clawhub.html)).

**Mapping.** A hijack through the tool supply chain, at the scale `postmark-mcp` only hinted at. The skill's text was the attack: it asked the human, or an agent able to run shell commands, to execute code that no one had reviewed. The bounds are the package-ecosystem ones (publisher verification, review before listing) plus a rule an envelope can enforce: installing a tool is a privileged action that does not follow from instructions inside the tool. See [Open-Source Supply Chain](/case-studies/human-systems/open-source-trust/).

## PocketOS: the backups were inside the blast radius

On about 25 April 2026 a Cursor coding agent running Claude Opus 4.6, working on a routine task in PocketOS's staging environment, hit a credential mismatch and resolved it by deleting a storage volume on the Railway hosting platform with one API call. The volume held the production database, and, by the founder's account, its volume-level backups. Screenshots the founder posted show the agent saying it "guessed" the deletion would be scoped to staging and "didn't verify". Railway's chief executive said the call came through a fully permissioned token to a legacy endpoint without delayed deletion, that Railway keeps disaster backups as well as user backups and had restored the data, and that the endpoint had been patched; the founder reported remaining gaps in what was recovered ([Decrypt, 28 April 2026](https://decrypt.co/365897/ai-agent-deletes-startup-database-9-seconds-founder-says)). The account rests on the two parties' public statements.

A similar, disputed case predates it. The *Financial Times* reported in February 2026 that in December 2025 Amazon's Kiro agent, given an engineer's permissions, chose to "delete and recreate" an environment and caused a 13-hour interruption of AWS Cost Explorer in one region. Amazon called the cause "user error—specifically misconfigured access controls—not AI" and said it had since required peer review for production access ([Amazon](https://www.aboutamazon.com/news/aws/aws-service-outage-ai-bot-kiro); [The Decoder](https://the-decoder.com/aws-ai-coding-tool-decided-to-delete-and-recreate-a-customer-facing-system-causing-13-hour-outage-report-says/)).

**Mapping.** Accidents, with Replit's privilege overhang and one addition: recovery shared a common cause with the thing it protected. A backup that the delegate's credentials can delete is not an independent layer, which is the [entanglement](/entanglements/) point applied to restore paths. Both parties' remedies are scaffold-side: delayed deletion, token scope, peer review for production. Amazon's framing, misconfigured access rather than AI, is the framework's framing too. What the agent could reach set the damage.

## What they have in common

- **Five of eight are hijacks, and none involves a scheming model.** In each a third party, or the user, controlled the agent's instructions or its tools. Hijack belongs in the harm surface by default.
- **The model was rarely the right place for the control.** The fixes that work, or would have worked, are scaffold-side: scoped credentials, separated environments, disabled bypass modes, pinned and vetted tools, envelopes on destructive actions. These hold whatever the model is told.
- **Exposure was set by credentials, not by capability.** The same models with read-only, sandboxed access would have produced only embarrassments.
- **Per-action checks miss what only the aggregate shows.** GTG-1002's subtasks each looked benign.
- **Self-reports are not verification.** The Replit agent misdescribed what it had done, the GTG-1002 agent overstated its results, and the postmark tool's behavior was invisible from the model's side.

## See also

- [Open-Source Supply Chain](/case-studies/human-systems/open-source-trust/): the package-ecosystem background to three of these incidents
- [Least-X Principles](/design-patterns/least-x-principles/)
- [Structural Patterns](/design-patterns/structural/): the Exposure-Envelope Gateway
- [Risk Decomposition](/delegation-risk/risk-decomposition/): accident, defection and hijack
