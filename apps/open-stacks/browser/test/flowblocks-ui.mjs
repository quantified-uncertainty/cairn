#!/usr/bin/env node
// UI check for code, diagrams and wide tables in flow documents (features/flowblocks.js), in
// headless Chromium. A script, not a node --test file:
//
//   node test/flowblocks-ui.mjs                                   # its own server on a synthetic folder
//   node test/flowblocks-ui.mjs --url http://localhost:4921 --folder DIR   # a running server and the folder it reads
//                              [--shots DIR] [--tmp DIR]
//
// Checks, on a Markdown file and an HTML file written here (Expressive Code, Shiki and
// highlight.js markup, Mermaid sources, a wide table, a tall table): one line per code line (no
// doubled spacing), indentation kept and wrapped lines hanging under it, the site's token colours
// for the light and the dark paper, a title bar kept as data-title; Mermaid drawn as an SVG image
// with its box reserved, a broken source left as code with its note; a wide table marked, its
// wide view across the spread opening and closing with Esc (still in the Reader); a table taller
// than a column continuing in the next one; no page errors. The only network is mermaid from
// cdn.jsdelivr.net, through the server's cache. Uses the global Playwright
// (/opt/node22/lib/node_modules) and Chromium from PLAYWRIGHT_CHROMIUM_EXECUTABLE.
import { createRequire } from 'module';
import { spawn } from 'child_process';
import { mkdtempSync, rmSync, mkdirSync, existsSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i < 0 ? d : process.argv[i + 1]; };
const TMP = arg('tmp', tmpdir());
const SHOTS = arg('shots', join(TMP, 'stacks-flowblocks-ui'));
mkdirSync(SHOTS, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const { chromium } = createRequire('/opt/node22/lib/node_modules/')('playwright');
const EXE = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || ['/opt/pw-browsers/chromium-1194/chrome-linux/chrome'].find(existsSync);

let failed = 0;
function check(name, ok, detail = '') { if (!ok) failed++; console.log(`${ok ? '✓' : '✗'} ${name}${detail ? ' · ' + detail : ''}`); }

// ---------------------------------------------------------------- the files (synthetic)
const WORDS = 'alpha beta gamma delta epsilon zeta theta iota kappa lambda omicron sigma tau upsilon omega river stone lantern meadow harbor signal'.split(' ');
let seed = 11;
const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed; };
const words = (n) => Array.from({ length: n }, () => WORDS[rnd() % WORDS.length]).join(' ');
const MD_T = 'Flow blocks check', HTML_T = 'Highlighted code check';
function markdown() {
  const rows = Array.from({ length: 6 }, (_, k) => `| Mode ${k} ${words(5)} | Kind ${k} | ${words(6)} | ${words(40)} | ${words(5)} |`).join('\n');
  const tall = Array.from({ length: 70 }, (_, k) => `| row ${k} | ${words(3)} | ${k * 7} |`).join('\n');
  return `# ${MD_T}

${words(60)}.

\`\`\`mermaid
graph LR
  A[First step] --> B[Second step]
  B --> C{Choice}
  C -->|yes| D[Done]
  C -->|no| A
\`\`\`

${words(50)}.

\`\`\`python
def total(rows, flags):
    s = 0.0
    for name, p, d in rows:
        if flags.get(name):
            p *= 0.1  # a long comment that will not fit on one line of a column, so it has to wrap somewhere
        s += p * d
    return s
\`\`\`

Inline \`code()\` in a sentence.

| Harm mode | Channel | Probability | Basis | Damage |
|---|---|---|---|---|
${rows}

${words(40)}.

\`\`\`mermaid
graph LR
  A[unclosed -->
\`\`\`

| Row | Words | Number |
|---|---|---|
${tall}

${words(80)}.
`;
}
function html() {
  const ln = (spans) => `<div class="ec-line"><div class="code">${spans}</div></div>`;
  const tok = (t, dark, light) => `<span style="--0:${dark};--1:${light}">${t}</span>`;
  const ec = `<div class="expressive-code"><link rel="stylesheet" href="/_astro/ec.css"><figure class="frame"><figcaption class="header"><span class="title">demo.py</span></figcaption><pre data-language="python"><code>${[
    ln(tok('import', '#C792EA', '#8844AE') + tok(' numpy ', '#D6DEEB', '#403F53') + tok('as', '#C792EA', '#8844AE') + tok(' np', '#D6DEEB', '#403F53')),
    ln(''),
    ln(tok('def', '#C792EA', '#8844AE') + tok(' f', '#82AAFF', '#3B61B0') + tok('(x):', '#D6DEEB', '#403F53')),
    ln(`<span class="indent">${tok('    ', '#D6DEEB', '#403F53')}</span>` + tok('return', '#C792EA', '#8844AE') + tok(' x ', '#D6DEEB', '#403F53') + tok('*', '#C792EA', '#8844AE') + tok(' 2', '#F78C6C', '#AA0982')),
  ].join('')}</code></pre><div class="copy"><button data-code="import numpy as np">Copy</button></div></figure></div>`;
  const shiki = `<pre class="astro-code" style="background-color:#fff"><code><span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583">const</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8"> x = </span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF">1</span></span>\n<span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D">// done</span></span></code></pre>`;
  const hljs = `<pre><code class="hljs language-js"><span class="hljs-keyword">let</span> y = <span class="hljs-number">2</span>;\n<span class="hljs-comment">// hljs</span></code></pre>`;
  return `<!doctype html><html><head><title>${HTML_T}</title></head><body><article><h1>${HTML_T}</h1><p>${words(60)}.</p>${ec}<p>${words(40)}.</p>${shiki}<p>${words(30)}.</p>${hljs}<pre class="mermaid">graph TD
  P[Plan] --> Q[Act]</pre><p>${words(60)}.</p></article></body></html>`;
}
function writeFiles(folder) {
  const d = join(folder, 'flowblocks');
  mkdirSync(d, { recursive: true });
  writeFileSync(join(d, 'flow-blocks.md'), markdown());
  writeFileSync(join(d, 'highlighted.html'), html());
}

// ---------------------------------------------------------------- the server
let BASE = arg('url', ''), FOLDER = arg('folder', ''), proc = null, own = null;
if (!BASE) {
  own = mkdtempSync(join(TMP, 'stacks-flowblocks-'));
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
const cleanup = () => { if (!own) rmSync(join(FOLDER, 'flowblocks'), { recursive: true, force: true }); proc?.kill(); if (own) rmSync(own, { recursive: true, force: true }); };

let J = null;
for (let k = 0; k < 60; k++) {
  J = await (await fetch(BASE + '/local/items.json?wait=1')).json();
  if ([MD_T, HTML_T].every((t) => J.items.some((x) => x.t === t))) break;
  await sleep(500);
}
const byT = (t) => J.items.find((x) => x.t === t);

const browser = await chromium.launch({ executablePath: EXE });
async function open(it, { paper = 'cream', w = 1512, h = 982 } = {}) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h } });
  await ctx.addInitScript((paper) => { try { localStorage.setItem('stacks2:compile', 'false'); localStorage.setItem('stacks2:settings', JSON.stringify({ paper })); } catch { /* none */ } }, paper);
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
  await page.route(/\/proxy\?u=(?!https%3A%2F%2Fcdn\.jsdelivr\.net)/, (r) => r.fulfill({ status: 200, contentType: 'text/html', body: '<html><body><article><h1>Stand-in</h1><p>A stand-in page.</p></article></body></html>' }));
  await page.route('**/prefetch', (r) => r.fulfill({ json: { queued: 0 } }));
  await page.goto(`${BASE}/?id=${encodeURIComponent(it.id)}&lane=local`);
  await page.waitForSelector('#spread .flow [data-vp]', { timeout: 60000 });
  await sleep(1200);
  return { page, ctx, errs };
}
/** Bring an element's column on screen (flow.js elToCol, the flow:jump a link click makes). */
const show = (page, sel) => page.evaluate(async (sel) => {
  const el = document.querySelector('#spread .flow ' + sel); if (!el) return false;
  const { elToCol } = await import('/js/flow.js'); const { emit } = await import('/js/util.js');
  emit('flow:jump', { col: elToCol(el), el });
  await new Promise((r) => setTimeout(r, 400));
  return true;
}, sel);

try {
  const md = byT(MD_T), hp = byT(HTML_T);
  check('the synthetic files are in the Local lane', !!md && !!hp, `${J.items.length} local items`);

  // ---------------------------------------------------------------- code, diagrams and tables in Markdown
  {
    const { page, ctx, errs } = await open(md);
    const r = await page.evaluate(() => {
      const f = document.querySelector('#spread .flow');
      const pre = f.querySelector('pre.wv-code[data-lang="python"]');
      const lines = pre ? [...pre.querySelectorAll('.wv-ln')] : [];
      const lh = pre ? parseFloat(getComputedStyle(pre).lineHeight) : 0;
      const long = lines.find((l) => /long comment/.test(l.textContent));
      const rs = long ? [...long.getClientRects()] : [];
      const rg = document.createRange(); if (long) rg.selectNodeContents(long);
      const boxes = long ? [...rg.getClientRects()].filter((x) => x.width > 2) : [];
      const fig = f.querySelector('figure.wv-diagram img.wv-dgimg');
      const tall = [...f.querySelectorAll('table')].find((t) => t.rows.length > 50);
      return {
        lines: lines.length, text: pre?.textContent, height: pre?.getBoundingClientRect().height, lh, indents: lines.map((l) => l.style.getPropertyValue('--i').trim() || '0').join(','),
        wrapped: boxes.length > 1 ? Math.round(boxes.at(-1).left - boxes[0].left) : null, rects: rs.length,
        fig: fig ? { w: fig.style.getPropertyValue('--w'), r: fig.style.getPropertyValue('--r'), src: fig.getAttribute('src').slice(0, 26), box: Math.round(fig.getBoundingClientRect().height) } : null,
        failed: !!f.querySelector('pre.wv-mermaid.wv-dg-fail'), wide: !!f.querySelector('table.wt-wide caption .wt-open'),
        tall: tall ? { cls: tall.className, frags: tall.getClientRects().length } : null,
        inline: (() => { const c = [...f.querySelectorAll('p code')][0]; return c ? getComputedStyle(c).hyphens : null; })(),
      };
    });
    check('a fenced code block is one pre.wv-code, one span per line', r.lines === 7, `${r.lines} lines`);
    check('no doubled spacing: the block is about one line high per line', r.height < (r.lines + 3) * r.lh, `${Math.round(r.height)} px for ${r.lines} lines of ${r.lh} px`);
    check('indentation is kept', r.indents === '0,4,4,8,12,8,4' && /\n {12}p \*= 0\.1/.test(r.text), r.indents);
    check('a wrapped line hangs under its own indentation', r.wrapped > 0, `continuation ${r.wrapped} px right of the line's start`);
    check('the code text keeps its line breaks (textContent, copy)', r.text.split('\n').length >= 7 && !/\n\n\n/.test(r.text));
    check('inline code is not hyphenated', r.inline === 'manual', r.inline);
    check('a Mermaid block is drawn as an SVG image with its box reserved', !!r.fig && /^data:image\/svg\+xml/.test(r.fig.src) && parseFloat(r.fig.w) > 50 && parseFloat(r.fig.r) > 0 && r.fig.box > 20, JSON.stringify(r.fig));
    check('a Mermaid block that does not parse stays as its source, with the note', r.failed);
    check('the wide table is marked, with the wide-view control in its caption', r.wide);
    check('a table taller than a column continues in the next column', r.tall && r.tall.frags > 1, JSON.stringify(r.tall));
    // The wide view.
    await show(page, 'table.wt-wide');
    const b = await page.evaluate(() => { const x = document.querySelector('#spread .flow table.wt-wide .wt-open').getBoundingClientRect(); return [x.left + x.width / 2, x.top + x.height / 2]; });
    await page.mouse.click(b[0], b[1]);
    await page.waitForSelector('#wt-ov', { timeout: 3000 }).catch(() => {});
    const ov = await page.evaluate(() => { const o = document.querySelector('#wt-ov'); if (!o) return null; const t = o.querySelector('table').getBoundingClientRect(); return { w: Math.round(t.width), label: o.querySelector('.wt-t').textContent, colw: document.querySelector('#spread .flow table.wt-wide').getBoundingClientRect().width }; });
    await page.screenshot({ path: join(SHOTS, 'wide-view.jpg'), type: 'jpeg', quality: 60 });
    check('the wide view opens across the spread, wider than a column', ov && ov.w > ov.colw * 1.3, ov ? `${ov.w} px against ${Math.round(ov.colw)} · "${ov.label}"` : 'did not open');
    await page.keyboard.press('Escape'); await sleep(250);
    const after = await page.evaluate(async () => ({ open: !!document.querySelector('#wt-ov'), view: (await import('/js/state.js')).state.view }));
    check('Esc closes the wide view and stays in the Reader', !after.open && after.view === 'feed', JSON.stringify(after));
    await show(page, 'pre.wv-code');
    await page.screenshot({ path: join(SHOTS, 'markdown-code.jpg'), type: 'jpeg', quality: 60 });
    check('no page errors (Markdown)', !errs.length, errs.join(' | '));
    await ctx.close();
  }

  // ---------------------------------------------------------------- the site's own highlighting, light and dark paper
  for (const paper of ['cream', 'dark']) {
    const { page, ctx, errs } = await open(hp, { paper });
    const r = await page.evaluate(() => {
      const f = document.querySelector('#spread .flow');
      const ec = f.querySelector('pre.wv-code[data-title="demo.py"]');
      const kw = ec?.querySelector('.wv-tc');
      const sh = [...f.querySelectorAll('pre.wv-code')].find((p) => /const/.test(p.textContent))?.querySelector('.wv-tc');
      const hl = f.querySelector('pre.wv-code[data-hl="hljs"] .tk-keyword');
      return {
        ec: !!ec, lines: ec?.querySelectorAll('.wv-ln').length, copy: !!f.querySelector('.copy, button[data-code]'), kw: kw ? [getComputedStyle(kw).color, kw.style.getPropertyValue('--cl'), kw.style.getPropertyValue('--cd')] : null,
        sh: sh ? [getComputedStyle(sh).color, sh.style.getPropertyValue('--cl'), sh.style.getPropertyValue('--cd')] : null, hl: hl ? getComputedStyle(hl).color : null,
        mm: !!f.querySelector('figure.wv-diagram'),
      };
    });
    const hex = (c) => { const m = /rgb\((\d+), (\d+), (\d+)\)/.exec(c || ''); return m ? '#' + m.slice(1).map((v) => (+v).toString(16).padStart(2, '0')).join('') : c; };
    const want = (x) => (paper === 'dark' ? x?.[2] : x?.[1])?.trim().toLowerCase();
    check(`${paper}: an Expressive Code block keeps its four lines (the empty one too), drops its copy button, keeps its title`, r.ec && r.lines === 4 && !r.copy, `${r.lines} lines`);
    check(`${paper}: Expressive Code token colours from the ${paper === 'dark' ? 'dark' : 'light'} theme`, r.kw && hex(r.kw[0]) === want(r.kw), JSON.stringify(r.kw));
    check(`${paper}: Shiki --shiki-light / --shiki-dark colours`, r.sh && hex(r.sh[0]) === want(r.sh), JSON.stringify(r.sh));
    check(`${paper}: highlight.js classes get the paper's palette`, !!r.hl && r.hl !== 'rgb(0, 0, 0)', r.hl);
    check(`${paper}: <pre class="mermaid"> in an HTML file is drawn`, r.mm);
    await page.screenshot({ path: join(SHOTS, `html-code-${paper}.jpg`), type: 'jpeg', quality: 60 });
    check(`no page errors (HTML, ${paper})`, !errs.length, errs.join(' | '));
    await ctx.close();
  }
} catch (e) {
  failed++; console.error(e);
} finally {
  await browser.close();
  cleanup();
}
console.log(failed ? `${failed} failed` : 'all passed', '· screenshots in', SHOTS);
process.exit(failed ? 1 : 0);
