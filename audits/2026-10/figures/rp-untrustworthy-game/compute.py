#!/usr/bin/env python3
"""rp-untrustworthy-game: the defender-moves-first game from
concepts/untrustworthy-sources.md, drawn as three bands.

No numeric data. Every label is taken from the page:
  Move 1  - the channel table ("Move 1: reduce the attack surface"): channel names, levers,
            "What closing it costs the defender"; residual set from the mermaid block and
            "The residual attack surface" (irreplaceable advantage = reproduction gap + dependence;
            never resolves; goal divergence you can't design out).
            AI: "re-running, forking, and polling many models closes the reproduction gap ...
            The trap is correlated error."
  Move 2  - payload types (step 1) and the three channels that stay open against a listener who
            verifies (selective truth, framing, the unfalsifiable).
  Move 3  - the six rungs of the counterfactual-deceiver test, cheapest first.
Column order in Move 1 is chosen so rungs 1-4 sit under the channel each one re-asks:
  Aligned? <- Goal divergence, Verifiable? <- Verification gap,
  Reproducible? <- Reproduction gap, Deterred? <- Never-resolves.

Run: python3 compute.py -> figure.html, index.html, svg-wide.svg, svg-narrow.svg
"""
import os, html, re
HERE = os.path.dirname(os.path.abspath(__file__))
E = html.escape

# ---------------------------------------------------------------- content (from the page)
CHANNELS = [  # name lines, lever lines, cost, stays-open?, accent?
    dict(name=["Goal", "divergence"], lever=["pick a venue or", "framing, no lean"],
         cost="sometimes free", open=True),
    dict(name=["Verification", "gap"], lever=["route it to a", "checkable form"],
         cost="often free", open=False),
    dict(name=["Reproduction", "gap"], lever=["re-run, fork,", "poll models"],
         cost="cheap for AI", open=True, ai=True),
    dict(name=["Never-", "resolves"], lever=["escrow, bonds,", "resolver, identity"],
         cost="infrastructure", open=True),
    dict(name=["Dependence", ""], lever=["drop the source"], cost="free", open=True),
    dict(name=["Stakes", ""], lever=["spread the", "decision weight"], cost="partly free", open=False),
]
PAYLOADS = [
    dict(name="Outright lie", why=["caught by a listener", "who verifies"], open=False),
    dict(name="Selective truth", why=["only true facts, chosen;", "hides that there was", "a pool to choose from"], open=True),
    dict(name="Framing", why=["controls the information", "structure; moves even a", "perfect Bayesian"], open=True),
    dict(name="The unfalsifiable", why=["no checkable content;", "LR ≈ 1 by construction"], open=True),
]
RUNGS = [
    dict(q=["Aligned?"], use=["use it"]),
    dict(q=["Verifiable?"], use=["use it on", "its merits"]),
    dict(q=["Reproducible?"], use=["use the routed", "answer"]),
    dict(q=["Deterred?"], use=["use it, lightly", "discounted"]),
    dict(q=["Costly-to-", "fake form?"], use=["use it, but", "discount by how", "cheap a fake is"]),
    dict(q=["Otherwise"], use=["keep only the", "fact it was said"], last=True),
]
ARIA = ("Diagram of deception as a game the defender moves first. Move 1, at design time, the defender closes "
        "channels: goal divergence (pick a venue with no lean, sometimes free), verification gap (route to a "
        "self-checkable form, often free), reproduction gap (re-run, fork, poll many models, cheap for AI), "
        "never-resolves (escrow, bonds, a trusted resolver, identity, costs infrastructure), dependence (drop the "
        "source, free) and stakes (don't concentrate decision weight, partly free). Goal divergence, never-resolves, "
        "and the reproduction gap fused with dependence stay open on some questions: the residual attack surface. "
        "For AI the reproduction gap closes cheaply, but correlated error between models reopens it. "
        "Move 2, the deceiver works the residue: an outright lie is caught by a listener who verifies, but selective "
        "truth, framing and the unfalsifiable stay open. Move 3, the listener runs the counterfactual-deceiver test "
        "cheapest rung first: aligned, use it; verifiable, use it on its merits; reproducible, use the routed answer; "
        "deterred, use it lightly discounted; costly-to-fake form, use it discounted by the cost to fake; otherwise "
        "refuse the content and keep only the fact that it was said. Rungs one to four re-ask Move 1's questions "
        "about the one message in hand.")
CAPTION = ("Most of the defense happens before anyone speaks. Move 1 closes the channels that can be closed, "
           "most of them cheaply; what stays open is goal divergence, questions that never resolve, and an "
           "irreplaceable advantage. Against a listener who verifies, the deceiver drops the outright lie for "
           "selective truth, framing or the unfalsifiable. The runtime test then re-asks Move 1’s questions about "
           "this one message and refuses whatever no rung can price. AI closes the reproduction gap cheaply, "
           "and correlated error between models reopens it.")

# ---------------------------------------------------------------- svg helpers
def rich(s):
    out = []
    for part in re.split(r"(\[\[.*?\]\]|\*\*.*?\*\*)", s):
        if part.startswith("[["):
            out.append(f'<tspan class="acc">{E(part[2:-2])}</tspan>')
        elif part.startswith("**"):
            out.append(f'<tspan class="strong">{E(part[2:-2])}</tspan>')
        elif part:
            out.append(E(part))
    return "".join(out)

def T(x, y, s, cls="lab", anchor="start"):
    a = f' text-anchor="{anchor}"' if anchor != "start" else ""
    return f'<text class="{cls}" x="{x:g}" y="{y:g}"{a}>{rich(s)}</text>'

def P(d, cls="flow", arrow=None):
    m = f' marker-end="url(#{arrow})"' if arrow else ""
    return f'<path class="{cls}" d="{d}"{m}/>'

def marker(mid, cls="ahead"):
    return (f'<marker id="{mid}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" '
            f'orient="auto-start-reverse"><path d="M1 1.5 L9 5 L1 8.5" class="{cls}"/></marker>')

def gate(x, y, w=9):
    return f'<path class="gate" d="M{x-w:g} {y:g} L{x+w:g} {y:g}"/>'

LH = 19  # line height for 14px labels

# ---------------------------------------------------------------- wide (desktop)
def wide():
    W, M, RAIL = 760, 22, 7          # text starts at M; the left rail carries flow between moves
    colw = (W - M - 4) / 6
    o = ['<defs>' + marker("ugw-ah") + marker("ugw-aa", "aheadacc") + '</defs>']
    # ---- Band 1
    o.append(T(M, 20, "Move 1 · design-time: the defender closes channels", "ttl"))
    o.append(T(M, 42, "Deception needs all six preconditions to hold; closing any one makes a question safe.", "lab muted"))
    o.append(T(M, 42 + LH, "Each column: the channel, the lever that closes it, what closing it costs the defender.", "lab muted"))
    yname, ylev = 98, 140
    lane_top, ygate, ybar = 206, 228, 320
    lanes = []
    for i, c in enumerate(CHANNELS):
        x0 = M + colw * i
        for k, s in enumerate(c["name"]):
            o.append(T(x0, yname + k * LH, s, "lab strong"))
        for k, s in enumerate(c["lever"]):
            o.append(T(x0, ylev + k * LH, s))
        o.append(T(x0, ylev + 2 * LH + 6, c["cost"], "lab muted"))
        lx = x0 + 8
        lanes.append(lx)
        if c.get("ai"):
            o.append(P(f"M{lx:g} {lane_top} L{lx:g} {ygate}"))
            o.append(gate(lx, ygate))
            o.append(P(f"M{lx:g} {ygate-12} C {lx+15:g} {ygate-9} {lx+15:g} {ygate+9} {lx:g} {ygate+16} L{lx:g} {ybar-2}",
                       "accline", "ugw-aa"))
            for k, s in enumerate(["closed for AI;", "[[correlated]]", "[[error]]", "[[reopens it]]"]):
                o.append(T(lx + 20, ygate + 5 + k * LH, s, "lab muted" if k == 0 else "lab"))
        elif c["open"]:
            o.append(P(f"M{lx:g} {lane_top} L{lx:g} {ybar-2}", "flow", "ugw-ah"))
            o.append(gate(lx, ygate))
            o.append(T(lx + 14, ygate + 5, "open on", "lab"))
            o.append(T(lx + 14, ygate + 5 + LH, "some questions", "lab"))
        else:
            o.append(P(f"M{lx:g} {lane_top} L{lx:g} {ygate}"))
            o.append(gate(lx, ygate))
            o.append(T(lx + 14, ygate + 5, "closed", "lab muted"))
    open_x = [lanes[i] for i, c in enumerate(CHANNELS) if c["open"]]
    o.append(P(f"M{open_x[-1]:g} {ybar} L{RAIL:g} {ybar}", "bar"))
    o.append(T(M, ybar + 24, "**Residual attack surface:** goal divergence you can’t design out, questions that"))
    o.append(T(M, ybar + 24 + LH, "never resolve, and an irreplaceable advantage (reproduction gap + dependence)."))
    # ---- Band 2
    yb2 = ybar + 72
    o.append(f'<line class="hair" x1="{M}" y1="{yb2}" x2="{W-4}" y2="{yb2}"/>')
    o.append(T(M, yb2 + 26, "Move 2 · attack-time: the deceiver works what is left", "ttl"))
    o.append(T(M, yb2 + 48, "Against a listener who verifies, the outright lie loses. Three payloads stay open.", "lab muted"))
    pw = (W - M - 4) / 4
    px = [M + pw * i + 8 for i in range(4)]
    ybus = yb2 + 86
    o.append(P(f"M{RAIL:g} {ybar} L{RAIL:g} {ybus} L{px[-1]:g} {ybus}"))
    o.append(T(px[0] + 14, ybus - 8, "the deceiver picks one payload", "lab muted"))
    yp = ybus + 36
    for i, p in enumerate(PAYLOADS):
        x = px[i]
        o.append(P(f"M{x:g} {ybus} L{x:g} {yp-17}", "flow", "ugw-ah"))
        o.append(T(x - 8, yp, p["name"], "lab strong"))
        for k, s in enumerate(p["why"]):
            o.append(T(x - 8, yp + (k + 1) * LH, s))
    ylie = yp + 3 * LH + 10
    o.append(P(f"M{px[0]:g} {yp + 2*LH + 8} L{px[0]:g} {ylie}"))
    o.append(gate(px[0], ylie))
    o.append(T(px[0] + 14, ylie + 5, "closed", "lab muted"))
    ymsg = yp + 4 * LH + 22
    for x in px[1:]:
        o.append(P(f"M{x:g} {yp + 3*LH + 8} L{x:g} {ymsg}"))
    o.append(P(f"M{px[-1]:g} {ymsg} L{RAIL:g} {ymsg}"))
    o.append(T(px[1] + 14, ymsg + 20, "the message reaches the listener", "lab muted"))
    # ---- Band 3
    yb3 = ymsg + 40
    o.append(f'<line class="hair" x1="{M}" y1="{yb3}" x2="{W-4}" y2="{yb3}"/>')
    o.append(T(M, yb3 + 26, "Move 3 · runtime: the counterfactual-deceiver test", "ttl"))
    o.append(T(M, yb3 + 48, "Could a liar in this position have produced it as cheaply if it were false?", "lab muted"))
    o.append(T(M, yb3 + 48 + LH, "Cheapest rung first. Rungs 1–4 re-ask the Move 1 question in their column.", "lab muted"))
    yr, rh, bw = yb3 + 96, 48, 106
    ymid = yr + rh / 2
    o.append(P(f"M{RAIL:g} {ymsg} L{RAIL:g} {ymid} L{M-1:g} {ymid}", "flow", "ugw-ah"))
    for i, r in enumerate(RUNGS):
        x0 = M + colw * i
        o.append(f'<rect class="box{" boxlast" if r.get("last") else ""}" x="{x0:g}" y="{yr}" width="{bw}" height="{rh}" rx="4"/>')
        n = len(r["q"])
        for k, s in enumerate(r["q"]):
            o.append(T(x0 + bw / 2, ymid + 5 + (k - (n - 1) / 2) * 17, s, "lab", "middle"))
        if i < len(RUNGS) - 1:
            gx0, gx1 = x0 + bw, M + colw * (i + 1)
            o.append(P(f"M{gx0+1:g} {ymid} L{gx1-1:g} {ymid}", "flow", "ugw-ah"))
            o.append(T((gx0 + gx1) / 2, yr - 5, "no", "lab muted", "middle"))
        cx = x0 + 12
        o.append(P(f"M{cx:g} {yr+rh} L{cx:g} {yr+rh+30}", "flow", "ugw-ah"))
        o.append(T(cx + 8, yr + rh + 20, "refuse" if r.get("last") else "yes", "lab muted"))
        for k, s in enumerate(r["use"]):
            o.append(T(x0, yr + rh + 50 + k * LH, s))
    H = yr + rh + 50 + 2 * LH + 10
    return W, H, "".join(o)

# ---------------------------------------------------------------- narrow (375px)
def narrow():
    W, M = 360, 6
    o = ['<defs>' + marker("ugn-ah") + marker("ugn-aa", "aheadacc") + '</defs>']
    y = 20
    o.append(T(M, y, "Move 1 · design-time", "ttl")); y += 22
    for s in ["The defender closes channels. Deception", "needs all six to hold; closing one is enough."]:
        o.append(T(M, y, s, "lab muted")); y += LH
    y += 10
    lx = M + 6
    tops = []
    for c in CHANNELS:
        name = " ".join(c["name"]).replace("- ", "-").strip()
        status = "closed for AI" if c.get("ai") else ("open on some questions" if c["open"] else "closed")
        o.append(T(M + 22, y, name, "lab strong"))
        o.append(T(W - M, y, status, "lab muted" if not c["open"] or c.get("ai") else "lab", "end"))
        o.append(T(M + 22, y + LH, " ".join(c["lever"]) + " · " + c["cost"]))
        gy = y - 2
        if c.get("ai"):
            o.append(P(f"M{lx} {y-12} L{lx} {gy}")); o.append(gate(lx, gy, 6))
            o.append(T(M + 22, y + 2 * LH, "[[correlated error reopens it]]"))
            o.append(P(f"M{lx} {gy-8} C {lx+12} {gy-6} {lx+12} {gy+6} {lx} {gy+10} L{lx} {y+2*LH+4}", "accline"))
            y += 3 * LH + 8
        elif c["open"]:
            o.append(P(f"M{lx} {y-12} L{lx} {y+LH+4}")); o.append(gate(lx, gy, 6))
            y += 2 * LH + 8
        else:
            o.append(P(f"M{lx} {y-12} L{lx} {gy}")); o.append(gate(lx, gy, 6))
            y += 2 * LH + 8
    y += 4
    o.append(P(f"M{M} {y} L{W-M} {y}", "bar")); y += 22
    for s in ["**Residual attack surface:** goal divergence", "you can’t design out, questions that never",
              "resolve, an irreplaceable advantage", "(reproduction gap + dependence)."]:
        o.append(T(M, y, s)); y += LH
    y += 4
    o.append(P(f"M{M+6} {y} L{M+6} {y+34}", "flow", "ugn-ah"))
    o.append(T(M + 18, y + 22, "the deceiver works what is left", "lab muted")); y += 50
    o.append(f'<line class="hair" x1="{M}" y1="{y}" x2="{W-M}" y2="{y}"/>'); y += 24
    o.append(T(M, y, "Move 2 · attack-time", "ttl")); y += 22
    for s in ["Against a listener who verifies, the outright", "lie loses. Three payloads stay open."]:
        o.append(T(M, y, s, "lab muted")); y += LH
    y += 12
    for p in PAYLOADS:
        o.append(T(M + 22, y, p["name"], "lab strong"))
        if not p["open"]:
            o.append(P(f"M{lx} {y-12} L{lx} {y-2}")); o.append(gate(lx, y - 2, 6))
            o.append(T(W - M, y, "closed", "lab muted", "end"))
        else:
            o.append(P(f"M{lx} {y-12} L{lx} {y + len(p['why'])*LH + 4}"))
        why = " ".join(p["why"])
        # re-wrap to ~40 chars
        lines, cur = [], ""
        for w in why.split():
            if len(cur) + len(w) + 1 > 40:
                lines.append(cur); cur = w
            else:
                cur = (cur + " " + w).strip()
        lines.append(cur)
        for k, s in enumerate(lines):
            o.append(T(M + 22, y + (k + 1) * LH, s))
        y += (len(lines) + 1) * LH + 10
    o.append(P(f"M{lx} {y-14} L{lx} {y+18}", "flow", "ugn-ah"))
    o.append(T(M + 22, y + 10, "the message reaches the listener", "lab muted")); y += 36
    o.append(f'<line class="hair" x1="{M}" y1="{y}" x2="{W-M}" y2="{y}"/>'); y += 24
    o.append(T(M, y, "Move 3 · runtime: the test", "ttl")); y += 22
    for s in ["Could a liar in this position have produced", "it as cheaply if it were false? Cheapest",
              "rung first; rungs 1–4 re-ask the first four", "channels of Move 1, in order."]:
        o.append(T(M, y, s, "lab muted")); y += LH
    y += 14
    bw, rh = 132, 38
    bx = M + 8
    for i, r in enumerate(RUNGS):
        q = " ".join(r["q"]).replace("- ", "-").replace("Costly-to-fake form?", "Costly to fake?")
        o.append(f'<rect class="box{" boxlast" if r.get("last") else ""}" x="{bx}" y="{y}" width="{bw}" height="{rh}" rx="4"/>')
        o.append(T(bx + bw / 2, y + rh / 2 + 5, q, "lab", "middle"))
        ax0, ax1 = bx + bw + 1, bx + bw + 54
        o.append(P(f"M{ax0} {y+rh/2} L{ax1} {y+rh/2}", "flow", "ugn-ah"))
        o.append(T((ax0 + ax1) / 2, y + rh / 2 - 6, "refuse" if r.get("last") else "yes", "lab muted", "middle"))
        use = r["use"]
        # join pairs into lines of <= 22 chars
        txt = " ".join(use); lines, cur = [], ""
        for w in txt.split():
            if len(cur) + len(w) + 1 > 21:
                lines.append(cur); cur = w
            else:
                cur = (cur + " " + w).strip()
        lines.append(cur)
        ty = y + rh / 2 + 5 - (len(lines) - 1) * LH / 2
        for k, s in enumerate(lines):
            o.append(T(ax1 + 6, ty + k * LH, s))
        if i < len(RUNGS) - 1:
            gap = 30
            o.append(P(f"M{bx+20} {y+rh} L{bx+20} {y+rh+gap-1}", "flow", "ugn-ah"))
            o.append(T(bx + 28, y + rh + 20, "no", "lab muted"))
            y += rh + gap
        else:
            y += rh
    # ladder entry arrow
    return W, y + 12, "".join(o)

# ---------------------------------------------------------------- output
STYLE = """<style>
.ugf{margin:1.5rem 0;
 --ug-text:#2e2c28;--ug-muted:#5f5b53;--ug-line:#8f897e;--ug-hair:#d6d1c7;--ug-bg:#ffffff;--ug-accent:#2a57a6}
:root[data-theme="dark"] .ugf{--ug-text:#dcd7cd;--ug-muted:#a7a195;--ug-line:#8f897e;--ug-hair:#45423c;--ug-bg:#161514;--ug-accent:#9dbdf2}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]) .ugf{--ug-text:#dcd7cd;--ug-muted:#a7a195;--ug-line:#8f897e;--ug-hair:#45423c;--ug-bg:#161514;--ug-accent:#9dbdf2}}
.ugf svg{display:block;width:100%;height:auto;font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif}
.ugf .ug-narrow{display:none}
@media (max-width:560px){.ugf .ug-wide{display:none}.ugf .ug-narrow{display:block}}
.ugf .lab{fill:var(--ug-text);font-size:14px}
.ugf .ttl{fill:var(--ug-text);font-size:15px;font-weight:600}
.ugf .muted{fill:var(--ug-muted)}
.ugf .acc{fill:var(--ug-accent)}
.ugf .strong{font-weight:600}
.ugf .box{fill:var(--ug-bg);stroke:var(--ug-line);stroke-width:1}
.ugf .boxlast{stroke-dasharray:3 3}
.ugf .flow{fill:none;stroke:var(--ug-line);stroke-width:1.25}
.ugf .bar{fill:none;stroke:var(--ug-line);stroke-width:2.5;stroke-linecap:round}
.ugf .gate{fill:none;stroke:var(--ug-text);stroke-width:2.5;stroke-linecap:round}
.ugf .ahead{fill:none;stroke:var(--ug-line);stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round}
.ugf .aheadacc{fill:none;stroke:var(--ug-accent);stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round}
.ugf .hair{stroke:var(--ug-hair);stroke-width:1}
.ugf .accline{fill:none;stroke:var(--ug-accent);stroke-width:1.5;stroke-dasharray:4 3}
.ugf figcaption{font-size:.95rem;line-height:1.55;color:var(--ug-muted);margin-top:.6rem}
</style>"""

def svg(cls, W, H, body):
    return f'<svg class="{cls}" viewBox="0 0 {W:g} {H:g}" role="img" aria-label="{E(ARIA)}">{body}</svg>'

def main():
    ww, wh, wb = wide(); nw, nh, nb = narrow()
    sw, sn = svg("ug-wide", ww, wh, wb), svg("ug-narrow", nw, nh, nb)
    sa = '<svg xmlns="http://www.w3.org/2000/svg" '
    open(os.path.join(HERE, "svg-wide.svg"), "w").write(sw.replace("<svg ", sa, 1))
    open(os.path.join(HERE, "svg-narrow.svg"), "w").write(sn.replace("<svg ", sa, 1))
    fig = f'{STYLE}\n<figure class="ugf">\n{sw}\n{sn}\n<figcaption>{E(CAPTION)}</figcaption>\n</figure>\n'
    open(os.path.join(HERE, "figure.html"), "w").write(fig)
    page = f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Defender-First Deception Game</title>
<style>
:root{{--t:#2e2c28;--m:#5f5b53;--bg:#ffffff;--a:#2a57a6}}
:root[data-theme="dark"]{{--t:#dcd7cd;--m:#a7a195;--bg:#161514;--a:#9dbdf2}}
@media (prefers-color-scheme: dark){{:root:not([data-theme="light"]){{--t:#dcd7cd;--m:#a7a195;--bg:#161514;--a:#9dbdf2}}}}
body{{margin:0;background:var(--bg);color:var(--t);font:17px/1.6 ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}}
main{{max-width:46rem;margin:0 auto;padding:2rem 16px 3rem}}
h1{{font-size:1.15rem;font-weight:600;margin:0 0 1rem;color:var(--m)}}
p{{margin:0 0 1rem}} a{{color:var(--a)}}
</style></head><body><main>
<h1>What Can You Use from an Untrustworthy Source? &middot; Deception is a game the defender moves first in</h1>
<p>The naive picture is a listener filtering a message. The better picture is a sequential game in which <strong>the defender moves first</strong>: the structure of Stackelberg security games. The defender commits, the attacker observes the committed environment and best-responds, and the defender&rsquo;s craft is choosing the commitment that leaves the attacker the worst best response.</p>
{fig}
<p>Call the set of routes a strategic sender could use to move you the <strong>attack surface</strong>, and each route a <strong>channel</strong>. Most of the defense is then design-time: nobody can lie past a proof checker, a neutral reproduction, or a resolving bet, and the runtime test works only on channels that survived Move 1. A running case: an AI advocate trying to nudge its overseer toward approving a plan.</p>
</main></body></html>
"""
    open(os.path.join(HERE, "index.html"), "w").write(page)

if __name__ == "__main__":
    main()
