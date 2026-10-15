// The Dashboard (Y; docs/learning/spec.md §9): what is new, how you have been reading,
// what the app learned from it, how that moved the ranking, and the agent jobs.
//
// One scrolling page: a sticky summary strip, then six cards (#db-new, #db-reading,
// #db-learned, #db-ranking, #db-jobs, #db-done) and the privacy footer. show() starts
// every request at once and paints each card as its data arrives; data is kept while
// the view is open and refetched after 30 s (r: now). "How ranking moved" is computed
// in idle time when it first scrolls into view. Nothing runs while the view is hidden.
//
// Keys here: j/k move between rows, Enter opens, s keeps and x dismisses a new item,
// r refreshes, Esc returns to the feed; the global keys (/ f w y ?) still work.
import { $, h, on, esc, store, toast, registerView, keyHelp } from '../util.js';
import { items, byId, LANES, LANE_COLORS } from '../corpus.js';
import { state } from '../state.js';
import { jumpTo } from '../nav.js';
import { setView } from '../chrome.js';

const Lm = await import('./learn.js').catch((e) => { console.error('dashboard: learn.js', e); return null; });
const idle = (fn, timeout = 1500) => (window.requestIdleCallback ? requestIdleCallback(fn, { timeout }) : setTimeout(fn, 30));
async function getJSON(url, opts) {
  const r = await fetch(url, opts);
  if (!r.ok) throw Object.assign(new Error('HTTP ' + r.status), { status: r.status });
  return r.json();
}
const post = (url, body) => getJSON(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body || {}) });

// ---------------------------------------------------------------- formatting
const laneName = (l) => LANES[l] || l || '';
const laneColor = (l) => LANE_COLORS[l] || '#7a6f60';
const clip = (s, n) => { s = String(s || ''); return s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s; };
function dur(ms, long = true) {
  if (!ms) return '0 min';
  if (ms < 60e3) return `${Math.max(1, Math.round(ms / 1000))} s`;
  const m = Math.round(ms / 60e3);
  if (m < 60) return `${m} min`;
  return long ? `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')} min` : `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')}`;
}
function ago(t) {
  if (!t) return 'never';
  const s = (Date.now() - t) / 1000;
  if (s < 0) return 'in ' + span(-s);
  if (s < 90) return 'just now';
  return span(s) + ' ago';
}
function span(s) {
  if (s < 3600) return `${Math.max(1, Math.round(s / 60))} min`;
  if (s < 86400 * 2) return `${Math.round(s / 3600)} h`;
  return `${Math.round(s / 86400)} days`;
}
const fmtDay = (d) => Lm?.fmtDay?.(d) ?? d;
const plural = (n, w, ws = w + 's') => `${n} ${n === 1 ? w : ws}`;
const GROUP = { tag: 'tag', field: 'field', path: 'folder', author: 'author', lane: 'lane', tok: 'word', style: 'style', level: 'level', form: 'form', era: 'era' };
const groupOf = (f, g) => GROUP[g] || GROUP[{ 'tag:': 'tag', 'field': 'field', 'path:': 'path', 'au:': 'author', 'lane:': 'lane', 'w:': 'tok' }[f.slice(0, f.indexOf(':') + 1)]] || 'feature';
function evidence(c = {}) {
  const parts = [[c.deep, 'deep'], [c.skim, 'skimmed'], [c.glance, 'glanced'], [c.skip, 'skipped'], [c.save, '★'], [c.more, 'more'], [c.less, 'less']]
    .filter(([n]) => n > 0).map(([n, w]) => (w === '★' ? `${Math.round(n)} ★` : `${Math.round(n)} ${w}`));
  return parts.join(' · ');
}
const day = (t) => { const d = new Date(t); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const pill = () => h('span', { className: 'new-pill', textContent: 'NEW' });
const dot = (l) => h('i', { className: 'db-dot', style: `--c:${laneColor(l)}`, title: laneName(l) });
/** A button with a data-act for QA. */
const act = (name, text, fn, title = '') => {
  const b = h('button', { type: 'button', className: 'db-a', textContent: text, title, onclick: (e) => { e.stopPropagation(); fn(e); } });
  b.dataset.act = name; return b;
};
function openItem(id) {
  const i = byId.get(id);
  if (i == null) { toast('Not in this session yet', { icon: 'info', kind: 'edge', sub: 'Reload to load the new items' }); return; }
  jumpTo(i); // 'open item': memory records the visit as reached by a jump
}
async function copy(text) {
  try { await navigator.clipboard.writeText(text); }
  catch {
    const ta = h('textarea', { value: text, style: 'position:fixed;opacity:0' }); document.body.append(ta); ta.select();
    try { document.execCommand('copy'); } finally { ta.remove(); }
  }
  toast('Copied', { icon: 'file-check', kind: 'ok', sub: 'Paste it into your agent (Claude Code)' });
}

/** A minimal Markdown renderer for job bodies: headings, paragraphs, lists, inline code, bold, links. Text is escaped. */
function md(text) {
  const inline = (s) => esc(s).replace(/>/g, '&gt;')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
    .replace(/(^|[\s(])\*([^*\s][^*]*)\*/g, '$1<i>$2</i>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  const out = []; let para = [], list = null;
  const endPara = () => { if (para.length) { out.push(`<p>${inline(para.join(' '))}</p>`); para = []; } };
  const endList = () => { if (list) { out.push(`<${list.tag}>${list.items.map((x) => `<li>${inline(x)}</li>`).join('')}</${list.tag}>`); list = null; } };
  for (const raw of String(text || '').split('\n')) {
    const line = raw.trimEnd();
    let m;
    if (!line.trim()) { endPara(); endList(); continue; }
    if ((m = /^(#{1,4})\s+(.*)$/.exec(line))) { endPara(); endList(); out.push(`<h${Math.min(6, m[1].length + 3)}>${inline(m[2])}</h${Math.min(6, m[1].length + 3)}>`); continue; }
    if ((m = /^\s*[-*]\s+(.*)$/.exec(line))) { endPara(); if (list?.tag !== 'ul') { endList(); list = { tag: 'ul', items: [] }; } list.items.push(m[1]); continue; }
    if ((m = /^\s*\d+[.)]\s+(.*)$/.exec(line))) { endPara(); if (list?.tag !== 'ol') { endList(); list = { tag: 'ol', items: [] }; } list.items.push(m[1]); continue; }
    if (list && /^\s{2,}\S/.test(raw)) { list.items[list.items.length - 1] += ' ' + line.trim(); continue; }
    endList(); para.push(line.trim());
  }
  endPara(); endList();
  const d = h('div', { className: 'db-md' }); d.innerHTML = out.join(''); return d;
}

// ---------------------------------------------------------------- the page
const root = h('section', { id: 'dashboard', hidden: true });
$('#main').append(root);
const D = {
  data: {}, err: {}, at: {}, cards: {}, painted: false,
  findsMode: 'unseen', findsMax: 100, open: new Set(), io: null, ranked: 0, q: '', qT: null, qRes: null,
};
const SKEL = () => h('div', { className: 'db-skel', textContent: 'Loading…' });
function card(id, title, sub = '') {
  const ctl = h('div', { className: 'db-ctl' });
  const body = h('div', { className: 'db-b' }, SKEL());
  const el = h('section', { id, className: 'db-card' }, h('header', { className: 'db-h' }, h('h2', { textContent: title }), sub ? h('span', { className: 'db-sub', textContent: sub }) : null, ctl), body);
  D.cards[id] = { el, ctl, body };
  return el;
}
const strip = h('div', { className: 'db-strip' });
function build() {
  root.replaceChildren(h('div', { className: 'db' },
    strip,
    h('div', { className: 'db-grid' },
      card('db-new', 'New items'), card('db-reading', 'Reading'),
      card('db-learned', 'What it learned'), card('db-ranking', 'How ranking moved'),
      card('db-jobs', 'Open jobs'), card('db-done', 'Done jobs')),
    h('footer', { className: 'db-foot', textContent: 'The app sends nothing new over the network. Job files in jobs/ are part of the public repository: they list public titles and ids, never your reading history. Open any job above to see exactly what it says.' })));
  D.painted = true;
}
function fill(id, ...kids) {
  const c = D.cards[id]; if (!c) return;
  c.body.replaceChildren(...kids.flat().filter(Boolean));
  c.el.classList.remove('fade'); void c.el.offsetWidth; c.el.classList.add('fade');
}
const note = (text, cls = 'db-empty') => h('p', { className: cls, textContent: text });
const offline = (what) => note(`Not available yet: the server has no ${what} routes (server/routes/${what === '/jobs' ? '96-jobs' : '47-learn'}.mjs).`);

// ---------------------------------------------------------------- data
const SOURCES = {
  finds: () => Lm ? Lm.loadFinds(true) : getJSON('/learn/finds.json'),
  reading: () => getJSON('/learn/reading.json?days=90'),
  full: () => Lm ? Lm.loadFull(true) : getJSON('/learn/profile.json'),
  hist: () => getJSON('/learn/history.json?days=8'),
  jobs: () => getJSON('/jobs'),
};
const PAINT = {
  finds: () => { paintNew(); paintDone(); paintStrip(); },
  reading: () => { paintReading(); paintStrip(); },
  full: () => { paintLearned(); paintStrip(); if (D.ranked) paintRanking(); },
  hist: () => { paintLearned(); if (D.ranked) paintRanking(); },
  jobs: () => { paintJobs(); paintDone(); paintStrip(); },
};
function load(keys = Object.keys(SOURCES), force = false) {
  for (const k of keys) {
    if (!force && D.at[k] && Date.now() - D.at[k] < 30e3 && !D.err[k]) continue;
    D.at[k] = Date.now();
    SOURCES[k]().then((v) => { D.data[k] = v; D.err[k] = null; }, (e) => { D.err[k] = e; })
      .then(() => { if (state.view === 'dashboard') PAINT[k](); });
  }
}
function show() {
  if (!D.painted) build();
  else for (const k of Object.keys(PAINT)) if (D.data[k] || D.err[k]) PAINT[k]();
  paintStrip();
  load();
  // How ranking moved: computed when it first scrolls into view, in idle time.
  D.io?.disconnect();
  D.io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { D.io.disconnect(); idle(() => { D.ranked = Date.now(); paintRanking(); }); } }, { root, rootMargin: '200px' });
  D.io.observe(D.cards['db-ranking'].el);
  if (!root.contains(document.activeElement)) root.focus({ preventScroll: true });
}
function hide() { D.io?.disconnect(); D.io = null; clearTimeout(D.qT); }
root.tabIndex = -1;

// ---------------------------------------------------------------- the strip
function paintStrip() {
  const f = D.data.finds, j = D.data.jobs, r = D.data.reading, full = D.data.full;
  const ls = Lm?.learnState?.();
  const nNew = f?.counts?.new ?? ls?.newIds?.size ?? 0;
  const parts = [];
  const go = (id) => () => D.cards[id]?.el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  parts.push(h('button', { type: 'button', className: 'db-s' + (nNew ? ' hot' : ''), onclick: go('db-new') }, h('b', { textContent: plural(nNew, 'new item') })));
  if (j) { const hi = (j.open || []).filter((x) => x.priority === 'high').length; parts.push(h('button', { type: 'button', className: 'db-s', onclick: go('db-jobs'), textContent: `${plural((j.open || []).length, 'open job')}${hi ? ` (${hi} high)` : ''}` })); }
  else if (D.err.jobs) parts.push(h('span', { className: 'db-s dim', textContent: 'jobs off' }));
  if (r?.totals?.week) parts.push(h('button', { type: 'button', className: 'db-s', onclick: go('db-reading'), textContent: `${dur(r.totals.week.ms)} read this week` }));
  const ex = full?.exposures ?? ls?.exposures;
  if (ex != null && (full || ls?.on)) parts.push(h('button', { type: 'button', className: 'db-s', onclick: go('db-learned'), textContent: `learned from ${plural(ex, 'item')}` }));
  else if (D.err.full) parts.push(h('span', { className: 'db-s dim', textContent: 'learning off' }));
  const sep = () => h('span', { className: 'db-dotsep', textContent: '·' });
  strip.replaceChildren(h('div', { className: 'db-sl' }, ...parts.flatMap((p, k) => (k ? [sep(), p] : [p]))),
    h('div', { className: 'db-sr' },
      j?.prompt ? act('copy-all', 'Copy instructions for your agent', () => copy(j.prompt), 'Copies a prompt that tells an agent (Claude Code in this repository) to do the open jobs') : null,
      act('reload', '↻', () => load(undefined, true), 'Fetch everything again (r)')));
}

// ---------------------------------------------------------------- New items
function findActs(x) {
  const box = h('span', { className: 'db-acts' });
  const paint = (st) => {
    box.replaceChildren();
    box.append(act('open', 'Open', () => openItem(x.id), 'Read it (Enter)'));
    if (st === 'kept') box.append(h('span', { className: 'db-st', textContent: '★ kept' }));
    else if (st === 'dismissed') box.append(h('span', { className: 'db-st', textContent: 'dismissed' }));
    else box.append(
      act('keep', 'Keep ★', () => run('keep'), 'Save it: Saved list, and it stops being new (s)'),
      act('dismiss', 'Dismiss −', () => run('dismiss'), 'Less like this: it sinks in For you (x)'));
  };
  const run = (what) => {
    if (!Lm) return;
    const [doIt, undo, done] = what === 'keep' ? [Lm.keep, Lm.unkeep, 'kept'] : [Lm.dismiss, Lm.undismiss, 'dismissed'];
    x.st = done;
    Lm.undoable(box, () => doIt(x.id), () => { undo(x.id); x.st = 'new'; }, (st) => { paint(st); row?.classList.toggle('gone', st === 'dismissed'); }, done);
    box.prepend(act('open', 'Open', () => openItem(x.id), 'Read it (Enter)'));
  };
  let row = null;
  paint(x.st);
  box.bind = (r) => { row = r; };
  box.run = run;
  return box;
}
function paintNew() {
  const c = D.cards['db-new']; if (!c) return;
  const f = D.data.finds;
  const counts = f?.counts || {};
  const unseen = (f?.items || []).filter((x) => x.st === 'new');
  const toggle = h('span', { className: 'db-seg' },
    ...[['unseen', `Unseen ${counts.new ?? unseen.length}`], ['all', 'All (90 days)']].map(([m, t]) => h('button', { type: 'button', className: D.findsMode === m ? 'on' : '', textContent: t, onclick: () => { D.findsMode = m; D.findsMax = 100; paintNew(); } })));
  c.ctl.replaceChildren(toggle,
    unseen.length ? act('walk', `Walk all ${unseen.length}`, () => Lm?.walkNew(), 'Stay in the new items in the feed (u leaves)') : null,
    unseen.length ? act('seen', 'Mark all seen', async () => { await Lm?.markSeen('all'); load(['finds'], true); }, 'Clear every NEW badge') : null);
  if (!f) { fill('db-new', D.err.finds ? offline('/learn') : SKEL()); return; }
  const list = D.findsMode === 'unseen' ? unseen : (f.items || []);
  if (!list.length) {
    fill('db-new', note(D.findsMode === 'unseen' ? 'No new items. Agents add them by doing open jobs (below).' : 'Nothing added by agent jobs in the last 90 days. Agents add items by doing open jobs (below).'));
    return;
  }
  const rows = list.slice(0, D.findsMax).map((x) => {
    const i = byId.get(x.id);
    const acts = findActs(x);
    const src = Lm?.SOURCES?.[x.via?.source] || x.via?.source || '';
    const seeds = Lm?.seedTitles?.(x.via) || [];
    const jobBtn = x.job ? h('button', { type: 'button', className: 'db-job', textContent: x.job, title: 'Show the job that added it', onclick: (e) => { e.stopPropagation(); showJob(x.job); } }) : null;
    const el = h('div', { className: 'db-row db-find' + (x.st === 'dismissed' ? ' gone' : '') + (i == null ? ' missing' : ''), tabIndex: 0 },
      h('div', { className: 'db-l1' },
        x.st === 'new' ? pill() : h('span', { className: 'db-st0', textContent: x.st === 'kept' ? '★' : x.st === 'seen' ? '✓' : '' }),
        dot(x.lane),
        h('button', { type: 'button', className: 'db-t', textContent: x.t || x.id, title: [x.t, x.a].filter(Boolean).join('\n'), onclick: () => openItem(x.id) }),
        h('span', { className: 'db-date', textContent: fmtDay(x.added) }),
        acts),
      h('div', { className: 'db-l2' },
        h('span', { className: 'db-via' }, src ? `via ${src}` : '', seeds.length ? [' · like ', ...seeds.flatMap((t, k) => [k ? ', ' : '', h('i', { textContent: t })])] : ''),
        x.why ? h('span', { className: 'db-why', textContent: x.why, title: x.why }) : null,
        i == null ? h('span', { className: 'db-why', textContent: 'reload to open' }) : null,
        jobBtn));
    el.dataset.id = x.id;
    el._open = () => openItem(x.id);
    el._keep = () => x.st !== 'kept' && acts.run('keep');
    el._dismiss = () => x.st !== 'dismissed' && acts.run('dismiss');
    acts.bind(el);
    return el;
  });
  const more = list.length > D.findsMax ? h('button', { type: 'button', className: 'db-more', textContent: `Show more (${list.length - D.findsMax})`, onclick: () => { D.findsMax += 100; paintNew(); } }) : null;
  fill('db-new', h('div', { className: 'db-list' }, rows), more);
}
function showJob(id) {
  const row = root.querySelector(`#db-done .db-row[data-id="${CSS.escape(id)}"], #db-jobs .db-row[data-id="${CSS.escape(id)}"]`);
  if (!row) { toast('Job not listed', { icon: 'info', kind: 'edge', sub: id }); return; }
  row.scrollIntoView({ behavior: 'smooth', block: 'center' });
  row.classList.remove('flash'); void row.offsetWidth; row.classList.add('flash');
  row.focus({ preventScroll: true });
}

// ---------------------------------------------------------------- Reading
function kpi(label, a, b, title = '') {
  return h('div', { className: 'db-kpi', title }, h('div', { className: 'db-kl', textContent: label }), h('div', { className: 'db-kv', textContent: a }), h('div', { className: 'db-kb', textContent: b }));
}
function paintReading() {
  const r = D.data.reading;
  if (!r) { fill('db-reading', D.err.reading ? offline('/learn') : SKEL()); return; }
  const w = r.totals?.week || {}, m = r.totals?.month || {}, st = r.streak || {};
  const kpis = h('div', { className: 'db-kpis' },
    kpi('Time read', dur(w.ms, false), `${dur(m.ms, false)} in 30 days`, 'Active reading time: the window shown and some input in the last minute, or reading aloud'),
    kpi('Items opened', String(w.items ?? 0), `${m.items ?? 0} in 30 days`, 'Items with a visit of at least 30 s'),
    kpi('Finished', String(w.finished ?? 0), `${m.finished ?? 0} in 30 days`),
    kpi('Pages', String(w.pages ?? 0), `${m.pages ?? 0} in 30 days`, 'Pages read at reading pace'),
    kpi('Streak', plural(st.current ?? 0, 'day'), `best ${st.best ?? 0}`, `Days in a row with at least ${Math.round((st.minMs || 600000) / 60000)} minutes read`));
  // 90 days of minutes per day.
  const by = new Map((r.days || []).map((d) => [d.d, d]));
  const days = []; const t0 = new Date(); t0.setHours(12, 0, 0, 0);
  for (let k = 89; k >= 0; k--) { const t = new Date(t0); t.setDate(t.getDate() - k); const key = day(t); days.push({ key, t, ...(by.get(key) || { ms: 0, items: 0, pages: 0 }) }); }
  const max = Math.max(...days.map((d) => d.ms || 0), 1);
  const W = 900, H = 64, bw = W / 90, minMs = st.minMs || 600000;
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${W} ${H + 1}`); svg.setAttribute('preserveAspectRatio', 'none'); svg.setAttribute('class', 'db-bars');
  svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', 'Minutes read per day, last 90 days');
  days.forEach((d, k) => {
    const g = document.createElementNS(NS, 'g');
    const hit = document.createElementNS(NS, 'rect');
    Object.entries({ x: k * bw, y: 0, width: bw, height: H, class: 'hit' }).forEach(([a, v]) => hit.setAttribute(a, v));
    g.append(hit);
    if (d.ms > 0) {
      const bh = Math.max(1.5, (H - 2) * (d.ms / max)), x = k * bw + 1, y = H - bh, ww = Math.max(1, bw - 2), rr = Math.min(2, ww / 2, bh);
      const p = document.createElementNS(NS, 'path');
      p.setAttribute('d', `M${x},${H}V${y + rr}Q${x},${y} ${x + rr},${y}H${x + ww - rr}Q${x + ww},${y} ${x + ww},${y + rr}V${H}Z`);
      p.setAttribute('class', d.ms >= minMs ? 'on' : 'lo');
      g.append(p);
    }
    const tt = document.createElementNS(NS, 'title');
    tt.textContent = `${d.t.toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })}: ${d.ms ? dur(d.ms) : 'nothing read'}${d.items ? ` · ${plural(d.items, 'item')}` : ''}${d.pages ? ` · ${plural(d.pages, 'page')}` : ''}`;
    g.append(tt);
    svg.append(g);
  });
  const base = document.createElementNS(NS, 'line');
  Object.entries({ x1: 0, x2: W, y1: H + 0.5, y2: H + 0.5, class: 'base' }).forEach(([a, v]) => base.setAttribute(a, v));
  svg.append(base);
  const chart = h('div', { className: 'db-chart' },
    h('div', { className: 'db-ch' }, h('span', { textContent: 'Minutes per day, 90 days' }), h('span', { className: 'db-max', textContent: `max ${dur(max, false)}` })),
    svg,
    h('div', { className: 'db-axis' }, h('span', { textContent: fmtDay(days[0].key) }), h('span', { textContent: `amber: ${Math.round(minMs / 60000)} min or more` }), h('span', { textContent: 'today' })));
  // Time per lane, 30 days.
  const lanes = Object.entries(r.lanes30 || {}).filter(([, ms]) => ms > 0).sort((a, b) => b[1] - a[1]);
  const lmax = Math.max(1, ...lanes.map(([, ms]) => ms));
  const laneBars = lanes.length ? h('div', { className: 'db-lanes' }, h('div', { className: 'db-ch' }, h('span', { textContent: 'Time per lane, 30 days' })),
    ...lanes.map(([l, ms]) => h('div', { className: 'db-lane', title: `${laneName(l)}: ${dur(ms)}` },
      h('span', { className: 'db-ln', textContent: laneName(l) }),
      h('span', { className: 'db-lb' }, h('i', { style: `width:${Math.max(1.5, (100 * ms) / lmax)}%;background:${laneColor(l)}` })),
      h('span', { className: 'db-lv', textContent: dur(ms, false) })))) : null;
  // Most valuable reads.
  const J = { save: '★', more: '+', less: '−' };
  const best = (r.best || []).slice(0, 8);
  const bestEl = best.length ? h('div', { className: 'db-best' }, h('div', { className: 'db-ch' }, h('span', { textContent: 'Most valuable reads, 90 days' })),
    ...best.map((b) => {
      const el = h('div', { className: 'db-row db-r', tabIndex: 0 },
        dot(b.lane),
        h('button', { type: 'button', className: 'db-t', textContent: b.t || b.id, title: b.t, onclick: () => openItem(b.id) }),
        h('span', { className: 'db-lbl', textContent: b.label === 'deep' ? 'deep' : b.label === 'skim' ? 'skimmed' : b.label || '' }),
        h('span', { className: 'db-j', textContent: J[b.j] || '' }),
        h('span', { className: 'db-v', textContent: Number(b.V ?? 0).toFixed(2), title: 'How much you got out of it, 0-1: time, pages and judgments' }));
      el.dataset.id = b.id; el._open = () => openItem(b.id);
      return el;
    })) : null;
  fill('db-reading', kpis, chart, h('div', { className: 'db-two' }, laneBars, bestEl));
}

// ---------------------------------------------------------------- What it learned
const weekAgo = () => {
  const lines = D.data.hist?.days || [];
  if (!lines.length) return null;
  const target = Date.now() - 7 * 864e5;
  return lines.reduce((b, x) => (Math.abs((x.at || Date.parse(x.d)) - target) < Math.abs((b.at || Date.parse(b.d)) - target) ? x : b));
};
function lamBar(l) {
  const v = Math.max(-2, Math.min(2, l || 0));
  const bar = h('span', { className: 'db-lam', title: `λ ${v.toFixed(2)}: ${(2 ** v).toFixed(2)}× your average engagement` });
  const w = (Math.abs(v) / 2) * 50;
  bar.append(h('i', { className: v < 0 ? 'neg' : 'pos', style: v < 0 ? `right:50%;width:${w}%` : `left:50%;width:${w}%` }));
  return bar;
}
function featRow(x, wk) {
  const l = x.l ?? 0;
  const prev = wk ? wk.top?.[x.f] : undefined;
  const ch = !wk ? null : prev == null ? h('span', { className: 'db-ch7 new', textContent: 'new', title: 'Not among the strongest features a week ago' })
    : Math.abs(l - prev) < 0.01 ? h('span', { className: 'db-ch7', textContent: '–', title: 'No change since a week ago' })
      : h('span', { className: 'db-ch7' + (l > prev ? ' up' : ''), textContent: `${l > prev ? '▲' : '▼'} ${Math.abs(l - prev).toFixed(2)}`, title: `Since a week ago (${prev.toFixed(2)} → ${l.toFixed(2)})` });
  const ctl = h('span', { className: 'db-fc' });
  const setC = async (mode) => {
    try { await (Lm ? Lm.setControl(x.f, mode) : post('/learn/control', { f: x.f, mode })); }
    catch { toast('Could not change it', { icon: 'circle-alert', kind: 'bad' }); return; }
    x.ctl = mode ? { mode } : null; paintCtl();
    toast(mode ? { boost: 'Boosted', mute: 'Muted', ignore: 'Ignored' }[mode] : 'Reset', { icon: mode === 'mute' ? 'thumbs-down' : mode === 'ignore' ? 'circle-alert' : 'thumbs-up', kind: 'ok', sub: clip(x.label || x.f, 40) });
    setTimeout(() => load(['full'], true), 700);
  };
  const paintCtl = () => {
    const mode = x.ctl?.mode;
    ctl.replaceChildren(...(mode
      ? [h('span', { className: 'db-mode', textContent: mode }), act('reset', 'Reset', () => setC(null), 'Back to what it learned')]
      : [act('boost', '+', () => setC('boost'), 'Boost: more of this in For you (and agents may look for more)'),
        act('mute', '−', () => setC('mute'), 'Mute: less of this, and no jobs for it'),
        act('ignore', '∅', () => setC('ignore'), 'Ignore: a spurious feature; leave it out of the ranking and the chips')]));
  };
  paintCtl();
  const ex = (x.ex || []).map((id) => byId.get(id)).filter((i) => i != null).slice(0, 3);
  const ev = evidence(x.c);
  const el = h('div', { className: 'db-row db-f' + (x.ctl?.mode === 'ignore' ? ' gone' : ''), tabIndex: 0 },
    h('div', { className: 'db-l1' },
      h('span', { className: 'db-fl', title: x.f }, h('span', { className: 'db-fn', textContent: x.label || x.f }), h('span', { className: 'db-g', textContent: groupOf(x.f, x.g) })),
      lamBar(l),
      h('span', { className: 'db-x', textContent: `${(2 ** l).toFixed(l > -1 && l < 1 ? 2 : 1)}×`, title: `${(2 ** l).toFixed(2)}× your average engagement (λ ${l.toFixed(2)}${x.l0 != null && x.l0 !== l ? `, learned ${x.l0.toFixed(2)}` : ''})` }),
      ch || h('span', { className: 'db-ch7' }),
      ctl),
    ev || ex.length ? h('div', { className: 'db-l2' },
      ev ? h('span', { className: 'db-ev', textContent: ev }) : null,
      ...ex.map((i) => h('button', { type: 'button', className: 'db-exl', textContent: clip(items[i].t, 46), title: items[i].t, onclick: (e) => { e.stopPropagation(); jumpTo(i); } }))) : null);
  el.dataset.id = x.f;
  el._open = ex.length ? () => jumpTo(ex[0]) : null;
  return el;
}
function paintLearned() {
  const c = D.cards['db-learned']; if (!c) return;
  const p = D.data.full;
  if (!p) { c.ctl.replaceChildren(); fill('db-learned', D.err.full ? offline('/learn') : SKEL()); return; }
  const on = store.get('learnOn', true) !== false;
  const sw = h('label', { className: 'db-sw', title: 'Use what it learned in the For you ranking (off: the ranking without it)' },
    h('input', { type: 'checkbox', checked: on, onchange: (e) => { Lm?.setLearnOn(e.target.checked); toast(e.target.checked ? 'Learning on' : 'Learning off', { icon: e.target.checked ? 'sparkles' : 'circle-alert', kind: 'mode', sub: e.target.checked ? 'For you uses what it learned' : 'For you ranks without it' }); } }),
    h('span', { textContent: 'Use what it learned in For you' }));
  c.ctl.replaceChildren(sw);
  if (p.on === false) { fill('db-learned', note('Learning is switched off on the server (STACKS_LEARN=0).')); return; }
  const wk = weekAgo();
  const feats = Object.entries(p.feat || {}).map(([f, v]) => ({ f, ...v }));
  const strength = (x) => (x.l || 0) * Math.sqrt(x.W || 0);
  const pos = feats.filter((x) => (x.l || 0) > 0 && x.ctl?.mode !== 'ignore').sort((a, b) => strength(b) - strength(a)).slice(0, 12);
  const neg = feats.filter((x) => (x.l || 0) < 0 && x.ctl?.mode !== 'ignore').sort((a, b) => strength(a) - strength(b)).slice(0, 6);
  const ctlOnly = feats.filter((x) => x.ctl?.mode && !pos.includes(x) && !neg.includes(x));
  const list = (title, xs, empty) => h('div', { className: 'db-fl-list' }, h('div', { className: 'db-ch' }, h('span', { textContent: title }), h('span', { className: 'db-legend', textContent: '−2 ◂ λ ▸ +2' })),
    xs.length ? xs.map((x) => featRow(x, wk)) : note(empty, 'db-empty sm'));
  // Lane mix.
  const lf = Object.entries(p.laneFactor || {}).filter(([l]) => LANES[l]).sort((a, b) => b[1] - a[1]);
  const mix = lf.length ? h('div', { className: 'db-mix' }, h('span', { className: 'db-ml', textContent: 'Lane mix in All' }),
    ...lf.map(([l, f]) => h('span', { className: 'db-chip' + (f > 1.01 ? ' up' : f < 0.99 ? ' down' : ''), title: `${laneName(l)} gets ${f.toFixed(2)}× its usual share of All` }, dot(l), `${laneName(l)} ×${f.toFixed(2)}`))) : null;
  // Search over every feature.
  const qIn = h('input', { type: 'search', className: 'db-q', placeholder: 'Find a topic, tag, author or word to boost or mute…', value: D.q, spellcheck: false });
  const qBox = h('div', { className: 'db-qres' });
  const runQ = () => {
    D.q = qIn.value.trim();
    if (!D.q) { qBox.replaceChildren(); return; }
    getJSON('/learn/features?limit=20&q=' + encodeURIComponent(D.q))
      .then((j) => { if (qIn.value.trim() === D.q) qBox.replaceChildren(...((j.items || []).length ? j.items.map((x) => featRow(x, wk)) : [note('Nothing matches.', 'db-empty sm')])); })
      .catch(() => qBox.replaceChildren(note('Search is not available.', 'db-empty sm')));
  };
  qIn.oninput = () => { clearTimeout(D.qT); D.qT = setTimeout(runQ, 220); };
  if (D.q) runQ();
  // The ranking check.
  const cal = p.calib || {};
  const check = cal.rho != null && (cal.n ?? 0) >= 10
    ? `Predicted interest vs how much you read: ρ ${Number(cal.rho).toFixed(2)} over ${cal.n} opens (target ≥ 0.2)${Number(cal.rho) < 0.2 ? ' · below target' : ''}`
    : `Not enough opens yet for the ranking check (${cal.n ?? 0} of 10)`;
  const head = h('p', { className: 'db-lead' }, `Learned from ${plural(p.exposures ?? 0, 'item')} you opened`, p.at ? ` · updated ${ago(p.at)}` : '', ` · your average engagement ${Number(p.mu0 ?? 0).toFixed(2)}`);
  fill('db-learned', head,
    h('div', { className: 'db-two' }, list('Interests', pos, 'Nothing yet: read a few items, or boost a topic below.'), list('Less of', neg, 'Nothing it would show less of yet.')),
    ctlOnly.length ? list('Your controls', ctlOnly, '') : null,
    mix, h('div', { className: 'db-search' }, qIn, qBox),
    h('p', { className: 'db-check' + (cal.rho != null && cal.rho < 0.2 && cal.n >= 10 ? ' warn' : ''), textContent: check, title: 'Spearman correlation between the predicted interest of each item when you opened it and how much you then read it (last 30 days)' }));
}

// ---------------------------------------------------------------- How ranking moved
function moveRow(m, whyBox) {
  const it = items[m.i];
  const el = h('div', { className: 'db-row db-m', tabIndex: 0 },
    h('div', { className: 'db-l1' },
      dot(it.lane),
      h('button', { type: 'button', className: 'db-t', textContent: it.t, title: it.t, onclick: () => jumpTo(m.i) }),
      h('span', { className: 'db-pl' + (m.places > 0 ? ' up' : ''), textContent: `${m.places > 0 ? '▲' : '▼'} ${Math.abs(m.places)}`, title: `${Math.abs(m.places)} places ${m.places > 0 ? 'up' : 'down'} in All, against the ranking with nothing learned` }),
      h('span', { className: 'db-iv', textContent: `I ${m.I >= 0 ? '+' : '−'}${Math.abs(m.I).toFixed(2)}`, title: 'Predicted interest, −1 to +1' })),
    whyBox);
  el.dataset.id = it.id; el._open = () => jumpTo(m.i);
  return el;
}
function paintRanking() {
  const c = D.cards['db-ranking']; if (!c) return;
  if (!Lm || D.err.full) { fill('db-ranking', offline('/learn')); return; }
  const ls = Lm.learnState();
  if (!ls.on) { fill('db-ranking', note('Learning is not running, so For you ranks without it.')); return; }
  if (!ls.registered) { fill('db-ranking', note('“Use what it learned in For you” is off (in What it learned), so the ranking has not moved.')); return; }
  const mv = Lm.rankMoves(12, 8);
  if (!mv) { fill('db-ranking', SKEL()); return; }
  const boxes = new Map();
  const rows = (xs) => xs.map((m) => { const b = h('div', { className: 'db-l2 db-whys' }); boxes.set(items[m.i].id, b); return moveRow(m, b); });
  // Since last week: lane factors and the features that changed most.
  const wk = weekAgo(), p = D.data.full;
  let since = null;
  if (wk && p) {
    const lanes = Object.entries(p.laneFactor || {}).filter(([l]) => LANES[l]).map(([l, f]) => [l, f, 2 ** (0.6 * (wk.lanes?.[l] ?? 0))]).filter(([, a, b]) => Math.abs(a - b) >= 0.01).sort((a, b) => Math.abs(b[1] - b[2]) - Math.abs(a[1] - a[2])).slice(0, 6);
    const feats = Object.entries(p.feat || {}).map(([f, v]) => [f, v.label || f, v.l || 0, wk.top?.[f] ?? 0]).filter(([, , a, b]) => Math.abs(a - b) >= 0.01).sort((a, b) => Math.abs(b[2] - b[3]) - Math.abs(a[2] - a[3])).slice(0, 5);
    since = h('div', { className: 'db-since' }, h('div', { className: 'db-ch' }, h('span', { textContent: `Since last week (${fmtDay(wk.d)})` })),
      lanes.length ? h('div', { className: 'db-mix' }, ...lanes.map(([l, a, b]) => h('span', { className: 'db-chip' + (a > b ? ' up' : ' down') }, dot(l), `${laneName(l)} ×${b.toFixed(2)} → ×${a.toFixed(2)}`))) : null,
      feats.length ? h('div', { className: 'db-mix' }, ...feats.map(([f, label, a, b]) => h('span', { className: 'db-chip' + (a > b ? ' up' : ' down'), title: f }, `${label} ${a > b ? '▲' : '▼'} ${Math.abs(a - b).toFixed(2)}`))) : null,
      !lanes.length && !feats.length ? note('No change since last week.', 'db-empty sm') : null);
  }
  fill('db-ranking',
    h('div', { className: 'db-two' },
      h('div', {}, h('div', { className: 'db-ch' }, h('span', { textContent: 'Moved up for you' })), mv.up.length ? rows(mv.up) : note('Nothing has moved up yet.', 'db-empty sm')),
      h('div', {}, h('div', { className: 'db-ch' }, h('span', { textContent: 'Moved down' })), mv.down.length ? rows(mv.down) : note('Nothing has moved down yet.', 'db-empty sm'))),
    since);
  const ids = [...boxes.keys()];
  if (ids.length) Lm.whyOf(ids).then((w) => {
    for (const [id, b] of boxes) { const v = w[id]; if (v?.chips?.length) b.replaceChildren(...v.chips.slice(0, 2).map(Lm.chipEl)); }
  }).catch(() => {});
}

// ---------------------------------------------------------------- Open jobs
const PRI = { high: 0, normal: 1, low: 2 };
function jobRow(j, done = false) {
  const open = D.open.has(j.id);
  const detail = h('div', { className: 'db-jd', hidden: !open });
  const fillDetail = () => {
    const pic = (/jobs\/assets\/([a-z-]+-\d{4}\.(?:webp|png))/.exec(j.body || '') || [])[1] || (j.asset && String(j.asset).split('/').pop());
    detail.replaceChildren(
      done ? md(j.result?.text || '(no Result section)') : md(j.body || ''),
      pic ? h('img', { className: 'db-pic', src: '/jobs/asset?name=' + encodeURIComponent(pic), alt: 'The page the reader flagged', loading: 'lazy' }) : null,
      !done ? h('div', { className: 'db-jacts' },
        j.prompt ? act('copy', 'Copy instructions for this job', () => copy(j.prompt), 'A prompt that tells an agent to do just this job') : null,
        act('dismiss-job', 'Dismiss', async () => {
          if (!confirm(`Dismiss ${j.id}? It moves to jobs/done/ and its topic cools down.`)) return;
          try { await post('/jobs/dismiss', { id: j.id }); toast('Dismissed', { icon: 'circle-check', kind: 'ok', sub: j.id }); load(['jobs'], true); }
          catch { toast('Could not dismiss', { icon: 'circle-alert', kind: 'bad', sub: j.id }); }
        }, 'Close it without doing it (moves to jobs/done/)')) : null);
  };
  if (open) fillDetail();
  const toggle = () => { const o = !D.open.has(j.id); if (o) { D.open.add(j.id); fillDetail(); } else D.open.delete(j.id); detail.hidden = !o; el.classList.toggle('open', o); };
  let meta;
  if (done) {
    const r = j.result || {};
    const counts = [r.added ? `${r.added.length} added` : null, r.changed ? `${r.changed.length} changed` : null].filter(Boolean).join(' · ') || '';
    const out = D.data.finds?.byJob?.[j.id];
    const outcome = out ? `${out.new || 0} new · ${out.seen || 0} read · ${out.kept || 0} kept · ${out.dismissed || 0} dismissed` : '';
    meta = h('div', { className: 'db-l2' },
      counts ? h('span', { className: 'db-ev', textContent: counts }) : null,
      outcome ? h('span', { className: 'db-ev', textContent: outcome, title: 'What happened to the items it added (from your reading)' }) : null,
      r.files?.length ? h('span', { className: 'db-files', textContent: r.files.join(', '), title: r.files.join('\n') }) : null);
  } else {
    const n = Array.isArray(j.inputs) ? j.inputs.length : 0;
    const want = j.wants?.count ? `wants ${j.wants.count}${j.wants.min != null ? ` (${j.wants.min}-${j.wants.max})` : ''}` : '';
    meta = h('div', { className: 'db-l2' }, h('span', { className: 'db-ev', textContent: [n ? plural(n, 'input') : '', want].filter(Boolean).join(' · ') }), j.key ? h('span', { className: 'db-files', textContent: j.key }) : null);
  }
  const el = h('div', { className: 'db-row db-jr' + (open ? ' open' : '') + (done ? ' done' : ''), tabIndex: 0 },
    h('div', { className: 'db-l1', onclick: toggle },
      done ? h('span', { className: 'db-status s-' + (j.status || 'done'), textContent: j.status || 'done' }) : h('i', { className: 'db-pri p-' + (j.priority || 'normal'), title: `${j.priority || 'normal'} priority` }),
      h('code', { className: 'db-jid', textContent: j.id }),
      done ? null : h('span', { className: 'db-type', textContent: j.type }),
      h('span', { className: 'db-jt', textContent: j.title || '', title: j.title || '' }),
      h('span', { className: 'db-date', textContent: fmtDay(done ? j.done : j.created) }),
      h('span', { className: 'db-car', textContent: '▸' })),
    meta, detail);
  el.dataset.id = j.id;
  el._open = toggle;
  return el;
}
function paintJobs() {
  const c = D.cards['db-jobs']; if (!c) return;
  const j = D.data.jobs;
  if (!j) { c.ctl.replaceChildren(); fill('db-jobs', D.err.jobs ? offline('/jobs') : SKEL()); return; }
  const res = h('span', { className: 'db-res' });
  c.ctl.replaceChildren(
    j.prompt ? act('copy-all', 'Copy instructions for your agent', () => copy(j.prompt), 'Copies a prompt that tells an agent to do the open jobs, highest priority first') : null,
    act('refresh', j.running ? 'Refreshing…' : 'Refresh jobs', async (e) => {
      const b = e.currentTarget; b.disabled = true; b.textContent = 'Refreshing…';
      try {
        const r = await post('/jobs/refresh');
        const sk = r.skipped || [];
        res.textContent = `${(r.created || []).length} created · ${(r.updated || []).length} updated · ${sk.length} skipped`;
        res.title = sk.map((s) => `${s.key}: ${s.why}`).join('\n');
        load(['jobs'], true);
      } catch { res.textContent = 'refresh failed'; }
      finally { b.disabled = false; b.textContent = 'Refresh jobs'; }
    }, 'Write jobs from what it learned and from gaps in the library (never deletes or closes jobs)'), res);
  const open = (j.open || []).slice().sort((a, b) => (PRI[a.priority] ?? 1) - (PRI[b.priority] ?? 1) || String(a.created).localeCompare(String(b.created)));
  const types = {}; for (const x of open) types[x.type] = (types[x.type] || 0) + 1;
  const info = h('div', { className: 'db-jinfo' },
    h('span', { textContent: `Last refreshed ${ago(j.lastRefresh)}${j.nextRefresh ? ` · next ${ago(j.nextRefresh)}` : j.every === 0 ? ' · automatic refresh off' : ''}` }),
    Object.keys(types).length ? h('span', { className: 'db-types', textContent: Object.entries(types).map(([t, n]) => `${n} ${t}`).join(' · ') }) : null);
  const hint = h('p', { className: 'db-hint' }, 'Using an agent in the cloud? Commit and push ', h('code', { textContent: 'jobs/open/' }), ' first: ',
    h('code', { className: 'db-cmd', textContent: `git add ${j.repoPath || 'apps/open-stacks/browser'}/${j.dir || 'jobs'}/open && git commit -m "Stacks: open jobs" && git push` }), '. The app never runs git.');
  fill('db-jobs', info, open.length ? h('div', { className: 'db-list' }, open.map((x) => jobRow(x))) : note('No open jobs. Refresh jobs writes them from your reading and from gaps in the library; ! in the reader flags a problem for an agent.'), hint);
}
function paintDone() {
  const j = D.data.jobs;
  if (!j) { fill('db-done', D.err.jobs ? offline('/jobs') : SKEL()); return; }
  const done = (j.done || []).slice(0, 30);
  fill('db-done', done.length ? h('div', { className: 'db-list' }, done.map((x) => jobRow(x, true))) : note('No jobs done yet. When an agent closes a job (node jobs.mjs done), it shows here with what it added.'));
}

// ---------------------------------------------------------------- keys
const rows = () => [...root.querySelectorAll('.db-row')].filter((r) => r.offsetParent);
function focusRow(d) {
  const rs = rows(); if (!rs.length) return;
  const at = rs.indexOf(document.activeElement?.closest?.('.db-row'));
  const k = at < 0 ? (d > 0 ? 0 : rs.length - 1) : Math.max(0, Math.min(rs.length - 1, at + d));
  rs[k].focus({ preventScroll: true });
  rs[k].scrollIntoView({ block: 'nearest' });
}
document.addEventListener('keydown', (e) => {
  if (state.view !== 'dashboard' || e.metaKey || e.ctrlKey || e.altKey) return;
  if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) {
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); e.target.blur(); root.focus({ preventScroll: true }); }
    return;
  }
  const row = document.activeElement?.closest?.('#dashboard .db-row');
  const fn = {
    j: () => focusRow(1), ArrowDown: () => focusRow(1), k: () => focusRow(-1), ArrowUp: () => focusRow(-1),
    Enter: () => (row?._open ? row._open() : focusRow(1)),
    s: () => row?._keep?.(), x: () => row?._dismiss?.(),
    r: () => { load(undefined, true); toast('Refreshing', { icon: 'rotate-ccw', sub: 'Dashboard' }); },
    Escape: () => setView('feed'),
  }[e.key];
  if (!fn) return;
  if (e.key === 'Enter' && e.target.tagName === 'BUTTON') return; // a focused button clicks itself
  e.preventDefault(); e.stopPropagation();
  if (!e.repeat || /^(j|k|Arrow)/.test(e.key)) fn();
}, true);

registerView('dashboard', { label: 'Dashboard', key: 'Y', order: 4, roots: () => [root], show, hide });
keyHelp.push({ label: 'Y', text: 'dashboard: new items, reading, what it learned, ranking, agent jobs', order: 64.5 });
on('learn:new', () => { if (state.view === 'dashboard') paintStrip(); });
