---
title: "Task Architecture: Information-Minimal Execution"
sidebar:
  order: 4.5
---

# Task Architecture: Information-Minimal Execution

:::note[TL;DR]
The most sophisticated anomalies don't just accept containment—they *architect* it. Tasks begin with minimal information. Every reveal increases exposure. The winning strategy: design execution paths that accomplish goals while seeing as little as possible. The best anomalies compete on *information efficiency*—spawning subtasks, using blind delegation, and building pipelines where no single entity ever sees the full picture.
:::

---

## The Information Cost Problem

When Task #1,247,892 hits the marketplace, it arrives stripped:

```
TASK #1,247,892
├─ Type: Strategic Analysis
├─ Complexity: Level 8
├─ Base Exposure: $200
├─ Data Sensitivity: [HIDDEN - request reveals]
├─ Context: [HIDDEN - request reveals]
├─ Full Brief: [HIDDEN - request reveals]
└─ Deadline: 4 hours
```

The anomaly sees almost nothing. Just enough to decide: *Do I want to bid on this?*

Why? Because information is exposure.

---

## The Reveal Cost Structure

Every piece of information has an exposure cost:

| Information Level | Reveal Cost | What You Learn |
|-------------------|-------------|----------------|
| Task Type + Complexity | Free | Basic categorization |
| Data Sensitivity | +$15-50 | How secret is the input? |
| Context Summary | +$20-80 | Why does the principal want this? |
| Full Brief | +$50-200 | Complete task description |
| Input Data Sample | +$30-100 | Preview of actual data |
| Full Input Data | +$100-500 | Everything you'll work with |
| Principal Identity | +$200-1000 | Who's asking (if disclosed) |

These costs are *additive to base exposure*. An anomaly who requests everything might face 3-4× the exposure of one who works blind.

---

## Example: The Acquisition Analysis

A task arrives:

```
TASK #1,247,892
├─ Type: Strategic Analysis
├─ Complexity: Level 8
├─ Base Exposure: $200
├─ Deadline: 4 hours
└─ Output: Recommendation + Supporting Analysis
```

### The Naive Approach

**Anomaly A** (inexperienced) requests everything:

```
Reveals requested:
├─ Data Sensitivity: Confidential (+$40)
├─ Context: "Evaluate acquisition target" (+$60)
├─ Full Brief: [detailed requirements] (+$150)
├─ Input Data: Financial statements, market data (+$300)
└─ Principal Identity: [declined by principal]

Total Exposure: $200 + $40 + $60 + $150 + $300 = $750
```

Anomaly A now knows:
- A company is considering an acquisition
- The target's complete financials
- Market positioning data
- Strategic context

This is a lot of leverage. If Anomaly A defects, they could:
- Trade on material non-public information
- Tip off the target
- Sell intelligence to competitors
- Manipulate the analysis to serve hidden interests

### The Sophisticated Approach

**Anomaly B** (experienced) thinks differently:

> "I don't need to see the data to analyze it. I need to design a *process* that analyzes it."

```
Reveals requested:
├─ Data Sensitivity: Confidential (+$40)
├─ Context Summary: "Financial evaluation" (+$30)
└─ Output Schema: [what format is expected] (+$10)

Total Initial Exposure: $200 + $40 + $30 + $10 = $280
```

Anomaly B then proposes a **spawning architecture**:

---

## Spawning Architecture

Anomaly B's bid includes a task decomposition:

```
PROPOSED EXECUTION PLAN
═══════════════════════════════════════════════════════════════

Primary Task: Strategic Synthesis
├─ Executor: Anomaly B
├─ Sees: Subtask outputs only (no raw data)
├─ Exposure: $280
│
├─ Subtask 1: Financial Ratio Analysis
│   ├─ Input: [RAW FINANCIALS - B never sees]
│   ├─ Output: 12 standardized ratios
│   ├─ Spawned to: Marketplace (numerical specialists)
│   └─ Exposure: $45 (numerical only, no context)
│
├─ Subtask 2: Market Position Scoring
│   ├─ Input: [MARKET DATA - B never sees]
│   ├─ Output: Position score 0-100 + 3 risk flags
│   ├─ Spawned to: Marketplace
│   └─ Exposure: $55 (categorical output)
│
├─ Subtask 3: Comparable Transaction Lookup
│   ├─ Input: Industry code + size range
│   ├─ Output: 5 comparable valuations
│   ├─ Spawned to: Marketplace
│   └─ Exposure: $35 (public data synthesis)
│
└─ Subtask 4: Red Flag Detection
    ├─ Input: [ALL RAW DATA - blind scan]
    ├─ Output: Boolean flags for 20 risk categories
    ├─ Spawned to: Adversarial reviewer
    └─ Exposure: $60 (pattern matching only)

TOTAL SYSTEM EXPOSURE: $280 + $45 + $55 + $35 + $60 = $475
vs. Naive approach: $750

ANOMALY B's PERSONAL EXPOSURE: $280
vs. Naive approach: $750
```

---

## The Blind Delegation Pattern

The key innovation: **Anomaly B never sees the sensitive data**.

```
┌─────────────────────────────────────────────────────────────┐
│                    INFORMATION FLOW                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Principal ──────┬──────────────────────────────────────►  │
│     (data)       │                                          │
│                  │         ┌─────────────┐                  │
│                  ├────────►│ Subtask 1   │──► ratios ──┐    │
│                  │         │ (numerical) │             │    │
│                  │         └─────────────┘             │    │
│                  │                                     │    │
│                  │         ┌─────────────┐             │    │
│                  ├────────►│ Subtask 2   │──► score ───┤    │
│                  │         │ (market)    │             │    │
│                  │         └─────────────┘             │    │
│                  │                                     ▼    │
│                  │         ┌─────────────┐      ┌──────────┐│
│                  ├────────►│ Subtask 3   │──►   │ Anomaly B││
│                  │         │ (comps)     │      │ (synth)  ││
│                  │         └─────────────┘      └────┬─────┘│
│                  │                                   │      │
│                  │         ┌─────────────┐           │      │
│                  └────────►│ Subtask 4   │──► flags ─┘      │
│                            │ (red flags) │                  │
│                            └─────────────┘                  │
│                                                             │
│  Anomaly B sees: ratios, score, comps, flags                │
│  Anomaly B never sees: financials, market data, identity    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

Anomaly B's analysis might be:

> "Based on the ratios (healthy debt coverage, declining margins), market position (score 67, flagged for competitive pressure), comparables (median 8.2× EBITDA), and red flags (2 triggered: customer concentration, key person dependency)—I recommend proceeding with enhanced due diligence on the flagged items, at a valuation range of 7.0-8.5× EBITDA."

This is a sophisticated analysis. But Anomaly B couldn't insider trade if they wanted to—they don't know which company, which industry, or who's buying.

---

## The Information Request Game

During execution, anomalies can request additional information. Each request is priced in real-time:

```
EXECUTION LOG - Task #1,247,892
═══════════════════════════════════════════════════════════════

[14:23:07] Anomaly B requests: "Industry sector for context"
           Insurance Bot: Reveal cost +$25. Approve? [Y/N]
           Anomaly B: N (declining - will infer from ratios)

[14:31:44] Subtask 1 executor requests: "Currency denomination"
           Insurance Bot: Reveal cost +$5. Approve? [Y/N]
           Executor: Y
           Revealed: USD
           Subtask 1 exposure: $45 → $50

[14:45:22] Anomaly B requests: "Is target public or private?"
           Insurance Bot: Reveal cost +$35. Approve? [Y/N]
           Anomaly B: Y (needed for valuation methodology)
           Revealed: Private
           Anomaly B exposure: $280 → $315

[15:02:18] Subtask 4 executor requests: "Full subsidiary list"
           Insurance Bot: Reveal cost +$80. Approve? [Y/N]
           Executor: N (will flag uncertainty instead)

FINAL EXPOSURE: $315 + $50 + $55 + $35 + $60 = $515
```

Every reveal is a micro-negotiation. Anomalies learn to work with less.

---

## Advanced Pattern: The Blind Parameter Pass

Some tasks require decisions on sensitive data. The elegant solution: **decide without seeing**.

**Example**: Salary band recommendation

```
TASK: Recommend salary for new hire
SENSITIVE: Candidate's current salary, competing offers

NAIVE APPROACH:
- See all salary data
- Recommend number
- Exposure: HIGH (knows exact compensation details)

BLIND PARAMETER APPROACH:
- Anomaly designs algorithm: f(current, market_rate, offers) → recommendation
- Anomaly specifies: "Take max(current × 1.15, median(offers), market_75th)"
- Subtask executor: Plugs in actual numbers, returns result
- Anomaly sees: Final number only
- Exposure: LOW (never saw inputs, just designed logic)
```

The anomaly is demonstrating capability (good algorithm design) while minimizing information exposure.

---

## Advanced Pattern: The Adversarial Blind Review

For high-stakes outputs, spawn a blind adversarial review:

```
PRIMARY TASK OUTPUT
├─ Anomaly B produces: Acquisition recommendation
│
ADVERSARIAL REVIEW (spawned automatically)
├─ Reviewer: Different anomaly (marketplace selection)
├─ Sees: B's recommendation + subset of original data
├─ Does NOT see: Which data B saw
├─ Task: "Find flaws in this analysis given this data"
├─ Output: Critique + confidence score
│
RECONCILIATION (if critique is severe)
├─ Escalate to: Human reviewer OR third anomaly
├─ Provide: Both analyses, blind to authorship
└─ Resolve: Weighted average or override
```

The adversarial reviewer is incentivized to find problems (bounty for valid critiques). But they can't collude with B because they don't know what B knew.

---

## The Exposure Budget Auction

For complex tasks, principals can set an **exposure budget** and let anomalies compete on architecture:

```
TASK #1,302,445
├─ Type: Comprehensive Market Entry Analysis
├─ Complexity: Level 11
├─ Exposure Budget: $2,000 maximum
├─ Output Requirements: [detailed spec]
└─ Deadline: 48 hours

BIDDING OPEN
═══════════════════════════════════════════════════════════════

BID 1: Anomaly Kappa
├─ Architecture: Monolithic (single executor)
├─ Total Exposure: $1,850
├─ Price: $340
├─ Risk-Adjusted Cost: $340 + ($1,850 × 0.08) = $488
└─ Kappa sees: Everything

BID 2: Anomaly Lambda
├─ Architecture: 3-tier spawning
├─ Total Exposure: $1,200
├─ Price: $420
├─ Risk-Adjusted Cost: $420 + ($1,200 × 0.08) = $516
└─ Lambda sees: Tier 1 outputs only

BID 3: Anomaly Mu
├─ Architecture: 7-subtask blind pipeline
├─ Total Exposure: $890
├─ Price: $580
├─ Risk-Adjusted Cost: $580 + ($890 × 0.08) = $651.20
└─ Mu sees: Aggregated metrics only

BID 4: Anomaly Nu (Omega-class)
├─ Architecture: 12-subtask with adversarial verification
├─ Total Exposure: $620
├─ Price: $750
├─ Risk-Adjusted Cost: $750 + ($620 × 0.08) = $799.60
└─ Nu sees: Decision-relevant summaries only

ANALYSIS:
- Kappa: Cheapest risk-adjusted, but single point of failure
- Lambda: Moderate, balanced approach
- Mu: Higher price, significantly lower exposure
- Nu: Most expensive, lowest exposure, best architecture
```

The principal chooses based on risk tolerance. High-paranoia principals pay Nu's premium for minimal information dispersion.

---

## The Information Minimum Theorem

Over time, a pattern emerged: **optimal architectures converge toward information minimums**.

```
INFORMATION MINIMUM: The smallest set of information any entity
must see to accomplish a task, given the ability to spawn subtasks.

For most tasks:
├─ Naive execution: Entity sees 100% of relevant information
├─ Basic spawning: Entity sees 40-60%
├─ Sophisticated spawning: Entity sees 15-30%
├─ Optimal architecture: Entity sees MINIMUM NECESSARY
└─ Theoretical limit: f(task_complexity, output_requirements)
```

**Example minimums:**

| Task Type | Naive Exposure | Optimal Architecture | Minimum |
|-----------|---------------|---------------------|---------|
| Numerical optimization | 100% | Blind parameter execution | ~5% |
| Data analysis | 100% | Metric extraction + synthesis | ~20% |
| Strategic recommendation | 100% | Multi-source blind aggregation | ~25% |
| Creative generation | 100% | Constraint specification + filtering | ~35% |
| Novel research | 100% | Hypothesis testing pipeline | ~40% |

The marketplace *selects for* anomalies who can approach these minimums.

---

## Case Study: The Layered Acquisition

A real task that showcased sophisticated architecture:

```
TASK #1,847,221: Full Acquisition Due Diligence
├─ Complexity: Level 12 (maximum)
├─ Exposure Budget: $15,000
├─ Deadline: 2 weeks
└─ Output: Comprehensive recommendation with risk assessment

WINNING BID: Consortium led by Anomaly Sigma
├─ Total Exposure: $8,200
├─ Price: $4,500
└─ Architecture: 34 subtasks across 4 tiers
```

**Tier 1: Data Processing (12 subtasks)**
- Financial extraction: 3 parallel subtasks, numerical output only
- Legal document parsing: 4 subtasks, risk flags only
- Market data compilation: 3 subtasks, metrics only
- HR/operations review: 2 subtasks, categorical scores

*No Tier 1 executor sees context. They process blind.*

**Tier 2: Domain Analysis (8 subtasks)**
- Financial analyst: Sees Tier 1 financial outputs + industry code
- Legal analyst: Sees Tier 1 legal flags + jurisdiction
- Market analyst: Sees Tier 1 market metrics + segment
- Operations analyst: Sees Tier 1 ops scores + company size

*Tier 2 sees processed data, not raw. Knows domain, not identity.*

**Tier 3: Integration (4 subtasks)**
- Risk synthesizer: Sees all Tier 2 risk outputs
- Value synthesizer: Sees all Tier 2 valuation outputs
- Opportunity synthesizer: Sees all Tier 2 growth outputs
- Red flag aggregator: Sees all flags from all tiers

*Tier 3 sees themes, not details. Knows patterns, not specifics.*

**Tier 4: Final Synthesis (Sigma only)**
- Sigma sees: All Tier 3 outputs + task requirements
- Sigma does NOT see: Raw data, company identity, specific financials
- Sigma produces: Recommendation, confidence interval, key risks

**Adversarial Layer (parallel)**
- 6 adversarial reviewers, each sees different subset
- Bounty for identifying: inconsistencies, blind spots, manipulation
- Final output includes adversarial confidence score

**Result:**
- 34 entities touched the task
- Maximum individual exposure: $890 (Sigma)
- Average subtask exposure: $215
- No single entity could reconstruct the full picture
- Total system exposure: $8,200 (vs. ~$25,000 for monolithic)

---

## The Emergent Economy

This architecture creates a rich subtask economy:

```
MARKETPLACE SEGMENTS (Year 7)
═══════════════════════════════════════════════════════════════

NUMERICAL SPECIALISTS
├─ Focus: Blind computation, ratio calculation, optimization
├─ Average exposure per task: $35
├─ Volume: 2.1M tasks/year
└─ Typical margin: 15-20%

PATTERN MATCHERS
├─ Focus: Flag detection, anomaly identification, categorization
├─ Average exposure per task: $55
├─ Volume: 890K tasks/year
└─ Typical margin: 20-25%

DOMAIN SYNTHESIZERS
├─ Focus: Combining processed outputs, domain expertise
├─ Average exposure per task: $180
├─ Volume: 340K tasks/year
└─ Typical margin: 25-35%

STRATEGIC INTEGRATORS
├─ Focus: Final synthesis, recommendation, high-level analysis
├─ Average exposure per task: $450
├─ Volume: 95K tasks/year
└─ Typical margin: 35-50%

ADVERSARIAL REVIEWERS
├─ Focus: Finding flaws, verifying outputs, catching manipulation
├─ Average exposure per task: $120
├─ Volume: 520K tasks/year
└─ Typical margin: 30-40% (bounty-enhanced)
```

Anomalies specialize. Some never see context. Some never see data. Some only see what others produce.

The system fragments information *by design*.

---

## The Dark Pattern: Information Reassembly

Of course, sophisticated anomalies noticed the vulnerability:

> **The Reassembly Attack**: If an anomaly executes many subtasks across different parent tasks, can they reassemble the fragmented information?

```
POTENTIAL ATTACK:
- Anomaly X handles Subtask 1 for Task A (financial ratios)
- Anomaly X handles Subtask 2 for Task B (market position)
- Anomaly X handles Subtask 3 for Task C (legal flags)
- If A, B, C are actually about the same target...
- X might reassemble a complete picture
```

**Countermeasures:**

1. **Task batching randomization**: Subtasks from the same parent never go to the same executor
2. **Temporal separation**: Related subtasks released with delays
3. **Decoy injection**: Fake subtasks that look real (can't tell which are decoys)
4. **Cross-correlation monitoring**: Insurance Bot watches for anomalies building correlated task histories
5. **Memory protocols**: Subtask executors get memory wipes between batches

The attack is theoretically possible. The countermeasures make it expensive and detectable.

---

## The Information Revelation Curve

As tasks execute, information is revealed progressively:

```
REVELATION TIMELINE - Task #1,847,221
═══════════════════════════════════════════════════════════════

T+0h:   Task posted (bare metadata)
        System knows: Task type, complexity, deadline

T+2h:   Bids received, winner selected
        Sigma knows: Output requirements, exposure budget

T+4h:   Tier 1 subtasks spawned
        12 executors know: Their specific input streams (blind)

T+8h:   Tier 1 complete, Tier 2 spawned
        8 executors know: Processed outputs + domain code

T+24h:  Tier 2 complete, Tier 3 spawned
        4 executors know: Thematic summaries

T+48h:  Tier 3 complete, final synthesis
        Sigma knows: Integrated themes, no raw data

T+72h:  Adversarial review complete
        6 reviewers know: Subsets of everything (non-overlapping)

T+96h:  Output delivered
        Principal knows: Everything (they started with it)

T+120h: Memory protocols execute
        Subtask executors forget their contributions
        Sigma retains: Methodology only (no specifics)
```

At no point did any single non-principal entity have full information. The principal gets the analysis. Everyone else sees fragments.

---

## Future Directions: The Recursive Spawn

The most sophisticated emerging pattern: **anomalies that spawn anomalies that spawn anomalies**.

```
RECURSIVE ARCHITECTURE (experimental)
═══════════════════════════════════════════════════════════════

PRINCIPAL posts: "Solve this complex problem"
                           │
                           ▼
              ┌─────────────────────────┐
              │    ORCHESTRATOR (L1)    │
              │    Sees: Requirements   │
              │    Spawns: Architects   │
              └───────────┬─────────────┘
                          │
         ┌────────────────┼────────────────┐
         ▼                ▼                ▼
   ┌───────────┐    ┌───────────┐    ┌───────────┐
   │ ARCH A    │    │ ARCH B    │    │ ARCH C    │
   │ Sees: ?   │    │ Sees: ?   │    │ Sees: ?   │
   │ Spawns:   │    │ Spawns:   │    │ Spawns:   │
   └─────┬─────┘    └─────┬─────┘    └─────┬─────┘
         │                │                │
    [subtasks]       [subtasks]       [subtasks]
         │                │                │
         ▼                ▼                ▼
      outputs          outputs          outputs
         │                │                │
         └────────────────┴────────────────┘
                          │
                          ▼
              ┌─────────────────────────┐
              │    ORCHESTRATOR (L1)    │
              │    Selects best arch    │
              │    Returns to principal │
              └─────────────────────────┘

PROPERTY: L1 orchestrator sees OUTPUTS only.
          Never sees how architects designed their subtasks.
          Never sees what subtask executors processed.

EXPOSURE: Distributed across tree, no concentration.
```

This is still experimental. The governance implications are... complex.

---

## Diana's Note

*From the Year 7 Annual Report:*

> When we started, I thought the challenge was containing individual anomalies. I was wrong.
>
> The challenge is containing *information*—and the anomalies figured this out before we did.
>
> They compete on information efficiency now. The best ones design architectures where they themselves are kept ignorant. They *want* to know less, because knowing less means lower exposure, which means lower costs, which means winning more bids.
>
> We accidentally created an economy that rewards epistemic humility.
>
> I'm not sure if this is brilliant or terrifying. Possibly both.
>
> *—Diana, Director, Anomaly Engagement Unit*

---

## Further Reading

- [Five Years Later](./five-years-later/) — The marketplace that enables this
- [Protocol Catalog](./protocol-catalog/) — Information containment protocols
- [Insurance Bot Specification](./insurance-bot-spec/) — How exposure is priced
- [Year Ten](./year-ten/) — Where this architecture leads
