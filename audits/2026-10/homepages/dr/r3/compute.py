#!/usr/bin/env python3
"""Delegation Risk homepage figure: what a stack of correlated checks is worth.

Model (site's beta-factor mixture, entanglements/detection/correlation-calculator.md):
  n identical checks, each misses with probability p; misses share a common
  cause with weight rho (indicator / phi scale):
      P(all miss) = (1 - rho) * p**n + rho * p
  Effective number of independent checks with the same P(all miss):
      n_eff = ln P(all miss) / ln p
  For any n, n_eff <= ln(rho * p) / ln p = 1 - log10(rho)  (at p = 0.1).

Rho ranges drawn under the axis are the site's "Priors when you cannot
measure" rows for LLM checks (same page, lines 155-157):
  same model and prompt 0.8-1.0, same provider 0.5-0.7, different providers 0.3-0.6.

Run: python3 compute.py   -> prints checks, writes fig-*.svg, splices into index.html
"""
import math, os, re

HERE = os.path.dirname(os.path.abspath(__file__))
P = 0.1
NS = (2, 3, 5)
HIGHLIGHT = 3
MARKS = (0.1, 0.2, 0.5)          # the rho values the homepage prose cites
RANGES = [                       # (label desktop, label mobile, lo, hi)
    ("Same model", "Same model", 0.8, 1.0),
    ("Same provider", "Same provider", 0.5, 0.7),
    ("Different providers", "Different providers", 0.3, 0.6),
]


def p_all(n, rho, p=P):
    return (1 - rho) * p ** n + rho * p


def n_eff(n, rho, p=P):
    return math.log(p_all(n, rho, p)) / math.log(p)


# ---------------------------------------------------------------- checks
def checks():
    out = []
    for r in (0, 0.01, 0.1, 0.2, 0.3, 0.5, 0.58, 0.69, 0.7, 1.0):
        row = "  ".join(f"n={n}: P={p_all(n, r):.6f} n_eff={n_eff(n, r):.3f}" for n in NS)
        ceil = "inf" if r == 0 else f"{1 - math.log10(r):.3f}"
        out.append(f"rho={r:<5} {row}  ceiling={ceil}")
    # site's tax 1 + 99 rho for three checks
    for r in (0.1, 0.2, 0.5):
        out.append(f"tax(3, rho={r}) = {p_all(3, r) / P**3:.2f}  (1+99rho = {1 + 99 * r:.1f})")
    # the lookup table on correlation-calculator.md
    table = {0.1: (2.0, 2.0), 0.2: (1.7, 1.7), 0.3: (1.5, 1.5), 0.5: (1.3, 1.3), 0.7: (1.2, 1.2), 1.0: (1.0, 1.0)}
    for r, (e3, e5) in table.items():
        assert round(n_eff(3, r), 1) == e3, (r, n_eff(3, r))
        assert round(n_eff(5, r), 1) == e5, (r, n_eff(5, r))
    # ordering: curves never cross for rho in (0, 1)
    for i in range(1, 1000):
        r = i / 1000
        assert n_eff(2, r) <= n_eff(3, r) <= n_eff(5, r) + 1e-12
    return "\n".join(out)


# ---------------------------------------------------------------- svg
def rho_samples():
    xs = {0.0, 1.0}
    k = -7.0
    while k < -2:                 # dense near 0, where the curves fall steeply
        xs.add(10 ** k); k += 0.05
    for i in range(1, 1000):
        xs.add(i / 1000)
    return sorted(xs)


def fmt(v):
    s = f"{v:.1f}"
    return s[:-2] if s.endswith(".0") else s


def build(W, fs, small, gl, gr, top, unit, mobile):
    x0, x1 = gl, W - gr
    X = lambda r: x0 + r * (x1 - x0)
    Y = lambda v: top + (5 - v) * unit
    yb = Y(1)
    e = []
    a = e.append
    # gridlines and right-hand tick labels (worth N checks)
    for v in range(1, 6):
        a(f'<line class="g" x1="{x0}" x2="{x1}" y1="{Y(v):.1f}" y2="{Y(v):.1f}"/>')
        a(f'<text class="t" x="{W - 2}" y="{Y(v) + small * 0.35:.1f}" text-anchor="end">{v}</text>')
    a(f'<line class="ax" x1="{x0}" x2="{x1}" y1="{yb:.1f}" y2="{yb:.1f}"/>')
    # x ticks
    ty = yb + small + 8
    for r in (0, 0.2, 0.4, 0.6, 0.8, 1.0):
        a(f'<line class="ax" x1="{X(r):.1f}" x2="{X(r):.1f}" y1="{yb:.1f}" y2="{yb + 5:.1f}"/>')
        anchor = "start" if r == 0 else ("end" if r == 1 else "middle")
        dx = -2 if r == 0 else 0
        a(f'<text class="t" x="{X(r) + dx:.1f}" y="{ty:.1f}" text-anchor="{anchor}">{fmt(r) if r not in (0, 1) else int(r)}</text>')
    xt = ty + fs + 6
    a(f'<text class="l" x="{x0 - 2}" y="{xt:.1f}">Correlation ρ between the checks’ misses</text>')
    # curves
    rs = rho_samples()
    for n in sorted(NS, key=lambda k: k == HIGHLIGHT):   # accent drawn last, on top
        pts = " ".join(f"{X(r):.1f},{Y(n_eff(n, r)):.1f}" for r in rs)
        cls = "c hi" if n == HIGHLIGHT else "c"
        a(f'<polyline class="{cls}" points="{pts}"/>')
        a(f'<text class="l" x="{x0 - 10}" y="{Y(n) + fs * 0.35:.1f}" text-anchor="end">{n} checks</text>')
        a(f'<circle class="{"d hi" if n == HIGHLIGHT else "d"}" cx="{x0}" cy="{Y(n):.1f}" r="3"/>')
    # marks on the highlighted curve at the cited rho values
    for r in MARKS:
        v = n_eff(HIGHLIGHT, r)
        a(f'<circle class="m" cx="{X(r):.1f}" cy="{Y(v):.1f}" r="3.5"/>')
        a(f'<text class="t" x="{X(r) + 6:.1f}" y="{Y(v) - 9:.1f}">{v:.1f}</text>')
    # rho range brackets
    y = xt + (24 if not mobile else 30)
    for lab_d, lab_m, lo, hi in RANGES:
        if mobile:
            # anchor at the bracket's right end when the label would run off the figure
            if X(lo) + 0.55 * small * len(lab_m) > W:
                a(f'<text class="t" x="{X(hi):.1f}" y="{y - 11:.1f}" text-anchor="end">{lab_m}</text>')
            else:
                a(f'<text class="t" x="{X(lo):.1f}" y="{y - 11:.1f}">{lab_m}</text>')
        else:
            a(f'<text class="t" x="{X(lo) - 10:.1f}" y="{y + small * 0.35:.1f}" text-anchor="end">{lab_m if mobile else lab_d}</text>')
        a(f'<path class="r" d="M{X(lo):.1f} {y - 5:.1f}V{y + 5:.1f}M{X(lo):.1f} {y:.1f}H{X(hi):.1f}M{X(hi):.1f} {y - 5:.1f}V{y + 5:.1f}"/>')
        y += 26 if not mobile else 40
    H = y - (26 if not mobile else 40) + 12
    # titles
    a(f'<text class="l" x="{W - 2}" y="{top - 16:.1f}" text-anchor="end">Worth this many independent checks</text>')
    body = "\n".join(e)
    return (f'<svg class="fig-{"narrow" if mobile else "wide"}" viewBox="0 0 {W} {H:.0f}" width="{W}" height="{H:.0f}" '
            f'role="img" aria-labelledby="fig-cap" font-size="{fs}">\n{body}\n</svg>')


def main():
    report = checks()
    print(report)
    wide = build(W=624, fs=15, small=15, gl=78, gr=26, top=40, unit=60, mobile=False)
    narrow = build(W=343, fs=14, small=14, gl=70, gr=20, top=38, unit=50, mobile=True)
    for name, s in (("fig-wide.svg", wide), ("fig-narrow.svg", narrow)):
        with open(os.path.join(HERE, name), "w") as f:
            f.write(s + "\n")
    with open(os.path.join(HERE, "checks.txt"), "w") as f:
        f.write(report + "\n")
    idx = os.path.join(HERE, "index.html")
    if os.path.exists(idx):
        html = open(idx).read()
        html2 = re.sub(r"(<!-- FIG:START -->).*?(<!-- FIG:END -->)",
                       lambda m: m.group(1) + "\n" + wide + "\n" + narrow + "\n" + m.group(2), html, flags=re.S)
        open(idx, "w").write(html2)
        print("spliced" if html2 != html else "no change")


if __name__ == "__main__":
    main()
