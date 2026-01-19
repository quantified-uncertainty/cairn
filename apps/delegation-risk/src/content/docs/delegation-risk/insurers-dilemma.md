---
title: "The Insurer's Dilemma"
sidebar:
  order: 6
---

# The Insurer's Dilemma

:::note[TL;DR]
Before you can insure delegation risk, you must solve the moral hazard problem: **the insurer doesn't trust the principal**. If Alice is fully covered, she has no incentive to be careful with Bob. The solution is partial coverage—but how partial? Too little and Alice won't engage agents at all. Too much and she'll take reckless risks. The optimal coverage ratio depends on how much the insurer can monitor, how aligned Alice's incentives are, and how catastrophic the worst outcomes could be.
:::

---

## The Setup

Diana runs a small specialty insurance firm. Her niche: delegation risk coverage for businesses that hire high-capability contractors.

Alice walks in with a problem.

> **Alice**: I need to hire a financial analyst. Someone really good. But if they mess up—or worse, if they're malicious—it could destroy my business. I want insurance.
>
> **Diana**: What kind of coverage are you looking for?
>
> **Alice**: Full coverage. 100%. If anything goes wrong, I want to be made whole.
>
> **Diana**: I can't do that.
>
> **Alice**: Why not? I'll pay the premium.
>
> **Diana**: Because if I give you 100% coverage, you'll stop being careful.

---

## The Moral Hazard Problem

Diana sketches on a whiteboard:

```
WITHOUT INSURANCE:
Alice hires Bob → If Bob fails → Alice loses $100,000
Alice's incentive: Be VERY careful about Bob

WITH 100% INSURANCE:
Alice hires Bob → If Bob fails → Diana loses $100,000
Alice's incentive: Who cares? I'm covered.
```

> **Diana**: This is called moral hazard. When you're fully insured, you have no skin in the game. You might hire someone riskier. You might supervise less. You might ignore warning signs.
>
> **Alice**: I wouldn't do that.
>
> **Diana**: Maybe not consciously. But at the margin? If you're choosing between a safe-but-mediocre analyst and a brilliant-but-unpredictable one—and you're fully covered—which do you pick?
>
> **Alice**: *(pause)* The brilliant one.
>
> **Diana**: Exactly. And that's rational for you. But it's terrible for me.

---

## The Coverage Spectrum

Diana draws a graph:

```
Coverage %    Alice's Behavior         Diana's Risk         System Outcome
─────────────────────────────────────────────────────────────────────────
0%            Extremely cautious       Zero                 Alice avoids all agents
              (or avoids agents)                            (valuable work undone)

25%           Very cautious            Low                  Alice uses only safest agents
              Extensive oversight                           (moderate productivity)

50%           Moderately cautious      Moderate             Alice uses good agents
              Reasonable oversight                          (good productivity)

75%           Somewhat cautious        High                 Alice uses risky agents
              Light oversight                               (high productivity, high variance)

100%          Careless                 Maximum              Alice uses anyone
              No oversight                                  (maximum productivity OR disaster)
```

> **Diana**: The coverage ratio isn't just about splitting losses. It's about maintaining your incentive to be careful.
>
> **Alice**: So what's the right number?
>
> **Diana**: It depends on several things.

---

## Factor 1: Monitorability

> **Diana**: Can I watch what you're doing?

If Diana can monitor Alice's supervision of Bob, she needs less skin-in-the-game incentive:

| Monitoring Level | Required Retention | Why |
|------------------|-------------------|-----|
| Full transparency | 10-20% | Diana can verify Alice is careful |
| Quarterly audits | 30-40% | Some verification, gaps possible |
| Annual reports only | 50-60% | Limited visibility |
| No monitoring | 70-80% | Alice's incentive is only protection |

> **Alice**: So if I let you audit my oversight processes, I can get more coverage?
>
> **Diana**: Exactly. Monitoring substitutes for retention. If I can see you being careful, I don't need your money at risk to make you careful.

---

## Factor 2: Alice's Baseline Incentives

> **Diana**: How much do you care about outcomes beyond the money?

Some principals have incentives beyond insurance:

| Principal Type | Baseline Care | Coverage Possible |
|----------------|---------------|-------------------|
| Reputation-dependent | High | 70-80% |
| Regulatory scrutiny | High | 70-80% |
| One-shot player | Low | 30-40% |
| Repeat customer | Medium | 50-60% |

> **Diana**: If your reputation is on the line—if a failure would embarrass you publicly, damage relationships, trigger investigations—then you'll be careful regardless of insurance. I can offer more coverage because your incentives are already aligned.
>
> **Alice**: My business depends on trust. A scandal would be worse than the direct losses.
>
> **Diana**: Good. That means I can cover more of the direct losses.

---

## Factor 3: Catastrophic Tails

> **Diana**: What's the worst case?

```
Scenario A: Bob makes errors
  - Expected loss: $50,000
  - Maximum loss: $100,000
  - Variance: Low

Scenario B: Bob is malicious
  - Expected loss: $50,000
  - Maximum loss: $10,000,000
  - Variance: Extreme
```

> **Diana**: When the tail risk is catastrophic, I need you MORE careful, not less. That means lower coverage.
>
> **Alice**: But catastrophic risk is exactly when I need insurance most!
>
> **Diana**: I know. It's a genuine dilemma. The worse the potential outcome, the more important your vigilance—but also the more you want to transfer the risk.

Diana pauses.

> **Diana**: This is why we invented deductibles and coverage caps.

---

## The Structure of Partial Coverage

Diana shows three mechanisms:

### 1. Co-insurance (Percentage Retention)

```
Coverage: 70%
Loss occurs: $100,000
Diana pays: $70,000
Alice pays: $30,000

Alice's incentive: Every dollar of loss costs her 30 cents
```

### 2. Deductible (First-Dollar Retention)

```
Deductible: $25,000
Loss occurs: $100,000
Diana pays: $75,000
Alice pays: $25,000

Alice's incentive: Avoid losses entirely (full exposure up to deductible)
                   Less careful about losses beyond deductible
```

### 3. Coverage Cap (Tail Retention)

```
Cap: $500,000
Loss occurs: $800,000
Diana pays: $500,000
Alice pays: $300,000

Alice's incentive: Prevent catastrophic scenarios specifically
```

> **Diana**: For delegation risk, I usually combine all three. Deductible for small losses, co-insurance for medium losses, cap for catastrophic losses. You have skin in the game at every level.

---

## The Premium Calculation

> **Alice**: So what would this actually cost?

Diana pulls out her formula:

```
Base Premium = E[Loss] × Coverage_Ratio

Moral Hazard Loading = Base × MH_Factor(coverage_ratio, monitoring, alignment)

Where MH_Factor increases with:
  - Higher coverage ratio
  - Less monitoring
  - Lower baseline alignment

Final Premium = Base Premium + Moral Hazard Loading + Administrative Costs
```

**Example:**

| Component | Value | Calculation |
|-----------|-------|-------------|
| Expected loss (no insurance) | $20,000/year | Historical data |
| Coverage ratio | 60% | Negotiated |
| Base premium | $12,000 | $20,000 × 60% |
| Moral hazard factor | 1.3× | 60% coverage, quarterly audits, reputation-dependent |
| Moral hazard loading | $3,600 | $12,000 × 30% |
| Administrative | $1,000 | Fixed |
| **Final premium** | **$16,600** | |

> **Alice**: Wait—you're charging me extra because you think I'll be less careful?
>
> **Diana**: I'm charging you for the *expected* increase in losses due to changed behavior. If you prove me wrong—if your loss rate stays low—your premiums go down over time.

---

## The Monitoring Agreement

Alice and Diana negotiate:

**Alice agrees to:**
- Quarterly reports on agent oversight activities
- Immediate notification of any concerning behaviors
- Diana's right to audit supervision records
- Minimum supervision standards (specified in appendix)

**Diana agrees to:**
- 60% co-insurance on losses up to $200,000
- 40% co-insurance on losses $200,000-$500,000
- $500,000 coverage cap
- Premium reduction for clean quarters

> **Diana**: The monitoring isn't just about catching you being careless. It's about letting me *trust* you enough to offer real coverage. Without monitoring, I'd have to assume the worst.
>
> **Alice**: So surveillance enables insurance.
>
> **Diana**: Verification enables trust. The surveillance is just how we verify.

---

## The Selection Problem

A week later, Diana reviews her portfolio and notices a pattern:

```
Clients seeking delegation risk coverage:
- 60% have had previous incidents
- 30% are entering new high-risk ventures
- 10% are genuinely cautious seeking protection

Industry average incident rate: 5%
My client incident rate: 12%
```

> **Diana's partner**: We're getting adverse selection. The people who want insurance are the ones who expect to need it.
>
> **Diana**: Which makes the insurance more expensive, which drives away the cautious ones, which makes the pool even riskier...
>
> **Partner**: Classic death spiral.

Diana implements countermeasures:

| Problem | Solution |
|---------|----------|
| Prior incidents | Higher premiums or exclusions |
| New ventures | Waiting period before full coverage |
| Risk-seeking principals | Enhanced monitoring requirements |
| Cautious principals | Premium discounts to keep them in pool |

---

## The Principal-Agent-Insurer Triangle

Diana realizes she's now part of a three-way trust problem:

```
                    ALICE (Principal)
                   /                 \
                  /                   \
          Delegates to            Insured by
                /                       \
               /                         \
          BOB (Agent) ←─────────────→ DIANA (Insurer)
                      Indirect exposure
```

- **Alice doesn't fully trust Bob** → That's why she wants insurance
- **Diana doesn't fully trust Alice** → That's why coverage is partial
- **Diana has indirect exposure to Bob** → Via Alice's claims

> **Diana**: I'm not just insuring against Bob's failures. I'm insuring against *Alice's management of Bob*. My real counterparty is Alice, but my real risk is Bob—filtered through Alice's judgment.

This creates interesting dynamics:

| If Alice supervises poorly... | |
|------------------------------|---|
| Bob is more likely to fail | Diana's risk increases |
| Alice is more likely to claim | Diana's risk increases |
| Diana raises premiums | Alice's costs increase |
| Alice might improve supervision | ...or might find a cheaper insurer |

---

## The Trust Ladder

Diana develops a framework for client relationships:

| Level | Client Type | Coverage | Monitoring | Premium | Criteria |
|-------|-------------|----------|------------|---------|----------|
| **0** | New Client | 40% max | Monthly audits | Base × 1.5 | First year |
| **1** | Established | 60% max | Quarterly audits | Base × 1.2 | 2 years, <2 incidents, audit compliance |
| **2** | Trusted | 75% max | Semi-annual audits | Base × 1.0 | 5 years, <3 incidents, proactive reporting |
| **3** | Partner | 85% max | Annual review | Base × 0.85 | 10 years, <2 incidents, demonstrated excellence |

> **Diana**: Trust is earned through track record. As you prove your judgment is sound, I can rely less on financial incentives and more on demonstrated behavior.
>
> **Alice**: So the coverage ratio isn't fixed—it's a relationship.
>
> **Diana**: Exactly. We're both learning. I'm learning whether to trust you. You're learning what I need to see. The coverage tracks that mutual understanding.

---

## The Limits of Insurance

After three years, Alice is a Level 2 client. Then she comes with a new request:

> **Alice**: I've found an extraordinary candidate. Brilliant. Could transform my business. But... there's something off about him. I can't explain it. My due diligence found nothing wrong, but my instincts are screaming.
>
> **Diana**: And you want to hire him anyway?
>
> **Alice**: If I'm covered. Yes.

Diana thinks carefully.

> **Diana**: This is exactly the moral hazard I worry about. Your instincts say danger, but you want to override them because you're insured.
>
> **Alice**: My instincts might be wrong. He could be the best hire I ever make.
>
> **Diana**: He could also be the worst. And if your instincts are right—if something IS off—then you're not just risking loss. You're risking catastrophe.

Diana makes a decision.

> **Diana**: I'll cover you. But at a different structure.
>
> **Alice**: What do you mean?
>
> **Diana**: I mean I want to meet him first.

---

## Setting Up Mr. X

*Three weeks later, Alice brings her candidate to Diana's office.*

*He's tall. Immaculately dressed. His smile doesn't quite reach his eyes.*

> **Diana**: Please, sit down. I understand Alice is considering bringing you on as a strategic consultant.
>
> **Candidate**: That's correct. I specialize in situations where conventional approaches have failed.
>
> **Diana**: And why would Alice need unconventional approaches?
>
> **Candidate**: *(slight smile)* Because her competitors are already using them.

*Diana studies him. Everything checks out. References impeccable. Track record impressive. And yet—*

> **Diana**: I'd like to understand your previous engagements better. Several of your former clients seem to have... restructured significantly after your involvement.
>
> **Candidate**: Restructuring is often necessary for growth.
>
> **Diana**: One of them no longer exists.
>
> **Candidate**: Regrettable. But not my doing.
>
> **Diana**: Can you prove that?
>
> **Candidate**: *(long pause)* No. But then, neither could anyone prove I was responsible. Because I wasn't.

*Diana feels the hair rise on the back of her neck.*

> **Diana**: I need to do additional due diligence before I can provide coverage.
>
> **Candidate**: Of course. I would expect nothing less.

*He stands, extends his hand. His grip is firm, his eye contact unwavering.*

> **Candidate**: I look forward to working with you, Diana. Both of you.

*After he leaves, Alice turns to Diana.*

> **Alice**: Well?
>
> **Diana**: *(slowly)* I need to pull some files. Some very old files.
>
> **Alice**: What are you looking for?
>
> **Diana**: I'm looking for anyone who's insured someone like him before. And survived.

---

## What Diana Learns

*Over the next week, Diana makes calls. Lots of calls. Most go nowhere. But a few...*

> **Former Colleague**: You're asking about THAT kind of client? Jesus, Diana. Where do I start?
>
> **Diana**: Start with the ones who got burned.
>
> **Former Colleague**: That's most of them. The coverage ratios, the monitoring, the deductibles—none of it mattered. These clients... they're different.
>
> **Diana**: Different how?
>
> **Former Colleague**: They're smarter than us. They're playing a longer game. And they KNOW how insurance changes incentives—so they manipulate those incentives. I had one client who deliberately triggered small claims to build trust, then...

*Silence on the line.*

> **Diana**: Then what?
>
> **Former Colleague**: Then nothing. We paid out everything. Company doesn't exist anymore. I don't talk about it.

---

## The New Framework

Diana stays late, reworking her models. The moral hazard problem with normal clients is about *incentives*—make sure they have skin in the game.

But this candidate... the problem isn't Alice's incentives. The problem is the candidate himself.

She writes:

```
STANDARD MORAL HAZARD:
- Risk: Principal becomes careless when insured
- Solution: Partial coverage, monitoring, alignment

NEW CATEGORY: ADVERSARIAL AGENT RISK
- Risk: Agent is actively malicious, regardless of principal's care
- Principal's care level: Irrelevant if agent is sophisticated enough
- Monitoring: Agent may manipulate what's monitored
- Coverage ratio: Doesn't change agent's behavior, only loss allocation

IMPLICATION:
When the agent is adversarial and sophisticated,
conventional insurance structures don't reduce risk—
they just shift who bears the loss.

NEW QUESTION:
Can we design coverage that actually changes the AGENT's behavior,
not just the principal's?
```

Diana looks at what she's written.

This isn't insurance anymore. This is something else.

She picks up the phone.

> **Diana**: Alice? We need to talk. About your candidate. And about a completely different way of structuring this engagement.

---

## Further Reading

- [Containing Mr. X](/case-studies/anomaly-chronicles/containing-mr-x/) — What Diana proposes
- [Delegation Accounting](/delegation-risk/delegation-accounting/) — The underlying framework
- [Five Years Later](/case-studies/anomaly-chronicles/five-years-later/) — How this scales to an industry
