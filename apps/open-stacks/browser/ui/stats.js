// /stats.html: reading time, lanes, the items you spent longest on, page-turn
// latency and the cache, from GET /events/summary and GET /status.
const $ = (s) => document.querySelector(s);
const h = (tag, props = {}, ...kids) => {
  const el = Object.assign(document.createElement(tag), props);
  for (const k of kids.flat()) if (k != null && k !== false) el.append(k);
  return el;
};
const NS = 'http://www.w3.org/2000/svg';
const s = (tag, attrs = {}, ...kids) => { const el = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v); el.append(...kids); return el; };
const LANE_COLORS = {
  lesswrong: '#5a7a4b', 'ai-safety': '#a0442f', 'deepmind-safety': '#3f6fb5', forecasting: '#b5833f', llm: '#3c5a7a',
  textbooks: '#7a3c5a', 'information-theory': '#6b4f8a', cybernetics: '#2f7a76', ttrpg: '#8a5a2b', oddities: '#7a6f60',
};
const fmtMs = (ms) => ms == null ? '–' : ms < 1000 ? `${Math.round(ms)} ms` : `${(ms / 1000).toFixed(ms < 10e3 ? 2 : 1)} s`;
const fmtMin = (m) => m >= 90 ? `${(m / 60).toFixed(1)} h` : m >= 1 ? `${Math.round(m)} min` : `${Math.round(m * 60)} s`;
const fmtMB = (b) => b >= 1e9 ? `${(b / 1e9).toFixed(2)} GB` : `${(b / 1e6).toFixed(0)} MB`;
const pctTxt = (r) => r == null ? '–' : `${Math.round(r * 100)}%`;
const ago = (t) => { const d = (Date.now() - t) / 864e5; return d < 1 ? 'today' : d < 2 ? 'yesterday' : `${Math.floor(d)} days ago`; };
let laneNames = {};
const laneEl = (l) => h('span', { className: 'lane' }, h('span', { className: 'sw', style: `background:${LANE_COLORS[l] || '#6f685d'}` }), laneNames[l] || l || '?');

// One tooltip for every chart: marks set data-tip (HTML-free text, lines split by \n).
const tip = h('div', { className: 'tip', hidden: true });
document.body.append(tip);
document.addEventListener('mousemove', (e) => {
  const t = e.target.closest?.('[data-tip]');
  if (!t) { tip.hidden = true; return; }
  const [head, ...rest] = t.dataset.tip.split('\n');
  tip.replaceChildren(h('b', { textContent: head }), ...rest.flatMap((x) => [h('br'), x]));
  tip.hidden = false;
  const x = Math.min(e.clientX + 14, innerWidth - tip.offsetWidth - 8);
  tip.style.left = x + 'px'; tip.style.top = (e.clientY + 14) + 'px';
});

function niceMax(v) { if (v <= 0) return 1; const p = 10 ** Math.floor(Math.log10(v)); return [1, 2, 2.5, 5, 10].map((m) => m * p).find((m) => m >= v); }

/** Columns per day: minutes, with items, turns and latency in the tooltip. */
function dayChart(perDay, days, first) {
  const map = new Map(perDay.map((d) => [d.date, d]));
  const end = new Date(); end.setHours(0, 0, 0, 0);
  const n = days > 0 ? days : Math.max(1, Math.min(365, Math.round((end - new Date(new Date(first || Date.now()).setHours(0, 0, 0, 0))) / 864e5) + 1));
  const rows = [];
  for (let k = n - 1; k >= 0; k--) {
    const d = new Date(end - k * 864e5);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    rows.push({ key, d, ...(map.get(key) || { minutes: 0, items: 0, turns: 0 }) });
  }
  const W = 1180, H = 170, L = 34, B = 20, T = 6;
  const max = niceMax(Math.max(1, ...rows.map((r) => r.minutes)));
  const band = (W - L) / rows.length, bw = Math.max(2, Math.min(24, band * 0.7));
  const svg = s('svg', { viewBox: `0 0 ${W} ${H}`, width: W, role: 'img', 'aria-label': 'Minutes of reading per day' });
  for (const f of [0, 0.5, 1]) {
    const y = T + (H - B - T) * (1 - f);
    svg.append(s('line', { class: 'grid', x1: L, x2: W, y1: y, y2: y }), s('text', { x: L - 6, y: y + 4, 'text-anchor': 'end' }, String(Math.round(max * f))));
  }
  const every = Math.ceil(rows.length / 12);
  rows.forEach((r, j) => {
    const x = L + band * j + (band - bw) / 2;
    const bh = (H - B - T) * (r.minutes / max);
    const y = H - B - bh;
    if (r.minutes > 0) {
      // Rounded top, square at the baseline.
      const rr = Math.min(4, bw / 2, bh);
      svg.append(s('path', { class: 'bar', d: `M${x},${H - B}V${y + rr}Q${x},${y} ${x + rr},${y}H${x + bw - rr}Q${x + bw},${y} ${x + bw},${y + rr}V${H - B}Z` }));
    }
    if ((rows.length - 1 - j) % every === 0) svg.append(s('text', { x: x + bw / 2, y: H - 5, 'text-anchor': 'middle' }, r.d.toLocaleDateString(undefined, rows.length > 14 ? { month: 'short', day: 'numeric' } : { weekday: 'short', day: 'numeric' })));
    const lat = r.lat ? `page turns p50 ${fmtMs(r.lat.p50)} · p90 ${fmtMs(r.lat.p90)}` : '';
    svg.append(s('rect', { class: 'hit', x: L + band * j, y: T, width: band, height: H - B - T,
      'data-tip': `${r.d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}\n${r.minutes} minutes · ${r.items} items · ${r.turns} turns${lat ? '\n' + lat : ''}` }));
  });
  return svg;
}

/** Columns per hour of the day (for the Today view). */
function hourChart(hours) {
  const W = 1180, H = 150, L = 34, B = 20, T = 6;
  const max = niceMax(Math.max(1, ...hours));
  const band = (W - L) / 24, bw = Math.min(24, band * 0.7);
  const svg = s('svg', { viewBox: `0 0 ${W} ${H}`, width: W, role: 'img', 'aria-label': 'Minutes of reading per hour' });
  for (const f of [0, 0.5, 1]) {
    const y = T + (H - B - T) * (1 - f);
    svg.append(s('line', { class: 'grid', x1: L, x2: W, y1: y, y2: y }), s('text', { x: L - 6, y: y + 4, 'text-anchor': 'end' }, String(+(max * f).toFixed(1))));
  }
  hours.forEach((m, j) => {
    const x = L + band * j + (band - bw) / 2, bh = (H - B - T) * (m / max), y = H - B - bh, rr = Math.min(4, bw / 2, bh);
    if (m > 0) svg.append(s('path', { class: 'bar', d: `M${x},${H - B}V${y + rr}Q${x},${y} ${x + rr},${y}H${x + bw - rr}Q${x + bw},${y} ${x + bw},${y + rr}V${H - B}Z` }));
    if (j % 3 === 0) svg.append(s('text', { x: x + bw / 2, y: H - 5, 'text-anchor': 'middle' }, `${String(j).padStart(2, '0')}:00`));
    svg.append(s('rect', { class: 'hit', x: L + band * j, y: T, width: band, height: H - B - T, 'data-tip': `${String(j).padStart(2, '0')}:00 to ${String(j + 1).padStart(2, '0')}:00\n${fmtMin(m)}` }));
  });
  return svg;
}

/** Horizontal bars, label left, value at the tip. */
function barList(rows, { label, value, fmt, tipOf }) {
  if (!rows.length) return h('div', { className: 'empty', textContent: 'Nothing yet.' });
  const max = Math.max(...rows.map(value)) || 1;
  const W = 560, rowH = 24, L = 170, R = 64;
  const svg = s('svg', { viewBox: `0 0 ${W} ${rows.length * rowH}`, width: W });
  rows.forEach((r, j) => {
    const y = j * rowH, bw = Math.max(2, (W - L - R) * (value(r) / max));
    svg.append(
      s('text', { class: 'lbl', x: 0, y: y + 16 }, label(r)),
      s('path', { class: 'bar', d: `M${L},${y + 6}H${L + bw - Math.min(4, bw / 2)}Q${L + bw},${y + 6} ${L + bw},${y + 10}V${y + 14}Q${L + bw},${y + 18} ${L + bw - Math.min(4, bw / 2)},${y + 18}H${L}Z` }),
      s('text', { x: L + bw + 6, y: y + 16 }, fmt(value(r))),
      s('rect', { class: 'hit', x: 0, y, width: W, height: rowH, 'data-tip': tipOf(r) }),
    );
  });
  return svg;
}

function tile(label, value, unit, detail) {
  return h('div', { className: 'tile' }, h('div', { className: 'l', textContent: label }),
    h('div', { className: 'v' }, value, unit ? h('small', { textContent: unit }) : null), h('div', { className: 'd', textContent: detail || '' }));
}

/** Summary spend, if a summaries feature reports one in /status. */
function spendOf(st) {
  for (const k of Object.keys(st)) {
    if (!/spend|cost/i.test(k)) continue;
    const v = st[k];
    if (typeof v === 'number') return { total: v };
    if (v && typeof v === 'object') {
      const total = v.total ?? v.usd ?? v.totalUsd ?? v.all ?? v.month;
      const today = v.today ?? v.day;
      if (typeof total === 'number' || typeof today === 'number') return { total, today, budget: v.budget, calls: v.calls };
    }
  }
  return null;
}
const usd = (x) => x == null ? '–' : `$${x < 10 ? x.toFixed(2) : x.toFixed(0)}`;

function latTable(L) {
  const NAV = { turn: 'Page turn', item: 'Next / previous item', page: 'Jump to a page', random: 'Random spot', lane: 'Lane switch', back: 'Back (undo)', zoom: 'Zoom in or out' };
  const rows = [['All navigation', L.all], ...Object.entries(L.nav).sort((a, b) => b[1].n - a[1].n).map(([k, v]) => [NAV[k] || k, v]),
    ...Object.entries(L.kind).sort((a, b) => b[1].n - a[1].n).map(([k, v]) => [`${k} items`, v])];
  if (L.boot?.n) rows.push(['App start to first spread', L.boot]);
  return h('table', {},
    h('tr', {}, h('th', { textContent: '' }), ...['n', 'p50', 'p90', 'p99'].map((c) => h('th', { className: 'num', textContent: c }))),
    rows.map(([name, p], j) => h('tr', { style: j === 0 ? 'font-weight:600' : '' }, h('td', { textContent: name }),
      h('td', { className: 'num', textContent: String(p.n) }), h('td', { className: 'num', textContent: fmtMs(p.p50) }),
      h('td', { className: 'num', textContent: fmtMs(p.p90) }), h('td', { className: 'num', textContent: fmtMs(p.p99) }))));
}
function histChart(hist) {
  const tot = hist.reduce((a, b) => a + b.n, 0);
  if (!tot) return null;
  const W = 560, H = 96, B = 18, band = W / hist.length, bw = Math.min(24, band * 0.6);
  const max = Math.max(...hist.map((b) => b.n));
  const svg = s('svg', { viewBox: `0 0 ${W} ${H}`, width: W, role: 'img', 'aria-label': 'Latency distribution', style: 'margin-top:12px' });
  svg.append(s('line', { class: 'grid', x1: 0, x2: W, y1: H - B, y2: H - B }));
  hist.forEach((b, j) => {
    const bh = (H - B - 14) * (b.n / max), x = band * j + (band - bw) / 2, y = H - B - bh, rr = Math.min(4, bh, bw / 2);
    const name = b.hi == null ? `≥ ${fmtMs(b.lo)}` : `< ${fmtMs(b.hi)}`;
    if (b.n) svg.append(s('path', { class: 'bar' + (b.lo >= 400 ? ' dim' : ''), d: `M${x},${H - B}V${y + rr}Q${x},${y} ${x + rr},${y}H${x + bw - rr}Q${x + bw},${y} ${x + bw},${y + rr}V${H - B}Z` }));
    if (b.n) svg.append(s('text', { x: x + bw / 2, y: y - 3, 'text-anchor': 'middle' }, `${Math.round((100 * b.n) / tot)}%`));
    svg.append(s('text', { x: x + bw / 2, y: H - 4, 'text-anchor': 'middle' }, name));
    svg.append(s('rect', { class: 'hit', x: band * j, y: 0, width: band, height: H, 'data-tip': `${b.hi == null ? `${fmtMs(b.lo)} or more` : `${fmtMs(b.lo)} to ${fmtMs(b.hi)}`}\n${b.n} navigations (${((100 * b.n) / tot).toFixed(1)}%)` }));
  });
  return svg;
}

async function load(days) {
  const [sum, st] = await Promise.all([
    fetch(`/events/summary?days=${days}`).then((r) => r.json()),
    fetch('/status').then((r) => r.json()).catch(() => ({})),
  ]);
  laneNames = sum.laneNames || {};
  const minutes = sum.perDay.reduce((a, d) => a + d.minutes, 0);
  const activeDays = sum.perDay.filter((d) => d.minutes > 0).length;
  const sessionRate = st.hits + st.misses ? st.hits / (st.hits + st.misses) : null;
  const spend = spendOf(st);
  const turns = sum.latency.nav.turn || sum.latency.all;
  $('#span').textContent = sum.first ? `since ${new Date(sum.first).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} · ${sum.sessions} session${sum.sessions === 1 ? '' : 's'}` : 'no events yet';

  $('#tiles').replaceChildren(
    tile('Items viewed', String(sum.itemsViewed), '', sum.lanes.length ? `across ${sum.lanes.length} lane${sum.lanes.length > 1 ? 's' : ''}` : ''),
    tile('Time reading', minutes >= 90 ? (minutes / 60).toFixed(1) : String(Math.round(minutes)), minutes >= 90 ? 'h' : 'min', activeDays ? `${fmtMin(minutes / activeDays)} per active day` : ''),
    tile('Page turn, median', turns.n ? fmtMs(turns.p50).split(' ')[0] : '–', turns.n ? fmtMs(turns.p50).split(' ')[1] : '', turns.n ? `p90 ${fmtMs(turns.p90)} · p99 ${fmtMs(turns.p99)} · ${turns.n} turns` : 'no page turns yet'),
    tile('Cache hit rate', sum.cache.rate != null ? String(Math.round(sum.cache.rate * 100)) : sessionRate != null ? String(Math.round(sessionRate * 100)) : '–', '%', `${(sum.cache.hits + sum.cache.misses).toLocaleString()} requests · this run ${pctTxt(sessionRate)}`),
    spend ? (spend.total != null
      ? tile('Summary spend', usd(spend.total), '', spend.today != null ? `today ${usd(spend.today)}` : `${st.summaries || 0} summaries this run`)
      : tile('Summary spend today', usd(spend.today), '', [spend.budget != null && `budget ${usd(spend.budget)} a day`, spend.calls != null && `${spend.calls} calls`].filter(Boolean).join(' · ')))
      : tile('Summaries', String(sum.summaries), '', st.summariesEnabled ? `model ${st.model}` : 'AI summaries off'),
  );

  $('#days-h').firstChild.textContent = days === 1 ? 'Minutes per hour today ' : 'Minutes per day ';
  $('#days').replaceChildren(days === 1 ? hourChart(sum.hours) : sum.perDay.length || days ? dayChart(sum.perDay, days, sum.first) : h('div', { className: 'empty', textContent: 'Nothing yet.' }));

  const laneTot = sum.lanes.reduce((a, l) => a + l.minutes, 0) || 1;
  $('#lanes').replaceChildren(barList(sum.lanes, {
    label: (r) => laneNames[r.lane] || r.lane, value: (r) => r.minutes, fmt: fmtMin,
    tipOf: (r) => `${laneNames[r.lane] || r.lane}\n${fmtMin(r.minutes)} · ${Math.round((100 * r.minutes) / laneTot)}% of your time`,
  }));

  $('#lat').replaceChildren(sum.latency.all.n || sum.latency.boot?.n ? latTable(sum.latency) : h('div', { className: 'empty', textContent: 'No navigations recorded yet.' }), histChart(sum.latency.hist) || '');

  $('#top').replaceChildren(sum.top.length ? h('table', {},
    h('tr', {}, h('th', { textContent: 'Item' }), h('th', { textContent: 'Lane' }), ...['Time', 'Visits', 'Turns'].map((c) => h('th', { className: 'num', textContent: c })), h('th', { className: 'num', textContent: 'Last seen' })),
    sum.top.map((x) => h('tr', {},
      h('td', { className: 't', title: x.t }, x.page ? h('a', { href: x.page, target: '_blank', rel: 'noopener', textContent: x.t, style: 'color:inherit' }) : x.t, x.a ? h('span', { className: 'a', textContent: [String(x.a).split(/[;,(]/)[0], x.y].filter(Boolean).join(', ') }) : ''),
      h('td', {}, laneEl(x.lane)),
      h('td', { className: 'num', textContent: fmtMin(x.ms / 60e3) }), h('td', { className: 'num', textContent: String(x.visits) }),
      h('td', { className: 'num', textContent: String(x.turns || 0) }), h('td', { className: 'num', textContent: ago(x.last) }))),
  ) : h('div', { className: 'empty', textContent: 'Spend a little time on an item and it shows up here.' }));

  // Cache: size against the cap, hit rates, warm-up and per-host politeness.
  const fill = st.cacheMax ? Math.min(1, st.cacheBytes / st.cacheMax) : 0;
  const hostRows = Object.entries(st.hosts || {}).sort((a, b) => b[1].requests - a[1].requests).slice(0, 6);
  $('#cache').replaceChildren(
    st.cacheMax ? h('div', {}, h('div', { textContent: `${fmtMB(st.cacheBytes)} of ${fmtMB(st.cacheMax)} · ${st.cacheEntries.toLocaleString()} files` }), h('div', { className: 'meter' }, h('div', { style: `width:${(fill * 100).toFixed(1)}%` }))) : '',
    h('dl', { className: 'kv' },
      h('dt', { textContent: 'Hit rate, this period' }), h('dd', { textContent: `${pctTxt(sum.cache.rate)} of ${(sum.cache.hits + sum.cache.misses).toLocaleString()} page and document requests` }),
      h('dt', { textContent: 'Hit rate, this run' }), h('dd', { textContent: `${pctTxt(sessionRate)} · ${fmtMB(st.bytes || 0)} fetched · ${st.failed || 0} failed` }),
      st.evicted != null ? [h('dt', { textContent: 'Evicted this run' }), h('dd', { textContent: `${st.evicted} files (least recently used first)` })] : null,
      st.warm ? [h('dt', { textContent: 'Warm-up' }), h('dd', { textContent: st.warm.state === 'off' ? 'off (STACKS_WARM_MB=0)' : `${st.warm.state} · ${st.warm.done}/${st.warm.planned} checked · ${st.warm.fetched} fetched · ${st.warm.mb} of ${st.warm.capMb} MB` })] : null,
    ),
    hostRows.length ? h('table', { style: 'margin-top:10px' },
      h('tr', {}, h('th', { textContent: 'Host' }), ...['Requests', 'Peak concurrent', 'Throttled'].map((c) => h('th', { className: 'num', textContent: c }))),
      hostRows.map(([name, x]) => h('tr', {}, h('td', { textContent: name + (x.pausedMs ? ` (paused ${Math.ceil(x.pausedMs / 1000)} s)` : '') }),
        h('td', { className: 'num', textContent: String(x.requests) }), h('td', { className: 'num', textContent: String(x.peak) }), h('td', { className: 'num', textContent: String(x.throttled) })))) : '',
  );

  const KEYTXT = { j: 'next item', k: 'previous', l: 'next pages', h: 'previous pages', ArrowRight: 'next pages', ArrowLeft: 'previous pages', ' ': 'space', z: 'zoom', r: 'random', s: 'save', a: 'summarize', '/': 'search', w: 'wall' };
  $('#misc').replaceChildren(
    h('dl', { className: 'kv' },
      h('dt', { textContent: 'Summaries opened' }), h('dd', { textContent: String(sum.summaries) }),
      spend ? [h('dt', { textContent: 'Summary spend' }), h('dd', { textContent: [spend.total != null && `${usd(spend.total)} in all`, spend.today != null && `${usd(spend.today)} today`, spend.budget != null && `budget ${usd(spend.budget)} a day`].filter(Boolean).join(' · ') })] : null,
      h('dt', { textContent: 'Model' }), h('dd', { textContent: st.summariesEnabled ? st.model : 'off (no ANTHROPIC_API_KEY)' }),
      h('dt', { textContent: 'Sessions' }), h('dd', { textContent: String(sum.sessions) }),
    ),
    sum.keys.length ? h('p', { className: 'keys', style: 'margin:12px 0 0' }, h('span', { textContent: 'Keys you use most:' }),
      sum.keys.slice(0, 14).flatMap(([k, n]) => [h('span', { title: KEYTXT[k] || '' }, h('kbd', { textContent: k === ' ' ? 'Space' : k }), ` ${n}`), ' '])) : '',
    // Moves per navigation type and input (a key, wheel, pinch or a click), so before and after can be compared.
    sum.navs?.length ? h('p', { className: 'keys', style: 'margin:8px 0 0' }, h('span', { textContent: 'Moves by input:' }),
      sum.navs.slice(0, 18).flatMap(([k, n]) => { const [type, inp] = k.split(/:(.*)/s); return [h('span', { title: `${type} by ${inp === ' ' ? 'Space' : inp}` }, `${type} `, h('kbd', { textContent: inp === ' ' ? 'Space' : inp === 'mousedown' ? 'click' : inp }), ` ${n}`), ' ']; })) : '',
  );
}

let days = Number(new URLSearchParams(location.search).get('days') ?? 7);
function pick(d) {
  days = d;
  for (const b of document.querySelectorAll('#range button')) b.classList.toggle('on', Number(b.dataset.d) === d);
  history.replaceState(null, '', `?days=${d}`);
  load(d).catch((e) => { $('#tiles').replaceChildren(h('div', { className: 'empty', textContent: 'Could not load stats: ' + e.message })); });
}
for (const b of document.querySelectorAll('#range button')) b.onclick = () => pick(Number(b.dataset.d));
pick(days);
