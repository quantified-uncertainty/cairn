---
title: "Delegation Accounting: A Balance Sheet View"
description: "A delegation as a balance sheet: receivable, costs and delegation risk; why exposure depends on the delegate's capability; and why uncertainty and conflicts of interest change what a delegation costs to insure"
sidebar:
  badge:
    text: Core
    variant: tip
  order: 6
---

A delegation can be booked like any other business decision:

$$\text{Net Delegation Value} = \text{Receivable} - \text{Costs} - \text{Delegation Risk}$$

This is what you expect to get, minus what it certainly costs, minus the expected loss from what could go wrong.

:::note[Three tiers, booked differently]
The **harm surface** is the set of ways a delegation can go wrong; you enumerate it. **Exposure** is the worst-case loss given the delegate's access, a dollar bound that sizes the downside you carry. **Delegation risk** is the expected loss, Σ P × Damage. A balance sheet that subtracts a number must subtract the expectation, so delegation risk nets against value and exposure does not. See the [Glossary](/getting-started/glossary/#exposure).
:::

All numbers on this page are illustrative.

## The balance sheet

**Alice** has a gem worth \$1,000. A buyer will pay on delivery. She hires **Bob** to deliver it for a \$50 fee.

| Harm mode | Probability | Damage | Expected loss |
|---|---|---|---|
| Bob loses the gem | 2% | \$1,000 | \$20 |
| Bob steals the gem and it is not recovered | 1% | \$1,000 | \$10 |
| **Delegation risk** | | | **\$30** |

The exposure, losing the whole gem, is \$1,000.

| | Value |
|---|---|
| Receivable | \$1,000 |
| Cost (Bob's fee) | −\$50 |
| Delegation risk | −\$30 |
| **Net delegation value** | **\$920** |

The \$1,000 exposure does not appear on the sheet. It sizes the downside Alice chooses to carry.

## Bob's side

Bob has his own sheet, one per option.

| Option | Calculation | Net |
|---|---|---|
| Deliver | \$50 fee; an accidental loss falls on Alice, whose sheet already books it | **\$50** |
| Steal | 20% he gets away with \$1,000; 80% he is caught, returns the gem and pays a \$1,000 fine: 0.2 × \$1,000 − 0.8 × \$1,000 | **−\$600** |

Theft carries a *contingent liability*: a cost that materializes only if he is caught. It makes stealing a losing option, and a courier who reasons this way delivers. Alice's 1% theft row is her estimate that Bob is not that courier.

When Alice delegates through a manager who is liable for his couriers, the \$30 of expected loss on Bob's deliveries moves onto the manager's books. Alice's sheet then holds only the manager's own failure modes, plus the chance that he cannot pay. Liability moves delegation risk between books. It does not remove it.

## Uncertainty about the estimate

The \$30 is a point estimate. For one courier with a track record, it may be a good one. Now suppose Alice's business grows: three layers of management, shared vehicles, contractors who also work for competitors, reporting lines nobody wrote down. The expected loss may not change much, but the uncertainty about it grows a great deal. There are harm modes nobody has enumerated, and less data for the ones they have.

Uncertainty about a probability, as opposed to the probability itself, is what decision theorists call *ambiguity*, and insurers charge for it. In experiments by [Hogarth and Kunreuther (1989)](https://ideas.repec.org/a/kap/jrisku/v2y1989i1p5-35.html), economically sophisticated subjects, including professional actuaries, priced insurance higher for low-probability losses whose probability was ambiguous than for the same losses with a known probability. They were more ambiguity-averse when pricing as firms than as consumers. Insurers do not price to the top of a confidence interval. They price expected loss plus loadings for expenses, capital and, under ambiguity, for not knowing the expected loss. ([The Insurer's Dilemma](/delegation-risk/insurers-dilemma/) covers premium structure.)

So structural complexity costs money even when it leaves expected loss unchanged. It adds an ambiguity loading, and in the limit it makes a risk uninsurable. Documenting relationships, removing shared resources and clarifying authority can lower the price of a delegation faster than they lower its delegation risk. The same should hold for AI deployments. Multi-agent systems with emergent coordination, unclear capability boundaries and undocumented information flows are ambiguous risks. A simpler, more legible architecture may be cheaper to insure than a technically safer but opaque one.

## The office key: exposure depends on capability

Alice gives Bob a key to her office so he can collect gems when she is out. This opens a second, separate exposure, which closes only when the key is returned or revoked. The office holds the day's gem, but also a client list and supplier contracts.

What the key exposes depends on what Bob can do with it.

**A courier who sees only a gem** has the options above: deliver (\$50) or steal the gem (−\$600).

**A courier who knows the trade** sees more:

| Option | Calculation | Net |
|---|---|---|
| Deliver | as above | \$50 |
| Steal the gem | as above | −\$600 |
| Photograph the client list and sell it to a competitor | \$15,000 − 20% caught × \$10,000 fine | **\$13,000** |
| Copy the supplier contracts and sell them | \$8,000 − 15% caught × \$8,000 fine | **\$6,800** |

Same key, same office, same detection odds. For the first courier the key adds little exposure and perhaps \$10 a year of delegation risk. For the second, the exposure is whatever the office's contents are worth in the wrong hands, and Alice's delegation risk might be \$5,000 a year or more. Alice cannot price the key without assessing Bob's capability, and she probably cannot assess it well.

Alice has three levers:

- **Access.** Limit what the key reaches: a separate delivery room, locked files, screens that lock.
- **Capability.** Limit what the delegate can exploit. For this task, a courier with no industry contacts is safer than one with ten years in the trade. That is *least intelligence*: the least capable delegate that does the job.
- **Consequences.** Raise the cost of being caught and the chance of it: cameras, inventory checks, a bond.

Most people pull only the first lever. The other two are often cheaper.

### The capable applicant

A highly capable applicant can buy down the capability premium by accepting constraints. These might be a bond larger than any gain from theft, body-camera footage held by a third party, no devices on the premises, and access to the delivery room only. If the constraints are real and enforced by Alice, such an applicant can be cheaper to insure than an unconstrained, less capable one, and more useful.

This argument assumes a delegate who responds to the incentives it says it has. A scheming AI system is exactly the case where that assumption fails. A constraint it volunteers is weak evidence about its intent, and a bond deters only an agent whose real objectives include keeping the bond. For AI delegates, the transferable part is the constraints the principal imposes and enforces from outside. That means a hard [envelope](/delegation-risk/runtime-accounting/#2-the-exposure-envelope) and monitoring the agent cannot falsify, not the agent's offer to accept them.

## When a conflict of interest makes a risk uninsurable

Ambiguity makes a risk expensive. A conflict of interest can make it uninsurable. Consider an exchange between an insurer, Diana, and a company seeking cover for its AI operations:

> **Ouroboros Holdings:** Our CEO personally owns 40% of our main competitor. Our AI systems share training data with that competitor under a "mutual improvement" agreement. The AI recently showed capabilities we didn't know it had; the team that built it has left. The CEO approves AI deployments, decides which incidents count as failures for insurance purposes, and internal audit reports to him.
>
> **Diana:** With an ordinary complex client, I'm uncertain about *probability*, and I charge for that. With you, I'm uncertain about *intent*. Your CEO could take a decision that hurts you and helps his other company, call it an AI failure, and claim. I can't tell that from an accident. That isn't a risk I can price at any premium.

The remedies are structural, not financial: divest the competing stake, make the audit function report to an independent board, document what the AI system can do, and add third-party monitoring. This is the moral-hazard exclusion that standard crime policies already contain: they do not cover losses caused by the insured itself. It is a useful signal. When no premium will buy cover, the delegation needs restructuring, not pricing.

## Insurance

Alice can transfer the gem risk. Diana charges a \$40 premium: the \$30 expected loss plus a loading for expenses, capital and profit.

| | Without insurance | With insurance |
|---|---|---|
| Receivable | \$1,000 | \$1,000 |
| Costs | \$50 | \$90 |
| Delegation risk (Alice's books) | \$30 | \$0 |
| **Net delegation value** | **\$920** | **\$910** |
| Worst case | the gem is lost | Alice is out only her costs |

Insurance costs Alice \$10 of expected value and removes the \$1,000 downside, apart from exclusions and the insurer's own ability to pay. As with Bob's bond in the [walk-through](/delegation-risk/walkthrough/), this is a transfer. The \$30 of expected loss still exists; it now sits on Diana's books.

## Summary

| Term | Meaning |
|---|---|
| Receivable | What you expect to get |
| Cost | Certain expenses |
| Harm surface | The set of ways the delegation can go wrong |
| Exposure | Worst-case loss given access; a dollar bound, not netted |
| Delegation risk | Expected loss, Σ P × Damage; netted against value |
| Contingent liability | A cost that falls due only if a deliberate act is detected |
| Ambiguity loading | What an insurer charges for not knowing the expected loss |
| Net delegation value | Receivable − costs − delegation risk |

## Next steps

- [The Insurer's Dilemma](/delegation-risk/insurers-dilemma/): moral hazard, adverse selection, and what insurance markets for defection and AI risk actually do
- [Runtime Accounting](/delegation-risk/runtime-accounting/): the ledger that makes this balance sheet operational
