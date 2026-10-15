# Evaluation Engineering homepage: round 3

Round 3 = the round-2 final plus (a) the shared flourish block, (b) one figure, "who pays, and documented failure", and (c) a corrected who-pays sentence. Everything in the round-2 spec below still applies, with the amendments marked **(round 3)**. Accent unchanged.

**Flourish (round 3).** `index.html` §5 is one block, appended to `home.css` and scoped like the rest. `style/CHOSEN.md` did not exist when this was built, so the block is a placeholder using option 1, the same as the Handbook and Delegation Risk round 3: Source Serif 4 600 for h1/h2, h2 1.375rem, page tone `#fbf9f4` light / `#181715` dark. Replace that block with the chosen one; nothing else depends on it. Load the face via `@fontsource-variable/source-serif-4` (or whichever face is chosen).

**Figure (round 3).** Placed straight after the who-pays paragraph, as a `<figure class="fig">` holding two inline SVGs (`fig-wide.svg` from 40em, `fig-narrow.svg` below), pasted into `index.mdx` as raw HTML or wrapped in a tiny `WhoPays.astro`. CSS: the "Figure" block in `index.html` §3 (also add `p { text-wrap: pretty }`). All colours are Starlight tokens, so both themes work; text has a page-colour halo (`paint-order: stroke`) where it crosses gridlines.

- Data: `apps/evaluation-engineering/data/systems.csv`, recomputed by `compute.py` with the exact filters and statistics of `data/analyze.py` (154 systems after dropping payer n/a/unknown; outcome = established failure; 90% Jeffreys intervals; odds ratio = conditional MLE, 3.48 [1.62, 7.80]). The script asserts every count against analyze.py's printed output, so it fails loudly if the CSV changes. Run `python3 compute.py [CSV]`; it rewrites both SVGs and splices them between `FIG:START/END`.
- Content: top group, failure share by main funder (five rows: 34%, 28%, 26%, 21%, 19%, intervals all overlapping); bottom group, by whether the rated party pays anything (no 10/62 = 16%; yes as main funder 12/35 = 34%; yes on the side 15/32 = 47%). Dashed reference line at all 154 = 27%. Counts ("12 of 35") at right.
- Insight: the finer funding story does not separate the systems; any payment from the rated party does, and side payments (ads, licences) are where the main-funder coding hides it. This matches the wiki's own conclusion in Evaluation Systems in the Wild. The main/side split is analyze.py's POST HOC block (main vs side Fisher p = 0.33); the caption does not claim side payments are worse.
- Cost: adds about 330px on desktop and 600px at 375px. If it feels heavy, delete the `<figure>` and the figure CSS; the page reverts to round 2 plus the flourish (keep the corrected sentence).

**Copy (round 3).** The round-2 sentence "those paid by the parties they rate had about 3.5 times the odds" described the binary *pays anything* coding loosely. Paragraph 3 now reads: "Who pays is part of the design. In the wiki's coding of about 160 standing systems, an evaluator's main source of funding says little about whether it failed. What does matter is whether the rated party pays it anything at all, through fees, advertising or logo licences: those systems had about 3.5 times the odds of a documented failure."

---

# Evaluation Engineering homepage: implementation

Mock: `index.html`. (Round 2: two drop-in files, no diagram. Round 3 adds the figure above.)

## 1. Content: `index.mdx` → `apps/evaluation-engineering/src/content/docs/index.mdx`

- Keep `template: splash`.
- Remove `hero`, so Starlight's `PageTitle` renders the h1.
- Body is plain Markdown:
  - five short paragraphs: what it is, the core pattern, who pays, status, and where to start;
  - `## Contents`, with an `### h3` per Part matching the sidebar labels;
  - numbered lists keep the chapter numbers (`5.` renders `<ol start="5">`);
  - the four unnumbered Part II pages are a `-` list straight after the `9.` list;
  - each gloss follows a non-breaking space and an em dash (U+00A0 —), so the dash never starts a line;
  - a `---` rule, the sibling line and the QURI credit.
- Compiles with MDX 3.1.1. All 25 internal links and anchors resolve.

## 2. Style: `home.css` → `apps/evaluation-engineering/src/styles/home.css`

Change `customCss` to `['./src/styles/global.css', './src/styles/home.css']`.

**Site-wide tokens.** These are the family neutrals, identical to the Handbook and RRP. Only the accent changes.

| Token | Dark | Light |
|---|---|---|
| `--sl-color-accent-low` | `#173323` | `#d5ece0` |
| `--sl-color-accent` | `#3f9a68` | `#1f6e46` (links, 6.2:1) |
| `--sl-color-accent-high` | `#7fd2a0` (links, 10.1:1) | `#124a2e` |

**Homepage only.** Same rules as RRP's `home.css`, scoped with `:root:not([data-has-sidebar])`:

- width 39rem;
- line-height 1.6;
- 17px body, h1 2.25rem, h2 1.25rem, h3 1.0625rem;
- grey list markers;
- contents links not underlined;
- after the `hr`, text is 16px `gray-3`;
- Copy-as-Markdown is hidden.

The rules use `:root`, not `html`, so they win over Starlight's unlayered width rule.

## 3. Recommended

Add Measuring an Evaluator, The Capability Ladder and Launch Checklist to the sidebar's Part II, in the homepage order, so the two lists match.
