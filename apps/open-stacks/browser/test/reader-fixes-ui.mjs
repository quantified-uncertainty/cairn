#!/usr/bin/env node
// UI check for three small reader fixes, in headless Chromium. A script, not a node --test file:
//
//   node test/reader-fixes-ui.mjs                                   # its own server on a synthetic folder
//   node test/reader-fixes-ui.mjs --url http://localhost:4892 --folder DIR   # a running server and the folder it reads
//                                [--shots DIR] [--tmp DIR]
//
// 1. The load chip's tooltip (#loadpct, feed.js paintLoaded) says what is on disk in the item's own
//    terms: a Markdown file (a flow document) and a PDF are whole files, not pages fetched one by one.
// 2. Back after a reflow: turn a flow document, turn once more, change the text size (] or [) or the
//    column count (+ -), then Back: the text that was at the top of the view is in the first column
//    again (nav.js before() keeps flow.js colPos; features/back.js maps it with posCol).
// 3. Esc with no header card open: with the pointer on the header, or within 500 ms of a card closing
//    by itself, it stays in the Reader; otherwise it still goes to the Wall (features/headpop.js,
//    nav.js escHolds).
// Every file it reads or writes is synthetic; nothing reaches the network (corpus documents are
// answered with a stand-in page). Uses the global Playwright (/opt/node22/lib/node_modules) and
// Chromium from PLAYWRIGHT_CHROMIUM_EXECUTABLE.
import { createRequire } from 'module';
import { spawn } from 'child_process';
import { mkdtempSync, rmSync, mkdirSync, existsSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { makePdf } from './local-fixtures.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i < 0 ? d : process.argv[i + 1]; };
const TMP = arg('tmp', tmpdir());
const SHOTS = arg('shots', join(TMP, 'stacks-reader-fixes-ui'));
mkdirSync(SHOTS, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const { chromium } = createRequire('/opt/node22/lib/node_modules/')('playwright');
const EXE = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || ['/opt/pw-browsers/chromium-1194/chrome-linux/chrome'].find(existsSync);

let failed = 0;
function check(name, ok, detail = '') { if (!ok) failed++; console.log(`${ok ? '✓' : '✗'} ${name}${detail ? ' · ' + detail : ''}`); }

// ---------------------------------------------------------------- the files (synthetic)
const WORDS = 'alpha beta gamma delta epsilon zeta theta iota kappa lambda omicron sigma tau upsilon omega river stone lantern meadow harbor signal'.split(' ');
let seed = 7;
const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed; };
const para = (n) => { const w = Array.from({ length: n }, () => WORDS[rnd() % WORDS.length]); return w.join(' ') + '.'; };
function flowDoc() {
  let md = '# Reflow check\n\n';
  for (let s = 1; s <= 12; s++) { md += `## Part ${s}\n\n`; for (let p = 0; p < 6; p++) md += `Marker${s}x${p} ${para(40 + ((s * 7 + p * 13) % 90))}\n\n`; }
  return md;
}
const FLOW_T = 'Reflow check', PDF_T = 'Load chip check';
function writeFiles(folder) {
  const d = join(folder, 'reader-fixes');
  mkdirSync(d, { recursive: true });
  writeFileSync(join(d, 'reflow-check.md'), flowDoc());
  writeFileSync(join(d, 'load-chip-check.pdf'), makePdf({ pages: 5, title: PDF_T, words: 'A synthetic page for the load chip check.' }));
}

// ---------------------------------------------------------------- the server
let BASE = arg('url', ''), FOLDER = arg('folder', ''), proc = null, own = null;
if (!BASE) {
  own = mkdtempSync(join(TMP, 'stacks-reader-fixes-'));
  FOLDER = join(own, 'Folder');
  mkdirSync(FOLDER, { recursive: true });
  writeFiles(FOLDER);
  const port = 20000 + Math.floor(Math.random() * 20000);
  proc = spawn(process.execPath, [join(ROOT, 'server.mjs'), '--port', String(port)], {
    env: { ...process.env, STACKS_LOCAL_DIRS: FOLDER, STACKS_CACHE: join(own, 'cache'), STACKS_WARM_MB: '0', STACKS_JOBS_DIR: join(own, 'jobs'), STACKS_JOBS_EVERY: '0' }, stdio: 'ignore',
  });
  BASE = `http://localhost:${port}`;
  for (let i = 0; i < 100; i++) { try { if ((await fetch(BASE + '/status')).ok) break; } catch { /* starting */ } await sleep(100); }
} else {
  if (!FOLDER) { console.error('--folder: the (synthetic) folder the server at --url reads'); process.exit(2); }
  writeFiles(FOLDER);
}
const cleanup = () => { if (!own) rmSync(join(FOLDER, 'reader-fixes'), { recursive: true, force: true }); proc?.kill(); if (own) rmSync(own, { recursive: true, force: true }); };

let J = null;
for (let k = 0; k < 60; k++) { // a server already running finds the new files within seconds
  J = await (await fetch(BASE + '/local/items.json?wait=1')).json();
  if ([FLOW_T, PDF_T].every((t) => J.items.some((x) => x.t === t))) break;
  await sleep(500);
}
const byT = (t) => J.items.find((x) => x.t === t);

const browser = await chromium.launch({ executablePath: EXE });
async function newPage(id) {
  const ctx = await browser.newContext({ viewport: { width: 1512, height: 982 } });
  await ctx.addInitScript(() => { try { localStorage.setItem('stacks2:compile', 'false'); localStorage.setItem('stacks2:lane', JSON.stringify('local')); } catch { /* none */ } });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
  await page.route(/\/proxy\?u=(?!https%3A%2F%2Fcdn\.jsdelivr\.net)/, (r) => r.fulfill({ status: 200, contentType: 'text/html', body: '<html><body><article><h1>Stand-in</h1><p>A stand-in page.</p></article></body></html>' }));
  await page.route(/\/img\?u=/, (r) => r.fulfill({ status: 404, body: '' }));
  await page.route('**/prefetch', (r) => r.fulfill({ json: { queued: 0 } }));
  await page.goto(`${BASE}/?id=${encodeURIComponent(id)}&lane=local`);
  await page.waitForFunction((t) => document.querySelector('#item-head h1')?.textContent.trim() === t, byT2.get(id), { timeout: 30000 });
  await page.evaluate(async () => {
    const u = await import('/js/util.js');
    window.__m = { state: (await import('/js/state.js')).state, flow: await import('/js/flow.js'), n: 0 };
    u.on('spread:rendered', () => { window.__m.n++; });
  });
  await sleep(1200);
  return { page, ctx, errs };
}
const byT2 = new Map();
for (const t of [FLOW_T, PDF_T]) { const it = byT(t); if (it) byT2.set(it.id, t); }

try {
  const flowIt = byT(FLOW_T), pdfIt = byT(PDF_T);
  check('the synthetic files are in the Local lane', !!flowIt && !!pdfIt, `${J.items.length} local items`);

  // ---------------------------------------------------------------- 1. the load chip's words
  {
    const { page, ctx, errs } = await newPage(flowIt.id);
    const t = await page.evaluate(() => ({ title: document.getElementById('loadpct')?.title || '', text: document.getElementById('loadpct')?.textContent || '' }));
    check('a flow document: the load chip says the whole file is on disk', /whole file is on your disk/.test(t.title) && /laid out into pages here/.test(t.title), t.title);
    check('a flow document: no page counts, no Internet Archive', !/pages are on your disk|Internet Archive|ready ahead/.test(t.title + t.text), t.text);
    await ctx.close();
    const P = await newPage(pdfIt.id);
    await P.page.waitForFunction(() => /PDF/.test(document.getElementById('loadpct')?.title || ''), null, { timeout: 15000 }).catch(() => {});
    const tp = await P.page.evaluate(() => document.getElementById('loadpct')?.title || '');
    check('a PDF: the load chip says the whole PDF is on disk', /^The whole PDF is on your disk/.test(tp) && !/Internet Archive/.test(tp), tp);
    check('no page errors (1)', !errs.length && !P.errs.length, [...errs, ...P.errs].join(' | '));
    await P.ctx.close();
  }

  // ---------------------------------------------------------------- 2. Back after a reflow
  {
    const { page, ctx, errs } = await newPage(flowIt.id);
    await page.mouse.move(750, 600);
    // The text at the top left of the first column on screen, as (block, character offset): a
    // reflow builds the columns afresh, so the place is found again by its text, not its node.
    const top = () => page.evaluate(() => {
      const { live } = window.__m.flow;
      const pr = live.port.getBoundingClientRect(), fs = parseFloat(getComputedStyle(live.flow).fontSize);
      const x = pr.left + 2, y = pr.top + fs * 0.7;
      const cr = document.caretPositionFromPoint ? document.caretPositionFromPoint(x, y) : null;
      const node = cr ? cr.offsetNode : document.caretRangeFromPoint(x, y)?.startContainer, off = cr ? cr.offset : document.caretRangeFromPoint(x, y)?.startOffset;
      if (!node || node.nodeType !== 3) return null;
      const blocks = [...live.flow.querySelectorAll('[data-vp]')], b = node.parentElement.closest('[data-vp]');
      const tw = document.createTreeWalker(b, NodeFilter.SHOW_TEXT); let co = 0;
      for (let t = tw.nextNode(); t && t !== node; t = tw.nextNode()) co += t.length;
      co += off; while (co < b.textContent.length && /\s/.test(b.textContent[co])) co++; // the next character drawn
      window.__w = { bi: blocks.indexOf(b), co };
      return { text: b.textContent.slice(co, co + 24) };
    });
    const colOfWord = () => page.evaluate(() => {
      const { live } = window.__m.flow; const { bi, co } = window.__w;
      const b = live.flow.querySelectorAll('[data-vp]')[bi];
      const tw = document.createTreeWalker(b, NodeFilter.SHOW_TEXT); let left = co, t = tw.nextNode();
      while (t && left >= t.length) { left -= t.length; t = tw.nextNode(); }
      if (!t) return -1;
      const r = document.createRange(); r.setStart(t, left); r.setEnd(t, left + 1);
      const rc = r.getClientRects()[0], fr = live.flow.getBoundingClientRect();
      if (!rc) return -1;
      return Math.max(0, Math.floor((rc.left - fr.left + live.g.gap / 2) / live.g.pitch));
    });
    const at = () => page.evaluate(() => ({ s: window.__m.state.start.get(window.__m.state.order[window.__m.state.pos]), cols: window.__m.flow.live.g.cols, n: window.__m.flow.live.n, font: window.__m.state.font }));
    const press = async (k, wait = 700) => { await page.keyboard.press(k); await sleep(wait); };
    // l turns a spread; the place to return to is the one before the last turn.
    for (const [round, keys] of [['text size up (] ])', [']', ']']], ['text size down ([ [ [)', ['[', '[', '[']], ['one column more (+)', ['+']]]) {
      await press('t'); await press('l'); await press('l');
      const w = await top(), a0 = await at();
      await press('l');
      for (const k of keys) await press(k, 500);
      await sleep(600);
      const a1 = await at(), moved = (await colOfWord()) !== a0.s;
      await press('Backspace', 1000);
      const a2 = await at(), c = await colOfWord();
      check(`Back after ${round}: the same text is at the top of the view`, c === a2.s,
        `"${w?.text}" in column ${c}, view starts at ${a2.s} (was ${a0.s} of ${a0.n} at ${a0.font}px; now ${a1.n} columns at ${a1.font}px${moved ? '; the old column number now shows other text' : ''})`);
    }
    // Without a reflow Back is exact, as before.
    await press('t'); await press('l'); const b0 = await at(); await press('l'); await press('Backspace', 900); const b1 = await at();
    check('Back without a reflow returns to the very column', b1.s === b0.s, `${b0.s} → ${b1.s}`);
    await page.screenshot({ path: join(SHOTS, 'back-after-reflow.png') });
    check('no page errors (2)', !errs.length, errs.join(' | '));
    await ctx.close();
  }

  // ---------------------------------------------------------------- 3. Esc and the header cards
  {
    const { page, ctx, errs } = await newPage(flowIt.id);
    const view = () => page.evaluate(() => window.__m.state.view);
    const toFeed = async () => { if ((await view()) !== 'feed') { await page.evaluate(async () => (await import('/js/chrome.js')).setView('feed')); await sleep(800); } };
    const lane = await page.evaluate(() => { const r = document.querySelector('#item-head .meta .lane').getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; });
    // a. Pointer on the header, no card yet (pressed before the 350 ms rest): stays.
    await page.mouse.move(750, 600); await sleep(300);
    await page.mouse.move(lane[0] - 3, lane[1]); await page.mouse.move(lane[0], lane[1]);
    await page.keyboard.press('Escape'); await sleep(250);
    check('Esc with the pointer on the header and no card: stays in the Reader', (await view()) === 'feed', await view());
    // b. A card open: Esc closes it and stays.
    await sleep(600);
    const opened = await page.evaluate(() => !document.getElementById('hpop').hidden);
    await page.keyboard.press('Escape'); await sleep(250);
    check('Esc with a card open closes the card and stays', opened && (await view()) === 'feed' && (await page.evaluate(() => document.getElementById('hpop').hidden)), `opened ${opened}, view ${await view()}`);
    // c. The card closes by itself (the pointer leaves for the pages); an Esc right after: stays.
    await page.mouse.move(750, 600); await sleep(300);
    await page.mouse.move(lane[0] - 3, lane[1]); await page.mouse.move(lane[0], lane[1]); await sleep(700);
    const open2 = await page.evaluate(() => !document.getElementById('hpop').hidden);
    await page.mouse.move(lane[0], lane[1] + 120); await page.mouse.move(750, 600);
    await page.waitForFunction(() => document.getElementById('hpop').hidden, null, { timeout: 3000 }).catch(() => {});
    const t0 = Date.now(); await page.keyboard.press('Escape'); const dt = Date.now() - t0; await sleep(250);
    check('Esc just after a card closed by itself: stays in the Reader', open2 && (await view()) === 'feed', `card opened ${open2}, Esc ${dt} ms after it closed, view ${await view()}`);
    // d. Later, with the pointer on the pages: Esc goes to the Wall, as always.
    await sleep(700);
    await page.keyboard.press('Escape'); await sleep(500);
    check('Esc later with the pointer on the pages: the Wall', (await view()) === 'wall', await view());
    await toFeed();
    // e. Zoom: Esc still unzooms first, wherever the pointer is.
    await page.mouse.move(750, 600); await sleep(600);
    await page.keyboard.press('z'); await sleep(600);
    await page.mouse.move(lane[0] + 40, lane[1]);
    await page.keyboard.press('Escape'); await sleep(600);
    check('Esc while zoomed unzooms (pointer on the header)', (await page.evaluate(() => window.__m.state.zoom)) === false && (await view()) === 'feed');
    check('no page errors (3)', !errs.length, errs.join(' | '));
    await ctx.close();
  }
} catch (e) {
  failed++;
  console.log('✗ the script stopped:', e.message);
} finally {
  await browser.close();
  cleanup();
}
console.log(failed ? `${failed} failed` : 'all passed');
process.exit(failed ? 1 : 0);
