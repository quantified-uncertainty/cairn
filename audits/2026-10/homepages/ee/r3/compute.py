#!/usr/bin/env python3
"""Evaluation Engineering homepage figure: who pays, and documented failure.

Data: apps/evaluation-engineering/data/systems.csv (161 systems, one coder,
October 2026). Filters and statistics reproduce data/analyze.py exactly:
  - rows with payer "n/a" or "unknown" dropped (154 left);
  - outcome = failure_status == "established";
  - 90% Jeffreys intervals, Beta(k + 1/2, n - k + 1/2), endpoints 0/1 at k = 0/n;
  - "pays anything" rows also drop evaluated_party_pays_any == "unknown" (129 left);
  - main-payer vs side-payment split is analyze.py's POST HOC block.
Expected (from analyze.py's output): rated party 12/35, mixed 11/39, third
party 9/35, public 4/19, user 5/26; pays nothing 10/62, main 12/35, side 15/32;
yes 27/67; OR 3.48 [1.62, 7.80].

Run: python3 compute.py CSV  -> prints checks, writes fig-*.svg, splices into index.html
"""
import csv, os, re, sys
from scipy import stats

HERE = os.path.dirname(os.path.abspath(__file__))
CSV = sys.argv[1] if len(sys.argv) > 1 else "/home/user/cairn/apps/evaluation-engineering/data/systems.csv"

rows = [r for r in csv.DictReader(open(CSV, newline="")) if r["payer"] not in ("n/a", "unknown")]
fail = lambda r: r["failure_status"] == "established"


def jeffreys(k, n):
    lo = stats.beta.ppf(0.05, k + 0.5, n - k + 0.5) if k > 0 else 0.0
    hi = stats.beta.ppf(0.95, k + 0.5, n - k + 0.5) if k < n else 1.0
    return lo, hi


def kn(pred):
    sub = [r for r in rows if pred(r)]
    return sum(map(fail, sub)), len(sub)


PAYERS = [("evaluated_party", "The rated party"), ("mixed", "Mixed"),
          ("third_party", "A third party"), ("public", "Public money"), ("user", "Users")]
pays = lambda r: r["evaluated_party_pays_any"]
GROUPS = [
    ("Who is the evaluator’s main funder?", False,
     [(lab, *kn(lambda r, p=p: r["payer"] == p)) for p, lab in PAYERS]),
    ("Does the rated party pay it anything?", True, [
        ("No", *kn(lambda r: pays(r) == "no")),
        ("Yes, as main funder", *kn(lambda r: pays(r) == "yes" and r["payer"] == "evaluated_party")),
        ("Yes, on the side", *kn(lambda r: pays(r) == "yes" and r["payer"] != "evaluated_party")),
    ]),
]
K_ALL, N_ALL = kn(lambda r: True)
ky, ny = kn(lambda r: pays(r) == "yes")
kno, nno = kn(lambda r: pays(r) == "no")
OR_RES = stats.contingency.odds_ratio([[ky, ny - ky], [kno, nno - kno]])  # conditional MLE, as analyze.py
OR = OR_RES.statistic
OR_CI = OR_RES.confidence_interval(0.90)

# ---- checks -------------------------------------------------------------
print(f"all: {K_ALL}/{N_ALL} = {K_ALL / N_ALL:.3f}")
for title, _, rs in GROUPS:
    print(title)
    for lab, k, n in rs:
        lo, hi = jeffreys(k, n)
        print(f"  {lab:22s} {k:3d}/{n:3d} = {k / n:.3f}  90% [{lo:.3f}, {hi:.3f}]")
print(f"pays anything: yes {ky}/{ny} = {ky / ny:.3f}, no {kno}/{nno}; OR = {OR:.2f} 90% [{OR_CI.low:.2f}, {OR_CI.high:.2f}]")
assert (K_ALL, N_ALL) == (41, 154) and (ky, ny, kno, nno) == (27, 67, 10, 62)
assert [x[1:] for x in GROUPS[0][2]] == [(12, 35), (11, 39), (9, 35), (4, 19), (5, 26)]
assert [x[1:] for x in GROUPS[1][2]] == [(10, 62), (12, 35), (15, 32)]
assert abs(OR - 3.48) < 0.01 and round(OR_CI.low, 1) == 1.6 and round(OR_CI.high, 1) == 7.8
XMAX = 0.7
for _, _, rs in GROUPS:
    for _, k, n in rs:
        assert jeffreys(k, n)[1] < XMAX


# ---- drawing -------------------------------------------------------------
def f(v):
    return f"{v:.1f}"


def svg(narrow):
    W = 343 if narrow else 624
    px0, px1 = (0, W - 2) if narrow else (196, 568)
    X = lambda v: px0 + (px1 - px0) * v / XMAX
    out, y = [], 0
    hdr_y = 18
    # axis title + ticks at top
    ticks = [0, 0.2, 0.4, 0.6]
    y = 62 if narrow else 64
    body = []
    for gi, (title, hi, rs) in enumerate(GROUPS):
        y += 32 if gi else 0
        body.append(f'<text class="l h" x="0" y="{f(y)}">{title}</text>')
        y += 0
        for lab, k, n in rs:
            lo, up = jeffreys(k, n)
            c = " hi" if hi else ""
            if narrow:
                y += 24
                body.append(f'<text class="l" x="0" y="{f(y)}">{lab}</text>')
                body.append(f'<text class="t" x="{W}" y="{f(y)}" text-anchor="end">{k} of {n}</text>')
                y += 13
                cy = y
            else:
                y += 27
                cy = y - 5
                body.append(f'<text class="l" x="16" y="{f(y)}">{lab}</text>')
                body.append(f'<text class="t" x="{W}" y="{f(y)}" text-anchor="end">{k} of {n}</text>')
            body.append(f'<line class="ci{c}" x1="{f(X(lo))}" x2="{f(X(up))}" y1="{f(cy)}" y2="{f(cy)}"/>')
            body.append(f'<circle class="d{c}" cx="{f(X(k / n))}" cy="{f(cy)}" r="5"/>')
    top, bot = 44, y + 14
    H = bot + 22
    out.append(f'<svg class="fig-{"narrow" if narrow else "wide"}" viewBox="0 0 {W} {H}" width="{W}" height="{H}" '
               f'role="img" aria-labelledby="fig-cap" font-size="{14 if narrow else 15}">')
    for t in ticks:
        x = X(t)
        out.append(f'<line class="g" x1="{f(x)}" x2="{f(x)}" y1="{top}" y2="{bot}"/>')
        anchor = "start" if (narrow and t == 0) else "middle"
        out.append(f'<text class="t" x="{f(x)}" y="{top - 8}" text-anchor="{anchor}">{round(t * 100)}%</text>')
    xa = X(K_ALL / N_ALL)
    out.append(f'<line class="ref" x1="{f(xa)}" x2="{f(xa)}" y1="{top}" y2="{bot}"/>')
    out.append(f'<text class="t" x="{f(xa)}" y="{bot + 18}" text-anchor="middle">all 154: {round(100 * K_ALL / N_ALL)}%</text>')
    ttl = "Share with an established failure" if narrow else "Share of systems with an established failure, with 90% interval"
    out.append(f'<text class="l" x="{0 if narrow else px0}" y="{hdr_y - 2}">{ttl}</text>')
    out += body
    out.append("</svg>")
    return "\n".join(out)


wide, narrow = svg(False), svg(True)
open(os.path.join(HERE, "fig-wide.svg"), "w").write(wide)
open(os.path.join(HERE, "fig-narrow.svg"), "w").write(narrow)
idx = os.path.join(HERE, "index.html")
if os.path.exists(idx):
    html = open(idx).read()
    html2 = re.sub(r"(<!-- FIG:START -->).*?(<!-- FIG:END -->)",
                   lambda m: m.group(1) + "\n" + wide + "\n" + narrow + "\n" + m.group(2), html, flags=re.S)
    open(idx, "w").write(html2)
    print("spliced" if html2 != html else "no change")
