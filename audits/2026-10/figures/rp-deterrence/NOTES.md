# rp-deterrence: the deterrence frontier

**Target:** apps/reasoning-processes/src/content/docs/concepts/hardening-deterrence.md (convert to .mdx).
**Placement:** under "## Worked bounds", directly after the "inspection-game frontier" paragraph that ends "...and the cheapest attack is to keep each stake below $S^*$." It goes before the "Provenance bonds and the funding effect" paragraph.

**What it shows:** the (audit rate p, enforceable penalty B) plane with safe-stake contours S* = $1, $53 (accent) and $1,000. The page's lottery point (p 5%, B $1,000) sits on the $53 contour. A downward arrow shows a re-key after forfeit (B goes to 0, giving the newcomer case S* ≈ 1¢ from identity-and-track-records). A rightward arrow shows the audit rate needed to restore $53 with no bond: p = 99.98%. The tinted region is where a $53 attack pays. The axis subtitles carry the mechanism: p is paid on every run, B only if caught.

**Data source:** compute.py, which uses the page's formula S* = (c+pB)/(1-p) with c = $0.01, p = 5%, B = $1,000. It asserts S* = 52.64, p(B=0) = 0.99981 and the newcomer S* = 1.05¢. It also generates the SVGs, figure.html and index.html.
Axes: x is log10 of the odds p/(1-p), labelled in %; y is log10(B + c), so the bottom edge is B = 0. Using the exact identity S* = c + (B + c)·p/(1-p) makes every contour a straight line with no approximation. A consequence the page could state: the bond multiplies the leverage of the audit odds by (B+c)/c ≈ 100,000, which is exactly the odds ratio between 5% and 99.98%.

**Disagreements with page text:**
1. Construction row 1 and the end of the worked-bound paragraph say the "cheapest attack is to keep each stake below S*". Under the page's own payoff, stakes *below* S* are the deterred ones; an attack pays only *above* S*. The likely intended meaning is that the defence must cap per-claim stakes at S*, so attacks with larger stakes are where it fails, or that the bond is forfeited once across many small attacks. The author should check and reword.
2. "≈ $53": the exact value is $52.64. Rounding is fine, but "about $53" is the precise phrasing (the page uses it once).
3. Not shown, because the page gives no numbers: the judgment-proof cap on B, the "no one audits" case (p = 0), and the Merkle-log, clawback and provenance constructions. Adding them would mean inventing values.

**Implementation:** figure.html contains a wide SVG (760×470) and a narrow SVG (360×470); a CSS media query at 560px switches between them. Colours are CSS custom properties that follow [data-theme] and prefers-color-scheme. There is no JS. The accent is used only on the $53 contour, its two points and its labels.

## Review (2026-10-15)

**Independent recomputation:**
- S*(5%, $1,000) = 50.01/0.95 = $52.64.
- B = 0 at the same S*: 1 − p = c/S* = 0.00019, so p = 99.981%.
- Newcomer: 0.01/0.95 = 1.05¢, which matches identity-and-track-records ("about one cent").
- Identity: c/(1−p) = c + c·p/(1−p), so S* = c + (B+c)·p/(1−p) exactly.
- Odds ratio between the two points: (S*−c)/c ÷ (S*−c)/(B+c) = (B+c)/c = 100,001.
- The tint (below and left of the $53 line) is the set where S* < $53, which is where a $53 attack pays. All correct.

**Fixes:**
- Contour lines no longer cut through labels. Each crossing label now sits on a knockout box (bg colour, plus the tint inside the pays region). This affects the lottery label versus the $1,000 contour, "Re-key…" versus the $1 contour, "Restore $53…" versus the $1 contour, and "p = 99.98%" versus the $1,000 contour.
- On mobile, "p 5%, B $1,000" and "B → 0" got the same treatment.
- "A $53 attack pays" no longer touches the re-key arrow.
- The five-decade leverage is now on the figure ("audit odds × 100,000" at the 99.98% point), not only in NOTES.
- The caption's leverage sentence is reworded.
- The knockout widths come from a character-width estimate in compute.py `text_w`. If a production font is much wider, re-check.

Disagreement 1 above (the "keep each stake below S*" cheapest attack) stands and is the most important thing for the page author to fix. Identity-and-track-records.md line 92 repeats it ("keep each attack's stake below S*").
