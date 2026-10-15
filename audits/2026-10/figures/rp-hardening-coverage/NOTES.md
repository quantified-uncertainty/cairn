# rp-hardening-coverage: the threat coverage matrix

**Target page:** apps/reasoning-processes/src/content/docs/concepts/hardening-techniques.md (convert it to .mdx; the slug stays the same).

**Placement:** under "## What each family defends — and the gaps", directly after the threat table and before the paragraph that begins "The standout is **correlated error**." The figure supplements the table and does not replace it: the table keeps the links, such as the one to identity infrastructure.

**What it shows:**
- The 9 threats from the table as rows, against the 6 families as columns. Filled marks are the "primary defending families" the table names. The hollow mark is Independence on correlated error, which the table calls "(weakly)". Blank cells are not primary defenders.
- The columns are grouped by the page's two-axis sort ("Two axes, six families"): Calibration and Verifiability under "cheaper validated bits", Independence under "both", and Invariance, Incentives and Deterrence under "higher corruption cost". Dashed dividers mark the groups.
- The right-hand column holds "Where coverage is thin". The narrow variant shows it as a "thin:" line under each threat.
- A totals row and the axis brackets carry the insight that is computed rather than stated on the page: 15 primary marks in all, 9 of them on the corruption-cost families (Deterrence 4, Incentives 3, Invariance 2), 4 on validated bits and 2 on "both". Correlated error is the only row with no primary mark.
- The accent is used only on the correlated-error row (label, weak mark and gap text), which is the page's "standout".

**Data source:** compute.py transcribes both tables and asserts the counts: column primaries {Cal 2, Ver 2, Ind 2, Inv 2, Inc 3, Det 4}, axis totals {4, 2, 9} of 15, and correlated error as the only threat with no primary defender. The same script generates figure.html (wide SVG 760 px, narrow SVG 360 px, switched by a media query at 560 px) and index.html. There is no JS, and colours are CSS custom properties driven by [data-theme] and prefers-color-scheme.

**Things in the page text the figure exposes or can't encode:**
1. "affordances (read-state)" (Sandbagging) and "externally-grounded families" (Goodhart) are not among the six families. They are shown as a muted "+ ..." line under the threat, not as marks. "Externally-grounded families" is never defined. Which families are meant? Possibly Verifiability and Calibration via resolution. If the author names them, they could become marks.
2. The affordances table says read-state turns up "(all, weakly)" and is **[speculative]**, yet the threat table lists it as a primary defender for sandbagging. That is mildly inconsistent.
3. The table lists only primary defenders ("many threats are addressed weakly by several families"), so blank does not mean zero effect. The caption says this.
4. The counts lean towards the corruption-cost axis, which supports the page's claim that most corruption-resistance is bought on that axis, with Deterrence the most-used family. The page doesn't state the count. The author may want a sentence on it, or may want to check whether the lean is an artefact of which defenders were listed as "primary".
5. "Collusion: thin where shared-training correlation" and "Correlated error" are the same underlying gap. The figure doesn't link them. A sentence in the text could.

**Review (independent recount):** I recounted every mark against the page's threat table. Calibration 2 (prompt-injection, persuasion), Verifiability 2 (persuasion, selection), Independence 2 plus 1 weak (collusion, sandbagging; correlated error weak), Invariance 2 (Sybil, prompt-injection), Incentive-compatibility 3 (persuasion, collusion, resolution gaming), Deterrence 4 (Sybil, resolution gaming, selection, Goodhart). That gives 15 in all, split by axis 4 / 2 / 9, and all of it matches the figure. Two caveats on wording:
- Calibration "primarily buys cheaper *trustworthy* bits (the output self-rates)", and the figure files it under "cheaper validated bits". That is a fair grouping, but the wording is a little looser than the page's.
- The figure says "Verifiability" and "Incentives" where the table says "Verifiability asymmetry" and "Incentive-compatibility". These are the family pages' short names.

Two layout changes in the wide variant: marks now line up with the first line of the threat name, not the middle of the row, and the "cheaper validated bits" axis label is end-anchored so it no longer crowds "both".
