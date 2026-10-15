# Brief for the October 2026 improvement round

Every agent working on this round reads this file first. `PLAN.md` holds the full plan. The sibling `*.md` audit reports hold the findings, with quoted evidence.

## Owner decisions (2026-10-15)

- **D1. Delegation Risk: contract hard.** Cut the site from ~297k words to a core of about 80–120k, and fix that core rigorously.
  - Keep the defensible spine: risk = Σ P×D, risk propagation, runtime accounting, the entanglement tax and its beta-factor math, and the scheming/control evidence.
  - Keep about 15–20 AI-specific patterns.
  - Cut or merge everything else.
- **D2. Cut content is deleted.** No archive. Every deleted or merged slug gets a redirect in `astro.config.mjs` to the closest surviving page. Git keeps the history.
- **D3. Invented numbers.** A quantity that comes from neither a source nor a stated derivation follows these rules:
  - It must be visibly labelled *illustrative*.
  - No conclusion may be drawn from it. In particular, no "X is safest/best" ranking may rest on it.
  - Headline numbers that the thesis depends on get a range or distribution plus a source or elicitation note.
  - Otherwise, remove the invented quantity.
- **D4. Reasoning Processes is a research exploration.** It is exploratory and brainstorm-heavy, not definitive. Frame it as "a research exploration / working notes toward …", never as "a textbook for a new field". Its confidence language should match that framing.
- **D5. Experiments approved:**
  - Fix and run the label-swap harness on about 5 current models.
  - Publish the results, including null results.
  - Run the RoastMyPost-flag and Squiggle AI calibration checks if feasible.
- **D6. Meta becomes the "CAIRN Handbook".**
  - Cut or move the content that describes the removed `apps/longterm`.
  - The homepage becomes a hub for the three wikis.
  - Write the docs so they are true of this repo.
- **D7. Upgrade the stack:** Astro 7, Starlight 0.42-ish, Node 22. Delete `@cairn/ui` and Tailwind if they are unused. This is done in a later phase.

## Rules for every editing agent

1. **Stay in your assigned file scope.** Other agents edit other files at the same time.
   - Never run `git` commands that change state (commit, stash, checkout, reset, restore). `git diff` and `git log` are fine.
   - Never edit `astro.config.mjs` unless your task says so.
   - Never run `pnpm build` unless your task says so.
2. **Verify, don't trust the audit.** The audit reports were written by models and may be wrong. Before changing a claim:
   - **Math:** re-derive it, and use Python or a Monte Carlo check when it isn't trivial.
   - **Citations:** check them against the source:
     - For arXiv, call `curl -s "http://export.arxiv.org/api/query?id_list=<ID>"`.
     - For anything else, use WebSearch or WebFetch, loaded via ToolSearch.
   - If you can't verify a claim, don't invent a replacement. Soften it, or mark it `<!-- TODO(verify): ... -->` and report it.
3. **Never introduce a new citation you have not verified exists and says what you claim.** This is the failure mode that produced most of the P0s.
4. **Prose standard:** precise, matter-of-fact, LessWrong/Gwern register.
   - Don't add TL;DR, "Key Insight" or "Key Takeaways" boxes, bold-everything, emoji, or listicle padding.
   - When you rewrite a passage, write it shorter than it was.
5. **Canonical delegation-risk terminology** is in `apps/delegation-risk/TERMINOLOGY.md`. RACAP, harmonic propagation and "discounted" propagation are retired.
6. **Internal links:** when you delete or merge a page, return its slug and its redirect target. The integration step updates the sidebar, adds the redirects and rewrites inbound links.
7. **Report honestly.** List what you changed, what you checked and how, and what you left unresolved.
