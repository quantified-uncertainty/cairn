#!/usr/bin/env python3
"""rp-deterrence: the inspection-game frontier on the (audit rate, bond) plane.

Source: apps/reasoning-processes/src/content/docs/concepts/hardening-deterrence.md
  (Worked bounds) and environment/identity-and-track-records.md (newcomer case).

Page formula:  attack payoff (1-p)S - pB - c < 0  iff  S < S* = (c + pB)/(1-p).
Exact rewrite: S* = c + (B + c) * p/(1-p)   [c/(1-p) = c + c*p/(1-p)]
So with x = log10(odds p/(1-p)) and y = log10(B + c), every iso-S* contour is the
straight line y = log10(S* - c) - x.  That is why the axes are odds and B + c:
nothing is approximated.

Page numbers: c = $0.01 (LLM-judge call), p = 5%, B = $1,000 -> S* ~ $53;
B = 0 -> same S* needs p ~ 99.98%;  newcomer (B = 0, p = 5%) -> S* ~ 1 cent.

Run: python3 compute.py   -> writes svg-wide.svg, svg-narrow.svg, figure.html, index.html
"""
import math, os, html

HERE = os.path.dirname(os.path.abspath(__file__))
c = 0.01

def s_star(p, B):
    return (c + p * B) / (1 - p)

def p_for(S, B):
    """audit rate giving safe stake S with bond B (solve S = c + (B+c) o)."""
    o = (S - c) / (B + c)
    return o / (1 + o)

# ---- the page's worked values, recomputed ----
P_LOT, B_LOT = 0.05, 1000.0
S_LOT = s_star(P_LOT, B_LOT)            # 52.64
P_NOBOND = p_for(S_LOT, 0.0)            # 0.99981
S_NEWCOMER = s_star(P_LOT, 0.0)         # 0.0105
assert abs(S_LOT - 52.642) < 0.01, S_LOT
assert abs(P_NOBOND - 0.99981) < 1e-5, P_NOBOND
assert abs(S_NEWCOMER - 0.010526) < 1e-5
# the bond multiplies the leverage of each unit of audit odds by (B+c)/c
LEVERAGE = (B_LOT + c) / c              # 100,001
ODDS_RATIO = (P_NOBOND / (1 - P_NOBOND)) / (P_LOT / (1 - P_LOT))
assert abs(ODDS_RATIO / LEVERAGE - 1) < 1e-9

lo = lambda p: math.log10(p / (1 - p))
ly = lambda B: math.log10(B + c)

X0, X1 = -3.0, 5.0       # audit odds 1e-3 .. 1e5  (p 0.1% .. 99.999%)
Y0, Y1 = ly(0), ly(100000)  # B = 0 .. $100k   (B + c = 1e-2 .. 1e5)

CONTOURS = [1.0, S_LOT, 1000.0]   # safe-stake contours; S_LOT is the accent one

def fmt_money(v):
    if v >= 1000: return f"${v:,.0f}"
    if v >= 1: return f"${v:.0f}"
    return f"{v*100:.0f}¢"

def text_w(t, size=14):
    """Conservative width estimate for system sans at `size` px (used only for knockout boxes)."""
    narrow = set("iljtf.,:;!|()1 ")
    wide = set("mwMW%$")
    w = 0.0
    for ch in t:
        w += 0.32 if ch in narrow else 0.80 if ch in wide else 0.60
    return w * size

def build(L):
    W, H = L["W"], L["H"]
    PL, PR, PT, PB = L["PL"], L["PR"], L["PT"], L["PB"]
    X = lambda x: PL + (x - X0) / (X1 - X0) * (PR - PL)
    Y = lambda y: PB - (y - Y0) / (Y1 - Y0) * (PB - PT)
    f = lambda v: f"{v:.1f}"
    o = []
    a = o.append
    # gridlines + ticks
    for p, lab in L["xticks"]:
        x = X(lo(p))
        a(f'<line class="grid" x1="{f(x)}" y1="{PT}" x2="{f(x)}" y2="{PB}"/>')
        a(f'<text class="tick" x="{f(x)}" y="{PB + L["tick_dy"]}" text-anchor="middle">{lab}</text>')
    for B, lab in L["yticks"]:
        y = Y(ly(B))
        if B > 0:
            a(f'<line class="grid" x1="{PL}" y1="{f(y)}" x2="{PR}" y2="{f(y)}"/>')
        a(f'<text class="tick" x="{PL - 8}" y="{f(y + 4.5)}" text-anchor="end">{lab}</text>')
    # frame: left axis + bottom (B = 0 floor)
    a(f'<line class="axis" x1="{PL}" y1="{PT}" x2="{PL}" y2="{PB}"/>')
    a(f'<line class="axis" x1="{PL}" y1="{PB}" x2="{PR}" y2="{PB}"/>')
    # axis titles
    for i, line in enumerate(L["xtitle"]):
        cls = "lab" if i == 0 else "lab muted"
        a(f'<text class="{cls}" x="{f((PL + PR) / 2)}" y="{PB + L["xtitle_dy"] + 19 * i}" text-anchor="middle">{line}</text>')
    yt = L["ytitle"]
    a(f'<text class="lab" transform="translate({L["ytitle_x"]} {f((PT + PB) / 2)}) rotate(-90)" text-anchor="middle">{yt[0]}</text>')
    if len(yt) > 1:
        a(f'<text class="lab muted" transform="translate({L["ytitle_x"] + 19} {f((PT + PB) / 2)}) rotate(-90)" text-anchor="middle">{yt[1]}</text>')

    # clip for contours
    a(f'<clipPath id="{L["id"]}-clip"><rect x="{PL}" y="{PT}" width="{PR - PL}" height="{PB - PT}"/></clipPath>')
    # region tint: where a $53 attack pays (below-left of the accent contour)
    k = math.log10(S_LOT - c)
    pts = []
    # polygon: left edge bottom -> along contour -> bottom
    xa = max(X0, k - Y1)  # where contour enters (top or left)
    ya = k - xa
    pts = [(X(X0), Y(Y0)), (X(X0), Y(min(Y1, k - X0))), ]
    if k - X0 > Y1:
        pts.append((X(k - Y1), Y(Y1)))
    pts.append((X(k - Y0), Y(Y0)))
    a('<polygon class="pays" points="' + " ".join(f"{f(px)},{f(py)}" for px, py in pts) + f'" clip-path="url(#{L["id"]}-clip)"/>')
    for S in CONTOURS:
        k = math.log10(S - c)
        cls = "contour accent" if S == S_LOT else "contour"
        a(f'<line class="{cls}" x1="{f(X(X0))}" y1="{f(Y(k - X0))}" x2="{f(X(k - Y0))}" y2="{f(Y(Y0))}" clip-path="url(#{L["id"]}-clip)"/>')
    # contour labels, rotated along the line
    ang = math.degrees(math.atan2((PB - PT) / (Y1 - Y0), (PR - PL) / (X1 - X0)))
    for S, xpos, txt, cls in L["clabels"]:
        k = math.log10(S - c)
        x, y = X(xpos), Y(k - xpos)
        a(f'<text class="{cls} halo" transform="translate({f(x)} {f(y)}) rotate({ang:.2f})" text-anchor="middle" dy="-6">{txt}</text>')

    # label knockouts: a contour or gridline that would run through a label stops at a
    # bg-coloured box (plus the tint where the label sits inside the tinted region).
    xL, yL = X(lo(P_LOT)), Y(ly(B_LOT))
    xN, yN = X(lo(P_LOT)), Y(ly(0))
    xV, yV = X(lo(P_NOBOND)), Y(ly(0))
    anchors = {"L": (xL, yL), "N": (xN, yN), "V": (xV, yV), "P": (PL, PT), "R": (PR, PB)}
    for note in L["notes"]:
        ref, dx, dy, anchor, lines = note[:5]
        ko = note[5] if len(note) > 5 else None
        if not ko:
            continue
        bx, by = anchors[ref]
        w = max(text_w(t) for _, t in lines)
        x0 = bx + dx - {"start": 0, "middle": w / 2, "end": w}[anchor] - 4
        y0 = by + dy - 14
        h = 18 * len(lines) + 2
        a(f'<rect class="ko" x="{f(x0)}" y="{f(y0)}" width="{f(w + 8)}" height="{h}"/>')
        if ko == "tint":
            a(f'<rect class="pays" x="{f(x0)}" y="{f(y0)}" width="{f(w + 8)}" height="{h}"/>')

    # arrows (moves)
    r = 5
    a(f'<line class="move" x1="{f(xL)}" y1="{f(yL + r + 3)}" x2="{f(xN)}" y2="{f(yN - r - 5)}" marker-end="url(#{L["id"]}-ah)"/>')
    ry = yN - L["rail_lift"]
    a(f'<line class="move" x1="{f(xN + r + 4)}" y1="{f(ry)}" x2="{f(xV - r - 6)}" y2="{f(ry)}" marker-end="url(#{L["id"]}-ah)"/>')
    # points
    a(f'<circle class="pt accent-fill" cx="{f(xL)}" cy="{f(yL)}" r="{r}"/>')
    a(f'<circle class="pt hollow" cx="{f(xN)}" cy="{f(yN)}" r="{r}"/>')
    a(f'<circle class="pt accent-fill" cx="{f(xV)}" cy="{f(yV)}" r="{r}"/>')
    # free text annotations (positions relative to points)
    for ref, dx, dy, anchor, lines, *_ in L["notes"]:
        bx, by = anchors[ref]
        for i, (cls, t) in enumerate(lines):
            a(f'<text class="{cls} halo" x="{f(bx + dx)}" y="{f(by + dy + 18 * i)}" text-anchor="{anchor}">{t}</text>')

    defs = (f'<defs><marker id="{L["id"]}-ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">'
            f'<path d="M1 1.5 L9 5 L1 8.5" class="ahead"/></marker></defs>')
    return (f'<svg class="{L["cls"]}" viewBox="0 0 {W} {H}" role="img" aria-label="{html.escape(ARIA)}">'
            + defs + "".join(o) + "</svg>")

ARIA = ("Plot of audit rate (odds scale) against enforceable penalty B, with contours of the safe stake S*. "
        "The page's audit lottery, p = 5% with a $1,000 bond, sits on the $53 contour. Removing the bond drops "
        "the safe stake to about 1 cent; restoring $53 with audits alone needs p = 99.98%, which is full verification.")

S53 = "$53"
WIDE = dict(
    id="detw", cls="det-wide", W=760, H=470, PL=92, PR=718, PT=22, PB=372,
    tick_dy=22, xtitle_dy=50, ytitle_x=24,
    xticks=[(0.001, "0.1%"), (0.01, "1%"), (0.1, "10%"), (0.5, "50%"), (0.9, "90%"),
            (0.99, "99%"), (0.999, "99.9%"), (0.9999, "99.99%"), (0.99999, "99.999%")],
    yticks=[(0, "0"), (0.1, "10¢"), (1, "$1"), (10, "$10"), (100, "$100"), (1000, "$1,000"),
            (10000, "$10,000"), (100000, "$100,000")],
    xtitle=["Audit rate p (odds scale)", "every run pays p × audit cost"],
    ytitle=["Enforceable penalty B", "paid only if caught"],
    clabels=[(1.0, -1.9, "S* = $1", "lab muted"),
             (S_LOT, 1.2, "S* = $53", "lab accent-text"),
             (1000.0, 1.0, "S* = $1,000", "lab muted")],
    rail_lift=16,
    notes=[
        ("L", 12, -12, "start", [("lab", "Audit lottery: p = 5%, B = $1,000")], "bg"),
        ("L", 10, 120, "start", [("lab", "Re-key after forfeit"), ("lab muted", "(no identity): B → 0")], "tint"),
        ("N", -12, -10, "end", [("lab", "Newcomer: S* ≈ 1¢")]),
        ("N", 14, -26, "start", [("lab", "Restore $53 with audits alone")], "tint"),
        ("V", 10, -74, "start", [("lab", "p = 99.98%:"), ("lab", "full verification"),
                                 ("lab muted", "audit odds"), ("lab muted", "× 100,000")], "bg"),
        ("P", 8, 298, "start", [("lab muted", "A $53 attack pays")]),
        ("P", 440, 70, "start", [("lab muted", "A $53 attack loses money")]),
    ],
)
NARROW = dict(
    id="detn", cls="det-narrow", W=360, H=470, PL=66, PR=346, PT=14, PB=362,
    tick_dy=20, xtitle_dy=46, ytitle_x=16,
    xticks=[(0.001, "0.1%"), (0.1, "10%"), (0.9, "90%"), (0.99, "99%")],
    yticks=[(0, "0"), (1, "$1"), (100, "$100"), (10000, "$10k")],
    xtitle=["Audit rate p (odds scale)", "every run pays for audits"],
    ytitle=["Penalty B, paid only if caught"],
    clabels=[(1.0, -2.2, "$1", "lab muted"),
             (S_LOT, 2.1, "S* = $53", "lab accent-text"),
             (1000.0, 2.2, "$1,000", "lab muted")],
    rail_lift=14,
    notes=[
        ("L", 10, -22, "start", [("lab", "p 5%, B $1,000")], "bg"),
        ("L", 8, 108, "start", [("lab", "B → 0")], "tint"),
        ("N", -9, -10, "end", [("lab", "1¢")]),
        ("N", 60, -22, "start", [("lab", "audits alone")]),
        ("V", 0, 20, "middle", [("lab accent-text", "99.98%")]),
    ],
)

STYLE = """
.det-fig{margin:1.5rem 0;
 --det-text:#2e2c28;--det-muted:#5f5b53;--det-line:#8f897e;--det-hair:#d6d1c7;--det-bg:#ffffff;--det-accent:#2a57a6;--det-tint:rgba(143,137,126,.10)}
:root[data-theme="dark"] .det-fig{--det-text:#dcd7cd;--det-muted:#a7a195;--det-line:#8f897e;--det-hair:#45423c;--det-bg:#161514;--det-accent:#9dbdf2;--det-tint:rgba(143,137,126,.14)}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]) .det-fig{--det-text:#dcd7cd;--det-muted:#a7a195;--det-line:#8f897e;--det-hair:#45423c;--det-bg:#161514;--det-accent:#9dbdf2;--det-tint:rgba(143,137,126,.14)}}
.det-fig svg{display:block;width:100%;height:auto;font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;color:var(--det-text)}
.det-fig .det-narrow{display:none}
@media (max-width:560px){.det-fig .det-wide{display:none}.det-fig .det-narrow{display:block}}
.det-fig .grid{stroke:var(--det-hair);stroke-width:1}
.det-fig .axis{stroke:var(--det-line);stroke-width:1}
.det-fig .tick{fill:var(--det-muted);font-size:13px}
.det-fig .lab{fill:var(--det-text);font-size:14px}
.det-fig .muted{fill:var(--det-muted)}
.det-fig .accent-text{fill:var(--det-accent)}
.det-fig .halo{paint-order:stroke;stroke:var(--det-bg);stroke-width:4px;stroke-linejoin:round}
.det-fig .contour{stroke:var(--det-line);stroke-width:1.25;fill:none}
.det-fig .contour.accent{stroke:var(--det-accent);stroke-width:2}
.det-fig .pays{fill:var(--det-tint);stroke:none}
.det-fig .ko{fill:var(--det-bg);stroke:none}
.det-fig .move{stroke:var(--det-text);stroke-width:1.25;fill:none}
.det-fig .ahead{fill:none;stroke:var(--det-text);stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round}
.det-fig .pt{stroke:var(--det-bg);stroke-width:2}
.det-fig .accent-fill{fill:var(--det-accent)}
.det-fig .hollow{fill:var(--det-bg);stroke:var(--det-text);stroke-width:1.5}
.det-fig figcaption{font-size:.95rem;line-height:1.55;color:var(--det-muted);margin-top:.6rem}
"""

CAPTION = ("With a $1,000 bond, a 5% audit lottery makes any attack worth less than about $53 lose money. "
           "Without identity the attacker re-keys, B falls to zero, and the same $53 needs a 99.98% audit rate: "
           "full verification. Lines are safe-stake contours S* = c + (B + c)·p/(1−p), with c = 1¢; "
           "on these axes that exact relation is a straight line. Without the bond each unit of audit odds buys (B + c)/c ≈ 100,000 times less safe stake, "
           "so the odds must rise five decades. Moving up is free on the honest path; moving right is paid on every run.")

def figure_html():
    return (f'<figure class="det-fig">\n{build(WIDE)}\n{build(NARROW)}\n'
            f'<figcaption>{html.escape(CAPTION)}</figcaption>\n</figure>')

def main():
    fig = figure_html()
    frag = f"<style>{STYLE}</style>\n{fig}\n"
    open(os.path.join(HERE, "figure.html"), "w").write(frag)
    open(os.path.join(HERE, "svg-wide.svg"), "w").write(build(WIDE))
    page = INDEX.replace("{{FIG}}", frag)
    open(os.path.join(HERE, "index.html"), "w").write(page)
    print(f"S*(5%, $1000) = {S_LOT:.3f}; p(no bond, same S*) = {P_NOBOND:.6f}; "
          f"S*(5%, 0) = {S_NEWCOMER*100:.3f} cents; leverage (B+c)/c = {LEVERAGE:,.0f}")

INDEX = """<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Deterrence Frontier</title>
<style>
:root{--t:#2e2c28;--m:#5f5b53;--bg:#ffffff}
:root[data-theme="dark"]{--t:#dcd7cd;--m:#a7a195;--bg:#161514}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){--t:#dcd7cd;--m:#a7a195;--bg:#161514}}
body{margin:0;background:var(--bg);color:var(--t);font:17px/1.6 ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
main{max-width:46rem;margin:0 auto;padding:2rem 16px 3rem}
h1{font-size:1.15rem;font-weight:600;margin:0 0 1rem;color:var(--m)}
p{margin:0 0 1rem}
</style></head><body><main>
<h1>Hardening: Deterrence &middot; Worked bounds</h1>
<p><strong>The inspection-game frontier.</strong> Wrap a cheap process (corruption cost <i>c</i>) in an audit that escalates to an expensive robust process with probability <i>p</i>, requiring an enforceable bond <i>B</i> forfeited on detection. An adversary&rsquo;s expected payoff (1&minus;<i>p</i>)<i>S</i> &minus; <i>pB</i> &minus; <i>c</i> is negative iff <i>S</i> &lt; <i>S</i>* = (<i>c</i> + <i>pB</i>)/(1&minus;<i>p</i>).</p>
<p>Plug in a $0.01 LLM-judge call, a 5% audit rate, and a $1,000 bond: <i>S</i>* = (0.01 + 0.05&middot;1000)/0.95 &asymp; 53, so about $53 of safe stake bought by a one-in-twenty audit. Strip the bond (<i>B</i> = 0) and the <em>same</em> $53 safe stake would require an audit rate of <i>p</i> &asymp; 99.98% &mdash; full verification. Robustness scales with the expected penalty <i>pB</i>, and every run still pays <i>p</i>&thinsp;<i>C</i><sub>audit</sub> for the audits; what the bond buys is that a small <i>p</i> suffices.</p>
{{FIG}}
<p>That is the formal case for identity/escrow infrastructure, and the cheapest attack is to keep each stake below <i>S</i>*.</p>
</main></body></html>
"""

if __name__ == "__main__":
    main()
