// Agent jobs: the file format, ids, the generator's rules, caps, dedupe, cool-downs,
// rewrites, ordering and the privacy lint (server/jobs.mjs; docs/learning/spec.md §7).
// Run: node --test test/jobs-core.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync, readFileSync, readdirSync, mkdirSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import * as J from '../server/jobs.mjs';
import * as L from '../server/learn.mjs';
import { readOps, quickOps, recordsOf } from './learn-ops.mjs';

const NOW = Date.parse('2026-10-15T12:00:00Z'), DAY = 864e5, at = NOW - DAY;
const tmp = () => mkdtempSync(join(tmpdir(), 'stacks-jobs-'));

// A synthetic library: two lanes with topic folders, authors, a scan lane.
const ITEMS = [];
const topics = [['reasoning', 'Reasoning'], ['oversight', 'Oversight & debate'], ['markets', 'Prediction markets']];
for (let k = 0; k < 60; k++) {
  const [tag, folder] = topics[k % 3];
  const lane = k % 3 === 2 ? 'forecasting' : 'llm';
  ITEMS.push({ id: `arxiv:2601.${String(10000 + k)}`, kind: 'pdf', t: `Paper ${k} about ${tag} methods`, a: k % 6 === 0 ? 'Rohin Shah, A. N. Other' : `Writer${k} Person${k}`, y: 2020 + (k % 6), lane, path: [folder], tags: [tag], url: `https://arxiv.org/pdf/2601.${10000 + k}`, page: `https://arxiv.org/abs/2601.${10000 + k}`, q: (k % 10) / 10 });
}
for (let k = 0; k < 8; k++) ITEMS.push({ id: `ia:oldbook${k}`, kind: 'scan', t: `An old book ${k}`, a: k < 3 ? '' : 'Some Author', lane: 'oddities', path: ['Mathematical recreations'], ia: `oldbook${k}`, n: 100, page: `https://archive.org/details/oldbook${k}`, ...(k < 5 ? {} : { y: 1900 }) });
const LANES = { llm: 'LLM papers', forecasting: 'Forecasting', oddities: 'Old technical oddities' };
const INDEX = L.buildIndex(ITEMS, { lanes: LANES });

function session() {
  const ops = [];
  // Deep reads in Reasoning (several by Rohin Shah) and in markets; glances and skips on oversight.
  for (const k of [0, 3, 6, 9, 12, 18, 24, 30]) ops.push(...readOps(ITEMS[k].id, { mins: 15, frac: 0.9, at, it: ITEMS[k], n: 12, judge: k === 0 ? ['save'] : [] }));
  for (const k of [2, 5, 8, 11]) ops.push(...readOps(ITEMS[k].id, { mins: 12, frac: 0.8, at, it: ITEMS[k], n: 12 }));
  for (const k of [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34, 37, 40, 43]) ops.push(...readOps(ITEMS[k].id, { mins: 1 / 3, frac: 0.15, at, it: ITEMS[k], n: 12 }));
  for (const k of [46, 49, 52, 55, 58]) ops.push(...quickOps(ITEMS[k].id, { secs: 3, at, it: ITEMS[k] }));
  return ops;
}
const profileOf = (ops, controls = {}) => L.computeProfile({ items: ITEMS, index: INDEX, memory: recordsOf(ops), now: NOW, controls });
const ctxOf = (P, extra = {}) => ({ profile: P, index: INDEX, items: ITEMS, lanes: LANES, rescue: { docs: {}, imgs: {} }, errors: { items: {} }, tags: null, overrides: { items: {} }, mediaFixes: { images: {} }, ...extra });

test('parseJob and formatJob round-trip; malformed lines are reported', () => {
  const job = J.finish({ id: 'discover-0007', type: 'discover', title: 'Find 10 open works on LLM papers › Reasoning', priority: 'high', status: 'open', created: '2026-10-15', key: 'discover:path:llm/Reasoning',
    target: { feature: 'path:llm/Reasoning', label: 'LLM papers › Reasoning', lane: 'llm' }, inputs: [{ id: 'arxiv:2501.19393', t: 's1: Simple test-time scaling' }], wants: { count: 10, min: 6, max: 15 }, gen: 1 });
  const text = J.formatJob(job);
  assert.match(text, /^---\nid: "discover-0007"\ntype: "discover"\n/);
  const back = J.parseJob(text);
  assert.deepEqual(back.errors, []);
  assert.deepEqual(back.job, { ...job, body: job.body.replace(/\s*$/, '\n') });
  assert.equal(J.formatJob(back.job), text, 'stable');
  const bad = J.parseJob('---\nid: discover-0001\ntype: "discover"\ntitle "x"\nwhat: {\n---\nbody');
  assert.ok(bad.errors.some((e) => /line 2 \(id\): the value is not JSON/.test(e)), bad.errors.join('\n'));
  assert.ok(bad.errors.some((e) => /line 4: expected "key: <JSON value>"/.test(e)));
  assert.ok(bad.errors.some((e) => /line 5 \(what\)/.test(e)));
  assert.ok(bad.errors.some((e) => /missing priority/.test(e)));
  assert.equal(J.parseJob('no frontmatter').job, null);
});

test('nextId counts open/ and done/', () => {
  const root = tmp();
  try {
    const d = J.ensureDirs(root);
    assert.equal(J.nextId('discover', root), 'discover-0001');
    writeFileSync(join(d.open, 'discover-0002.md'), 'x');
    writeFileSync(join(d.done, 'discover-0009.md'), 'x');
    writeFileSync(join(d.done, 'fix-item-0004.md'), 'x');
    assert.equal(J.nextId('discover', root), 'discover-0010');
    assert.equal(J.nextId('fix-item', root), 'fix-item-0005');
    assert.equal(J.nextId('flag', root), 'flag-0001');
    // A clash (another writer took the id) moves on to the next one.
    const w = J.writeNew(root, 'flag', (id) => ({ id, type: 'flag', title: 't', priority: 'high', status: 'open', created: '2026-10-15', key: 'flag:x:' + id, body: '' }));
    assert.equal(w.id, 'flag-0001');
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('no reading-based jobs below 10 exposures; boosts still count', () => {
  const few = profileOf(session().slice(0, 30));
  assert.ok(few.exposures < 10);
  const c = J.candidates(ctxOf(few, { now: NOW }));
  assert.ok(!c.some((x) => ['discover', 'follow-author', 'grow-lane'].includes(x.type)), c.map((x) => x.key).join(', '));
  const boosted = profileOf(session().slice(0, 30), { 'tag:markets': 'boost' });
  const b = J.candidates(ctxOf(boosted, { now: NOW }));
  const d = b.find((x) => x.key === 'discover:tag:markets');
  assert.ok(d, 'a boosted tag gets a discover job');
  assert.equal(d.priority, 'high');
  assert.equal(d.inputs.length, 3, 'filled from the corpus, best q first');
  assert.ok(d.inputs.filter((x) => x.ex).length >= 1, 'library examples are marked');
  const body = J.finish({ id: 'discover-0001', type: 'discover', title: d.title, target: d.target, inputs: d.inputs, wants: d.wants }).body;
  assert.match(body, /## Examples already in the library\n/);
});

test('discover seeds: a read topic with two seeds is not padded with unread items', () => {
  // Two deep reads (one saved) in Reasoning, plus quick exits elsewhere to pass the 10-exposure gate.
  const ops = [...readOps(ITEMS[0].id, { mins: 18, frac: 0.9, at, it: ITEMS[0], n: 12, judge: ['save'] }), ...readOps(ITEMS[3].id, { mins: 18, frac: 0.9, at, it: ITEMS[3], n: 12, judge: ['save'] })];
  for (const k of [46, 49, 52, 55, 58, 61, 62, 63, 64, 65]) ops.push(...quickOps(ITEMS[k].id, { secs: 3, at, it: ITEMS[k] }));
  const P = profileOf(ops);
  assert.ok(P.exposures >= 10);
  const d = J.candidates(ctxOf(P, { now: NOW })).find((x) => x.type === 'discover');
  assert.ok(d, 'a discover job for the read topic');
  assert.deepEqual(d.inputs.map((x) => x.id).sort(), [ITEMS[0].id, ITEMS[3].id].sort(), 'only the two seeds');
  assert.ok(!d.inputs.some((x) => x.ex));
});

test('the generator: each type under its rule, ordered, capped, deduped, cooled down, rewritten only when untouched', () => {
  const P = profileOf(session());
  assert.ok(P.exposures >= 10);
  const root = tmp();
  try {
    const rescue = { docs: { [ITEMS[30].url]: { st: 'bad', why: 'HTTP 404' } }, imgs: { 'https://i.example.org/a.png': { st: 'bad', ctx: { item: ITEMS[40].id, page: 3, alt: 'a chart' } }, 'https://i.example.org/big.png': { st: 'big', ctx: { item: ITEMS[40].id } } } };
    const errors = { items: { [ITEMS[33].id]: { n: 2, days: ['2026-10-13', '2026-10-14'], status: null, msg: 'Failed to fetch', last: at }, [ITEMS[36].id]: { n: 1, days: ['2026-10-14'], status: null, msg: 'once', last: at } } };
    const tags = { tags: [{ id: 'reasoning', label: 'Reasoning', kind: 'topic', desc: 'x', items: ITEMS.filter((it) => (it.tags || [])[0] === 'reasoning').map((it) => it.id) }] };
    const ctx = ctxOf(P, { rescue, errors, tags });
    const cands = J.candidates({ ...ctx, now: NOW });
    const types = new Set(cands.map((c) => c.type));
    for (const t of ['discover', 'follow-author', 'grow-lane', 'fix-item', 'media', 'tag', 'metadata']) assert.ok(types.has(t), `no ${t} candidate: ${[...types]}`);
    const fix = cands.find((c) => c.type === 'fix-item');
    assert.deepEqual(fix.inputs.map((x) => x.id).sort(), [ITEMS[30].id, ITEMS[33].id].sort(), 'a bad doc and an error seen on two days; not a one-off');
    assert.equal(cands.find((c) => c.type === 'media').inputs.length, 1, 'too-big images are not broken');
    // tag:reasoning and its folder have the same seeds: one discover job, not two (the 80% overlap rule).
    assert.equal(cands.filter((c) => c.type === 'discover' && /reasoning/i.test(c.key)).length, 1, cands.map((c) => c.key).join(', '));
    assert.ok(cands.find((c) => c.key === 'follow-author:shah'));
    assert.equal(cands.find((c) => c.type === 'metadata').inputs.length, 5);
    // Order: priority, then the type order.
    const pr = (p) => J.PRIORITIES.indexOf(p);
    for (let k = 1; k < cands.length; k++) assert.ok(pr(cands[k - 1].priority) < pr(cands[k].priority) || (cands[k - 1].priority === cands[k].priority && J.TYPES.indexOf(cands[k - 1].type) <= J.TYPES.indexOf(cands[k].type)));

    const state = { written: {} };
    const r1 = J.refresh(root, ctx, state, { now: NOW });
    assert.ok(r1.created.length >= 7, JSON.stringify(r1));
    const files = readdirSync(join(root, 'open'));
    assert.equal(files.length, r1.created.length);
    // Every generated job parses and passes the privacy lint.
    for (const f of files) {
      const text = readFileSync(join(root, 'open', f), 'utf-8');
      const { job, errors: e } = J.parseJob(text);
      assert.deepEqual(e, [], f);
      assert.deepEqual(J.lintJob(job, text), [], f);
      assert.equal(job.status, 'open'); assert.equal(job.created, L.localDay(NOW));
      assert.ok(job.body.includes(`node jobs.mjs done ${job.id}`), f);
    }
    // Dedupe: a second refresh creates nothing; open keys are skipped.
    const r2 = J.refresh(root, ctx, state, { now: NOW });
    assert.deepEqual(r2.created, []);
    assert.ok(r2.skipped.every((s) => /open job has this key/.test(s.why)), JSON.stringify(r2.skipped));
    // An untouched maintenance job takes new inputs; a touched one does not.
    const tagJob = r1.created.find((id) => id.startsWith('tag-'));
    const metaJob = r1.created.find((id) => id.startsWith('metadata-'));
    const touched = join(root, 'open', metaJob + '.md');
    writeFileSync(touched, readFileSync(touched, 'utf-8') + '\nAn agent note.\n');
    const more = { ...ctx, rescue: { ...rescue, docs: { ...rescue.docs, [ITEMS[31].url]: { st: 'bad', why: 'HTTP 410' } } }, items: [...ITEMS, { id: 'ia:oldbook9', kind: 'scan', t: 'Another old book', a: '', lane: 'oddities', path: ['Mathematical recreations'], ia: 'oldbook9', n: 50, page: 'https://archive.org/details/oldbook9', y: 1890 }] };
    const r3 = J.refresh(root, more, state, { now: NOW });
    const fixId = r1.created.find((id) => id.startsWith('fix-item-'));
    assert.ok(r3.updated.includes(fixId), JSON.stringify(r3));
    assert.ok(!r3.updated.includes(metaJob), 'a touched job is never rewritten');
    assert.equal(J.parseJob(readFileSync(join(root, 'open', fixId + '.md'), 'utf-8')).job.inputs.length, 3);
    assert.ok(tagJob);
    // Cool-down: close the discover job; within 14 days its key is skipped.
    const disc = r1.created.find((id) => id.startsWith('discover-') && /reasoning/i.test(readFileSync(join(root, 'open', id + '.md'), 'utf-8').split('\n').find((l) => l.startsWith('key:'))));
    const dj = J.parseJob(readFileSync(join(root, 'open', disc + '.md'), 'utf-8')).job;
    J.dismissJob(root, disc, NOW);
    const r4 = J.refresh(root, ctx, state, { now: NOW + 3 * DAY });
    assert.ok(r4.skipped.some((s) => s.key === dj.key && /cool-down/.test(s.why)), JSON.stringify(r4.skipped));
    // After the cool-down, the same seeds do not make a new job; a new seed does.
    const r5 = J.refresh(root, ctx, state, { now: NOW + 20 * DAY });
    assert.ok(r5.skipped.some((s) => s.key === dj.key && /no seed beyond/.test(s.why)), JSON.stringify(r5.skipped));
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('caps: 30 open jobs in all, and per type', () => {
  const P = profileOf(session(), Object.fromEntries(['reasoning', 'oversight', 'markets'].map((t) => ['tag:' + t, 'boost'])));
  const root = tmp();
  try {
    const r = J.refresh(root, ctxOf(P), { written: {} }, { now: NOW, caps: { ...J.CAPS, total: 3 } });
    assert.equal(r.created.length, 3);
    assert.ok(r.skipped.some((s) => /3 open jobs \(the cap\)/.test(s.why)));
    const root2 = tmp();
    const r2 = J.refresh(root2, ctxOf(P), { written: {} }, { now: NOW, caps: { ...J.CAPS, discover: 1 } });
    assert.equal(r2.created.filter((id) => id.startsWith('discover-')).length, 1);
    assert.ok(r2.skipped.some((s) => /1 open discover jobs/.test(s.why)));
    rmSync(root2, { recursive: true, force: true });
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('the privacy lint catches reading history and ignores public titles', () => {
  assert.equal(J.privacyLint('Find 10 open works on reasoning.').length, 0);
  for (const s of ['you read 3 deeply', 'You skimmed it', 'spent 12 min on it', 'after 3 visits', '40 pages seen', 'your interests', 'λ = 1.2', 'engagement was high', 'reading history', 'dwell time', 'read 3 deeply']) assert.ok(J.privacyLint(s).length, s);
  // A public title that looks like history is masked first.
  assert.equal(J.privacyLint('- A History of Probability (ia:x)', ['A History of Probability']).length, 0);
  assert.equal(J.privacyLint('see https://example.org/your-history-page').length, 0, 'URLs are masked');
  const job = J.finish({ id: 'discover-0001', type: 'discover', title: 'Find 6 open works on Your Interests', priority: 'low', status: 'open', created: '2026-10-15', key: 'discover:tag:x', target: { feature: 'tag:x', label: 'Your Interests', lane: 'llm' }, inputs: [{ id: 'arxiv:1', t: 'Attention Is All You Need' }], wants: { count: 6, min: 3, max: 10 } });
  assert.deepEqual(J.lintJob(job), [], 'labels and seed titles are public');
  job.body += '\nyou read 3 deeply\n';
  assert.ok(J.lintJob(job).length);
});

test('media fixes reach manualCopy once per copy', async () => {
  const calls = [];
  const stub = async (u, from) => { calls.push([u, from]); return { st: 'rescued' }; };
  const fixes = { v: 1, images: { 'https://a/x.png': { from: 'https://web.archive.org/web/2020id_/https://a/x.png', job: 'media-0001' }, 'https://a/y.png': { from: null, gone: true, why: 'no copy' } } };
  const applied = {};
  assert.deepEqual(await J.applyMediaFixes(fixes, applied, stub), [{ url: 'https://a/x.png', st: 'rescued' }]);
  assert.equal(calls.length, 1);
  assert.deepEqual(await J.applyMediaFixes(fixes, applied, stub), [], 'already applied');
  fixes.images['https://a/x.png'].from = 'https://other.example/x.png';
  await J.applyMediaFixes(fixes, applied, stub);
  assert.equal(calls.length, 2, 'a changed copy is applied again');
});

test('reader flags: the note is the reader\'s and is not linted; the rest is', () => {
  const root = tmp();
  try {
    const w = J.makeFlag(root, { item: ITEMS[0], page: 7, kind: 'garbled', note: 'You can see figure 3 is a black box', view: { zoom: false, per: 2, crop: true, flow: false, theme: 'reading' }, asset: '{id}.webp' }, NOW);
    assert.equal(w.id, 'flag-0001');
    assert.deepEqual(J.lintJob(w.job, w.text), []);
    assert.equal(w.job.target.asset, 'flag-0001.webp');
    assert.match(w.job.title, /^Reader flag: Pages missing or garbled on p\. 7 of Paper 0/);
    assert.match(w.text, /> You can see figure 3 is a black box/);
    assert.equal(w.job.key, `flag:${ITEMS[0].id}:flag-0001`);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('prompts', () => {
  assert.equal(J.allPrompt('apps/open-stacks/browser'), 'In the cairn repo, open apps/open-stacks/browser/jobs/README.md and do the open jobs in apps/open-stacks/browser/jobs/open/, highest priority first (node jobs.mjs next). For each job: follow the playbook, run node jobs.mjs check <id> --live, then node jobs.mjs done <id>, and commit with the command it prints (one commit per job). Stop after 5 jobs or 60 minutes and summarise what you did.');
  assert.equal(J.jobPrompt('discover-0007', 'apps/open-stacks/browser'), 'In the cairn repo, do job discover-0007 (apps/open-stacks/browser/jobs/open/discover-0007.md) following apps/open-stacks/browser/jobs/README.md: check it with node jobs.mjs check discover-0007 --live, close it with node jobs.mjs done discover-0007, and commit with the command it prints.');
  const d = tmp(); mkdirSync(join(d, '.git')); mkdirSync(join(d, 'apps', 'x'), { recursive: true });
  assert.equal(J.repoPathOf(join(d, 'apps', 'x')), 'apps/x');
  rmSync(d, { recursive: true, force: true });
});
