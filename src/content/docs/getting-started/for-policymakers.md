---
title: "For Policymakers"
description: "Reading path for policy professionals working on AI governance"
sidebar:
  order: 3
importance: 68.5
quality: 42
llmSummary: "Structured introduction to AI governance for policymakers, covering four risk categories (accident, misuse, structural, epistemic), three policy levers (compute governance, mandatory evaluations, international coordination), and current policy frameworks across US, EU, UK, and China. Provides actionable prioritization framework but lacks tables, citations, and quantified evidence."
---
you're a policymaker, regulator, or governance professional working on AI, this guide will help you quickly understand the safety landscape, evaluate different policy approaches, and identify high-leverage interventions.

## Executive Summary (5 minutes)

If you only have a few minutes, here's what you need to know:

### The Core Challenge

AI capabilities are advancing rapidly. Within 10-30 years, we may develop AI systems that are transformatively powerful—capable of automating most economically valuable work, advancing science dramatically, and potentially acting autonomously in consequential domains.

This creates two overlapping governance challenges:
1. **Near-term**: Managing risks from current AI (misinformation, bias, privacy, labor displacement)
2. **Long-term**: Ensuring transformative AI is developed safely and remains under meaningful human control

Most current policy focuses on (1). This wiki emphasizes (2), though the categories overlap.

### Why This Is Urgent

Unlike previous technology transitions, AI development is:
- **Fast**: Capabilities doubling every 6-10 months in some domains
- **Global**: Major development in US, China, UK, and elsewhere
- **Competitive**: Commercial and geopolitical incentives create racing dynamics
- **Potentially irreversible**: Deployed advanced AI may be impossible to recall or correct

The window for establishing governance frameworks may be short—possibly 5-15 years.

### Three Key Policy Levers

1. **Compute governance**: AI development requires massive computation. Hardware is trackable and controllable.
2. **Mandatory evaluations**: Require testing for dangerous capabilities before deployment
3. **International coordination**: No single nation can solve this alone

### Current State

**Progress**: Growing government attention (US Executive Order, EU AI Act, UK AI Safety Institute, China AI regulations)

**Gaps**: Most policy focuses on current harms. Frameworks for transformative AI safety are underdeveloped. International coordination is nascent.

**Your opportunity**: AI governance is still being defined. Early movers can shape frameworks that last decades.

## Understanding the Threat Model (30 minutes)

To design effective policy, you need to understand what could go wrong:

### Categories of Risk

AI risks fall into four main categories, each requiring different governance approaches:

#### 1. Accident Risks (Technical Failures)
AI systems behaving in unintended ways, even without malicious actors.

**Examples:**
- [Goal Misgeneralization](/knowledge-base/risks/accident/goal-misgeneralization/) - AI pursues misspecified objectives
- [Deceptive Alignment](/knowledge-base/risks/accident/deceptive-alignment/) - AI appears safe during testing but not in deployment
- [Power-Seeking](/knowledge-base/risks/accident/power-seeking/) - AI accumulates resources and resists shutdown

**Policy relevance**: These are technical problems, but policy can mandate safety testing and create liability frameworks.

**Key insight**: Standard product safety frameworks may be insufficient. A superintelligent AI that "wants" the wrong thing is fundamentally different from a bridge that collapses.

**Read**: [Accident Risks overview](/knowledge-base/risks/accident/)

#### 2. Misuse Risks (Intentional Harm)
Actors using AI capabilities for malicious purposes.

**Examples:**
- [Bioweapons](/knowledge-base/risks/misuse/bioweapons/) - AI-assisted pathogen design
- [Cyberweapons](/knowledge-base/risks/misuse/cyberweapons/) - Autonomous hacking at scale
- [Disinformation](/knowledge-base/risks/misuse/disinformation/) - AI-generated propaganda
- [Autonomous Weapons](/knowledge-base/risks/misuse/autonomous-weapons/) - Lethal autonomous weapons systems

**Policy relevance**: This is more similar to traditional dual-use technology governance (nuclear, bio, cyber).

**Key approaches**: Access controls, export restrictions, know-your-customer requirements, international treaties.

**Read**: [Misuse Risks overview](/knowledge-base/risks/misuse/)

#### 3. Structural Risks (Systemic Problems)
How AI reshapes society, power structures, and institutions.

**Examples:**
- [Racing Dynamics](/knowledge-base/risks/structural/racing-dynamics/) - Competition undermining safety
- [Concentration of Power](/knowledge-base/risks/structural/concentration-of-power/) - AI enabling unprecedented control
- [Economic Disruption](/knowledge-base/risks/structural/economic-disruption/) - Mass displacement
- [Lock-in](/knowledge-base/risks/structural/lock-in/) - Permanent entrenchment of values or systems

**Policy relevance**: These require institutional design, antitrust, labor policy, and international coordination.

**Key insight**: Even if individual AI systems are safe, the overall trajectory might be problematic.

**Read**: [Structural Risks overview](/knowledge-base/risks/structural/)

#### 4. Epistemic Risks (Threats to Truth)
AI undermining our ability to distinguish true from false.

**Examples:**
- [Epistemic Collapse](/knowledge-base/risks/epistemic/epistemic-collapse/) - Inability to verify information
- [Trust Erosion](/knowledge-base/risks/epistemic/trust-erosion/) - Loss of faith in institutions
- [Automation Bias](/knowledge-base/risks/accident/automation-bias/) - Over-reliance on AI outputs

**Policy relevance**: Verification frameworks, authentication standards, institutional resilience.

**Read**: [Epistemic Risks overview](/knowledge-base/risks/epistemic/)

### How These Interact

**Critical point**: These risks are not independent.

- **Racing dynamics** (structural) make **accidents** more likely by reducing safety investment
- **Epistemic collapse** makes coordinating on any risk impossible
- **Concentration of power** determines who might cause **misuse**
- **Economic disruption** creates political pressure that may override safety concerns

**Policy implication**: Comprehensive governance must address multiple risk categories simultaneously.

## Policy Landscape and Approaches (45 minutes)

### Current Policy Frameworks

**United States:**
- Executive Order on AI (October 2023) - Broad framework covering safety, security, privacy
- NIST AI Risk Management Framework - Voluntary standards
- Emerging legislation (vary by state and federal proposals)
- Limited specific focus on transformative AI risk

**European Union:**
- EU AI Act - Risk-based regulatory framework
- Classifies AI by risk level (minimal, limited, high, unacceptable)
- Focuses primarily on current systems, less on future transformative AI
- Enforcement through fines and market restrictions

**United Kingdom:**
- [UK AI Safety Institute](/knowledge-base/organizations/government/uk-aisi/) (AISI) - Government research institute
- Focus on frontier AI safety research and evaluations
- "Pro-innovation" approach with light regulation
- Hosted AI Safety Summits (Bletchley Park, Seoul)

**China:**
- Regulations on algorithms, recommendation systems, deepfakes
- Emphasis on political stability and Party control
- Less transparent about frontier AI safety measures
- Significant AI development capability

**International:**
- No binding treaties yet
- Some discussion at UN, G7, OECD
- Bletchley Declaration (non-binding) from UK AI Safety Summit
- Limited substantive coordination so far

**Read**: [Governance Responses](/knowledge-base/responses/governance/)

### High-Leverage Policy Interventions

Based on case studies and expert analysis, these approaches show promise:

#### 1. Compute Governance

**Rationale**: Training frontier AI requires enormous computation (thousands of specialized chips). Compute is:
- Necessary for advanced AI
- Quantifiable and measurable
- Physically embodied (hardware can be tracked)
- Concentrated in supply chain (NVIDIA, TSMC, ASML)

**Policy options:**
- **Know-your-customer requirements** for large compute purchases
- **Export controls** on advanced AI chips (already implemented for China)
- **Mandatory reporting** for training runs above thresholds
- **Compute caps** limiting training run size
- **Allocation systems** for government-controlled compute

**Advantages**: Concrete, verifiable, technical feasibility already demonstrated (see export controls)

**Challenges**: May slow beneficial AI development; China developing domestic alternatives; threshold-setting is contentious

**Case study**: US export controls on advanced chips to China show compute governance is feasible, though long-term effectiveness uncertain.

**Read more**: [Governance Responses](/knowledge-base/responses/governance/) and [International coordination](/knowledge-base/responses/governance/international/)

#### 2. Mandatory Safety Evaluations

**Rationale**: Before deploying potentially dangerous AI, developers should test for hazardous capabilities.

**Policy options:**
- **Pre-deployment evaluation requirements** for models above capability thresholds
- **Third-party audits** (analogous to financial audits)
- **Government evaluation facilities** that test for dangerous capabilities
- **Mandatory reporting** of evaluation results
- **Liability frameworks** for harms from insufficiently evaluated systems

**What to evaluate:**
- **Dangerous capabilities**: Bio/cyber/autonomous weapons assistance
- **Deceptive behavior**: Lying, sandbagging, situational awareness
- **Power-seeking tendencies**: Resource accumulation, self-preservation
- **Alignment properties**: Following instructions, corrigibility

**Current state**:
- Some labs do voluntary evaluations (Anthropic's RSP, OpenAI's preparedness framework)
- UK AISI developing government evaluation capability
- No mandatory requirements yet in most jurisdictions

**Challenges**:
- What thresholds trigger requirements?
- Who is qualified to evaluate?
- Can evaluations keep pace with capabilities?
- Risk of regulatory capture

**Read**: [Evaluations approach](/knowledge-base/responses/alignment/evals/) and [UK AISI](/knowledge-base/organizations/government/uk-aisi/)

#### 3. Licensing and Registration

**Rationale**: Like nuclear facilities, pharmaceuticals, or aviation, high-risk AI development could require licenses.

**Policy options:**
- **Developer licensing**: Permits required to train models above thresholds
- **Deployment authorization**: Approval needed before releasing systems
- **Safety certifications**: Standards for safety practices and personnel
- **Ongoing compliance monitoring**: Regular inspections and reporting

**Threshold design questions:**
- Compute used in training? (e.g., 10^26 FLOPs)
- Capabilities demonstrated? (e.g., benchmark performance)
- Intended use cases? (e.g., critical infrastructure)
- Organizational factors? (e.g., safety team size, governance structure)

**Advantages**: Clear responsibility, enforcement mechanisms, precedent from other industries

**Challenges**: Where to set thresholds? How to avoid stifling innovation? International competitiveness concerns?

**Model**: Nuclear Regulatory Commission (NRC) for nuclear facilities—decades of licensing experience

#### 4. Liability and Insurance

**Rationale**: Making developers liable for harms creates incentives for safety without specifying how to achieve it.

**Policy options:**
- **Strict liability** for damages from AI systems above capability thresholds
- **Mandatory insurance** requirements (pricing risk privately)
- **Compensation funds** for AI-related harms
- **Burden of proof** allocation (does plaintiff prove harm or developer prove safety?)

**Advantages**: Market-based incentives; doesn't require government to specify safety measures

**Challenges**:
- Catastrophic risks may exceed any liability cap
- Proving causation is difficult for AI systems
- Insurance markets may not price unprecedented risks well

**Precedent**: Nuclear Price-Anderson Act (liability limits + mandatory insurance); pharmaceutical liability

**Read**: Lessons from [AI safety history](/knowledge-base/history/)

#### 5. International Coordination Mechanisms

**Rationale**: No single country can ensure global AI safety. Without coordination, race dynamics dominate.

**Policy options:**
- **Treaty frameworks** (analogous to Nuclear Non-Proliferation Treaty)
- **International standards** (like aviation safety standards)
- **Monitoring and verification** regimes
- **Hardware tracking** for compliance verification
- **Collaborative research** on safety (like CERN for particle physics)

**Specific proposals:**
- **International AI Safety Organization** - Analogous to IAEA for nuclear
- **Compute monitoring** - Track large training runs globally
- **Safety standards** - Agreed minimum requirements
- **Information sharing** - Coordinated incident response

**Challenges**:
- US-China tensions make cooperation difficult
- What governance structure? (UN? New organization?)
- Verification is hard (unlike nuclear facilities, AI is information)
- National security concerns limit information sharing

**Precedents**:
- **Nuclear**: NPT, IAEA (some success, but still proliferation)
- **Bioweapons**: BWC (weak verification, limited effectiveness)
- **Aviation**: ICAO (successful technical coordination)
- **Internet**: ICANN (technical coordination model)

**Read**: [International coordination approaches](/knowledge-base/responses/governance/international/) and [AI safety history](/knowledge-base/history/)

#### 6. Institutional Design for Labs

**Rationale**: How AI companies are structured affects their safety incentives.

**Policy options:**
- **Safety governance requirements**: Mandatory safety boards, reporting structures
- **Whistleblower protections**: Protection for employees raising safety concerns
- **Conflict of interest rules**: Limits on commercial incentives for safety teams
- **Transparency requirements**: Disclosure of safety practices, incidents, capability thresholds
- **Equity structures**: Limits on concentration of control (see OpenAI's original non-profit structure)

**Examples of current practice:**
- Anthropic's Long-Term Benefit Trust (intended to prioritize safety over profit)
- OpenAI's original capped-profit structure (now questioned after recent governance crisis)
- DeepMind's ethics board (discontinued)

**Challenges**:
- Hard to verify internal governance from outside
- Commercial pressure may override formal structures
- Talent competition may prevent strict requirements

**Read**: [Organizational Practices](/knowledge-base/responses/organizational-practices/)

## Strategy Considerations (30 minutes)

As you design policy, consider these strategic questions:

### Balancing Innovation and Safety

**The tension**:
- Too restrictive: Slow beneficial AI development, push innovation to less regulated jurisdictions
- Too permissive: Insufficient safety measures, race dynamics dominate

**Framework for thinking about this:**

1. **Risk-based approach**: Heavier regulation for higher-capability systems
2. **Adaptive governance**: Increase restrictions as capabilities approach dangerous thresholds
3. **Sunset provisions**: Regulations expire unless renewed (prevents permanent overregulation)
4. **Safe harbors**: Exemptions for clearly low-risk applications

**Key question**: What capability level justifies precautionary regulation even before demonstrated harm?

**Read**: [Different worldviews](/knowledge-base/worldviews/) on how to weigh these tradeoffs

### Domestic vs. International

**Domestic-only approach:**
- **Advantages**: Faster to implement, full policy control, no need for international consensus
- **Disadvantages**: Competitiveness concerns, innovation may move abroad, doesn't address global risk

**International coordination:**
- **Advantages**: Addresses global risk, reduces race dynamics, enables higher safety standards
- **Disadvantages**: Slow, requires consensus, verification challenges, geopolitical tensions

**Realistic strategy**:
1. Implement domestic measures with international coordination in mind (compatible standards)
2. Build coalitions with like-minded countries (democracies, EU+US+UK)
3. Work toward broader frameworks including China over time
4. Use domestic measures as leverage for international standards

### Timing and Urgency

**When to regulate?**

**Too early:**
- Risk doesn't materialize for decades
- Regulation stifles beneficial innovation
- Technology changes, making regulations obsolete
- Build incorrect regulatory frameworks

**Too late:**
- Dangerous capabilities already deployed
- Industry practices locked in, costly to change
- Race dynamics too advanced to slow
- Irreversible decisions already made

**Current expert view**: We're approximately in the window where lightweight frameworks should be established that can scale up as needed.

**Adaptive approach**:
- Establish monitoring and evaluation infrastructure now
- Create legal frameworks for future regulation (like enabling legislation)
- Implement light requirements that can tighten as capabilities advance
- Build international coordination capacity before it's urgently needed

**Read**: [AI Timeline analysis](/knowledge-base/history/) to calibrate urgency

### Regulatory Capture and Incentives

**Risk**: AI labs may capture regulatory process, designing rules that benefit incumbents.

**Warning signs:**
- Regulations that require resources only large labs have
- Voluntary frameworks that provide legal cover without constraining behavior
- Revolving door between labs and regulatory bodies
- Industry-funded safety research dominating agenda

**Mitigation strategies:**
- Independent evaluation bodies (not funded by labs)
- Transparency requirements (public disclosure of safety practices)
- Whistleblower protections
- Academic and civil society involvement in standard-setting
- Procurement requirements (government only buys from compliant vendors)

**Precedent**: Pharmaceutical regulation (FDA has maintained independence reasonably well); financial regulation (less successful, significant capture)

### Learning from Other Technologies

Historical case studies provide lessons:

**Nuclear Weapons:**
- **Success**: No use in conflict since 1945; some non-proliferation success
- **Failure**: Ongoing proliferation; close calls; verification challenges
- **Lesson**: International coordination possible but imperfect; technology control is hard

**Biotechnology:**
- **Success**: Asilomar conference led to self-regulation; gain-of-function pause showed coordination possible
- **Failure**: BWC has weak verification; dual-use research continues; knowledge proliferation
- **Lesson**: Scientific community can coordinate, but enforcement is hard

**Social Media:**
- **Success**: (unclear if any major successes yet)
- **Failure**: Regulation lagged capabilities by years; massive societal harms before any action
- **Lesson**: Don't wait for demonstrated catastrophic harm before regulating

**Key takeaway**: Early, adaptive governance frameworks are better than waiting for catastrophe.

**Read**: [Case Studies section](/knowledge-base/history/)

## Evaluating Specific Proposals (20 minutes)

When you encounter AI policy proposals, use this framework to evaluate:

### Questions to Ask

1. **What risk does this address?** (Accident, misuse, structural, epistemic?)
2. **What's the mechanism?** (How does this actually reduce risk?)
3. **What's the enforcement?** (How do you ensure compliance?)
4. **What are the costs?** (Innovation slowdown, competitiveness, resources?)
5. **What are the failure modes?** (Regulatory capture, obsolescence, circumvention?)
6. **Is it adaptive?** (Can it scale up or down as needed?)
7. **Is it internationally compatible?** (Could other countries adopt similar frameworks?)
8. **What's the precedent?** (Have similar approaches worked elsewhere?)

### Red Flags

**Proposal should raise skepticism if it:**
- Provides legal cover without actually constraining behavior
- Requires resources only available to large incumbents
- Has no clear enforcement mechanism
- Assumes away key uncertainties (like "we'll know when AI is dangerous")
- Treats all AI equally rather than risk-based approach
- Has no sunset provision or adaptation mechanism
- Ignores international dimensions entirely
- Is designed primarily by those being regulated

### Green Flags

**Proposal is more promising if it:**
- Addresses specific, identifiable risks with clear mechanisms
- Has precedent from other domains
- Includes verification and enforcement
- Scales with capability levels (adaptive)
- Compatible with international coordination
- Involves multiple stakeholders (industry, academia, civil society)
- Has adaptation mechanisms for new information
- Balances safety and innovation considerations

## Recommended Reading Path

Based on your specific policy focus:

### If You're Working on Domestic Regulation

1. [Core Argument](/understanding-ai-risk/core-argument/) - Understand the basic case (1 hour)
2. [Risks Overview](/knowledge-base/risks/) - What you're trying to prevent (1 hour)
3. [Governance Responses](/knowledge-base/responses/governance/) - What exists already (30 min)
4. [Governance Approaches](/knowledge-base/responses/governance/) - Options available (45 min)
5. [Case Studies](/knowledge-base/history/) - Historical lessons (1 hour)

### If You're Working on International Coordination

1. [Coordination Challenges](/understanding-ai-risk/core-argument/coordination/) - Why this is hard (20 min)
2. [Multi-Actor Landscape](/knowledge-base/models/multi-actor-landscape/) - Who's involved (30 min)
3. [Racing Dynamics](/knowledge-base/risks/structural/racing-dynamics/) - What you're trying to prevent (20 min)
4. [International Coordination](/knowledge-base/responses/governance/international/) - Approaches (45 min)
5. [Nuclear Case Study](/knowledge-base/history/) - Historical precedent (30 min)

### If You're Working on Standards and Evaluation

1. [Accident Risks](/knowledge-base/risks/accident/) - What to test for (1 hour)
2. [Evaluations Approach](/knowledge-base/responses/alignment/evals/) - How testing works (30 min)
3. [UK AISI](/knowledge-base/organizations/government/uk-aisi/) - Government evaluation example (20 min)
4. [Organizations](/knowledge-base/organizations/) - Who's developing evaluation frameworks (1 hour)

### If You're Working on Economic/Labor Policy

1. [Economic Disruption](/knowledge-base/risks/structural/economic-disruption/) - Scale of potential displacement (20 min)
2. [Erosion of Agency](/knowledge-base/risks/structural/erosion-of-agency/) - Broader societal impacts (20 min)
3. [Timelines](/understanding-ai-risk/core-argument/timelines/) - When to expect impacts (30 min)
4. [Social Media Case Study](/knowledge-base/history/) - Lessons from previous disruption (20 min)

## Key Organizations to Know

### Government and International

**United States:**
- NIST AI Safety Institute - Standards development
- NSF AI Research - Funding
- OSTP - White House science policy
- Various agency AI offices (DoD, DOE, etc.)

**United Kingdom:**
- UK AI Safety Institute (AISI) - Government research and evaluation
- Department for Science, Innovation & Technology (DSIT)
- Office for AI

**European Union:**
- European AI Office - Implementing EU AI Act
- Various national regulators

**International:**
- UN discussions on AI governance
- OECD AI Policy Observatory
- Partnership on AI (multi-stakeholder)

**Read**: [Organizations overview](/knowledge-base/organizations/) for details

### Research and Advisory

**Safety-focused:**
- [ARC (Alignment Research Center)](/knowledge-base/organizations/safety-orgs/arc/) - Evaluations and research
- [MIRI (Machine Intelligence Research Institute)](/knowledge-base/organizations/safety-orgs/miri/) - Theoretical safety
- [Centre for the Governance of AI (GovAI)](/knowledge-base/organizations/safety-orgs/govai/) - Policy research

**Frontier Labs:**
- [Anthropic](/knowledge-base/organizations/labs/anthropic/) - "Safety-focused" commercial lab
- [OpenAI](/knowledge-base/organizations/labs/openai/) - Commercial lab with safety team
- [DeepMind](/knowledge-base/organizations/labs/deepmind/) - Google's AI lab with safety research

**Academic Centers:**
- [CAIS (Center for AI Safety)](/knowledge-base/organizations/safety-orgs/cais/) - Field-building and research
- [CHAI (Center for Human-Compatible AI)](/knowledge-base/organizations/safety-orgs/chai/) - UC Berkeley
- Various university groups

**Read**: Individual organization pages for their policy positions and recommendations

## Common Misconceptions

As you develop policy, avoid these common errors:

**Misconception: "AI safety is just AI ethics"**
**Reality**: Related but distinct. AI ethics focuses on fairness, bias, accountability, transparency (important!). AI safety focuses additionally on catastrophic risks from highly capable systems.

**Misconception: "The experts all agree on the risk level"**
**Reality**: Significant disagreement. Estimates of catastrophic risk range from \<1% to \>90%. This uncertainty itself is policy-relevant.

**Misconception: "We can wait for demonstrated harms before regulating"**
**Reality**: With sufficiently capable systems, the first catastrophic failure might be irreversible. Some precautionary regulation may be warranted.

**Misconception: "Technical solutions will handle this"**
**Reality**: Technical safety research is necessary but likely insufficient. Governance is required even if technical problems are solved.

**Misconception: "If it's risky, labs just won't build it"**
**Reality**: Competitive and commercial pressures create incentives to advance capabilities even with recognized risks. This is why policy is needed.

**Misconception: "China will race ahead if we regulate"**
**Reality**: Maybe, but not regulating guarantees a race. International coordination is the only way out of this trap.

**Misconception: "We need to solve this once and for all"**
**Reality**: Adaptive governance that evolves with capabilities is better than trying to design perfect permanent frameworks.

## Your Role

As a policymaker, you have unique leverage:

**You can:**
- Establish evaluation requirements before catastrophic capabilities are reached
- Create legal frameworks that scale with risk levels
- Build international coordination infrastructure
- Design institutional incentives for safety
- Ensure public interest representation (not just industry)
- Create accountability mechanisms

**You should be skeptical of:**
- Industry self-regulation as sufficient
- "Trust us" claims without verification
- Voluntary frameworks without enforcement
- Proposals designed primarily by those being regulated
- Claims that any regulation will cripple innovation

**You should consider:**
- Expert disagreement is real—this is a genuinely uncertain situation
- Early, adaptive frameworks are better than waiting for catastrophe
- International coordination is essential but difficult
- Perfect shouldn't be enemy of good—some governance better than none
- Both excessive and insufficient regulation have costs

## Next Steps

Depending on your specific role:

**If you're drafting legislation:**
1. Review [governance responses](/knowledge-base/responses/governance/) to understand existing frameworks
2. Study [case studies](/knowledge-base/history/) for precedents
3. Consult [governance approaches](/knowledge-base/responses/governance/) for options
4. Engage experts across perspectives (not just industry)
5. Design adaptive frameworks that can evolve

**If you're working on international coordination:**
1. Understand [multi-actor dynamics](/knowledge-base/models/multi-actor-landscape/)
2. Review [international coordination approaches](/knowledge-base/responses/governance/international/)
3. Study [nuclear case study](/knowledge-base/history/) for lessons
4. Identify possible coalition partners
5. Start with technically feasible measures (compute monitoring)

**If you're setting standards:**
1. Understand [what to evaluate](/knowledge-base/responses/alignment/evals/)
2. Learn about [specific risks](/knowledge-base/risks/) to test for
3. Review [UK AISI](/knowledge-base/organizations/government/uk-aisi/) as government evaluation model
4. Engage technical experts on measurement
5. Design adaptive standards that evolve with capabilities

**If you're still learning:**
1. Read the [Core Argument](/understanding-ai-risk/core-argument/) to understand the case
2. Review [Different Worldviews](/knowledge-base/worldviews/) to understand disagreement
3. Study [Case Studies](/knowledge-base/history/) for historical precedent
4. Explore [Responses](/knowledge-base/responses/) for what can be done
5. Reach out to researchers for briefings

## Additional Resources

**For regular updates:**
- AI safety policy newsletters
- Government AI safety institute publications
- Think tank reports (CNAS, CSET, Georgetown, etc.)
- Academic publications on AI governance

**For technical background:**
- This wiki's [technical safety approaches](/knowledge-base/responses/alignment/)
- NIST AI Risk Management Framework
- UK government AI safety research
- Academic computer science explainers

**For international coordination:**
- UN AI discussions
- OECD AI Policy Observatory
- Belfer Center reports
- Council on Foreign Relations materials

**For historical precedent:**
- Nuclear governance literature
- Biotechnology governance
- Dual-use research policy
- Technology regulation case studies

The field of AI policy is young and rapidly evolving. Early movers have outsized influence on frameworks that may persist for decades. Your work matters.

Good luck.
