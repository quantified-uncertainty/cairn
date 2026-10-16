#!/usr/bin/env node
// Server-side rendering against pdf.js, in headless Chromium (docs/performance/prerender.md, section 7.1):
// two running servers on the same PDFs, one with an engine and one with STACKS_RENDER_ENGINE=none,
// measured interleaved, trial by trial.
//
//   node test/render-bench.mjs --on 4747 --off 4748 [--ids a,b] [--trials 6] [--w 1512 --h 982 --dpr 2]
//
// Per item: first spread with the tab's caches dropped (pages already rendered on the server: T1;
// rendered on demand after POST /render/forget: T2), page turns every 400 ms (warm: prepared ahead)
// and with the tab's renders dropped before each turn (cold), and hops to the next PDF 1 s apart.
// Times run from the action to 'spread:rendered'. Also checks that text-layer words land in the same
// place over server pages as over pdf.js pages. Needs Playwright (PLAYWRIGHT_CHROMIUM_EXECUTABLE for
// another Chromium).
import { createRequire } from 'module';
import { execSync } from 'child_process';
import { join } from 'path';

const argv = process.argv.slice(2);
const arg = (n, d) => { const i = argv.indexOf('--' + n); return i < 0 ? d : argv[i + 1]; };
const IDS = arg('ids', 'arxiv:1706.03762,arxiv:2212.08073,arxiv:2304.06528,arxiv:2401.05566,arxiv:1606.06565').split(',');
const TRIALS = Number(arg('trials', 6));
const VIEW = { width: Number(arg('w', 1512)), height: Number(arg('h', 982)) }, DPR = Number(arg('dpr', 2));
const SRV = { on: `http://localhost:${arg('on', 4747)}`, off: `http://localhost:${arg('off', 4748)}` };
let pw = null;
try { pw = await import('playwright'); } catch { try { pw = createRequire(join(execSync('npm root -g').toString().trim(), 'x.js'))('playwright'); } catch { /* none */ } }
if (!pw) { console.log('Playwright is not installed.'); process.exit(0); }
const exe = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
const browser = await pw.chromium.launch(exe ? { executablePath: exe } : {});
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const pct = (xs, q) => { if (!xs.length) return null; const s = [...xs].sort((a, b) => a - b); return Math.round(s[Math.min(s.length - 1, Math.floor(q * s.length))]); };

// In the page: the helpers the trials call (modules imported from the app itself).
const HELPERS = async () => {
  const [{ items, byId }, { state }, { on }, nav, render, docs] = await Promise.all(['/js/corpus.js', '/js/state.js', '/js/util.js', '/js/nav.js', '/js/render.js', '/js/docs.js'].map((m) => import(m)));
  let rendered = null;
  on('spread:rendered', (d) => rendered?.(d));
  const waitRendered = (id, timeout = 30000) => new Promise((res) => {
    const t = setTimeout(() => { rendered = null; res(null); }, timeout);
    rendered = (d) => { if (d.it.id === id) { clearTimeout(t); rendered = null; res(performance.now()); } };
  });
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const srcOf = () => [...document.querySelectorAll('#spread .pg')].map((e) => e._pnl?.src).filter(Boolean);
  async function goTo(id, s) {
    const i = byId.get(id);
    state.order.splice(state.pos + 1, 0, i);
    state.start.set(i, s); state.hist?.set?.(i, []); state.zoom = false;
    const p = waitRendered(id); const t0 = performance.now();
    nav.go(state.pos + 1);
    const t1 = await p;
    return t1 == null ? null : t1 - t0;
  }
  window.__rb = {
    async cold(id) { render.dropRenders(); docs.dropDocs(); await sleep(150); const ms = await goTo(id, 0); await sleep(300); return { ms, src: srcOf() }; },
    async turns(id, count, cold, every = 400) {
      await goTo(id, 0); await sleep(2000);
      const out = [], srcs = [];
      for (let t = 0; t < count; t++) {
        if (cold) render.dropRenders();
        const p = waitRendered(id, 15000); const t0 = performance.now();
        if (!nav.turn(1)) break;
        const t1 = await p; if (t1 != null) out.push(t1 - t0);
        srcs.push(...srcOf());
        await sleep(every);
      }
      return { ms: out, src: srcs };
    },
    async hops(ids, every = 1000) {
      const idx = ids.map((id) => byId.get(id));
      state.order.splice(state.pos + 1, 0, ...idx);
      for (const i of idx) state.start.set(i, 0);
      const out = [], srcs = [];
      for (const id of ids) {
        const p = waitRendered(id); const t0 = performance.now();
        nav.go(state.pos + 1);
        const t1 = await p; if (t1 != null) out.push(t1 - t0);
        srcs.push(...srcOf());
        await sleep(every);
      }
      return { ms: out, src: srcs };
    },
    /** Text-layer word boxes on screen for page k of an item (after it settles). */
    async words(id, k) {
      await goTo(id, k); await sleep(2500);
      const el = [...document.querySelectorAll('#spread .pg')].find((e) => Number(e.dataset.k) === k);
      if (!el) return null;
      const R = el.getBoundingClientRect();
      return { src: el._pnl?.src, w: R.width, h: R.height, box: el._pnl?.box, runs: [...el.querySelectorAll('.tl .run')].slice(0, 60).map((x) => { const b = x.getBoundingClientRect(); return [b.left - R.left, b.top - R.top, b.width, b.height]; }) };
    },
    renderServer: () => ({ ...render.serverRender }),
  };
};

async function open(name) {
  const ctx = await browser.newContext({ viewport: VIEW, deviceScaleFactor: DPR });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.log(name, 'pageerror', e.message));
  await page.goto(`${SRV[name]}/?id=${encodeURIComponent(IDS[0])}`);
  await page.evaluate(() => localStorage.setItem('stacks2:compile', 'false')); // idle compiling stays out of the numbers
  await page.reload();
  await page.waitForSelector('#spread .pg canvas', { timeout: 60000 });
  await page.evaluate(HELPERS);
  await sleep(3000);
  return page;
}
async function quiet(name) { // the render server's queues empty, so one side's background work does not slow the other's trial
  if (name !== 'on') return;
  for (let i = 0; i < 40; i++) {
    const r = (await (await fetch(SRV.on + '/status')).json()).render;
    if (!r || (r.running.fg + r.running.near + r.running.ahead + r.queued.fg + r.queued.near + r.queued.ahead === 0)) return;
    await sleep(200);
  }
}
const forget = (id) => fetch(SRV.on + '/render/forget', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ u: `https://arxiv.org/pdf/${id.replace(/^arxiv:/, '')}` }) });

const acc = {}; const put = (k, side, v) => { ((acc[k] ||= { on: [], off: [], srcOn: {}, srcOff: {} })[side]).push(...[].concat(v.ms ?? v).filter((x) => x != null)); for (const s of v.src || []) { const m = acc[k][side === 'on' ? 'srcOn' : 'srcOff']; m[s] = (m[s] || 0) + 1; } };
const pages = { on: await open('on'), off: await open('off') };
// First visit in the tab: the page count is not known, so the feed opens the PDF with pdf.js on both
// sides; with the server on, the pages then come from it (rendered on demand: forgotten first).
for (const id of IDS.slice(1)) for (const side of ['on', 'off']) {
  await quiet('on');
  if (side === 'on') await forget(id);
  put('first visit in the tab', side, await pages[side].evaluate((id) => window.__rb.cold(id), id));
}
for (let t = 0; t < TRIALS; t++) {
  for (const id of IDS) {
    for (const side of t % 2 ? ['off', 'on'] : ['on', 'off']) {
      await quiet('on');
      put('T1 first spread, pre-rendered', side, await pages[side].evaluate((id) => window.__rb.cold(id), id));
      await quiet('on');
      if (side === 'on') await forget(id);
      put('T2 first spread, rendered on demand', side, await pages[side].evaluate((id) => window.__rb.cold(id), id));
    }
  }
  for (const side of t % 2 ? ['off', 'on'] : ['on', 'off']) {
    const id = IDS[t % IDS.length];
    await quiet('on');
    put('T3 turns every 400 ms', side, await pages[side].evaluate((id) => window.__rb.turns(id, 6, false), id));
    await quiet('on');
    put('turns, tab caches dropped', side, await pages[side].evaluate((id) => window.__rb.turns(id, 6, true), id));
    await quiet('on');
    const order = [...IDS.slice(t % IDS.length), ...IDS.slice(0, t % IDS.length)];
    put('T4 hops to the next PDF, 1 s apart', side, await pages[side].evaluate((ids) => window.__rb.hops(ids, 1000), order));
  }
  console.log(`round ${t + 1}/${TRIALS} done`);
}
console.log('\nms from the action to spread:rendered (p50 / p90, n); panels by source');
console.log(['test', 'server on', 'pdf.js (engine none)', 'panels on', 'panels off'].join('\t'));
for (const [k, v] of Object.entries(acc)) console.log([k, `${pct(v.on, 0.5)} / ${pct(v.on, 0.9)} (${v.on.length})`, `${pct(v.off, 0.5)} / ${pct(v.off, 0.9)} (${v.off.length})`, JSON.stringify(v.srcOn), JSON.stringify(v.srcOff)].join('\t'));

// T7 (light): text-layer words over a server page and over a pdf.js page of the same page.
const geo = [];
for (const [id, k] of [[IDS[0], 2], [IDS[1], 5]]) {
  const a = await pages.on.evaluate(([id, k]) => window.__rb.words(id, k), [id, k]);
  const b = await pages.off.evaluate(([id, k]) => window.__rb.words(id, k), [id, k]);
  if (!a?.runs.length || !b?.runs.length) { geo.push(`${id} p. ${k + 1}: no text layer (${a?.src}/${b?.src})`); continue; }
  // Each word in fractions of the whole page (through the panel's crop box), compared at the pdf.js side's
  // scale: the crops may differ by a hair (ink found on two renders), the words' place on the page must not.
  const frac = (x, [l, t, w, h]) => { const bw = x.box.x1 - x.box.x0, bh = x.box.y1 - x.box.y0; return [x.box.x0 + (l / x.w) * bw, x.box.y0 + (t / x.h) * bh, (w / x.w) * bw, (h / x.h) * bh]; };
  const scale = [b.w / (b.box.x1 - b.box.x0), b.h / (b.box.y1 - b.box.y0)];
  const n = Math.min(a.runs.length, b.runs.length); let d = 0;
  for (let j = 0; j < n; j++) { const fa = frac(a, a.runs[j]), fb = frac(b, b.runs[j]); for (let c = 0; c < 4; c++) d = Math.max(d, Math.abs(fa[c] - fb[c]) * scale[c % 2]); }
  const crop = ['x0', 'y0', 'x1', 'y1'].map((c) => Math.abs(a.box[c] - b.box[c])).reduce((m, v) => Math.max(m, v), 0);
  geo.push(`${id} p. ${k + 1}: ${a.src} vs ${b.src}, ${n} words, largest difference on the page ${d.toFixed(2)} CSS px; crop boxes differ by ${crop.toFixed(4)} of the page`);
}
console.log('\n' + geo.join('\n'));
console.log('\nclient', JSON.stringify(await pages.on.evaluate(() => window.__rb.renderServer())));
console.log('server', JSON.stringify((await (await fetch(SRV.on + '/status')).json()).render, (k, v) => (k === 'report' || k === 'hint' ? undefined : v)));
await browser.close();
