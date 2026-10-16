#!/usr/bin/env node
// UI check for bundles in the Local lane (docs/authoring.md) in headless Chromium.
// A script, not a node --test file:
//
//   node test/local-bundle-ui.mjs                              # its own server on a synthetic folder
//   node test/local-bundle-ui.mjs --url http://localhost:4891 --folder DIR   # a running server and the
//                                 folder it reads (made with test/local-fixtures.mjs makeBundles)
//                                 [--shots DIR] [--tmp DIR]
//
// Checks: a Markdown bundle opens as one Local item, paginates as a flow document and turns
// pages; its three pictures (assets/, images/deep/) load through /local/rel; with the
// pictures held back 1.2 s the page count and the first page's text do not move when they
// arrive (width and height from the server); an HTML bundle opens with its picture and its
// MathML; nothing inside a bundle is a Library folder; the wall cover is the bundle's
// cover.png; no console errors. Every file is synthetic. Avoids Chromium-only APIs.
import { createRequire } from 'module';
import { spawn } from 'child_process';
import { mkdtempSync, rmSync, mkdirSync, existsSync } from 'fs';
import { tmpdir } from 'os';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { makeBundles } from './local-fixtures.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i < 0 ? d : process.argv[i + 1]; };
const TMP = arg('tmp', tmpdir());
const SHOTS = arg('shots', join(TMP, 'stacks-bundle-ui'));
mkdirSync(SHOTS, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const { chromium } = createRequire('/opt/node22/lib/node_modules/')('playwright');
const EXE = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || ['/opt/pw-browsers/chromium-1194/chrome-linux/chrome'].find(existsSync);

let failed = 0;
function check(name, ok, detail = '') { if (!ok) failed++; console.log(`${ok ? '✓' : '✗'} ${name}${detail ? ' · ' + detail : ''}`); }

let BASE = arg('url', ''), FOLDER = arg('folder', ''), proc = null, own = null;
if (!BASE) {
  own = mkdtempSync(join(TMP, 'stacks-bundle-ui-'));
  FOLDER = makeBundles(join(own, 'Shelf'));
  const port = 20000 + Math.floor(Math.random() * 20000);
  proc = spawn(process.execPath, [join(ROOT, 'server.mjs'), '--port', String(port)], {
    env: { ...process.env, STACKS_LOCAL_DIRS: FOLDER, STACKS_CACHE: join(own, 'cache'), STACKS_WARM_MB: '0', STACKS_JOBS_DIR: join(own, 'jobs'), STACKS_JOBS_EVERY: '0' }, stdio: 'ignore',
  });
  BASE = `http://localhost:${port}`;
  for (let i = 0; i < 100; i++) { try { if ((await fetch(BASE + '/status')).ok) break; } catch { /* starting */ } await sleep(100); }
}
if (!FOLDER) { console.error('--folder: the folder the server at --url reads (test/local-fixtures.mjs makeBundles)'); process.exit(2); }
const cleanup = () => { proc?.kill(); if (own) rmSync(own, { recursive: true, force: true }); };

const J = await (await fetch(BASE + '/local/items.json?wait=1')).json();
const REPORT = 'A Field Report on Synthetic Stacks', SITE = 'The Exported Site, Retitled';

const browser = await chromium.launch({ executablePath: EXE });
const ctx = await browser.newContext({ viewport: { width: 1512, height: 982 } }); // the reader's 14-inch MacBook
await ctx.addInitScript(() => { try { localStorage.setItem('stacks2:lane', JSON.stringify('local')); localStorage.setItem('stacks2:libOn', 'false'); localStorage.setItem('stacks2:compile', 'false'); } catch { /* none */ } });
const page = await ctx.newPage();
const errs = [], bad = [];
page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text().slice(0, 240)); });
page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
page.on('response', (r) => { if (r.status() >= 400) bad.push(`${r.status()} ${new URL(r.url()).pathname}`); });
// The bundle's pictures arrive late, as from a slow disk or iCloud: the pages must not move when they do.
let hold = 0;
await page.route(/\/local\/rel\//, async (r) => { if (hold) await sleep(hold); r.continue(); });
await page.route(/\/proxy\?u=(?!https%3A%2F%2Fcdn\.jsdelivr\.net)/, (r) => r.fulfill({ status: 200, contentType: 'text/html', body: '<html><body><p>Stand-in.</p></body></html>' }));
await page.route('**/prefetch', (r) => r.fulfill({ json: { queued: 0 } }));

const head = () => page.evaluate(() => ({ t: document.querySelector('#item-head h1')?.textContent.trim(), pos: document.querySelector('#pos')?.textContent || '' }));
const rendered = (n0, ms = 15000) => page.waitForFunction((n) => window.__lc.n > n, n0, { timeout: ms });
async function open(title) {
  await page.mouse.click(1100, 500);
  const n0 = await page.evaluate(() => window.__lc.n);
  await page.keyboard.press('/');
  await page.fill('#s-input', title);
  await page.waitForFunction((t) => [...document.querySelectorAll('#s-results li')].some((li) => li.querySelector('.st')?.textContent.trim() === t), title, { timeout: 5000 });
  await page.evaluate((t) => [...document.querySelectorAll('#s-results li')].find((li) => li.querySelector('.st')?.textContent.trim() === t).click(), title);
  await rendered(n0);
}
const flowState = () => page.evaluate(async () => {
  const { live } = await import('/js/flow.js');
  const imgs = [...document.querySelectorAll('#spread img')];
  return {
    n: live?.n, first: (document.querySelector('#spread .flow p')?.getBoundingClientRect().top ?? -1) | 0,
    imgs: imgs.map((i) => ({ src: i.getAttribute('src'), ok: i.complete && i.naturalWidth > 0, sized: i.classList.contains('lc-sized') || i.classList.contains('wv-sized'), w: i.getBoundingClientRect().width | 0, h: i.getBoundingClientRect().height | 0, nr: i.naturalWidth / Math.max(1, i.naturalHeight) })),
  };
});

try {
  await page.goto(BASE + '/');
  await page.waitForSelector('#lanes button', { state: 'attached', timeout: 30000 });
  await page.evaluate(async () => { const u = await import('/js/util.js'); window.__lc = { n: 0 }; u.on('spread:rendered', () => { window.__lc.n++; }); });
  await page.waitForFunction(() => document.querySelector('#item-head h1'), null, { timeout: 30000 });

  // Nothing inside a bundle is a Library folder or an item of its own.
  const paths = await page.evaluate(async () => { const { items } = await import('/js/corpus.js'); return items.filter((it) => it.lane === 'local').map((it) => [it.t, it.path.join('/'), it.ext]); });
  check('each bundle is one Local item, in the folder above it', paths.filter(([, , e]) => e === 'bundle').length >= 4 && paths.every(([, p]) => !/stack|site-export|assets|images/i.test(p)), JSON.stringify(paths));

  // The Markdown bundle: pictures held back 1.2 s.
  hold = 2500;
  await open(REPORT);
  // The first spread may be a quick first look; the whole document follows with its pictures.
  await page.waitForFunction(() => document.querySelectorAll('#spread img').length >= 3, null, { timeout: 15000 }).catch(() => {});
  const h0 = await head();
  const s0 = await flowState();
  await page.waitForFunction(() => [...document.querySelectorAll('#spread img')].every((i) => i.complete && i.naturalWidth > 0), null, { timeout: 15000 }).catch(() => {});
  await sleep(600);
  const s1 = await flowState();
  hold = 0;
  check(`the Markdown bundle opens: “${REPORT}”`, h0.t === REPORT && s0.n > 2, `${h0.pos} · ${s0.n} columns`);
  check('its three pictures (assets/, images/deep/) load through /local/rel', s1.imgs.length === 3 && s1.imgs.every((i) => i.ok && /^\/local\/rel\/local:/.test(i.src)), JSON.stringify(s1.imgs.map((i) => `${i.ok}:${i.src}`)));
  check('every picture has its box before it loads (width and height from the server)', s0.imgs.length === 3 && s0.imgs.every((i) => !i.ok && i.sized && i.h > 20), JSON.stringify(s0.imgs.map((i) => `${i.sized}:${i.w}×${i.h}`)));
  check('the boxes have the pictures’ own shape', s1.imgs.every((i) => Math.abs(i.w / Math.max(1, i.h) - i.nr) < 0.05), JSON.stringify(s1.imgs.map((i) => `${i.w}×${i.h} vs ${i.nr.toFixed(2)}`)));
  check('the pages do not move when the pictures arrive', s0.n === s1.n && s0.first === s1.first && JSON.stringify(s0.imgs.map((i) => [i.w, i.h])) === JSON.stringify(s1.imgs.map((i) => [i.w, i.h])), `columns ${s0.n} → ${s1.n}, first paragraph at ${s0.first} → ${s1.first}`);
  await page.screenshot({ path: join(SHOTS, 'bundle-open.png') });
  // It turns pages like any flow document (from the first page: a server that read it before remembers where you were).
  let n0 = await page.evaluate(() => window.__lc.n);
  await page.mouse.click(1100, 500); await page.keyboard.press('Home'); await rendered(n0, 4000).catch(() => {}); await sleep(300);
  const before = (await head()).pos; n0 = await page.evaluate(() => window.__lc.n);
  await page.mouse.click(1100, 500); await page.keyboard.press('l'); await rendered(n0).catch(() => {}); await sleep(300);
  const after = (await head()).pos;
  check('it turns pages', before !== after, `${before} → ${after}`);
  // Walk to the end: every spread renders.
  let steps = 0, last = after;
  for (; steps < 30; steps++) { n0 = await page.evaluate(() => window.__lc.n); await page.keyboard.press('l'); await rendered(n0, 4000).catch(() => {}); await sleep(120); const p = (await head()).pos; if ((await head()).t !== REPORT || p === last) break; last = p; }
  await page.screenshot({ path: join(SHOTS, 'bundle-later.png') });
  check('it paginates to its end', steps >= 1, `${steps + 1} turns, last ${last}`);

  // The HTML bundle: its picture, MathML, nothing that runs.
  await open(SITE);
  await page.waitForFunction(() => [...document.querySelectorAll('#spread img')].every((i) => i.complete && i.naturalWidth > 0), null, { timeout: 10000 }).catch(() => {});
  const site = await page.evaluate(() => ({ t: document.querySelector('#item-head h1')?.textContent.trim(), imgs: [...document.querySelectorAll('#spread img')].map((i) => i.complete && i.naturalWidth > 0), math: !!document.querySelector('#spread math'), text: document.querySelector('#spread')?.textContent || '', bad: window.bad }));
  check(`the HTML bundle opens with its pictures and MathML: “${SITE}”`, site.t === SITE && site.imgs.length === 2 && site.imgs.every(Boolean) && site.math && /First paragraph of the exported page/.test(site.text) && site.bad === undefined, JSON.stringify({ imgs: site.imgs, math: site.math }));
  const why = await page.evaluate(() => [...document.querySelectorAll('#sec-why .lc-btn')].map((b) => b.textContent));
  check('the why line links to the source, not a file', why.includes('The source ↗') && !why.includes('The file ↗'), why.join(', '));
  await page.screenshot({ path: join(SHOTS, 'bundle-html.png') });

  // The wall cover is the bundle's cover.png.
  const cover = await page.evaluate(async (t) => {
    const { items } = await import('/js/corpus.js'); const { coverFor } = await import('/js/wall.js');
    const i = items.findIndex((it) => it.t === t); const el = coverFor(i);
    return { kind: el?.dataset.kind, src: el?.querySelector('img')?.getAttribute('src') || '', want: items[i].cover };
  }, REPORT);
  check('the wall cover is the bundle’s cover picture', cover.kind === 'post' && cover.src === cover.want && /cover\.png/.test(cover.src), JSON.stringify(cover));

  const other = errs.filter((e) => !/^Failed to load resource: the server responded with a status of 404/.test(e)); // /meta.json, /enrich.json: not here
  check('no console errors', !other.length, other.slice(0, 3).join(' | '));
  check('no failed requests from the bundles', !bad.some((b) => /\/local\//.test(b)), bad.slice(0, 5).join(', '));
} catch (e) {
  check('ran to the end', false, e.stack || e.message);
  await page.screenshot({ path: join(SHOTS, 'failed.png') }).catch(() => {});
} finally {
  await browser.close();
  cleanup();
}
console.log(failed ? `${failed} failed · screenshots in ${SHOTS}` : `all passed · screenshots in ${SHOTS}`);
process.exit(failed ? 1 : 0);
