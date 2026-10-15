#!/usr/bin/env python3
"""dr-harm-channels: computes every number in the figure from the pages' own values,
then writes figure.html (fragment) and index.html (preview).

Sources (read-only):
  apps/delegation-risk/src/content/docs/delegation-risk/risk-decomposition.md   (channels, routes, table)
  apps/delegation-risk/src/content/docs/delegation-risk/index.md                (harm table, coordinator row)
  apps/delegation-risk/src/content/docs/delegation-risk/risk-propagation.md     (beta-factor mixture, minimum rule)
"""
import html, pathlib

OUT = pathlib.Path(__file__).resolve().parent

# ---------------------------------------------------------------- numbers
# Harm table from the section overview (index.md): (component, mode, channel, P/month, damage)
ROWS = [
    ("Coordinator", "Misroutes a task", "Accident", 0.01, 2_000),
    ("Coordinator", "Grants excessive permissions by mistake", "Accident", 0.003, 100_000),
    ("Coordinator", "Grants excessive permissions deliberately", "Defection", 0.002, 100_000),
    ("Summarizer", "Misrepresents a paper's findings", "Accident", 0.02, 5_000),
    ("Summarizer", "Follows injected instructions, leaks data", "Hijack", 0.002, 50_000),
    ("Code deployer", "Ships buggy code", "Accident", 0.05, 20_000),
    ("Code deployer", "Special-cases or edits tests", "Defection", 0.01, 20_000),
    ("Code deployer", "Inserts deliberately malicious code", "Defection", 0.0001, 1_000_000),
]
by_channel = {}
for _, _, ch, p, d in ROWS:
    by_channel[ch] = by_channel.get(ch, 0) + p * d
total = sum(by_channel.values())
# risk-decomposition.md table: $1,420 / $500 / $100, total $2,020, shares 70 / 25 / 5
assert round(by_channel["Accident"]) == 1420
assert round(by_channel["Defection"]) == 500
assert round(by_channel["Hijack"]) == 100
assert round(total) == 2020
shares = {k: round(100 * v / total) for k, v in by_channel.items()}
assert shares == {"Accident": 70, "Defection": 25, "Hijack": 5}, shares

# Coordinator's permission-grant rows: same damage, two channels (risk-decomposition.md)
D_GRANT = 100_000
grant = {"Accident": 0.003 * D_GRANT, "Defection": 0.002 * D_GRANT}
assert round(grant["Accident"]) == 300 and round(grant["Defection"]) == 200

# Stack of three checks, each missing p = 10% (risk-propagation.md's running example).
# Beta-factor mixture: P(first k layers all miss) = (1-rho) * p**k + rho * p   (k >= 1)
P_MISS, K = 0.10, 3
def still_going(k, rho):
    return 1.0 if k == 0 else (1 - rho) * P_MISS ** k + rho * P_MISS

benign = [still_going(k, 0.0) for k in range(K + 1)]   # accident, independent checks
benign05 = [still_going(k, 0.5) for k in range(K + 1)]  # accident, rho = 0.5 (assumed for shared provider)
adversarial = [still_going(k, 1.0) for k in range(K + 1)]  # defection / hijack: minimum rule
assert abs(benign[3] - 0.001) < 1e-12 and abs(adversarial[3] - 0.1) < 1e-12
assert abs(benign05[3] - 0.0505) < 1e-12  # risk-propagation.md: 0.051 at rho = 0.5

def pct(x):
    v = 100 * x
    if v >= 99.5:
        return "100%"
    if v >= 9.95:
        return f"{v:.0f}%"
    if v >= 0.995:
        return f"{v:.0f}%" if abs(v - round(v)) < 0.05 else f"{v:.1f}%"
    return f"{v:.1f}%"

BENIGN = [pct(x) for x in benign]          # 100% 10% 1% 0.1%
ADV = [pct(x) for x in adversarial]        # 100% 10% 10% 10%
RHO05_FINAL = f"{100 * benign05[3]:.0f}%"  # 5%
assert BENIGN == ["100%", "10%", "1%", "0.1%"], BENIGN
assert ADV == ["100%", "10%", "10%", "10%"], ADV
assert RHO05_FINAL == "5%"

# ---------------------------------------------------------------- drawing helpers
def esc(s):
    return html.escape(s, quote=True)

def text(x, y, s, cls="t", anchor="start", extra=""):
    a = "" if anchor == "start" else f' text-anchor="{anchor}"'
    return f'<text x="{x:g}" y="{y:g}" class="{cls}"{a}{extra}>{s}</text>'

def line(x1, y1, x2, y2, cls, w=None):
    sw = f' stroke-width="{w:g}"' if w is not None else ""
    return f'<line x1="{x1:g}" y1="{y1:g}" x2="{x2:g}" y2="{y2:g}" class="{cls}"{sw}/>'

def head_right(x, y, cls, s=7):
    """Arrowhead whose tip is at (x, y), pointing right."""
    return f'<path d="M{x:g} {y:g} L{x - s * 1.25:g} {y - s * 0.62:g} L{x - s * 1.25:g} {y + s * 0.62:g} Z" class="{cls}"/>'

def head_up(x, y, cls, s=7):
    return f'<path d="M{x:g} {y:g} L{x - s * 0.62:g} {y + s * 1.25:g} L{x + s * 0.62:g} {y + s * 1.25:g} Z" class="{cls}"/>'

def head_down(x, y, cls, s=7):
    return f'<path d="M{x:g} {y:g} L{x - s * 0.62:g} {y - s * 1.25:g} L{x + s * 0.62:g} {y - s * 1.25:g} Z" class="{cls}"/>'

# Accident line thins after each check (the flow that is left); adversarial lines stay full.
BENIGN_W = [2.0, 1.4, 0.9, 0.6]
ADV_W = [2.0, 2.0, 2.0, 2.0]

CLAIM = ("The channel decides who chooses the harmful action and how much a stack of checks is worth "
         "against it; it does not change the damage. Three checks that each miss 10% let through 0.1% "
         "of accidental harmful actions if they fail independently, but a delegate or attacker who picks "
         "the action defeats all three at once, so at least 10% get through. Keeping untrusted data from choosing "
         "actions, and a hard envelope, do not depend on which action arrives.")

LANES = [
    # key, title, who chooses, what sets P, origin label in the delegate, adversarial?
    ("acc", "Accident", "nobody chooses it", "P: its error rate", "error", False),
    ("def", "Defection", "the delegate chooses", "P: its disposition", "own goal", True),
    ("hij", "Hijack", "someone else chooses", "P: attacker's choices", "obeys", True),
]
NOTES = {
    "acc": ["errors land at random, so the", f"checks compound ({RHO05_FINAL} if ρ = 0.5)"],
    "def": ["it picks an action all three miss"],
    "hij": ["the attacker picks an input", "all three miss"],
}

def lane_line(o, y, adv, dot_x, checks, env_x, end_x, left_edge, label_y_off=8):
    xs = [dot_x + 4] + checks + [end_x]
    ws = ADV_W if adv else BENIGN_W
    labels = ADV if adv else BENIGN
    lcls = "la" if adv else "ll"
    for j, (w, lab) in enumerate(zip(ws, labels)):
        a, b = xs[j], xs[j + 1]
        o.append(line(a, y, b - (9 if j == 3 else 0), y, lcls, w))
        if lab is None:
            continue
        mid = (max(a, left_edge) + (b if j < 3 else env_x)) / 2
        o.append(text(mid, y - label_y_off, lab, "t a" if adv else "t", "middle"))
    o.append(head_right(end_x, y, "fa" if adv else "fl"))

# ---------------------------------------------------------------- wide (desktop) variant
def wide():
    W, H = 720, 490
    o = []
    yc = [116, 220, 324]           # lane centres
    top, bot = 70, 366             # extent of shared column elements
    bx0, bx1 = 168, 268            # delegate box
    dot_x = 252
    checks = [342, 406, 470]
    env_x = 556
    dx0, dx1 = 588, 720            # damage box
    ck = (checks[0] + checks[-1]) / 2

    o.append(text(ck, 28, "Three checks, each missing 10%", "t b", "middle"))
    o.append(text(ck, 48, "share of harmful actions still going", "t m", "middle"))

    o.append(f'<rect x="{bx0}" y="{top}" width="{bx1 - bx0}" height="{bot - top}" rx="6" class="box"/>')
    o.append(text((bx0 + bx1) / 2, top + 24, "Delegate", "t b", "middle"))

    o.append(f'<rect x="{dx0}" y="{top}" width="{dx1 - dx0 - 1}" height="{bot - top}" rx="6" class="box"/>')
    cx = (dx0 + dx1 - 1) / 2
    o.append(text(cx, top + 24, "Damage D", "t b", "middle"))
    o.append(text(cx, top + 44, "to the principal", "t m", "middle"))
    for i, s in enumerate(["set by what the", "action can reach,", "the same for", "every channel"]):
        o.append(text(cx, yc[1] - 28 + 19 * i, s, "t m", "middle"))
    for i, s in enumerate(["A coordinator's", "permission grant", f"costs ${D_GRANT:,}", "either way"]):
        o.append(text(cx, yc[2] - 22 + 19 * i, s, "t m", "middle"))

    o.append(line(env_x, top - 6, env_x, bot + 6, "wall"))
    for y in yc:
        for x in checks:
            o.append(line(x, y - 17, x, y + 17, "chk"))

    for (key, title, who, pline, origin, adv), y in zip(LANES, yc):
        o.append(text(0, y - 16, title, "t b"))
        o.append(text(0, y + 5, who, "t m"))
        o.append(text(0, y + 25, pline, "t m"))
        o.append(f'<circle cx="{dot_x}" cy="{y}" r="4" class="{"fa" if adv else "fl"}"/>')
        o.append(text(dot_x - 10, y + 5, origin, "t", "end"))
        lane_line(o, y, adv, dot_x, checks, env_x, dx0 - 1, bx1)
        for i, s in enumerate(NOTES[key]):
            o.append(text(ck, y + 37 + 19 * i, s, "t a" if adv else "t m", "middle"))

    # hijack entry from below
    ay0, tip = 456, yc[2] + 5
    o.append(line(dot_x, ay0, dot_x, tip + 8, "ll", 1.5))
    o.append(head_up(dot_x, tip, "fl"))
    cut_y = 396
    o.append(line(dot_x - 12, cut_y, dot_x + 12, cut_y, "cut"))
    o.append(text(dot_x - 20, cut_y - 4, "cut: data may fill in values,", "t", "end"))
    o.append(text(dot_x - 20, cut_y + 15, "not choose actions", "t", "end"))
    o.append(text(dot_x + 10, 438, "injected instructions", "t"))
    o.append(text(dot_x, 480, "via a prompt, retrieved content, a tool or a dependency", "t m", "middle"))

    # envelope label, under the wall
    o.append(text(env_x, 396, "Hard envelope", "t b", "middle"))
    o.append(text(env_x, 416, "limits what any action", "t", "middle"))
    o.append(text(env_x, 435, "can reach, whoever chose it", "t", "middle"))
    return W, H, "\n    ".join(o)

# ---------------------------------------------------------------- narrow (mobile) variant
def narrow():
    W = 343
    o = []
    bx0, bx1 = 0.5, 88
    dot_x = 76
    checks = [142, 184, 226]
    env_x = 268
    dx0, dx1 = 284, 343
    ck = (checks[0] + checks[-1]) / 2
    lane_h = 150
    first = 92

    o.append(text(ck, 16, "Three checks,", "t b", "middle"))
    o.append(text(ck, 35, "each missing 10%", "t b", "middle"))
    o.append(text(ck, 54, "share still going", "t m", "middle"))
    o.append(text(0, 54, "Delegate", "t b"))
    o.append(text(dx1, 54, "Damage", "t b", "end"))

    yls = []
    for i, (key, title, who, pline, origin, adv) in enumerate(LANES):
        y0 = first + i * lane_h
        yl = y0 + 58
        yls.append(yl)
        who_full = {"acc": "nobody chooses it", "def": "the delegate chooses it",
                    "hij": "someone else chooses it"}[key]
        p_full = {"acc": "P is set by its error rate", "def": "P is set by its disposition",
                  "hij": "P is set by the attacker's choices"}[key]
        o.append(f'<text x="0" y="{y0}" class="t"><tspan class="b">{title}:</tspan> <tspan class="m">{esc(who_full)}</tspan></text>')
        o.append(text(0, y0 + 19, p_full, "t m"))
        o.append(f'<rect x="{bx0}" y="{yl - 20}" width="{bx1 - bx0}" height="40" rx="5" class="box"/>')
        o.append(f'<circle cx="{dot_x}" cy="{yl}" r="4" class="{"fa" if adv else "fl"}"/>')
        o.append(text(dot_x - 9, yl + 5, origin, "t", "end"))
        o.append(f'<rect x="{dx0}" y="{yl - 20}" width="{dx1 - dx0 - 0.5}" height="40" rx="5" class="box"/>')
        o.append(text((dx0 + dx1) / 2, yl + 5, "D", "t b", "middle"))
        o.append(line(env_x, yl - 24, env_x, yl + 24, "wall"))
        for x in checks:
            o.append(line(x, yl - 15, x, yl + 15, "chk"))
        lane_line(o, yl, adv, dot_x, checks, env_x, dx0 - 1, bx1)
        for j, s in enumerate(NOTES[key]):
            o.append(text(bx1 + 10, yl + 42 + 19 * j, s, "t a" if adv else "t m"))

    yl = yls[-1]
    ay0 = yl + 150
    o.append(line(dot_x, ay0, dot_x, yl + 13, "ll", 1.5))
    o.append(head_up(dot_x, yl + 5, "fl"))
    cut_y = yl + 86
    o.append(line(dot_x - 11, cut_y, dot_x + 11, cut_y, "cut"))
    o.append(text(dot_x + 20, cut_y + 5, "cut: data may fill in values,", "t"))
    o.append(text(dot_x + 20, cut_y + 24, "not choose actions", "t"))
    o.append(text(dot_x + 20, yl + 136, "injected instructions", "t"))
    o.append(text(0, ay0 + 24, "via a prompt, retrieved content, a tool or", "t m"))
    o.append(text(0, ay0 + 43, "a dependency", "t m"))
    yb = ay0 + 86
    o.append(line(4, yb - 15, 4, yb + 24, "wall"))
    o.append(f'<text x="18" y="{yb}" class="t"><tspan class="b">Thick bar: hard envelope.</tspan></text>')
    o.append(text(18, yb + 19, "It limits what any action can reach,", "t"))
    o.append(text(18, yb + 38, "whoever chose it.", "t"))
    yd = yb + 76
    o.append(text(0, yd, "D is set by what the action can reach, the", "t m"))
    o.append(text(0, yd + 19, "same for every channel: a coordinator's", "t m"))
    o.append(text(0, yd + 38, f"permission grant costs ${D_GRANT:,}, mistaken", "t m"))
    o.append(text(0, yd + 57, "or deliberate.", "t m"))
    H = yd + 66
    return W, H, "\n    ".join(o)

# ---------------------------------------------------------------- page assembly
STYLE = """<style>
  .dr-harm-channels {
    --hc-text: #2e2c28; --hc-muted: #5f5b53; --hc-line: #8f897e; --hc-hair: #d6d1c7;
    --hc-bg: #ffffff; --hc-accent: #a8321f;
    container-type: inline-size;
    margin: 2rem 0;
  }
  :root[data-theme="dark"] .dr-harm-channels {
    --hc-text: #dcd7cd; --hc-muted: #a7a195; --hc-line: #8f897e; --hc-hair: #45423c;
    --hc-bg: #161514; --hc-accent: #f29a84;
  }
  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) .dr-harm-channels {
      --hc-text: #dcd7cd; --hc-muted: #a7a195; --hc-line: #8f897e; --hc-hair: #45423c;
      --hc-bg: #161514; --hc-accent: #f29a84;
    }
  }
  .dr-harm-channels svg { display: block; width: 100%; height: auto; overflow: visible; }
  .dr-harm-channels .hc-wide { max-width: 720px; }
  .dr-harm-channels .hc-narrow { display: none; max-width: 420px; }
  @container (max-width: 600px) {
    .dr-harm-channels .hc-wide { display: none; }
    .dr-harm-channels .hc-narrow { display: block; }
  }
  .dr-harm-channels text {
    font-family: ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    font-size: 14px; fill: var(--hc-text);
  }
  .dr-harm-channels .b { font-weight: 600; font-size: 15px; }
  .dr-harm-channels .m { fill: var(--hc-muted); }
  .dr-harm-channels .a { fill: var(--hc-accent); }
  .dr-harm-channels .box { fill: none; stroke: var(--hc-line); stroke-width: 1; }
  .dr-harm-channels .chk { stroke: var(--hc-text); stroke-width: 1.25; }
  .dr-harm-channels .wall { stroke: var(--hc-text); stroke-width: 3; }
  .dr-harm-channels .cut { stroke: var(--hc-text); stroke-width: 2.5; }
  .dr-harm-channels .ll { stroke: var(--hc-line); fill: none; }
  .dr-harm-channels .la { stroke: var(--hc-accent); fill: none; }
  .dr-harm-channels .fl { fill: var(--hc-line); }
  .dr-harm-channels .fa { fill: var(--hc-accent); }
  .dr-harm-channels figcaption {
    margin-top: 0.75rem; font-size: 0.9375rem; line-height: 1.55; color: var(--hc-muted);
  }
</style>"""

def figure_html():
    W1, H1, body1 = wide()
    W2, H2, body2 = narrow()
    label = esc(CLAIM)
    return f"""<figure class="dr-harm-channels">
  <svg class="hc-wide" viewBox="0 0 {W1} {H1}" width="{W1}" height="{H1}" role="img" aria-label="{label}">
    {body1}
  </svg>
  <svg class="hc-narrow" viewBox="0 0 {W2} {H2:g}" width="{W2}" height="{H2:g}" role="img" aria-label="{label}">
    {body2}
  </svg>
  <figcaption>{esc(CAPTION)}</figcaption>
</figure>
{STYLE}
"""

CAPTION = ("The three channels reach the same damage through the same checks. They differ in who chooses "
           "the harmful action, and so in what a stack of checks is worth: three checks that each miss 10% "
           "pass 0.1% of accidental harmful actions if they fail independently, but a delegate or attacker "
           "who picks the action beats all three at once, so at least 10% get through. The controls that hold on "
           "every path are the ones that ignore which action arrives: keeping untrusted data from choosing "
           "actions, and a hard envelope.")
CLAIM = CAPTION

PAGE = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Harm channels figure</title>
<style>
  :root { --text: #2e2c28; --muted: #5f5b53; --hair: #d6d1c7; --bg: #ffffff; --accent: #a8321f; }
  :root[data-theme="dark"] { --text: #dcd7cd; --muted: #a7a195; --hair: #45423c; --bg: #161514; --accent: #f29a84; }
  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) { --text: #dcd7cd; --muted: #a7a195; --hair: #45423c; --bg: #161514; --accent: #f29a84; }
  }
  html { background: var(--bg); }
  body {
    margin: 0; padding: 2rem 16px 3rem; background: var(--bg); color: var(--text);
    font-family: ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    font-size: 17px; line-height: 1.65;
  }
  main { max-width: 720px; margin: 0 auto; }
  .kicker { font-size: 0.9375rem; color: var(--muted); margin: 0 0 0.25rem; }
  h1 { font-size: 1.25rem; font-weight: 600; margin: 0 0 1.5rem; }
  h2 { font-size: 1.125rem; font-weight: 600; margin: 2rem 0 0.75rem; }
  a { color: var(--accent); }
  table { border-collapse: collapse; font-size: 0.9375rem; width: 100%; display: block; overflow-x: auto; }
  th, td { text-align: left; vertical-align: top; padding: 0.4rem 0.6rem 0.4rem 0; border-bottom: 1px solid var(--hair); }
  th { font-weight: 600; }
</style>
</head>
<body>
<main>
<p class="kicker">Delegation Risk</p>
<h1>Risk Decomposition: Accident, Defection, Hijack</h1>
<h2>How the channels differ</h2>
<table>
<thead><tr><th></th><th>Accident</th><th>Defection</th><th>Hijack</th></tr></thead>
<tbody>
<tr><td>Who chooses the harmful action</td><td>nobody</td><td>the delegate</td><td>a third party or user</td></tr>
<tr><td>How to estimate P</td><td>testing, incident history, fuzzing</td><td>control evaluations, red-teaming, honeypots</td><td>adaptive red-teaming of the whole system, e.g. on AgentDojo-style tasks</td></tr>
<tr><td>Main mitigations</td><td>testing, redundancy, verification</td><td>trusted monitoring, control protocols, hard envelopes</td><td>separating instructions from untrusted data, removing exfiltration paths, hard envelopes</td></tr>
<tr><td>Correlation between stacked checks</td><td>benign-failure &rho; applies</td><td>assume &rho; &rarr; 1</td><td>assume &rho; &rarr; 1</td></tr>
</tbody>
</table>
FIGURE
<p>The last row matters most. The <a href="#">beta-factor correction</a> models checks that happen to fail together. In the defection and hijack channels an adversary chooses the input to defeat every check at once, so treat a stack as worth no more than its best layer until a control evaluation (<a href="#">Greenblatt et al. 2023</a>) shows otherwise.</p>
<p>Accidents also tend to leave traces in logs and tests. The other two need not: a schemer hides its actions, and a hijacked delegate&rsquo;s logs show it doing what it was told, which can look like normal work.</p>
</main>
</body>
</html>
"""

if __name__ == "__main__":
    frag = figure_html()
    (OUT / "figure.html").write_text(frag)
    (OUT / "index.html").write_text(PAGE.replace("FIGURE", frag))
    print("by channel:", {k: round(v) for k, v in by_channel.items()}, "total", round(total), shares)
    print("accident (rho=0):", BENIGN, " rho=0.5:", [pct(x) for x in benign05], " adversarial:", ADV)
