#!/usr/bin/env python3
"""rp-oversight-router: the hybrid protocol from concepts/oversight-protocols.md
("Composition: the hybrid protocol"), drawn as a router with the residue that leaks.

No numeric data. All wording is taken from the page:
  - mermaid block: unresolvable claim -> debate -> {resolvable subclaims -> markets/prediction
    games -> resolution/retrodiction ; debater belief structure -> consistency checks}
  - "the judge's job shrinks ... to the genuinely unresolvable residue"
  - "markets cap the payoff on false resolvable subclaims; consistency checks catch incoherent
    belief structure -- but ... a consistent, obfuscated, unresolvable argument slips all three."
  - grounding table: failure modes (latency, resolution ambiguity; consistent-but-wrong,
    evasive vagueness; obfuscation)
  - open question: "Who controls decomposition in the hybrid?"

Run: python3 compute.py -> figure.html, index.html, svg-wide.svg, svg-narrow.svg
"""
import os, html, re
HERE = os.path.dirname(os.path.abspath(__file__))
E = html.escape

LANES = [
    dict(route=["resolvable", "subclaims"], name="Markets, prediction games",
         grounded=["external resolution, or", "retrodiction against hidden facts"],
         buys=["caps the payoff on false", "resolvable subclaims"],
         leaks=["[[unresolvable]] claims; latency;", "ambiguous or gamed resolution"]),
    dict(route=["debaters’", "probabilities"], name="Consistency checks",
         grounded=["internal coherence: can the", "beliefs be Dutch-booked?"],
         buys=["catches incoherent", "belief structure"],
         leaks=["[[consistent]]-but-wrong beliefs;", "evasive vagueness"]),
    dict(route=["unresolvable", "residue"], name="Judge",
         grounded=["the judge’s verdict: what", "persuades, not what is true"],
         buys=["a judge used only where", "nothing else can ground it"],
         leaks=["[[obfuscated]] arguments whose", "flaws cost too much to find"]),
]
SLIP = "A consistent, obfuscated, unresolvable argument slips all three."
DECOMP = ["Open question: who controls the split?", "A dishonest debater can send", "convenient subclaims to markets",
          "and keep the load-bearing one", "in the residue."]
ARIA = ("Flow diagram of the hybrid oversight protocol. An unresolvable claim is contested in debate, which "
        "splits it three ways: resolvable subclaims go to markets and prediction games, grounded in external "
        "resolution or retrodiction; the debaters' probabilities go to consistency checks, grounded in internal "
        "coherence; the unresolvable residue goes to the judge. Markets cap the payoff on false resolvable "
        "subclaims but miss unresolvable claims; consistency checks catch incoherent beliefs but miss "
        "consistent-but-wrong ones; the judge misses obfuscated arguments. A consistent, obfuscated, "
        "unresolvable argument slips all three.")

def rich(s, cls="lab"):
    """text with [[accent]] spans -> tspans"""
    out = []
    for part in re.split(r"(\[\[.*?\]\])", s):
        if part.startswith("[["):
            out.append(f'<tspan class="acc">{E(part[2:-2])}</tspan>')
        elif part:
            out.append(E(part))
    return "".join(out)

def text(x, y, s, cls="lab", anchor="start"):
    a = f' text-anchor="{anchor}"' if anchor != "start" else ""
    return f'<text class="{cls}" x="{x}" y="{y}"{a}>{rich(s)}</text>'

def box(x, y, w, h, lines, cls=("ttl",)):
    o = [f'<rect class="box" x="{x}" y="{y}" width="{w}" height="{h}" rx="4"/>']
    n = len(lines); cy = y + h / 2
    for i, (s, c) in enumerate(lines):
        o.append(text(x + w / 2, round(cy + 5 + (i - (n - 1) / 2) * 20, 1), s, c, "middle"))
    return "".join(o)

def arrow(pts, mid):
    d = "M" + " L".join(f"{x} {y}" for x, y in pts)
    return f'<path class="flow" d="{d}" marker-end="url(#{mid}-ah)"/>'

def marker(mid):
    return (f'<defs><marker id="{mid}-ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" '
            f'markerHeight="7" orient="auto-start-reverse"><path d="M1 1.5 L9 5 L1 8.5" class="ahead"/></marker></defs>')

def wide():
    W, H = 760, 600
    o = [marker("orw")]
    cxs = [127, 380, 633]
    o.append(box(290, 8, 180, 40, [("Unresolvable claim", "ttl")]))
    o.append(arrow([(380, 48), (380, 90)], "orw"))
    o.append(text(390, 74, "contested in", "lab muted"))
    o.append(box(280, 92, 200, 58, [("Debate", "ttl"), ("splits the claim", "lab muted")]))
    # decomposition caveat, left of debate
    for i, s in enumerate(DECOMP):
        o.append(text(262, 66 + i * 19, s, "lab muted", "end"))
    # fork
    o.append(f'<path class="flow" d="M380 150 L380 180 M{cxs[0]} 180 L{cxs[2]} 180"/>')
    for cx, L in zip(cxs, LANES):
        o.append(arrow([(cx, 180), (cx, 246)], "orw"))
        o.append(text(cx + 9, 207, L["route"][0], "lab"))
        o.append(text(cx + 9, 226, L["route"][1], "lab"))
    rows = [("grounded in", "grounded", 304), ("buys", "buys", 384), ("lets through", "leaks", 464)]
    # row rules
    for _, _, y in rows:
        o.append(f'<line class="hair" x1="7" y1="{y - 20}" x2="753" y2="{y - 20}"/>')
    for cx, L in zip(cxs, LANES):
        x0 = cx - 118
        o.append(box(x0, 248, 236, 40, [(L["name"], "ttl")]))
        for lab, key, y in rows:
            o.append(text(x0 + 2, y, lab, "lab muted"))
            o.append(text(x0 + 2, y + 20, L[key][0]))
            o.append(text(x0 + 2, y + 39, L[key][1]))
    # accent bracket gathering the three leaks
    yb = 524
    o.append(f'<path class="accline" d="M{cxs[0]-116} {yb-10} L{cxs[0]-116} {yb} L{cxs[2]+116} {yb} L{cxs[2]+116} {yb-10}'
             f' M{cxs[1]-116} {yb-10} L{cxs[1]-116} {yb} M380 {yb} L380 {yb+12}"/>')
    o.append(text(380, yb + 34, SLIP, "lab acc strong", "middle"))
    o.append(text(380, yb + 56, "Unresolvable evades the markets, consistent passes the checks, obfuscated beats the judge.", "lab muted", "middle"))
    return W, H, "".join(o)

def narrow():
    W = 343
    o = [marker("orn")]
    o.append(box(60, 6, 223, 40, [("Unresolvable claim", "ttl")]))
    o.append(arrow([(171.5, 46), (171.5, 84)], "orn"))
    o.append(text(181, 70, "contested in", "lab muted"))
    o.append(box(60, 86, 223, 58, [("Debate", "ttl"), ("splits the claim", "lab muted")]))
    y = 178
    dec = ["Open question: who controls the split? A", "dishonest debater can send convenient",
           "subclaims to markets and keep the", "load-bearing one in the residue."]
    for i, s in enumerate(dec):
        o.append(text(28, y + i * 19, s, "lab muted"))
    y += len(dec) * 19 + 18
    spine_top = 144; sx = 12
    lane_mids = []; leak_ys = []
    for L in LANES:
        o.append(text(28, y, L["route"][0] + " " + L["route"][1], "lab"))
        by = y + 10
        o.append(box(28, by, 298, 38, [(L["name"], "ttl")]))
        lane_mids.append(by + 19)
        o.append(arrow([(sx, by + 19), (27, by + 19)], "orn"))
        ry = by + 64
        for lab, key in [("grounded in", "grounded"), ("buys", "buys"), ("lets through", "leaks")]:
            o.append(text(30, ry, lab, "lab muted"))
            o.append(text(120, ry, L[key][0]))
            o.append(text(120, ry + 19, L[key][1]))
            if key == "leaks":
                leak_ys.append(ry - 5)
            ry += 50
        y = ry + 8
    o.append(f'<path class="flow" d="M171.5 144 L171.5 160 L{sx} 160 L{sx} {lane_mids[-1]}"/>')
    # accent: right-hand rail linking the three leak rows
    rx = 338
    yb = y + 4
    d = f"M{rx} {leak_ys[0]} L{rx} {yb}"
    for ly in leak_ys:
        d += f" M{rx-8} {ly} L{rx} {ly}"
    d += f" M{rx} {yb} L{28} {yb}"
    o.append(f'<path class="accline" d="{d}"/>')
    o.append(text(28, yb + 26, "A consistent, obfuscated, unresolvable", "lab acc strong"))
    o.append(text(28, yb + 46, "argument slips all three.", "lab acc strong"))
    for i, s in enumerate(["Unresolvable evades the markets,", "consistent passes the checks,", "obfuscated beats the judge."]):
        o.append(text(28, yb + 70 + i * 19, s, "lab muted"))
    return W, yb + 112, "".join(o)

STYLE = """<style>
.orf{margin:1.5rem 0;
 --or-text:#2e2c28;--or-muted:#5f5b53;--or-line:#8f897e;--or-hair:#d6d1c7;--or-bg:#ffffff;--or-accent:#2a57a6}
:root[data-theme="dark"] .orf{--or-text:#dcd7cd;--or-muted:#a7a195;--or-line:#8f897e;--or-hair:#45423c;--or-bg:#161514;--or-accent:#9dbdf2}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]) .orf{--or-text:#dcd7cd;--or-muted:#a7a195;--or-line:#8f897e;--or-hair:#45423c;--or-bg:#161514;--or-accent:#9dbdf2}}
.orf svg{display:block;width:100%;height:auto;font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif}
.orf .or-narrow{display:none}
@media (max-width:560px){.orf .or-wide{display:none}.orf .or-narrow{display:block}}
.orf .lab{fill:var(--or-text);font-size:14px}
.orf .ttl{fill:var(--or-text);font-size:15px;font-weight:600}
.orf .muted{fill:var(--or-muted)}
.orf .acc{fill:var(--or-accent)}
.orf .strong{font-weight:600}
.orf .box{fill:var(--or-bg);stroke:var(--or-line);stroke-width:1}
.orf .flow{fill:none;stroke:var(--or-line);stroke-width:1.25}
.orf .ahead{fill:none;stroke:var(--or-line);stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round}
.orf .hair{stroke:var(--or-hair);stroke-width:1}
.orf .accline{fill:none;stroke:var(--or-accent);stroke-width:1.5}
.orf figcaption{font-size:.95rem;line-height:1.55;color:var(--or-muted);margin-top:.6rem}
</style>"""

CAPTION = ("The hybrid protocol routes each part of a disputed claim to the grounding that can check it. "
           "Markets price the resolvable subclaims, consistency checks screen the debaters’ probabilities, "
           "and the judge is left with only the unresolvable residue. Each check misses one thing, so an argument "
           "that is unresolvable, consistent and obfuscated passes all three.")

def svg(cls, W, H, body):
    return (f'<svg class="{cls}" viewBox="0 0 {W} {H}" role="img" aria-label="{E(ARIA)}">{body}</svg>')

def main():
    ww, wh, wb = wide(); nw, nh, nb = narrow()
    sw, sn = svg("or-wide", ww, wh, wb), svg("or-narrow", nw, nh, nb)
    standalone = '<svg xmlns="http://www.w3.org/2000/svg" '
    open(os.path.join(HERE, "svg-wide.svg"), "w").write(sw.replace("<svg ", standalone, 1))
    open(os.path.join(HERE, "svg-narrow.svg"), "w").write(sn.replace("<svg ", standalone, 1))
    fig = f'{STYLE}\n<figure class="orf">\n{sw}\n{sn}\n<figcaption>{E(CAPTION)}</figcaption>\n</figure>\n'
    open(os.path.join(HERE, "figure.html"), "w").write(fig)
    page = f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Oversight Grounding Router</title>
<style>
:root{{--t:#2e2c28;--m:#5f5b53;--bg:#ffffff;--a:#2a57a6}}
:root[data-theme="dark"]{{--t:#dcd7cd;--m:#a7a195;--bg:#161514;--a:#9dbdf2}}
@media (prefers-color-scheme: dark){{:root:not([data-theme="light"]){{--t:#dcd7cd;--m:#a7a195;--bg:#161514;--a:#9dbdf2}}}}
body{{margin:0;background:var(--bg);color:var(--t);font:17px/1.6 ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}}
main{{max-width:46rem;margin:0 auto;padding:2rem 16px 3rem}}
h1{{font-size:1.15rem;font-weight:600;margin:0 0 1rem;color:var(--m)}}
h2{{font-size:1.3rem;margin:1.5rem 0 .6rem}}
p{{margin:0 0 1rem}} a{{color:var(--a)}}
</style></head><body><main>
<h1>What Grounds an Oversight Protocol? &middot; Composition: the hybrid protocol</h1>
<p>Since the groundings cover complementary territory, the natural design is layered:</p>
{fig}
<p>Debate operates over the unresolvable claim, but its subclaims are anchored by markets wherever they touch resolvable ground, and the debaters&rsquo; probability assignments are continuously consistency-checked. The judge&rsquo;s job shrinks from &ldquo;evaluate everything&rdquo; to &ldquo;evaluate the genuinely unresolvable residue&rdquo; &mdash; which is the only part a judge was ever the right tool for. Each edge buys something specific &mdash; markets cap the payoff on false resolvable subclaims; consistency checks catch incoherent belief structure &mdash; but the cover is partial: a consistent, obfuscated, unresolvable argument slips all three.</p>
</main></body></html>
"""
    open(os.path.join(HERE, "index.html"), "w").write(page)

if __name__ == "__main__":
    main()
