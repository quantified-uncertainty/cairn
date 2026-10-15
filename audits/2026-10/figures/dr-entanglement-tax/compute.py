"""Entanglement tax figure: effective independent layers vs shared-cause weight rho.

Everything plotted comes from the page's canonical beta-factor formula
(formal-definitions.md, "The Entanglement Tax"):

    P(all fail) = (1 - rho) * p**n + rho * p        (n identical layers, miss rate p)
    n_eff       = ln P(all fail) / ln p              ("Effective Redundancy")
    Tax         = (1 - rho) + rho * p**(1 - n)

With p = 0.1, n_eff = -log10 P, so one y-axis serves both readings:
"worth this many independent layers" on the left, P(all miss) on the right.
The floor rho*p is the n -> infinity limit: n_eff_floor = 1 + log10(1/rho).

Run:  python3 compute.py   -> writes figure.html and index.html, prints checks.
"""
import math, html, pathlib

HERE = pathlib.Path(__file__).parent
P = 0.1
NS = (2, 3, 5)
RHO_MIN, RHO_MAX = 1e-5, 1.0
V_MIN, V_MAX = 0.55, 5.35            # y domain in effective layers
BANDS = [                            # formal-definitions.md, tax section
    ("different providers", 0.3, 0.6),
    ("same provider", 0.5, 0.7),
]
TAX_RHO, TAX_N = 0.5, 3


def p_all(rho, n, p=P):
    return (1 - rho) * p ** n + rho * p


def n_eff(rho, n, p=P):
    return math.log(p_all(rho, n, p)) / math.log(p)


def floor_eff(rho, p=P):
    return math.log(rho * p) / math.log(p)


def tax(rho, n, p=P):
    return (1 - rho) + rho * p ** (1 - n)


# ---------------------------------------------------------------- checks
def checks():
    out = []
    # formal-definitions table, three layers at 10%
    for rho, pa, tx in [(0, .0010, 1), (.1, .011, 11), (.3, .031, 31), (.5, .051, 50), (.7, .070, 70), (1, .10, 100)]:
        a, t = p_all(rho, 3), tax(rho, 3)
        assert abs(a - pa) / pa < 0.06, (rho, a, pa)
        assert abs(t - tx) / tx < 0.06, (rho, t, tx)
    # "two, three or five of them at rho = 0.5 are all worth about 1.3"
    for n in NS:
        assert abs(n_eff(.5, n) - 1.3) < 0.05, (n, n_eff(.5, n))
    # calculator lookup table, "effective" columns
    for rho, e3, e5 in [(.1, 2.0, 2.0), (.2, 1.7, 1.7), (.3, 1.5, 1.5), (.5, 1.3, 1.3), (.7, 1.2, 1.2)]:
        assert round(n_eff(rho, 3), 1) == e3 and round(n_eff(rho, 5), 1) == e5, rho
    out.append("table checks pass")
    out.append("n_eff at rho=0.2: " + ", ".join(f"n={n}: {n_eff(.2, n):.2f}" for n in NS))
    out.append(f"tax at rho={TAX_RHO}, n={TAX_N}: {tax(TAX_RHO, TAX_N):.1f}x  "
               f"(P = {p_all(TAX_RHO, TAX_N):.4f}, n_eff = {n_eff(TAX_RHO, TAX_N):.3f})")
    for name, lo, hi in BANDS:
        out.append(f"{name} {lo}-{hi}: n_eff(3) {n_eff(hi, 3):.2f}-{n_eff(lo, 3):.2f}, "
                   f"tax(3) {tax(lo, 3):.0f}-{tax(hi, 3):.0f}x, P(3) {p_all(lo, 3):.2%}-{p_all(hi, 3):.2%}")
    for n in NS:
        knee = P ** (n - 1)
        out.append(f"n={n}: knee rho = p^(n-1) = {knee:g}; n_eff there {n_eff(knee, n):.2f} (n - log10 2 = {n - math.log10(2):.2f})")
    return out


# ---------------------------------------------------------------- drawing
# reviewer: measured range 0.3-0.7 spans n_eff 1.15-1.52 for n=2,3,5
for _n in (2, 3, 5):
    assert 1.1 <= n_eff(0.7, _n) < 1.2 and 1.4 < n_eff(0.3, _n) <= 1.55, _n


def fmt(v):
    return f"{v:.1f}".rstrip("0").rstrip(".")


def esc(s):
    return html.escape(s, quote=True)


def render(L):
    """L: layout dict for one variant."""
    X0, W, Y0, H = L["X0"], L["W"], L["Y0"], L["H"]
    lmin, lmax = math.log10(RHO_MIN), math.log10(RHO_MAX)

    def x(r):
        return X0 + (math.log10(r) - lmin) / (lmax - lmin) * W

    def y(v):
        return Y0 + (V_MAX - v) / (V_MAX - V_MIN) * H

    def poly(fn, r0=RHO_MIN, r1=RHO_MAX, k=500):
        pts = []
        for i in range(k + 1):
            r = 10 ** (math.log10(r0) + (math.log10(r1) - math.log10(r0)) * i / k)
            v = fn(r)
            if v > V_MAX + 0.4:
                continue
            pts.append(f"{fmt(x(r))},{fmt(y(min(v, V_MAX + 0.4)))}")
        return "M" + " L".join(pts)

    s = []
    a = s.append
    vw, vh = L["vw"], L["vh"]
    a(f'<svg viewBox="0 0 {vw} {vh}" width="{vw}" height="{vh}" role="img" aria-label="{esc(L["aria"])}" class="{L["cls"]}">')
    a(f'<defs><clipPath id="{L["id"]}-clip"><rect x="{X0}" y="{Y0}" width="{W}" height="{H}"/></clipPath></defs>')

    # gridlines (one per effective layer = one decade of P(all miss)) and right-axis labels
    for k in range(1, 6):
        yy = fmt(y(k))
        a(f'<line class="grid" x1="{X0}" x2="{X0 + W}" y1="{yy}" y2="{yy}"/>')
        a(f'<text class="tick" x="{X0 - 8}" y="{yy}" dy="0.35em" text-anchor="end">{k}</text>')
        pct = ["10%", "1%", "0.1%", "0.01%", "0.001%"][k - 1]
        a(f'<text class="tick" x="{X0 + W + 8}" y="{yy}" dy="0.35em">{pct}</text>')
    # axis titles (horizontal, above the plot)
    a(f'<text class="axt" x="{L["ltitle_x"]}" y="{Y0 - L["title_gap"]}">{L["ltitle"]}</text>')
    a(f'<text class="axt" x="{vw - 2}" y="{Y0 - L["title_gap"]}" text-anchor="end">{L["rtitle"]}</text>')

    # x axis
    yb = y(V_MIN)
    a(f'<line class="axis" x1="{X0}" x2="{X0 + W}" y1="{fmt(yb)}" y2="{fmt(yb)}"/>')
    for r, lab in L["xticks"]:
        xx = fmt(x(r))
        a(f'<line class="axis" x1="{xx}" x2="{xx}" y1="{fmt(yb)}" y2="{fmt(yb + 5)}"/>')
        anchor = "end" if r == 1 else ("start" if r == RHO_MIN else "middle")
        a(f'<text class="tick" x="{xx}" y="{fmt(yb + 21)}" text-anchor="{anchor}">{lab}</text>')
    a(f'<text class="axt" x="{fmt(X0 + W / 2)}" y="{fmt(yb + L["xtitle_dy"])}" text-anchor="middle">{L["xtitle"]}</text>')

    # measured ranges: range bars below the axis title, a faint span in the plot
    for i, (name, lo, hi) in enumerate(BANDS):
        yy = yb + L["band_y0"] + i * L["band_step"]
        a(f'<line class="band" x1="{fmt(x(lo))}" x2="{fmt(x(hi))}" y1="{fmt(yy)}" y2="{fmt(yy)}"/>')
        for r in (lo, hi):
            a(f'<line class="bandtick" x1="{fmt(x(r))}" x2="{fmt(x(r))}" y1="{fmt(yy - 4)}" y2="{fmt(yy + 4)}"/>')
        a(f'<text class="lab" x="{fmt(x(lo) - 8)}" y="{fmt(yy)}" dy="0.35em" text-anchor="end">{L["band_names"][i]}</text>')
    lo, hi = min(b[1] for b in BANDS), max(b[2] for b in BANDS)
    a(f'<rect class="span" x="{fmt(x(lo))}" y="{Y0}" width="{fmt(x(hi) - x(lo))}" height="{fmt(yb - Y0)}"/>')

    g = f'<g clip-path="url(#{L["id"]}-clip)">'
    a(g)
    # product-rule promise for TAX_N layers, continued as a dashed line to the bracket
    yp = fmt(y(TAX_N))
    a(f'<line class="promise" x1="{fmt(x(P ** (TAX_N - 1) / 4))}" x2="{fmt(x(TAX_RHO))}" y1="{yp}" y2="{yp}"/>')
    # stacks
    for n in NS:
        a(f'<path class="stack" d="{poly(lambda r, n=n: n_eff(r, n))}"/>')
    # floor (n -> infinity), the one accent
    a(f'<path class="floor" d="{poly(floor_eff, 10 ** (1 - L["floor_top"]))}"/>')
    a('</g>')

    # stack labels above the left end of each plateau
    for n in NS:
        a(f'<text class="lab" x="{X0 + 4}" y="{fmt(y(n) - 7)}">{n} layers</text>')

    # promise label above dashed line, right-aligned before the bracket
    a(f'<text class="note" x="{fmt(x(TAX_RHO) - L["promise_dx"])}" y="{fmt(y(TAX_N) - 7)}" text-anchor="end">{L["promise"]}</text>')

    # tax bracket at TAX_RHO
    xt = x(TAX_RHO)
    yt1, yt2 = y(TAX_N), y(n_eff(TAX_RHO, TAX_N))
    a(f'<path class="bracket" d="M{fmt(xt - 4)},{fmt(yt1)} H{fmt(xt)} V{fmt(yt2)} H{fmt(xt - 4)}"/>')
    a(f'<circle class="dot" cx="{fmt(xt)}" cy="{fmt(yt2)}" r="3"/>')
    ym = y(L["tax_v"])
    for j, line in enumerate(L["tax"]):
        a(f'<text class="lab" x="{fmt(xt - 8)}" y="{fmt(ym + (j - (len(L["tax"]) - 1) / 2) * 18)}" dy="0.35em" text-anchor="end">{line}</text>')

    # floor label
    fx, fy = L["floor_at"]
    for j, line in enumerate(L["floor"]):
        a(f'<text class="acc" x="{fmt(x(fx))}" y="{fmt(y(fy) + j * 18)}">{line}</text>')

    a('</svg>')
    return "\n".join(s)


ARIA = ("Chart: what stacks of 2, 3 and 5 checks that each miss 10% are worth in independent checks, "
        "against the shared-cause weight rho on a log scale. Each stack is worth its full count only "
        "while rho is below 0.1 to the power n minus 1; past that it lies on the common-cause floor "
        "rho times p, which no number of layers gets above. At rho = 0.5 three layers miss 5.1% instead "
        "of 0.1%, a 50 times tax, and every stack is worth about 1.3 layers. Measured rho between strong "
        "LLMs, 0.3 to 0.6 across providers and 0.5 to 0.7 within one, falls where all stacks are worth about 1.1 to 1.5 layers.")

WIDE = dict(
    id="et-w", cls="et-wide", vw=720, vh=470, X0=40, W=600, Y0=40, H=320,
    aria=ARIA,
    ltitle="worth this many independent layers", ltitle_x=32, title_gap=18,
    rtitle="all layers miss",
    xticks=[(1e-5, "0.00001"), (1e-4, "0.0001"), (1e-3, "0.001"), (1e-2, "0.01"), (1e-1, "0.1"), (1, "1")],
    xtitle="shared-cause weight ρ (log scale)", xtitle_dy=46,
    band_names=["measured, LLMs from different providers", "LLMs from the same provider"],
    band_y0=74, band_step=20,
    promise="product rule for 3 layers", promise_dx=12,
    tax=["50× tax", "at ρ = 0.5"], tax_v=2.4, floor_top=V_MAX,
    floor_at=(2.2e-3, 4.55), floor=["common-cause floor ρ·p:", "no number of layers gets above it"],
)

NARROW = dict(
    id="et-n", cls="et-narrow", vw=360, vh=500, X0=26, W=268, Y0=46, H=330,
    aria=ARIA,
    ltitle="worth this many layers", ltitle_x=18, title_gap=22,
    rtitle="all miss",
    xticks=[(1e-5, "10⁻⁵"), (1e-4, "10⁻⁴"), (1e-3, "10⁻³"), (1e-2, "0.01"), (1e-1, "0.1"), (1, "1")],
    xtitle="shared-cause weight ρ", xtitle_dy=46,
    band_names=["measured, different providers", "same provider"],
    band_y0=74, band_step=20,
    promise="product rule", promise_dx=10,
    tax=["50× tax"], tax_v=2.45, floor_top=5.0,
    floor_at=(1.6e-3, 4.75), floor=["floor ρ·p: no number", "of layers gets above it"],
)

CAPTION = ("Stacks of identical checks that each miss 10%, under the beta-factor model. "
           "A stack is worth close to its full count only while ρ is below 0.1<sup>n−1</sup>; past that it sits on the "
           "common-cause floor ρ·p, and each tenfold rise in ρ costs one layer. "
           "In the range measured between strong LLMs, two, three or five checks are all worth about 1.1–1.5.")

STYLE = """<style>
.et-fig { margin: 2rem 0; }
.et-fig svg { display: block; width: 100%; height: auto; max-width: 720px; overflow: visible; }
.et-fig .et-narrow { display: none; max-width: 360px; }
@media (max-width: 34rem) {
  .et-fig .et-wide { display: none; }
  .et-fig .et-narrow { display: block; }
}
.et-fig {
  --et-text: #2e2c28; --et-muted: #5f5b53; --et-line: #8f897e; --et-hair: #d6d1c7;
  --et-accent: #a8321f;
}
:root[data-theme='dark'] .et-fig {
  --et-text: #dcd7cd; --et-muted: #a7a195; --et-line: #8f897e; --et-hair: #45423c;
  --et-accent: #f29a84;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme]) .et-fig {
    --et-text: #dcd7cd; --et-muted: #a7a195; --et-line: #8f897e; --et-hair: #45423c;
    --et-accent: #f29a84;
  }
}
.et-fig text { font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; font-size: 14px; fill: var(--et-text); }
.et-fig .tick, .et-fig .note, .et-fig .axt { fill: var(--et-muted); }
.et-fig .acc { fill: var(--et-accent); }
.et-fig .grid { stroke: var(--et-hair); stroke-width: 1; }
.et-fig .axis { stroke: var(--et-line); stroke-width: 1; }
.et-fig .stack { fill: none; stroke: var(--et-text); stroke-width: 1.5; stroke-linejoin: round; }
.et-fig .floor { fill: none; stroke: var(--et-accent); stroke-width: 2; }
.et-fig .promise { stroke: var(--et-line); stroke-width: 1; stroke-dasharray: 4 4; }
.et-fig .bracket { fill: none; stroke: var(--et-text); stroke-width: 1; }
.et-fig .dot { fill: var(--et-text); }
.et-fig .band { stroke: var(--et-line); stroke-width: 3; }
.et-fig .span { fill: var(--et-hair); opacity: 0.45; }
.et-fig .bandtick { stroke: var(--et-line); stroke-width: 1; }
.et-fig figcaption { font-size: 0.9375rem; line-height: 1.55; color: var(--et-muted); margin-top: 0.75rem; max-width: 40rem; }
</style>"""


def figure_html():
    return (STYLE + "\n<figure class=\"et-fig\">\n" + render(WIDE) + "\n" + render(NARROW) +
            f"\n<figcaption>{CAPTION}</figcaption>\n</figure>\n")


PAGE = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Formal Definitions</title>
<style>
:root { --bg: #ffffff; --fg: #2e2c28; --muted: #5f5b53; color-scheme: light; }
:root[data-theme='dark'] { --bg: #161514; --fg: #dcd7cd; --muted: #a7a195; color-scheme: dark; }
@media (prefers-color-scheme: dark) { :root:not([data-theme]) { --bg: #161514; --fg: #dcd7cd; --muted: #a7a195; color-scheme: dark; } }
html, body { margin: 0; background: var(--bg); color: var(--fg); }
main { max-width: 45rem; margin: 0 auto; padding: 2rem 16px 4rem;
  font: 17px/1.6 ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
h1 { font-size: 1.25rem; margin: 0 0 0.25rem; }
h2 { font-size: 1.125rem; margin: 1.5rem 0 0.5rem; }
.crumb { color: var(--muted); font-size: 0.875rem; margin: 0 0 1.5rem; }
p { margin: 0 0 1rem; }
</style>
</head>
<body>
<main>
<h1>Formal Definitions</h1>
<p class="crumb">Delegation Risk · Entanglements · Fundamentals</p>
<h2>The Entanglement Tax</h2>
<p>…</p>
<p>Which row applies depends on what the layers share. Benchmark data, allowing for label noise, put ρ between strong LLMs at roughly 0.3–0.6 across providers and 0.5–0.7 within one (evidence and assumptions): a tax of about 30–60× and 50–70× for three layers. The “about 50×” used elsewhere on this site sits inside both ranges. No harm-detection stack has been measured.</p>
<p>…</p>
<h2>Effective Redundancy</h2>
<p>Effective redundancy is the number of independent layers that would give the same protection: n<sub>eff</sub> = ln P(all fail) / ln p. For layers that each miss 10%, two, three or five of them at ρ = 0.5 are all worth about 1.3 independent layers under the beta-factor model: past modest correlation, effective redundancy is set by ρ, not by the layer count. The flatness is partly a property of the model, which assumes some inputs defeat every layer at once. A smoother structure fitted to the same pairwise joint misses still rewards extra layers, with quickly diminishing returns (both, tabulated). Under either, defense in depth is defeated by common cause, not by independent bad luck.</p>
FIGURE
</main>
</body>
</html>
"""

if __name__ == "__main__":
    for line in checks():
        print(line)
    frag = figure_html()
    (HERE / "figure.html").write_text(frag)
    (HERE / "index.html").write_text(PAGE.replace("FIGURE", frag))
    print("wrote figure.html, index.html")
