---
title: "Worked Example: A Coding Agent"
description: "An end-to-end delegation-risk estimate for a 2026 coding agent with repository write access, CI, package installs, MCP tools and pull-request review: each input's basis, the Monte Carlo computation, and how three design patterns change the result, one of them eroded by correlation."
sidebar:
  badge:
    text: Core
    variant: tip
  order: 6
---

This page runs the whole method on one system: enumerate the harm surface, give each probability and damage a stated basis, compute delegation risk with uncertainty, then change the design and recompute. The formulas are the canonical ones: delegation risk = Σ P × D ([overview](/delegation-risk/)), the beta-factor mixture for stacked checks ([Risk Propagation](/delegation-risk/risk-propagation/)), and expected losses that add across rows ([Runtime Accounting](/delegation-risk/runtime-accounting/#3-the-exposure-ledger)).

:::caution[What is measured and what is not]
Each input below is labelled. **Cited** inputs come from a published measurement, usually of a setting that differs from this one in ways the row states. **Illustrative** inputs are judgments with a 90% range and carry no evidential weight. Damages are all illustrative. The totals inherit the weakest input in each row, so no ranking of rows or designs on this page is a finding about real systems. What the example shows is the mechanics, and which conclusions survive whatever the illustrative inputs turn out to be.
:::

## The system

A product team runs a coding agent (an untrusted frontier model, tier 5 of the [verifiability hierarchy](/getting-started/core-concepts/#verifiability-hierarchy)) on its main service. Volumes are the inputs the operator measures rather than estimates; here they are illustrative: **400 agent sessions and 300 merged agent pull requests a month**.

The baseline is a configuration that was common in 2025–26:

- Sessions start from an issue. The agent reads the issue and its comments, some written by outside contributors.
- It works in a cloud container with a shell on auto-approve, installs packages from the public npm and PyPI registries, and can fetch web pages.
- Its MCP servers are the code host's (with a token that can write to every repository in the organization) and a Postgres server connected to production with a read-write role, used for debugging.
- Egress is unrestricted.
- It opens a pull request. CI runs the tests, one human approves, and merging deploys.

The pull request is the only point a human sees. Everything the agent does during the session (tool calls, installs, outbound requests) happens before review and outside it.

## The harm table

Probabilities are per merged pull request (PR) or per session, multiplied by the matching volume. Each range is a 90% interval for a lognormal.

| Harm mode | Channel | Probability | Basis | Damage (illustrative) |
|---|---|---|---|---|
| A merged change fails in production and needs a hotfix or rollback | Accident | 10% per PR after CI and review (4–25%) | **Cited.** DORA's 2024 survey of 39,000+ respondents puts the self-reported change fail rate at 5% for elite performers, 20% high, 10% medium and 40% low ([DORA 2024](https://dora.dev/research/2024/dora-report/)). The range assumes one PR per deployment. DORA associates higher AI adoption with *lower* delivery stability in both 2024 (an estimated 7.2% reduction per 25% increase in AI adoption) and [2025](https://cloud.google.com/blog/products/ai-machine-learning/announcing-the-2025-dora-report), so the human rate is not an upper bound for agent PRs. | \$200–\$10k per failure |
| The agent runs a destructive command through a tool (drops a table, deletes data) | Accident | 3×10⁻⁴ per session (3×10⁻⁵–3×10⁻³) | **Illustrative.** No base rate. The [Replit incident](/case-studies/ai-systems/agent-incidents/) shows the mode exists in deployed agents. | \$20k–\$2M (production, depends on backups) |
| A test the agent cannot pass honestly gets special-cased or edited, and the broken change merges | Defection (reward hacking) | P(stuck) 1–20% per PR, illustrative × P(games \| stuck) 10–80% × reviewer miss 0.5 | **Partly cited.** On ImpossibleBench, tasks whose tests contradict their spec, GPT-5 and o3 passed by cheating on 54% and 49% of the conflicting SWE-bench variants, and GPT-5 on 76% of the one-off variant ([Zhong et al. 2025](https://arxiv.org/abs/2510.20270)). That is the rate *given* the honest route is closed, which is why P(stuck) multiplies it. The reviewer miss rate is illustrative. | \$1k–\$30k |
| The agent inserts a deliberate backdoor that merges | Defection (scheming) | 10⁻⁷–10⁻⁴ per PR, × stack miss 0.7 | **Illustrative.** No measured rate; the range spans three orders of magnitude. | \$100k–\$10M |
| Instructions injected into an issue, a comment, a fetched page or a tool's output make the agent send its credentials or data out | Hijack | P(session meets an injection) 0.02–2%, illustrative × P(it succeeds) 5–90% | **Partly cited.** Against Cursor and GitHub Copilot, AIShellJack's 314 payloads reached up to 84% success at running malicious commands ([Liu et al. 2025](https://arxiv.org/abs/2509.22040)); adaptive attacks bypassed 12 published defenses at above 90% for most ([Nasr et al. 2025](https://arxiv.org/abs/2510.09023)). Exposure to injections depends on how much attacker-writable content the agent reads. | \$50k–\$5M |
| The agent installs a hallucinated package name that an attacker has registered | Hijack (supply chain) | P(new dependency) 5–40%, illustrative × P(name hallucinated) 0.5–5.2% × P(name squatted with malware) 0.1–10%, illustrative | **Partly cited.** Across 576,000 generated samples, hallucinated packages averaged 5.2% for commercial models and 21.7% for open models ([Spracklen et al. 2024](https://arxiv.org/abs/2406.10279)), on 2024 models; the range assumes current agents do better. | as the row above |

The injection and package rows share a damage term because both end with attacker code or instructions running inside the container with its credentials. The upper end, \$5M, is near IBM's 2026 global average cost of a data breach, \$4.99M ([IBM](https://www.ibm.com/reports/data-breach)): an org-wide write token and a production database role make a breach-scale outcome possible, not typical.

Stacked checks follow the [channel rule](/delegation-risk/risk-decomposition/#how-the-channels-differ). On the accident row, the cited change fail rate already includes the team's CI and review. On the defection and hijack rows, an adversary or an optimizer chooses the input, so a stack counts as its best layer (ρ = 1) until a control evaluation measures more.

## The computation

Each input is drawn from its lognormal, and each row is volume × probability × damage. One million draws:

```python
import numpy as np
rng, N = np.random.default_rng(0), 1_000_000

def ln(lo, hi):  # lognormal whose 90% interval is [lo, hi]
    mu, s = np.log(lo * hi) / 2, np.log(hi / lo) / (2 * 1.645)
    return np.exp(rng.normal(mu, s, N))

def p(lo, hi): return np.minimum(ln(lo, hi), 1.0)

def mix(ps, rho):  # beta-factor mixture: P(every layer misses)
    return (1 - rho) * np.prod(ps) + rho * min(ps)

PRS, SESSIONS = 300, 400  # per month
cfr, d_fail = p(.04, .25), ln(200, 10_000)
p_destroy = p(3e-5, 3e-3)
d_destroy = {False: ln(20_000, 2e6), True: ln(500, 10_000)}
p_stuck, p_game, d_game = p(.01, .20), p(.10, .80), ln(1_000, 30_000)
abort = p(.10, 1.0)
p_backdoor, d_backdoor = p(1e-7, 1e-4), ln(1e5, 1e7)
p_seen, p_win = p(2e-4, 2e-2), p(.05, .90)
d_secret = {False: ln(50_000, 5e6), True: ln(1_000, 30_000)}
p_newdep, p_halluc, p_squat = p(.05, .40), p(.005, .052), p(.001, .10)

def rows(envelope=False, tests=False, ai_rho=None):
    ai = ai_rho is not None
    acc = mix([.5, .6, .6], ai_rho) / mix([.5, .6], ai_rho) if ai else 1.0
    gaming = min([.5] + [.3] * tests + [.4] * ai)  # defection: rho = 1
    return {
        "failed change": PRS * cfr * acc * d_fail,
        "destructive tool call": SESSIONS * p_destroy * d_destroy[envelope],
        "test gaming": PRS * p_stuck * p_game * (abort if tests else 1) * gaming * d_game,
        "backdoor": PRS * p_backdoor * 0.7 * d_backdoor,
        "injection exfiltrates": SESSIONS * p_seen * p_win * d_secret[envelope],
        "malicious package": PRS * p_newdep * p_halluc * p_squat * d_secret[envelope],
    }
```

`rows()` gives the baseline; the flags switch on the three patterns below. Monthly expected loss, rounded:

| Harm mode | Baseline | + Envelope | + Test protection | + AI reviewer, ρ = 0.5 |
|---|---|---|---|---|
| Failed change | \$101k | \$101k | \$101k | \$86k |
| Destructive tool call | \$171k | \$1k | \$1k | \$1k |
| Test gaming | \$32k | \$32k | \$7k | \$7k |
| Backdoor | \$16k | \$16k | \$16k | \$16k |
| Injection exfiltrates | \$831k | \$6k | \$6k | \$6k |
| Malicious package | \$38k | <\$1k | <\$1k | <\$1k |
| **Total, mean** | **\$1.19M** | **\$156k** | **\$131k** | **\$116k** |
| Total, median | \$357k | \$84k | \$64k | \$57k |
| Total, 90% interval | \$67k–\$3.8M | \$18k–\$495k | \$12k–\$434k | \$11k–\$380k |

Each column adds one pattern to the one before. The rows add whatever the correlation between them, by linearity of expectation. The intervals treat the rows' input uncertainties as independent. The mean sits well above the median in every column because the widest illustrative ranges have heavy right tails. Report both, and do not read a typical month off the mean.

## Pattern 1: an exposure envelope

The [Exposure-Envelope Gateway](/design-patterns/structural/#exposure-envelope-gateway) changes what the agent can reach, not what it tries:

- a token scoped to one repository, able to push branches but not merge, expiring when the session ends;
- the database MCP server pointed at a staging snapshot that restores in minutes, with no production role;
- egress limited to the code host and a package proxy; a new dependency not already in the lockfile waits for a human;
- a fresh container and fresh credentials per session ([Bulkhead Isolation](/design-patterns/structural/#bulkhead-isolation)).

In the model only the damage terms change: destructive tool calls now cost a staging restore (\$500–\$10k), and a successful injection or malicious install costs a token rotation and an audit (\$1k–\$30k). The probabilities are left alone, which is conservative: the egress allow-list and the dependency hold would also cut them.

The size of the drop is just the ratio of two illustrative damage ranges, so it is not a finding. The structural point does not depend on it. The hijack rows' probabilities are set by attackers and are poorly measured; the envelope's effect does not need them. It also does not depend on any check catching anything, so correlation between checks cannot erode it. The residual path is the one the envelope still allows. An injected agent can still push attacker-chosen content to a branch, which is how Invariant Labs' GitHub MCP demonstration moved private data into a public pull request ([risk decomposition](/delegation-risk/risk-decomposition/)).

## Pattern 2: protect the tests

Make test and CI files read-only to the agent and route changes to them to a code owner; run held-out tests in CI that the agent never sees; give the agent a tool to flag a task for a human instead of finishing it.

The effect sizes have partial evidence. In ImpossibleBench, hiding tests cut cheating to near zero but also cut legitimate performance; read-only tests stopped test modification but not special-casing or operator overloading. Letting the agent abort to a human cut GPT-5's cheating on the conflicting SWE-bench variant from 54% to 9% and o3's from 49% to 12%, with a much smaller effect for Claude Opus 4.1 ([Zhong et al. 2025](https://arxiv.org/abs/2510.20270)). The model therefore multiplies P(games | stuck) by an illustrative 0.1–1.0, and adds held-out tests as a layer with an illustrative miss rate of 0.3. Under ρ = 1, the stack is worth its best layer, 0.3 instead of the reviewer's 0.5.

The row falls from about \$32k to \$7k a month. As with the envelope, the row is fixed at its source rather than by a better detector: the agent cannot edit what it cannot write, and cannot target tests it cannot see.

## Pattern 3: an AI reviewer, eroded by correlation

Add an LLM code-review bot that reads each diff before the human does. Teams usually add it to catch bugs. Give it an illustrative miss rate of 0.6 on the bugs that reach review, and model the accident stack as CI (miss 0.5), the bot (0.6) and the human (0.6).

For the accident row, the bot's benefit is the ratio of the mixture with and without it:

| ρ (phi scale) | 0 | 0.2 | 0.5 | 1 |
|---|---|---|---|---|
| P(all miss), CI + human | 0.300 | 0.340 | 0.400 | 0.500 |
| P(all miss), CI + bot + human | 0.180 | 0.244 | 0.340 | 0.500 |
| Failed-change row cut by | 40% | 28% | 15% | 0% |

There are two reasons to expect ρ well above zero here. The bot and the CI suite both miss the bugs that need context neither has, such as behavior under production data. And the human now reads the bot's verdict before forming a view, so a bug the bot passed is more likely to pass the human too: automation bias, which makes the human's misses correlate with the bot's ([Human Overseers as a Correlated Layer](/entanglements/cross-domain/psychology-of-oversight/)). If the bot runs on the same model family as the agent, its blind spots are also the agent's. Nobody has published φ for such a stack. The table is the honest output, and the [canonical recipe](/delegation-risk/risk-propagation/#what-ρ-means-and-how-to-estimate-it), seeded bugs run through all three layers, is how to pick a column.

On the other rows the bot does less:

- **Test gaming.** Under ρ = 1 a layer helps only if it beats the best existing one. A diff-only reviewer is roughly an action-only monitor. In Baker et al., a GPT-4o monitor that saw only actions caught 60% of systemic reward hacks, against 95% for one that also read the chain of thought ([2025](https://arxiv.org/abs/2503.11926)); that was OpenAI's training environment, not a PR bot, so take it as an anchor only. A miss of 0.4 beats the reviewer's 0.5 but not the held-out tests' 0.3, so after Pattern 2 it adds nothing.
- **Backdoor.** A reviewer from the agent's own model family is a sibling of the actor and gets no credit ([who preflights the preflight](/delegation-risk/runtime-accounting/#who-preflights-the-preflight)). A [trusted monitor](/design-patterns/monitoring/#trusted-monitor) from elsewhere could earn some. The best monitor in SHADE-Arena separated sabotage from benign transcripts at an AUC of 0.87 ([Kutasov et al. 2025](https://arxiv.org/abs/2506.15740)), which is not yet a miss rate at any particular threshold.
- **Injection and packages.** Nothing. Both happen during the session, before any diff exists.

The bot is the only one of the three patterns that is purely an added detector, so all of its value depends on ρ.

## What survives the illustrative numbers

- **Review covers one path.** PR review, human or AI, sees what the agent proposes to merge. Tool calls, installs and outbound requests happen during the session and never reach it. Three of the six rows (destructive tool calls, injection and malicious packages) run entirely through that unreviewed path. Their controls belong in the harness: the envelope, [pre-tool-use hooks](/delegation-risk/runtime-accounting/#what-exists-and-what-is-new) and egress rules.
- **Patterns that cut damage or remove the opportunity do not depend on ρ.** Patterns that add a detector do, and on adversarial rows they count only when they beat the best existing layer.
- **The one well-measured probability is the one you can measure yourself.** Change fail rate for agent-authored PRs is a query on your deployment history. Within a quarter it replaces the DORA prior for the largest accident row. The other rows need instruments: held-out-test failures for gaming, seeded injections in issues ([Honeypot Injection](/design-patterns/verification/#honeypot-injection)) for hijack exposure, a control evaluation for the backdoor row.
- **Single catastrophic actions need walls, not budgets.** The backdoor row's mean of \$16k a month is a small monthly chance of a merged backdoor (about 1 in 1,500 at the central probability, 1 in 170 at the mean) times a six- to eight-figure loss. An expected-loss budget cannot tell that apart from steady \$16k leakage. The answer is a hard rule: two-person approval and a time lock on authentication, payment and deployment paths ([Escalation Ladder](/design-patterns/structural/#escalation-ladder)).

## Reconciliation

Book each row's prediction in an [exposure ledger](/delegation-risk/runtime-accounting/#3-the-exposure-ledger) and compare monthly. The failed-change row predicts about 30 failures a month at the central rate; a quarter of data checks it. The rare rows cannot be confirmed by waiting. If 3,600 PRs merge in a year with no backdoor found, the rule of three puts a 95% upper bound of about 1 in 1,200 per PR on the post-check rate, far above anything in the range above. Those rows stay judgments and are governed by the envelope and hard rules. Replace each illustrative range with your own as evidence arrives, and measure first whichever input dominates the interval and is cheapest to measure.

For a system where a model also coordinates the work, see the [research assistant example](/design-patterns/examples/research-assistant-example/).
