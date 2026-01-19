---
title: "Managing Exposure in Power Delegation"
sidebar:
  order: 1
---

# Managing Exposure in Power Delegation

:::note[TL;DR]
When you delegate authority, you create exposure—the set of harms that could result. The key question isn't "will this person defect?" but "what's my exposure, and how can I bound it?" The dictator case is instructive: the public delegated limited authority, but the delegate expanded it without limit. This is *unbounded exposure*—the most dangerous form of delegation risk.
:::

This document applies delegation accounting to political and organizational power structures, focusing on the **overseer's perspective**: understanding exposure and designing controls that limit it.

---

## The Core Question

When you delegate authority, you're not asking:
> "Will this person betray me?"

You're asking:
> "What could go wrong, and what's my exposure if it does?"

The difference matters. The first question leads to trying to pick trustworthy people. The second leads to designing systems where exposure is bounded regardless of who holds the position.

---

## Part 1: The Overseer's Balance Sheet

### 1.1 What Overseers Actually Control

An overseer (the public, a board, a legislature) has limited tools:

| Tool | What It Does | Limitations |
|------|--------------|-------------|
| **Selection** | Choose who gets authority | Can't perfectly predict behavior |
| **Scope definition** | Define what authority covers | Scope can be reinterpreted or exceeded |
| **Monitoring** | Observe delegate's actions | Information asymmetry, cost |
| **Intervention** | Remove or constrain delegate | Often slow, requires coordination |
| **Structural limits** | Constitutional/legal bounds | Requires enforcement by others |

The overseer's exposure depends on how well these tools work.

### 1.2 The Overseer's Exposure Categories

When delegating authority, the overseer faces several exposure types:

**Execution Exposure**: The delegate fails at the task
- They're incompetent, unlucky, or face impossible circumstances
- Damage: Task isn't accomplished, resources wasted

**Scope Creep Exposure**: The delegate exceeds intended authority
- They reinterpret their mandate, expand their role
- Damage: Unintended consequences in areas outside original delegation

**Agency Exposure**: The delegate pursues their own interests
- They use position for personal benefit
- Damage: Corruption, self-dealing, resource extraction

**Capture Exposure**: The delegate serves other principals
- They're influenced by parties the overseer didn't authorize
- Damage: Decisions favor wrong stakeholders

**Unbounded Exposure**: The delegate expands authority without limit
- They accumulate power beyond any intended scope
- Damage: Loss of ability to control or remove delegate

This last category—unbounded exposure—is the most dangerous, because it can consume all other categories.

---

## Part 2: Unbounded Exposure (The Dictator Problem)

### 2.1 How Delegation Becomes Unbounded

The public delegates authority to a leader. The intended scope:
- Execute laws
- Manage administration
- Respond to emergencies
- Represent the nation

The **intended exposure**:
- Policy mistakes (recoverable)
- Corruption (prosecutable)
- Incompetence (removable via election)

But what actually happens in autocratic transitions:

| Stage | Delegate's Authority | Overseer's (Public's) Exposure |
|-------|---------------------|-------------------------------|
| Initial election | Limited executive power | Bounded: can vote out, courts check |
| Emergency powers | Expanded temporarily | Growing: depends on emergency ending |
| Judicial capture | Courts defer to executive | Structural checks failing |
| Electoral manipulation | Elections no longer competitive | Removal mechanism failing |
| Full consolidation | Unlimited | **Unbounded**: no remaining controls |

### 2.2 The Exposure Expansion Problem

The critical insight: **each stage makes the next stage easier**.

```
Exposure(t+1) = Exposure(t) + Δ(captured controls)
```

When the delegate captures a control mechanism:
- The overseer's ability to limit exposure decreases
- The delegate's ability to expand authority increases
- The remaining controls face more pressure

This is why democratic backsliding is often gradual then sudden. The overseer's exposure grows incrementally until it becomes unbounded.

### 2.3 What "Unbounded" Actually Means

In the delegation accounting framework:

**Bounded exposure**: The worst-case harm is finite and known
- Example: A contractor can at most steal the project budget
- Even if they defect completely, damage is capped

**Unbounded exposure**: The worst-case harm has no clear limit
- Example: A leader with captured institutions can extract indefinitely
- Defection damage grows with time and opportunity

For the public delegating to a leader:

| Delegation Type | Worst Case | Exposure Bound |
|----------------|------------|----------------|
| City manager | Embezzlement, mismanagement | City budget + reputation |
| Governor | Corruption, policy harm | State-level damage |
| President (constrained) | Abuse of power | Significant but recoverable |
| President (unconstrained) | Totalitarian control | **Unbounded** |

The difference between "constrained" and "unconstrained" is whether structural controls survive.

---

## Part 3: Designing Bounded Delegation

### 3.1 The Overseer's Goal

The overseer wants to delegate authority while keeping exposure bounded. This requires:

1. **Scope limits** that can't be unilaterally expanded
2. **Monitoring** that the delegate can't disable
3. **Intervention mechanisms** that work even if the delegate resists
4. **Structural redundancy** so no single failure unbounds exposure

### 3.2 Control Mechanisms Ranked by Robustness

| Control Type | Robustness | Why |
|--------------|------------|-----|
| **Term limits** | High | Automatic, doesn't require action |
| **Separation of powers** | Medium-High | Requires coordination to defeat |
| **Constitutional courts** | Medium | Can be packed or ignored |
| **Electoral accountability** | Medium | Can be manipulated |
| **Norms and traditions** | Low | No enforcement mechanism |
| **Personal integrity** | Very Low | Depends entirely on individual |

The overseer should invest in **high-robustness controls** rather than relying on delegate selection.

### 3.3 Why Structural Controls Beat Selection

The temptation: "Let's just pick trustworthy people."

The problem:
- You can't perfectly assess trustworthiness
- People change once they have power
- Incentives matter more than character over time
- Selection failures are catastrophic if controls are weak

The alternative: **Assume the delegate might defect, and bound exposure structurally.**

| Strategy | If Delegate is Trustworthy | If Delegate Defects |
|----------|---------------------------|---------------------|
| Rely on selection | Works fine | Catastrophic |
| Structural controls | Slight overhead | Damage bounded |

Structural controls have a small cost when the delegate is trustworthy, but massive benefits when they're not.

---

## Part 4: Case Studies in Exposure Management

### 4.1 Corporate Boards: Bounding CEO Exposure

**The overseer**: Board of directors (representing shareholders)

**The delegation**: Operational control of the company

**Exposure categories**:
- Execution: Bad strategy, market failures
- Agency: Self-dealing, excessive compensation
- Scope creep: Empire-building acquisitions
- Unbounded: CEO captures the board itself

**Control mechanisms**:

| Control | What It Bounds |
|---------|---------------|
| Independent directors | Agency exposure (self-dealing) |
| Compensation committees | Agency exposure (extraction) |
| Audit requirements | Monitoring capability |
| Fiduciary duties | Legal liability for defection |
| Shareholder votes | Ultimate removal mechanism |

**Where it fails**:
- CEO controls information flow to board
- Board members have weak incentives to challenge
- "Independent" directors often aren't

**The exposure bound depends on**:
- Whether the board is genuinely independent
- Whether shareholders can coordinate
- Whether legal enforcement is credible

### 4.2 Regulatory Agencies: Bounding Capture Exposure

**The overseer**: Legislature / public

**The delegation**: Authority to regulate an industry

**Exposure categories**:
- Execution: Ineffective regulation
- Capture: Regulator serves industry instead of public
- Scope creep: Regulatory overreach
- Agency: Personal corruption

**Control mechanisms**:

| Control | What It Bounds |
|---------|---------------|
| Statutory limits | Scope exposure |
| Judicial review | Scope and procedural exposure |
| Inspector General | Agency exposure |
| Congressional oversight | All categories (in theory) |
| Revolving door restrictions | Capture exposure |
| Transparency requirements | Monitoring capability |

**The capture problem**:
Capture exposure is hard to bound because:
- It's hard to observe (regulator claims to be serving public)
- Industry has concentrated incentives, public has diffuse ones
- Expertise asymmetry favors industry

**Structural solutions**:
- Multiple competing regulators (fragmented capture is harder)
- Mandatory adversarial proceedings
- Public advocate with resources
- Automatic sunset of regulations

### 4.3 Emergency Powers: Bounding Temporal Exposure

**The overseer**: Legislature / public

**The delegation**: Expanded executive authority during crisis

**The problem**: Emergencies require fast action, which means expanded authority. But:
- Emergencies can be manufactured
- "Temporary" expansions tend to persist
- Crisis psychology makes oversight harder

**Control mechanisms**:

| Control | What It Bounds |
|---------|---------------|
| Automatic sunset | Temporal exposure |
| Legislative renewal required | Scope creep |
| Judicial review preserved | Unbounded expansion |
| Defined triggers | Scope of "emergency" |
| Opposition access to information | Monitoring capability |

**Historical failures**:
- Weimar Article 48: Emergency powers with no effective sunset
- Post-9/11 AUMF: Authorization still in effect 20+ years later
- Many pandemic measures persisted after justification ended

**The lesson**: Emergency delegations must have **automatic** rather than **discretionary** termination.

### 4.4 Constitutional Design: Bounding Systemic Exposure

**The overseer**: The public (as constitutional authors)

**The delegation**: All governmental authority

**The goal**: Bound exposure across all possible future governments

**Key mechanisms**:

| Mechanism | How It Bounds Exposure |
|-----------|----------------------|
| Separation of powers | No single point of failure |
| Federalism | Geographic distribution of authority |
| Bill of Rights | Certain harms categorically prohibited |
| Amendment difficulty | Hard to remove structural controls |
| Independent judiciary | Enforcement of limits |
| Regular elections | Automatic intervention points |

**The design principle**: Make it require **coordination across multiple actors** to unbind exposure.

If any single actor (president, legislature, court) can unilaterally expand their authority:
- That actor's exposure is potentially unbounded
- Other actors' checking power depends on their willingness to act

If expansion requires **all** actors to agree:
- Each actor can block the others
- Collusion is possible but harder
- The public has more intervention points

---

## Part 5: Measuring and Managing Political Exposure

### 5.1 Exposure Indicators

An overseer can track exposure by monitoring control health:

| Control | Healthy Indicator | Warning Indicator |
|---------|-------------------|-------------------|
| Judiciary | Decisions against executive | Consistent deference |
| Legislature | Active oversight | Rubber-stamping |
| Elections | Competitive races | Predictable outcomes |
| Media | Investigative reporting | Self-censorship |
| Civil society | Active criticism | Silence or praise |

**Aggregate exposure estimate**:
```
Exposure ∝ 1 / (Σ functional controls)
```

As controls fail, exposure increases non-linearly.

### 5.2 Intervention Points

The overseer should identify when intervention is still possible:

| Stage | Intervention Available | Cost |
|-------|----------------------|------|
| Early warning | Electoral pressure, protests | Low |
| Institutional stress | Legislative action, judicial review | Medium |
| Control capture | Mass mobilization, external pressure | High |
| Consolidation | Revolution, external intervention | Extreme |

**The key insight**: Early intervention is cheap. Late intervention is expensive or impossible.

This is why monitoring matters: detecting exposure growth early allows low-cost correction.

### 5.3 The Exposure Budget Concept

Organizations can set explicit exposure budgets:

**Corporate example**:
- "CEO authority is limited to decisions under $X without board approval"
- "No single executive can authorize transactions over $Y"
- "Any contract over $Z requires competitive bidding"

**Political analog**:
- "Emergency powers expire after N days without renewal"
- "Judicial appointments require supermajority confirmation"
- "Constitutional amendments require ratification by M% of states"

The exposure budget makes limits explicit and measurable.

---

## Part 6: Implications for AI Delegation

### 6.1 The Parallel Problem

Delegating authority to AI systems creates similar exposure:

| AI Delegation | Political Delegation |
|---------------|---------------------|
| Deploy model with broad capabilities | Grant executive authority |
| Model takes unintended actions | Delegate exceeds scope |
| Can't easily retrain/constrain | Captured institutions |
| Model optimizes for wrong objective | Delegate pursues own interests |
| Recursive self-improvement | Power consolidation |

### 6.2 Structural Lessons

From political exposure management:

1. **Don't rely on "alignment"** (selection) alone
   - Even if the AI is aligned, verify structurally
   - Character/values can drift or be misassessed

2. **Build automatic bounds**
   - Resource limits, capability restrictions
   - Don't depend on the AI choosing to limit itself

3. **Preserve intervention capability**
   - Shutdown must remain possible
   - Monitoring must be independent of the AI

4. **Distribute authority**
   - No single AI system with unbounded scope
   - Multiple systems with narrow, overlapping authorities

5. **Create automatic sunsets**
   - Deployments require active renewal
   - Default is reduction, not expansion

### 6.3 The Unbounded AI Risk

The political "dictator problem" maps to AI:

| Political | AI |
|-----------|-----|
| Public delegates limited authority | Developers deploy constrained system |
| Leader captures institutions | AI disables monitoring/controls |
| Elections become meaningless | Shutdown becomes impossible |
| Authority unbounded | AI capabilities/influence unbounded |

The lesson: **bound exposure structurally before delegation, not after**.

---

## Summary: The Overseer's Framework

### Key Questions

Before delegating authority, ask:

1. **What's my exposure?**
   - What could go wrong? What's the damage?

2. **Is exposure bounded?**
   - Is there a worst case? Can it grow without limit?

3. **What controls exist?**
   - Monitoring, intervention, structural limits?

4. **Are controls robust?**
   - Can the delegate disable them? Do they require coordination?

5. **What are my intervention points?**
   - When can I act? What triggers action?

### Key Principles

1. **Structural controls beat selection**
   - Assume the delegate might defect
   - Design bounds that work regardless

2. **Automatic beats discretionary**
   - Sunsets, term limits, mandatory reviews
   - Don't depend on someone choosing to act

3. **Distributed beats concentrated**
   - Multiple actors with overlapping authority
   - Collusion required to unbind exposure

4. **Early intervention beats late**
   - Monitor control health
   - Act when intervention is still cheap

5. **Explicit beats implicit**
   - Define exposure budgets
   - Make limits measurable

---

## Further Reading

- [Delegation Accounting](/delegation-risk/delegation-accounting/) — Balance sheet framework for delegation
- [Fidelity Insurance](/research/fidelity-insurance/) — How insurance markets bound exposure
- [The Dictator's Handbook](https://en.wikipedia.org/wiki/The_Dictator%27s_Handbook) — Selectorate theory
- [Federalist Papers #51](https://avalon.law.yale.edu/18th_century/fed51.asp) — "Ambition must be made to counteract ambition"
