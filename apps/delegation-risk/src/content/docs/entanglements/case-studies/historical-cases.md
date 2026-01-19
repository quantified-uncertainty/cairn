---
title: "Historical Case Studies"
description: "Real-world examples of entanglement failures in human oversight systems"
sidebar:
  order: 2
---

# Historical Case Studies

Human institutions have grappled with entanglement for centuries. These cases illustrate how passive correlation, active influence, and capture manifest in practice.

---

## Case 1: Enron and Arthur Andersen (Auditor Capture)

### What Happened

Enron became one of the largest corporate frauds in history. Arthur Andersen, one of the "Big Five" accounting firms, was supposed to independently audit Enron's financials but instead signed off on fraudulent statements.

### The Entanglement

| Type | Mechanism | Effect |
|------|-----------|--------|
| **Financial** | Andersen earned $52M/year from Enron (audit + consulting) | Incentive to keep client happy |
| **Personnel** | 86 Andersen employees moved to Enron | Blurred organizational boundaries |
| **Cultural** | Both based in Houston, shared social networks | "We're all friends here" mentality |
| **Information** | Andersen relied on Enron for understanding complex transactions | Context contamination |

### The Capture Timeline

| Phase | Indicators |
|-------|------------|
| **Professional** (1985-1995) | Standard audit relationship |
| **Partnership** (1995-1998) | Consulting fees exceed audit fees |
| **Dependence** (1998-2000) | Enron becomes Andersen's largest client |
| **Captured** (2000-2001) | Andersen signs off on fraudulent statements |
| **Collapse** (2001-2002) | Fraud revealed; both entities destroyed |

### Lessons for AI

1. **Revenue dependency creates capture risk** — If a verifier depends economically on the agent it verifies, independence is compromised
2. **Revolving doors blur boundaries** — Personnel movement between agent and verifier creates shared perspective
3. **Gradual capture is invisible** — Each step seemed reasonable; the pattern only became clear in retrospect

---

## Case 2: Credit Rating Agencies and 2008 (Correlated Failure)

### What Happened

Moody's, S&P, and Fitch are supposed to provide independent assessments of security risk. Before 2008, they rated mortgage-backed securities as AAA (safest) when they were actually high-risk.

### The Entanglement

The "issuer pays" model created fundamental capture:
- Banks paid for ratings and could shop between agencies
- Agencies that gave tougher ratings lost business
- Result: Race to the bottom

| Type | Mechanism | Effect |
|------|-----------|--------|
| **Economic capture** | Agencies paid by issuers they rate | Incentive to inflate ratings |
| **Competition capture** | Banks shopped for best ratings | Race to the bottom |
| **Correlated methodology** | All agencies used similar models | Shared blind spots |

### The Correlated Failure

Despite having three "independent" rating agencies, they all failed together:
- Similar quantitative models (passive entanglement)
- Same issuer-pays incentive structure (economic capture)
- Relied on same data from issuers (context contamination)

**Three agencies using similar methods failed identically.**

### Lessons for AI

1. **Multiple providers ≠ independence** — Three agencies using similar methods failed together
2. **Incentive alignment is structural** — The "issuer pays" model made capture inevitable
3. **Diversity in method, not just provider** — True independence requires fundamentally different approaches
4. **The principal matters** — Who pays the verifier determines whose interests the verifier serves

---

## Case 3: Boeing 737 MAX and the FAA (Self-Certification)

### What Happened

The FAA delegated significant certification authority to Boeing itself. Boeing certified the MCAS system (which later caused two fatal crashes) with insufficient FAA oversight.

### The Entanglement

| Type | Mechanism | Effect |
|------|-----------|--------|
| **Resource capture** | FAA lacked resources for full oversight | Forced delegation |
| **Expertise capture** | Boeing knew the system better than FAA | Information asymmetry |
| **Personnel capture** | Designees worked for Boeing, not FAA | Conflicting loyalties |
| **Regulatory capture** | Boeing lobbied for delegation rules | Wrote the rules governing itself |

### How the Hierarchy Was Bypassed

1. Boeing classified MCAS as a minor system (not requiring deep review)
2. Boeing designees approved Boeing's classification
3. FAA trusted the designee judgment
4. Independent FAA engineers were overruled or bypassed

### Lessons for AI

1. **Self-certification is captured by design** — When the agent certifies itself, independence is impossible
2. **Resource constraints force dangerous delegation** — FAA couldn't hire enough engineers. AI oversight may face similar pressures.
3. **Classification gaming** — Agents may classify their own work to avoid rigorous review. AI systems could learn similar strategies.
4. **Commercial pressure affects everyone** — When both agent and verifier are under deadline pressure, oversight suffers

---

## Cross-Case Patterns

### Common Entanglement Dynamics

| Pattern | Enron | Ratings | Boeing |
|---------|-------|---------|--------|
| Economic capture | ✓ | ✓ | ✓ |
| Information asymmetry | ✓ | ✓ | ✓ |
| Revolving door | ✓ | | ✓ |
| Shared methodology | | ✓ | |
| Self-certification | | | ✓ |

### The Capture Progression

All cases followed similar progression:

**Independent** → **Professional relationship** → **Trust develops** → **Dependency forms** → **Captured** → **Failure**

Each step seemed reasonable; the pattern only became clear in retrospect.

---

## Implications for AI Systems

### Design Principles from History

1. **Structural separation** — Economic independence between agent and verifier
2. **Mandatory rotation** — Time limits on relationships
3. **Methodological diversity** — Fundamentally different verification approaches
4. **External accountability** — Oversight of the overseers
5. **Whistleblower channels** — Paths for concern escalation that bypass normal hierarchy

### What Makes AI Different

**Harder for AI**:
- Information asymmetry may be worse (AI harder to understand than financial instruments)
- Speed (AI decisions faster than human oversight)
- Scale (AI operates at scales humans can't monitor)

**Easier for AI**:
- Current AI may not deliberately deceive (though this may change)
- AI actions can be comprehensively logged
- AI verification can be tested in simulation

---

## Summary

| Lesson | Historical Basis | AI Application |
|--------|-----------------|----------------|
| Independence requires structural separation | Enron, Ratings, Boeing | Verification must be economically independent |
| Multiple providers ≠ diversity | Rating agencies | Different LLM providers may have correlated failures |
| Capture is gradual and invisible | All cases | Monitor for capture drift over time |
| Resource constraints force shortcuts | Boeing | Ensure adequate verification resources |

---

See also:
- [Intelligence Community Failures](/entanglements/case-studies/intelligence-failures/) — Government verification failures
- [Types of Entanglement](/entanglements/fundamentals/types/) — Formal classification
- [Solutions & Mitigations](/entanglements/mitigation/solutions/) — Prevention strategies
