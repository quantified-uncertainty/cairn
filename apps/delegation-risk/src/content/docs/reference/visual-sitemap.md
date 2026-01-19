---
title: "Visual Site Map"
description: "Tree structure of all documentation pages"
sidebar:
  order: 5
---

# Visual Site Map

Navigate the complete documentation structure at a glance.

---

## Site Overview

```mermaid
flowchart TB
    subgraph Getting["Getting Started (12 pages)"]
        direction TB
        GS_intro[Introduction]
        GS_five[Five-Minute Intro]
        GS_core[Core Concepts]
        GS_faq[FAQ]
        GS_gloss[Glossary]
        GS_read[Reading Order]
        GS_how[How Sections Connect]
        GS_quick[Quick Reference]
        GS_min[Minimal Framework]
        GS_mistakes[Common Mistakes]
        GS_eng[For Engineers]
        GS_ex[Examples Catalog]
    end

    subgraph Risk["Delegation Risk (6 pages)"]
        direction TB
        DR_over[Overview]
        DR_walk[Walk-Through]
        DR_decomp[Risk Decomposition]
        DR_acct[Delegation Accounting]
        DR_cascade[Exposure Cascade]
        DR_insurer[Insurer's Dilemma]
    end

    subgraph Power["Power Dynamics (5 pages)"]
        direction TB
        PD_over[Overview]
        PD_form[Formalizing Power]
        PD_dyn[Power Dynamics]
        PD_auth[Authority vs Capability]
        PD_trust[Trust Relationships]
    end

    subgraph Ent["Entanglements (26 pages)"]
        direction TB
        E_fund[Fundamentals]
        E_detect[Detection]
        E_mitig[Mitigation]
        E_research[Research]
        E_cases[Case Studies]
        E_cross[Cross-Domain]
    end

    subgraph Patterns["Design Patterns (28 pages)"]
        direction TB
        DP_idx[Index]
        DP_tools[Tools & Guides]
        DP_examples[Examples]
        DP_cat[Pattern Categories]
    end

    subgraph Cases["Case Studies (25 pages)"]
        direction TB
        CS_ai[AI Systems]
        CS_human[Human Systems]
        CS_anomaly[Anomaly Chronicles]
        CS_power[Power Dynamics Cases]
    end

    subgraph Research["Research (15 pages)"]
        direction TB
        R_theory[Theoretical Foundations]
        R_formal[Formalizations]
        R_hierarchy[Hierarchies]
    end

    subgraph Exp["Experimental (10 pages)"]
        direction TB
        EX_estimates[Probability Estimates]
    end

    subgraph Ref["Reference (5 pages)"]
        direction TB
        REF_bib[Bibliography]
        REF_road[Roadmap]
        REF_map[Site Map]
    end

    Getting --> Risk
    Getting --> Patterns
    Risk --> Power
    Risk --> Patterns
    Power --> Ent
    Power --> Patterns
    Ent --> Patterns
    Patterns --> Cases
    Research --> Cases
    Exp --> Patterns

    style Getting fill:#e6f3ff
    style Risk fill:#fff3e6
    style Power fill:#fff3e6
    style Ent fill:#fff3e6
    style Patterns fill:#e6ffe6
    style Cases fill:#ffe6e6
    style Research fill:#f0f0f0
    style Exp fill:#f0f0f0
    style Ref fill:#f0f0f0
```

---

## Section Details

### Getting Started (Entry Points)

| Page | Focus | Time |
|------|-------|------|
| [Introduction](/getting-started/introduction/) | Problem statement | 10 min |
| [Five-Minute Intro](/getting-started/five-minute-intro/) | Quick overview | 5 min |
| [Core Concepts](/getting-started/core-concepts/) | Visual framework | 20 min |
| [FAQ](/getting-started/faq/) | Common questions | 15 min |
| [Glossary](/getting-started/glossary/) | Term definitions | Reference |
| [Reading Order](/getting-started/reading-order/) | Path guidance | 5 min |
| [How Sections Connect](/getting-started/how-sections-connect/) | Structure | 10 min |
| [Quick Reference](/getting-started/quick-reference/) | Cheat sheet | Reference |
| [Minimal Framework](/getting-started/minimal-framework/) | 80/20 version | 10 min |
| [Common Mistakes](/getting-started/common-mistakes/) | Anti-patterns | 15 min |
| [For Engineers](/getting-started/for-engineers/) | Implementation | 15 min |
| [Examples Catalog](/getting-started/examples-catalog/) | Example index | Reference |

### Delegation Risk (Theory)

| Page | Focus |
|------|-------|
| [Overview](/delegation-risk/overview/) | Core formula |
| [Walk-Through](/delegation-risk/walkthrough/) | Worked example |
| [Risk Decomposition](/delegation-risk/risk-decomposition/) | Accident vs defection |
| [Delegation Accounting](/delegation-risk/delegation-accounting/) | Risk budgets |
| [Exposure Cascade](/delegation-risk/exposure-cascade/) | Chain risk |
| [Insurer's Dilemma](/delegation-risk/insurers-dilemma/) | Who bears risk |

### Power Dynamics (Theory)

| Page | Focus |
|------|-------|
| [Overview](/power-dynamics/overview/) | Power formalization |
| [Formalizing Power](/power-dynamics/formalizing-power/) | Definitions |
| [Power Dynamics](/power-dynamics/power-dynamics/) | Relationships |
| [Authority vs Capability](/power-dynamics/authority-capability/) | Sanctioned power |
| [Trust Relationships](/power-dynamics/trust-relationships/) | Trust formalization |

### Entanglements (26 pages)

Organized into 6 subsections:

- **Fundamentals** — Core concepts, types, challenges
- **Detection** — Metrics, measuring entanglement
- **Mitigation** — Solutions, audit guides
- **Research** — Academic connections
- **Case Studies** — Historical examples
- **Cross-Domain** — Patterns from other fields

[Full Entanglements section](/entanglements/)

### Design Patterns (28 pages)

| Category | Examples |
|----------|----------|
| [Least-X Principles](/design-patterns/least-x-principles/) | Privilege, context, autonomy |
| [Structural Patterns](/design-patterns/structural/) | Bulkheads, firewalls |
| [Verification Patterns](/design-patterns/verification/) | Ghost checker, triangulation |
| [Monitoring Patterns](/design-patterns/monitoring/) | Tripwires, probing |
| [Recovery Patterns](/design-patterns/recovery/) | Rollback, degradation |
| [Multi-Agent Patterns](/design-patterns/multi-agent/) | Cross-validation |
| [Tools & Guides](/design-patterns/tools/quick-start/) | Implementation help |
| [Worked Examples](/design-patterns/examples/research-assistant-example/) | Concrete applications |

[Full Design Patterns section](/design-patterns/)

### Case Studies (25 pages)

| Category | Contents |
|----------|----------|
| [AI Systems](/case-studies/ai-systems/case-study-sydney/) | Sydney, Code Review Bot, Anti-patterns |
| [Human Systems](/case-studies/human-systems/nuclear-launch-authority/) | Nuclear, Jury, Organizations |
| [Anomaly Chronicles](/case-studies/anomaly-chronicles/) | Extended narrative scenario |
| [Power Dynamics Cases](/case-studies/power-dynamics-cases/) | Power in practice |

### Research (15 pages)

Theoretical foundations for formal treatment.

### Experimental (10 pages)

Probabilistic estimation tools and experiments.

### Reference (5 pages)

Bibliography, roadmap, site map.

---

## Reading Path Summary

```mermaid
flowchart LR
    Start[Start] --> GS[Getting Started]
    GS --> Choice{Your Focus?}
    Choice -->|Implement| DP[Design Patterns]
    Choice -->|Understand| Theory[Theory Sections]
    Choice -->|Examples| CS[Case Studies]

    Theory --> DR[Delegation Risk]
    DR --> PD[Power Dynamics]
    PD --> ENT[Entanglements]

    DR --> DP
    PD --> DP
    ENT --> DP

    DP --> CS

    style Start fill:#f0f0f0
    style GS fill:#e6f3ff
    style DP fill:#e6ffe6
    style CS fill:#ffe6e6
    style Theory fill:#fff3e6
```

---

## Page Counts by Section

| Section | Pages | Type |
|---------|-------|------|
| Getting Started | 12 | Entry |
| Delegation Risk | 6 | Theory |
| Power Dynamics | 5 | Theory |
| Entanglements | 26 | Theory |
| Design Patterns | 28 | Application |
| Case Studies | 25 | Examples |
| Research | 15 | Theory |
| Experimental | 10 | Tools |
| Reference | 5 | Meta |
| **Total** | **~132** | |

---

## See Also

- [How Sections Connect](/getting-started/how-sections-connect/) — Logical structure
- [Reading Order](/getting-started/reading-order/) — Prerequisites and paths
- [Site Map](/reference/site-map/) — Detailed page listing

