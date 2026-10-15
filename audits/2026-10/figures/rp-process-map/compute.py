"""rp-process-map: the Process Catalogue's own L/M/H ratings on an ordinal grid,
plus the hardening moves the catalogue and Hardening overview state.
Reads the table straight from the page so the figure cannot drift from it.
Writes figure.html and index.html next to this file."""
import re, html, pathlib, sys
HERE = pathlib.Path(__file__).parent
PAGE = pathlib.Path('/home/user/cairn/apps/reasoning-processes/src/content/docs/concepts/process-catalogue.mdx')
src = PAGE.read_text()

LEVELS = ['L', 'L–M', 'M', 'M–H', 'H']
lvl_re = re.compile(r'^(L–M|M–H|L|M|H)\b')

# short label (lines), matched by prefix of the table's Process cell
SHORT = [
    ('Formal proof', ['Formal proof']),
    ('Full replication', ['Full replication']),
    ('Track-recorded forecaster', ['Track-recorded', 'forecasters']),
    ('Prediction tournament', ['Tournament']),
    ('Prediction market, real-money', ['Real-money market']),
    ('Prediction market, play-money', ['Play-money', 'market']),
    ('Adversarial proceedings', ['Courts']),
    ('Expert panel', ['Expert panel']),
    ('Financial audit', ['Financial audit']),
    ('Peer review', ['Peer review']),
    ('Composite indices', ['Composite indices']),
    ('Online review', ['Online reviews']),
    ('Single LLM judge', ['Single LLM judge']),
    ('Multi-model LLM panel', ['Multi-model', 'LLM panel']),
    ('Consistency battery', ['Consistency', 'battery']),
    ('Debate protocol', ['Debate protocol']),
    ('Output-metered', ['Output-metered', 'market']),
]
SUB = {'Tournament': 'Metaculus-style', 'Real-money market': 'Kalshi-style',
       'Play-money': 'Manifold-style', 'Output-metered': 'proposed, unbuilt'}

rows = []
for line in src.splitlines():
    if not line.startswith('| ') or line.startswith('| Process') or line.startswith('|---'):
        continue
    cells = [c.strip() for c in line.strip('|').split('|')]
    name, info, scope, bias = cells[0], cells[1], cells[2], cells[3]
    lab = next(l for p, l in SHORT if name.startswith(p))
    i = lvl_re.match(info).group(1)
    b = lvl_re.match(bias.lstrip('*')).group(1)
    verify = 'L' if 'L to verify' in info else None
    rows.append(dict(name=name, lines=lab, key=lab[0], info=i, bias=b, verify=verify,
                     proposed='proposed' in name))
assert len(rows) == 17, len(rows)

# claims checked from the data, not asserted by hand
cheap = {'L', 'L–M'}; robust = {'M', 'M–H', 'H'}
in_corner = [r for r in rows if r['info'] in cheap and r['bias'] in robust]
assert not in_corner, in_corner
occupied = {(r['info'], r['bias']) for r in rows}
print('rows', len(rows), 'occupied cells', len(occupied), 'of 25; empty corner cells: 6 of 6 empty')
print('info M–H column count:', sum(r['info'] == 'M–H' for r in rows))
for r in rows: print(f"  {r['info']:4} {r['bias']:4} {r['key']}")

# Moves, each tied to page text (see NOTES.md)
SYBIL = {'Online reviews', 'Play-money', 'Tournament'}   # 'absent identity infrastructure', 'farmable', 'accounts are cheap'
MOVES = [  # (from, to, label lines)
    ('Single LLM judge', 'Multi-model', ['Independence']),
    ('Tournament', 'Real-money market', ['Incentives:', 'real money']),
]
# within-cell order (top to bottom) so each move arrow is short
ORDER = ['Formal proof', 'Full replication', 'Track-recorded', 'Output-metered', 'Real-money market',
         'Courts', 'Tournament', 'Expert panel', 'Debate protocol', 'Consistency', 'Play-money',
         'Multi-model', 'Financial audit', 'Peer review', 'Single LLM judge', 'Online reviews', 'Composite indices']

CW = 7.4  # px per char at 14px, conservative estimate for the system sans

def esc(s): return html.escape(s, quote=True)

def wrap(line, avail, pxc):
    muted = line.startswith('~'); t = line.lstrip('~')
    toks = re.findall(r'[^ -]+-|[^ -]+ ?|-', t)  # break after spaces and hyphens
    out, cur = [], ''
    for tok in toks:
        if cur and len((cur + tok).rstrip()) * pxc > avail:
            out.append(cur.rstrip()); cur = tok
        else:
            cur += tok
    out.append(cur.rstrip())
    return [('~' if muted else '') + o for o in out]

def build(variant):
    narrow = variant == 'narrow'
    W = 360 if narrow else 760
    FS = 13.5 if narrow else 14
    LH = 17 if narrow else 18
    if narrow:
        cols = [('cheap', 'L or L–M'), ('mid', 'M'), ('exp', 'M–H or H')]
        colof = lambda lv: 'cheap' if lv in cheap else ('mid' if lv == 'M' else 'exp')
    else:
        cols = [(l, l) for l in LEVELS]
        colof = lambda lv: lv
    left = 40 if narrow else 84
    DX = 13 if narrow else 18
    gx0, gx1 = left, W - 2
    cw = (gx1 - gx0) / len(cols)
    cx = {c[0]: gx0 + k * cw for k, c in enumerate(cols)}
    # group items into cells
    cell = {}
    for r in sorted(rows, key=lambda r: ORDER.index(r['key'])):
        cell.setdefault((colof(r['info']), r['bias']), []).append(r)
    def item_lines(r):
        ls = list(r['lines'])
        if r['key'] in SUB and not (narrow and r['key'] == 'Play-money'): ls = ls + ['~' + SUB[r['key']]]
        if narrow and r['info'] == 'L–M': ls = ls + ['~info cost L–M']
        if narrow:
            avail = cw - DX - 10 - 2
            ls = [w for l in ls for w in wrap(l, avail, 6.9 if not l.startswith('~') else 6.6)]
        return ls
    PADT, PADB, GAP = 14, 12, 8
    BAND = 34  # top band of the H row for the proof-checking line
    # move-arrow boundaries need a little extra room
    extra_gap = {}
    for a, b, _ in MOVES:
        ra = next(r for r in rows if r['key'] == a); rb = next(r for r in rows if r['key'] == b)
        extra_gap[rb['bias']] = 14
    heights = {}
    for lv in LEVELS:
        h = 0
        for c in cols:
            its = cell.get((c[0], lv), [])
            hh = sum(len(item_lines(r)) * LH for r in its) + GAP * max(0, len(its) - 1)
            h = max(h, hh)
        h += PADT + PADB + extra_gap.get(lv, 0)
        if lv == 'H': h += BAND - 6
        heights[lv] = max(h, 64 if not narrow else 58)
    # empty-corner rows need room for its notes
    top = 28 if narrow else 6
    ys = {}; y = top
    for lv in reversed(LEVELS):
        ys[lv] = y; y += heights[lv]
    gy1 = y
    out = []
    A = out.append
    # empty corner
    ex0 = gx0; ex1 = gx0 + (cw if narrow else 2 * cw)
    A(f'<rect class="corner" x="{ex0+1:.1f}" y="{ys["H"]+1:.1f}" width="{ex1-ex0-2:.1f}" height="{ys["L–M"]-ys["H"]-2:.1f}"/>')
    # gridlines
    for lv in LEVELS:
        A(f'<line class="hair" x1="{gx0}" y1="{ys[lv]:.1f}" x2="{gx1}" y2="{ys[lv]:.1f}"/>')
    A(f'<line class="rule" x1="{gx0}" y1="{gy1:.1f}" x2="{gx1}" y2="{gy1:.1f}"/>')
    for k in range(1, len(cols)):
        x = gx0 + k * cw
        A(f'<line class="hair" x1="{x:.1f}" y1="{top}" x2="{x:.1f}" y2="{gy1:.1f}"/>')
    A(f'<line class="rule" x1="{gx0}" y1="{top}" x2="{gx0}" y2="{gy1:.1f}"/>')
    # axis labels
    for lv in LEVELS:
        A(f'<text class="lab muted" x="{gx0-(6 if narrow else 8)}" y="{ys[lv]+PADT+FS-2:.1f}" text-anchor="end">{lv}</text>')
    for c in cols:
        A(f'<text class="lab muted" x="{cx[c[0]]+cw/2:.1f}" y="{gy1+20:.1f}" text-anchor="middle">{c[1]}</text>')
    A(f'<text class="lab" x="{(gx0+gx1)/2:.1f}" y="{gy1+44:.1f}" text-anchor="middle">Cost per validated bit (Info) →</text>')
    if narrow:
        A(f'<text class="lab" x="0" y="16">↑ Cost to bias it</text>')
    else:
        A(f'<text class="lab" transform="translate(14 {(top+gy1)/2:.1f}) rotate(-90)" text-anchor="middle">Cost to bias it →</text>')
    # items
    pos = {}
    for (c, lv), its in cell.items():
        y = ys[lv] + PADT + (BAND if lv == 'H' else 0) + extra_gap.get(lv, 0) * 0
        if lv == 'H' and c == ('exp' if narrow else 'H'):
            y = ys[lv] + 22  # Formal proof sits on the band line
        for r in its:
            x = cx[c] + DX
            ls = item_lines(r)
            dy = y + FS - 4.5  # dot centre on first baseline's x-height middle
            pos[r['key']] = (x, dy, y, y + len(ls) * LH)
            cls = 'dot open' if r['proposed'] else 'dot'
            A(f'<circle class="{cls}" cx="{x:.1f}" cy="{dy:.1f}" r="4.5"/>')
            for j, t in enumerate(ls):
                muted = t.startswith('~')
                t = t.lstrip('~')
                A(f'<text class="{"small muted" if muted else "lab"}" x="{x+10:.1f}" y="{y+FS-1+j*LH:.1f}">{esc(t)}</text>')
            if r['key'] in SYBIL:
                ax = x - 10
                A(f'<line class="id" x1="{ax:.1f}" y1="{dy+6:.1f}" x2="{ax:.1f}" y2="{dy-6:.1f}" marker-end="url(#ah-{variant})"/>')
            y += len(ls) * LH + GAP
    # moves
    for a, b, lab in MOVES:
        xa, ya, ta, ba = pos[a]; xb, yb, tb, bb = pos[b]
        y0 = ta - 1; y1 = bb - 4
        A(f'<line class="move" x1="{xa:.1f}" y1="{y0:.1f}" x2="{xb:.1f}" y2="{y1+4:.1f}" marker-end="url(#am-{variant})"/>')
        my = (y0 + y1) / 2 + 4
        for j, t in enumerate(lab if (narrow or len(lab) == 1) else [' '.join(lab)]):
            A(f'<text class="small halo" x="{xa+8:.1f}" y="{my + (j - (len(lab) - 1) / 2 if narrow else 0) * 15:.1f}">{esc(t)}</text>')
    # proof-checking line: verifiability asymmetry
    pr = next(r for r in rows if r['verify'])
    px_, py_, _, _ = pos['Formal proof']
    tx = cx[colof(pr['verify'])] + DX
    A(f'<line class="verify" x1="{px_-7:.1f}" y1="{py_:.1f}" x2="{tx+5:.1f}" y2="{py_:.1f}" marker-end="url(#av-{variant})"/>')
    A(f'<circle class="dot ghost" cx="{tx:.1f}" cy="{py_:.1f}" r="4.5"/>')
    vy = py_ + 22
    vl = ['checking a proof: info L,', 'formalizable claims only'] if not narrow else ['proof check:', 'info L, only', 'formal claims']
    for j, t in enumerate(vl):
        A(f'<text class="small muted" x="{tx-6:.1f}" y="{vy + j*16:.1f}">{esc(t)}</text>')
    # corner title + composition arrow
    cyM = ys['M']; cyL = ys['L–M']
    ctx = ex0 + (DX + 10 if narrow else 12)
    title = ['Empty:', 'cheap, hard', 'to bias'] if narrow else ['No rated process is cheap', 'and hard to bias']
    ty = ys['M–H'] + (20 if narrow else 22)
    for j, t in enumerate(title):
        A(f'<text class="lab accent-text strong" x="{ctx:.1f}" y="{ty + j*17:.1f}">{esc(t)}</text>')
    # composition: from the cheap (L, L–M) cell up into the corner
    ax = ex0 + DX
    ay0 = cyL - 3
    ay1 = ty + (len(title)) * 17 + 4 - (len(title) * 17 + 14 if narrow else 0)
    A(f'<path class="compose" d="M{ax:.1f} {ay0:.1f} V{ay1+6:.1f}" marker-end="url(#ac-{variant})"/>')
    cl = (['Composition:', 'cheap filter', '+ random', 'escalation', 'unmeasured'] if narrow else
          ['Composition: cheap filter +', 'random escalation (unmeasured)'])
    cly = (ay0 + ay1) / 2 - (len(cl) - 1) * 8 + 4
    for j, t in enumerate(cl):
        if False:
            pass
        else:
            A(f'<text class="small accent-text" x="{ax+8:.1f}" y="{cly + j*16:.1f}">{esc(t)}</text>')
    # legend / compass: how families move a point (Hardening overview)
    ly = gy1 + 74
    A(f'<text class="lab strong" x="0" y="{ly:.1f}">How hardening moves a point</text>')
    leg = [
        ('up', 'Invariance, Incentives', 'costlier to bias'),
        ('up', 'Deterrence', 'costlier to bias, info cost stays low: likeliest way in'),
        ('left', 'Calibration, Verifiability asymmetry', 'cheaper validated bits'),
        ('upleft', 'Independence', 'cheaper bits and costlier to bias'),
        ('upright', 'Verification in practice', 'both costs rise, so it misses the corner'),
        ('id', 'Rows that fail by Sybil accounts', 'would rise with identity infrastructure'),
    ]
    yy = ly + 14
    for kind, who, what in leg:
        gx, gy = 14, yy + 14
        d = {'up': (0, -1), 'left': (-1, 0), 'upleft': (-.72, -.72), 'upright': (.72, -.72), 'id': (0, -1)}[kind]
        L = 13
        cls = 'id' if kind == 'id' else 'move'
        mk = 'ah' if kind == 'id' else 'am'
        A(f'<line class="{cls}" x1="{gx - d[0]*L/2:.1f}" y1="{gy - d[1]*L/2:.1f}" x2="{gx + d[0]*L/2:.1f}" y2="{gy + d[1]*L/2:.1f}" marker-end="url(#{mk}-{variant})"/>')
        if narrow:
            A(f'<text class="small" x="34" y="{yy+12:.1f}">{esc(who)}</text>')
            A(f'<text class="small muted" x="34" y="{yy+28:.1f}">{esc(what)}</text>')
            yy += 40
        else:
            A(f'<text class="small" x="34" y="{yy+18:.1f}">{esc(who)}<tspan class="muted"> — {esc(what)}</tspan></text>')
            yy += 24
    # open-dot key
    if narrow:
        A(f'<circle class="dot open" cx="14" cy="{yy+10:.1f}" r="4.5"/><text class="small muted" x="34" y="{yy+15:.1f}">proposed, not yet built</text>')
        yy += 24
    else:
        A(f'<circle class="dot open" cx="14" cy="{yy+13:.1f}" r="4.5"/><text class="small muted" x="34" y="{yy+18:.1f}">proposed, not yet built</text>')
        yy += 28
    H = yy + 6
    defs = (f'<defs>'
            f'<marker id="am-{variant}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M1 1L9 5L1 9" class="mk-move"/></marker>'
            f'<marker id="ah-{variant}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M1 1L9 5L1 9" class="mk-id"/></marker>'
            f'<marker id="av-{variant}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M1 1L9 5L1 9" class="mk-id"/></marker>'
            f'<marker id="ac-{variant}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M1 1L9 5L1 9" class="mk-acc"/></marker>'
            f'</defs>')
    return W, H, defs + ''.join(out)

ARIA = ('Grid of the Process Catalogue\'s seventeen processes by their rated information cost (L to H, left to right) '
        'and cost to bias (L to H, bottom to top). The six cells that are cheap (L or L–M) and at least medium to bias are all empty; '
        'the only entry that reaches them is checking a formal proof, which works only for formalizable claims. '
        'Arrows show moves the catalogue names: a second model adds independence (single judge to panel), real money adds incentives (tournament to real-money market), '
        'identity infrastructure would lift the Sybil-prone rows, and composition of a cheap filter with random escalation is the unmeasured bet on the empty corner.')
CAPTION = ('On the catalogue\'s own ratings, the cheap-and-hard-to-bias corner is empty: every process rated L or L–M on information cost is at most L–M to bias. '
           'Most hardening raises corruption cost by adding verification, which raises information cost too. '
           'The arrows are the moves the page names. The one drawn into the corner, composition, is unmeasured; the Hardening overview names deterrence as the likeliest family to get there. '
           'Cells are first-pass L/M/H judgments, not measurements.')

CSS = '''<style>
.pmap{margin:1.5rem 0;
 --pm-text:#2e2c28;--pm-muted:#5f5b53;--pm-line:#8f897e;--pm-hair:#d6d1c7;--pm-bg:#ffffff;--pm-accent:#2a57a6}
:root[data-theme="dark"] .pmap{--pm-text:#dcd7cd;--pm-muted:#a7a195;--pm-line:#8f897e;--pm-hair:#45423c;--pm-bg:#161514;--pm-accent:#9dbdf2}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]) .pmap{--pm-text:#dcd7cd;--pm-muted:#a7a195;--pm-line:#8f897e;--pm-hair:#45423c;--pm-bg:#161514;--pm-accent:#9dbdf2}}
.pmap svg{display:block;width:100%;height:auto;font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif}
.pmap .pm-narrow{display:none}
@media (max-width:560px){.pmap .pm-wide{display:none}.pmap .pm-narrow{display:block}}
.pmap .lab{fill:var(--pm-text);font-size:14px}
.pmap .pm-narrow .lab{font-size:13.5px}
.pmap .small{fill:var(--pm-text);font-size:13px}
.pmap .strong{font-weight:600}
.pmap .muted,.pmap tspan.muted{fill:var(--pm-muted)}
.pmap .accent-text{fill:var(--pm-accent)}
.pmap .halo{paint-order:stroke;stroke:var(--pm-bg);stroke-width:4px;stroke-linejoin:round}
.pmap .rule{stroke:var(--pm-line);stroke-width:1}
.pmap .hair{stroke:var(--pm-hair);stroke-width:1}
.pmap .corner{fill:var(--pm-accent);fill-opacity:.05;stroke:var(--pm-accent);stroke-width:1.25;stroke-dasharray:5 4}
.pmap .dot{fill:var(--pm-text)}
.pmap .dot.open{fill:var(--pm-bg);stroke:var(--pm-text);stroke-width:1.5}
.pmap .dot.ghost{fill:var(--pm-bg);stroke:var(--pm-line);stroke-width:1.25;stroke-dasharray:2 2}
.pmap .move{stroke:var(--pm-text);stroke-width:1.25;fill:none}
.pmap .id{stroke:var(--pm-line);stroke-width:1.25;fill:none}
.pmap .verify{stroke:var(--pm-line);stroke-width:1;stroke-dasharray:3 3;fill:none}
.pmap .compose{stroke:var(--pm-accent);stroke-width:1.5;stroke-dasharray:5 4;fill:none}
.pmap .mk-move{fill:none;stroke:var(--pm-text);stroke-width:1.5}
.pmap .mk-id{fill:none;stroke:var(--pm-line);stroke-width:1.5}
.pmap .mk-acc{fill:none;stroke:var(--pm-accent);stroke-width:1.5}
.pmap figcaption{font-size:.95rem;line-height:1.55;color:var(--pm-muted);margin-top:.6rem}
</style>'''

def figure():
    parts = [CSS, '<figure class="pmap">']
    for v in ('wide', 'narrow'):
        W, H, body = build(v)
        parts.append(f'<svg class="pm-{v}" viewBox="0 0 {W} {H:.0f}" role="img" aria-label="{esc(ARIA)}">{body}</svg>')
    parts.append(f'<figcaption>{esc(CAPTION)}</figcaption></figure>')
    return '\n'.join(parts)

fig = figure()
(HERE / 'figure.html').write_text(fig + '\n')

P1 = ('Plotting the catalogue on the two axes shows which processes dominate which, where the efficient frontier runs, and which cells are '
      '<em>empty</em>. The coordinates are our L/M/H judgments, not measurements, so an empty cell is a hypothesis, not a finding.')
P2 = ('<strong>Cheap and robust don\'t yet coexist.</strong> Today\'s cheap processes (LLM judges, indices, reviews) are cheap to corrupt. '
      'Today\'s robust ones (replication, proofs, deep track records) are expensive or narrow. Our bet is that the empty quadrant is reachable by '
      '<em>composition</em>: cheap processes as filters, with randomized escalation to expensive robust ones, so every attack risks meeting the expensive '
      'process\'s corruption cost while the judge mostly pays the cheap one\'s information cost.')
page = f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Process Map</title>
<style>
:root{{--t:#2e2c28;--m:#5f5b53;--bg:#ffffff;--a:#2a57a6}}
:root[data-theme="dark"]{{--t:#dcd7cd;--m:#a7a195;--bg:#161514;--a:#9dbdf2}}
@media (prefers-color-scheme: dark){{:root:not([data-theme="light"]){{--t:#dcd7cd;--m:#a7a195;--bg:#161514;--a:#9dbdf2}}}}
body{{margin:0;background:var(--bg);color:var(--t);font:17px/1.6 ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}}
main{{max-width:46rem;margin:0 auto;padding:2rem 16px 3rem}}
h1{{font-size:1.15rem;font-weight:600;margin:0 0 1rem;color:var(--m)}}
p{{margin:0 0 1rem}} a{{color:var(--a)}}
</style></head><body><main>
<h1>The Process Catalogue &middot; The map</h1>
<p>{P1}</p>
{fig}
<p>{P2}</p>
</main></body></html>
'''
(HERE / 'index.html').write_text(page)
