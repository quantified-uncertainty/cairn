---
title: "Delegation Accounting: A Balance Sheet View"
sidebar:
  order: 4
---

# Delegation Accounting: A Balance Sheet View

:::note[TL;DR]
**Net Delegation Value = Receivable - Exposure - Costs**. What you expect to get, minus what could go wrong, minus what it costs.
:::

---

## The Setup

**Alice** has a gem worth $1,000. A buyer will pay on delivery. Alice can't deliver it herself, so she hires **Bob** for a **$50 fee**.

| Item | Type | Value |
|------|------|-------|
| Buyer's payment | Receivable | $1,000 |
| Bob's fee | Cost | $50 |

**Naive calculation**: $1,000 - $50 = $950.

But this ignores what could go wrong.

---

## Exposures

An **exposure** is a potential cost. Unlike Bob's $50 fee (certain), exposures are probability-weighted.

| Exposure | What happens | Probability | Damage | Expected Loss |
|----------|--------------|-------------|--------|---------------|
| **Loss** | Bob loses the gem | 2% | $1,000 | $20 |
| **Theft** | Bob steals the gem | 1% | $1,000 | $10 |
| **Total Expected Loss** | | | | **$30** |

---

## The Balance Sheet

| | Value |
|---|------|
| **Receivable** | $1,000 |
| **Cost** (Bob's fee) | -$50 |
| **Exposure** (expected) | -$30 |
| **Net Delegation Value** | **$920** |

This is Alice's expected profit after accounting for what could go wrong.

---

## Bob's Perspective

What does this look like from Bob's side? When Bob accepts the gem, he has two **options**. Each is its own balance sheet.

**Option A: Attempt Delivery**

| | Value |
|---|------|
| **Receivable** (fee if successful) | $50 |
| **Exposure** (2% loss, $1,000 penalty) | -$20 |
| **Net Value** | **$30** |

**Option B: Steal**

| | Value |
|---|------|
| **Receivable** (gem) | $1,000 |
| **Contingent Liability** (80% caught, $2,000 penalty) | -$1,600 |
| **Net Value** | **-$600** |

Bob chooses **Attempt Delivery** because $30 > -$600.

:::note[Exposure vs. Contingent Liability]
**Exposure** = accidental risk (Option A). Something might happen *to* Bob.
**Contingent Liability** = consequence of choice (Option B). Bob deliberately takes on this risk, and the penalty only materializes if he's caught.

Stealing has negative value because the contingent liability (-$1,600) outweighs the asset ($1,000).
:::

---

## Delegation Chains

Now Alice is running a large operation. She doesn't deal with couriers directly—she has **Xavier**, a manager.

Alice tasks Xavier with getting the gem delivered. Xavier then hires Bob.

### Three Balance Sheets

When the gem changes hands, **all three parties** take on exposure simultaneously.

**Alice's Balance Sheet**

| | Value |
|---|------|
| **Receivable** | $1,000 |
| **Cost** (Xavier's fee) | -$100 |
| **Exposure** (Xavier fails or steals) | -$33 |
| **Net Delegation Value** | **$867** |

Alice's exposure is now to *Xavier*, not Bob. She doesn't know or care who Xavier uses.

**Xavier's Balance Sheet**

| | Value |
|---|------|
| **Receivable** (fee from Alice) | $100 |
| **Cost** (Bob's fee) | -$50 |
| **Exposure** (Bob fails → Xavier owes Alice) | -$30 |
| **Net Value** | **$20** |

Xavier earns $50 margin but takes on $30 expected exposure. If Bob loses the gem, Xavier is responsible to Alice.

**Bob's Balance Sheet**

| | Value |
|---|------|
| **Receivable** (fee if successful) | $50 |
| **Exposure** (2% loss, $1,000 penalty) | -$20 |
| **Net Value** | **$30** |

Bob's balance sheet is unchanged—he doesn't know or care that Xavier has a boss.

### The Key Insight

When Xavier accepts the delegation, he **takes on personal exposure** for Bob's potential failures. The exposure doesn't disappear—it transfers from Alice to Xavier.

| Party | Exposed To | Expected Exposure |
|-------|-----------|-------------------|
| Alice | Xavier | $33 |
| Xavier | Bob | $30 |
| Bob | Accidents | $20 |

:::note[Exposure Flows Downward]
Each delegator is exposed to their immediate delegate, not the full chain. Alice trusts Xavier. Xavier trusts Bob. The chain of trust creates a chain of exposure.
:::

---

## The Complexity Tax

As delegation structures grow more complex, something happens to our ability to estimate exposure: **uncertainty compounds**.

### The Problem

In the simple Alice → Bob case, we estimated exposure at $30. But how confident are we in that number?

With a single delegation:
- We know the failure modes (loss, theft)
- We can estimate probabilities from Bob's track record
- The exposure is bounded by the asset value

Add Xavier as a middle layer, and complexity increases:
- Xavier might hire someone other than Bob
- Xavier's incentives may not perfectly align with Alice's
- Communication errors between layers
- Coordination failures we haven't anticipated

Add a third layer, shared infrastructure, multiple parallel delegates, and informal reporting relationships? Now we're guessing.

### Complexity Score

We can formalize this with a **complexity score** that captures structural uncertainty:

| Factor | Contribution |
|--------|--------------|
| Each delegation layer | +2 |
| Each parallel delegate at same level | +1 |
| Shared resources between delegates | +2 |
| Informal/undocumented relationships | +3 |
| Cross-layer dependencies | +2 |
| Ambiguous authority boundaries | +3 |

**Examples:**

| Structure | Complexity Score |
|-----------|-----------------|
| Alice → Bob | 2 |
| Alice → Xavier → Bob | 4 |
| Alice → Xavier → {Bob, Carol} (parallel) | 5 |
| Alice → Xavier → {Bob, Carol} with shared vehicle | 7 |
| 4-level org with shared infrastructure | 12 |
| Complex org with hidden entanglements | 20+ |

### Uncertainty Multiplier

Complexity doesn't change expected exposure—it changes our **confidence in that estimate**.

| Complexity Score | Uncertainty Multiplier | Confidence Interval |
|-----------------|----------------------|---------------------|
| 2 (simple) | ±20% | Narrow |
| 5 | ±65% | Moderate |
| 10 | ±180% | Wide |
| 15 | ±400% | Very wide |
| 20+ | ±640%+ | Essentially unknown |

**Applied to our $30 exposure estimate:**

| Structure | Complexity | Uncertainty | Confidence Interval |
|-----------|-----------|-------------|---------------------|
| Alice → Bob | 2 | ±20% | $24 - $36 |
| Alice → Xavier → Bob | 4 | ±50% | $15 - $45 |
| 4-level hierarchy | 12 | ±230% | $0 - $99 |
| Complex org, hidden entanglements | 20 | ±640% | $0 - $222 |

The point estimate is still $30. But our confidence in that estimate degrades rapidly with complexity.

### The Insurer's Dilemma

Carol (the insurer) doesn't just care about expected loss—she cares about **variance**. An exposure she can't bound is an exposure she can't price.

---

**Alice** comes to Carol with a new proposal. She's expanded her business: three layers of management, shared delivery vehicles, some contractors who also work for her competitors.

**Carol**: Let me see your org chart.

*Alice shows a diagram with crossing lines, dotted relationships, and a footnote that says "informal coordination as needed."*

**Carol**: What's your complexity score?

**Alice**: I don't know. Maybe 15?

**Carol**: Let me calculate... You've got three layers, that's 6. Four parallel couriers, that's 4. Shared vehicles, that's 2. These dotted lines—are those reporting relationships?

**Alice**: Sort of. They coordinate when needed.

**Carol**: That's undocumented informal relationships. Add 3. And this contractor who also works for your competitor?

**Alice**: He's very trustworthy.

**Carol**: That's a cross-layer dependency with unclear authority. Add 5. Your complexity score is 20.

---

**Carol**: Here's the problem. Your exposure estimate is $5,000/year. But your complexity score is 20, which means my confidence interval is ±640%.

Your actual exposure could be anywhere from \$0 to \$37,000. That's a lot of uncertainty.

**Alice**: So what's my premium?

**Carol**: I have to price for the upper end of that range. Your premium would be $45,000/year.

**Alice**: That's nine times my expected exposure!

**Carol**: That's the complexity tax. I'm not charging you for what I *think* will happen—I'm charging you for what *might* happen, given how little I can predict about your organization.

**Alice**: What if I simplified things?

**Carol**: Then your premium drops dramatically. Complexity doesn't just increase cost—it multiplies it.

---

### Reducing Complexity

**Alice**: What would it take to get insured?

**Carol**: Reduce your complexity score to under 10. Here's how:

| Change | Complexity Reduction |
|--------|---------------------|
| Document all reporting relationships | -3 |
| Eliminate shared vehicles (each courier has own) | -2 |
| Remove contractors with competitor ties | -5 |
| Flatten to 2 layers | -2 |
| Assign clear authority boundaries | -3 |

**Carol**: That would bring you from 20 to around 5. At complexity 5, your uncertainty is ±65%. On a \$5,000 expected exposure, that's a confidence interval of \$1,750 to \$8,250.

I can price that. Your premium would be around $8,000/year—covering the upper bound of my confidence interval plus margin.

**Alice**: So I pay for the uncertainty I create.

**Carol**: Exactly. Complexity isn't free. Every undocumented relationship, every ambiguous authority, every hidden entanglement—you're paying for it in inflated premiums. Simplify, and the premium drops.

---

### The Uninsurable Threshold

Most complex organizations are insurable—just expensive, with limits and exclusions. But some structures cross into genuinely uninsurable territory.

A month later, Carol gets a call from **Ouroboros Holdings**.

---

**Ouroboros Rep**: We need delegation insurance for our AI operations.

**Carol**: Tell me about the structure.

**Ouroboros Rep**: We're a holding company with 8 subsidiaries. Our CEO, Marcus, also personally owns 40% of our main competitor through a separate vehicle. Three board members sit on both boards. Our AI systems share training data with the competitor under a "mutual improvement" agreement—we're not entirely sure what data flows where.

**Carol**: I see. What else?

**Ouroboros Rep**: Our AI division recently demonstrated some capabilities we didn't know it had. The team that built it left six months ago, and the documentation is... incomplete. We've had three incidents where the AI took actions we can't fully explain, but outcomes were positive so we didn't investigate deeply.

**Carol**: And governance?

**Ouroboros Rep**: Marcus approves all major AI deployments personally. He also has final say on which projects get flagged as "failures" for insurance purposes. Oh, and our internal audit function reports to Marcus.

---

**Carol**: I'm going to stop you there. This isn't a complexity problem. This is a **moral hazard** problem.

| Issue | Why It's Uninsurable |
|-------|---------------------|
| CEO owns competitor | Incentive to harm insured company |
| Shared AI data with competitor | Can't distinguish self-harm from external attack |
| Unexplained AI capabilities | Can't bound what could go wrong |
| CEO controls failure classification | Can manipulate what counts as a claim |
| Audit reports to CEO | No independent verification |

**Ouroboros Rep**: We'd pay a higher premium.

**Carol**: It's not about price. With normal complexity, I'm uncertain about *probability*—I don't know how likely bad outcomes are, so I charge more. With your structure, I'm uncertain about *intent*. I can't tell whether a loss is an accident or a deliberate choice by people who benefit from the loss.

**Ouroboros Rep**: We wouldn't deliberately cause losses.

**Carol**: Maybe not. But your CEO *could* make decisions that hurt Ouroboros and help his other company, claim it as an AI failure, and collect insurance. I have no way to distinguish that from a genuine accident. That's not a risk I can price—it's a risk I can't take at all.

---

**Ouroboros Rep**: What would it take?

**Carol**: Structural changes, not just controls:

| Change | What It Fixes |
|--------|---------------|
| CEO divests competitor stake | Removes conflict of interest |
| Independent board members | Governance not captured |
| Audit reports to board, not CEO | Independent verification |
| Full AI capability documentation | Bounds on what's possible |
| Third-party AI monitoring | Can verify claims |

**Carol**: Even then, I'd need to see 12-18 months of clean operation before quoting. Trust takes time to rebuild when incentives were this misaligned.

---

**Alice** (overhearing): So it's not really about complexity?

**Carol**: Complexity makes things expensive. **Conflicts of interest** make things uninsurable. Alice, you're complex but your incentives are clear—you want the gem delivered. Ouroboros? I can't tell what they actually want. And I can't insure someone when I don't know if they're on my side.

---

### The Complexity Tax Principle

:::note[The Complexity Tax]
Structural complexity doesn't change expected exposure—it changes **uncertainty about exposure**. This uncertainty gets priced in: premiums scale with the upper bound of the confidence interval, not the expected value.

The result: high-complexity organizations pay multiples of their expected exposure. Simplification—fewer layers, clearer boundaries, documented relationships—reduces premiums faster than reducing actual risk.
:::

This has implications beyond insurance:
- Complex organizations can't accurately estimate their own risk
- Hidden dependencies become visible only during failures
- The cost of complexity is paid in unpriced, unmanaged exposure

**For AI systems**: Highly complex AI deployments—multi-agent systems with emergent coordination, unclear capability boundaries, and undocumented information flows—will face steep complexity taxes. Simpler, more legible architectures may be cheaper to insure than technically safer but opaque alternatives.

:::tip[Deeper Dive]
For methods to systematically quantify complexity scores and convert them to pricing, see [Complexity Pricing](/research/risk-methods/complexity-pricing/).
:::

---

## The Office Key: A Second Exposure

Alice decides to give Bob a key to her office so he can pick up gems for delivery when she's not there. This creates a **new, separate exposure**—distinct from the gem delivery itself.

### Two Exposures, Not One

| Exposure | Opens When | Closes When | What's At Risk |
|----------|------------|-------------|----------------|
| **Gem Delivery** | Bob receives gem | Delivery confirmed | $1,000 gem |
| **Office Access** | Bob receives key | Key returned/revoked | Everything in office |

The gem exposure is bounded by the gem's value. The office exposure is bounded by... what exactly?

**What's in the office:**
- The gem for today's delivery ($1,000)
- Client list with names, addresses, purchase history
- Supplier contracts with pricing
- Business records

### Capability-Dependent Exposure

The office exposure depends on Bob's capability to exploit it.

**Dumb Bob** sees: a gem.

| Option | Receivable | Contingent Liability | Net |
|--------|------------|---------------------|-----|
| Deliver faithfully | $50 | -$20 (exposure) | **$30** |
| Steal gem | $1,000 | 80% caught × -$2,000 | **-$600** |

**Smart Bob** sees: information worth more than the gem.

| Option | Receivable | Contingent Liability | Net |
|--------|------------|---------------------|-----|
| Deliver faithfully | $50 | -$20 | $30 |
| Steal gem | $1,000 | 80% caught × -$2,000 | -$600 |
| **Photograph client list → sell to competitor** | $15,000 | 20% caught × -$10,000 | **$13,000** |
| **Copy supplier contracts → sell** | $8,000 | 15% caught × -$8,000 | **$6,800** |

### Alice's Two Exposures

| Exposure | If Bob is Dumb | If Bob is Smart |
|----------|----------------|-----------------|
| Gem Delivery | $30 | $30 |
| Office Access | $10 | **$5,000+** |
| **Total** | $40 | **$5,030+** |

**Same key. Same office. 125× difference in total exposure.**

Alice can't price her office exposure without knowing Bob's capability. And she probably can't assess Bob's capability accurately.

### The Insurer's Perspective

Alice calls Carol (her insurer) to add coverage for the new office access arrangement.

---

**Alice**: I'm giving my courier a key to the office. I want to make sure I'm covered.

**Carol**: Full office access? That's going to increase your premium significantly. Right now you're paying $500/year for gem theft coverage. With office access, we're looking at $3,000/year—and that's with a $5,000 deductible on trade secret theft.

**Alice**: That seems high. What are my options?

**Carol**: The exposure comes from three sources: what Bob *can* access, what Bob *can do* with it, and whether we *can catch* him. We can work on all three.

---

**Reduce what Bob can access:**

| Control | Premium Impact | Why |
|---------|---------------|-----|
| Separate delivery room (no office access) | -70% | Eliminates information exposure entirely |
| Locked filing cabinets | -25% | Adds friction, reduces opportunistic theft |
| Computer auto-locks when you leave | -15% | Protects digital assets |
| Remove sensitive docs before Bob arrives | -20% | Nothing to steal |

**Carol**: The delivery room is the big one. If Bob never enters the main office, I can keep you at $600/year.

---

**Reduce what Bob can do with access:**

| Control | Premium Impact | Why |
|---------|---------------|-----|
| Hire from out of town | -10% | Doesn't know your competitors to sell to |
| No smartphones allowed in office | -15% | Can't photograph documents |
| Require no industry experience | -5% | Less likely to know what's valuable |
| Watermark all documents uniquely | -10% | Stolen docs are traceable |
| Time-limited key (works 9-10am only) | -15% | Reduces window for reconnaissance |

**Alice**: Wait—you're saying I should hire someone *less* qualified?

**Carol**: For this task, yes. A courier with an MBA and five years in the gem trade knows exactly which documents matter and who'd pay for them. A retiree looking for part-time work doesn't. Their capability *is* your exposure.

---

**Increase probability of catching theft:**

| Control | Premium Impact | Why |
|---------|---------------|-----|
| Camera in office | -20% | Deters and documents |
| Inventory check after each visit | -15% | Catches theft quickly |
| Randomized audits of documents | -10% | Detects information theft |
| Unique serial numbers on sensitive files | -10% | Know exactly what's missing |
| Decoy documents that alert when copied | -5% | Early warning system |

---

**Align Bob's incentives:**

| Control | Premium Impact | Why |
|---------|---------------|-----|
| Require Bob to post $2,000 bond | -25% | Bob has skin in the game |
| Hire a relative | -15% | Social/family penalty for theft |
| Deferred compensation (paid quarterly) | -10% | Loses unvested pay if caught |
| Hire from small community | -10% | Reputation matters more |
| Background check for competitor ties | -10% | Screens out obvious risks |

**Carol**: The bond is powerful. If Bob has $2,000 on the line, stealing a $1,000 gem doesn't even make sense. And for information theft—he'd have to be confident he's getting more than $2,000 to risk it.

---

**Alice**: What if I do all of this?

**Carol**: Let's see. Delivery room only, plus bond, plus camera, plus time-limited key, plus no smartphones...

| Baseline (full office access) | $3,000/year |
|------------------------------|-------------|
| Delivery room only | -70% → $900 |
| Require bond | -25% → $675 |
| Camera | -20% → $540 |
| Time-limited key | -15% → $460 |
| No smartphones | -15% → $390 |

**Carol**: I can get you down to about $400/year. That's close to your original $500 for gem-only coverage, and you've still got someone with office access.

**Alice**: What's the absolute minimum?

**Carol**: If you *escort Bob personally* every time, never leave him alone, and he only touches the gem—I'll keep you at $500. But at that point, why give him a key?

---

**Alice**: This is a lot to think about.

**Carol**: The core insight is this: your exposure isn't fixed. It's a function of access, capability, and consequences. You can engineer all three.

| Lever | What You're Doing |
|-------|-------------------|
| **Access** | Limit what Bob can reach |
| **Capability** | Limit what Bob can exploit |
| **Consequences** | Raise the cost of getting caught |

Most people only think about the first one. The other two are often cheaper.

---

### The Capable Agent Who Wants the Job

A week later, **Xavier** applies for the courier position. Xavier is clearly smart—MBA, ten years in the gem trade, knows everyone in the industry. Carol would charge Alice $5,000/year to insure Xavier with office access.

But Xavier *really* wants this job. So Xavier comes prepared.

---

**Xavier**: I know my background makes me expensive to insure. I've put together a proposal to address that.

**Alice**: I'm listening.

**Xavier**: Here's what I'll commit to:

---

**Transparency measures:**

| Commitment | Effect |
|------------|--------|
| Body camera filming entire visit | Full record of what I accessed |
| Footage uploaded to third-party escrow in real-time | Can't delete evidence |
| GPS tracking while on premises | Location verified |
| Entry/exit log signed by witness | Timestamps confirmed |

**Xavier**: If I steal something, you'll have video evidence. If I photograph documents, you'll see it. The escrow means I can't destroy the footage.

---

**Financial commitments:**

| Commitment | Effect |
|------------|--------|
| Post $20,000 personal bond | More than I could profit from theft |
| Sign non-compete: $100,000 penalty for any competitor contact | Selling information becomes extremely costly |
| Agree to forensic audit of my finances on request | Can't hide sudden wealth |
| Deferred compensation: 50% of pay held for 2 years | Lose $10K+ if caught within 2 years |

**Xavier**: The bond alone makes stealing the gem irrational—I'd lose $20,000 to gain $1,000. The non-compete makes selling information irrational—I'd face $100,000 liability for a $15,000 sale.

---

**Capability restrictions:**

| Commitment | Effect |
|------------|--------|
| Leave phone and all devices in locker | Can't photograph anything |
| Wear company uniform with no pockets | Can't conceal documents |
| Only enter during 9-10am with 24hr notice | Predictable, can prepare |
| Never enter main office—delivery room only | Same as dumb courier |

**Xavier**: I'm voluntarily making myself as limited as a "dumb" courier. My industry knowledge becomes irrelevant if I can't photograph or remove anything.

---

**Alice**: This is... a lot. Why would you do all this?

**Xavier**: Because I'm worth more than a dumb courier. I can optimize your delivery routes, spot counterfeit gems, negotiate with difficult buyers. You *want* my capability for the job—you just don't want it used against you.

**Alice calls Carol.**

---

**Carol**: Let me recalculate. With Xavier's proposal...

| Control | Premium Impact |
|---------|---------------|
| Body camera + escrow | -40% (near-certain detection) |
| $20,000 bond | -35% (eliminates rational theft) |
| Non-compete with $100K penalty | -25% (eliminates rational info sale) |
| No devices + no pockets | -30% (eliminates capability) |
| Delivery room only | -70% (eliminates access) |

**Carol**: Honestly? With all of this, Xavier is *lower* risk than a random "dumb" courier. The dumb courier might steal opportunistically. Xavier has made theft economically irrational and practically impossible.

| Courier | Premium |
|---------|---------|
| Dumb Bob (baseline) | $600/year |
| Smart Bob (no controls) | $5,000/year |
| **Xavier (with commitments)** | **$350/year** |

**Carol**: I'll write the policy at $350. Xavier has engineered away his own risk.

---

**Alice**: So I get a smart courier for *less* than a dumb one?

**Carol**: Yes—if the controls are real. The body camera, the bond, the escrow—these aren't promises, they're structures. Xavier can't *choose* to defect rationally anymore. That's worth more than hoping a less capable person won't figure out how to steal.

:::note[Implication for AI]
A capable AI system that wants to be deployed could offer similar self-constraints: comprehensive logging, capability restrictions, financial bonds (or computational escrow), third-party monitoring. The AI's capability becomes an asset rather than a liability if the controls make misuse structurally irrational.

The key insight: **voluntary transparency + structural constraints can make high capability lower risk than low capability with no constraints.**
:::

---

### The Extreme Case: A Known Threat

What if the agent isn't just capable, but has a documented history of exploiting clients? What if defection is essentially certain—and the only question is HOW?

This scenario pushes delegation accounting to its limits. The controls required are extreme, the residual exposure is high, and the fundamental question changes from "will they defect?" to "can we bound the damage when they do?"

For the full analysis, see [Containing Mr. X: Bounding Exposure from a Known Threat](/case-studies/anomaly-chronicles/containing-mr-x/).

---

## Insurance

Alice can **externalize** her exposure by buying insurance from **Carol**.

Carol charges a **$40 premium** (the $30 expected exposure + margin). If Bob fails, Carol pays Alice.

| | Without Insurance | With Insurance |
|---|------------------|----------------|
| Receivable | $1,000 | $1,000 |
| Costs | $50 | $90 |
| Exposure | $30 | $0 |
| **NDV** | **$920** | **$910** |
| Worst case | Lose $1,000 | Lose $90 |

:::note[The Trade-off]
Insurance costs $10 in expected value. But it eliminates the worst case. Alice trades expected value for certainty.
:::

---

## Summary

```
Net Delegation Value = Receivable - Exposure - Costs
                     = $1,000 - $30 - $50
                     = $920
```

| Term | Meaning |
|------|---------|
| **Receivable** | What you expect to get |
| **Cost** | Certain expenses |
| **Exposure** | Potential losses (probability × damage) |
| **Contingent Liability** | Consequences of deliberate choices |
| **NDV** | Expected profit after accounting for risk |

---

## Next Steps

- [Complexity Pricing](/research/risk-methods/complexity-pricing/) — Methods for quantifying and pricing structural complexity
- [Containing Mr. X](/case-studies/anomaly-chronicles/containing-mr-x/) — Bounding exposure from a known threat with certain defection
- [Five Years Later: The Anomaly Unit](/case-studies/anomaly-chronicles/five-years-later/) — How an industry emerged to contain a new class of beings
- [Managing Exposure in Power Delegation](/case-studies/anomaly-chronicles/power-struggles/) — Apply delegation accounting to corporate governance, dictatorships, and political systems
- [Fidelity Insurance](/research/risk-methods/fidelity-insurance/) — How insurance markets price defection risk
