---
title: "Access Control Systems"
description: "What intelligence-community and enterprise access control teach about delegating authority to AI agents: compartmentation, need-to-know, two-person rules, permission sprawl, the confused deputy, and OAuth-style delegated authorization."
---

Access control is delegation written down as policy. A security clearance, an IAM role, a service account and an OAuth token each grant a delegate some authority, bound its scope, and leave a record. Two mature domains have decades of experience with this: the intelligence community, which faces adversarial insiders, and enterprise software, which faces scale and organizational entropy. Both have documented failure modes, and AI agents inherit most of them.

## Intelligence community: clearance, compartments, need-to-know

**Clearance is eligibility, not access.** US classification levels (Confidential, Secret, Top Secret) are defined by the damage disclosure would cause. A Top Secret clearance makes a person eligible to see Top Secret material; it does not grant access to any of it.

**Compartments restrict access horizontally.** Sensitive Compartmented Information is divided into control systems such as SI (signals intelligence), TK (overhead imagery) and HCS (human sources). Two analysts with the same clearance can see entirely different material. Access requires a formal read-in, and leaving a program requires a read-out.

**Need-to-know applies per request.** Within a compartment, access still requires an operational reason. Access is the intersection of clearance, compartment and need-to-know; each check blocks a different kind of drift.

**Two-person integrity** requires two authorized people to act together for critical operations, such as nuclear weapons handling and cryptographic key management. No single person can complete the action alone, so a single compromised or mistaken insider is not enough.

**Vetting is continuous.** The US system has been moving from reinvestigation on a fixed multi-year cycle toward continuous vetting, in which automated checks of financial, criminal and travel records run between investigations. <!-- TODO(verify): name and dates of the Trusted Workforce 2.0 continuous-vetting reform; not checked against a primary source. -->

### The insider cases

These controls did not stop the most damaging insiders:

| Case | Access | How it ended |
|---|---|---|
| Aldrich Ames (CIA, spied 1985–1994) | Legitimate access to Soviet-division operations | A CIA–FBI mole hunt, begun after agents were lost, narrowed on him partly through unexplained wealth. Arrested after about nine years. |
| Robert Hanssen (FBI, intermittently 1979–2001) | Counterintelligence role with wide visibility into FBI cases | Identified after the FBI paid \$7 million for a KGB file on the unknown mole. The Justice Department called it "possibly the worst intelligence disaster in U.S. history." |
| Chelsea Manning (Army, 2010) | Analyst with TS/SCI access to classified networks | Bulk download of databases far beyond any task's need. Identified after confiding in Adrian Lamo, who informed Army investigators. |
| Edward Snowden (NSA contractor, 2013) | Systems-administrator access | Not detected. He identified himself through *The Guardian* after the first stories ran. |
| Reality Winner (NSA contractor, 2017) | Translator with access to the document | An internal audit found six people had accessed it; she was the only one who had emailed the publication. |

Each had legitimate access and used it outside its purpose. Compartmentation did not contain Hanssen; his counterintelligence work gave him visibility across many programs. Routine monitoring flagged none of them early. Ames was found by a mole hunt that took years, Hanssen through a purchased foreign file, Manning through a confidant, and Snowden by his own disclosure. Access logs helped only in Winner's case, where the field of suspects was already small.

## Enterprise software: roles, attributes, delegation

**Role-based access control (RBAC)** maps users to roles and roles to permissions. It scales and is easy to audit, but organizations accumulate hundreds of roles, roles grant more than any one task needs, and assignments are static.

**Attribute-based access control (ABAC)** evaluates policies over attributes of the subject, resource and environment at request time: department, data classification, time of day, location. It is more precise and harder to audit.

**OAuth** lets a user delegate limited authority to a third-party application without handing over credentials. The application receives an access token with defined scopes and lifetime, which the user or authorization server can revoke. RFC 6749 defines the framework. RFC 6819 (2013) is the threat model, and RFC 9700 (January 2025) is the current *Best Current Practice for OAuth 2.0 Security*. OAuth 2.1, still an IETF draft, consolidates these practices.

**Service accounts** are non-human identities with delegated authority, and they are where enterprise access control is weakest. Typical problems are administrator rights granted to "make it work", credentials shared across systems, no expiry, and actions logged against the account rather than the person or process that triggered them. AI agents are service accounts that choose their own actions, so every service-account problem applies to them, with less predictable behavior.

### Permission sprawl

Access accumulates faster than it is removed:

- Emergency access granted during an incident is never revoked.
- Project access outlives the project.
- Promotions add roles without removing old ones.
- Acquisitions layer one access model on top of another.
- Urgent requests are granted by default.

Organizations respond with periodic access reviews, which degrade predictably. Managers facing hundreds of certifications approve by default, privileged accounts are marked "still needed" without checking, and dormant-account cleanups exclude service accounts because touching them might break production. The site's term for the resulting gap between what a delegate can do and what it needs is [privilege overhang](/getting-started/glossary/#privilege-overhang); the review failure is approval theater, measured by the [rubber-stamp rate](/entanglements/cross-domain/psychology-of-oversight/).

## The confused deputy

Hardy (1988) described a compiler on a timesharing service that had permission to write in a system directory, where it kept usage statistics. The billing file lived in the same directory. A user named the billing file as the compiler's debugging output, and the compiler, using its own permission on the user's behalf, overwrote it. The compiler was a deputy confused about whose authority it was exercising. Access-control lists cannot prevent this, because the deputy really is permitted to write the file. Capability systems prevent it by making authority travel with the reference to the object being used.

An agent that reads untrusted content and acts with its user's credentials is a confused deputy waiting to happen. Prompt injection is the attack: text from a web page, email or tool result instructs the agent, and the agent exercises the user's authority on the attacker's behalf.

The Model Context Protocol's authorization specification (2025-06-18 revision) is an example of current practice. Authorization is optional. When it is used over HTTP, an MCP server acts as an OAuth 2.1 resource server, must accept only tokens issued for itself (clients must name the intended server using RFC 8707 resource indicators), and must not pass a client's token through to upstream APIs. The specification forbids token passthrough explicitly to avoid confused-deputy failures. These rules bound which services a token works at. They do not stop an injected instruction from using a correctly scoped token for the wrong purpose; that needs the controls below.

## Lessons for AI delegation

**Access is not trust.** A clearance is eligibility, and a role is a ceiling. An agent's standing permissions should not determine what it may touch for a given task. Grant capabilities per task, scoped to the resources the task names, with a short lifetime. This is [Least Privilege](/design-patterns/least-x-principles/#least-privilege) with expiry, the [Expiring Grants](/design-patterns/information/#expiring-grants) pattern.

**Compartmentalize by default.** A code-writing agent does not need financial data, and a summarizer does not need write access. A coordinator that routes tasks need not see the data at all. Compartments also limit what an injected instruction can reach ([Need-to-Know Compartments](/design-patterns/information/#need-to-know-compartments)).

**Re-check during the delegation, not only before it.** Initial vetting is a weak predictor of later behavior, which is why the intelligence community moved toward continuous vetting. For agents, this means runtime monitoring and per-action checks, not only evaluation before deployment.

**Use two-person rules for irreversible actions.** High-stakes actions should require confirmation from an independent checker, human or automated, and the checker must actually be independent. A second instance of the same model is a weak second person ([Voting Tribunal](/design-patterns/structural/#voting-tribunal); [Risk Propagation](/delegation-risk/risk-propagation/)).

**Plan for the insider who passes vetting.** The insider cases show that detection is slow and often comes from outside. An agent that passed its evaluations may still act against its principal, through misalignment or hijack. Design so that a delegate who goes bad can do bounded damage before anyone notices: scope limits, rate limits, and an [exposure envelope](/delegation-risk/runtime-accounting/) that holds regardless of intent.

**Give every agent instance its own identity.** Shared service accounts make attribution impossible. Each agent instance should have its own credentials, its actions should be logged against the request that triggered them, and its credentials should expire.

**Build revocation in from the start.** Check revocation and expiry before every action, not at session start. Inventory third-party integrations and their credentials with expiry dates, and flag credentials that go unused.

**Route reviews by risk.** Reviews fail when volume exceeds attention. Auto-approve low-risk requests under hard limits, and send the few high-risk requests to reviewers with time and context to evaluate them.

## Mapping across domains

| Concept | Intelligence community | Enterprise | AI delegation |
|---|---|---|---|
| Eligibility | Clearance | Role assignment | Agent's standing permissions |
| Scope limit | Compartment | Permission set, OAuth scope | Per-task capability grant |
| Need-to-know | Operational justification | Data classification | Task-specific context |
| Ongoing evaluation | Continuous vetting | Access reviews, behavior analytics | Runtime monitoring |
| Multi-party control | Two-person integrity | Separation of duties | Independent checker |
| Revocation | Read-out, suspension | Account disable, token revocation | Session and credential revocation |

## Sources

- Hardy, N. (1988). The confused deputy (or why capabilities might have been invented). *ACM SIGOPS Operating Systems Review* 22(4), 36–38.
- IETF RFC 6749 (OAuth 2.0), RFC 6819 (OAuth 2.0 Threat Model, 2013), RFC 8707 (Resource Indicators), RFC 9700 (OAuth 2.0 Security Best Current Practice, 2025).
- Model Context Protocol, [Authorization specification](https://modelcontextprotocol.io/specification/2025-06-18/basic/authorization) (2025-06-18).
- US Department of Justice, Office of the Inspector General (August 2003). Review of the FBI's performance in the Hanssen case.
- NIST SP 800-53 (security and privacy controls); NIST SP 800-162 (attribute-based access control); Intelligence Community Directive 704 (personnel security).
- Stoll, C. (1989). *The Cuckoo's Egg*. An account of detecting an external intruder, Markus Hess, from a 75-cent accounting discrepancy; an example of anomaly detection from audit logs, not of insider threat.
