---
title: Review Workflow
description: How CAIRN's audit and revision rounds are run, from read-only audit to integrated, link-checked pull request.
---

The wikis are drafted largely by Claude Code, and the characteristic failures of that process are known: citations that don't exist or don't say what the page claims, invented numbers presented as data, conclusions drawn from those numbers, and terminology that drifts between pages. Improvement therefore happens in rounds that treat model-written content, and model-written reviews of it, as claims to check. A round has five stages.

## 1. Audit

One agent per section reads all or nearly all of it and changes nothing. Its report gives:

- a score;
- findings ranked P0 (broken or wrong), P1 (significant) and P2 (polish), each with its location and quoted evidence;
- a page-by-page triage (keep, rewrite, merge or cut);
- a list of claims it could not check itself.

The audit is a list of leads, not a verdict. Auditors share the drafting model's priors, and in October 2026 they had no web access for most fact checks, so anything they assert is verified again before it is acted on.

## 2. Plan

The reports are merged into one plan. It sets out cross-cutting workstreams, such as citation integrity or the maths, a plan for each site, and the decisions only the owner can make: what a site is for, what happens to cut pages, and how invented quantities are treated. The owner's answers are recorded, together with the rules every editing agent follows, in a brief that each agent reads first. For the October 2026 round these are `audits/2026-10/PLAN.md`, `audits/2026-10/BRIEF.md` and the seven reports beside them. Earlier rounds kept their plans in the app directories, as `REVISION_PLAN.md`, Delegation Risk's `CREDIBILITY_HARDENING_PLAN.md`, and its terminology canon `TERMINOLOGY.md`.

## 3. Edit

Editing agents work in parallel, each on its own file scope. The rules that matter most are:

- **Stay in scope.** Don't touch other agents' files, shared config or git state.
- **Verify, don't trust the audit.** Re-derive maths, with a quick script where it isn't trivial. Check citations against the source: the arXiv API for arXiv IDs, and the web for everything else.
- **Never add a citation you have not checked.** If a claim can't be verified, soften it or mark it `<!-- TODO(verify): … -->`. Don't invent a replacement source.
- **Rewrite shorter.** No summary boxes and no padding.
- **Report deletions.** A deleted or merged page is reported with its slug and the page it should redirect to.

Each agent reports what it changed, how it checked each change, and what it left unresolved.

## 4. Adversarial verification

A second agent, which did not make the change, re-checks it. A citation reviewer re-reads each changed claim against its source. An adversarial reviewer argues against new or rewritten reasoning. In the September 2026 round this caught a paper (Halawi et al. 2024) described backwards in both newer wikis, and a bond formula in a new chapter that overstated what a track record is worth.

## 5. Integrate

One pass then reconciles the parallel edits:

- update each sidebar;
- add a redirect in `astro.config.mjs` for every removed slug;
- rewrite inbound links;
- build every app, which regenerates the `llms.txt` files;
- run `python3 scripts/check-built-links.py`.

A phase is done when everything builds and the link check is clean. The work then goes up as reviewable pull requests, one per phase or one per site, from `claude/…` branches. Vercel builds a preview deployment of every site, not only the ones the pull request touches, and posts the links on it. Nothing reaches the live sites until a pull request is merged to `main`.
