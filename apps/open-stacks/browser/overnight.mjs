#!/usr/bin/env node
/**
 * The whole-corpus overnight run, one command: fetch what is not on disk,
 * compile every PDF and scan, then the AI passes (relevance and best pages,
 * reading guides, threads), each skipping work already done, under one total
 * spending cap and a time cap, with a log and a summary at the end.
 *
 *   bin/stacks overnight [--max-usd 15] [--yes] [--hours 9] [--lanes a,b] [--limit N]
 *                        [--steps warm,compile,enrich,augment,threads] [--again] [--dry-run]
 *   node overnight.mjs   (the same; --port 4747)
 *
 * Steps, in order (each one a script of its own, run as a child process):
 *   warm     node warm.mjs --items 1000 --pages 1     every PDF and post into the cache (≤ 1.5 h)
 *   compile  node compile.mjs --assets full           profiles: shapes, crops, contents, text (≤ 4 h)
 *            (Playwright's Chromium: PDFs and scans; else poppler: PDFs only; else skipped)
 *   enrich   node enrich-batch.mjs                    rel, hooks, best pages (≤ 0.5 h, about $0.30)
 *   augment  node augment-batch.mjs --all --no-wait   reading guides, one batch at half price (about $4.50)
 *   threads  node threads.mjs                         Feeds threads (the rest of the time, about $7.70)
 * Each skips what is done (current profiles, items enriched with the same input,
 * current guides, items with a thread), so stopping (Ctrl-C) and starting again
 * continues; a step that finished tonight is not run again unless --again.
 *
 * Money: --max-usd is the total for the night across the AI steps (enrich and
 * threads count what they spent, augment its batch estimate, which the server
 * reserves); without it, what is left of today's AI budget. The reading-guide
 * batch is also cut to what is left of the server's daily budget (Settings ›
 * AI and cost): raise it there to send the whole corpus. Before spending, the
 * plan is printed and it asks, unless --yes. Threads are capped by --limit from
 * their own per-item estimate. STACKS_MOCK_AI=1 runs everything without the API.
 *
 * The server: the one answering on --port, else one started the way bin/stacks
 * starts it (log and pid in the cache folder, STACKS_CACHE_MAX=20G unless set),
 * left running at the end so it collects the reading-guide batch (results within
 * 24 h; bin/stacks stop stops it). Log: CACHE/overnight/<date>.log; the night's
 * state and summary: CACHE/overnight/state.json. On a Mac it holds off sleep
 * (caffeinate) while it runs.
 */
import { spawn, execFileSync, execSync } from 'child_process';
import { createRequire } from 'module';
import { readFileSync, writeFileSync, mkdirSync, appendFileSync, existsSync, unlinkSync, openSync, renameSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const HERE = dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const flag = (k) => argv.includes('--' + k);
const opt = (k, d = null) => { const j = argv.indexOf('--' + k); return j >= 0 && argv[j + 1] && !argv[j + 1].startsWith('--') ? argv[j + 1] : d; };
if (flag('help') || flag('h')) { console.log(readFileSync(fileURLToPath(import.meta.url), 'utf-8').split('*/')[0].replace(/^[\s\S]*?\/\*\*\n/, '').replace(/^ \* ?/gm, '')); process.exit(0); }

export const STEPS = ['warm', 'compile', 'enrich', 'augment', 'threads'];
const HOURS = { warm: 1.5, compile: 4, enrich: 0.5, augment: 1, threads: 24 }; // caps per step; the night's --hours caps them all
const usd = (x) => '$' + Number(x || 0).toFixed(x > 0 && x < 0.1 ? 4 : 2);
const readJson = (f, d) => { try { return JSON.parse(readFileSync(f, 'utf-8')); } catch { return d; } };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// The line of a step's output that says what it did, for the summary.
const SAYS = /checked ·|^Done:|^Nothing to do|^Enriched \d|items? to enrich|^Submitted |items? to send|^Nothing submitted|^Not submitted|^Wrote \d|items? to write|^Stopping/;
const MOCK = /^(1|true|yes)$/i.test(process.env.STACKS_MOCK_AI || '');

/** The money a step's output says it spent ("Spent $1.23"), or its batch estimate ("Submitted …, estimated $4.10"). */
export function spentIn(out) {
  const s = /Spent \$([\d.]+)/.exec(out); if (s) return Number(s[1]);
  const b = /Submitted \S+: \d+ items, estimated \$([\d.]+)/.exec(out); return b ? Number(b[1]) : 0;
}
/** What is left of the night's cap. */
export const capLeft = (cap, spent) => Math.max(0, +(cap - spent).toFixed(4));
/** threads.mjs --dry-run's per-item estimate, and how many items it plans. */
export function threadsPlan(out) {
  const n = /(\d+) items? to write/.exec(out), per = /about \$([\d.]+) an item/.exec(out);
  return { n: n ? Number(n[1]) : 0, per: per ? Number(per[1]) : null };
}

async function main() {
  const { CACHE } = await import('./server/config.mjs');
  const PORT = Number(opt('port', process.env.STACKS_PORT || 4747));
  const BASE = `http://127.0.0.1:${PORT}`;
  const DIR = join(CACHE, 'overnight'); mkdirSync(DIR, { recursive: true });
  const day = new Date().toLocaleDateString('en-CA');
  const LOG = join(DIR, `${day}.log`), STATE = join(DIR, 'state.json'), LOCK = join(DIR, 'lock');
  const steps = (opt('steps') ? opt('steps').split(',').map((s) => s.trim()) : STEPS).filter((s) => STEPS.includes(s));
  const lanes = opt('lanes'), limit = opt('limit') != null ? Math.max(1, Number(opt('limit')) || 1) : null;
  const deadline = Date.now() + (Number(opt('hours', 9)) || 9) * 3600e3;
  const DRY = flag('dry-run') || flag('dry');
  const log = (s) => { console.log(s); try { appendFileSync(LOG, s + '\n'); } catch { /* the log is a convenience */ } };

  // One run at a time.
  if (!DRY) {
    let other = 0; try { other = Number(readFileSync(LOCK, 'utf-8').trim()) || 0; } catch { /* no lock */ }
    if (other && other !== process.pid) { try { process.kill(other, 0); console.error(`Another overnight run is going (pid ${other}); its log: ${LOG}`); process.exit(1); } catch { /* stale lock */ } }
    writeFileSync(LOCK, String(process.pid));
  }
  // The night: a run started in the last 16 h that did not finish is continued (its spend counts).
  let S = readJson(STATE, null);
  if (!S || S.finished || Date.now() - Date.parse(S.started) > 16 * 3600e3) S = { started: new Date().toISOString(), spent: 0, steps: {}, finished: null };
  const save = () => { if (DRY) return; const t = STATE + '.tmp'; writeFileSync(t, JSON.stringify(S, null, 1)); renameSync(t, STATE); };

  // ---- what is installed
  const has = (cmd, a = ['-v']) => { try { execFileSync(cmd, a, { stdio: 'ignore' }); return true; } catch { return false; } };
  const poppler = has('pdftoppm') && has('pdftotext');
  let playwright = false;
  try { await import('playwright'); playwright = true; } catch {
    try { const root = execSync('npm root -g', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); createRequire(join(root, 'noop.js')).resolve('playwright'); playwright = true; } catch { /* none */ }
  }
  const status = async () => { try { const r = await fetch(BASE + '/status', { signal: AbortSignal.timeout(3000) }); return r.ok ? r.json() : null; } catch { return null; } };
  let st = await status();
  const spend = st?.spend || null;
  const dailyLeft = spend ? Math.max(0, spend.budget - spend.today) : null;
  const cap = opt('max-usd') != null ? Math.max(0, Number(opt('max-usd')) || 0) : (dailyLeft ?? Number(process.env.STACKS_DAILY_BUDGET || 3));
  log(`\n== Overnight run ${new Date().toLocaleString()} (pid ${process.pid})${S.spent ? `, continuing tonight's run: ${usd(S.spent)} spent so far` : ''}`);
  log(`Steps: ${steps.join(' → ')}${lanes ? `; lanes ${lanes}` : ''}${limit ? `; at most ${limit} items a step` : ''}; until ${new Date(deadline).toLocaleTimeString()}; AI cap ${usd(cap)}${opt('max-usd') == null ? ' (what is left of today\'s budget; --max-usd to set it)' : ''}${MOCK ? '; STACKS_MOCK_AI: nothing is spent' : ''}.`);
  log(`Compile engine: ${playwright ? 'Playwright\'s Chromium (PDFs and scans)' : poppler ? 'poppler (PDFs only; for scans: npm i -g playwright && npx playwright install chromium)' : 'none: the compile step is skipped (brew install poppler, or npm i -g playwright && npx playwright install chromium)'}. PDF text for guides and threads: ${poppler ? 'poppler\'s pdftotext' : 'profiles only (brew install poppler for the rest)'}.`);
  log(`Server: ${st ? `running on port ${PORT}` : `not running on port ${PORT}; one will be started (bin/stacks stop stops it)`}${spend ? `; today's AI budget ${usd(spend.budget)}, ${usd(spend.today)} spent` : ''}.`);
  if (st && st.cacheMax && st.cacheMax < 15 * 1024 ** 3 && steps.some((s) => ['warm', 'compile'].includes(s))) log(`Note: the server's cache cap is ${(st.cacheMax / 1024 ** 3).toFixed(0)} GB; the whole corpus with profiles wants about 20 (bin/stacks stop, then STACKS_CACHE_MAX=20G bin/stacks).`);

  // ---- children
  let child = null, stopping = false;
  const run = (name, script, args, hours) => new Promise((resolve) => {
    const t0 = Date.now(), ms = Math.max(60e3, Math.min(hours * 3600e3, deadline - Date.now()));
    log(`\n-- ${name}: node ${script} ${args.join(' ')}  (at most ${(ms / 3600e3).toFixed(1)} h)`);
    let out = '', capped = false;
    child = spawn(process.execPath, [join(HERE, script), ...args], { cwd: HERE, env: { ...process.env, STACKS_PORT: String(PORT) }, stdio: ['ignore', 'pipe', 'pipe'] });
    const take = (d) => { const s = d.toString(); out += s; if (out.length > 4e6) out = out.slice(-2e6); process.stdout.write(s); try { appendFileSync(LOG, s); } catch { /* ignore */ } };
    child.stdout.on('data', take); child.stderr.on('data', take);
    const timer = setTimeout(() => { capped = true; log(`\n${name}: time cap reached, stopping it (the next run continues).`); child?.kill('SIGINT'); setTimeout(() => child?.kill('SIGTERM'), 60e3).unref(); }, ms);
    child.on('exit', (code, sig) => {
      clearTimeout(timer); child = null;
      const lines = out.trim().split('\n').filter((l) => l.trim());
      const said = lines.filter((l) => SAYS.test(l)).at(-1) || lines.filter((l) => !/^(File|Log|Output):/.test(l)).at(-1) || '';
      resolve({ code, sig, capped, out, s: Math.round((Date.now() - t0) / 1000), last: said.trim().slice(0, 200) });
    });
  });
  const stop = () => { if (stopping) process.exit(130); stopping = true; log('\nStopping (Ctrl-C again to quit at once); the next run continues where this one was.'); child?.kill('SIGINT'); };
  process.on('SIGINT', stop); process.on('SIGTERM', stop);

  // ---- the server
  const startServer = async () => {
    if (await status()) return true;
    const slog = join(CACHE, `server-${PORT}.log`), pidf = join(CACHE, `server-${PORT}.pid`);
    const fd = openSync(slog, 'a');
    const p = spawn(process.execPath, [join(HERE, 'server.mjs'), '--port', String(PORT)], { cwd: HERE, detached: true, stdio: ['ignore', fd, fd], env: { STACKS_CACHE_MAX: '20G', ...process.env } });
    p.unref(); writeFileSync(pidf, String(p.pid));
    for (let i = 0; i < 100 && !(await status()); i++) await sleep(200);
    st = await status();
    log(st ? `Started the server on port ${PORT} (pid ${p.pid}, log ${slog}).` : `The server did not start; see ${slog}.`);
    return !!st;
  };

  // ---- the plan, and the question
  const thLimit = async (left) => {
    const r = await run('threads (plan)', 'threads.mjs', ['--dry-run', '--port', String(PORT), ...(lanes ? ['--lanes', lanes] : []), ...(limit ? ['--limit', String(limit)] : [])], 0.2);
    const p = threadsPlan(r.out);
    return { ...p, limit: p.per ? Math.min(p.n, Math.floor(left / p.per)) : p.n };
  };
  if (DRY || !flag('yes')) {
    if (steps.includes('enrich')) await run('enrich (plan)', 'enrich-batch.mjs', ['--dry-run', ...(lanes ? ['--lanes', lanes] : []), ...(limit ? ['--limit', String(limit)] : [])], 0.1);
    if (steps.includes('threads')) { const p = await thLimit(capLeft(cap, S.spent)); log(`threads: ${p.n} items without a thread${p.per ? `, about ${usd(p.per)} each` : ''}; tonight's cap allows ${p.limit}.`); }
    if (steps.includes('augment')) log('augment: the reading-guide plan reads every item\'s text first (36 minutes the first time) and prints its count and estimate when it runs; about $4.50 for the whole corpus.');
    if (DRY) { log('\nDry run: nothing compiled, sent or written.'); return; }
    process.stdout.write(`\nGo ahead, spending at most ${usd(capLeft(cap, S.spent))} on AI tonight? [y/N] `);
    const a = await new Promise((r) => { process.stdin.once('data', (d) => r(String(d))); });
    process.stdin.pause();
    if (!/^y(es)?$/i.test(a.trim())) { log('Not started.'); return; }
  }
  if (!(await startServer())) process.exit(1);
  if (process.platform === 'darwin') { try { spawn('caffeinate', ['-i', '-w', String(process.pid)], { stdio: 'ignore', detached: true }).unref(); } catch { /* not there */ } }

  // ---- the steps
  const common = [...(lanes ? ['--lanes', lanes] : [])];
  for (const name of steps) {
    if (stopping) break;
    if (S.steps[name]?.status === 'done' && !flag('again')) { log(`\n-- ${name}: done earlier tonight (--again to run it again).`); continue; }
    if (Date.now() > deadline - 60e3) { S.steps[name] = { status: 'no time left' }; continue; }
    const left = capLeft(cap, S.spent);
    let r = null, note = '';
    if (name === 'warm') r = await run(name, 'warm.mjs', ['--items', String(limit || 1000), '--pages', '1', '--port', String(PORT), ...common], HOURS.warm);
    else if (name === 'compile') {
      if (!playwright && !poppler) { S.steps[name] = { status: 'skipped', note: 'no engine: brew install poppler, or npm i -g playwright && npx playwright install chromium' }; log(`\n-- compile: skipped (${S.steps[name].note}).`); save(); continue; }
      r = await run(name, 'compile.mjs', ['--assets', 'full', '--port', String(PORT), ...(limit ? ['--items', String(limit)] : []), ...common], HOURS.compile);
    } else if (name === 'enrich') {
      if (left <= 0 && !MOCK) { S.steps[name] = { status: 'skipped', note: 'the AI cap is used up' }; log('\n-- enrich: skipped (the AI cap is used up).'); save(); continue; }
      r = await run(name, 'enrich-batch.mjs', ['--yes', '--max-usd', String(left), ...(limit ? ['--limit', String(limit)] : []), ...common], HOURS.enrich);
    } else if (name === 'augment') {
      const sp = (await status())?.spend, srvLeft = sp ? Math.max(0, sp.budget - sp.today) : left;
      const m = Math.min(left, srvLeft);
      if (m <= 0.005 && !MOCK) { S.steps[name] = { status: 'skipped', note: left <= 0 ? 'the AI cap is used up' : 'today\'s AI budget in Settings is used up' }; log(`\n-- augment: skipped (${S.steps[name].note}).`); save(); continue; }
      r = await run(name, 'augment-batch.mjs', [...(limit ? ['--limit', String(limit)] : ['--all']), '--yes', '--no-wait', '--max-usd', String(m), '--port', String(PORT), ...common], HOURS.augment);
    } else if (name === 'threads') {
      const p = await thLimit(left);
      if (!p.n) { S.steps[name] = { status: 'done', note: 'every item has a thread' }; log('\n-- threads: nothing to write.'); save(); continue; }
      if (!p.limit && !MOCK) { S.steps[name] = { status: 'skipped', note: 'the AI cap is used up' }; log('\n-- threads: skipped (the AI cap is used up).'); save(); continue; }
      if (p.limit < p.n) note = `${p.limit} of ${p.n} items, to stay under the cap`;
      r = await run(name, 'threads.mjs', ['--yes', '--limit', String(MOCK ? p.n : p.limit), '--port', String(PORT), ...common], HOURS.threads);
    }
    if (name === 'augment' && /more did not fit/.test(r.out)) note = 'some items did not fit under what is left of today\'s AI budget: raise it in Settings › AI and cost (or --max-usd) and run again';
    const spent = MOCK ? 0 : spentIn(r.out);
    S.spent = +(S.spent + spent).toFixed(4);
    S.steps[name] = { status: stopping ? 'stopped' : r.capped ? 'time cap' : r.code === 0 ? 'done' : `exit ${r.code ?? r.sig}`, s: (S.steps[name]?.s || 0) + r.s, spent: +((S.steps[name]?.spent || 0) + spent).toFixed(4), last: r.last, ...(note ? { note } : {}) };
    save();
  }

  // ---- summary
  const L = ['', '== Summary' + (stopping ? ' (stopped; run it again to continue)' : '')];
  for (const name of steps) {
    const x = S.steps[name]; if (!x) continue;
    L.push(`${name.padEnd(8)} ${String(x.status).padEnd(12)} ${x.s != null ? `${Math.round(x.s / 60)} min`.padEnd(8) : ''.padEnd(8)} ${x.spent ? usd(x.spent).padEnd(7) : ''.padEnd(7)} ${x.note || x.last || ''}`);
  }
  L.push(`AI spent tonight: ${usd(S.spent)} of ${usd(cap)}${MOCK ? ' (mock)' : ''}. The reading-guide batch, if one was sent, finishes within 24 h while the server runs (node augment-batch.mjs --status).`);
  L.push(`Log: ${LOG}`);
  for (const l of L) log(l);
  if (!stopping) S.finished = new Date().toISOString();
  S.summary = L.slice(1, -1);
  save();
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const lock = async () => join((await import('./server/config.mjs')).CACHE, 'overnight', 'lock');
  main().then(async () => { try { const f = await lock(); if (Number(readFileSync(f, 'utf-8')) === process.pid) unlinkSync(f); } catch { /* none */ } process.exit(0); },
    async (e) => { console.error(e.stack || e.message || e); try { unlinkSync(await lock()); } catch { /* none */ } process.exit(1); });
}
