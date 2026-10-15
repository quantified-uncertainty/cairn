#!/usr/bin/env node
// UI check for the Local lane (your own folders: features/local.js, server/routes/17-local.mjs)
// in headless Chromium. A script, not a node --test file:
//
//   node test/local-ui.mjs                                    # its own server on a synthetic folder
//   node test/local-ui.mjs --url http://localhost:4841 --folder DIR   # a running server and the folder it reads
//                         [--shots DIR] [--rounds 3] [--tmp DIR]
//
// Checks: the Local chip's count; the Library tree mirrors the folders; search finds a local
// file; a PDF, an EPUB and a Markdown file open and turn pages; a folder of pictures shows
// them; an iCloud placeholder is dimmed and says how to fetch it; Settings has Local folders;
// a file added while the page is open appears within seconds; no console errors; item
// switches are not slower with features/local.js than without it (A/B: /features.json
// intercepted), on local items and on corpus PDFs (their bytes answered locally).
// Every file it reads or writes is synthetic (test/local-fixtures.mjs); the only network is
// pdf.js from cdn.jsdelivr.net, through the server's cache. Uses the global Playwright
// (/opt/node22/lib/node_modules) and Chromium from PLAYWRIGHT_CHROMIUM_EXECUTABLE.
import { createRequire } from 'module';
import { spawn } from 'child_process';
import { mkdtempSync, rmSync, mkdirSync, existsSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { makeFolder, makePdf } from './local-fixtures.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i < 0 ? d : process.argv[i + 1]; };
const TMP = arg('tmp', tmpdir());
const SHOTS = arg('shots', join(TMP, 'stacks-local-ui'));
const ROUNDS = Number(arg('rounds', 3));
mkdirSync(SHOTS, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const median = (xs) => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.floor(s.length / 2)] : NaN; };
const { chromium } = createRequire('/opt/node22/lib/node_modules/')('playwright');
const EXE = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || ['/opt/pw-browsers/chromium-1194/chrome-linux/chrome'].find(existsSync);

let failed = 0;
function check(name, ok, detail = '') { if (!ok) failed++; console.log(`${ok ? '✓' : '✗'} ${name}${detail ? ' · ' + detail : ''}`); }

// ---------------------------------------------------------------- the server and the folder
let BASE = arg('url', ''), FOLDER = arg('folder', ''), proc = null, own = null;
if (!BASE) {
  own = mkdtempSync(join(TMP, 'stacks-local-ui-'));
  FOLDER = makeFolder(join(own, 'My Reading'));
  const port = 20000 + Math.floor(Math.random() * 20000);
  proc = spawn(process.execPath, [join(ROOT, 'server.mjs'), '--port', String(port)], {
    env: { ...process.env, STACKS_LOCAL_DIRS: FOLDER, STACKS_CACHE: join(own, 'cache'), STACKS_WARM_MB: '0', STACKS_JOBS_DIR: join(own, 'jobs'), STACKS_JOBS_EVERY: '0' }, stdio: 'ignore',
  });
  BASE = `http://localhost:${port}`;
  for (let i = 0; i < 100; i++) { try { if ((await fetch(BASE + '/status')).ok) break; } catch { /* starting */ } await sleep(100); }
}
if (!FOLDER) { console.error('--folder: the folder the server at --url reads (a synthetic one: test/local-fixtures.mjs makeFolder)'); process.exit(2); }
const added = join(FOLDER, 'Papers', 'Added While Open.pdf');
rmSync(added, { force: true });
const cleanup = () => { rmSync(added, { force: true }); proc?.kill(); if (own) rmSync(own, { recursive: true, force: true }); };

const J = await (await fetch(BASE + '/local/items.json?wait=1')).json();
const byT = (t) => J.items.find((x) => x.t === t);

// ---------------------------------------------------------------- the browser
const browser = await chromium.launch({ executablePath: EXE });
// Corpus documents never reach the network here: PDFs get a synthetic PDF, the rest a short page.
const FAKE_PDF = makePdf({ pages: 6, title: 'Stand-in', words: 'A stand-in page for a corpus PDF in the A/B timing.' });
async function newPage({ lane = 'local', withLocal = true, lib = false } = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.addInitScript(([l, on]) => { try { localStorage.setItem('stacks2:lane', JSON.stringify(l)); localStorage.setItem('stacks2:libOn', JSON.stringify(on)); localStorage.setItem('stacks2:compile', 'false'); } catch { /* none */ } }, [lane, lib]);
  const page = await ctx.newPage();
  const errs = [], bad = [];
  page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text().slice(0, 240)); });
  page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
  page.on('response', (r) => { if (r.status() >= 400) bad.push(`${r.status()} ${new URL(r.url()).pathname}`); });
  await page.route(/\/proxy\?u=(?!https%3A%2F%2Fcdn\.jsdelivr\.net)/, (r) => {
    const u = decodeURIComponent(r.request().url().split('u=')[1] || '');
    if (/arxiv\.org\/pdf|\.pdf($|\?)/i.test(u)) return r.fulfill({ status: 200, contentType: 'application/pdf', body: FAKE_PDF });
    return r.fulfill({ status: 200, contentType: 'text/html', body: '<html><body><article><h1>Stand-in</h1><p>A stand-in page.</p></article></body></html>' });
  });
  await page.route(/\/img\?u=/, (r) => r.fulfill({ status: 404, body: '' }));
  if (!withLocal) await page.route('**/features.json', async (r) => { const res = await r.fetch(); const f = await res.json(); f.js = f.js.filter((x) => !/\/local\.js$/.test(x)); f.css = f.css.filter((x) => !/\/local\.css$/.test(x)); r.fulfill({ response: res, json: f }); });
  await page.goto(BASE + '/');
  await page.waitForSelector('#lanes button', { timeout: 30000 });
  await page.evaluate(async () => {
    const u = await import('/js/util.js');
    window.__lc = { n: 0, last: null };
    u.on('spread:rendered', (d) => { window.__lc.n++; window.__lc.last = { id: d.it.id, s: d.s, t: performance.now() }; });
  });
  await page.waitForFunction(() => document.querySelector('#item-head h1'), null, { timeout: 30000 });
  await sleep(800);
  return { page, ctx, errs, bad };
}
const head = (page) => page.evaluate(() => ({ t: document.querySelector('#item-head h1')?.textContent.trim(), pos: document.querySelector('#pos')?.textContent || '' }));
async function rendered(page, n0, ms = 15000) { await page.waitForFunction((n) => window.__lc.n > n, n0, { timeout: ms }); }
async function open(page, title) {
  await page.mouse.click(1100, 500);
  const n0 = await page.evaluate(() => window.__lc.n);
  await page.keyboard.press('/');
  await page.fill('#s-input', title);
  // The result for this title in the Local lane (a corpus item may share a word of it).
  await page.waitForFunction((t) => [...document.querySelectorAll('#s-results li')].some((li) => li.querySelector('.st')?.textContent.trim() === t && /Local/.test(li.querySelector('.sm')?.textContent)), title, { timeout: 5000 });
  await page.evaluate((t) => [...document.querySelectorAll('#s-results li')].find((li) => li.querySelector('.st')?.textContent.trim() === t && /Local/.test(li.querySelector('.sm')?.textContent)).click(), title);
  await rendered(page, n0);
  await sleep(500);
}
async function turn(page) {
  const before = (await head(page)).pos, n0 = await page.evaluate(() => window.__lc.n);
  await page.mouse.click(1100, 500);
  await page.keyboard.press('l');
  await rendered(page, n0).catch(() => {});
  await sleep(300);
  const after = (await head(page)).pos;
  return { before, after, moved: before !== after };
}

try {
  // ---------------------------------------------------------------- A: with features/local.js
  const A = await newPage({ lib: true });
  const { page } = A;
  const chips = await page.$$eval('#lanes button', (bs) => bs.map((b) => [b.firstChild?.textContent, b.querySelector('.n')?.textContent]));
  const chip = chips.find(([l]) => l === 'Local');
  check('the Local chip shows the right count', chip && Number(chip[1]) === J.items.length, chip ? `${chip[1]} of ${J.items.length}` : 'no Local chip');

  // The Library tree: open every local folder, then compare it with the items' paths.
  for (let k = 0; k < 30; k++) {
    const clicked = await page.evaluate(() => {
      const el = [...document.querySelectorAll('#lib .lr-f[aria-expanded="false"], #lib .lr-l[aria-expanded="false"]')].find((x) => x.title === 'Local' || x.title.startsWith('Local ›') || x.querySelector('.lr-t')?.textContent === 'Local');
      el?.click(); return !!el;
    });
    if (!clicked) break;
    await sleep(150);
  }
  const tree = await page.evaluate(() => {
    const rows = window.__lib.rows();
    return { folders: rows.filter((r) => r.f && (r.f === 'local' || r.f.startsWith('local\u0001'))).map((r) => r.f.split('\u0001').slice(1).join('/')).filter(Boolean), items: rows.filter((r) => r.i != null).map((r) => r.i) };
  });
  const want = [...new Set(J.items.flatMap((it) => it.path.map((_, k) => it.path.slice(0, k + 1).join('/'))))].sort();
  check('the Library tree mirrors the folders', JSON.stringify([...tree.folders].sort()) === JSON.stringify(want), `${tree.folders.length} folders: ${tree.folders.join(' | ')}`);
  const order = await page.evaluate((ids) => { const m = new Map(ids.map((id, k) => [id, k])); return window.__lib.rows().filter((r) => r.i != null).map((r) => r.i); }, []);
  const localOrder = await page.evaluate(async (rows) => { const { items } = await import('/js/corpus.js'); return rows.map((i) => items[i]).filter((it) => it.lane === 'local').map((it) => it.ord); }, order);
  check('items in the tree follow the folders’ order (ord)', localOrder.length === J.items.length && localOrder.every((o, k) => k === 0 || o > localOrder[k - 1]), localOrder.join(','));
  await sleep(900); // the /ready answer for the rows in view
  const cold = await page.evaluate(() => [...document.querySelectorAll('#lib .lr-i')].filter((el) => el.classList.contains('lr-cold')).map((el) => el.querySelector('.lr-t')?.textContent));
  check('an iCloud placeholder is dimmed in the Library (/ready: not on disk)', cold.includes('Later') && cold.length === 1, cold.join(', '));
  await page.screenshot({ path: join(SHOTS, 'library.png') });
  await page.keyboard.press('Escape');

  // A PDF, an EPUB and a Markdown file open, and their pages turn.
  for (const [t, kind, text] of [['Alpha paper', 'PDF', null], ['The Synthetic Book', 'EPUB', 'Opening of chapter 1'], ['Notes on Synthetic Things', 'Markdown', 'Longer notes']]) {
    await open(page, t);
    const h = await head(page);
    const shown = text ? await page.evaluate((x) => document.querySelector('#spread')?.textContent.includes(x), text) : await page.evaluate(() => [...document.querySelectorAll('#spread canvas')].some((c) => c.width > 50 && c.height > 50));
    check(`${kind} opens: “${t}”`, h.t === t && shown, h.pos);
    const tr = await turn(page);
    check(`${kind} turns pages`, tr.moved, `${tr.before} → ${tr.after}`);
    await page.screenshot({ path: join(SHOTS, `open-${kind.toLowerCase()}.png`) });
  }
  const imgs = await page.evaluate(() => [...document.querySelectorAll('#spread img')].map((i) => [i.complete && i.naturalWidth > 0, i.getAttribute('src')]));
  check('the Markdown file’s picture loads (/local/rel)', imgs.length >= 1 && imgs.every(([ok]) => ok), JSON.stringify(imgs.map(([ok, s]) => `${ok}:${s}`)));
  await open(page, 'Maps');
  const gal = await page.evaluate(() => [...document.querySelectorAll('#spread .lc-gallery img')].map((i) => i.complete && i.naturalWidth > 0));
  check('a folder of pictures shows them', gal.length === 2 && gal.every(Boolean), JSON.stringify(gal));
  await open(page, 'Later');
  const why = await page.evaluate(() => ({ why: document.querySelector('#sec-why .why')?.textContent || '', btns: [...document.querySelectorAll('#sec-why .lc-btn')].map((b) => b.textContent), page: document.querySelector('#spread')?.textContent || '' }));
  check('an iCloud placeholder says how to fetch it (why line and page)', /brctl download '/.test(why.why) && why.btns.includes('Copy the command') && /not downloaded/.test(why.page), why.btns.join(', '));
  await page.screenshot({ path: join(SHOTS, 'placeholder.png') });
  await open(page, 'Root Level Paper');
  const wl = await page.evaluate(() => [...document.querySelectorAll('#sec-why .lc-why > *')].map((x) => x.textContent));
  check('the why line: kind and size, Show in folder, the file, AI on request', wl.some((x) => /^PDF, /.test(x)) && wl.some((x) => /^Show in (Finder|folder)$/.test(x)) && wl.includes('The file ↗') && wl.includes('AI only on request'), wl.join(' · '));

  // Settings › Local folders.
  await page.keyboard.press(',');
  await page.waitForSelector('#st-local', { timeout: 5000 }).catch(() => {});
  const st = await page.evaluate(() => ({ box: document.querySelector('#st-local .lc-dirs')?.value || '', roots: document.querySelector('#st-local .lc-roots')?.textContent || '' }));
  check('Settings › Local folders lists the folder and what it holds', st.box.includes(FOLDER.split('/').pop()) && /\d+ items/.test(st.roots), st.roots.slice(0, 120));
  await page.screenshot({ path: join(SHOTS, 'settings.png') });
  await page.keyboard.press('Escape');

  // A file added while the page is open.
  const n0 = J.items.length;
  const t0 = Date.now();
  writeFileSync(added, makePdf({ pages: 2, title: 'Added While The Page Was Open' }));
  let seen = 0;
  while (Date.now() - t0 < 15000) {
    const n = await page.evaluate(() => Number([...document.querySelectorAll('#lanes button')].find((b) => b.firstChild?.textContent === 'Local')?.querySelector('.n')?.textContent));
    if (n === n0 + 1) { seen = Date.now() - t0; break; }
    await sleep(100);
  }
  const listed = await page.evaluate(async () => { const { items } = await import('/js/corpus.js'); return items.some((it) => it.t === 'Added While The Page Was Open'); });
  check('a file added while running appears within seconds', seen > 0 && seen < 8000 && listed, seen ? `${(seen / 1000).toFixed(1)} s` : 'not seen');
  rmSync(added, { force: true });
  await sleep(4000);
  const gone = await page.evaluate(async () => { const { items } = await import('/js/corpus.js'); const it = items.find((x) => x.t === 'Added While The Page Was Open'); return it?.gone === true; });
  check('…and one removed says so (until a reload)', gone);

  // Known and not this feature's: optional data files this checkout lacks, and /profile's 404 for an
  // item not compiled yet (every item, corpus or local; test/dashboard-ui.mjs ignores it too).
  const known = /^\/((meta|enrich|tags)\.json|profile)$/;
  const realBad = A.bad.filter((b) => !known.test(b.split(' ')[1]));
  const otherErrs = A.errs.filter((e) => !/^Failed to load resource: the server responded with a status of 404/.test(e));
  check('no console errors', !otherErrs.length && !realBad.length, [...otherErrs, ...realBad].slice(0, 6).join(' | ') || `(not counted: ${A.bad.filter((b) => known.test(b.split(' ')[1])).length} known 404s: ${[...new Set(A.bad.map((b) => b.split(' ')[1]))].join(', ')})`);
  await A.ctx.close();

  // ---------------------------------------------------------------- A/B: item switches
  async function walk(lane, withLocal) {
    const P = await newPage({ lane, withLocal });
    const times = [];
    await P.page.mouse.click(1100, 500);
    for (let r = 0; r < ROUNDS; r++) {
      for (const key of ['j', 'j', 'j', 'j', 'j', 'j', 'k', 'k', 'k', 'k', 'k', 'k']) {
        const n0 = await P.page.evaluate(() => window.__lc.n);
        const t0 = await P.page.evaluate(() => performance.now());
        await P.page.keyboard.press(key);
        try { await rendered(P.page, n0, 10000); } catch { continue; }
        times.push(await P.page.evaluate((t) => window.__lc.last.t - t, t0));
        await sleep(150);
      }
    }
    await P.ctx.close();
    return times;
  }
  for (const lane of ['local', 'llm']) {
    const a = [], b = [];
    for (let r = 0; r < 2; r++) { b.push(...await walk(lane, false)); a.push(...await walk(lane, true)); } // interleaved, so neither gets the warm caches
    const ma = median(a), mb = median(b);
    check(`item switches not slower with local.js (${lane === 'local' ? 'local items' : 'corpus PDFs'})`, a.length >= 10 && b.length >= 10 && ma <= mb * 1.25 + 8, `median ${ma.toFixed(0)} ms with, ${mb.toFixed(0)} ms without (n ${a.length}/${b.length})`);
  }
} catch (e) {
  check('ran to the end', false, e.stack || e.message);
} finally {
  await browser.close();
  cleanup();
}
console.log(failed ? `${failed} failed · screenshots in ${SHOTS}` : `all passed · screenshots in ${SHOTS}`);
process.exit(failed ? 1 : 0);
