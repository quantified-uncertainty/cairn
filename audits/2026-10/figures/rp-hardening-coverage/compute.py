"""rp-hardening-coverage: threat x family coverage matrix.

Data transcribed from apps/reasoning-processes/src/content/docs/concepts/hardening-techniques.md,
sections "Two axes, six families" (axis grouping) and "What each family defends — and the gaps"
(threat table). Generates figure.html and index.html.
Run: python3 compute.py
"""
from html import escape
import os

HERE = os.path.dirname(os.path.abspath(__file__))

# Families in page order, with the axis each "primarily buys" (page table, Two axes section).
FAMS = ["Calibration", "Verifiability", "Independence", "Invariance", "Incentives", "Deterrence"]
SHORT = {"Calibration": "Cal", "Verifiability": "Ver", "Independence": "Ind",
         "Invariance": "Inv", "Incentives": "Inc", "Deterrence": "Det"}
AXIS = {"Calibration": "bits", "Verifiability": "bits", "Independence": "both",
        "Invariance": "cost", "Incentives": "cost", "Deterrence": "cost"}
GROUPS = [("bits", "cheaper validated bits"), ("both", "both"), ("cost", "higher corruption cost")]

# Threat table. marks: P = primary defender, W = listed as weak.
# also = non-family defender named in the table; thin = "Where coverage is thin" ("" for —).
THREATS = [
    dict(name="Sybil / identity forgery", P=["Deterrence", "Invariance"], W=[], also="",
         thin="needs identity infrastructure to bind bonds"),
    dict(name="Prompt-injection / framing", P=["Invariance", "Calibration"], W=[], also="", thin=""),
    dict(name="Persuasion / sycophancy", P=["Incentives", "Verifiability", "Calibration"], W=[], also="",
         thin="claims that never resolve"),
    dict(name="Collusion", P=["Independence", "Incentives"], W=[], also="",
         thin="shared-training correlation"),
    dict(name="Sandbagging / capability-hiding", P=["Independence"], W=[], also="+ read-state affordance",
         thin="interpretability is unreliable"),
    dict(name="Resolution-criteria gaming", P=["Deterrence", "Incentives"], W=[], also="",
         thin="who defines the criteria"),
    dict(name="Selection / optional-stopping", P=["Verifiability", "Deterrence"], W=[], also="", thin=""),
    dict(name="Correlated error", P=[], W=["Independence"], also="",
         thin="no clean AI-specific defense yet", accent=True),
    dict(name="Goodhart-after-publication", P=["Deterrence"], W=[], also="+ externally-grounded families",
         thin="style-mimicry of high-tier forms"),
]

# ---- computation --------------------------------------------------------------------------
col_P = {f: sum(f in t["P"] for t in THREATS) for f in FAMS}
col_W = {f: sum(f in t["W"] for t in THREATS) for f in FAMS}
grp_P = {g: sum(col_P[f] for f in FAMS if AXIS[f] == g) for g, _ in GROUPS}
total_P = sum(col_P.values())
no_primary = [t["name"] for t in THREATS if not t["P"]]
assert total_P == 15, total_P
assert col_P == {"Calibration": 2, "Verifiability": 2, "Independence": 2, "Invariance": 2,
                 "Incentives": 3, "Deterrence": 4}, col_P
assert grp_P == {"bits": 4, "both": 2, "cost": 9}, grp_P
assert no_primary == ["Correlated error"]
print("column primaries:", col_P, "weak:", {k: v for k, v in col_W.items() if v})
print("axis totals:", grp_P, "of", total_P)
print("threats with no primary defender:", no_primary)

# ---- layout helpers -----------------------------------------------------------------------
def wrap(text, px, fs, k=0.5):
    maxc = max(4, int(px / (fs * k)))
    words, lines, cur = text.split(), [], ""
    for w in words:
        if cur and len(cur) + 1 + len(w) > maxc:
            lines.append(cur); cur = w
        else:
            cur = (cur + " " + w).strip()
    if cur: lines.append(cur)
    return lines

def t(x, y, s, cls="lab", anchor="start", extra=""):
    return f'<text class="{cls}" x="{x:.1f}" y="{y:.1f}" text-anchor="{anchor}"{extra}>{escape(s)}</text>'

def mark(cx, cy, kind, accent, r):
    if kind == "P":
        return f'<circle class="m-full" cx="{cx:.1f}" cy="{cy:.1f}" r="{r}"/>'
    cls = "m-weak accent-stroke" if accent else "m-weak"
    return f'<circle class="{cls}" cx="{cx:.1f}" cy="{cy:.1f}" r="{r - 0.75}"/>'

ARIA = ("Matrix of nine threats against the six hardening families. Filled marks are primary defenders, "
        f"{total_P} in all; {grp_P['cost']} of them fall on the three families that raise corruption cost, "
        f"{col_P['Deterrence']} on Deterrence alone. Correlated error is the only threat with no primary "
        "defender: Independence covers it only weakly, and no clean AI-specific defense exists yet.")

# ---- wide variant -------------------------------------------------------------------------
def wide():
    W = 760
    X_T, W_T = 0, 196          # threat column
    X0, CW = 204, 62           # family columns
    X_G = X0 + 6 * CW + 26     # thin-coverage column
    W_G = W - X_G
    LH = 18
    out = []
    # staggered headers
    hy = [24, 46]
    head_bottom = 60
    for i, f in enumerate(FAMS):
        cx = X0 + CW * (i + 0.5)
        y = hy[i % 2]
        out.append(t(cx, y, f, "lab", "middle"))
        out.append(f'<line class="hair" x1="{cx:.1f}" y1="{y + 6:.1f}" x2="{cx:.1f}" y2="{head_bottom + 4}"/>')
    out.append(t(X_T, 46, "Threat", "lab strong"))
    out.append(t(X_G, 46, "Where coverage is thin", "lab strong"))
    y = head_bottom + 8
    out.append(f'<line class="rule" x1="0" y1="{y}" x2="{W}" y2="{y}"/>')
    rows_top = y
    for th in THREATS:
        acc = th.get("accent")
        nl = wrap(th["name"], W_T, 14)
        al = wrap(th["also"], W_T, 13) if th["also"] else []
        gl = wrap(th["thin"], W_G, 13) if th["thin"] else ["—"]
        n = max(len(nl) + len(al), len(gl))
        h = n * LH + 16
        ty = y + 8 + 13
        for j, s in enumerate(nl):
            out.append(t(X_T, ty + j * LH, s, "lab strong accent-text" if acc else "lab"))
        for j, s in enumerate(al):
            out.append(t(X_T, ty + (len(nl) + j) * LH, s, "small muted"))
        for j, s in enumerate(gl):
            out.append(t(X_G, ty + j * LH, s, "small accent-text" if acc else "small muted"))
        cy = ty - 4.5 + (len(nl) - 1) * LH / 2  # align marks with the threat name, not the row middle
        for i, f in enumerate(FAMS):
            cx = X0 + CW * (i + 0.5)
            if f in th["P"]: out.append(mark(cx, cy, "P", acc, 6.5))
            elif f in th["W"]: out.append(mark(cx, cy, "W", acc, 6.5))
        y += h
        out.append(f'<line class="hair" x1="0" y1="{y:.1f}" x2="{W}" y2="{y:.1f}"/>')
    rows_bot = y
    # axis dividers between groups
    for i in (2, 3):
        x = X0 + CW * i
        out.append(f'<line class="divider" x1="{x}" y1="{rows_top}" x2="{x}" y2="{rows_bot + 30}"/>')
    # column totals
    y += 22
    out.append(t(X_T, y, "Primary marks", "small muted"))
    for i, f in enumerate(FAMS):
        cx = X0 + CW * (i + 0.5)
        s = str(col_P[f]) + (f" + {col_W[f]} weak" if col_W[f] else "")
        out.append(t(cx, y, str(col_P[f]), "lab", "middle"))
        if col_W[f]:
            out.append(t(cx, y + 16, f"+{col_W[f]} weak", "small muted", "middle"))
    # axis brackets
    y += 32
    by = y
    i0 = 0
    for g, label in GROUPS:
        k = sum(AXIS[f] == g for f in FAMS)
        xa, xb = X0 + CW * i0 + 4, X0 + CW * (i0 + k) - 4
        out.append(f'<path class="bracket" d="M{xa:.1f} {by - 6} V{by} H{xb:.1f} V{by - 6}"/>')
        # the long "bits" label is end-anchored at its bracket so it clears the narrow "both" label
        lx, la = (xb, "end") if g == "bits" else ((xa + xb) / 2, "middle")
        out.append(t(lx, by + 20, label, "small", la))
        out.append(t(lx, by + 38, f"{grp_P[g]} of {total_P}", "small muted", la))
        i0 += k
    out.append(t(X_T, by + 20, "Axis it mainly buys", "small muted"))
    # legend in thin column, aligned with totals
    ly = rows_bot + 22
    out.append(f'<circle class="m-full" cx="{X_G + 6}" cy="{ly - 4.5}" r="6"/>')
    out.append(t(X_G + 18, ly, "primary defender", "small muted"))
    out.append(f'<circle class="m-weak" cx="{X_G + 6}" cy="{ly + 18 - 4.5}" r="5.25"/>')
    out.append(t(X_G + 18, ly + 18, "named as weak only", "small muted"))
    out.append(t(X_G, ly + 36, "blank: not primary", "small muted"))
    H = by + 48
    return W, H, out

# ---- narrow variant -----------------------------------------------------------------------
def narrow():
    W = 360
    X_T, W_T = 0, 148
    X0, CW = 160, 33
    LH = 17
    out = []
    head_h = 104
    for i, f in enumerate(FAMS):
        cx = X0 + CW * (i + 0.5)
        out.append(f'<text class="lab" transform="translate({cx + 5:.1f} {head_h - 6}) rotate(-90)">{escape(f)}</text>')
    out.append(t(X_T, head_h - 6, "Threat", "lab strong"))
    y = head_h
    out.append(f'<line class="rule" x1="0" y1="{y}" x2="{W}" y2="{y}"/>')
    rows_top = y
    for th in THREATS:
        acc = th.get("accent")
        nl = wrap(th["name"], W_T, 14)
        al = wrap(th["also"], W_T, 13) if th["also"] else []
        gl = wrap("thin: " + th["thin"], W_T, 13) if th["thin"] else []
        lines = [(s, "lab strong accent-text" if acc else "lab") for s in nl] + \
                [(s, "small muted") for s in al] + \
                [(s, "small accent-text" if acc else "small muted") for s in gl]
        h = len(lines) * LH + 14
        ty = y + 7 + 13
        for j, (s, c) in enumerate(lines):
            out.append(t(X_T, ty + j * LH, s, c))
        cy = y + 7 + 13 - 4.5 + (len(nl) - 1) * LH / 2  # align marks with the threat name
        for i, f in enumerate(FAMS):
            cx = X0 + CW * (i + 0.5)
            if f in th["P"]: out.append(mark(cx, cy, "P", acc, 6))
            elif f in th["W"]: out.append(mark(cx, cy, "W", acc, 6))
        y += h
        out.append(f'<line class="hair" x1="0" y1="{y:.1f}" x2="{W}" y2="{y:.1f}"/>')
    rows_bot = y
    for i in (2, 3):
        x = X0 + CW * i
        out.append(f'<line class="divider" x1="{x}" y1="{rows_top}" x2="{x}" y2="{rows_bot + 28}"/>')
    y += 21
    out.append(t(X0 - 8, y, "Primary marks", "small muted", "end"))
    for i, f in enumerate(FAMS):
        cx = X0 + CW * (i + 0.5)
        out.append(t(cx, y, str(col_P[f]) + ("+" if col_W[f] else ""), "lab", "middle"))
    # staircase axis labels, right-anchored at each bracket's right end
    by = y + 20
    i0 = 0
    for n, (g, label) in enumerate(GROUPS):
        k = sum(AXIS[f] == g for f in FAMS)
        xa, xb = X0 + CW * i0 + 3, X0 + CW * (i0 + k) - 3
        out.append(f'<path class="bracket" d="M{xa:.1f} {by - 6} V{by} H{xb:.1f} V{by - 6}"/>')
        ly = by + 20 + n * 20
        out.append(f'<line class="hair" x1="{xb:.1f}" y1="{by:.1f}" x2="{xb:.1f}" y2="{ly - 13:.1f}"/>')
        out.append(t(xb, ly, f"{label}: {grp_P[g]} of {total_P}", "small", "end"))
        i0 += k
    ly = by + 20 + 3 * 20 + 10
    out.append(f'<circle class="m-full" cx="6" cy="{ly - 4.5}" r="6"/>')
    out.append(t(18, ly, "primary", "small muted"))
    out.append(f'<circle class="m-weak" cx="88" cy="{ly - 4.5}" r="5.25"/>')
    out.append(t(100, ly, "weak only (+ in totals)", "small muted"))
    H = ly + 10
    return W, H, out

def svg(cls, wh_out):
    W, H, out = wh_out
    return (f'<svg class="{cls}" viewBox="0 0 {W} {H:.0f}" role="img" aria-label="{escape(ARIA)}">'
            + "".join(out) + "</svg>")

CAPTION = (f"Coverage leans on the corruption-cost axis: {grp_P['cost']} of the {total_P} primary marks belong to "
           f"Invariance, Incentives and Deterrence, {col_P['Deterrence']} to Deterrence alone. Correlated error is the one "
           "threat with no primary defender; Independence, the family meant to supply decorrelation, is named only "
           "weakly. Blank cells mean &ldquo;not a primary defender&rdquo;, not &ldquo;no effect&rdquo;: the page notes that many "
           "threats are addressed weakly by several families.")

STYLE = """<style>
.hcov-fig{margin:1.5rem 0;
 --hc-text:#2e2c28;--hc-muted:#5f5b53;--hc-line:#8f897e;--hc-hair:#d6d1c7;--hc-bg:#ffffff;--hc-accent:#2a57a6}
:root[data-theme="dark"] .hcov-fig{--hc-text:#dcd7cd;--hc-muted:#a7a195;--hc-line:#8f897e;--hc-hair:#45423c;--hc-bg:#161514;--hc-accent:#9dbdf2}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]) .hcov-fig{--hc-text:#dcd7cd;--hc-muted:#a7a195;--hc-line:#8f897e;--hc-hair:#45423c;--hc-bg:#161514;--hc-accent:#9dbdf2}}
.hcov-fig svg{display:block;width:100%;height:auto;font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif}
.hcov-fig .hc-narrow{display:none}
@media (max-width:560px){.hcov-fig .hc-wide{display:none}.hcov-fig .hc-narrow{display:block}}
.hcov-fig .lab{fill:var(--hc-text);font-size:14px}
.hcov-fig .small{fill:var(--hc-text);font-size:13px}
.hcov-fig .strong{font-weight:600}
.hcov-fig .muted{fill:var(--hc-muted)}
.hcov-fig .accent-text{fill:var(--hc-accent)}
.hcov-fig .rule{stroke:var(--hc-line);stroke-width:1}
.hcov-fig .hair{stroke:var(--hc-hair);stroke-width:1}
.hcov-fig .divider{stroke:var(--hc-line);stroke-width:1;stroke-dasharray:2 3}
.hcov-fig .bracket{fill:none;stroke:var(--hc-line);stroke-width:1}
.hcov-fig .m-full{fill:var(--hc-text)}
.hcov-fig .m-weak{fill:none;stroke:var(--hc-text);stroke-width:1.5}
.hcov-fig .m-weak.accent-stroke{stroke:var(--hc-accent);stroke-width:2}
.hcov-fig figcaption{font-size:.95rem;line-height:1.55;color:var(--hc-muted);margin-top:.6rem}
</style>"""

FIGURE = (STYLE + '\n<figure class="hcov-fig">\n' + svg("hc-wide", wide()) + "\n" + svg("hc-narrow", narrow())
          + f"\n<figcaption>{CAPTION}</figcaption>\n</figure>\n")

with open(os.path.join(HERE, "figure.html"), "w") as fh:
    fh.write(FIGURE)

PAGE = f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Hardening Coverage Matrix</title>
<style>
:root{{--t:#2e2c28;--m:#5f5b53;--bg:#ffffff;--a:#2a57a6}}
:root[data-theme="dark"]{{--t:#dcd7cd;--m:#a7a195;--bg:#161514;--a:#9dbdf2}}
@media (prefers-color-scheme: dark){{:root:not([data-theme="light"]){{--t:#dcd7cd;--m:#a7a195;--bg:#161514;--a:#9dbdf2}}}}
body{{margin:0;background:var(--bg);color:var(--t);font:17px/1.6 ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}}
main{{max-width:46rem;margin:0 auto;padding:2rem 16px 3rem}}
h1{{font-size:1.15rem;font-weight:600;margin:0 0 1rem;color:var(--m)}}
p{{margin:0 0 1rem}} a{{color:var(--a)}}
</style></head><body><main>
<h1>Hardening: Overview &middot; What each family defends &mdash; and the gaps</h1>
<p>Sorting the families by the <em>threats</em> they close shows both the coverage and, more usefully, where there is none. (Primary defenders listed; many threats are addressed weakly by several families.)</p>
{FIGURE}
<p>The standout is <strong>correlated error</strong>. Every aggregation, ensemble and panel defense assumes independence, and shared training pipelines erode it. Engineering has met this before, in N-version programming (Knight &amp; Leveson 1986), and prices it with common-cause models such as the beta factor (Independence has the details). Those models measure correlation; they do not remove it. No family here removes it for AI reasoners, which makes this row a research priority.</p>
</main></body></html>
"""
with open(os.path.join(HERE, "index.html"), "w") as fh:
    fh.write(PAGE)
print("wrote figure.html, index.html")
