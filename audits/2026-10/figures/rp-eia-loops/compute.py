#!/usr/bin/env python3
"""rp-eia-loops: the two-loop paradigm from proposals/epistemic-impact-analysis.md
("The two-loop paradigm", plus the escrow mechanism from "Desired properties").

No numeric data: the page gives no formula for the loops. Every label paraphrases the page:
  - object loop: "agents find or create information that scores highly on V";
    "research = maximizing validated epistemic impact per unit cost"
  - V(I, A, U): belief change of agent A on I, weighted by U as a "weighted portfolio of questions"
  - payment: "surprise now plus validation at resolution, the surprise share escrowed and clawed back
    if validation fails"; "the persuasion gradient survives in proportion to the unvalidated weight"
  - meta loop: "V itself is improved, based on how well its scores tracked realized value"
  - "must run on out-of-band signals (realized outcomes, retrodiction, human spot-evaluations),
    institutionally separated from the producers"; "sample validator-chosen claims, grade on
    randomized holdouts ... keep critics diverse or hidden"
Run: python3 compute.py -> figure.html, index.html, svg-wide.svg, svg-narrow.svg
"""
import os, html
HERE = os.path.dirname(os.path.abspath(__file__))
E = html.escape

ARIA = ("Two-loop diagram. Object loop: producers, human or AI, send information I to the scorer V(I, A, U), "
        "which measures how agent A's beliefs shift, weighted by the question portfolio U; the scorer pays the "
        "surprise share now, escrowed and clawed back if validation fails. Meta loop: the scorer's V scores go to "
        "a meta evaluator, which compares them with out-of-band signals of realized value (realized outcomes, "
        "retrodiction, human spot-evaluations, randomized holdouts) and sends back a revised V: a new agent A, "
        "question weights U and validators. The meta evaluator and its signals sit out of band: producers cannot "
        "see or choose them. A timeline zooms on the payment: the surprise share is escrowed at submission, fast "
        "partial validators (consistency checks, retrodiction) advance credit, and at resolution the pay is kept "
        "plus a validation share, clawed back, or, if the claim never resolves, left unvalidated, which is where "
        "the persuasion gradient survives.")
CAPTION = ("EIA as two coupled loops. In the object loop, producers are paid for information that shifts a "
           "calibrated agent’s beliefs on questions that matter. In the meta loop, the scorer is itself graded "
           "against realized value, using signals the producers can neither see nor choose. Below, the payment "
           "arrow over time: escrow and clawback blunt the reward for persuasion, but only for claims that "
           "resolve; whatever stays unvalidated still pays for moving beliefs.")

def T(x, y, s, cls="lab", anchor="start"):
    a = f' text-anchor="{anchor}"' if anchor != "start" else ""
    return f'<text class="{cls}" x="{x}" y="{y}"{a}>{s}</text>'

def lines(x, y, items, anchor="start", lh=19):
    out = []
    for i, (s, cls) in enumerate(items):
        out.append(T(x, y + i * lh, s, cls, anchor))
    return "".join(out)

def box(x, y, w, h, items, lh=19):
    """centred box with title + sub-lines"""
    out = [f'<rect class="box" x="{x}" y="{y}" width="{w}" height="{h}" rx="4"/>']
    n = len(items)
    top = y + h / 2 - (n - 1) * lh / 2 + 5
    for i, (s, cls) in enumerate(items):
        out.append(T(x + w / 2, round(top + i * lh, 1), s, cls, "middle"))
    return "".join(out)

def marker(mid):
    return (f'<defs><marker id="{mid}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" '
            f'orient="auto-start-reverse"><path d="M1 1.5 L9 5 L1 8.5" class="ahead"/></marker></defs>')

def path(d, mid):
    return f'<path class="flow" d="{d}" marker-end="url(#{mid})"/>'

SCORER = [("Scorer V(I, A, U)", "ttl"), ("shift in agent A’s beliefs,", "lab muted"),
          ("weighted by question portfolio U", "lab muted")]
PROD = [("Producers", "ttl"), ("human or AI researchers", "lab muted")]
META = [("Meta evaluator", "ttl"), ("do V scores track", "lab muted"), ("realized value?", "lab muted")]
SIGS = [("Out-of-band signals", "ttl"), ("realized outcomes", "lab muted"), ("retrodiction", "lab muted"),
        ("human spot-evaluations", "lab muted"), ("randomized holdouts", "lab muted")]

def wide():
    m = "eiaw-ah"; W, H = 784, 652
    o = [marker(m)]
    # out-of-band zone (the single accent element)
    zx, zy, zw, zh = 574, 8, 202, 470
    o.append(f'<rect class="zone" x="{zx}" y="{zy}" width="{zw}" height="{zh}" rx="8"/>')
    o.append(lines(zx + zw / 2, 34, [("Out of band", "lab acc strong"), ("producers cannot", "lab acc"),
                                     ("see or choose these", "lab acc")], "middle"))
    P = (8, 176, 170, 64); S = (284, 160, 232, 96); M = (588, 172, 180, 82); R = (588, 330, 180, 128)
    o.append(box(*P, PROD)); o.append(box(*S, SCORER)); o.append(box(*M, META)); o.append(box(*R, SIGS))
    # object loop
    o.append(path("M93 175 C110 70 300 60 334 158", m))
    o.append(lines(214, 62, [("information I", "lab"), ("a paper, data, an argument", "lab muted")], "middle"))
    o.append(path("M334 257 C300 362 110 352 93 242", m))
    o.append(lines(214, 362, [("payment: surprise share now", "lab"), ("(escrowed), validation share", "lab"),
                              ("at resolution", "lab")], "middle"))
    o.append(lines(234, 205, [("Object", "lab muted strong"), ("loop", "lab muted strong")], "middle"))
    # meta loop
    o.append(path("M476 159 C496 80 630 70 660 170", m))
    o.append(T(462, 112, "V scores for each I", "lab", "end"))
    o.append(path("M660 255 C630 352 500 352 476 258", m))
    o.append(lines(560, 372, [("revised V: agent A,", "lab"), ("weights U, validators", "lab")], "end"))
    o.append(lines(546, 205, [("Meta", "lab muted strong"), ("loop", "lab muted strong")], "middle"))
    o.append(path("M700 328 L700 257", m))
    o.append(lines(708, 288, [("realized", "lab"), ("value", "lab")]))
    # payment timeline (zoom on the payment arrow): what happens to one I's pay over time
    y0 = 492; o.append(f'<line class="hair" x1="8" y1="{y0}" x2="{W-8}" y2="{y0}"/>')
    o.append(T(8, y0 + 26, "Zoom on the payment arrow: one piece of information, over time", "lab strong"))
    ya = y0 + 84; xr = 460; t2 = 214
    o.append(f'<line class="flow" x1="12" y1="{ya}" x2="{xr}" y2="{ya}"/>')
    for x in (12, t2):
        o.append(f'<line class="flow" x1="{x}" y1="{ya-5}" x2="{x}" y2="{ya+5}"/>')
    o.append(lines(12, ya - 32, [("submitted", "lab strong"), ("surprise share into escrow", "lab muted")]))
    o.append(T(12, ya + 24, "measured as belief shift", "lab muted"))
    o.append(lines(t2, ya - 32, [("fast partial validators", "lab strong"),
                                 ("consistency checks, retrodiction", "lab muted")]))
    o.append(T(t2, ya + 24, "credit advanced early", "lab muted"))
    o.append(T(xr - 2, ya + 24, "at resolution", "lab strong", "end"))
    # resolution: three fates
    bx = xr + 40; ys = (ya - 42, ya, ya + 42)
    for y in ys:
        o.append(path(f"M{xr} {ya} C{xr+22} {ya} {xr+16} {y} {bx-2} {y}", m))
    o.append(T(bx + 6, ys[0] + 5, "validated: kept, plus validation share"))
    o.append(T(bx + 6, ys[1] + 5, "fails: surprise share clawed back"))
    o.append(lines(bx + 6, ys[2] + 5, [("never resolves: stays unvalidated,", "lab strong"),
                                       ("so the persuasion gradient survives", "lab")]))
    return W, H, "".join(o)

def narrow():
    m = "eian-ah"; W = 343
    o = [marker(m)]
    bx, bw = 52, 239
    P = (bx, 8, bw, 56); S = (bx, 222, bw, 86); Mx = (bx, 496, bw, 78); R = (bx, 640, bw, 118)
    zy = 376
    o.append(f'<rect class="zone" x="3" y="{zy}" width="{W-6}" height="{R[1]+R[3]+14-zy}" rx="8"/>')
    o.append(box(*P, PROD)); o.append(box(*S, SCORER)); o.append(box(*Mx, META)); o.append(box(*R, SIGS))
    # object loop: left down (information), right up (payment)
    yP, yS = P[1] + P[3] / 2, S[1] + S[3] / 2
    o.append(path(f"M{bx} {yP} H22 V{yS} H{bx-1}", m))
    o.append(path(f"M{bx+bw} {yS} H{W-22} V{yP} H{bx+bw+1}", m))
    o.append(lines(34, 94, [("Object loop", "lab muted strong")]))
    o.append(lines(34, 120, [("information I", "lab"), ("a paper, data, an argument", "lab muted")]))
    o.append(lines(W - 34, 160, [("payment: surprise share now", "lab"), ("(escrowed), validation share", "lab"),
                                 ("at resolution", "lab")], "end"))
    # meta loop
    yM = Mx[1] + Mx[3] / 2
    o.append(path(f"M{bx} {yS+18} H22 V{yM} H{bx-1}", m))
    o.append(path(f"M{bx+bw} {yM} H{W-22} V{yS+18} H{bx+bw+1}", m))
    o.append(lines(34, 336, [("Meta loop", "lab muted strong")]))
    o.append(lines(34, 358, [("V scores for each I", "lab")]))
    o.append(lines(W / 2, zy + 24, [("Out of band: producers cannot", "lab acc strong"),
                                     ("see or choose these", "lab acc")], "middle"))
    o.append(lines(W - 34, 450, [("revised V: agent A,", "lab"), ("weights U, validators", "lab")], "end"))
    # signals -> meta
    o.append(path(f"M{W/2} {R[1]-1} L{W/2} {Mx[1]+Mx[3]+2}", m))
    o.append(T(W / 2 + 8, 612, "realized value"))
    y = R[1] + R[3] + 14 + 24
    o.append(f'<line class="hair" x1="0" y1="{y}" x2="{W}" y2="{y}"/>')
    o.append(lines(0, y + 26, [("Zoom on the payment arrow:", "lab strong"), ("one piece of information, over time", "lab strong")]))
    ax = 8; t0 = y + 70; t1 = t0 + 64; tr = t1 + 88
    o.append(f'<line class="flow" x1="{ax}" y1="{t0-6}" x2="{ax}" y2="{tr}"/>')
    for t in (t0, t1):
        o.append(f'<line class="flow" x1="{ax-5}" y1="{t}" x2="{ax+5}" y2="{t}"/>')
    o.append(lines(ax + 14, t0 + 5, [("submitted", "lab strong"), ("surprise share into escrow,", "lab muted"),
                                      ("measured as belief shift", "lab muted")]))
    o.append(lines(ax + 14, t1 + 5, [("fast partial validators", "lab strong"), ("consistency checks, retrodiction", "lab muted"),
                                      ("advance credit before", "lab muted"), ("slow resolution", "lab muted")]))
    o.append(T(ax + 14, tr + 5, "at resolution", "lab strong"))
    fx = 40; fy = (tr + 34, tr + 60, tr + 86)
    for f in fy:
        o.append(path(f"M{ax} {tr} V{f} H{fx-2}", m))
    o.append(T(fx + 6, fy[0] + 5, "validated: kept, plus validation share"))
    o.append(T(fx + 6, fy[1] + 5, "fails: surprise share clawed back"))
    o.append(lines(fx + 6, fy[2] + 5, [("never resolves: pay stays", "lab strong"), ("unvalidated; the persuasion", "lab"),
                                        ("gradient survives here", "lab")]))
    H = fy[2] + 5 + 2 * 19 + 8
    return W, H, "".join(o)

STYLE = """<style>
.eia{margin:1.5rem 0;
 --eia-text:#2e2c28;--eia-muted:#5f5b53;--eia-line:#8f897e;--eia-hair:#d6d1c7;--eia-bg:#ffffff;--eia-accent:#2a57a6}
:root[data-theme="dark"] .eia{--eia-text:#dcd7cd;--eia-muted:#a7a195;--eia-line:#8f897e;--eia-hair:#45423c;--eia-bg:#161514;--eia-accent:#9dbdf2}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]) .eia{--eia-text:#dcd7cd;--eia-muted:#a7a195;--eia-line:#8f897e;--eia-hair:#45423c;--eia-bg:#161514;--eia-accent:#9dbdf2}}
.eia svg{display:block;width:100%;height:auto;font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif}
.eia .eia-narrow{display:none}
@media (max-width:560px){.eia .eia-wide{display:none}.eia .eia-narrow{display:block}}
.eia .lab{fill:var(--eia-text);font-size:14px}
.eia .ttl{fill:var(--eia-text);font-size:15px;font-weight:600}
.eia .muted{fill:var(--eia-muted)}
.eia .acc{fill:var(--eia-accent)}
.eia .strong{font-weight:600}
.eia .box{fill:var(--eia-bg);stroke:var(--eia-line);stroke-width:1}
.eia .flow{fill:none;stroke:var(--eia-line);stroke-width:1.25}
.eia .ahead{fill:none;stroke:var(--eia-line);stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round}
.eia .hair{stroke:var(--eia-hair);stroke-width:1}
.eia .zone{fill:none;stroke:var(--eia-accent);stroke-width:1.25;stroke-dasharray:5 4}
.eia figcaption{font-size:.95rem;line-height:1.55;color:var(--eia-muted);margin-top:.6rem}
</style>"""

def svg(cls, W, H, body):
    return (f'<svg class="{cls}" viewBox="0 0 {W} {H}" role="img" aria-label="{E(ARIA)}">{body}</svg>')

def main():
    ww, wh, wb = wide(); nw, nh, nb = narrow()
    sw, sn = svg("eia-wide", ww, wh, wb), svg("eia-narrow", nw, nh, nb)
    fig = f'{STYLE}\n<figure class="eia">\n{sw}\n{sn}\n<figcaption>{E(CAPTION)}</figcaption>\n</figure>\n'
    open(os.path.join(HERE, "figure.html"), "w").write(fig)
    for n, s in (("svg-wide.svg", sw), ("svg-narrow.svg", sn)):
        open(os.path.join(HERE, n), "w").write(s)
    page = f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>EIA Two Loops</title>
<style>
:root{{--t:#2e2c28;--m:#5f5b53;--bg:#ffffff;--a:#2a57a6}}
:root[data-theme="dark"]{{--t:#dcd7cd;--m:#a7a195;--bg:#161514;--a:#9dbdf2}}
@media (prefers-color-scheme: dark){{:root:not([data-theme="light"]){{--t:#dcd7cd;--m:#a7a195;--bg:#161514;--a:#9dbdf2}}}}
body{{margin:0;background:var(--bg);color:var(--t);font:17px/1.6 ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}}
main{{max-width:46rem;margin:0 auto;padding:2rem 16px 3rem}}
h1{{font-size:1.15rem;font-weight:600;margin:0 0 1rem;color:var(--m)}}
p,ul{{margin:0 0 1rem}} a{{color:var(--a)}}
</style></head><body><main>
<h1>Epistemic Impact Analysis &middot; The two-loop paradigm</h1>
<p>EIA is most interesting not as a one-shot measurement but as a control loop:</p>
<ul>
<li><strong>Object loop</strong>: agents find or create information that scores highly on <em>V</em>. “Research” becomes the activity of maximizing validated epistemic impact per unit cost.</li>
<li><strong>Meta loop</strong>: the <em>V</em> function itself is improved, based on how well its scores tracked realized value — did high-<em>V</em> information actually improve downstream decisions?</li>
</ul>
{fig}
<p>This resembles generalized policy iteration from reinforcement learning — <em>V</em> the critic, the researchers (human or AI) the actors — but only as analogy: the real failure mode is reward-model overoptimization, and the loop needs an evaluator-plus-protocol that resists exploitation, not a strictly stronger critic. Accordingly, the meta loop must run on out-of-band signals (realized outcomes, retrodiction, human spot-evaluations), institutionally separated from the producers being scored. The producers must not mark their own book, nor choose its pages: sample validator-chosen claims, grade on randomized holdouts, and keep critics diverse or hidden, since a known critic can be optimized against offline.</p>
</main></body></html>
"""
    open(os.path.join(HERE, "index.html"), "w").write(page)

main()
