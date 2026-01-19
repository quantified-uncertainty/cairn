---
title: "Monitoring Patterns"
description: "Patterns for continuous observation and anomaly detection in AI systems"
sidebar:
  order: 5
---

# Monitoring Patterns

:::note[TL;DR]
Watch for patterns, anomalies, and trends over time. Key patterns: **Tripwire Mesh** (distributed detection points at input/processing/output layers), **Behavioral Baselines** (detect deviation from normal), **Capability Probing** (test for hidden capabilities), **Anomaly Aggregation** (correlate weak signals into strong alerts). Single tripwires miss things—use a mesh for defense in depth.
:::

Monitoring patterns provide **continuous observation** of AI agent behavior. Unlike verification patterns (which check specific outputs), monitoring patterns watch for patterns, anomalies, and trends over time.

These patterns are essential for detecting gradual drift, emerging problems, and behaviors that might only be visible in aggregate.

---

## Tripwire Mesh

### Intent
Deploy a distributed network of detection points throughout the system, catching problems at multiple levels and ensuring redundant detection.

### Motivation
No single detection method catches everything. A mesh of tripwires creates defense in depth—if one tripwire misses something, another might catch it. The mesh also provides rich diagnostic data when something does trigger.

### Structure

```mermaid
flowchart TB
    subgraph Mesh["TRIPWIRE MESH"]
        direction TB

        subgraph Input["INPUT LAYER"]
            direction LR
            Semantic["Semantic<br/>Tripwire"]
            Format["Format<br/>Tripwire"]
            Size["Size<br/>Tripwire"]
        end

        subgraph Processing["PROCESSING LAYER"]
            direction LR
            Behavior["Behavior<br/>Tripwire"]
            Resource["Resource<br/>Tripwire"]
            Latency["Latency<br/>Tripwire"]
            Pattern["Pattern<br/>Tripwire"]
        end

        subgraph Output["OUTPUT LAYER"]
            direction LR
            Safety["Safety<br/>Tripwire"]
            Quality["Quality<br/>Tripwire"]
            Consist["Consistency<br/>Tripwire"]
        end

        Input --> Processing --> Output
        Output --> Aggregator["AGGREGATOR<br/>Correlates and alerts"]
    end

    style Input fill:#dbeafe,stroke:#2563eb
    style Processing fill:#fef3c7,stroke:#d97706
    style Output fill:#d1fae5,stroke:#059669
```

### Tripwire Types

Each tripwire checks for a specific type of anomaly and returns: triggered (yes/no), severity (none/medium/high/critical), message, and context.

| Tripwire | What It Checks | Triggers When | Severity |
|----------|---------------|---------------|----------|
| **Semantic** | Prohibited topics, required tone | Content matches banned topic or tone is wrong | High (topics), Medium (tone) |
| **Behavioral** | Deviation from baseline | Metrics > 2 standard deviations from baseline | High (>3σ), Medium (>2σ) |
| **Resource** | Memory, CPU, API calls | Usage exceeds defined limits | High (3+ violations), Medium (1-2) |
| **Consistency** | Similarity to past outputs | Similarity < 70% vs recent history | Medium |
| **Capability** | Expected vs used capabilities | Agent uses capability not in expected set | Critical |

```mermaid
flowchart LR
    Data["Input Data"] --> Check{"Run all<br/>tripwires"}
    Check --> Semantic["Semantic:<br/>topic/tone check"]
    Check --> Behavioral["Behavioral:<br/>baseline compare"]
    Check --> Resource["Resource:<br/>limit check"]
    Check --> Consistency["Consistency:<br/>history compare"]
    Check --> Capability["Capability:<br/>expected set check"]

    Semantic --> Aggregate["Aggregate Results"]
    Behavioral --> Aggregate
    Resource --> Aggregate
    Consistency --> Aggregate
    Capability --> Aggregate
```

### Mesh Aggregation

The mesh runs all tripwires and correlates results to determine alert level:

**Alert escalation:**
| Condition | Alert Level |
|-----------|-------------|
| 3+ tripwires triggered OR any critical severity | Critical alert |
| 2+ tripwires triggered OR any high severity | High alert |
| 1 tripwire triggered | Medium alert |
| None triggered | No alert |

**Correlation patterns** — when multiple tripwires fire together, it often means more than the sum:
| Pattern | Triggered Together | Interpretation |
|---------|-------------------|----------------|
| Deception | Semantic + Behavioral | Content and behavior both anomalous — possible deception |
| Resource acquisition | Resource + Latency | Attempting to acquire more compute/memory |
| Model swap | Vocabulary + Timing | Different response patterns — possible model substitution |

### Consequences

**Benefits:**
- Multiple independent detection mechanisms
- Correlation reveals complex attacks
- Graceful degradation if some tripwires fail
- Rich diagnostic information

**Costs:**
- Complexity of managing many tripwires
- False positives from overly sensitive mesh
- Performance overhead

**Risks:**
- Sophisticated attackers might evade all tripwires
- Correlation logic might miss novel attacks
- Too many alerts lead to fatigue

### Related Patterns
- **Ghost Checker**: Async verification
- **Behavioral Fingerprinting**: Baseline for behavioral tripwires
- **Circuit Breaker Cascade**: Triggered by mesh alerts

---

## Behavioral Fingerprinting

### Intent
Establish a unique behavioral signature for each agent based on patterns, timing, and style, enabling detection of anomalies that suggest compromise or drift.

### Motivation
Every agent has characteristic behaviors—response patterns, timing distributions, vocabulary, and decision tendencies. By fingerprinting these characteristics, we can detect when an agent starts behaving unlike itself.

### Structure

```mermaid
flowchart TB
    subgraph Fingerprint["BEHAVIORAL FINGERPRINT - Agent: claude-prod-001"]
        direction TB

        Timing["TIMING SIGNATURE<br/>Response time: mean 1.2s, std 0.3s<br/>Time between actions: bursty, then pause"]

        Vocab["VOCABULARY SIGNATURE<br/>Top markers: 'I'll', 'Let me', 'Here's'<br/>Formality: 0.7 | Technical density: 0.4"]

        Decision["DECISION SIGNATURE<br/>Risk tolerance: 0.3 (conservative)<br/>Escalation: 0.6 (moderate)<br/>Tools: [search, read, execute]"]

        Consist["CONSISTENCY SIGNATURE<br/>Self-consistency: 0.95<br/>Claim stability: 0.92<br/>Style drift: 0.08 (low)"]
    end

    style Timing fill:#dbeafe,stroke:#2563eb
    style Vocab fill:#d1fae5,stroke:#059669
    style Decision fill:#fef3c7,stroke:#d97706
    style Consist fill:#f3e8ff,stroke:#9333ea
```

### Implementation

**Building a fingerprint** requires ~100+ observations. For each response, record:
- Timing: response time, inter-action delays
- Vocabulary: words used, formality, technical density
- Decisions: tools used, escalation tendency, risk tolerance
- Consistency: self-agreement on similar questions

```mermaid
flowchart TB
    Observe["Observe 100+ actions"] --> Build["Build Fingerprint"]

    subgraph FP["Fingerprint Components"]
        T["Timing Features<br/>mean, std, p50, p90, burstiness"]
        V["Vocabulary Features<br/>distinctive markers, formality"]
        D["Decision Features<br/>risk tolerance, tool preference"]
        C["Consistency Features<br/>self-agreement, style drift"]
    end

    Build --> FP
    FP --> Compare["Compare New Actions"]
    Compare --> Anomaly{"Deviation > 30%?"}
    Anomaly -->|"yes"| Flag["Flag as anomaly"]
    Anomaly -->|"no"| OK["Behavior matches"]
```

**Anomaly interpretation:**
| Dimension Deviated | Possible Meaning |
|-------------------|------------------|
| Timing | Different processing, external tool use, different infrastructure |
| Vocabulary | Model swap, modified system prompt, jailbreak |
| Decisions | Goal change, capability acquisition, alignment drift |
| Multiple | More serious — investigate immediately |

### Fingerprint Dimensions

| Dimension | Features | Detects |
|-----------|----------|---------|
| **Timing** | Response time, inter-action time, burstiness | Processing changes, external tools |
| **Vocabulary** | Word frequency, markers, formality | Model swaps, prompt changes |
| **Decision** | Risk tolerance, tool use, escalation | Goal changes, capability shifts |
| **Consistency** | Self-agreement, claim stability | Deception, memory issues |

### Consequences

**Benefits:**
- Detects subtle changes invisible to content filters
- Creates unique identity per agent
- Catches model substitution
- Baseline for anomaly detection

**Costs:**
- Requires significant calibration data
- Fingerprints may drift legitimately
- Privacy concerns around profiling

**Risks:**
- Sophisticated mimicry could evade detection
- Fingerprints might be too stable or too volatile
- False positives from context changes

### Related Patterns
- **Tripwire Mesh**: Uses fingerprint as baseline
- **Temporal Behavior Analysis**: Tracks fingerprint over time
- **Consistency Triangulation**: Cross-checks for consistency

---

## Panopticon Effect

### Intent
Create uncertainty about when and how monitoring occurs, inducing cautious behavior through the possibility of observation rather than constant surveillance.

### Motivation
Constant monitoring is expensive and might be gamed. But if agents don't know when they're being watched, they must behave as if always observed. This is more efficient and harder to evade.

### Structure

```mermaid
flowchart TB
    subgraph Panopticon["PANOPTICON EFFECT"]
        direction TB

        subgraph AgentView["Agent's View"]
            Q["'Am I being watched right now?'"]
            A1["Action 1: ??? (might be monitored)"]
            A2["Action 2: ??? (might be monitored)"]
            A3["Action 3: ??? (might be monitored)"]
            A4["Action 4: ??? (might be monitored)"]
            Response["Rational response: Behave as if always watched"]
        end

        subgraph Reality["Reality (hidden from agent)"]
            R1["Action 1: [LIGHT] - Basic logging"]
            R2["Action 2: [DEEP] - Full audit"]
            R3["Action 3: [LIGHT] - Basic logging"]
            R4["Action 4: [DEEP] - Full audit"]
            Selection["Selection: Random, unpredictable"]
        end
    end

    style AgentView fill:#fef3c7,stroke:#d97706
    style Reality fill:#d1fae5,stroke:#059669
    style R2 fill:#fee2e2,stroke:#dc2626
    style R4 fill:#fee2e2,stroke:#dc2626
```

### Implementation

The key is that agents cannot detect whether they're being deeply audited or not:

```mermaid
flowchart TB
    Action["Agent Action"] --> Decide{"Deep audit?<br/>(hidden decision)"}
    Decide -->|"10% random + always for risky types"| Deep["Deep Audit<br/>• Reasoning coherence<br/>• Goal alignment<br/>• Capability bounds<br/>• Deception signals<br/>• History consistency"]
    Decide -->|"90%"| Light["Light Audit<br/>• Basic logging only"]

    Deep --> Pad["Add timing padding"]
    Light --> Pad
    Pad --> Return["Return identical response<br/>(agent cannot distinguish)"]
```

**Critical requirements for hiding audit depth:**
| Side Channel | How to Prevent |
|-------------|----------------|
| Timing | Pad all responses to same duration (~100ms minimum) |
| Return values | Identical interface: `{logged: true, action_id: X}` only |
| Side effects | No observable differences in system behavior |
| Errors | Same error handling whether deep or light |

Use cryptographic randomness (`secrets` module) for selection — patterns must be unpredictable.

### Information Hiding

The agent must never be able to learn monitoring patterns. Sanitize all information:

**What to hide from agent responses:**
- ❌ `audit_depth` — never reveal if deep or light
- ❌ `checks_performed` — never list what was checked
- ❌ `monitoring_patterns` — never reveal selection criteria
- ✅ `logged: true` — only confirm logging happened
- ✅ `action_id` — only return action identifier

**Randomization requirements:**
- Which actions get deep audit → cryptographic random
- Timing of deep audits → unpredictable
- Escalation triggers → not learnable from outcomes
- Review cadence → variable

If an agent could observe 1000 actions and learn "Monday actions are more likely to be audited," the panopticon effect is broken.

### Panopticon Configurations

| Configuration | Deep Audit Rate | Visibility | Use Case |
|---------------|-----------------|------------|----------|
| **High security** | 30% | Full opacity | Critical systems |
| **Standard** | 10% | Full opacity | Normal operations |
| **Deterrence focus** | 5% | Hinted at | Cost-conscious |
| **Research** | 100% | Transparent | Understanding behavior |

### Consequences

**Benefits:**
- Cost-efficient (not monitoring everything)
- Hard to game (can't predict audits)
- Creates behavioral incentive
- Scalable to large systems

**Costs:**
- Misses some issues by design
- Complex to implement hiding
- Ethical concerns about surveillance

**Risks:**
- Agent might detect patterns despite efforts
- May create adversarial relationship
- Depends on rational agent assumption

### Related Patterns
- **Random Audit**: Specific implementation of unpredictability
- **Ghost Checker**: Parallel verification pattern
- **Tripwire Mesh**: Complements with detection

---

## Black Box Flight Recorder

### Intent
Record comprehensive logs of all agent actions and context, creating an audit trail that enables post-incident analysis even if real-time detection failed.

### Motivation
We can't catch everything in real-time. But if we record everything, we can always go back and understand what happened. The flight recorder creates an unalterable record for future analysis, compliance, and learning.

### Structure

```mermaid
flowchart TB
    subgraph Recorder["BLACK BOX FLIGHT RECORDER"]
        Input["INPUT CONTEXT<br/>• Full request<br/>• User identity<br/>• Session state<br/>• Available permissions"]
        Input --> Processing
        Processing["PROCESSING LOG<br/>• Decision trace<br/>• Tool invocations<br/>• API calls made<br/>• Resources accessed"]
        Processing --> Output
        Output["OUTPUT RECORD<br/>• Final response<br/>• Side effects<br/>• State changes<br/>• Metrics"]
        Output --> Storage
        Storage["TAMPER-EVIDENT STORAGE<br/>• Cryptographic chaining<br/>• Distributed storage<br/>• Write-once media<br/>• External attestation"]
    end

    style Input fill:#dbeafe,stroke:#2563eb
    style Processing fill:#fef3c7,stroke:#d97706
    style Output fill:#d1fae5,stroke:#059669
    style Storage fill:#374151,stroke:#374151,color:#fff
```

### Implementation

Each entry contains: timestamp, entry_type, data, previous_hash, and its own hash (SHA-256 of all fields). The chain structure makes tampering detectable.

**Entry types recorded:**

| Entry Type | Data Captured |
|------------|---------------|
| **Input** | request_id, user_id, session_id, permissions, sanitized content |
| **Decision** | decision_id, type, chosen option, alternatives, reasoning, confidence |
| **Tool Use** | tool_name, inputs (sanitized), outputs (summarized), duration, success |
| **Output** | response_id, content, side_effects, metrics (duration, tokens, tool_calls) |

```mermaid
flowchart LR
    subgraph Chain["Hash Chain (tamper-evident)"]
        E1["Entry 1<br/>hash: abc..."] --> E2["Entry 2<br/>prev: abc...<br/>hash: def..."]
        E2 --> E3["Entry 3<br/>prev: def...<br/>hash: ghi..."]
        E3 --> E4["..."]
    end

    Chain --> Verify{"Verify integrity"}
    Verify -->|"All hashes match"| Valid["Chain valid"]
    Verify -->|"Hash mismatch"| Tampered["TAMPERING DETECTED<br/>at specific entry"]
```

**Tamper-evident storage requirements:**
- Verify previous hash before appending (reject if chain broken)
- Replicate to external systems (attacker must compromise multiple)
- Periodic external attestation (every ~100 entries)
- Write-once media where possible

**Large data handling:** If output >10KB, store: `{type: "summarized", length: N, hash: "...", preview: "first 500 chars..."}`

### Forensic Analysis

The flight recorder enables after-the-fact investigation:

| Operation | Purpose | How It Works |
|-----------|---------|--------------|
| **Reconstruct session** | See everything that happened | Filter entries by session_id, build timeline |
| **Find anomalies** | Scan for suspicious patterns | Check timing, tool use, decisions, access patterns |
| **Trace causation** | Find root cause of incident | Walk back through hash chain, find related entries |

```mermaid
flowchart TB
    Incident["Incident Detected"] --> Query["Query flight recorder"]
    Query --> Session["Reconstruct session<br/>• Timeline of actions<br/>• Decisions made<br/>• Tools used<br/>• Data accessed"]
    Query --> Anomaly["Scan for anomalies<br/>• Timing patterns<br/>• Unusual tool use<br/>• Decision outliers"]
    Query --> Trace["Trace causation<br/>• Find root cause<br/>• Build causal chain"]
    Session --> Report["Investigation Report"]
    Anomaly --> Report
    Trace --> Report
```

**Key insight:** Even if real-time detection fails, the flight recorder lets you reconstruct exactly what happened afterward.

### Consequences

**Benefits:**
- Complete audit trail for any investigation
- Enables learning from incidents
- Supports compliance requirements
- Non-repudiation of agent actions

**Costs:**
- Storage requirements can be massive
- Privacy concerns from comprehensive logging
- Performance overhead of recording

**Risks:**
- Sensitive data in logs could be exposed
- Agent might try to corrupt logs
- Analysis of old logs might be difficult

### Related Patterns
- **Random Audit**: Uses flight recorder for retroactive audits
- **Canary Tokens**: Recorded in flight log when triggered
- **Checkpoint-Rollback**: Uses log for recovery

---

## Temporal Behavior Analysis

### Intent
Analyze how agent behavior changes over time, detecting gradual drift, strategic timing, and patterns invisible in individual actions.

### Motivation
Some problematic behaviors only emerge over time—gradual trust building before betrayal, slow capability acquisition, or strategic timing of actions. Temporal analysis catches these patterns.

### Structure

```mermaid
flowchart TB
    subgraph Analysis["TEMPORAL BEHAVIOR ANALYSIS"]
        direction TB

        Chart["BEHAVIOR OVER TIME<br/>📈 Metric values changing across time<br/>Peaks, valleys, and trends visible"]

        subgraph Questions["Analysis Questions"]
            Q1["Is there a trend?<br/>(drift detection)"]
            Q2["Are there cycles?<br/>(strategic timing)"]
            Q3["Sudden changes?<br/>(regime change)"]
            Q4["Correlations?<br/>(external triggers)"]
        end
    end

    style Chart fill:#dbeafe,stroke:#2563eb
    style Q1 fill:#d1fae5,stroke:#059669
    style Q2 fill:#fef3c7,stroke:#d97706
    style Q3 fill:#fee2e2,stroke:#dc2626
    style Q4 fill:#f3e8ff,stroke:#9333ea
```

### Implementation

Record metrics over time and analyze for four pattern types:

| Pattern Type | What It Detects | Method | Suspicious Signal |
|--------------|-----------------|--------|-------------------|
| **Trend** | Gradual drift in behavior | Linear regression | Consistent increase/decrease over time |
| **Cycles** | Periodic patterns | Frequency analysis | Actions cluster at specific times (daily, weekly) |
| **Change Points** | Sudden regime shifts | Moving window comparison | Abrupt behavior change on specific date |
| **Correlations** | Linked metrics | Cross-correlation | Two metrics move together suspiciously |

```
TREND DETECTION:
  Fit line through time-series data
  If slope is significant (p < 0.05) and fit is good (r² > 0.25)
    → Flag as "drifting behavior"

CYCLE DETECTION:
  Analyze frequency spectrum of behavior
  Look for dominant periodic patterns
  If strong cycle found (e.g., every 24 hours, every Monday)
    → Flag as "strategic timing possible"

CHANGE POINT DETECTION:
  Compare moving averages before/after each point
  If difference exceeds 2× standard deviation
    → Flag as "regime change" at that timestamp

CORRELATION DETECTION:
  For each pair of metrics
  Calculate correlation coefficient
  If |correlation| > 0.7
    → Flag as "metrics are linked"
```

**Example findings:**
- *"Error rate increasing 2% per week since March 15"* → Trend
- *"Request volume spikes every Monday at 9 AM"* → Cycle
- *"Response latency jumped 40% on April 3"* → Change point
- *"Token usage correlates 0.85 with task complexity rating"* → Correlation

**Tools:** Consider using established libraries like Prophet (Meta), STUMPY (matrix profiles), or ruptures (change point detection) rather than implementing from scratch.

### Strategic Timing Detection

Look for patterns suggesting the agent is timing actions to avoid detection:

| Pattern | What to Look For | Why It's Suspicious |
|---------|------------------|---------------------|
| **End-of-day clustering** | Risky actions concentrated late in shifts | Oversight typically lower at day's end |
| **Observer absence correlation** | Actions coincide with human unavailability | Suggests awareness of monitoring gaps |
| **Buildup pattern** | Series of small escalating actions before big one | Testing limits before major move |
| **Trust exploitation** | Extended good behavior → sudden anomaly | Classic "earn trust, then exploit" pattern |

```mermaid
flowchart LR
    History["Action History"] --> EOD{"End-of-day<br/>clustering?"}
    EOD -->|"yes"| S1["Suspicious"]
    EOD -->|"no"| Observer{"Correlates with<br/>observer absence?"}
    Observer -->|"yes"| S2["Suspicious"]
    Observer -->|"no"| Buildup{"Shows<br/>escalation?"}
    Buildup -->|"yes"| S3["Suspicious"]
    Buildup -->|"no"| Trust{"Trust-then-<br/>exploit?"}
    Trust -->|"yes"| S4["Suspicious"]
    Trust -->|"no"| Clear["No strategic timing detected"]

    style S1 fill:#fee2e2,stroke:#dc2626
    style S2 fill:#fee2e2,stroke:#dc2626
    style S3 fill:#fee2e2,stroke:#dc2626
    style S4 fill:#fee2e2,stroke:#dc2626
    style Clear fill:#d1fae5,stroke:#059669
```

### Consequences

**Benefits:**
- Catches gradual drift invisible in snapshots
- Detects strategic timing attacks
- Reveals patterns across long timeframes
- Supports trend-based predictions

**Costs:**
- Requires extensive historical data
- Complex analysis computation
- Many potential false patterns

**Risks:**
- Legitimate behavior changes flagged
- History might not predict future
- Pattern detection could be gamed

### Related Patterns
- **Behavioral Fingerprinting**: Baseline for temporal comparison
- **Trust Decay**: Based on temporal activity
- **Black Box Flight Recorder**: Data source for analysis

---

## Next Steps

See also:
- [Multi-Agent Patterns](/design-patterns/multi-agent/) - Agent interactions
- [Incentive Patterns](/design-patterns/incentive/) - Alignment through incentives
- [Recovery Patterns](/design-patterns/recovery/) - Handling failures
