// Builds the "one review round" figure for the CAIRN Handbook homepage.
// Source of truth: apps/meta/src/content/docs/review-workflow.md (five stages).
// Model:  Audit (N read-only agents, one per section) -> merged into one Plan/brief
//         -> Edit (N parallel editors, each its own file scope)
//         -> Verify (each edit re-checked by an agent that did not make it)
//         -> Integrate (one pass: sidebars, redirects, build, link check)
//         -> PR with previews -> merge to main -> live sites.
// Encoding: filled dot = agent that writes; hollow dot = agent that only reads/checks.
// Emits two inline SVGs (wide for >= 40rem, tall for phones) and splices them into
// index.html and index.mdx between <!-- FIG:wide --> / <!-- FIG:tall --> markers.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const LANES = 3;          // drawn parallel agents; the real count is one per section / file scope
const R = 6.5;            // agent dot radius

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const txt = (x, y, s, cls = '', anchor = 'middle') =>
  `<text x="${x}" y="${y}" text-anchor="${anchor}"${cls ? ` class="${cls}"` : ''}>${esc(s)}</text>`;
const dot = (x, y, kind) => `<circle cx="${x}" cy="${y}" r="${R}" class="${kind}"/>`;
const box = (x, y, w, h, label) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" class="box"/>` + txt(x + w / 2, y + h / 2 + 4, label, 'bl');
const curve = (x1, y1, x2, y2, horiz, id) => {
  const m = horiz ? `C${(x1 + x2) / 2},${y1} ${(x1 + x2) / 2},${y2} ${x2},${y2}` : `C${x1},${(y1 + y2) / 2} ${x2},${(y1 + y2) / 2} ${x2},${y2}`;
  return `<path d="M${x1},${y1} ${m}" class="e" marker-end="url(#${id}-a)"/>`;
};
const line = (x1, y1, x2, y2, id) => `<path d="M${x1},${y1} L${x2},${y2}" class="e" marker-end="url(#${id}-a)"/>`;
const defs = id => `<defs><marker id="${id}-a" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0.5 L7.5,4 L0,7.5z" class="ah"/></marker></defs>`;
const lanes = (c, gap) => Array.from({ length: LANES }, (_, i) => c + (i - (LANES - 1) / 2) * gap);

function wide() {
  const id = 'rw', W = 624, H = 176, cy = 84, ys = lanes(cy, 30);
  const X = { audit: 46, plan: 134, edit: 226, verify: 312, integ: 410, pr: 491, merge: 532, live: 578 };
  const o = [];
  // stage headings
  [['1 Audit', X.audit], ['2 Plan', X.plan], ['3 Edit', X.edit], ['4 Verify', X.verify], ['5 Integrate', X.integ]]
    .forEach(([s, x]) => o.push(txt(x, 16, s, 'st')));
  // merge boundary
  o.push(`<path d="M${X.merge},28 L${X.merge},140" class="mg"/>`);
  o.push(txt(X.merge, 16, 'merge', 'st'));
  // audit fan-in to plan
  const plan = { x: X.plan - 24, w: 48, h: 26 };
  ys.forEach(y => { o.push(dot(X.audit, y, 'rd')); o.push(curve(X.audit + R + 2, y, plan.x - 2, cy, true, id)); });
  o.push(box(plan.x, cy - 13, plan.w, plan.h, 'brief'));
  // plan fan-out to editors, editor -> different verifier, fan-in to integrate
  const integ = { x: X.integ - 36, w: 72, h: 26 };
  ys.forEach(y => {
    o.push(curve(plan.x + plan.w + 2, cy, X.edit - R - 2, y, true, id));
    o.push(dot(X.edit, y, 'wr'));
    o.push(line(X.edit + R + 2, y, X.verify - R - 3, y, id));
    o.push(dot(X.verify, y, 'rd'));
    o.push(curve(X.verify + R + 2, y, integ.x - 2, cy, true, id));
  });
  o.push(box(integ.x, cy - 13, integ.w, integ.h, 'one pass'));
  o.push(line(integ.x + integ.w + 2, cy, X.pr - 21, cy, id));
  o.push(box(X.pr - 19, cy - 13, 38, 26, 'PRs'));
  o.push(line(X.pr + 21, cy, X.live - 32, cy, id));
  o.push(`<rect x="${X.live - 30}" y="${cy - 13}" width="76" height="26" rx="4" class="box live"/>` + txt(X.live + 8, cy + 4, 'live sites', 'bl'));
  // notes under each column
  const notes = [
    [X.audit, 'read-only,', 'per section'],
    [X.plan, 'one brief;', 'owner decides'],
    [X.edit, 'in parallel,', 'own files'],
    [X.verify, 'never the', 'editor'],
    [X.integ, 'build,', 'link check'],
    [X.pr, 'previews', 'for review'],
  ];
  notes.forEach(([x, a, b]) => { o.push(txt(x, 156, a, 'nt')); o.push(txt(x, 170, b, 'nt')); });
  o.push(txt(X.live + 8, 156, 'only after', 'nt'), txt(X.live + 8, 170, 'merge', 'nt'));
  return { W, H, id, body: o.join('') };
}

function tall() {
  const id = 'rt', W = 343, H = 318, cx = 128, xs = lanes(cx, 34);
  const Y = { audit: 22, plan: 70, edit: 118, verify: 166, integ: 214, pr: 256, merge: 280, live: 302 };
  const NX = 200; // notes column
  const o = [];
  [['1 Audit', Y.audit], ['2 Plan', Y.plan], ['3 Edit', Y.edit], ['4 Verify', Y.verify], ['5 Integrate', Y.integ]]
    .forEach(([s, y]) => o.push(txt(0, y + 4, s, 'st', 'start')));
  const plan = { y: Y.plan - 12, w: 72, h: 24 };
  xs.forEach(x => { o.push(dot(x, Y.audit, 'rd')); o.push(curve(x, Y.audit + R + 2, cx, plan.y - 2, false, id)); });
  o.push(box(cx - 36, plan.y, 72, 24, 'brief'));
  const integ = { y: Y.integ - 12 };
  xs.forEach(x => {
    o.push(curve(cx, plan.y + 24 + 2, x, Y.edit - R - 2, false, id));
    o.push(dot(x, Y.edit, 'wr'));
    o.push(line(x, Y.edit + R + 2, x, Y.verify - R - 3, id));
    o.push(dot(x, Y.verify, 'rd'));
    o.push(curve(x, Y.verify + R + 2, cx, integ.y - 2, false, id));
  });
  o.push(box(cx - 40, integ.y, 80, 24, 'one pass'));
  o.push(line(cx, integ.y + 26, cx, Y.pr - 11, id));
  o.push(box(cx - 20, Y.pr - 10, 40, 20, 'PRs'));
  o.push(`<path d="M${cx - 64},${Y.merge} L${cx + 64},${Y.merge}" class="mg"/>`);
  o.push(txt(0, Y.merge + 4, 'merge', 'st', 'start'));
  o.push(line(cx, Y.pr + 11, cx, Y.live - 12, id));
  o.push(`<rect x="${cx - 40}" y="${Y.live - 11}" width="80" height="22" rx="4" class="box live"/>` + txt(cx, Y.live + 4, 'live sites', 'bl'));
  const notes = [
    [Y.audit, 'one per section,', 'change nothing'],
    [Y.plan, 'one brief;', 'owner decides'],
    [Y.edit, 'in parallel, each', 'on its own files'],
    [Y.verify, 'never the agent', 'that made the edit'],
    [Y.integ, 'build, redirects,', 'link check'],
    [Y.pr, 'previews for review', null],
    [Y.live, 'only after merge', null],
  ];
  notes.forEach(([y, a, b]) => {
    if (b) { o.push(txt(NX, y - 2, a, 'nt', 'start'), txt(NX, y + 12, b, 'nt', 'start')); }
    else o.push(txt(NX, y + 4, a, 'nt', 'start'));
  });
  return { W, H, id, body: o.join('') };
}

const svg = ({ W, H, id, body }, cls) =>
  `<svg class="${cls}" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-labelledby="${id}-t"><title id="${id}-t">One review round: read-only auditors, one per section, feed a single plan and brief; it fans out to parallel editors; each edit is re-checked by a different agent; the parallel edits are reconciled in one pass, built and link-checked, and go up as pull requests with previews. Nothing reaches the live sites until a pull request is merged to main.</title>${defs(id)}${body}</svg>`;

const wideSvg = svg(wide(), 'rw-wide');
const tallSvg = svg(tall(), 'rw-tall');
for (const f of ['index.html', 'index.mdx']) {
  const p = join(here, f);
  let s;
  try { s = readFileSync(p, 'utf8'); } catch { continue; }
  // index.html uses HTML comments as markers; index.mdx uses JSX comments (HTML comments are invalid in MDX 3).
  const [o, c] = f.endsWith('.mdx') ? ['{/* ', ' */}'] : ['<!-- ', ' -->'];
  const q = t => t.replace(/[.*+?^${}()|[\]\\\/]/g, '\\$&');
  for (const [k, v] of [['wide', wideSvg], ['tall', tallSvg]]) {
    const re = new RegExp(q(`${o}FIG:${k}${c}`) + '[\\s\\S]*?' + q(`${o}/FIG:${k}${c}`));
    s = s.replace(re, `${o}FIG:${k}${c}${v}${o}/FIG:${k}${c}`);
  }
  writeFileSync(p, s);
}
writeFileSync(join(here, 'figure-wide.svg'), wideSvg);
writeFileSync(join(here, 'figure-tall.svg'), tallSvg);
console.log('wide', wideSvg.length, 'bytes; tall', tallSvg.length, 'bytes');
