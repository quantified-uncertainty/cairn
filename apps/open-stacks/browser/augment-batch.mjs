#!/usr/bin/env node
/**
 * Reading guides for many items at once, through the Message Batches API at
 * half price (docs/profiles/spec.md, section 8.6).
 *
 *   node augment-batch.mjs [--lanes ai-safety,llm] [--ids id1,id2] [--limit 500 | --all]
 *                          [--model claude-haiku-5-5] [--max-usd 2] [--dry] [--yes]
 *                          [--status] [--watch <batchId>] [--no-wait] [--port 4747]
 *
 *   node augment-batch.mjs --all --dry    # the whole corpus: how many, what it costs, what is left out
 *
 * It prints how many items it would send and what that should cost, and asks
 * before submitting (--yes skips the question, --dry only prints). The batch
 * is cut to fit --max-usd (default: what is left of today's AI budget, which
 * Settings or STACKS_DAILY_BUDGET sets) and its estimate is reserved against
 * that budget, so a batch over what is left of it is refused: the plan says
 * so and how high to raise it. --all lifts the 500-item limit. Items whose
 * text is not on disk yet are left out ("no_text"); the plan says how to
 * fetch them. Results usually arrive within an hour (at most 24 hours).
 *
 * With a server running on --port, the server does the work and keeps polling
 * even if this script stops; batch state lives in CACHE/augment/batches/, so
 * a restarted server resumes. Without one, this script runs the same code
 * itself and polls until the batch ends (no other process should write
 * spend.json meanwhile). --status lists batches; --watch follows one.
 * STACKS_MOCK_AI=1 (standalone) answers every item at once, without the API.
 */
import { createInterface } from 'readline';
import { request } from 'http';

const argv = process.argv.slice(2);
const flag = (k) => argv.includes('--' + k);
const opt = (k, d = null) => { const j = argv.indexOf('--' + k); return j >= 0 && argv[j + 1] && !argv[j + 1].startsWith('--') ? argv[j + 1] : d; };
const list = (k) => (opt(k) ? opt(k).split(',').map((s) => s.trim()).filter(Boolean) : undefined);
if (flag('help') || flag('h')) {
  console.log('node augment-batch.mjs [--lanes a,b] [--ids x,y] [--limit 500 | --all] [--model m] [--max-usd 2] [--dry] [--yes] [--verbose]\n                        [--status] [--watch <batchId>] [--no-wait] [--port 4747]   (see the comment at the top of this file)');
  process.exit(0);
}

const port = Number(opt('port', process.env.STACKS_PORT || 4747));
const base = `http://127.0.0.1:${port}`;
const req = { ids: list('ids'), lanes: list('lanes'), limit: flag('all') ? 100000 : Number(opt('limit', 500)), model: opt('model') || undefined, maxUsd: opt('max-usd') != null ? Number(opt('max-usd')) : undefined };
const usd = (x) => '$' + Number(x || 0).toFixed(x < 0.1 ? 4 : 2);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** The calls, over HTTP to a running server or in this process. */
async function backend() {
  try {
    const r = await fetch(base + '/status', { signal: AbortSignal.timeout(1500) });
    if (r.ok && (await r.json()).augment) {
      // node:http, not fetch: fetch gives up after 300 s without response headers, and planning the
      // whole corpus reads every item's text first (a scan's OCR comes from the Internet Archive).
      const call = (method, path, body) => new Promise((ok, fail) => {
        const data = body ? JSON.stringify(body) : null;
        const rq = request(base + path, { method, headers: data ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } : {} }, (res) => {
          let s = ''; res.setEncoding('utf8');
          res.on('data', (c) => (s += c)).on('error', fail).on('end', () => {
            let j = {}; try { j = JSON.parse(s); } catch { /* not JSON */ }
            if (res.statusCode >= 400) fail(Object.assign(new Error(j.error || 'HTTP ' + res.statusCode), { code: j.code })); else ok(j);
          });
        });
        rq.on('error', fail);
        rq.end(data || undefined);
      });
      return {
        where: `the server on port ${port}`,
        submit: (b) => call('POST', '/augment/batch', b),
        info: (id) => call('GET', '/augment/batch?id=' + encodeURIComponent(id)),
        list: () => call('GET', '/augment/batches'),
        poll: async (id) => call('GET', '/augment/batch?id=' + encodeURIComponent(id)),
      };
    }
  } catch { /* no server */ }
  // Standalone: the summarizer's model plumbing (spend, budget, mock) on a stand-in app.
  const cache = await import('./server/cache.mjs');
  const { HERE, CACHE, MODEL, hasKey } = await import('./server/config.mjs');
  const app = { HERE, CACHE, MODEL, hasKey, cache, port: null, route() {}, status() {}, onStart() {}, json() {}, send() {}, body() {} };
  (await import('./server/routes/30-summarize.mjs')).default(app);
  const { createAugmenter } = await import('./server/augment.mjs');
  const A = createAugmenter(app);
  const find = (id) => A.listBatches().find((r) => r.id === id);
  return {
    where: 'this process (no server on port ' + port + ')',
    submit: (b) => A.submitBatch(b),
    info: async (id) => { const r = find(id); if (!r) throw new Error('no such batch'); return { ...A.brief(r), failed: r.failed || [] }; },
    list: async () => A.listBatches().map(A.brief),
    poll: async (id) => { await A.pollBatch(id); const r = find(id); return { ...A.brief(r), failed: r.failed || [] }; },
    standalone: true,
  };
}

function show(b) {
  const c = b.counts || {};
  return `${b.id}  ${b.status}${b.mock ? ' (mock)' : ''}  ${b.n} items  ok ${c.succeeded ?? 0} · errored ${c.errored ?? 0} · expired ${c.expired ?? 0} · processing ${c.processing ?? 0}  est ${usd(b.est)}  cost ${usd(b.cost)}  ${b.at}`;
}
async function watch(B, id) {
  for (;;) {
    const b = await B.poll(id);
    console.log(new Date().toLocaleTimeString(), show(b));
    if (b.status === 'ended') {
      if (b.failed?.length) {
        console.log(`\n${b.failed.length} failed:`);
        for (const f of b.failed) console.log(`  ${f.id}  ${f.why}${f.retry ? '  (run again to retry)' : ''}`);
      }
      return b;
    }
    await sleep(60e3);
  }
}
const ask = (q) => new Promise((r) => { const rl = createInterface({ input: process.stdin, output: process.stdout }); rl.question(q, (a) => { rl.close(); r(a); }); });

const B = await backend();
console.log(`Reading-guide batches via ${B.where}.`);
if (flag('status')) {
  const all = await B.list();
  if (!all.length) console.log('No batches yet.');
  for (const b of all) console.log(show(b));
  process.exit(0);
}
if (opt('watch')) { await watch(B, opt('watch')); process.exit(0); }

console.log(`Planning: reading each item's text${req.ids ? '' : ' (for the whole corpus that takes a while the first time; scans\' OCR is fetched once)'}…`);
const plan = await B.submit({ ...req, dry: true });
const why = {};
for (const s of plan.skipped || []) why[s.why] = (why[s.why] || 0) + 1;
console.log(`\n${plan.n} item${plan.n === 1 ? '' : 's'} to send, estimated ${usd(plan.est)} at batch prices (cap ${usd(plan.cap)}).`);
if (Object.keys(why).length) console.log('Left out: ' + Object.entries(why).map(([w, n]) => `${n} ${w}`).join(', ') + (flag('verbose') ? '' : ' (--verbose lists them)'));
if (flag('verbose')) for (const s of plan.skipped || []) console.log(`  ${s.id}  ${s.why}`);
const where = B.standalone ? '(STACKS_DAILY_BUDGET=N before the command, with no server running)' : 'in Settings (,) › AI and cost';
if (why['over max-usd']) {
  console.log(`${why['over max-usd']} more did not fit under ${usd(plan.cap)}, ${opt('max-usd') != null ? 'the --max-usd you gave: raise it' : `what is left of today's AI budget: raise the daily budget ${where}`} to send them too.`);
}
if (why.no_text) {
  console.log(`${why.no_text} have no text on disk yet. ${B.standalone ? 'Start the server first (bin/stacks): scans\' text comes through it. Then ' : 'To fetch them, '}`
    + '`node warm.mjs --items 1000 --pages 1` brings every PDF and post into the cache (PDFs also need poppler\'s pdftotext: brew install poppler); then run this again.');
}
if (plan.left != null && plan.n && plan.est > plan.left) {
  const need = Math.ceil(plan.budget - plan.left + plan.est);
  console.log(`That is more than today's AI budget has left (${usd(plan.left)} of ${usd(plan.budget)}), so it would be refused. Raise the daily budget to $${need} or more `
    + (B.standalone ? `(STACKS_DAILY_BUDGET=${need} node augment-batch.mjs …)` : 'in Settings (,) › AI and cost') + ', or pass a lower --max-usd to send fewer items.');
  if (!flag('dry')) process.exit(1);
}
if (!plan.n || flag('dry')) process.exit(0);
if (!flag('yes')) {
  const a = await ask(`Submit ${plan.n} requests for about ${usd(plan.est)}? [y/N] `);
  if (!/^y(es)?$/i.test(a.trim())) { console.log('Not submitted.'); process.exit(0); }
}
let out;
try { out = await B.submit({ ...req, dry: false }); } catch (e) { console.error('Not submitted: ' + e.message); process.exit(1); }
if (!out.batch) { console.log('Nothing submitted.'); process.exit(0); }
console.log(`Submitted ${out.batch}: ${out.n} items, estimated ${usd(out.est)}.`);
if (flag('no-wait') && !B.standalone) { console.log(`The server polls it every minute. Follow it with: node augment-batch.mjs --watch ${out.batch}`); process.exit(0); }
await watch(B, out.batch);
process.exit(0);
