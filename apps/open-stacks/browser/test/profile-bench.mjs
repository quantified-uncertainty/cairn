#!/usr/bin/env node
// The profile benchmark (docs/profiles/spec.md, section 11.1) in headless Chromium,
// against a running server:
//
//   node test/profile-bench.mjs [--port 4747] [--ids a,b] [--trials 12] [--parts switch,turnWarm,turnCold,scrub] [--no-prepare]
//
// It compiles the items first if they have no profile with a sprite and display
// images (through the app's own compiler), then runs ui/js/profile-bench.js:
// each item with no profile, with a profile but no stored images, and with
// them. Needs Playwright (npm i -g playwright && npx playwright install
// chromium; PLAYWRIGHT_CHROMIUM_EXECUTABLE for another Chromium). In your own
// browser, open the app with ?bench=profile instead.
import { createRequire } from 'module';
import { execSync } from 'child_process';
import { join } from 'path';

const argv = process.argv.slice(2);
const arg = (n, d) => { const i = argv.indexOf('--' + n); return i < 0 ? d : argv[i + 1]; };
const BASE = `http://127.0.0.1:${arg('port', 4747)}`;
let pw = null;
try { pw = await import('playwright'); } catch { try { pw = createRequire(join(execSync('npm root -g').toString().trim(), 'x.js'))('playwright'); } catch { /* none */ } }
if (!pw) { console.log('Playwright is not installed; open the app with ?bench=profile in your browser instead.'); process.exit(0); }
const exe = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
const browser = await pw.chromium.launch(exe ? { executablePath: exe } : {});
const page = await (await browser.newContext({ viewport: { width: 1728, height: 1050 } })).newPage();
page.on('console', (m) => { if (/^bench/.test(m.text())) console.log(m.text()); });
await page.goto(BASE + '/');
await page.waitForSelector('#spread .pg', { timeout: 60000 });
await page.evaluate(() => localStorage.setItem('stacks2:compile', 'false')); // idle compiling stays out of the numbers
const opts = { trials: Number(arg('trials', 12)), ...(arg('ids') ? { ids: arg('ids').split(',') } : {}), ...(arg('parts') ? { parts: arg('parts').split(',') } : {}), log: false };
const rows = await page.evaluate(async ([opts, prep]) => {
  const m = await import('/js/profile-bench.js');
  if (prep) await m.prepare(opts.ids || m.DEFAULT_IDS);
  return m.bench(opts);
}, [opts, !argv.includes('--no-prepare')]);
await page.evaluate(() => localStorage.removeItem('stacks2:compile'));
await browser.close();
const cols = ['id', 'cfg', 'shown', 'switchP50', 'switchP90', 'turnWarmP50', 'turnWarmP90', 'turnColdP50', 'turnColdP90', 'scrubP50', 'scrubP95', 'quickOnSame', 'quickMoving'];
console.log(cols.join('\t'));
for (const r of rows) console.log(cols.map((c) => r[c] ?? '').join('\t'));
