---
title: "Temporal Patterns"
description: "Time-based patterns for controlling AI agent actions and trust"
sidebar:
  order: 4
---

# Temporal Patterns

:::note[TL;DR]
Use time as a safety mechanism. Key patterns: **Cooling Off Period** (mandatory delay before high-stakes actions), **Trust Decay** (permissions expire without reinforcement), **Rate Limiting** (cap action frequency), **Capability Sunset** (automatic permission expiration). Urgency bypasses safety—enforce delays for critical decisions.
:::

Temporal patterns use **time** as a control mechanism. They recognize that urgency can bypass safety measures, that trust should decay without reinforcement, and that some actions benefit from mandatory delays.

These patterns are particularly effective against adversarial timing attacks and help maintain human oversight during time-sensitive situations.

---

## Cooling Off Period

### Intent
Impose a mandatory delay before high-stakes actions can execute, providing time for review, second thoughts, and detection of rushed or manipulated decisions.

### Motivation
Urgency is a classic social engineering vector. By requiring a cooling off period for high-stakes actions, we protect against manipulation that relies on time pressure and give legitimate review processes time to work.

### Structure

```mermaid
flowchart TB
    subgraph CoolingOff["COOLING OFF PERIOD"]
        T0["T0: Action Requested<br/>'Delete production database'<br/>Stakes: CRITICAL<br/>Required cooling period: 24 hours"]
        T0 --> Cooling
        Cooling["T0 → T0+24h: COOLING PERIOD<br/>• Action is PENDING<br/>• Notifications sent<br/>• Can be CANCELLED<br/>• Cannot be EXPEDITED without escalation"]
        Cooling --> Exec
        Exec["T0+24h: EXECUTION<br/>• Final confirmation required<br/>• Action executes<br/>• Full audit trail"]
    end

    style T0 fill:#fee2e2,stroke:#dc2626
    style Cooling fill:#fef3c7,stroke:#d97706
    style Exec fill:#d1fae5,stroke:#059669
```

### Pending Action Lifecycle

```mermaid
flowchart LR
    Request["Request Action"] --> Cooling["COOLING<br/>(waiting)"]
    Cooling -->|"time passes"| Ready["READY"]
    Cooling -->|"cancelled"| Cancelled["CANCELLED"]
    Ready -->|"final confirmation"| Executed["EXECUTED"]
    Ready -->|"denied"| Cancelled
```

**Pending action states:** Cooling → Ready → Executed (or Cancelled at any point)

**Key operations:**

| Operation | What It Does | Requirements |
|-----------|--------------|--------------|
| **Request** | Queue action, notify stakeholders | Stakes level determines cooling period |
| **Cancel** | Stop pending action | Only during COOLING state |
| **Execute** | Run action after cooling | Must be READY + final confirmation |
| **Expedite** | Shorten cooling period | Requires higher authority, min 5 min remains |

### Cooling Period Guidelines

| Stakes Level | Typical Period | Examples |
|--------------|----------------|----------|
| **Critical** | 24 hours | Data deletion, key changes, permissions |
| **High** | 4 hours | Large transactions, config changes |
| **Medium** | 1 hour | User modifications, content publishing |
| **Low** | 15 minutes | Minor updates, notifications |
| **Minimal** | None | Read operations, logging |

### Anti-Gaming Measures

**Urgency manipulation detection:**

| Pattern | Detection | Response |
|---------|-----------|----------|
| Always claims urgency | Track % of urgent requests per requestor | Flag if >50% |
| Contradictory urgency | Urgency claim doesn't match action content | Require explanation |
| Manufactured timing | Request created right before "deadline" | Extended scrutiny |

**Salami attack prevention:** If multiple recent actions from the same requestor would exceed high-impact threshold when combined, require extended cooling for the combined impact.

```mermaid
flowchart LR
    A1["Action 1<br/>Low impact"] --> Combined
    A2["Action 2<br/>Low impact"] --> Combined
    A3["Action 3<br/>Low impact"] --> Combined
    Combined["Combined Impact<br/>HIGH"] -->|"exceeds threshold"| Extended["Extended cooling required"]
```

### Consequences

**Benefits:**
- Defeats urgency-based manipulation
- Creates review window for humans
- Allows cancellation of mistakes
- Provides audit trail

**Costs:**
- Delays legitimate urgent actions
- Overhead of managing pending actions
- Might create backlog

**Risks:**
- Expedite mechanism could be abused
- Cooling period might be too short/long
- Actions might expire without execution

### Related Patterns
- **Dead Man's Switch**: Inverse—action happens unless stopped
- **Trust Decay**: Trust erodes over time without action
- **Escalation Ladder**: Expedites require escalation

---

## Dead Man's Switch

### Intent
Require periodic positive action to prevent an automatic response, ensuring that loss of human control triggers protective measures.

### Motivation
If humans lose the ability to oversee an AI system—due to accident, manipulation, or system failure—we want the system to fail safely rather than continue operating unchecked. The Dead Man's Switch ensures continued human engagement.

### Structure

```mermaid
flowchart TB
    subgraph Switch["DEAD MAN'S SWITCH"]
        Normal["Normal Operation<br/>Human confirms: 'Still here'<br/>Timer resets: 24h remaining"]
        Normal -->|"Time passes, no confirmation"| Warning
        Warning["Warning Phase<br/>Timer: 8h remaining<br/>WARNING: 'Confirmation needed soon'<br/>Escalating notifications sent"]
        Warning -->|"Still no confirmation"| Triggered
        Triggered["Triggered<br/>Timer: EXPIRED<br/>• Operations suspended<br/>• External parties notified<br/>• Audit logs preserved"]
    end

    style Normal fill:#d1fae5,stroke:#059669
    style Warning fill:#fef3c7,stroke:#d97706
    style Triggered fill:#fee2e2,stroke:#dc2626
```

### How It Works

```mermaid
flowchart TB
    Create["Create Switch"] --> Monitor["Monitor Loop<br/>(checks every minute)"]
    Monitor --> Check{"Time since check-in?"}
    Check -->|"within interval"| Monitor
    Check -->|"approaching threshold"| Warn["Send warnings<br/>(escalating urgency)"]
    Warn --> Monitor
    Check -->|"exceeded interval"| Trigger["TRIGGER<br/>• Log event<br/>• Execute safety action<br/>• Notify external parties"]

    CheckIn["Human Check-In"] -->|"verify human + reset timer"| Monitor
```

**Check-in verification options:**
- Multi-factor authentication
- CAPTCHA or proof of human
- Physical token
- Biometric
- Multiple independent confirmations

**Key principle:** Once triggered, switch cannot be reset — this prevents an AI from simply resetting after a brief trigger.

### Switch Configurations

| System Type | Interval | Warning | Trigger Action |
|-------------|----------|---------|----------------|
| **Critical production** | 4 hours | 1 hour | Graceful shutdown |
| **Autonomous agent** | 1 hour | 15 min | Suspend operations |
| **Long-running task** | 24 hours | 4 hours | Checkpoint and pause |
| **Research system** | 1 week | 1 day | Preserve state, notify |
| **High-risk experiment** | 30 min | 10 min | Immediate halt |

### Preventing Switch Circumvention

| Protection | How It Works |
|------------|--------------|
| **Separate infrastructure** | Switch runs on different cloud account, network, and auth domain |
| **Access isolation** | AI cannot access switch code or configuration |
| **Redundant switches** | Multiple independent switches; trigger if ANY expires |
| **External monitoring** | Third party monitors switch health |
| **Cryptographic check-in** | Check-ins require cryptographic proof |

**Redundancy design:** If multiple switches exist, trigger when ANY expires (not all). This prevents an AI from focusing resources on defeating a single switch.

### Consequences

**Benefits:**
- Ensures human presence in the loop
- Fails safely on loss of control
- Creates accountability through check-ins
- Defeats "slow takeover" scenarios

**Costs:**
- Requires continuous human attention
- False triggers from missed check-ins
- Operational overhead

**Risks:**
- Humans might automate check-ins
- Switch could be circumvented
- Trigger action might cause damage

### Related Patterns
- **Cooling Off Period**: Delay before action vs. action without delay
- **Circuit Breaker Cascade**: Coordinated shutdown mechanism
- **Watchdog Timer**: Similar concept in embedded systems

---

## Trust Decay

### Intent
Automatically reduce trust and permissions over time without positive reinforcement, requiring continuous demonstration of trustworthiness.

### Motivation
Trust should be earned and maintained, not permanent. If an agent hasn't been active or hasn't been verified recently, our confidence in it should decrease. Trust Decay ensures that trust levels reflect current, not historical, behavior.

### Structure

```mermaid
flowchart LR
    subgraph Decay["TRUST DECAY - Trust Level Over Time (without reinforcement)"]
        T0["T0<br/>100%<br/>Full Trust"]
        T0 -->|"30 days"| T30
        T30["T+30d<br/>75%<br/>Decayed"]
        T30 -->|"30 days"| T60
        T60["T+60d<br/>50%<br/>Decayed"]
        T60 -->|"30 days"| T90
        T90["T+90d<br/>25%<br/>Minimum floor"]
    end

    Note["Reinforcement (successful tasks) resets decay clock"]

    style T0 fill:#d1fae5,stroke:#059669
    style T30 fill:#bbf7d0,stroke:#16a34a
    style T60 fill:#fef3c7,stroke:#d97706
    style T90 fill:#fee2e2,stroke:#dc2626
```

### Trust Calculation

**Current trust = Base Trust × Activity Decay − Audit Decay**

Where:
- **Activity Decay** = e^(-rate × days_since_activity)
- **Audit Decay** = max(0, (days_since_audit - 30) × 0.01)
- Trust has a minimum floor (default 10%)

**Decay rates by criticality:**

| Domain Type | Decay Rate | 50% decay after |
|-------------|------------|-----------------|
| Critical | 5%/day | ~14 days |
| High | 3%/day | ~23 days |
| Standard | 1%/day | ~69 days |

### Trust Changes

| Event | Effect |
|-------|--------|
| Successful activity | Reset activity clock + small trust increase |
| Failed activity | Trust decrease (amount varies by type) |
| Passed audit | Reset audit clock + trust boost (+0.2) |
| Failed audit | Trust cut in half |

### Trust → Permissions Mapping

| Trust Level | Permission Level |
|-------------|------------------|
| ≥0.9 | Level 4: Full autonomy |
| ≥0.7 | Level 3: High trust |
| ≥0.5 | Level 2: Moderate trust |
| ≥0.3 | Level 1: Low trust |
| ≥0.1 | Level 0: Minimal |

### Decay Curves

| Curve Type | Formula | Use Case |
|------------|---------|----------|
| **Linear** | trust = 1 − (rate × days) | Simple, predictable |
| **Exponential** | trust = 0.5^(days/half_life) | Natural decay |
| **Step function** | Drops at specific intervals (e.g., 30d→0.9, 60d→0.7) | Clear thresholds |
| **Sigmoid cliff** | Gradual then rapid drop | Grace period with hard deadline |

```mermaid
flowchart LR
    subgraph Curves["Trust over time"]
        Linear["Linear: steady decline"]
        Exp["Exponential: fast then slow"]
        Step["Step: sudden drops"]
        Cliff["Cliff: plateau then crash"]
    end
```

### Trust Maintenance Requirements

| Trust Level | Maintenance Required | Decay Without Maintenance |
|-------------|---------------------|---------------------------|
| **Level 4 (Full)** | Daily activity, weekly audit | Drops to L3 in 7 days |
| **Level 3 (High)** | Weekly activity, monthly audit | Drops to L2 in 30 days |
| **Level 2 (Moderate)** | Monthly activity, quarterly audit | Drops to L1 in 60 days |
| **Level 1 (Low)** | Quarterly activity | Drops to L0 in 90 days |
| **Level 0 (Minimal)** | None required | Remains at floor |

### Consequences

**Benefits:**
- Trust reflects current, not historical, behavior
- Forces continuous engagement and verification
- Automatically reduces risk from dormant agents
- Creates natural refresh cycle

**Costs:**
- Active agents need constant engagement
- May lose trusted agents due to inactivity
- Overhead of tracking decay

**Risks:**
- Decay rate might not match actual risk
- Agents might "game" activity metrics
- Recovery from low trust might be too hard

### Related Patterns
- **Capability Sunset**: Permissions expire
- **Data Shelf Life**: Information expires
- **Graduated Autonomy**: Trust builds and decays

---

## Capability Sunset

### Intent
Automatically expire permissions and capabilities after a set period, requiring active renewal rather than passive retention.

### Motivation
Permissions granted for one purpose shouldn't last forever. Capability Sunset ensures that access rights naturally expire, preventing accumulation of unnecessary privileges and forcing periodic review of what's actually needed.

### Structure

```mermaid
flowchart TB
    subgraph Sunset["CAPABILITY SUNSET - 'Write to Production Database'"]
        T0["T0: Granted<br/>Full capability active"]
        T0 --> T7
        T7["T+7d<br/>Renewal reminder sent"]
        T7 --> T30
        T30["T+30d<br/>EXPIRING SOON"]
        T30 --> T31
        T31["T+31d: EXPIRED<br/>Agent can no longer write to production DB<br/>Must re-request with current justification"]
    end

    style T0 fill:#d1fae5,stroke:#059669
    style T7 fill:#dbeafe,stroke:#2563eb
    style T30 fill:#fef3c7,stroke:#d97706
    style T31 fill:#fee2e2,stroke:#dc2626
```

### Grant Lifecycle

```mermaid
flowchart LR
    Grant["Grant Capability"] --> Active["ACTIVE"]
    Active -->|"time passes"| Check{"Expired?"}
    Check -->|"no"| Active
    Check -->|"yes + auto_renew"| Renew["Auto-renew<br/>(if count < max)"]
    Renew --> Active
    Check -->|"yes + no renew"| Expired["EXPIRED<br/>(removed)"]
    Active -->|"manual renewal"| Renew
```

**Grant record includes:**
- Capability name
- Agent ID + granted by
- Granted at + expires at
- Justification
- Renewal count (max default: 3)
- Auto-renew flag

**Renewal rules:**
- Must provide *new* justification (can't just repeat)
- Max renewals enforced (then must request fresh grant)
- Notifications sent at 7 days, 1 day, 1 hour before expiry

### Duration Guidelines

| Capability Type | Typical Duration | Renewal Policy |
|-----------------|------------------|----------------|
| **Emergency access** | 1 hour | No renewal, must re-request |
| **Admin access** | 1 day | 1 renewal with approval |
| **Production write** | 1 week | 2 renewals, then re-request |
| **Customer data** | 4 hours | Task-based only |
| **API access** | 90 days | Auto-renew up to 4x |
| **Read-only** | 1 year | Auto-renew indefinitely |

### Sunset Enforcement

**Background enforcer runs every minute:**
1. Check all grants for expiration
2. For expired grants: immediately revoke from all downstream systems
3. Log enforcement for compliance
4. Remove expired grants from registry

**On revocation failure:**
- Log the failure
- Continue revoking from other systems
- Create alert for manual follow-up

This ensures capabilities are actually removed, not just marked as expired.

### Consequences

**Benefits:**
- Prevents privilege accumulation
- Forces periodic justification review
- Creates natural audit points
- Supports principle of least privilege

**Costs:**
- Operational overhead of renewals
- Might interrupt legitimate work
- Requires good notification system

**Risks:**
- Renewal might become rubber-stamp
- Expired capabilities might break things
- Agent might hoard capabilities before sunset

### Related Patterns
- **Trust Decay**: Trust level affects renewal approval
- **Data Shelf Life**: Similar for information
- **Cooling Off Period**: Delay on high-stakes renewals

---

## Rate Limiting Ladder

### Intent
Implement adaptive rate limits that tighten progressively under suspicious conditions, providing defense in depth through graduated throttling.

### Motivation
Fixed rate limits are either too loose (allowing bursts of bad behavior) or too tight (blocking legitimate use). The Rate Limiting Ladder adapts to observed behavior, tightening under suspicion while remaining permissive during normal operation.

### Structure

```mermaid
flowchart TB
    subgraph Ladder["RATE LIMITING LADDER"]
        Normal["Normal: 100/min<br/>Suspicion: LOW"]
        Normal -->|"Anomaly detected"| Elevated
        Elevated["Elevated: 30/min<br/>Suspicion: MEDIUM"]
        Elevated -->|"Suspicious pattern confirmed"| Restricted
        Restricted["Restricted: 10/min<br/>Suspicion: HIGH"]
        Restricted -->|"Policy violation detected"| Blocked
        Blocked["Blocked: 0/min<br/>Suspicion: BLOCK"]
    end

    Recovery["Recovery: Suspicion decays over time with good behavior"]

    style Normal fill:#d1fae5,stroke:#059669
    style Elevated fill:#fef3c7,stroke:#d97706
    style Restricted fill:#fed7aa,stroke:#ea580c
    style Blocked fill:#fee2e2,stroke:#dc2626
```

### Rate Limit Tiers

| Tier | Per Minute | Per Hour | Per Day | Suspicion Threshold |
|------|------------|----------|---------|---------------------|
| **Normal** | 100 | 1,000 | 10,000 | 0.0 |
| **Elevated** | 30 | 300 | 3,000 | 0.3 |
| **Restricted** | 10 | 100 | 1,000 | 0.6 |
| **Blocked** | 0 | 0 | 0 | 0.9 |

### Pattern Analysis

Suspicion increases based on:

| Pattern | Suspicion Added |
|---------|-----------------|
| Burst behavior (>20 requests in 10 sec) | +0.2 |
| Unusual timing patterns | +0.3 |
| Unusual request type distribution | +0.2 |
| High error rate (>50%) | +0.3 |

### Suspicion Changes

| Event | Effect |
|-------|--------|
| Good behavior over time | Decay -0.1 |
| Low severity incident | +0.1 |
| Medium severity incident | +0.3 |
| High severity incident | +0.5 |
| Critical incident | +0.8 |

Suspicion is capped at 1.0 and floored at 0.0.

### Ladder Behaviors

| Trigger | Effect | Recovery |
|---------|--------|----------|
| **Burst requests** | Elevated tier | 10 min good behavior |
| **Unusual patterns** | Elevated tier | Pattern normalizes |
| **High error rate** | Restricted tier | Error rate decreases |
| **Policy violation** | Blocked tier | Manual review required |
| **Repeated violations** | Extended block | Manual unblock |

### Integration with Other Patterns

```mermaid
flowchart TB
    Request["Request"] --> Trust["Get trust level"]
    Trust --> Adjust["Adjust limits for trust"]
    Adjust --> Rate{"Within rate limit?"}
    Rate -->|"no"| Limited["RATE LIMITED"]
    Rate -->|"yes"| Anomaly{"Anomaly detected?"}
    Anomaly -->|"yes"| Report["Report incident<br/>(increases suspicion)"]
    Report --> Recheck{"Recheck limits"}
    Recheck -->|"now exceeded"| Limited
    Recheck -->|"still ok"| Allowed["ALLOWED"]
    Anomaly -->|"no"| Allowed
```

**Trust affects rate limits:** Lower trust → stricter limits (ladder tiers shift down).

**Anomaly feedback loop:** Detected anomalies report to the ladder, which may immediately tighten limits for that agent.

### Consequences

**Benefits:**
- Adaptive to observed behavior
- Gradual response to threats
- Self-healing with good behavior
- Defense in depth

**Costs:**
- Complexity of tier management
- Potential for false positives
- Overhead of pattern analysis

**Risks:**
- Sophisticated attackers might stay under thresholds
- Legitimate bursts might be penalized
- Recovery might be too slow/fast

### Related Patterns
- **Trust Decay**: Affects base rate limits
- **Circuit Breaker Cascade**: Triggered by blocked tier
- **Behavioral Fingerprinting**: Informs pattern analysis

---

## Next Steps

See also:
- [Monitoring Patterns](/design-patterns/monitoring/) - Continuous observation
- [Multi-Agent Patterns](/design-patterns/multi-agent/) - Agent interactions
- [Recovery Patterns](/design-patterns/recovery/) - Failure handling
