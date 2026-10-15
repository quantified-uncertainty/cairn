// HTTP tests for the reading-guide routes (server/routes/91-augment.mjs) against a
// real server in mock mode (STACKS_MOCK_AI=1), with a fresh temporary cache.
// No network and no API key needed: text comes from the request, or from a
// cached file written here. Run: node --test test/*.test.mjs
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync } from 'fs';
import { createHash } from 'crypto';
import { tmpdir } from 'os';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const HERE = join(dirname(fileURLToPath(import.meta.url)), '..');
const CACHE = mkdtempSync(join(tmpdir(), 'stacks-aug-api-'));
const PORT = 20000 + Math.floor(Math.random() * 20000);
const B = `http://127.0.0.1:${PORT}`;
const items = JSON.parse(readFileSync(join(HERE, 'corpus.json'), 'utf-8')).items;
const PDF = items.find((it) => it.kind === 'pdf');
const POST = items.find((it) => it.kind === 'text') || items.find((it) => it.kind === 'web');
process.env.STACKS_CACHE = CACHE; // this process imports server code too
const { validateAugment } = await import('../server/augment.mjs');

// A 12-page document with real sentences, as the client would send it.
const TEXT = Array.from({ length: 12 }, (_, k) => `[p. ${k + 1}] ` + [
  `Section ${k + 1} explains how the method behaves when the budget is changed by a factor of ${k + 2}.`,
  `The results on page ${k + 1} show that the error falls steadily as more data is used in training.`,
  `A careful reader should note that the comparison on this page uses the same random seeds for every run.`,
  `We find that Gradient Descent with Momentum converges faster than plain Gradient Descent in this setting.`,
].join(' ')).join('\n');

let server;
before(async () => {
  // A cached copy of a plain-text book, so a batch can find text without the network.
  if (POST) {
    const k = createHash('sha1').update(POST.url).digest('hex');
    const d = join(CACHE, k.slice(0, 2)); mkdirSync(d, { recursive: true });
    const body = Array.from({ length: 40 }, (_, j) => `Chapter ${j + 1}\n\nThe Engine of the Mill turns ${j + 2} times an hour when the River is high, as the Miller explained to his Apprentice.\n\nThis paragraph is long enough to count as a sentence for the mock reading guide to quote from.`).join('\n\n');
    writeFileSync(join(d, k), body);
    writeFileSync(join(d, k + '.json'), JSON.stringify({ url: POST.url, type: 'text/plain', size: body.length, at: Date.now() }));
  }
  server = spawn(process.execPath, ['server.mjs', '--port', String(PORT)], {
    cwd: HERE, stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, STACKS_CACHE: CACHE, STACKS_MOCK_AI: '1', STACKS_MOCK_DELAY: '1', STACKS_WARM_MB: '0', STACKS_CACHE_MAX: '200000000', ANTHROPIC_API_KEY: '' },
  });
  for (let j = 0; j < 100; j++) { try { if ((await fetch(B + '/status')).ok) return; } catch { /* starting */ } await new Promise((r) => setTimeout(r, 100)); }
  throw new Error('server did not start');
});
after(() => { server?.kill(); rmSync(CACHE, { recursive: true, force: true }); });

const get = (p) => fetch(B + p);
const post = (p, b) => fetch(B + p, { method: 'POST', body: JSON.stringify(b) });
const lines = async (r) => (await r.text()).trim().split('\n').map((l) => JSON.parse(l));
const body = { id: PDF.id, title: PDF.t, kind: 'pdf', laneId: PDF.lane, text: TEXT, n: 12 };

test('unknown ids are 400; no guide yet is null', async () => {
  assert.equal((await get('/augment?id=nope')).status, 400);
  assert.equal((await post('/augment', { id: 'nope' })).status, 400);
  const r = await get('/augment?id=' + encodeURIComponent(PDF.id));
  assert.equal(r.status, 200);
  assert.equal(await r.json(), null);
  assert.equal((await get('/augment/stream?id=' + encodeURIComponent(PDF.id))).status, 404);
});

test('POST /augment streams partials, then a checked final that is cached', async () => {
  const msgs = await lines(await post('/augment', body));
  const fin = msgs.at(-1);
  assert.equal(fin.type, 'final', JSON.stringify(fin).slice(0, 300));
  assert.ok(msgs.filter((m) => m.type === 'partial').length >= 2, 'streams partials');
  assert.ok(msgs.filter((m) => m.type === 'partial').every((m) => m.aug.partial && m.aug.notes.length === 0), 'partials carry no notes');
  const a = fin.aug;
  assert.deepEqual(validateAugment(a), { ok: true, errors: [] });
  assert.match(a.model, /\(mock\)/);
  assert.equal(a.textSrc, 'client');
  assert.equal(a.dropped.notes, 1, 'mock mode alters one quote, which must be dropped');
  assert.ok(a.plan.length >= 4 && a.notes.length >= 2);
  assert.ok(fin.spend.calls >= 1);
  const again = await (await get('/augment?id=' + encodeURIComponent(PDF.id))).json();
  assert.equal(again.at, a.at);
  assert.equal(again.stale, false);
  const st = await lines(await get('/augment/stream?id=' + encodeURIComponent(PDF.id)));
  assert.equal(st.length, 1); assert.equal(st[0].aug.at, a.at);
  const cached = await lines(await post('/augment', body));
  assert.equal(cached.at(-1).aug.at, a.at, 'a second request is answered from the cache');
});

test('two requests for one item share one job', async () => {
  const [x, y] = await Promise.all([post('/augment', { ...body, force: true }), post('/augment', { ...body, force: true })]);
  const [fx, fy] = [(await lines(x)).at(-1), (await lines(y)).at(-1)];
  assert.equal(fx.type, 'final'); assert.equal(fy.type, 'final');
  assert.equal(fx.aug.at, fy.aug.at);
});

test('GET /augment says when a guide is being written', async () => {
  const r = post('/augment', { ...body, force: true });
  await new Promise((res) => setTimeout(res, 60));
  const g = await get('/augment?id=' + encodeURIComponent(PDF.id) + '&model=claude-sonnet-5-5');
  assert.equal(await g.json(), null, 'another model has no guide');
  const h = await get('/augment?id=' + encodeURIComponent(PDF.id));
  assert.ok(h.headers.get('x-augment-running') === '1' || (await h.json()) !== null);
  await (await r).text();
});

test('no text is a clear error, and the budget is checked before any call', async () => {
  const other = items.find((it) => it.kind === 'pdf' && it.id !== PDF.id);
  const e = (await lines(await post('/augment', { id: other.id }))).at(-1);
  assert.equal(e.type, 'error'); assert.equal(e.code, 'no_text');
  const calls = (await (await get('/status')).json()).spend.calls;
  await post('/settings/budget', { usd: 0 });
  try {
    const b = (await lines(await post('/augment', { ...body, force: true }))).at(-1);
    assert.equal(b.code, 'budget');
    assert.equal((await (await get('/status')).json()).spend.calls, calls, 'the model was not called');
    const bb = await post('/augment/batch', { ids: [POST?.id || PDF.id], maxUsd: 1 });
    assert.ok([200, 402].includes(bb.status));
  } finally { await post('/settings/budget', { usd: null }); }
});

test('batches: a dry run estimates, a mock batch writes guides at the batch price', { skip: !POST && 'no plain-text item in the corpus' }, async () => {
  const dry = await (await post('/augment/batch', { ids: [POST.id, PDF.id, 'nope'], dry: true })).json();
  assert.equal(dry.batch, null);
  assert.equal(dry.n, 1, JSON.stringify(dry));
  assert.ok(dry.est > 0 && dry.est < 0.01, String(dry.est));
  assert.deepEqual(dry.skipped.map((s) => s.why).sort(), ['current', 'unknown id']);
  const capped = await (await post('/augment/batch', { ids: [POST.id], dry: true, maxUsd: 0 })).json();
  assert.equal(capped.n, 0); assert.equal(capped.skipped[0].why, 'over max-usd');
  const sub = await (await post('/augment/batch', { ids: [POST.id] })).json();
  assert.match(sub.batch, /^mock_/);
  const info = await (await get('/augment/batch?id=' + sub.batch)).json();
  assert.equal(info.status, 'ended'); assert.equal(info.counts.succeeded, 1); assert.ok(info.cost > 0);
  const a = await (await get('/augment?id=' + encodeURIComponent(POST.id))).json();
  assert.equal(a.batch, true); assert.equal(a.textSrc, 'html-approx');
  assert.ok(validateAugment(a).ok, validateAugment(a).errors.join());
  const all = await (await get('/augment/batches')).json();
  assert.ok(all.some((b) => b.id === sub.batch));
  const st = (await (await get('/status')).json()).augment;
  assert.ok(st.cached >= 2 && st.mockAI === true && st.batches.active === 0, JSON.stringify(st));
});

test('forget removes a guide', async () => {
  const f = await (await post('/augment/forget', { id: PDF.id })).json();
  assert.equal(f.removed, true);
  assert.equal(await (await get('/augment?id=' + encodeURIComponent(PDF.id))).json(), null);
});
