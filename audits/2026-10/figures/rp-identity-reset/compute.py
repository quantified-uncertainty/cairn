#!/usr/bin/env python3
"""rp-identity-reset: the enforceable penalty B_eff over one identity's life.

Source: apps/reasoning-processes/src/content/docs/environment/identity-and-track-records.md
  section "The quantity: enforceable penalty".

Page formulas
  S* = (c + p B) / (1 - p)                       safe stake          [standard shape]
  B_eff ~ B_escrow + dR                          enforceable penalty [heuristic]
  R = V_established - max(V_fresh - W, 0)        standing reset can't recover
  dR reaches R only under a ruin rule; R is a discounted stream -> 0 at exit.
Page numbers: c = $0.01, p = 5%; dR ~ $1,000 -> S* ~ $53; B_eff = 0 -> S* ~ 1 cent.

Model used to draw R over time (the page states the shape, not a curve):
  * the version retires at round T (scheduled last round, page point 3);
  * newcomer dues (Friedman & Resnick): an identity of age a earns a premium
    pi(a) = PI * min(a / D, 1) over a fresh one, i.e. trust ramps over D rounds;
  * cheap pseudonyms, W = 0: after a reset the operator re-enters with a fresh
    identity of the same version (same retirement date);
  * per-round discount DELTA.
  Then  R(t) = sum_{k=1}^{T-t} DELTA^k [pi(t+k) - pi(k)]
  i.e. the established identity's future premium stream minus the stream a fresh
  identity (started at round t) would earn. Without dues pi is constant -> R = 0.
  PI is scaled so the established plateau is exactly the page's dR = $1,000.
  B_ESCROW = $200 is illustrative (the page gives no escrow figure).

Run: python3 compute.py -> svg-wide.svg, svg-narrow.svg, figure.html, index.html
"""
import os

HERE = os.path.dirname(os.path.abspath(__file__))
c, p = 0.01, 0.05
T, D, DELTA = 100, 25, 0.98
R_PLATEAU = 1000.0
B_ESCROW = 200.0
RESET_AT = 50

def s_star(B):
    return (c + p * B) / (1 - p)

def ramp(a):
    return min(a / D, 1.0)

def R_unit(t, start=0):
    """standing of an identity created at round `start`, evaluated at round t (PI = 1)."""
    age = t - start
    return sum(DELTA ** k * (ramp(age + k) - ramp(k)) for k in range(1, T - t + 1))

PI = R_PLATEAU / R_unit(D)
R = lambda t, start=0: PI * R_unit(t, start)

# checks against the page
assert abs(s_star(1000) - 52.64) < 0.01
assert abs(s_star(0) * 100 - 1.05) < 0.01
assert R(0) == 0 and abs(R(T)) < 1e-9
assert abs(R(50) - 1000) < 1e-6 and abs(R(75) - 1000) < 1e-6
# without dues (flat premium) reset recovers everything
assert all(abs(sum(DELTA**k * (1 - 1) for k in range(1, T - t + 1))) < 1e-12 for t in range(T))
TS = list(range(0, T + 1))

def fmt_s(v):
    if v < 1: return f"{v*100:.0f}¢"
    return f"${v:,.0f}"

# ---------------------------------------------------------------- drawing
FONT = 'ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif'

def build(narrow):
    if narrow:
        W, H = 360, 520
        X0, X1, Y0, Y1 = 50, 300, 70, 400       # plot box (Y0 top)
    else:
        W, H = 760, 470
        X0, X1, Y0, Y1 = 96, 618, 44, 372
    YMAX = 1400.0
    sx = lambda t: X0 + (X1 - X0) * t / T
    sy = lambda B: Y1 - (Y1 - Y0) * B / YMAX
    pre = "idn" if narrow else "idw"
    o = []
    a = o.append
    a(f'<defs><marker id="{pre}-ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" '
      f'orient="auto-start-reverse"><path d="M1 1.5 L9 5 L1 8.5" class="ahead"/></marker></defs>')
    # grid + left ticks (B_eff) + right ticks (S*)
    for B in range(0, 1401, 200):
        y = sy(B)
        a(f'<line class="grid" x1="{X0}" y1="{y:.1f}" x2="{X1}" y2="{y:.1f}"/>')
        if narrow and B % 400 and B not in (200, 1000):
            continue
        lab = "$0" if B == 0 else f"${B:,}"
        a(f'<text class="tick" x="{X0-7}" y="{y+4.5:.1f}" text-anchor="end">{lab}</text>')
        if B <= 1200:
            a(f'<text class="tick" x="{X1+7}" y="{y+4.5:.1f}" text-anchor="start">{fmt_s(s_star(B))}</text>')
    for t in range(0, T + 1, 25):
        x = sx(t)
        a(f'<text class="tick" x="{x:.1f}" y="{Y1+20}" text-anchor="middle">{t}</text>')
    # bands
    top = [(sx(t), sy(B_ESCROW + R(t))) for t in TS]
    esc_y = sy(B_ESCROW)
    a(f'<rect class="esc" x="{X0}" y="{esc_y:.1f}" width="{X1-X0}" height="{Y1-esc_y:.1f}"/>')
    pts = " ".join(f"{x:.1f},{y:.1f}" for x, y in top)
    a(f'<polygon class="stand" points="{X0},{esc_y:.1f} {pts} {X1},{esc_y:.1f}"/>')
    a(f'<line class="escline" x1="{X0}" y1="{esc_y:.1f}" x2="{X1}" y2="{esc_y:.1f}"/>')
    # reset path: a fresh identity created at RESET_AT
    rp = " ".join(f"{sx(t):.1f},{sy(B_ESCROW + R(t, RESET_AT)):.1f}" for t in TS if t >= RESET_AT)
    a(f'<polyline class="reset" points="{rp}"/>')
    a(f'<polyline class="total" points="{pts}"/>')
    # axes
    a(f'<line class="axis" x1="{X0}" y1="{Y0}" x2="{X0}" y2="{Y1}"/>')
    a(f'<line class="axis" x1="{X0}" y1="{Y1}" x2="{X1}" y2="{Y1}"/>')
    a(f'<line class="axis" x1="{X1}" y1="{Y0}" x2="{X1}" y2="{Y1}"/>')
    # phase brackets above plateau
    def phase(t0, t1, label, anchor="middle"):
        y = sy(1330)
        a(f'<path class="brk" d="M{sx(t0)+2:.1f} {y+5:.1f} V{y:.1f} H{sx(t1)-2:.1f} V{y+5:.1f}"/>')
        tx = {"middle": (sx(t0) + sx(t1)) / 2, "start": sx(t0) + 2, "end": sx(t1) - 2}[anchor]
        a(f'<text class="lab muted" x="{tx:.1f}" y="{y-7:.1f}" text-anchor="{anchor}">{label}</text>')
    if narrow:
        phase(0, 25, "dues", "middle"); phase(25, 75, "established"); phase(75, 100, "exit", "middle")
    else:
        phase(0, 25, "newcomer dues"); phase(25, 75, "established"); phase(75, 100, "approaching exit")
    # gap arrow at RESET_AT
    xg = sx(RESET_AT)
    a(f'<line class="move" x1="{xg:.1f}" y1="{sy(B_ESCROW)-3:.1f}" x2="{xg:.1f}" y2="{sy(B_ESCROW+R(RESET_AT))+3:.1f}" '
      f'marker-start="url(#{pre}-ah)" marker-end="url(#{pre}-ah)"/>')
    a(f'<circle class="dot" cx="{xg:.1f}" cy="{esc_y:.1f}" r="3.5"/>')
    L = []  # (x, y, text, cls, anchor)
    if narrow:
        L += [(xg - 8, sy(860), "ΔR $1,000", "lab", "end"),
              (xg - 8, sy(860) + 18, "lost if", "lab muted", "end"),
              (xg - 8, sy(860) + 36, "caught", "lab muted", "end"),
              (sx(57), sy(290), "new identity", "lab muted", "start"),
              (X0 + 8, sy(100) + 5, "escrow $200", "lab", "start")]
    else:
        L += [(xg - 10, sy(760), "Caught at round 50:", "lab", "end"),
              (xg - 10, sy(760) + 19, "loses ΔR = $1,000", "lab", "end"),
              (xg - 10, sy(760) + 38, "of standing", "lab muted", "end"),
              (sx(RESET_AT) + 24, sy(330), "after a reset, the new", "lab muted", "start"),
              (sx(RESET_AT) + 24, sy(330) + 18, "identity re-pays dues", "lab muted", "start"),
              (X0 + 10, sy(118), "Escrow $200: collected whatever the identity does next.", "lab", "start"),
              (X0 + 10, sy(118) + 19, "With cheap pseudonyms and no dues, this is all that binds.", "lab muted", "start")]
    for x, y, t, cls, anc in L:
        a(f'<text class="{cls} halo" x="{x:.1f}" y="{y:.1f}" text-anchor="{anc}">{t}</text>')
    # axis titles
    if narrow:
        a(f'<text class="lab" x="{(X0+X1)/2:.1f}" y="{Y1+44}" text-anchor="middle">Rounds since entry</text>')
        a(f'<text class="lab muted" x="{(X0+X1)/2:.1f}" y="{Y1+63}" text-anchor="middle">version retires at 100</text>')
        a(f'<text class="lab" x="{X0-46}" y="{Y0-46}" text-anchor="start">B<tspan dy="4" font-size="11">eff</tspan></text>')
        a(f'<text class="lab" x="{X1+52}" y="{Y0-46}" text-anchor="end">S*</text>')
        a(f'<text class="lab muted" x="{X0-46}" y="{Y0-28}" text-anchor="start">penalty if caught</text>')
        a(f'<text class="lab muted" x="{X1+52}" y="{Y0-28}" text-anchor="end">safe stake</text>')
    else:
        a(f'<text class="lab" x="{(X0+X1)/2:.1f}" y="{Y1+46}" text-anchor="middle">Rounds since the identity entered</text>')
        a(f'<text class="lab muted" x="{(X0+X1)/2:.1f}" y="{Y1+65}" text-anchor="middle">this model version retires at round 100</text>')
        cy = (Y0 + Y1) / 2
        a(f'<text class="lab" transform="translate(26 {cy:.1f}) rotate(-90)" text-anchor="middle">Enforceable penalty B<tspan dy="4" font-size="11">eff</tspan><tspan dy="-4"> = B</tspan><tspan dy="4" font-size="11">escrow</tspan><tspan dy="-4"> + ΔR</tspan></text>')
        a(f'<text class="lab" transform="translate(684 {cy:.1f}) rotate(90)" text-anchor="middle">Safe stake S* at c = 1¢, p = 5%</text>')
    aria = ("Plot of enforceable penalty over an identity's life, with the safe stake S* on the right axis. "
            "Escrow of $200 is a flat floor worth S* of about $11. Under newcomer dues and a ruin rule, standing "
            "rises from zero over the first 25 rounds to $1,000, lifting the safe stake to about $63, then drains "
            "to zero over the last 25 rounds before the version retires. An identity caught at round 50 loses "
            "$1,000 of standing; its replacement starts from zero and re-pays dues.")
    cls = "id-narrow" if narrow else "id-wide"
    return (f'<svg class="{cls}" viewBox="0 0 {W} {H}" role="img" aria-label="{aria}">' + "".join(o) + "</svg>")

STYLE = """<style>
.id-fig{margin:1.5rem 0;
 --id-text:#2e2c28;--id-muted:#5f5b53;--id-line:#8f897e;--id-hair:#d6d1c7;--id-bg:#ffffff;--id-accent:#2a57a6;--id-tint:rgba(42,87,166,.10);--id-esc:rgba(143,137,126,.13)}
:root[data-theme="dark"] .id-fig{--id-text:#dcd7cd;--id-muted:#a7a195;--id-line:#8f897e;--id-hair:#45423c;--id-bg:#161514;--id-accent:#9dbdf2;--id-tint:rgba(157,189,242,.13);--id-esc:rgba(143,137,126,.18)}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]) .id-fig{--id-text:#dcd7cd;--id-muted:#a7a195;--id-line:#8f897e;--id-hair:#45423c;--id-bg:#161514;--id-accent:#9dbdf2;--id-tint:rgba(157,189,242,.13);--id-esc:rgba(143,137,126,.18)}}
.id-fig svg{display:block;width:100%;height:auto;font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;color:var(--id-text)}
.id-fig .id-narrow{display:none}
@media (max-width:560px){.id-fig .id-wide{display:none}.id-fig .id-narrow{display:block}}
.id-fig .grid{stroke:var(--id-hair);stroke-width:1}
.id-fig .axis{stroke:var(--id-line);stroke-width:1}
.id-fig .tick{fill:var(--id-muted);font-size:13px}
.id-fig .lab{fill:var(--id-text);font-size:14px}
.id-fig .muted{fill:var(--id-muted)}
.id-fig .halo{paint-order:stroke;stroke:var(--id-bg);stroke-width:4px;stroke-linejoin:round}
.id-fig .esc{fill:var(--id-esc)}
.id-fig .escline{stroke:var(--id-line);stroke-width:1.25}
.id-fig .stand{fill:var(--id-tint)}
.id-fig .total{fill:none;stroke:var(--id-accent);stroke-width:2;stroke-linejoin:round}
.id-fig .reset{fill:none;stroke:var(--id-text);stroke-width:1.5;stroke-dasharray:5 4}
.id-fig .brk{fill:none;stroke:var(--id-line);stroke-width:1}
.id-fig .move{stroke:var(--id-text);stroke-width:1.25;fill:none}
.id-fig .ahead{fill:none;stroke:var(--id-text);stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round}
.id-fig .dot{fill:var(--id-bg);stroke:var(--id-text);stroke-width:1.5}
.id-fig figcaption{font-size:.95rem;line-height:1.55;color:var(--id-muted);margin-top:.6rem}
</style>"""

CAPTION = ("A track record deters only in mid-life. Escrow binds at every age; standing (blue) adds a penalty "
           "only after the newcomer dues are paid, and only until the scheduled retirement drains it. "
           "At round 50 the identity has $1,000 of standing to lose, which lifts the safe stake from about $11 (escrow alone) to $63; "
           "if caught, it loses that standing and its replacement starts from zero and re-pays dues (dashed). Without dues, a reset recovers everything and only the escrow floor remains. "
           "Model: trust ramps over 25 rounds, 2% discount per round, a ruin rule, scaled to the page's $1,000; the $200 escrow is illustrative.")

def main():
    wide, narrow = build(False), build(True)
    open(os.path.join(HERE, "svg-wide.svg"), "w").write(wide)
    open(os.path.join(HERE, "svg-narrow.svg"), "w").write(narrow)
    frag = f'{STYLE}\n<figure class="id-fig">\n{wide}\n{narrow}\n<figcaption>{CAPTION}</figcaption>\n</figure>\n'
    open(os.path.join(HERE, "figure.html"), "w").write(frag)
    open(os.path.join(HERE, "index.html"), "w").write(INDEX.replace("{{FIG}}", frag))
    print(f"PI={PI:.3f}/round  S*(escrow)={s_star(B_ESCROW):.2f}  S*(escrow+1000)={s_star(B_ESCROW+1000):.2f}  "
          f"S*(1000)={s_star(1000):.2f}  R(10)={R(10):.0f} R(90)={R(90):.0f}")

INDEX = """<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Identity Reset Penalty</title>
<style>
:root{--t:#2e2c28;--m:#5f5b53;--bg:#ffffff}
:root[data-theme="dark"]{--t:#dcd7cd;--m:#a7a195;--bg:#161514}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){--t:#dcd7cd;--m:#a7a195;--bg:#161514}}
body{margin:0;background:var(--bg);color:var(--t);font:17px/1.6 ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
main{max-width:46rem;margin:0 auto;padding:2rem 16px 3rem}
h1{font-size:1.15rem;font-weight:600;margin:0 0 1rem;color:var(--m)}
p,li{margin:0 0 1rem}
</style></head><body><main>
<h1>Identity and Track-Record Infrastructure &middot; The quantity: enforceable penalty</h1>
<p>Plug in the deterrence chapter&rsquo;s numbers: a $0.01 LLM-judge call, a 5% audit rate. A newcomer with nothing escrowed has <i>B</i><sub>eff</sub> &asymp; 0, so <i>S</i>* &asymp; 0.01/0.95: about one cent of safe stake. An established producer reaches the deterrence chapter&rsquo;s $53 safe stake only if &Delta;<i>R</i> is about $1,000. That needs a ruin rule, a standing worth $1,000 that re-entry can&rsquo;t recover, and a producer not near its last round.</p>
{{FIG}}
<p>So <strong>a track record works like a bond that can&rsquo;t be refunded but can be spent once</strong>, and its deterrent value falls to zero as exit approaches. A mechanism that sizes stakes to standing has to cap them at what escrow alone covers, or accept that the most trusted producers are also the most tempted.</p>
</main></body></html>
"""

if __name__ == "__main__":
    main()
