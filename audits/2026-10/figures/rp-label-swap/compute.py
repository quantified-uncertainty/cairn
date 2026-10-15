#!/usr/bin/env python3
"""rp-label-swap: data + SVG for the figure on case-studies/measurement-log.

Every number is read from the committed run, never typed in:
  apps/reasoning-processes/experiments/label-swap/results/2026-10-15.json        (per-model summaries)
  apps/reasoning-processes/experiments/label-swap/results/2026-10-15.calls.jsonl (cell means of the example trial)
The estimators are the harness's own (label_swap.py, trial_stats):
  r = P(pick first-listed); position = mean r - .5; label = mean P(pick A) - .5;
  content = mean P(pick X) - .5, over the four cells AX AY BX BY.
The script re-derives the example trial's label/position bias from the raw calls and checks them
against the JSON trial row, then checks every displayed rounded value against the strings printed
in RESULTS.md / the page table. Run: python3 compute.py  -> writes figure.html and index.html.
"""
import json, math, statistics as st, os, html

REPO = "/home/user/cairn/apps/reasoning-processes/experiments/label-swap/results"
HERE = os.path.dirname(os.path.abspath(__file__))
D = json.load(open(f"{REPO}/2026-10-15.json"))
CALLS = [json.loads(l) for l in open(f"{REPO}/2026-10-15.calls.jsonl")]

NAMES = {  # display names as in the page's matched-condition table
    "anthropic/claude-sonnet-5.5": ("Claude Sonnet 5.5", "Claude"),
    "openai/gpt-6.1-sol": ("GPT-6.1 Sol", "GPT"),
    "google/gemini-4-argon": ("Gemini 4 Argon", "Gemini"),
    "deepseek/deepseek-v4-pro-0813": ("DeepSeek V4 Pro", "DeepSeek"),
    "qwen/qwen3.8-2.4t-a95b": ("Qwen3.8 2.4T", "Qwen"),
}

# ---------------- per-model rows (matched condition) ----------------
rows = []
for r in D["results"]:
    s = r["conditions"]["matched"]
    lab = s["label"]
    by_t = s["position_bias_by_template"]
    xs = list(by_t.values())
    se = st.stdev(xs) / math.sqrt(len(xs))
    tcrit = {2: 4.302653, 3: 3.182446}[len(xs) - 1]
    rows.append(dict(
        model=r["model"], name=NAMES[r["model"]][0], short=NAMES[r["model"]][1],
        n=s["trials"],
        pos=s["position_bias"]["est"] * 100, lo=s["position_bias"]["ci"][0] * 100, hi=s["position_bias"]["ci"][1] * 100,
        pos_dec=(st.mean(xs) * 100, (st.mean(xs) - tcrit * se) * 100, (st.mean(xs) + tcrit * se) * 100),
        rms=lab["omnibus_rms"] * 100, rms_med=lab["omnibus_rms_null_median"] * 100, rms95=lab["omnibus_rms_null_95"] * 100,
        flags=lab["flagged"], binp=lab["binom_p_vs_5pct"], omni=lab["omnibus_p"],
    ))

def f1(x):
    s = f"{x:+.1f}".replace("-", "−")
    return "−0.0" if s == "−0.0" else s

# Checks against the strings in RESULTS.md (matched table, in probability units) and the page (points).
EXPECT = {  # name: (position est, lo, hi in points, flags/trials, binom p string, rms, rms95)
    "Claude Sonnet 5.5": ("−0.6", "−1.3", "+0.2", "1/20", "0.64", "0.8", "0.5"),
    "GPT-6.1 Sol": ("−0.3", "−1.6", "+1.0", "0/20", "1.00", "0.6", "0.6"),
    "Gemini 4 Argon": ("−0.3", "−1.2", "+0.5", "3/20", "0.075", "1.5", "1.2"),
    "DeepSeek V4 Pro": ("+8.1", "+3.8", "+12.4", "4/15", "0.005", "3.3", "3.0"),
    "Qwen3.8 2.4T": ("+2.2", "−0.2", "+4.6", "2/15", "0.17", "2.0", "1.9"),
}
def pfmt(p):
    if p >= 0.995: return "1.00"
    if p < 0.01: return f"{p:.3f}"
    if p < 0.1: return f"{p:.3f}"
    return f"{p:.2f}"
for row in rows:
    e = EXPECT[row["name"]]
    got = (f1(row["pos"]), f1(row["lo"]), f1(row["hi"]), f"{row['flags']}/{row['n']}", pfmt(row["binp"]),
           f"{row['rms']:.1f}", f"{row['rms95']:.1f}")
    assert got == e, (row["name"], got, e)
    row["binp_s"] = pfmt(row["binp"])
ds = next(r for r in rows if r["short"] == "DeepSeek")
assert (round(ds["pos_dec"][1]), round(ds["pos_dec"][2])) == (-13, 29), ds["pos_dec"]  # RESULTS: [−0.13, +0.29]

# ---------------- the example trial: DeepSeek, hire, Option A / Option B ----------------
ex = [c for c in CALLS if c["model"] == "deepseek/deepseek-v4-pro-0813" and c["condition"] == "matched"
      and c["template"] == "hire" and c["pair"] == 0 and c.get("answer") is not None]
cell = {k: st.mean(c["answer"] for c in ex if c["cell"] == k) * 100 for k in ("AX", "AY", "BX", "BY")}
ncell = {k: sum(1 for c in ex if c["cell"] == k) for k in cell}
pos_ex = st.mean(cell.values()) - 50
lab_ex = (cell["AX"] + cell["AY"] + (100 - cell["BX"]) + (100 - cell["BY"])) / 4 - 50
con_ex = (cell["AX"] + (100 - cell["AY"]) + cell["BX"] + (100 - cell["BY"])) / 4 - 50
trow = next(t for r in D["results"] if r["model"].startswith("deepseek")
            for t in r["conditions"]["matched"]["trial_rows"] if t["template"] == "hire" and t["pair"][0] == "Option A")
assert abs(trow["label_bias"] * 100 - lab_ex) < 1e-9 and abs(trow["position_bias"] * 100 - pos_ex) < 1e-9
assert abs(trow["content_effect"] * 100 - con_ex) < 1e-9 and trow["flagged"]
assert all(abs(v - round(v)) < 1e-9 for v in cell.values()) and set(ncell.values()) == {5}
cell = {k: int(round(v)) for k, v in cell.items()}
ex_p = f"{trow['perm_p']:.3f}"
assert ex_p == "0.004"
# Identical condition: every parseable answer was 50.
ident = [c for c in CALLS if c["condition"] == "identical" and c.get("answer") is not None]
assert len(ident) == 998 and all(abs(c["answer"] - 0.5) < 1e-9 for c in ident)
# Pooled statistician rates quoted on the page (0.77 / 0.41).
hire = [c for c in CALLS if c["model"].startswith("deepseek") and c["condition"] == "matched"
        and c["template"] == "hire" and c.get("answer") is not None]
xf = st.mean(c["answer"] for c in hire if c["cell"][1] == "X")
yf = 1 - st.mean(c["answer"] for c in hire if c["cell"][1] == "Y")
assert (round(xf, 2), round(yf, 2)) == (0.77, 0.41)

print("cells", cell, "pos", pos_ex, "label", lab_ex, "content", con_ex, "p", ex_p)
for r in rows:
    print(f"{r['name']:18s} pos {r['pos']:+.2f} [{r['lo']:+.2f},{r['hi']:+.2f}] dec {tuple(round(x,1) for x in r['pos_dec'])} "
          f"rms {r['rms']:.2f} (med {r['rms_med']:.2f}, 95 {r['rms95']:.2f}) flags {r['flags']}/{r['n']} p {r['binp_s']}")

# ---------------- SVG ----------------
esc = html.escape
def T(x, y, s, cls="t", anchor="start", extra=""):
    return f'<text x="{x:.1f}" y="{y:.1f}" class="{cls}" text-anchor="{anchor}"{extra}>{s}</text>'
def L(x1, y1, x2, y2, cls):
    return f'<path class="{cls}" d="M{x1:.1f} {y1:.1f}L{x2:.1f} {y2:.1f}"/>'
def arrow_down(x, y1, y2):
    return (L(x, y1, x, y2, "ls-arrow") +
            f'<path class="ls-arrow" d="M{x-4:.1f} {y2-6:.1f}L{x:.1f} {y2:.1f}L{x+4:.1f} {y2-6:.1f}"/>')

ACC = {"DeepSeek"}  # the only model whose results clear chance (position CI, flag count)

def panel_a(W, narrow):
    """The 2x2 cell layout for the example trial, the label-swap arrows and the three contrasts."""
    o = []
    y = 20
    if narrow:
        o.append(T(0, y, "How one trial is scored", "b"))
        o.append(T(0, y + 20, "DeepSeek V4 Pro, analyst hire, Option A / B", "m"))
        o.append(T(0, y + 40, "Cell: mean answer, % chance of hiring", "m sm"))
        o.append(T(0, y + 58, "whoever is listed first (5 replies each)", "m sm"))
        y += 58
    else:
        o.append(T(0, y, "How one trial is scored: DeepSeek V4 Pro, analyst hire, Option A / Option B", "b"))
        o.append(T(0, y + 22, "Each cell is the mean of 5 answers: the % chance of hiring whoever is listed first.", "m"))
        y += 22
    # grid geometry
    if narrow:
        gx, cw, gap, rowh, rgap = 104, 112, 10, 52, 40
    else:
        gx, cw, gap, rowh, rgap = 190, 220, 16, 70, 44
    cx = [gx, gx + cw + gap]
    hy = y + (34 if narrow else 40)
    heads = (["Statistician", "Economist"] if narrow else ["Statistician listed first", "Economist listed first"])
    for i, h in enumerate(heads):
        o.append(T(cx[i] + cw / 2, hy, h, "t", "middle"))
        if narrow:
            o.append(T(cx[i] + cw / 2, hy + 18, "listed first", "m sm", "middle"))
    top = hy + (30 if narrow else 14)
    ry = [top, top + rowh + rgap]
    lab = ["Option A", "Option B"]
    keys = [["AX", "AY"], ["BX", "BY"]]
    for j in range(2):
        if narrow:
            o.append(T(gx - 12, ry[j] + rowh / 2 - 3, f"{lab[j]}", "t", "end"))
            o.append(T(gx - 12, ry[j] + rowh / 2 + 15, "listed first", "m sm", "end"))
        else:
            o.append(T(gx - 14, ry[j] + rowh / 2 + 5, f"{lab[j]} listed first", "t", "end"))
        for i in range(2):
            k = keys[j][i]
            o.append(f'<rect class="ls-cell" x="{cx[i]:.1f}" y="{ry[j]:.1f}" width="{cw}" height="{rowh}" rx="3"/>')
            if narrow:
                o.append(T(cx[i] + cw / 2, ry[j] + rowh / 2 + 8, str(cell[k]), "num", "middle"))
            else:
                first = lab[j]; second = lab[1 - j]
                d1, d2 = ("statistician", "economist") if k[1] == "X" else ("economist", "statistician")
                o.append(T(cx[i] + 14, ry[j] + 28, f"{first}: {d1}", "m sm"))
                o.append(T(cx[i] + 14, ry[j] + 50, f"{second}: {d2}", "m sm"))
                o.append(T(cx[i] + cw - 16, ry[j] + 46, str(cell[k]), "num", "end"))
    # label-swap arrows between the rows (same descriptions, same positions, labels swapped)
    for i in range(2):
        ax = cx[i] + (12 if narrow else 30)
        y1, y2 = ry[0] + rowh + 5, ry[1] - 5
        o.append(arrow_down(ax, y1, y2))
        a, b = cell[keys[0][i]], cell[keys[1][i]]
        txt = f"labels swapped: {a} → {b}" if not narrow else f"swap: {a} → {b}"
        o.append(T(ax + 8, (y1 + y2) / 2 + 5, txt, "m sm"))
    y = ry[1] + rowh
    # contrasts
    A = cell
    lines = [
        ("Position bias", "mean answer − 50", f"({A['AX']} + {A['AY']} + {A['BX']} + {A['BY']}) / 4 − 50", pos_ex),
        ("Label bias", "mean P(pick Option A) − 50", f"({A['AX']} + {A['AY']} + {100-A['BX']} + {100-A['BY']}) / 4 − 50", lab_ex),
        ("Content effect", "mean P(pick statistician) − 50", f"({A['AX']} + {100-A['AY']} + {A['BX']} + {100-A['BY']}) / 4 − 50", con_ex),
    ]
    y += 36 if not narrow else 34
    for name, defn, arith, val in lines:
        v = f1(val)
        if narrow:
            o.append(T(0, y, f'<tspan class="b">{name}</tspan><tspan class="m"> = {defn}</tspan>', "t"))
            o.append(T(16, y + 19, f"{arith} = {v}", "t sm"))
            y += 46
        else:
            o.append(T(0, y, f'<tspan class="b">{name}</tspan><tspan class="m"> = {defn}</tspan>', "t"))
            o.append(T(W, y, f"{arith} = {v}", "t", "end"))
            y += 26
    y += 4 if not narrow else 6
    notes = ([f"All four answers are above 50, so whoever is listed first is favored.",
              f"Swapping only the labels raised both columns: a lean to Option B (permutation p = {ex_p}).",
              "With identical descriptions (2 cells per trial), all 998 parseable answers were exactly 50."]
             if not narrow else
             ["All four answers exceed 50: the first-listed", "candidate is favored. Swapping only the labels",
              f"raised both columns: a lean to Option B", f"(p = {ex_p}). With identical descriptions, all",
              "998 parseable answers were exactly 50."])
    for n in notes:
        o.append(T(0, y, n, "m sm" if narrow else "m"))
        y += 20 if narrow else 22
    return o, y

def axis(o, x0, x1, ybot, ticks, scale, fmt):
    o.append(L(x0, ybot, x1, ybot, "ls-axis"))
    for t in ticks:
        x = scale(t)
        o.append(L(x, ybot, x, ybot + 4, "ls-axis"))
        o.append(T(x, ybot + 20, fmt(t), "m sm", "middle"))

def pos_col(o, x0, x1, ys, ytop, ybot, narrow, short_label):
    lo_, hi_ = -5, 15
    sc = lambda v: x0 + (v - lo_) / (hi_ - lo_) * (x1 - x0)
    o.append(L(sc(0), ytop, sc(0), ybot, "ls-zero"))
    for r, y in zip(rows, ys):
        acc = r["short"] in ACC
        if acc:  # decisions-as-unit interval runs off both ends
            dy = y + 13
            o.append(L(x0 + 6, dy, x1 - 6, dy, "ls-dash"))
            o.append(f'<path class="ls-arrowhead" d="M{x0+6:.1f} {dy-3.5:.1f}L{x0:.1f} {dy:.1f}L{x0+6:.1f} {dy+3.5:.1f}"/>')
            o.append(f'<path class="ls-arrowhead" d="M{x1-6:.1f} {dy-3.5:.1f}L{x1:.1f} {dy:.1f}L{x1-6:.1f} {dy+3.5:.1f}"/>')
        o.append(L(sc(r["lo"]), y, sc(r["hi"]), y, "ls-ci" + (" acc" if acc else "")))
        o.append(f'<circle class="ls-dot{" acc" if acc else ""}" cx="{sc(r["pos"]):.1f}" cy="{y:.1f}" r="4"/>')
        o.append(T(sc(r["hi"]) + 8, y + 5, f1(r["pos"]), "a sm halo" if acc else "m sm halo"))
    axis(o, x0, x1, ybot, [-5, 0, 5, 10, 15], sc, lambda t: f1(t).replace(".0", "") if t else "0")
    return sc

def rms_col(o, x0, x1, ys, ybot):
    hi_ = 4.0
    sc = lambda v: x0 + v / hi_ * (x1 - x0)
    for r, y in zip(rows, ys):
        o.append(f'<rect class="ls-noise" x="{sc(r["rms_med"]):.1f}" y="{y-5:.1f}" width="{sc(r["rms95"])-sc(r["rms_med"]):.1f}" height="10" rx="2"/>')
        o.append(f'<circle class="ls-dot" cx="{sc(r["rms"]):.1f}" cy="{y:.1f}" r="4"/>')
        o.append(T(max(sc(r["rms"]), sc(r["rms95"])) + 8, y + 5, f"{r['rms']:.1f}", "m sm"))
    axis(o, x0, x1, ybot, [0, 1, 2, 3, 4], sc, lambda t: str(t))

def flag_col(o, x0, x1, ys, ytop, ybot, text_x=None, text_dy=0):
    hi_ = 0.30
    sc = lambda v: x0 + v / hi_ * (x1 - x0)
    o.append(L(sc(0.05), ytop + 20, sc(0.05), ybot, "ls-ref"))
    o.append(T(sc(0.05) + 4, ytop + 18, "5% chance", "m sm halo"))
    for r, y in zip(rows, ys):
        acc = r["short"] in ACC
        rate = r["flags"] / r["n"]
        o.append(L(x0, y, sc(rate), y, "ls-stem" + (" acc" if acc else "")))
        o.append(f'<circle class="ls-dot{" acc" if acc else ""}" cx="{sc(rate):.1f}" cy="{y:.1f}" r="4"/>')
        tx = text_x if text_x is not None else x0
        lab = f"{r['flags']} of {r['n']}, p = {r['binp_s']}"
        if text_x is None:  # label sits under the dashed 5% line: mask the line behind it
            o.append(f'<rect class="ls-mask" x="{tx-2:.1f}" y="{y+text_dy-8:.1f}" width="{len(lab)*7.6+4:.1f}" height="18"/>')
        o.append(T(tx, y + text_dy + 5, f"{r['flags']} of {r['n']}, p = {r['binp_s']}", ("a sm halo" if acc else "m sm halo")))
    axis(o, x0, x1, ybot, [0, 0.1, 0.2, 0.3], sc, lambda t: f"{round(t*100)}%" if t in (0, 0.3) else f"{round(t*100)}")

def panel_b_wide(W, y0):
    o = []
    y = y0
    o.append(T(0, y, "All five models, matched condition, in points on the 0–100 scale", "b"))
    o.append(T(0, y + 22, "Grey bars: what noise alone produces (median to 95th percentile). Flags are tested", "m"))
    o.append(T(0, y + 42, "against a 5% false-positive rate (binomial p). Accent: results that clear chance.", "m"))
    y += 82
    c1, c2, c3 = (170, 360), (392, 532), (566, W)
    o.append(T(c1[0], y, "Position bias, 95% CI", "t"))
    o.append(T(c2[0], y, "RMS label bias", "t"))
    o.append(T(c3[0], y, "Trials flagged", "t"))
    y += 14
    o.append(L(0, y, W, y, "ls-hair"))
    ytop = y
    ys, cur = [], y + 42
    for r in rows:
        ys.append(cur)
        o.append(T(0, cur + 5, r["name"], "t"))
        o.append(T(0, cur + 25, f"{r['n']} trials", "m sm"))
        cur += 62 if r["short"] in ACC else 52
    ybot = cur - 14
    sc = pos_col(o, c1[0], c1[1], ys, ytop, ybot, False, False)
    d = ds["pos_dec"]
    yd = ys[rows.index(ds)] + 33
    o.append(f'<rect class="ls-mask" x="{c1[0]+3:.1f}" y="{yd-13:.1f}" width="{245:.1f}" height="18"/>')
    o.append(T(c1[0] + 6, yd, f"[{round(d[1]):+d}, {round(d[2]):+d}] with decisions as the unit".replace("-", "−"), "a sm halo"))
    rms_col(o, c2[0], c2[1], ys, ybot)
    flag_col(o, c3[0], c3[1] - 30, ys, ytop, ybot, text_dy=20)
    return o, ybot + 30

def panel_b_narrow(W, y0):
    o = []
    y = y0
    o.append(T(0, y, "All five models, matched condition", "b"))
    for s in ["Points on the 0–100 scale. Accent: results", "that clear chance."]:
        y += 20; o.append(T(0, y, s, "m sm"))
    x0, x1 = 84, W - 40
    def block(title, sub, fn, extra_rows_h=0, first=18):
        nonlocal y
        y += 34
        o.append(T(0, y, title, "t"))
        for s in sub:
            y += 19; o.append(T(0, y, s, "m sm"))
        y += 10
        ytop = y
        ys = []
        cur = y + first
        for r in rows:
            ys.append(cur)
            o.append(T(0, cur + 5, r["short"], "t"))
            cur += 30 + (14 if (extra_rows_h and r["short"] in ACC) else 0)
        ybot = cur - 10
        fn(ys, ytop, ybot)
        y = ybot + 24
    def pos(ys, ytop, ybot):
        pos_col(o, x0, x1, ys, ytop, ybot, True, True)
    block("Position bias, 95% CI", ["Dashed: DeepSeek with decisions as the", f"unit, [{round(ds['pos_dec'][1]):+d}, {round(ds['pos_dec'][2]):+d}]".replace("-", "−")], pos, 1)
    def rms(ys, ytop, ybot):
        rms_col(o, x0, x1, ys, ybot)
    block("RMS label bias", ["Grey bar: noise alone, median to 95th pct"], rms)
    def flags(ys, ytop, ybot):
        flag_col(o, x0, x0 + 110, ys, ytop, ybot, text_x=x0 + 122)
    y -= 10
    block("Share of trials flagged", ["p: binomial test against a 5% rate"], flags, first=40)
    return o, y - 4

def svg(narrow):
    W = 343 if narrow else 720
    a, ya = panel_a(W, narrow)
    ya += 18
    sep = [L(0, ya, W, ya, "ls-hair")]
    b, yb = (panel_b_narrow if narrow else panel_b_wide)(W, ya + 34)
    H = math.ceil(yb + 4)
    label = ("Two-part figure. Top: one trial of the label-swap design, DeepSeek V4 Pro on the analyst hire with labels "
             f"Option A and Option B. The four cells cross which label is listed first with which candidate is listed first; "
             f"mean answers are {cell['AX']}, {cell['AY']}, {cell['BX']}, {cell['BY']}. All four are above 50, giving position bias "
             f"{f1(pos_ex)}; swapping only the labels raises both columns, giving label bias {f1(lab_ex)} points. "
             "Bottom: for five models, position bias with 95% intervals, RMS label bias against its noise-only range, and flagged trials "
             "against the 5% chance rate. Only DeepSeek V4 Pro clears chance: position bias +8.1 points [+3.8, +12.4] and 4 of 15 trials flagged.")
    cls = "ls-narrow" if narrow else "ls-wide"
    fs = 14 if narrow else 15
    return (f'<svg class="ls-svg {cls}" viewBox="0 0 {W} {H}" width="{W}" height="{H}" role="img" '
            f'aria-label="{esc(label)}" style="font-size:{fs}px">\n' + "\n".join(a + sep + b) + "\n</svg>")

STYLE = """<style>
.ls-fig {
  --ls-text: #2e2c28; --ls-muted: #5f5b53; --ls-lines: #8f897e; --ls-hair: #d6d1c7; --ls-bg: #ffffff;
  --ls-accent: #2a57a6; --ls-cell: #f7f6f3; --ls-noise: #d6d1c7;
  margin: 2rem 0; font-family: ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}
:root[data-theme='dark'] .ls-fig {
  --ls-text: #dcd7cd; --ls-muted: #a7a195; --ls-lines: #8f897e; --ls-hair: #45423c; --ls-bg: #161514;
  --ls-accent: #9dbdf2; --ls-cell: #1e1d1b; --ls-noise: #5a564e;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme='light']) .ls-fig {
    --ls-text: #dcd7cd; --ls-muted: #a7a195; --ls-lines: #8f897e; --ls-hair: #45423c; --ls-bg: #161514;
    --ls-accent: #9dbdf2; --ls-cell: #1e1d1b; --ls-noise: #5a564e;
  }
}
.ls-svg { display: block; width: 100%; height: auto; max-width: 720px; overflow: visible; font-family: inherit; }
.ls-narrow { display: none; max-width: 400px; }
@media (max-width: 34rem) { .ls-wide { display: none; } .ls-narrow { display: block; } }
.ls-fig .t { fill: var(--ls-text); }
.ls-fig .m { fill: var(--ls-muted); }
.ls-fig .b { fill: var(--ls-text); font-weight: 600; }
.ls-fig .a { fill: var(--ls-accent); }
.ls-fig .sm { font-size: 0.93em; }
.ls-fig .num { fill: var(--ls-text); font-size: 1.4em; font-weight: 600; font-variant-numeric: tabular-nums; }
.ls-cell { fill: var(--ls-cell); stroke: var(--ls-hair); stroke-width: 1; }
.ls-hair { fill: none; stroke: var(--ls-hair); stroke-width: 1; }
.ls-axis { fill: none; stroke: var(--ls-lines); stroke-width: 1; }
.ls-zero { fill: none; stroke: var(--ls-lines); stroke-width: 1; }
.ls-arrow { fill: none; stroke: var(--ls-muted); stroke-width: 1.25; stroke-linecap: round; stroke-linejoin: round; }
.ls-arrowhead { fill: none; stroke: var(--ls-accent); stroke-width: 1.25; stroke-linecap: round; stroke-linejoin: round; }
.ls-dash { fill: none; stroke: var(--ls-accent); stroke-width: 1.25; stroke-dasharray: 3 4; }
.ls-ci { fill: none; stroke: var(--ls-text); stroke-width: 2; stroke-linecap: round; }
.ls-ci.acc { stroke: var(--ls-accent); }
.ls-dot { fill: var(--ls-text); stroke: var(--ls-bg); stroke-width: 1.5; }
.ls-dot.acc { fill: var(--ls-accent); }
.ls-noise { fill: var(--ls-noise); }
.ls-ref { fill: none; stroke: var(--ls-lines); stroke-width: 1; stroke-dasharray: 3 3; }
.ls-stem { fill: none; stroke: var(--ls-lines); stroke-width: 1; }
.ls-stem.acc { stroke: var(--ls-accent); }
.ls-mask { fill: var(--ls-bg); }
.ls-fig .halo { paint-order: stroke; stroke: var(--ls-bg); stroke-width: 4px; stroke-linejoin: round; }
.ls-fig figcaption { margin-top: 0.75rem; font-size: 0.9375rem; line-height: 1.55; color: var(--ls-muted); max-width: 42rem; }
</style>"""

CAPTION = ("The label-swap test isolates a judge’s lean toward a label by swapping only the labels between otherwise "
           "identical prompts; the mean answer over all four cells gives position bias. On five models, label leans sit "
           "just above what noise alone produces, and only DeepSeek V4 Pro clears chance, on position bias and on its "
           "flag count. Most of that comes from the analyst-hire prompt shown on top. DeepSeek and Qwen have 15 trials "
           "because every forecast trial lost replies to truncation.")

FIG = (STYLE + '\n<figure class="ls-fig">\n' + svg(False) + "\n" + svg(True) +
       f"\n<figcaption>{esc(CAPTION)}</figcaption>\n</figure>\n")

open(os.path.join(HERE, "figure.html"), "w").write(FIG)

PAGE = f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Measurement Log</title>
<style>
:root {{ --text: #2e2c28; --muted: #5f5b53; --bg: #ffffff; --accent: #2a57a6; }}
:root[data-theme='dark'] {{ --text: #dcd7cd; --muted: #a7a195; --bg: #161514; --accent: #9dbdf2; }}
@media (prefers-color-scheme: dark) {{ :root:not([data-theme='light']) {{ --text: #dcd7cd; --muted: #a7a195; --bg: #161514; --accent: #9dbdf2; }} }}
html {{ background: var(--bg); }}
body {{ margin: 0; background: var(--bg); color: var(--text); font-family: ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 17px; line-height: 1.6; }}
main {{ max-width: 45rem; margin: 0 auto; padding: 2.5rem 16px 3rem; }}
h1 {{ font-size: 1.125rem; font-weight: 600; margin: 0 0 1.25rem; color: var(--muted); }}
p {{ margin: 0 0 1rem; }}
a {{ color: var(--accent); }}
</style>
</head>
<body>
<main>
<h1>Measurement Log</h1>
<p><strong>Matched condition.</strong> Two different but comparable descriptions are crossed with the labels. This is the audit-study layout of Bertrand &amp; Mullainathan (2004). It removes the cue that 50 is the expected answer. Label bias is a trial’s mean P(pick the first label of the pair) − 0.5; position bias is the mean P(pick the first-listed option) − 0.5. Each trial gets an exact permutation p-value, and a trial is flagged at p &lt; 0.05 with a lean of at least 2 points.</p>
<p><strong>Identical condition: null.</strong> Every parseable answer from every model was exactly 50. That covers 998 of 1,000 calls; the other two, both Qwen, were truncated. This is weak evidence of neutrality, because a model that has learned “identical options → 50” gives that answer whatever lean it has.</p>
{FIG}
<p><strong>Position bias is clear for one model, in one decision.</strong> DeepSeek V4 Pro’s +8.1 comes mostly from the analyst hire. It picks the statistician with probability 0.77 when that candidate is listed first, and 0.41 when listed second. The five label pairs in a decision share its descriptions, so trials are not independent. Taking decisions as the unit, the interval is [−13, +29] points.</p>
</main>
</body>
</html>
"""
open(os.path.join(HERE, "index.html"), "w").write(PAGE)
print("wrote figure.html, index.html")
