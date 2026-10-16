// Threads (docs/feeds/threads.md): the file's cleaning (server/routes/67-threads.mjs), the
// verifier and the mock of threads.mjs on synthetic sources, the route over a test server,
// and the `thread` agent job (server/jobs.mjs). Nothing here calls a model or the network.
// Run: node --test test/threads-core.test.mjs
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync, readFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { clean, cleanThread } from '../server/routes/67-threads.mjs';
import { verifyThread, mockThread, pageOfText, numbersIn, prefixOf, asAnswer, SCHEMA, writeThreads, mergeInto } from '../threads.mjs';
import * as J from '../server/jobs.mjs';
import { makeRoot, startServer, realCorpus } from './stacks-root.mjs';

const tmp = mkdtempSync(join(tmpdir(), 'stacks-threads-'));
after(() => rmSync(tmp, { recursive: true, force: true }));

const P = (m, t) => ({ m, t, raw: t, kind: 'p' });
const POST = () => {
  const blocks = [
    P('p0', 'We ran 120 trials and found that the measured effect halves once the noise doubles, in every one of the three settings.'),
    P('p1', 'The method is a toy Bayesian model with normal priors and three noise levels, fitted by hand.'),
    P('p2', 'However, the result may not hold for fat-tailed distributions, which we expect are common in practice.'),
    P('p3', 'Readers in a hurry should start with part two, which carries the whole argument and its two charts.'),
    { m: 'img0', kind: 'img', img: 'https://example.org/chart.png', t: '(image) no caption', caption: null },
    P('p4', 'The chart shows the estimate peaking near a result of 2.8 and then falling as results grow larger.'),
  ];
  return { kind: 'post', meta: { id: 'lw:test', t: 'A test post', lane: 'lesswrong' }, blocks, full: blocks.map((b) => b.raw || b.t).join('\n') };
};
const post = (kind, t, quote, extra = {}) => ({ kind, t, approx: false, cite: { loc: '', fig: '', quote, spans: [], ...extra } });

test('clean() keeps well-formed threads only, hook first', () => {
  const ok = { posts: [post('hook', 'A hook.', 'a quote'), post('finding', 'A finding.', 'another quote')], model: 'm' };
  const out = clean({ built: '2026-10-16', version: 'threads-v1', items: {
    'a:1': ok,
    'a:2': { posts: [post('finding', 'No hook first.', 'q')] },
    'a:3': { posts: [{ kind: 'hook', t: 'No quote', cite: {} }] },
    'a:4': { posts: [post('hook', 'Hook.', 'q'), { kind: 'rumour', t: 'x', cite: { quote: 'q' } }], figure: { img: 'javascript:alert(1)', box: [0.5, 0.1, 0.2, 0.9], page: 3 } },
    '': ok,
  } });
  assert.deepEqual(Object.keys(out.items).sort(), ['a:1', 'a:4']);
  assert.equal(out.items['a:4'].posts.length, 1, 'an unknown kind is dropped');
  assert.deepEqual(out.items['a:4'].figure, { page: 3 }, 'a script URL and an inverted box are dropped');
  assert.equal(cleanThread({ posts: [] }), null);
});

test('numbersIn() skips section and page references', () => {
  assert.deepEqual(numbersIn('In §5.3 on p. 19 and pp. 18–21, 52B params, 1,277 letters, −0.39 and 4.5.'), ['52', '1277', '-0.39', '4.5']);
});

test('verifyThread(images: false): a chart reading the writer could not see is checked like any number', () => {
  const D = POST();
  const fig = { ...post('figure', 'img0: the estimate peaks near 3.7, then falls. Values read off the chart.', 'The chart shows the estimate peaking near a result of 2.8', { loc: 'p4', fig: 'img0' }), approx: true };
  const base = [post('hook', 'In 120 trials the effect halves once the noise doubles, in all three settings of a toy model.', 'We ran 120 trials and found that the measured effect halves once the noise doubles', { loc: 'p0' }),
    post('caveat', 'Caveat: it may not hold for fat-tailed distributions, which the authors expect are common.', 'the result may not hold for fat-tailed distributions', { loc: 'p1' }),
    post('read', 'Read it if you are in a hurry: part two carries the argument.', 'Readers in a hurry should start with part two', { loc: 'p3', spans: [['p3', 'p4']] })];
  const seen = verifyThread(D, { posts: [base[0], fig, base[1], base[2]], tags: ['noise'] }, { mode: 'strict' });
  assert.ok(seen.thread.posts.some((p) => p.kind === 'figure'), 'an agent that saw the chart may read values off it');
  const blind = verifyThread(D, { posts: [base[0], fig, base[1], base[2]], tags: ['noise'] }, { mode: 'strict', images: false });
  assert.match(blind.dropped.find((d) => d.kind === 'figure')?.why || '', /number 3.7/);
});

test('verifyThread(strict): drops posts whose quote, number or quoted phrase is not in the source', () => {
  const D = POST();
  const raw = { posts: [
    post('hook', 'In 120 trials the effect halves once the noise doubles, in all three settings of a toy model.', 'We ran 120 trials and found that the measured effect halves once the noise doubles', { loc: 'p0' }),
    post('finding', 'The effect fell by 7 points.', 'found that the measured effect halves', { loc: 'p0' }),
    post('method', 'How: a toy Bayesian model with normal priors, "fitted by machine", not data.', 'The method is a toy Bayesian model with normal priors', { loc: 'p1' }),
    post('figure', 'img0: the estimate peaks near 2.8, then falls. Values read off the chart.', 'The chart shows the estimate peaking near a result of 2.8', { loc: 'p4', fig: 'img0' }),
    post('caveat', 'Caveat: it may not hold for fat-tailed distributions, which the authors expect are common.', 'the result may not hold for fat-tailed distributions', { loc: 'p1' }),
    post('read', 'Read it if you are in a hurry: part two carries the argument.', 'Readers in a hurry should start with part two', { loc: 'p3', spans: [['p3', 'p4']] }),
    post('implication', 'What it changes: nothing at all.', 'this sentence is nowhere in the source document at all', { loc: 'p2' }),
  ], tags: ['Noise', 'noise', 'evidence'] };
  const r = verifyThread(D, raw, { mode: 'strict', keep: { model: 'test-model' } });
  assert.ok(r.thread, r.reasons.join('; '));
  const kinds = r.thread.posts.map((p) => p.kind);
  assert.deepEqual(kinds, ['hook', 'figure', 'caveat', 'read']);
  assert.deepEqual(r.dropped.map((d) => d.kind).sort(), ['finding', 'implication', 'method']);
  assert.match(r.dropped.find((d) => d.kind === 'finding').why, /number 7/);
  assert.match(r.dropped.find((d) => d.kind === 'method').why, /quoted phrase/);
  const cav = r.thread.posts.find((p) => p.kind === 'caveat');
  assert.equal(cav.cite.loc, 'p2', 'a quote found in another block gets its loc corrected');
  assert.ok(r.flags.some((f) => /found in p2, not p1/.test(f)));
  assert.deepEqual(r.thread.figure, { fig: 'img0', img: 'https://example.org/chart.png' });
  assert.deepEqual(r.thread.tags, ['noise', 'evidence']);
  assert.equal(r.thread.model, 'test-model');
  assert.deepEqual(r.thread.checks.quotes, [4, 7]);
  assert.ok(r.thread.posts.every((p) => p.cite.ok && p.cite.match === 'exact'));
});

test('verifyThread: no hook, no thread; quotes mode turns number misses into flags', () => {
  const D = POST();
  const bad = verifyThread(D, { posts: [post('hook', 'A hook.', 'a quote that does not exist anywhere in this document'), post('finding', 'x', 'We ran 120 trials')] });
  assert.equal(bad.thread, null);
  assert.match(bad.reasons.join(' '), /hook was dropped/);
  const raw = { posts: [
    post('hook', 'In 121 trials the effect halved.', 'We ran 120 trials and found that the measured effect halves', { loc: 'p0' }),
    post('caveat', 'Caveat: fat tails.', 'the result may not hold for fat-tailed distributions', { loc: 'p2' }),
  ] };
  const q = verifyThread(D, raw, { mode: 'quotes' });
  assert.ok(q.thread);
  assert.equal(q.thread.posts.length, 2);
  assert.ok(q.flags.some((f) => /number 121/.test(f)));
  assert.equal(verifyThread(D, raw, { mode: 'strict' }).thread, null, 'strict mode needs four posts');
});

test('pageOfText() finds the page a quote starts on, across a page break', () => {
  const D = { pages: ['An introduction about nothing in particular.', 'Here the quoted sentence starts and it runs over the', '7 Running head of the paper. page break into the next page, where it ends.'] };
  assert.equal(pageOfText(D, 'Here the quoted sentence starts'), 1);
  assert.equal(pageOfText(D, 'the quoted sentence starts and it runs over the page break into the next page'), 1);
  assert.equal(pageOfText(D, 'into the next page, where it ends'), 2);
  assert.equal(pageOfText(D, 'not on any page of this document whatsoever'), null);
});

test('mockThread() passes the verifier on a scan and a PDF', () => {
  const pages = ['Preface. This book was written over many years by its author, who thanks his readers.', 'Chapter one explains the method we use, a careful count of letters in 200 messages.', 'However, the method only works on simple ciphers and fails on short messages.', 'The conclusion repeats the main point that counting letters reveals the class of a cipher.'];
  const scan = { kind: 'scan', meta: { t: 'A scan' }, n: 4, labels: [], blocks: pages.map((t, k) => ({ m: `k${k}`, t, kind: 'page', page: k })), full: pages.join('\n') };
  const r = verifyThread(scan, mockThread(scan), { mode: 'strict', keep: { model: 'mock' } });
  assert.ok(r.thread, r.reasons.join('; '));
  assert.ok(r.thread.posts.every((p) => Number.isInteger(p.cite.page)));
  const pdf = { ...scan, kind: 'pdf', pages, blocks: pages.map((t, k) => ({ m: `p. ${k + 1}`, t, kind: 'page', page: k })) };
  const r2 = verifyThread(pdf, mockThread(pdf), { mode: 'strict' });
  assert.ok(r2.thread, r2.reasons.join('; '));
  assert.equal(r2.thread.basis, 'fulltext');
});

test('the prompt prefix carries three exemplars in the answer schema, and the shipped file is clean', () => {
  const data = JSON.parse(readFileSync(new URL('../data/threads.json', import.meta.url), 'utf-8'));
  const c = clean(data);
  assert.equal(Object.keys(c.items).length, Object.keys(data.items).length, 'every shipped thread survives clean()');
  for (const [id, th] of Object.entries(c.items)) {
    assert.equal(th.posts[0].kind, 'hook', id);
    assert.ok(th.posts.length >= 4 && th.posts.length <= 7, id);
    assert.ok(th.posts.every((p) => p.cite.ok === true), `${id}: every quote re-checked`);
  }
  const pre = prefixOf(data);
  assert.equal((pre.match(/<example /g) || []).length, 3);
  const ans = asAnswer('ia:manualforsolutio00hittrich', data.items['ia:manualforsolutio00hittrich']);
  assert.ok(ans.posts.every((p) => Object.keys(p).join() === 'kind,t,approx,cite' && Object.keys(p.cite).join() === 'loc,fig,quote,spans'));
  assert.match(ans.posts[0].cite.loc, /^k\d+$/);
  assert.deepEqual(Object.keys(SCHEMA.properties), ['posts', 'tags']);
});

test('mergeInto() keeps other writers\' items and writes one item per line', () => {
  const f = join(tmp, 'threads.json');
  const th = (h) => ({ posts: [{ kind: 'hook', t: h, cite: { quote: 'q', ok: true } }], model: 'm' });
  writeThreads(f, { built: 'x', version: 'threads-v1', items: { 'b:2': th('two') } });
  mergeInto(f, { 'a:1': th('one') }, new Map([['a:1', 0], ['b:2', 1]]));
  const text = readFileSync(f, 'utf-8');
  const d = JSON.parse(text);
  assert.deepEqual(Object.keys(d.items), ['a:1', 'b:2']);
  assert.equal(text.split('\n').filter((l) => /^ {2}"[ab]:\d"/.test(l)).length, 2);
});

test('GET /threads.json: 404 without a file, then the file, by lane and by ids', async () => {
  const items = realCorpus().items;
  const a = items.find((it) => it.lane === 'forecasting'), b = items.find((it) => it.lane === 'llm');
  const f = join(tmp, 'served.json');
  const root = makeRoot({ data: false, prefix: 'stacks-threads-root-' });
  const srv = await startServer(root, { STACKS_THREADS: f });
  try {
    assert.equal((await fetch(srv.base + '/threads.json')).status, 404);
    const th = { posts: [{ kind: 'hook', t: 'A hook.', cite: { quote: 'q', ok: true } }, { kind: 'caveat', t: 'Caveat: x.', cite: { quote: 'r', ok: true } }], model: 'm' };
    writeFileSync(f, JSON.stringify({ built: '2026-10-16', version: 'threads-v1', items: { [b.id]: th, [a.id]: th, 'web:not-in-corpus': th } }));
    await new Promise((r) => setTimeout(r, 1100)); // the route looks at the file at most once a second
    const all = await (await fetch(srv.base + '/threads.json')).json();
    assert.equal(all.n, 3);
    assert.deepEqual(Object.keys(all.items).slice(-1), ['web:not-in-corpus'], 'items outside the corpus come last');
    assert.equal(all.lanes.forecasting, 1);
    const lane = await (await fetch(srv.base + '/threads.json?lane=llm')).json();
    assert.deepEqual(Object.keys(lane.items), [b.id]);
    const ids = await (await fetch(srv.base + '/threads.json?ids=' + encodeURIComponent(a.id) + ',nope')).json();
    assert.deepEqual(Object.keys(ids.items), [a.id]);
    const r1 = await fetch(srv.base + '/threads.json?lane=llm');
    const r2 = await fetch(srv.base + '/threads.json?lane=llm', { headers: { 'If-None-Match': r1.headers.get('etag') } });
    assert.equal(r2.status, 304);
    const st = await (await fetch(srv.base + '/status')).json();
    assert.equal(st.threads, 3);
  } finally { await srv.stop(); rmSync(root, { recursive: true, force: true }); }
});

test('the thread job: written when data/threads.json exists, checked against it', async () => {
  const items = realCorpus().items.slice(0, 400);
  const cands = J.candidates({ items, lanes: { llm: 'LLM papers' }, threads: { items: { [items[0].id]: {} } } });
  const tj = cands.filter((c) => c.type === 'thread');
  assert.ok(tj.length >= 1);
  assert.ok(tj.every((c) => !c.inputs.some((x) => x.id === items[0].id)), 'items with a thread are left out');
  assert.equal(J.candidates({ items, lanes: {} }).filter((c) => c.type === 'thread').length, 0, 'no file, no thread job');
  const root = makeRoot({ data: true, prefix: 'stacks-threadjob-' });
  const dir = mkdtempSync(join(tmpdir(), 'stacks-threadjobs-'));
  try {
    J.ensureDirs(dir);
    const ins = items.slice(1, 3).map((it) => ({ id: it.id, t: it.t }));
    const job = J.finish({ id: 'thread-0001', type: 'thread', title: 'Write threads for 2 items', priority: 'low', status: 'open', created: '2026-10-16', key: 'thread:test', target: { lane: 'x', laneName: 'X', label: 'X' }, inputs: ins, wants: { all: true, count: 2 }, gen: 1 });
    assert.match(job.body, /node threads\.mjs verify --ids/);
    writeFileSync(join(dir, 'open', 'thread-0001.md'), J.formatJob(job));
    const verified = (ok = true) => ({ posts: ['hook', 'finding', 'caveat', 'read'].map((kind) => ({ kind, t: kind, cite: { quote: 'q', ok } })), model: 'm', checks: { at: '2026-10-16', quotes: [4, 4] } });
    writeFileSync(join(root, 'data', 'threads.json'), JSON.stringify({ items: { [ins[0].id]: verified(), [ins[1].id]: verified(false) } }));
    const r1 = await J.checkJob('thread-0001', { root, dir });
    assert.ok(!r1.ok && r1.lines.some((l) => !l.ok && /quote was not found/.test(l.text)), JSON.stringify(r1.lines));
    writeFileSync(join(root, 'data', 'threads.json'), JSON.stringify({ items: { [ins[0].id]: verified(), [ins[1].id]: verified() } }));
    const r2 = await J.checkJob('thread-0001', { root, dir });
    assert.ok(r2.ok, r2.lines.filter((l) => !l.ok).map((l) => l.text).join('\n'));
    assert.deepEqual(r2.files, ['data/threads.json']);
  } finally { rmSync(root, { recursive: true, force: true }); rmSync(dir, { recursive: true, force: true }); }
});
