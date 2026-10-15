// Generates the two HomeMap SVGs (wide, narrow) and splices them into index.html
// between <!--FIG:wide--> / <!--FIG:narrow--> markers. Run: node compute.mjs
// Data: apps/reasoning-processes/src/components/ProcessMap.astro (points + family).
// Arrows: directions stated in concepts/hardening-techniques.md ("Two axes, six families")
// and concepts/hardening-deterrence.md. They are qualitative directions, not measured moves.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

// Copied verbatim (name, x=info cost, y=corruption cost, family) from ProcessMap.astro.
const points = [
  ['Formal proof', 80, 92, 'resolution'],
  ['Full replication', 90, 84, 'resolution'],
  ['Forecaster track records', 48, 80, 'resolution'],
  ['Real-money market', 54, 67, 'resolution'],
  ['Output-metered market', 62, 73, 'resolution'],
  ['Tournament', 50, 56, 'resolution'],
  ['Play-money market', 30, 28, 'resolution'],
  ['Courts', 84, 64, 'institutional'],
  ['Expert panel', 44, 46, 'institutional'],
  ['Financial audit', 46, 30, 'institutional'],
  ['Peer review', 52, 22, 'institutional'],
  ['Composite indices', 10, 7, 'institutional'],
  ['Online reviews', 19, 13, 'institutional'],
  ['Debate protocol', 58, 50, 'ai'],
  ['Consistency battery', 13, 33, 'ai'],
  ['Multi-model LLM panel', 9, 24, 'ai'],
  ['Single LLM judge', 6, 14, 'ai'],
].map(([name, x, y, family]) => ({ name, x, y, family }));

const famName = { resolution: 'grounded in resolution or track records', institutional: 'institutional judgment', ai: 'AI-native' };

// Empty corner, as in ProcessMap: info < 35, corrupt > 55.
const CORNER = { x: 35, y: 55 };
// Arrows start just off the Single LLM judge marker (6,14): the worked bound in
// hardening-deterrence.md wraps exactly this process ("a $0.01 LLM-judge call").
const ARROWS = {
  // Deterrence: raises corruption cost "at little cost on the information axis".
  deter: { from: [6, 19], to: [6, 54], label: 'Deterrence' },
  // Verification-bought hardening: "raises both axes together", parallel to the diagonal.
  verify: { from: [9, 17.5], to: [34, 40], label: 'Verification' },
};

const L = {
  wide: { W: 640, H: 396, fs: 16, sx: 6.28, x0: 2, y0: 351.5, sy: 3.075, r: 5, axisTop: 38, axisBot: 364, axisRight: 636,
    labels: {
      'Formal proof': { dx: 0, dy: -13, anchor: 'middle' },
      'Real-money market': { dx: 12, dy: 5, anchor: 'start' },
      'Peer review': { dx: 12, dy: 5, anchor: 'start' },
      'Single LLM judge': { leaderTo: [145, 346.4], at: [150, 352] },
    },
    deterLabel: [50, 228], verifyLabel: [222, 240], cornerLabelAt: [16, 70], cornerLh: 22, cornerFs: 16 },
  narrow: { W: 343, H: 356, fs: 15, sx: 3.33, x0: 2, y0: 309.9, sy: 2.7, r: 4.5, axisTop: 34, axisBot: 320, axisRight: 341,
    labels: {
      'Formal proof': { dx: 0, dy: -12, anchor: 'middle' },
      'Peer review': { dx: 10, dy: 5, anchor: 'start' },
      'Single LLM judge': { leaderTo: [77, 304], at: [82, 309] },
    },
    deterLabel: [30, 190], verifyLabel: [121, 210], cornerLabelAt: [10, 60], cornerLh: 19, cornerFs: 14 },
};

const f1 = (n) => (Math.round(n * 10) / 10).toString();

function marker(fam, cx, cy, r, title) {
  const t = `<title>${title} (${famName[fam]})</title>`;
  if (fam === 'resolution') return `<circle class="mk" cx="${f1(cx)}" cy="${f1(cy)}" r="${r}">${t}</circle>`;
  if (fam === 'institutional') {
    const s = r * 1.65; // equal-ish visual area to the circle
    return `<rect class="mk" x="${f1(cx - s / 2)}" y="${f1(cy - s / 2)}" width="${f1(s)}" height="${f1(s)}">${t}</rect>`;
  }
  const h = r * 2.3, w = r * 2.6; // upward triangle, centroid on the point
  return `<path class="mk" d="M${f1(cx)} ${f1(cy - (2 * h) / 3)}L${f1(cx + w / 2)} ${f1(cy + h / 3)}L${f1(cx - w / 2)} ${f1(cy + h / 3)}Z">${t}</path>`;
}

function arrow(cls, x1, y1, x2, y2) {
  const a = Math.atan2(y2 - y1, x2 - x1), k = 7, s = 0.45;
  const p = (ang) => `${f1(x2 - k * Math.cos(ang))} ${f1(y2 - k * Math.sin(ang))}`;
  return `<path class="${cls}" d="M${f1(x1)} ${f1(y1)}L${f1(x2)} ${f1(y2)}"/><path class="${cls}" d="M${p(a - s)}L${f1(x2)} ${f1(y2)}L${p(a + s)}"/>`;
}

const textW = (s, fs) => s.length * fs * 0.53;
const boxes = []; // for collision checks
function txt(x, y, s, fs, anchor = 'start', cls = '') {
  const w = textW(s, fs);
  const x0 = anchor === 'middle' ? x - w / 2 : anchor === 'end' ? x - w : x;
  boxes.push({ kind: 'text', s, x0, x1: x0 + w, y0: y - fs * 0.75, y1: y + fs * 0.2 });
  return `<text${cls ? ` class="${cls}"` : ''} x="${f1(x)}" y="${f1(y)}"${anchor !== 'start' ? ` text-anchor="${anchor}"` : ''}>${s}</text>`;
}

function build(key) {
  const c = L[key];
  boxes.length = 0;
  const X = (v) => c.x0 + c.sx * v, Y = (v) => c.y0 - c.sy * v;
  const out = [];
  const aria = 'Scatter plot of 17 reasoning processes by cost to run and cost to corrupt, marked by family: AI-native processes cluster at the cheap, easy-to-corrupt end, resolution-grounded ones toward the expensive, hard-to-corrupt end. The cheap-to-run, hard-to-corrupt corner is empty. Two arrows from the single LLM judge: verification moves it up and to the right along the diagonal; deterrence moves it straight up toward the empty corner.';
  out.push(`<svg class="${key}" viewBox="0 0 ${c.W} ${c.H}" width="${c.W}" height="${c.H}" style="font-size:${c.fs}px" role="img" aria-label="${aria}">`);
  // corner
  const cx1 = X(CORNER.x), cy1 = Y(CORNER.y);
  out.push(`<path class="corner" d="M${c.x0} ${f1(Y(100) + (c.axisTop + 6 - Y(100)))}H${f1(cx1)}V${f1(cy1)}H${c.x0}"/>`);
  const [clx, cly] = c.cornerLabelAt;
  ['Empty so far:', 'cheap to run,', 'hard to corrupt'].forEach((s, i) => {
    boxes.push({ kind: 'text', s, x0: clx, x1: clx + textW(s, c.cornerFs), y0: cly + i * c.cornerLh - c.cornerFs * 0.75, y1: cly + i * c.cornerLh + 3 });
    out.push(`<text class="corner-label" x="${clx}" y="${cly + i * c.cornerLh}"${key === 'narrow' ? ` style="font-size:${c.cornerFs}px"` : ''}>${s}</text>`);
  });
  // axes
  out.push(`<path class="axis" d="M${c.x0} ${c.axisTop}V${c.axisBot}H${c.axisRight}"/>`);
  out.push(`<path class="axis" d="M${c.x0 - 4} ${c.axisTop + 6}L${c.x0} ${c.axisTop - 1}L${c.x0 + 4} ${c.axisTop + 6}"/>`);
  out.push(`<path class="axis" d="M${c.axisRight - 7} ${c.axisBot - 4}L${c.axisRight} ${c.axisBot}L${c.axisRight - 7} ${c.axisBot + 4}"/>`);
  out.push(`<text class="axis-label" x="${c.x0}" y="${c.axisTop - 12}">Cost to corrupt</text>`);
  out.push(`<text class="axis-label" x="${c.axisRight}" y="${c.H - 6}" text-anchor="end">Cost to run</text>`);
  // arrows (drawn under markers)
  const segs = [];
  for (const k of ['verify', 'deter']) {
    const A = ARROWS[k];
    const [x1, y1, x2, y2] = [X(A.from[0]), Y(A.from[1]), X(A.to[0]), Y(A.to[1])];
    segs.push({ k, x1, y1, x2, y2 });
    out.push(arrow('move', x1, y1, x2, y2));
  }
  out.push(txt(c.deterLabel[0], c.deterLabel[1], ARROWS.deter.label, c.fs, 'start', 'move-label'));
  out.push(txt(c.verifyLabel[0], c.verifyLabel[1], ARROWS.verify.label, c.fs, 'start', 'move-label'));
  // markers
  const pts = points.map((p) => ({ ...p, px: X(p.x), py: Y(p.y) }));
  for (const p of pts) out.push(marker(p.family, p.px, p.py, c.r, p.name));
  // point labels
  for (const p of pts) {
    const lb = c.labels[p.name];
    if (!lb) continue;
    if (lb.leaderTo) {
      const a = Math.atan2(lb.leaderTo[1] - p.py, lb.leaderTo[0] - p.px);
      out.push(`<path class="leader" d="M${f1(p.px + 7 * Math.cos(a))} ${f1(p.py + 7 * Math.sin(a))}L${lb.leaderTo[0]} ${lb.leaderTo[1]}"/>`);
      out.push(txt(lb.at[0], lb.at[1], p.name, c.fs));
    } else out.push(txt(p.px + lb.dx, p.py + lb.dy, p.name, c.fs, lb.anchor));
  }
  out.push('</svg>');

  // ---- checks ----
  const warn = [];
  const pad = c.r + 2;
  for (const b of boxes) {
    for (const p of pts) if (p.px > b.x0 - pad && p.px < b.x1 + pad && p.py > b.y0 - pad && p.py < b.y1 + pad) warn.push(`text "${b.s}" hits marker ${p.name}`);
    if (b.x1 > c.W + 1 || b.x0 < -1) warn.push(`text "${b.s}" overflows width (${f1(b.x0)}..${f1(b.x1)})`);
    for (const s of segs) for (let t = 0; t <= 1; t += 0.02) {
      const x = s.x1 + t * (s.x2 - s.x1), y = s.y1 + t * (s.y2 - s.y1);
      if (x > b.x0 - 3 && x < b.x1 + 3 && y > b.y0 - 3 && y < b.y1 + 3) { warn.push(`arrow ${s.k} crosses text "${b.s}"`); break; }
    }
  }
  for (const s of segs) for (const p of pts) {
    // distance from marker to segment
    const vx = s.x2 - s.x1, vy = s.y2 - s.y1, t = Math.max(0, Math.min(1, ((p.px - s.x1) * vx + (p.py - s.y1) * vy) / (vx * vx + vy * vy)));
    const d = Math.hypot(p.px - (s.x1 + t * vx), p.py - (s.y1 + t * vy));
    if (d < c.r + 5) warn.push(`arrow ${s.k} within ${f1(d)}px of ${p.name}`);
  }
  for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
    const a = boxes[i], b = boxes[j];
    if (a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1) warn.push(`text "${a.s}" overlaps "${b.s}"`);
  }
  // deterrence tip must stop at the corner's lower edge, not inside it
  const dTipY = Y(ARROWS.deter.to[1]);
  if (dTipY < cy1) warn.push('deterrence arrow enters the corner');
  console.log(`${key}: ${warn.length ? warn.join('\n  ') : 'no collisions'} | deter tip ${f1(dTipY)} vs corner edge ${f1(cy1)}`);
  return out.join('\n');
}

// Family summary (sanity check for the caption / alt text).
for (const fam of ['ai', 'institutional', 'resolution']) {
  const ps = points.filter((p) => p.family === fam);
  const m = (k) => f1(ps.reduce((s, p) => s + p[k], 0) / ps.length);
  console.log(`${fam}: n=${ps.length} mean info=${m('x')} mean corrupt=${m('y')}`);
}
console.log(`in corner: ${points.filter((p) => p.x < CORNER.x && p.y > CORNER.y).length}`);

const file = path.join(here, 'index.html');
let html = fs.readFileSync(file, 'utf8');
for (const key of ['wide', 'narrow']) {
  const re = new RegExp(`<!--FIG:${key}-->[\\s\\S]*?<!--/FIG:${key}-->`);
  html = html.replace(re, `<!--FIG:${key}-->\n${build(key)}\n<!--/FIG:${key}-->`);
}
fs.writeFileSync(file, html);
