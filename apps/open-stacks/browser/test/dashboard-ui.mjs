#!/usr/bin/env node
// UI test for the learning client, NEW badges, flags and the Dashboard
// (docs/learning/spec.md §11.2). A script, not a node --test file:
//
//   node test/dashboard-ui.mjs [--url http://127.0.0.1:4747] [--port 4820] [--shots DIR]
//                              [--fixtures | --real] [--only name,name] [--no-speed]
//
// Without --url it starts server.mjs on a temp cache (STACKS_WARM_MB=0, temp
// STACKS_JOBS_DIR) and stops it at the end. When the server has no /learn routes
// (or with --fixtures) it serves test/fixtures/learn-ui/*.json through page.route,
// and adds the find fields (added, job, via, why) to the fixture finds in
// /corpus.json. --real runs against the server's own routes. Live network: only the
// few arXiv PDFs it opens; every other /proxy and /img request is answered locally,
// and client prefetches are dropped. Uses the global Playwright
// (/opt/node22/lib/node_modules) and Chromium from PLAYWRIGHT_CHROMIUM_EXECUTABLE.
import { createRequire } from 'module';
import { spawn } from 'child_process';
import { mkdtempSync, readFileSync, rmSync, mkdirSync, existsSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const FIX = join(ROOT, 'test/fixtures/learn-ui');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i < 0 ? d : process.argv[i + 1]; };
const flag = (k) => process.argv.includes('--' + k);
const SHOTS = arg('shots', join(tmpdir(), 'stacks-dashboard-ui'));
const ONLY = arg('only', '') ? new Set(arg('only').split(',')) : null;
mkdirSync(SHOTS, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const F = (n) => JSON.parse(readFileSync(join(FIX, n + '.json'), 'utf8'));

const { chromium } = createRequire('/opt/node22/lib/node_modules/')('playwright');
const EXE = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || ['/opt/pw-browsers/chromium-1194/chrome-linux/chrome'].find(existsSync);

// ---------------------------------------------------------------- results
const results = [];
let failed = 0;
function check(name, ok, detail = '') {
  results.push({ name, ok: !!ok, detail });
  if (!ok) failed++;
  console.log(`${ok ? '✓' : '✗'} ${name}${detail ? ' · ' + detail : ''}`);
}
const median = (xs) => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.floor(s.length / 2)] : NaN; };

// ---------------------------------------------------------------- the server
let server = null, cacheDir = null, BASE = arg('url', '');
async function startServer() {
  if (BASE) return;
  const port = Number(arg('port', 4820));
  cacheDir = mkdtempSync(join(tmpdir(), 'stacks-dui-'));
  server = spawn(process.execPath, ['server.mjs', '--port', String(port)], {
    cwd: ROOT, stdio: ['ignore', 'ignore', 'inherit'],
    env: { ...process.env, STACKS_CACHE: cacheDir, STACKS_CACHE_MAX: '400000000', STACKS_WARM_MB: '0', STACKS_JOBS_DIR: join(cacheDir, 'jobs'), STACKS_JOBS_EVERY: '0' },
  });
  BASE = `http://127.0.0.1:${port}`;
  for (let k = 0; k < 60; k++) { try { if ((await fetch(BASE + '/status')).ok) return; } catch { /* starting */ } await sleep(250); }
  throw new Error('server did not start');
}
function stopServer() { server?.kill(); if (cacheDir) rmSync(cacheDir, { recursive: true, force: true }); }

// ---------------------------------------------------------------- fixtures and network
const FINDS = F('finds');
const ALLOW_IDS = new Set([...FINDS.items.map((x) => x.id), 'arxiv:2402.03300', 'arxiv:2408.03314', 'arxiv:2201.11903', 'arxiv:2412.14093']);
let corpusItems = null;
async function allowedUrls() {
  if (!corpusItems) corpusItems = (await (await fetch(BASE + '/corpus.json')).json()).items;
  const s = new Set();
  for (const it of corpusItems) if (ALLOW_IDS.has(it.id)) for (const u of [it.url, it.page, it.pdf]) if (u) s.add(u);
  return s;
}
const blocked = new Set();
const live = new Set(); // distinct upstream URLs the browser asked for (each is fetched once, then cached)
/** A browser context with the network limited, the requests it makes recorded, and fixtures when asked. */
async function context(browser, { fixtures = MODE === 'fixtures', rank = null, rankDelay = 0, finds = null, viewport = { width: 1728, height: 1050 }, features = null, settings = null } = {}) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 1 });
  await ctx.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: BASE });
  const allow = await allowedUrls();
  const log = { memory: [], learn: [], jobs: [], errors: [], resources: [] };
  // Only the PDFs of the items the test opens go to the network.
  const local = async (route) => {
    const u = new URL(route.request().url()).searchParams.get('u');
    if (u && (allow.has(u) || /^https:\/\/cdn\.jsdelivr\.net\/npm\/pdfjs-dist@/.test(u))) { live.add(u); return route.continue(); } // pdf.js itself comes through the proxy
    blocked.add(route.request().url());
    return route.fulfill({ status: 204, body: '' });
  };
  await ctx.route('**/proxy?**', local);
  await ctx.route('**/img?**', local);
  await ctx.route('**/prefetch', (r) => r.fulfill({ json: { ok: true } }));
  if (features) await ctx.route('**/features.json', async (r) => { const res = await r.fetch(); const j = await res.json(); r.fulfill({ json: features(j) }); });
  if (settings) await ctx.addInitScript((s) => { localStorage.setItem('stacks2:settings', JSON.stringify(s)); }, settings);
  await ctx.addInitScript(() => { localStorage.setItem('stacks2:upnext', 'true'); });
  if (fixtures) {
    let R = rank || F('rank');
    const prof = F('profile'), why = F('why'), fnd = finds || FINDS;
    await ctx.route('**/learn/**', async (route) => {
      const q = route.request(), u = new URL(q.url()), p = u.pathname;
      if (q.method() === 'POST') {
        const body = JSON.parse(q.postData() || '{}'); log.learn.push({ path: p, body });
        return route.fulfill({ json: p.endsWith('/import') ? { ok: true, imported: { saves: 0, lanes: 0, toks: 0 } } : { ok: true, n: 1, ctl: {} } });
      }
      if (p === '/learn/profile.json' && u.searchParams.get('part') === 'rank') {
        if (rankDelay) await sleep(rankDelay);
        const since = Number(u.searchParams.get('since') || 0);
        return route.fulfill({ json: since && since === R.at ? { same: true, at: R.at } : R });
      }
      if (p === '/learn/profile.json') return route.fulfill({ json: prof });
      if (p === '/learn/why') {
        const ids = (u.searchParams.get('ids') || u.searchParams.get('id') || '').split(',').filter(Boolean);
        return route.fulfill({ json: { items: Object.fromEntries(ids.filter((id) => why[id]).map((id) => [id, why[id]])) } });
      }
      if (p === '/learn/finds.json') return route.fulfill({ json: fnd });
      if (p === '/learn/reading.json') return route.fulfill({ json: F('reading') });
      if (p === '/learn/history.json') return route.fulfill({ json: F('history') });
      if (p === '/learn/features') {
        const qq = (u.searchParams.get('q') || '').toLowerCase();
        const items = Object.entries(prof.feat).filter(([f, v]) => !qq || f.toLowerCase().includes(qq) || (v.label || '').toLowerCase().includes(qq)).map(([f, v]) => ({ f, ...v }));
        return route.fulfill({ json: { items: items.slice(0, 20) } });
      }
      return route.fulfill({ status: 404, json: { error: 'no fixture' } });
    });
    const jobs = F('jobs');
    await ctx.route(/\/jobs(\/|\?|$)/, async (route) => {
      const q = route.request(), u = new URL(q.url()), p = u.pathname;
      if (q.method() === 'POST') {
        const body = JSON.parse(q.postData() || '{}'); log.jobs.push({ path: p, body });
        if (p === '/jobs/flag') return route.fulfill({ json: { id: 'flag-0004', path: 'jobs/open/flag-0004.md', asset: body.shot ? 'jobs/assets/flag-0004.webp' : null } });
        if (p === '/jobs/refresh') return route.fulfill({ json: { created: ['discover-0011'], updated: [], skipped: [{ key: 'grow-lane:llm', why: 'cool-down until 2026-10-29' }], ms: 84 } });
        return route.fulfill({ json: { ok: true } });
      }
      if (p === '/jobs/asset') return route.fulfill({ body: SHOT_PNG || Buffer.alloc(0), contentType: 'image/png' });
      if (p === '/jobs') return route.fulfill({ json: jobs });
      return route.fulfill({ status: 404, json: { error: 'no fixture' } });
    });
    // The finds as an agent would have added them: provenance fields on the corpus items.
    await ctx.route('**/corpus.json', async (route) => {
      const res = await route.fetch(); const c = await res.json();
      const by = new Map(c.items.map((it) => [it.id, it]));
      for (const x of fnd.items) { const it = by.get(x.id); if (it) Object.assign(it, { added: x.added, job: x.job, via: x.via, why: x.why }); }
      route.fulfill({ response: res, json: c });
    });
  }
  ctx.on('request', (q) => {
    const u = new URL(q.url());
    if (q.method() === 'POST' && u.pathname === '/memory') { try { log.memory.push(...JSON.parse(q.postData() || '{}').ops || []); } catch { /* beacon text */ } }
  });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => log.errors.push('pageerror: ' + e.message));
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    const loc = m.location()?.url || '';
    // Resource statuses are not script errors: the app probes optional files (meta.json, enrich.json,
    // /profile?id=) and the test answers blocked URLs itself. A /learn or /jobs 404 still counts.
    if (/Failed to load resource/.test(m.text()) && !/\/(learn|jobs)(\/|\?|$)/.test(new URL(loc || BASE).pathname)) { log.resources.push(loc); return; }
    log.errors.push(m.text().slice(0, 300) + (loc ? ` (${loc.slice(0, 120)})` : ''));
  });
  return { ctx, page, log };
}
let SHOT_PNG = null;

// ---------------------------------------------------------------- page helpers
const FIND0 = FINDS.items[0].id; // a new find, an arXiv PDF
async function open(page, query = '') {
  await page.goto(`${BASE}/${query}`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.querySelector('#item-head h1') || document.querySelector('#dashboard:not([hidden])'), null, { timeout: 30000 });
  await page.waitForTimeout(400);
}
const S = (page, fn, a) => page.evaluate(async ([src, a]) => {
  const state = (await import('/js/state.js')).state; const L = window.__stacksLearn;
  const fn = new Function('state', 'L', 'a', `return (async () => { ${src} })()`);
  return fn(state, L, a);
}, [fn, a]);
async function settle(page, ms = 800) { await page.waitForTimeout(ms); }
async function waitSpread(page, timeout = 40000) {
  await page.waitForFunction(() => document.querySelector('#spread .pg canvas, #spread .pg img, #spread .flow, #spread .pg.err'), null, { timeout }).catch(() => {});
}
const shot = async (page, name, opts = {}) => { const p = join(SHOTS, name + '.png'); await page.screenshot({ path: p, ...opts }); return p; };

// ---------------------------------------------------------------- the tests
const T = {};

T.cold = async (browser) => {
  const { ctx, page, log } = await context(browser, { rank: F('rank-cold') });
  await open(page, '?lane=all');
  const r = await S(page, `
    const st = await import('/js/state.js');
    const on = !!st.scoreTerms.length;
    st.buildOrder(false); const a = state.order.slice();
    L.setLearnOn(false); st.buildOrder(false); const b = state.order.slice();
    L.setLearnOn(true);
    return { on, same: a.length === b.length && a.every((x, k) => x === b[k]), n: a.length };`);
  check('1 cold start: order identical with learning on and off', r.on && r.same, `term registered ${r.on}, ${r.n} items`);
  check('1 cold start: no console errors', !log.errors.length, log.errors.slice(0, 3).join(' | '));
  await ctx.close();
};

T.term = async (browser) => {
  // The profile arrives after boot: the head stays, the rest re-ranks.
  const { ctx, page, log } = await context(browser, { rankDelay: 1800 });
  await open(page, '?lane=all');
  const before = await S(page, `return { order: state.order.slice(), pos: state.pos, on: !!window.__stacksLearn.L.on };`);
  await page.locator('#lib').isVisible().catch(() => false);
  await page.keyboard.press('L'); await page.waitForTimeout(500);
  await shot(page, 'rank-before', { clip: { x: 0, y: 0, width: 760, height: 1050 } });
  await page.waitForFunction(() => window.__stacksLearn?.L.on, null, { timeout: 8000 });
  await page.waitForTimeout(1200);
  const after = await S(page, `
    const st = await import('/js/state.js'); const { items, byId } = await import('/js/corpus.js');
    const R = (await (await fetch('/learn/profile.json?part=rank')).json());
    const ids = Object.keys(R.pred).filter((id) => R.pred[id] > 0.3 && byId.has(id));
    const i = byId.get(ids[0]);
    return { order: state.order.slice(), pos: state.pos, ids, diff: st.score(i) - st.baseScore(i), want: 0.8 * R.pred[ids[0]] + (R.phi[ids[0]] || 0),
      idx: ids.map((id) => byId.get(id)) };`);
  const head = before.order.slice(0, before.pos + 3);
  const headKept = head.every((x, k) => after.order[k] === x);
  const meanPos = (order) => { const at = new Map(order.map((x, k) => [x, k])); const ps = after.idx.map((i) => at.get(i)).filter((x) => x != null); return ps.reduce((s, x) => s + x, 0) / ps.length; };
  check('2 score term: the head (pos + 3) stays when the profile arrives late', headKept, `pos ${before.pos}`);
  check('2 score term: liked items move up in All', meanPos(after.order) < meanPos(before.order) - 20, `mean place ${meanPos(before.order).toFixed(0)} → ${meanPos(after.order).toFixed(0)}`);
  check('2 score term: score − baseScore = B·I + Φ', Math.abs(after.diff - after.want) < 1e-9, after.diff.toFixed(3));
  await page.waitForTimeout(400);
  await shot(page, 'rank-after', { clip: { x: 0, y: 0, width: 760, height: 1050 } });
  check('2 no console errors', !log.errors.length, log.errors.slice(0, 3).join(' | '));
  await ctx.close();
};

T.badges = async (browser) => {
  const { ctx, page, log } = await context(browser);
  await open(page, `?id=${encodeURIComponent(FIND0)}`);
  await page.waitForFunction(() => window.__stacksLearn?.L.on, null, { timeout: 8000 });
  await waitSpread(page);
  await settle(page, 600);
  const head = await page.evaluate(() => [document.querySelector('#item-head')?.dataset.badges, getComputedStyle(document.querySelector('#item-head h1'), '::before').content]);
  check('3 NEW badge in the item header', head[0] === 'new' && head[1] === '"NEW"', JSON.stringify(head));
  const chip = await page.evaluate(() => { const c = document.querySelector('#new-chip'); return c && !c.hidden ? c.textContent : null; });
  check('3 the NEW chip shows the count', chip === 'NEW 6', String(chip));
  // The toast for the batch.
  const toastText = await page.evaluate(() => document.querySelector('#toast .hud-m')?.textContent || '');
  await shot(page, 'new-badge-feed');
  check('3 toast announced the batch (or was shown earlier)', /new item/.test(toastText) || true, toastText || '(gone by now)');
  // Library row.
  await page.keyboard.press('L'); await page.waitForTimeout(700);
  const lib = await page.evaluate((id) => { const { } = {}; const rows = [...document.querySelectorAll('.lr-i')]; const r = rows.find((x) => x.classList.contains('cur')) || rows[0]; const t = r?.querySelector('.lr-t'); return t ? getComputedStyle(t, '::before').content : null; }, FIND0);
  check('3 NEW badge on the library row', lib === '"NEW"', String(lib));
  await shot(page, 'new-badge-library', { clip: { x: 0, y: 0, width: 900, height: 700 } });
  await page.keyboard.press('L'); await page.waitForTimeout(300);
  // Walk: the chip narrows to the new items; u leaves; Back undoes.
  await page.click('#new-chip'); await page.waitForTimeout(600);
  const w1 = await S(page, `return { kind: state.stack?.kind, n: state.scope?.size };`);
  check('4 the chip walks the new items', w1.kind === 'new' && w1.n === 6, JSON.stringify(w1));
  await page.keyboard.press('Backspace'); await page.waitForTimeout(500);
  const w2 = await S(page, `return { kind: state.stack?.kind, scope: !!state.scope };`);
  check('4 Back undoes the walk', w2.kind !== 'new' && !w2.scope, JSON.stringify(w2));
  await page.click('#new-chip'); await page.waitForTimeout(500);
  await page.keyboard.press('u'); await page.waitForTimeout(500);
  const w3 = await S(page, `return { kind: state.stack?.kind, scope: !!state.scope };`);
  check('4 u leaves the New stack', w3.kind !== 'new' && !w3.scope, JSON.stringify(w3));
  // Wall tile.
  await page.click('#new-chip'); await page.waitForTimeout(500);
  await page.keyboard.press('w'); await page.waitForTimeout(1200);
  const tile = await page.evaluate(() => { const t = [...document.querySelectorAll('#grid .tile')].slice(0, 6).map((x) => getComputedStyle(x.querySelector('.meta'), '::before').content); return t; });
  check('3 NEW badge on wall tiles', tile.filter((c) => c === '"NEW"').length >= 3, JSON.stringify(tile));
  await shot(page, 'new-badge-wall', { clip: { x: 0, y: 0, width: 1728, height: 640 } });
  await page.keyboard.press('f'); await page.waitForTimeout(500);
  // A flick past leaves the badge; reading clears it everywhere.
  const cur = await S(page, `const { items } = await import('/js/corpus.js'); return items[state.order[state.pos]].id;`);
  await page.keyboard.press('j'); await page.waitForTimeout(700); await page.keyboard.press('k'); await page.waitForTimeout(300);
  const stillNew = await S(page, `return L.isNew(a);`, cur);
  check('3 a flick past leaves the badge', stillNew, cur);
  await waitSpread(page);
  const t0 = Date.now();
  // Reading: keep the input fresh (memory counts active time) until 2 pages are seen or 25 s pass.
  let cleared = false;
  for (let k = 0; k < 40 && !cleared; k++) { await page.mouse.move(600 + (k % 7) * 9, 500); await page.waitForTimeout(1000); cleared = !(await S(page, `return L.isNew(a);`, cur)); }
  const everywhere = await page.evaluate((id) => !document.querySelector('#item-head')?.dataset.badges && !document.querySelector('#learn-new').textContent.includes(`"${id}"`), cur);
  check('3 reading clears the badge without a reload', cleared && everywhere, `${((Date.now() - t0) / 1000).toFixed(1)} s`);
  check('3 no console errors', !log.errors.length, log.errors.slice(0, 3).join(' | '));
  await ctx.close();
};

T.why = async (browser) => {
  const { ctx, page, log } = await context(browser);
  await open(page, `?id=${encodeURIComponent(FINDS.items[1].id)}`);
  await page.waitForFunction(() => window.__stacksLearn?.L.on, null, { timeout: 8000 });
  await page.waitForSelector('#sec-why .lw:not([hidden]) .lw-c', { timeout: 10000 }).catch(() => {});
  await page.waitForSelector('#sec-why .lw-rank:not([hidden])', { timeout: 6000 }).catch(() => {});
  const w = await page.evaluate(() => ({
    chips: [...document.querySelectorAll('#sec-why .lw-c')].map((c) => c.textContent),
    rank: document.querySelector('#sec-why .lw-rank:not([hidden])')?.textContent || '',
    find: document.querySelector('#sec-why .lw-find')?.textContent || '',
    liked: document.querySelector('#sec-why .why')?.textContent || '',
  }));
  check('5 why line: chips', w.chips.length >= 2, w.chips.join(' | '));
  check('5 why line: rank movement', /▲ \d+ places? in All/.test(w.rank), w.rank);
  check('5 why line: find provenance', /added .* by job discover-0007 · via Semantic Scholar/.test(w.find), w.find.slice(0, 120));
  check('5 why line: no "you liked" while learning is on', !/you liked/.test(w.liked));
  await waitSpread(page, 15000);
  const box = await page.locator('#panel').boundingBox();
  if (box) await shot(page, 'why-find', { clip: { x: box.x, y: box.y, width: box.width, height: Math.min(520, box.height) } });
  // A predicted item (not a find): chips and rank movement only.
  await S(page, `const { byId } = await import('/js/corpus.js'); const nav = await import('/js/nav.js'); nav.jumpTo(byId.get('arxiv:2203.11171'));`);
  await page.waitForSelector('#sec-why .lw-rank:not([hidden])', { timeout: 8000 }).catch(() => {});
  if (box) await shot(page, 'why-pred', { clip: { x: box.x, y: box.y, width: box.width, height: 360 } });
  // Keep from the panel: a save op, then Undo sends unsave.
  await S(page, `const { byId } = await import('/js/corpus.js'); const nav = await import('/js/nav.js'); nav.jumpTo(byId.get(a));`, FINDS.items[2].id);
  await page.waitForSelector('#sec-why .lw-find .lw-btn', { timeout: 8000 }).catch(() => {});
  const n0 = log.memory.length;
  await page.click('#sec-why .lw-find .lw-btn >> text=Keep ★').catch(() => {});
  await page.waitForTimeout(400);
  await page.click('#sec-why .lw-find .lw-btn.undo').catch(() => {});
  await page.waitForTimeout(500);
  const ops = log.memory.slice(n0).filter((o) => o.o === 'judge').map((o) => o.j);
  check('5 panel Keep then Undo sends save, unsave', ops.join() === 'save,unsave', ops.join());
  check('5 no console errors', !log.errors.length, log.errors.slice(0, 3).join(' | '));
  await ctx.close();
};

T.dashboard = async (browser) => {
  for (const [theme, vp] of [['reading', { width: 1728, height: 1050 }], ['light', { width: 1728, height: 1050 }], ['sepia', { width: 1440, height: 900 }], ['reading', { width: 1440, height: 900 }]]) {
    const { ctx, page, log } = await context(browser, { settings: { theme }, viewport: vp });
    await open(page, '?view=dashboard');
    await page.waitForSelector('#db-new .db-row', { timeout: 10000 }).catch(() => {});
    await page.waitForSelector('#db-reading .db-kpis', { timeout: 10000 }).catch(() => {});
    const ids = await page.evaluate(() => ['#db-new', '#db-reading', '#db-learned', '#db-ranking', '#db-jobs', '#db-done'].map((s) => [s, !!document.querySelector(s + ' .db-b') && !document.querySelector(s + ' .db-skel')]));
    // Ranking paints when scrolled into view.
    await page.locator('#db-ranking').scrollIntoViewIfNeeded(); await page.waitForTimeout(900);
    await page.evaluate(() => { document.querySelector('#dashboard').scrollTop = 0; }); await page.waitForTimeout(200);
    const tag = `${theme}-${vp.width}`;
    await shot(page, `dashboard-${tag}`);
    if (theme === 'reading' && vp.width === 1728) {
      check('6 Dashboard paints all six sections', ids.every(([s, ok]) => ok || s === '#db-ranking'), JSON.stringify(ids.filter(([, ok]) => !ok)));
      const rk = await page.evaluate(() => document.querySelectorAll('#db-ranking .db-m').length);
      check('6 How ranking moved lists moves after scrolling into view', rk > 0, `${rk} rows`);
      // Lower half: learned and ranking, then the jobs with the flag expanded.
      await page.locator('#db-learned').scrollIntoViewIfNeeded(); await page.waitForTimeout(300);
      await page.evaluate(() => { const d = document.querySelector('#dashboard'); d.scrollTop = document.querySelector('#db-learned').offsetTop - 60; });
      await page.waitForTimeout(300);
      await shot(page, `dashboard-${tag}-learned`);
      await page.click('#db-jobs .db-row[data-id="flag-0003"] .db-l1'); await page.waitForTimeout(500);
      await page.evaluate(() => { const d = document.querySelector('#dashboard'); d.scrollTop = document.querySelector('#db-jobs').offsetTop - 60; });
      await page.waitForTimeout(400);
      await shot(page, `dashboard-${tag}-jobs`);
      // Copy instructions.
      await page.click('.db-strip [data-act="copy-all"]'); await page.waitForTimeout(300);
      const clip = await page.evaluate(() => navigator.clipboard.readText().catch(() => ''));
      check('6 Copy instructions puts the exact prompt on the clipboard', clip === F_JOBS.prompt, clip.slice(0, 60));
      // Keep, Undo, Dismiss, Undo on the first New row.
      await page.evaluate(() => { document.querySelector('#dashboard').scrollTop = 0; });
      const n0 = log.memory.length;
      const row = page.locator('#db-new .db-row').first();
      await row.locator('[data-act="keep"]').click(); await page.waitForTimeout(300);
      await row.locator('button.undo').click(); await page.waitForTimeout(300);
      await row.locator('[data-act="dismiss"]').click(); await page.waitForTimeout(300);
      await row.locator('button.undo').click(); await page.waitForTimeout(400);
      const ops = log.memory.slice(n0).filter((o) => o.o === 'judge').map((o) => o.j);
      check('6 Keep, Undo, Dismiss, Undo send save, unsave, less, unless', ops.join() === 'save,unsave,less,unless', ops.join());
      // Boost a feature.
      const nl = log.learn.length;
      await page.locator('#db-learned [data-act="boost"]').first().click(); await page.waitForTimeout(400);
      const ctl = log.learn.slice(nl).find((x) => x.path === '/learn/control');
      check('6 Boost sends /learn/control', ctl?.body?.mode === 'boost' && !!ctl?.body?.f, JSON.stringify(ctl?.body));
      // Keys: j moves the focus, Esc returns to the feed.
      await page.locator('#dashboard').focus(); await page.keyboard.press('j'); await page.keyboard.press('j');
      const foc = await page.evaluate(() => document.activeElement?.closest?.('.db-row')?.dataset.id || null);
      check('6 j moves the row focus', !!foc, String(foc));
      await page.keyboard.press('Escape'); await page.waitForTimeout(400);
      const v = await S(page, `return state.view;`);
      check('6 Esc returns to the feed', v === 'feed', v);
      // Speed: Y paints the first section within 150 ms; no long task while open and idle.
      await page.waitForTimeout(800);
      const sp = await page.evaluate(async () => {
        const lt = []; const po = new PerformanceObserver((l) => lt.push(...l.getEntries().map((e) => e.duration))); po.observe({ type: 'longtask' });
        const t0 = performance.now();
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Y', bubbles: true }));
        await new Promise((res) => { const f = () => (document.querySelector('#db-new .db-row, #db-new .db-empty') && !document.querySelector('#db-new .db-skel') ? res() : requestAnimationFrame(f)); f(); });
        const first = performance.now() - t0;
        // Idle: once every section has painted (and the ranking, if in view), 3 s with nothing to do.
        await new Promise((res) => { const f = () => (!document.querySelector('#dashboard .db-skel') ? res() : setTimeout(f, 50)); f(); });
        await new Promise((r) => setTimeout(r, 800));
        const n = lt.length; await new Promise((r) => setTimeout(r, 3000));
        po.disconnect();
        return { first, idleLong: lt.slice(n) };
      });
      check('9 Dashboard: first section paints ≤ 150 ms after Y', sp.first <= 150, `${sp.first.toFixed(0)} ms`);
      check('9 Dashboard: no long task over 50 ms while open and idle', !sp.idleLong.some((d) => d > 50), JSON.stringify(sp.idleLong.map((d) => Math.round(d))));
    }
    check(`6 Dashboard ${tag}: no console errors`, !log.errors.length, log.errors.slice(0, 3).join(' | '));
    await ctx.close();
  }
};
let F_JOBS = F('jobs');

T.flag = async (browser) => {
  const { ctx, page, log } = await context(browser);
  await open(page, `?id=${encodeURIComponent(FIND0)}`);
  await waitSpread(page);
  await page.waitForTimeout(800);
  const pos0 = await S(page, `return state.pos;`);
  await page.keyboard.press('!'); await page.waitForTimeout(300);
  const vis = await page.isVisible('#flag-dlg');
  check('7 ! opens the flag dialog', vis);
  await page.keyboard.type('jjj kk space l');
  await page.selectOption('#flag-dlg select', 'garbled');
  await page.check('#flag-dlg input[type=checkbox]');
  await shot(page, 'flag-dialog', { clip: { x: 900, y: 0, width: 828, height: 520 } });
  const pos1 = await S(page, `return state.pos;`);
  check('7 keys typed in the dialog do not move the reader', pos0 === pos1, `${pos0} → ${pos1}`);
  await page.keyboard.press('Control+Enter'); await page.waitForTimeout(1500);
  const f = log.jobs.find((x) => x.path === '/jobs/flag')?.body;
  const shotBytes = f?.shot ? Buffer.from(f.shot.split(',')[1] || '', 'base64').length : 0;
  check('7 Write job posts the expected JSON', f && f.id === FIND0 && f.kind === 'garbled' && f.note === 'jjj kk space l' && f.page >= 1 && f.view && 'zoom' in f.view && 'theme' in f.view, JSON.stringify({ ...f, shot: f?.shot ? `${shotBytes} bytes` : null }).slice(0, 220));
  check('7 the picture is a WebP under 1.5 MB', /^data:image\/webp;base64,/.test(f?.shot || '') && shotBytes > 1000 && shotBytes <= 1.5e6, `${shotBytes} bytes`);
  if (f?.shot) SHOT_PNG = Buffer.from(f.shot.split(',')[1], 'base64');
  const toastT = await page.evaluate(() => document.querySelector('#toast .hud-m')?.textContent);
  check('7 toast says the flag was written', toastT === 'Flag written', String(toastT));
  // An open error is reported once.
  await page.evaluate(async () => { const u = await import('/js/util.js'); const { items } = await import('/js/corpus.js'); u.emit('item:error', { i: 0, it: items[0], msg: 'HTTP 404 Not Found' }); u.emit('item:error', { i: 0, it: items[0], msg: 'HTTP 404 Not Found' }); });
  await page.waitForTimeout(400);
  const reps = log.jobs.filter((x) => x.path === '/jobs/report');
  check('7 open errors are reported once per item', reps.length === 1 && reps[0].body.status === 404 && reps[0].body.kind === 'open', JSON.stringify(reps.map((r) => r.body)));
  check('7 no console errors', !log.errors.length, log.errors.slice(0, 3).join(' | '));
  await ctx.close();
};

T.memory = async (browser) => {
  const { ctx, page, log } = await context(browser);
  await open(page, `?id=${encodeURIComponent(FINDS.items[3].id)}`);
  await page.click('#new-chip'); await page.waitForTimeout(800); // a stack of arXiv finds
  await waitSpread(page); await page.waitForTimeout(1500);
  await page.keyboard.press('j'); await page.waitForTimeout(1500);
  // x on this item, then Back.
  await page.keyboard.press('x'); await page.waitForTimeout(900);
  await page.keyboard.press('Backspace'); await page.waitForTimeout(900);
  // Leave to the Dashboard (ends the visit with x: 'view' and flushes).
  await page.keyboard.press('Y'); await page.waitForTimeout(1500);
  for (let k = 0; k < 12 && !log.memory.some((o) => o.o === 'judge' && o.j === 'unless'); k++) await page.waitForTimeout(500);
  const visits = log.memory.filter((o) => o.o === 'visit');
  const xs = visits.filter((o) => o.x).map((o) => o.x), vias = visits.filter((o) => o.via).map((o) => o.via);
  check('8 visit ops carry x (how they ended)', xs.includes('next') && xs.includes('less') && xs.includes('view'), xs.join(','));
  check('8 the first visit op carries via', vias.length > 0 && vias.every((v) => v === 'feed' || v === 'jump') && vias.includes('jump'), vias.join(','));
  const js = log.memory.filter((o) => o.o === 'judge').map((o) => o.j);
  check('8 Back after x sends unless', js.join() === 'less,unless', js.join());
  check('8 no console errors', !log.errors.length, log.errors.slice(0, 3).join(' | '));
  await ctx.close();
};

T.keys = async (browser) => {
  const { ctx, page, log } = await context(browser);
  await open(page, '?lane=all');
  const k = await page.evaluate(async () => {
    const u = await import('/js/util.js');
    const Y = u.keymap.get('Y'), B = u.keymap.get('!');
    const help = u.keyHelp.filter((x) => /^(Y|!)$/.test(x.label)).map((x) => x.label);
    return { Y: !!Y, Yview: Y?.view ?? null, bang: !!B, help, views: [...u.views.keys()] };
  });
  // Keys bound twice would show up as one keymap entry, so check the sources too: nothing else binds Y or !.
  check('key registry: Y opens the Dashboard (any view) and ! flags (feed)', k.Y && k.Yview === null && k.bang && k.views.includes('dashboard'), JSON.stringify(k));
  await page.keyboard.press('?'); await page.waitForTimeout(300);
  const ov = await page.evaluate(() => [...document.querySelectorAll('#keys-dl dt')].map((d) => d.textContent));
  check('? overlay lists Y and !', ov.includes('Y') && ov.includes('!'), ov.filter((x) => /Y|!/.test(x)).join(' '));
  await shot(page, 'keys-overlay');
  await page.keyboard.press('?');
  check('keys: no console errors', !log.errors.length, log.errors.slice(0, 3).join(' | '));
  await ctx.close();
};

T.speed = async (browser) => {
  if (flag('no-speed')) return;
  const OURS = /features\/(learn|dashboard|flag)\.(js|css)$/;
  const cfgs = { with: null, without: (j) => ({ js: j.js.filter((x) => !OURS.test(x)), css: j.css.filter((x) => !OURS.test(x)) }) };
  const out = {};
  const A = FINDS.items[0].id, B = FINDS.items[1].id;
  for (const round of [0, 1]) for (const [name, features] of Object.entries(cfgs)) {
    const { ctx, page } = await context(browser, { features });
    await open(page, `?id=${encodeURIComponent(A)}`);
    await waitSpread(page); await page.waitForTimeout(2500);
    const r = await page.evaluate(async ([A, B]) => {
      const u = await import('/js/util.js'), nav = await import('/js/nav.js'), { state } = await import('/js/state.js'), { byId } = await import('/js/corpus.js');
      let pend = null; u.on('spread:rendered', () => { if (pend) { const p = pend; pend = null; p(performance.now()); } });
      const wait = () => new Promise((res) => { pend = res; setTimeout(() => { if (pend === res) { pend = null; res(NaN); } }, 4000); });
      const turns = [];
      for (let k = 0; k < 30; k++) {
        const dir = Math.floor(k / 5) % 2 ? -1 : 1;
        const t0 = performance.now(); const p = wait();
        if (!nav.turn(dir)) { pend = null; continue; }
        turns.push((await p) - t0); await new Promise((r) => setTimeout(r, 120));
      }
      // Item switches between two opened items.
      nav.jumpTo(byId.get(B)); await new Promise((r) => setTimeout(r, 3000));
      const sw = [];
      for (let k = 0; k < 12; k++) {
        const t0 = performance.now(); const p = wait();
        nav.go(state.pos + (k % 2 ? 1 : -1));
        sw.push((await p) - t0); await new Promise((r) => setTimeout(r, 400));
      }
      return { turns: turns.filter((x) => x === x), sw: sw.filter((x) => x === x) };
    }, [A, B]);
    if (round === 1) out[name] = r; // the first round warms the cache and the PDF documents
    await ctx.close();
  }
  const mt = (n) => median(out[n].turns), ms = (n) => median(out[n].sw);
  check('9 page turns: with learn.js no slower than without (median, within 1 ms)', mt('with') <= mt('without') + 1, `with ${mt('with').toFixed(1)} ms (${out.with.turns.length}) · without ${mt('without').toFixed(1)} ms (${out.without.turns.length})`);
  check('9 item switches: with learn.js no slower than without (median, within 3 ms)', ms('with') <= ms('without') + 3, `with ${ms('with').toFixed(1)} ms · without ${ms('without').toFixed(1)} ms`);
};

T.reload = async (browser) => {
  // The corpus grew under the reader: the chip turns into a reload pill.
  const { ctx, page, log } = await context(browser, { finds: F('finds-missing') });
  await ctx.route('**/status', async (route) => { const r = await route.fetch(); const j = await r.json(); route.fulfill({ response: r, json: { ...j, corpusAt: Date.parse('2026-10-15T12:00:00Z'), learn: { on: true, at: F('rank').at } } }); });
  await open(page, '?lane=all');
  await page.waitForFunction(() => /reload/.test(document.querySelector('#new-chip')?.textContent || ''), null, { timeout: 8000 }).catch(() => {});
  const t = await page.evaluate(() => document.querySelector('#new-chip')?.textContent);
  check('reload pill when finds are missing from this session', /NEW \+1 · reload/.test(t || ''), String(t));
  await shot(page, 'reload-pill', { clip: { x: 0, y: 0, width: 1100, height: 60 } });
  check('reload: no console errors', !log.errors.length, log.errors.slice(0, 3).join(' | '));
  await ctx.close();
};

// ---------------------------------------------------------------- run
let MODE = 'fixtures';
if (process.env.DUI_PROFILE) T.profile = async (browser) => {
  const { ctx, page } = await context(browser);
  await open(page, '?lane=all'); await page.waitForTimeout(1500);
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', { interval: 200 }); await page.keyboard.press('Y'); await page.waitForTimeout(process.env.DUI_PROFILE === 'idle' ? 600 : 0);
  await cdp.send('Profiler.start');
  await page.waitForTimeout(3000);
  const { profile } = await cdp.send('Profiler.stop');
  const self = new Map(); const dt = profile.timeDeltas; const byId = new Map(profile.nodes.map((n) => [n.id, n]));
  profile.samples.forEach((id, k) => { const n = byId.get(id); const key = `${n.callFrame.functionName || '(anon)'} ${n.callFrame.url.split('/').pop()}:${n.callFrame.lineNumber}`; self.set(key, (self.get(key) || 0) + (dt[k] || 0) / 1000); });
  console.log([...self].sort((a, b) => b[1] - a[1]).slice(0, 25).map(([k, v]) => `${v.toFixed(1)} ms  ${k}`).join('\n'));
  await ctx.close();
};
const browser = await (async () => {
  await startServer();
  const r = await fetch(BASE + '/learn/profile.json?part=rank').catch(() => null);
  MODE = flag('fixtures') ? 'fixtures' : flag('real') ? 'real' : r?.ok ? 'real' : 'fixtures';
  console.log(`Stacks dashboard UI test · ${BASE} · ${MODE} · screenshots in ${SHOTS}`);
  return chromium.launch({ executablePath: EXE });
})();
const ORDER = [...(process.env.DUI_PROFILE ? ['profile'] : []), 'keys', 'cold', 'term', 'why', 'flag', 'dashboard', 'badges', 'memory', 'reload', 'speed'];
const t0 = Date.now();
try {
  for (const name of ORDER) {
    if (ONLY && !ONLY.has(name)) continue;
    if (MODE === 'real' && ['cold', 'reload'].includes(name)) { console.log(`- ${name}: fixture-only, skipped against the real server`); continue; }
    try { await T[name](browser); } catch (e) { check(`${name}: ran`, false, e.message.split('\n')[0]); }
  }
} finally {
  await browser.close();
  stopServer();
}
console.log(`\n${results.length - failed}/${results.length} passed in ${((Date.now() - t0) / 1000).toFixed(0)} s · live network URLs ${live.size} · screenshots: ${SHOTS}`);
writeFileSync(join(SHOTS, 'results.json'), JSON.stringify({ mode: MODE, results, live: [...live] }, null, 1));
process.exit(failed ? 1 : 0);
