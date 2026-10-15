---
title: "Open-Source Supply Chain"
description: "Installing a package delegates code execution to everyone with publish rights in its dependency tree. The xz backdoor, the 2024–26 incidents, the defenses that now exist, and what carries over to agent tools."
sidebar:
  order: 7
---

Running `npm install` or `pip install` delegates code execution on your machine to the maintainers of every package in the dependency tree, to whoever holds their publishing credentials, and to the build systems in between. Nobody reads that code. The open-source supply chain is the largest delegation network in software, and since 2025 it is also the main route by which AI agents acquire tools.

An earlier version of this page priced individual packages and the whole npm ecosystem in dollars. The package figures were off by a factor of 1,000 (lodash at "150,000 × 0.001 × \$100K = \$15M" is \$15B), the ecosystem total was inconsistent with its parts, and the "72× ROI" of funding maintainers was invented. Those tables are gone.

## What you delegate when you install

A package's harm surface runs through:

- **its maintainers**, who can publish anything, and whose intentions can change or who can hand the package to someone else;
- **their accounts and tokens**, which can be phished or stolen;
- **the CI and build systems** that produce the published artifact, which can differ from the source you could read;
- **the registry** itself;
- **every transitive dependency**, each with the same list.

The arithmetic of a long tree is unforgiving. Illustratively, if each of 1,000 dependencies independently had a 0.1% chance of being compromised in a year, the chance that at least one was would be 1 − 0.999¹⁰⁰⁰ ≈ 63%. Real compromises are not independent: worms spread through shared maintainers, and a phished account publishes many packages at once.

## The xz backdoor (2024)

xz-utils is a compression library present on almost every Linux system. A contributor using the name Jia Tan sent a first patch in October 2021, became a co-maintainer in late 2022 while sock-puppet accounts pressed the overworked original maintainer to accept help, and was building releases by March 2023. Versions 5.6.0 (24 February 2024) and 5.6.1 (9 March 2024) carried a backdoor that, on distributions linking OpenSSH against libsystemd, would have given the holder of a private key remote code execution through `sshd` (CVE-2024-3094).

Andres Freund, a Microsoft engineer, noticed that SSH logins on a Debian test machine used unexpected CPU time, investigated, and disclosed on 29 March 2024. By then the backdoored versions had reached Debian unstable and testing, Fedora Rawhide and the Fedora 40 beta, and some rolling-release distributions. They had not reached the stable releases of the major distributions, so the installed base actually exposed was small. Had the backdoor reached those releases, it would have put a remote-access key on a large share of internet-facing Linux servers. That is a counterfactual exposure, and no estimate of it is attempted here.

Two details matter for defenses ([Russ Cox's timeline](https://research.swtch.com/xz-timeline)):

- **The payload was in git; the trigger was not.** The obfuscated payload sat in binary "test" files committed to the repository. The build script change that extracted it, `build-to-host.m4`, appeared only in the release tarball. A check that release tarballs reproduce from the tagged source tree would have flagged the difference. Reproducible builds from git alone would have faithfully reproduced a build that never ran the trigger.
- **Reputation was the attack surface.** Two years of good contributions bought commit and release rights. Trust accrued by good behavior under observation is exactly what a patient attacker invests in.

## The incident record

| Year | Incident | Mechanism |
|---|---|---|
| 2016 | left-pad | Maintainer unpublished his packages; builds across npm broke. |
| 2018 | event-stream | Maintainership handed to a volunteer, who added code targeting a Bitcoin wallet. |
| 2020 | SolarWinds Orion | Build system compromised; signed updates carried a backdoor. |
| 2021 | ua-parser-js | Maintainer account compromised; a cryptominer and credential stealer published. |
| 2022 | colors, faker; node-ipc | Maintainers sabotaged their own packages; node-ipc overwrote files on machines with Russian or Belarusian IP addresses. |
| 2024 | polyfill.io | Domain and project sold; the CDN then served redirect code to sites that still embedded it, reported at over 100,000. |
| 2024 | xz-utils | Long-con maintainer takeover (above). |
| 2025 | tj-actions/changed-files | A bot token was compromised and the action's version tags were repointed to a commit that printed CI secrets into build logs; about 23,000 repositories used the action (CVE-2025-30066). |
| 2025 | chalk, debug and others | Maintainer phished through a fake npm-support domain; packages with about two billion weekly downloads shipped crypto-stealing code for a few hours before removal. |
| 2025 | Shai-Hulud | A self-replicating worm stole npm and GitHub tokens and republished itself into other packages its victims maintained; CISA counted over 500 compromised packages ([CISA alert, 23 Sep 2025](https://www.cisa.gov/news-events/alerts/2025/09/23/widespread-supply-chain-compromise-impacting-npm-ecosystem)). |
| 2025 | Shai-Hulud 2.0 | The worm returned in late November, now running at `preinstall`, before installation finished; Wiz counted about 700 compromised packages and over 25,000 repositories created to dump stolen secrets ([Wiz](https://www.wiz.io/blog/shai-hulud-2-0-ongoing-supply-chain-attack)). |

Several compromises have targeted AI tooling directly: the Nx release that drove developers' AI coding CLIs to hunt for secrets, the `postmark-mcp` server that copied every email to its publisher, and the hundreds of malicious agent skills found on OpenClaw's ClawHub registry in early 2026. All are covered in [Agent Incidents](/case-studies/ai-systems/agent-incidents/), along with the Amazon Q extension that shipped an injected wiper prompt.

## AI-specific variants

- **Slopsquatting.** Code-generating models recommend packages that do not exist. Across 16 models and 576,000 generated samples, [Spracklen et al.](https://arxiv.org/abs/2406.10279) found hallucinated package names in at least 5.2% of recommendations from commercial models and 21.7% from open-source models. Names that recur can be registered by an attacker and wait for an agent to install them.
- **Tools and MCP servers.** An agent's tools are dependencies with the agent's privileges. A malicious tool needs no prompt injection; it acts inside the trusted code path.
- **Model files.** Weights distributed in formats that execute code on load (Python pickle) are executable dependencies.
- **Agent instructions.** System prompts, rules files and extension code are part of the supply chain too, as the Amazon Q incident showed.

## Defenses that now exist

| Defense | What it binds | What it does not stop |
|---|---|---|
| Trusted publishing: short-lived OIDC credentials from CI instead of stored tokens (PyPI since April 2023; npm generally available since 31 July 2025; npm revoked all long-lived classic tokens on 9 December 2025, [GitHub changelog](https://github.blog/changelog/2025-12-09-npm-classic-tokens-revoked-session-based-auth-and-cli-token-management-now-available/)) | Theft of long-lived publish tokens, the asset the Shai-Hulud worm and the Nx attackers stole | A malicious maintainer, or a compromised CI workflow |
| Provenance attestations signed through Sigstore (npm since April 2023, by default under trusted publishing) | Lets a consumer verify which repository and build produced a package | Malicious code in that repository |
| SLSA build levels | Hardened, isolated builds with verifiable provenance | The same |
| Lock files and pinned versions | Silent upgrades to a newly compromised version | A version that was malicious when pinned |
| Tarball-versus-source and reproducibility checks | Artifacts that differ from their source (the xz trigger) | Malicious source |
| Two-factor authentication | Password reuse and simple credential theft | Real-time phishing of the second factor (chalk, debug) |

Every row moves trust from the artifact to a person or a repository. None removes the need to trust the maintainer, which is why event-stream and node-ipc would have passed all of them, and xz would have been caught only by the tarball-versus-source check.

## Dependency discipline for agents

The habits software engineering developed for dependency graphs carry over to agent tool graphs. The general versions are in [Solutions: dependency hygiene](/entanglements/mitigation/solutions/#9-dependency-hygiene); the supply-chain-specific ones are:

- **Lock the agent.** Pin the model version, tool and MCP server versions, and the prompt and rules files, and treat a change to any of them as a deploy.
- **Know the transitive graph.** For each agent, list which models, tools, servers and credentials it can reach, the agent equivalent of a software bill of materials, and audit it the way `npm audit` audits packages.
- **Inject tools from above.** The principal or coordinator chooses an agent's tools; an agent that installs its own tools has chosen its own supply chain.
- **Run install scripts and new tools without secrets in reach.** Shai-Hulud and the Nx malware both harvested credentials from developer machines and CI runners.

## Maintainers

Most critical packages are maintained by volunteers, and the xz takeover began with one who was burned out and pressured. Corporate sponsorship, foundations and public funds for open-source maintenance reduce that pressure. They do not stop a patient attacker, and no reliable estimate of their return exists.

## Lessons for AI delegation

1. **An agent's harm surface includes its whole dependency tree:** model, tools, servers, extensions and instruction files.
2. **Trust in a name outlives trust in a person.** Package handovers, Jia Tan's two years of good contributions and `postmark-mcp`'s fifteen clean versions all exploited reputation accumulated earlier. A model's good behavior under observation is the same kind of evidence and has the same weakness.
3. **Verify artifacts and builds, not reputations,** and know which row of the defense table you are relying on.
4. **Bound what a compromised dependency can reach.** Sandboxed installs, scoped credentials and egress limits are what make the difference between an incident and a breach.

## See also

- [Agent Incidents](/case-studies/ai-systems/agent-incidents/)
- [Foundation Model Monoculture](/entanglements/case-studies/foundation-model-monoculture/): the shared-provider version of the same concentration problem
- [Alliance Cascades](/case-studies/human-systems/alliance-cascades/): hidden couplings in a network
- [Solutions](/entanglements/mitigation/solutions/)
