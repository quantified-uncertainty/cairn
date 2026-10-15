# Reasoning Processes: diagram plan

The owner asked for useful diagrams on the Reasoning Processes wiki: clever SVGs and similar.

The standard: a figure earns its place only if it shows a mechanism the reader would otherwise have to assemble from prose. That means flows, comparisons, where things are traded off, and plotted functions. Decorative concept boxes don't count.

## Implementation conventions

Owner feedback (2026-10-15): readability first, minimal, no ornament. Draw figures with thin lines, label them in plain text at body size, use no decorative fonts or textures, and use the accent at most once per figure. If a sentence does the job, the figure goes. See HOMEPAGE-BRIEF.md.


- **Format.** Each figure is a hand-authored inline-SVG Astro component in `apps/reasoning-processes/src/components/figures/`. Follow the existing `ProcessMap.astro`. No runtime JS, no images, no Mermaid for these.
- **Plotted functions.** Compute the data in the component's frontmatter from the page's own formula, so a figure can't drift from the text.
- **Theme.** Strokes and text use `currentColor` or Starlight CSS variables (`--sl-color-*`), so the figure works in light and dark mode. At most one or two accent hues, and only where colour carries meaning.
- **Markup.** Wrap each figure in `<figure>` with a `<figcaption>` that states the claim. Give the SVG `role="img"` and an `aria-label` containing the same claim.
- **Sizing.** Use a `viewBox` with `max-width: 100%`. Text should be 11–13px at the drawn scale. Labels must stay legible at 375px width; if a wide figure can't manage that, give it a stacked mobile variant.
- **Pages.** A page that gets a figure is converted from `.md` to `.mdx`. The slug stays the same.
- **Arrows.** Label every arrow with what flows along it.

## Candidates (designer agent confirms, cuts or adds against the current text)

| # | Page | Figure | What it shows |
|---|---|---|---|
| 1 | case-studies/the-funding-effect | **LR′(s) curves** | The plotted likelihood-ratio discount LR′(s) = (α+s(1−α))/(β+s(1−β)) against spin rate s, for 2–3 values of (α,β). It falls toward 1 but never crosses it. A second panel shows how selection on H moves the curve below 1, which is the only route to a sign flip. Mark the Lundh-calibrated s≈0.34 point. |
| 2 | concepts/hardening-deterrence | **Deterrence frontier** | The detection-probability × penalty plane, with the gain-indifference hyperbola separating "deterred" from "profitable to cheat". Show how each construction on the page moves a process across it: higher detection, a larger stake, a longer track record. |
| 3 | concepts/hardening-techniques | **Coverage matrix** | The six families against the threats they defend (from "What each family defends — and the gaps"). Cells are full, partial or none; the gaps are visibly empty; the two-axis grouping goes on the margin. |
| 4 | concepts/oversight-protocols | **Grounding router** | The hybrid protocol as a routing flow. A claim goes to resolution if it is resolvable, else coherence checks, else peer prediction, else judge/debate. Each branch is labelled with what grounds truth and the residue that leaks through. |
| 5 | concepts/untrustworthy-sources | **The three-move game** | Defender shrinks the attack surface → deceiver picks one of the three channels a rational verifier leaves open → test. The surface is drawn as channels being closed. Highlight the one channel AI reopens. |
| 6 | concepts/core-model | **Loss pipeline** | Question → process → estimate → decision → loss, with where epistemic weight, cost, and corruption enter, and the "pricing information before it arrives" (value-of-information) branch. |
| 7 | proposals/consistency-evals | **Small multiples of the seven consistency types** | Each type as a tiny glyph of its invariant: negation pair summing to 1, monotone chain, paraphrase equivalence, conditional chain, and so on. Lets the reader scan the taxonomy at a glance. |
| 8 | case-studies/measurement-log (new in Round 2) | **Label-swap design and results** | (a) The 2×2 design: label A/B × first/second position, and the two bias contrasts. (b) A per-model forest plot of position bias and label bias with 95% CIs, built from the committed `results/2026-10-15.json` at build time, with the 5% false-positive baseline marked. |
| 9 | environment/identity-and-track-records | **Reset attack vs staked identity** | Two timelines. In one an agent sheds a bad record by spinning up a new identity; in the other a stake or costly history makes reset expensive. The enforceable penalty is shown as the gap between them. |
| 10 | proposals/epistemic-impact-analysis | **The two-loop paradigm** | The inner estimation loop and the outer evaluation/feedback loop, with the arrows that close each. |
| 11 | concepts/process-catalogue (ProcessMap) | **Review and upgrade the existing map** | Check label collisions on mobile. Consider showing the hardening move as arrows, i.e. where a process moves when a family is applied. |

Kelly growth curve (hardening-incentives): add it only if the page's argument actually turns on the curve's shape.

## Process

1. A designer pass checks each candidate against the current text after Round 2 and writes a figure spec.
2. Each figure gets a builder agent. Builders own disjoint pages and component files.
3. A visual reviewer renders every page with Playwright at desktop and 375px width, in light and dark, and inspects the screenshots for collisions, illegible text, wrong data and colour problems. It then fixes them.
4. The final step is a build plus the link check.
