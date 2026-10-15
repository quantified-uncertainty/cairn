---
title: "The Insurer's Dilemma"
description: "Transferring delegation risk to an insurer creates a second delegation problem. The principal–agent map, moral hazard and adverse selection, what fidelity and AI liability insurance actually do, and where insurance stops working against adversarial agents"
sidebar:
  badge:
    text: Core
    variant: tip
  order: 7
---

Insurance is the obvious way to move delegation risk off a principal's books, and it creates a second delegation problem. Once Alice is insured against Bob's failures, her insurer has to trust Alice. It must trust her to keep supervising Bob after the loss is no longer hers (moral hazard), and to be the kind of client she says she is (adverse selection). Economics worked out much of this between the 1960s and 1970s. Two real markets show the results in use: fidelity insurance, which has priced employee dishonesty for a long time, and AI liability insurance, a niche product since 2018 that became a visible market in 2025.

## The framework in principal–agent terms

This site's vocabulary maps onto the principal–agent literature. When talking to economists, use their terms.

| This site | Economics | Source |
|---|---|---|
| Delegation risk left after controls | *Residual loss*: the agent's divergence that monitoring and bonding do not prevent | Jensen & Meckling 1976 |
| Delegation risk + verification spend + bond costs | *Agency cost* = monitoring + bonding + residual loss | Jensen & Meckling 1976 |
| Defection | *Moral hazard* (hidden action): the agent's unobserved choices diverge from the principal's interest | Arrow 1963; Pauly 1968; Holmström 1979 |
| Verification and monitoring | *Monitoring*. The informativeness principle: a contract should use any signal that carries information about the agent's action | Holmström 1979 |
| Bond | *Bonding cost*, borne by the agent to make its commitment credible | Jensen & Meckling 1976 |
| Deductibles and partial coverage | Optimal partial insurance under moral hazard | Pauly 1968; Shavell 1979 |
| Clients the insurer cannot tell apart | *Adverse selection*, and screening by menus of contracts | Rothschild & Stiglitz 1976 |
| Ambiguity loading | Ambiguity aversion in insurance pricing | Hogarth & Kunreuther 1989 |

The hijack channel, a third party steering the delegate, has no counterpart here. It is closer to the external crime that crime and cyber policies cover, such as social engineering and funds-transfer fraud.

## Moral hazard: why full coverage fails

If Alice is fully insured against Bob, she loses her reason to choose him carefully, to supervise him, or to act on warning signs. Arrow (1963) analyzed the problem for medical insurance. Pauly (1968) showed that once insurance changes behavior, full coverage need not be optimal. Shavell (1979) worked out the contract. When the insurer cannot observe the insured's care, the best policy leaves the insured bearing part of the loss. When it can observe care, it can tie the premium to care and offer fuller coverage.

That gives three standard ways to keep the principal's incentive alive:

- **Deductible.** Alice pays the first part of any loss. She stays careful about small losses, but her incentive weakens beyond the deductible.
- **Co-insurance.** Alice pays a fixed share of every loss, so every dollar lost costs her something.
- **Cap.** Cover stops at a limit. Alice keeps the catastrophic tail, and with it an incentive to prevent catastrophes.

There is also a substitute for all three: **monitoring**. If the insurer can see that Alice supervises Bob, through audits, reports or access to logs, it needs less of her money at risk to keep her careful. Holmström's informativeness principle says why: a signal that carries information about her effort beyond what the insurer already observes improves the contract. How much retention a given level of monitoring can replace depends on the case. There is no general table.

## Adverse selection: why pools unravel

Insurers cannot see everything their clients know. The clients keenest to buy delegation cover are disproportionately the ones who expect to claim. A premium set for the average client drives away the careful ones. That raises the average risk, which raises the premium again. Rothschild and Stiglitz (1976) showed that under this kind of hidden information, a competitive market has no equilibrium in which both kinds of client buy the same policy, and sometimes no equilibrium at all. Insurers instead offer menus that make clients reveal their type, such as a cheap, high-deductible policy that only confident clients choose. Underwriting questionnaires, waiting periods, exclusions for prior losses and discounts for documented controls are the working versions.

## Tails, and correlation between clients

The worst case cuts both ways. When a delegate could cause a loss far larger than the principal's capital, the principal most needs cover, and the insurer most needs the principal to be careful. A cap resolves this by leaving the catastrophic tail with the principal, which is exactly where the principal wanted protection.

Insurers face a second tail problem, across their portfolio. Pooling works when clients' losses are roughly independent, and even human dishonesty is not. [Dionne and Wang (2013)](https://ideas.repec.org/a/kap/jrisku/v47y2013i1p67-92.html) find that the severity of fraud in Taiwan's auto-theft insurance market is countercyclical: it rises in recessions. AI makes this worse. If many clients delegate to the same model, one failure can produce thousands of correlated claims. That is the [entanglement tax](/entanglements/) at the scale of a market, and it is what insurers cite when they exclude AI.

## What real markets do

### Fidelity and crime insurance

Fidelity bonds and commercial crime policies cover theft and fraud by employees, the defection channel for human delegates. The underlying losses are well measured. The Association of Certified Fraud Examiners' *Occupational Fraud 2024: A Report to the Nations* analyzes 1,921 cases from 138 countries and territories. It reports:

- a median loss of \$145,000 per case;
- a median of 12 months between the start of a fraud and its detection;
- tips as the most common way frauds were detected, in 43% of cases;
- median losses of \$500,000 for frauds by owners and executives, against \$60,000 for frauds by employees;
- that 57% of victim organizations recovered nothing, and 13% recovered everything;
- that each of the 18 anti-fraud controls studied was associated with both faster detection and lower losses.

The policies follow the theory. Standard crime forms exclude theft by the insured itself, and by employees the insured already knew to be dishonest. Coverage for an employee ends once a dishonest act is discovered. Underwriting asks about internal controls such as segregation of duties and audits. The owner exclusion is the [Ouroboros case](/delegation-risk/delegation-accounting/#when-a-conflict-of-interest-makes-a-risk-uninsurable): when the insured controls the loss, no premium is fair.

A premium is not exposure, and it is not delegation risk either. It is the insurer's estimate of expected loss plus loadings for expenses, capital, profit and ambiguity, so the insurer's expected loss sits below the premium. Read a fidelity premium as an upper estimate of the market's view of a delegate's defection risk.

### AI liability insurance

A small market now prices AI delegation risk directly.

- **Munich Re** has insured AI performance failures since 2018. Its [aiSure](https://www.munichre.com/en/solutions/for-industry-clients/insure-ai.html) products cover losses when a model fails to perform as specified, and can back an AI vendor's performance guarantee.
- **Armilla** [launched](https://www.armilla.ai/resources/armilla-launches-affirmative-ai-liability-insurance-with-lloyds-underwriter-chaucer) an AI liability policy in April 2025, underwritten by Lloyd's syndicates including Chaucer. It responds when an AI system fails to perform as intended, including through hallucinations and errors.
- **The Artificial Intelligence Underwriting Company (AIUC)** [launched](https://amp.insurancejournal.com/news/national/2025/07/25/833169.htm) in July 2025 with a \$15 million seed round. It combines a standard for AI agents (AIUC-1), audits against that standard, and insurance.
- In November 2025 the *Financial Times* [reported](https://techcrunch.com/2025/11/23/ai-is-too-risky-to-insure-say-people-whose-job-is-insuring-risk/) that several large US insurers, including W. R. Berkley and Great American, had asked state regulators to approve exclusions for AI-related liability in corporate policies. The worry they gave was systemic: one widely used model failing could trigger thousands of claims at once.

Read against the theory, this is the expected pattern. Where an insurer can audit, as in AIUC's standard, audit, insure model, monitoring stands in for retention. Where losses are correlated across policyholders, or the system's behavior is opaque, insurers exclude the risk rather than price it. This is the first real price signal for AI delegation risk. The market is too young to say whether the prices are any good.

## Where insurance stops working: adversarial agents

All of this assumes that the party whose behavior the contract shapes is the party that controls the loss. In the moral-hazard model that party is the insured principal, and partial coverage keeps her careful. A scheming delegate breaks the assumption. Its behavior does not depend on Alice's coverage ratio. It may also corrupt the signals that monitoring relies on, and the informativeness principle helps only while a signal is informative about what the agent actually did. Monitors can fail strategically as well. [Mookherjee and Png (1995)](https://ideas.repec.org/a/ecj/econjl/v105y1995i428p145-59.html) model a bribable pollution inspector, and find that because inspector and factory interact strategically, raising the penalty for corruption can increase pollution.

Against such an agent, coverage terms do not reduce risk. They only decide who bears the loss. What reduces it is constraining what the agent can do, with a hard [exposure envelope](/delegation-risk/runtime-accounting/#2-the-exposure-envelope), and monitoring it cannot falsify, with ledger inputs measured at the boundary. Any claim that those constraints hold against intentional subversion needs a control evaluation ([Greenblatt et al. 2023](https://arxiv.org/abs/2312.06942)). Insurance can price a delegation that is already bounded. It cannot bound one.

## References

- Arrow, K. J. (1963). Uncertainty and the Welfare Economics of Medical Care. *American Economic Review* 53(5), 941–973.
- Association of Certified Fraud Examiners (2024). *Occupational Fraud 2024: A Report to the Nations*.
- Dionne, G., & Wang, K. C. (2013). Does Insurance Fraud in Automobile Theft Insurance Fluctuate with the Business Cycle? *Journal of Risk and Uncertainty* 47(1), 67–92.
- Greenblatt, R., Shlegeris, B., Sachan, K., & Roger, F. (2023). [AI Control: Improving Safety Despite Intentional Subversion](https://arxiv.org/abs/2312.06942). ICML 2024.
- Hogarth, R. M., & Kunreuther, H. (1989). Risk, Ambiguity, and Insurance. *Journal of Risk and Uncertainty* 2(1), 5–35.
- Holmström, B. (1979). Moral Hazard and Observability. *Bell Journal of Economics* 10(1), 74–91.
- Jensen, M. C., & Meckling, W. H. (1976). Theory of the Firm: Managerial Behavior, Agency Costs and Ownership Structure. *Journal of Financial Economics* 3(4), 305–360.
- Mookherjee, D., & Png, I. P. L. (1995). Corruptible Law Enforcers: How Should They Be Compensated? *Economic Journal* 105(428), 145–159.
- Pauly, M. V. (1968). The Economics of Moral Hazard: Comment. *American Economic Review* 58(3), 531–537.
- Rothschild, M., & Stiglitz, J. (1976). Equilibrium in Competitive Insurance Markets: An Essay on the Economics of Imperfect Information. *Quarterly Journal of Economics* 90(4), 629–649.
- Shavell, S. (1979). On Moral Hazard and Insurance. *Quarterly Journal of Economics* 93(4), 541–562.

See also [Delegation Accounting](/delegation-risk/delegation-accounting/) for the balance-sheet view and the ambiguity loading.
