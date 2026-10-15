---
title: "Nuclear Launch Authority"
description: "How nuclear states trade unauthorized launch against failure to retaliate, the near misses that tested those choices, and what carries over to AI delegation."
sidebar:
  badge:
    text: Core
    variant: tip
  order: 4
---

Nuclear command and control is the highest-stakes delegation problem anyone has designed for. About 12,200 warheads existed in January 2025 ([SIPRI Yearbook 2025](https://www.sipri.org/media/press-release/2025/nuclear-risks-grow-new-arms-race-looms-new-sipri-yearbook-out-now)). Every nuclear state has to decide which error it fears more: a launch nobody legitimately ordered, or a failure to launch when one was ordered.

An earlier version of this page put dollar-weighted probabilities on each country's system and concluded that the Soviet "Dead Hand" was the safest architecture. That conclusion came from a single invented probability of attack applied to every country, which ignored the deterrence effects it claimed to depend on, and it priced losing a war in the same currency as an accidental one. The numbers and the ranking have been removed. What remains is qualitative.

## Two failure modes that pull against each other

- **False positive:** a launch without a legitimate order, from a false warning, a misread exercise, a rogue actor, a garbled message or a spoofed command.
- **False negative:** no launch after a legitimate order, because leaders were killed, communications were cut, crews refused or equipment failed.

Deterrence needs retaliation to be certain and to survive a decapitating strike, which argues for many launch paths, fast response and authority pushed down the chain. Safety needs unauthorized launch to be impossible, which argues for central control, humans at every step and many veto points. Each design is a point on this tradeoff.

The direction of the tradeoff is easy to get backwards. **More independent paths to act** (many submarines, bombers and silos, pre-delegated authority) lower the false-negative rate and raise the false-positive rate, because there are more places from which an unintended launch can start. **More independent vetoes** (two-person rules, authentication codes, centralized release) do the reverse.

## The near misses

| Date | What happened | What stopped it |
|---|---|---|
| 27 Oct 1962 | Soviet submarine B-59, out of contact and under harassment by US ships near Cuba, considered firing a nuclear torpedo. Launch required the agreement of three officers. | Vasily Arkhipov is usually credited with refusing; some accounts stress that the submarine had to surface anyway. |
| 9 Nov 1979 | A training scenario loaded into NORAD's live warning computers showed a large Soviet attack. | Satellite and radar data, checked within minutes, showed nothing. |
| 3 Jun 1980 | A faulty computer chip at NORAD generated false warnings of missile launches. | The same cross-check against independent sensors. |
| 26 Sep 1983 | Soviet early-warning satellites reported up to five US ICBM launches. | Duty officer Stanislav Petrov judged a five-missile first strike implausible and reported a malfunction instead of an attack. |
| Nov 1983 | NATO's Able Archer 83 nuclear-release exercise coincided with an unusual Soviet military alert. | NATO did not escalate in response. A later review by the President's Foreign Intelligence Advisory Board called this restraint "fortuitous, if ill-informed" ([National Security Archive](https://nsarchive.gwu.edu/legacy-posting/1983-war-scare-declassified-real)). |
| 25 Jan 1995 | Russian radar tracked a Norwegian–US research rocket and Yeltsin's nuclear briefcase was activated. | The rocket's trajectory, observed over the following minutes, showed no threat. |

The pattern: in four of the six, automation raised the alarm, and in every case a human judgment or a second, independent sensor stopped it. Each save depended on minutes of slack.

## The architectures

**United States: sole presidential authority, two-person execution.** Only the President can authorize nuclear use, and no one else's concurrence is legally required. Below the President, every execution step requires two people and authenticated codes. The design guards strongly against a rogue officer and weakly against an error by the single principal, and it relies on there being time to verify a warning. The 2022 Nuclear Posture Review commits that "in all cases, the United States will maintain a human 'in the loop' for all actions critical to informing and executing decisions by the President to initiate and terminate nuclear weapon employment."

**Soviet Union and Russia: Perimeter, the "Dead Hand".** Perimeter is usually described as a doomsday machine that launches automatically. Accounts differ on how automatic it is, and more recent ones describe it as semi-automatic. In the account David Hoffman gives in *The Dead Hand* (2009), drawing on Valery Yarynich, the system lies dormant until leaders switch it on in a crisis. It then monitors sensors for nuclear detonations and checks its link to the General Staff. If the link goes dead it does not fire missiles itself: launch authority passes to duty officers in a protected bunker, who decide whether to launch command rockets that relay the launch order to the forces. Yarynich presented its purpose as letting leaders wait out an ambiguous warning instead of launching on it. On that account Perimeter is pre-delegation to junior officers, combined with a mechanism meant to reduce pressure to launch on warning. It lowers one false-positive risk and adds another.

**United Kingdom: letters of last resort.** Each new prime minister handwrites identical letters to the commanders of the four Vanguard-class submarines, which are kept in the submarines' safes and destroyed unopened when the prime minister leaves office. The options reportedly include retaliating, not retaliating, placing the submarine under an ally's command, or using the commander's own judgment (Peter Hennessy, *The Secret State*). A commander opens the letter only after concluding that the British government no longer exists. The decision is made in peacetime by a principal who will be absent when it is carried out, and adversaries cannot know what it says.

**France.** Authority to order nuclear use rests with the President alone, under a decree of January 1964 whose principle later texts maintain. An earlier version of this page said a prime-ministerial counter-signature was "historically expected"; we found no basis for that.

**Israel** maintains a policy of opacity, and its command arrangements are not public.

## Systems that cannot be tested end to end

No nuclear power has exercised its full launch chain under real conditions. Components, drills and communications are tested separately. Component tests do not reveal common-mode failures, such as a communications network every path depends on or an assumption every officer shares. Reliability estimates that multiply component test results assume exactly the independence that those failures break.

## AI and nuclear command

The most direct AI development in this area is political. Besides the 2022 Nuclear Posture Review, the White House readout of the meeting between Presidents Biden and Xi in Lima on 16 November 2024 states that "the two leaders affirmed the need to maintain human control over the decision to use nuclear weapons." Neither statement defines what counts as meaningful human control when warning, fusion and targeting are increasingly automated, which is where the near-miss record says the danger lies.

## Lessons for AI delegation

1. **Choose which error you are guarding against, deliberately.** The US, Soviet and British systems differ because their designers weighed false positives and false negatives differently, not because one was better engineered. An AI gate needs the same decision made explicitly: is the costlier error a harmful action allowed, or a useful one blocked?
2. **Redundant actors and redundant vetoes push in opposite directions.** Adding agents that can act lowers the chance nothing happens and raises the chance the wrong thing does. Adding checks that can block does the reverse.
3. **Human circuit breakers need slack and a second source.** Petrov and the NORAD duty officers had minutes and an independent sensor. Agents acting at machine speed remove both unless the scaffold imposes a delay before irreversible actions.
4. **Write the loss-of-contact policy before contact is lost.** The letters of last resort are a principal specifying behavior for a situation in which it cannot be consulted. Agents need the same: when the principal cannot be reached, the default should be to stop, not continue.
5. **Ambiguity is a tradeoff.** Secret criteria are harder for an adversary to game and harder for anyone to audit. Undisclosed shutdown triggers for an AI system gain the first property and lose the second.

## See also

- [Jury Systems](/case-studies/human-systems/jury-trust/): error asymmetry and correlated decision-makers
- [Lessons from human oversight institutions](/entanglements/case-studies/historical-cases/)
- [Least-X Principles](/design-patterns/least-x-principles/#least-autonomy): Least Autonomy
- [Recovery Patterns](/design-patterns/recovery/)
