// The jobs routes (server/routes/96-jobs.mjs; docs/learning/spec.md §5.2, §7.3-7.5),
// against a real server on a temp cache, a temp jobs folder (STACKS_JOBS_DIR) and a
// temp copy of the app. The rescue module is wrapped so the test can see what reaches
// manualCopy and makes no canary requests.
// Run: node --test test/jobs-api.test.mjs
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { rmSync, existsSync, readFileSync, writeFileSync, renameSync, readdirSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { makeRoot, startServer, until, realCorpus } from './stacks-root.mjs';
import { readOps, quickOps } from './learn-ops.mjs';
import * as J from '../server/jobs.mjs';

const DAY = 864e5;
const C = realCorpus();
const TTRPG = C.items.filter((x) => x.lane === 'ttrpg').slice(0, 6);
const BROKEN = C.items.find((x) => x.lane === 'oddities');
const GONE = C.items.find((x) => x.lane === 'cybernetics');
const IMG = 'https://i.example.org/removed-chart.png';
let root, dir, srv, stubLog;

before(async () => {
  root = makeRoot({ corpus: C, data: true, prefix: 'stacks-jobs-api-' });
  dir = mkdtempSync(join(tmpdir(), 'stacks-jobsdir-'));
  stubLog = join(root, 'manual-copy.log');
  // Wrap the rescue module: everything as before, except manualCopy (recorded) and the canaries (off).
  renameSync(join(root, 'server', 'rescue.mjs'), join(root, 'server', 'rescue-real.mjs'));
  writeFileSync(join(root, 'server', 'rescue.mjs'), `export * from './rescue-real.mjs';
import { appendFileSync } from 'fs';
export async function manualCopy(u, from) { appendFileSync(${JSON.stringify(stubLog)}, JSON.stringify({ u, from }) + '\\n'); return { st: 'ok', why: 'stub' }; }
export async function checkCanaries() {}
`);
  writeFileSync(join(root, 'data', 'media-fixes.json'), JSON.stringify({ v: 1, images: {
    [IMG]: { from: 'https://web.archive.org/web/2020id_/' + IMG, why: 'the same chart in the Wayback Machine', added: '2026-10-15', job: 'media-0001' },
    'https://i.example.org/lost.png': { from: null, gone: true, why: 'no copy anywhere', added: '2026-10-15', job: 'media-0001' },
  } }));
  srv = await startServer(root, { STACKS_JOBS_DIR: dir, STACKS_JOBS_DELAY: '300' });
  await until(async () => (await srv.get('/status')).learn?.at > 0, 15000);
});
after(() => { srv?.stop(); for (const d of [root, dir]) if (d) rmSync(d, { recursive: true, force: true }); });

const jobs = () => srv.get('/jobs');
const files = (sub) => readdirSync(join(dir, sub)).filter((f) => f.endsWith('.md')).sort();

test('GET /jobs: the shape, the prompts, /status.jobs; nothing written before a refresh', async () => {
  const j = await jobs();
  for (const k of ['dir', 'repoPath', 'every', 'running', 'lastRefresh', 'nextRefresh', 'prompt', 'caps', 'open', 'done']) assert.ok(k in j, k);
  assert.equal(j.every, 0, 'STACKS_JOBS_EVERY=0: only on request');
  assert.equal(j.repoPath, 'apps/open-stacks/browser', 'no .git above a temp folder');
  assert.equal(j.prompt, J.allPrompt(j.repoPath));
  assert.match(j.prompt, /^In the cairn repo, open apps\/open-stacks\/browser\/jobs\/README\.md and do the open jobs in apps\/open-stacks\/browser\/jobs\/open\/, highest priority first \(node jobs\.mjs next\)\./);
  assert.deepEqual(j.caps, J.CAPS);
  assert.deepEqual([j.open, j.done], [[], []]);
  assert.deepEqual(files('open'), []);
  const s = await srv.get('/status');
  assert.deepEqual(s.jobs, { open: 0, high: 0, done: 0, lastRefresh: 0 });
});

test('media-fixes.json entries with a copy reach manualCopy once; gone ones are left alone', async () => {
  const lines = await until(() => (existsSync(stubLog) ? readFileSync(stubLog, 'utf-8').trim().split('\n').map((l) => JSON.parse(l)) : null), 5000);
  assert.deepEqual(lines, [{ u: IMG, from: 'https://web.archive.org/web/2020id_/' + IMG }]);
  await until(() => existsSync(join(srv.cache, 'jobs', 'state.json')) && JSON.parse(readFileSync(join(srv.cache, 'jobs', 'state.json'), 'utf-8')).media?.[IMG], 3000);
});

test('refresh after reading and two open errors: discover and fix-item jobs in the temp folder, all lint-clean', async () => {
  const at = Date.now() - DAY;
  const ops = [
    ...readOps('arxiv:2402.03300', { mins: 18, frac: 0.9, at }),
    ...readOps('arxiv:2501.12948', { mins: 35, frac: 0.8, days: 2, judge: ['save'], at }),
    ...readOps('arxiv:2501.19393', { mins: 14, frac: 0.9, at }),
    ...readOps('arxiv:2408.03314', { mins: 20, frac: 0.7, judge: ['more'], at }),
    ...readOps('arxiv:2503.11926', { mins: 9, frac: 0.5, at }),
  ];
  for (const it of TTRPG) ops.push(...quickOps(it.id, { secs: 3, at, it }));
  assert.equal((await (await srv.post('/memory', { ops })).json()).ok, true);
  await until(async () => ((await srv.get('/status')).learn.exposures >= 10 ? true : null), 15000, 100);
  // One item fails to open on two days; another answers 410 once.
  for (const t of [Date.now() - 2 * DAY, Date.now() - DAY]) assert.equal((await (await srv.post('/jobs/report', { id: BROKEN.id, kind: 'open', msg: 'Failed to fetch', status: null, t })).json()).ok, true);
  await srv.post('/jobs/report', { id: GONE.id, kind: 'open', msg: 'HTTP 410', status: 410 });
  assert.equal((await srv.post('/jobs/report', { kind: 'open' })).status, 400);

  const r = await (await srv.post('/jobs/refresh', {})).json();
  assert.ok(r.ms >= 0 && r.ms < 1000, `a refresh takes ${r.ms} ms (target ≤ 1 s)`);
  const types = new Set(r.created.map((id) => id.replace(/-\d{4}$/, '')));
  assert.ok(types.has('discover') && types.has('fix-item'), r.created.join(', '));
  assert.deepEqual(files('open').map((f) => f.replace(/\.md$/, '')).sort(), [...r.created].sort(), 'written to STACKS_JOBS_DIR');
  const fix = J.parseJob(readFileSync(join(dir, 'open', r.created.find((id) => id.startsWith('fix-item')) + '.md'), 'utf-8')).job;
  const fixIds = (await jobs()).open.filter((x) => x.type === 'fix-item').flatMap((x) => x.inputs.map((y) => y.id));
  assert.ok(fixIds.includes(BROKEN.id) && fixIds.includes(GONE.id), fixIds.join(', '));
  assert.ok(fix.inputs.every((x) => /^(HTTP \d{3}|fails to open: |dead page)/.test(x.problem)), JSON.stringify(fix.inputs));
  const disc = (await jobs()).open.find((x) => x.type === 'discover');
  assert.equal(disc.prompt, J.jobPrompt(disc.id, 'apps/open-stacks/browser'));
  assert.ok(disc.inputs.some((x) => x.id === 'arxiv:2501.12948'), 'a saved deep read is a seed');

  // Privacy (§7.9, §11.4): the lint finds nothing, and nothing names an item only skipped.
  for (const f of files('open')) {
    const text = readFileSync(join(dir, 'open', f), 'utf-8');
    const { job, errors } = J.parseJob(text);
    assert.deepEqual(errors, [], f);
    assert.deepEqual(J.lintJob(job, text), [], f);
    for (const it of TTRPG) assert.ok(!text.includes(it.t) && !text.includes(it.id), `${f} names the skipped item ${it.id}`);
    assert.doesNotMatch(text, /\b(\d+ ?(min|mins|minutes|s|sec|seconds|h|hours))\b|\byou\b|deeply|skimmed|visits?\b/i, f);
  }
  const s = await srv.get('/status');
  assert.equal(s.jobs.open, r.created.length);
  assert.ok(s.jobs.lastRefresh > 0);

  // A second refresh creates nothing new: one open job per key.
  const again = await (await srv.post('/jobs/refresh', {})).json();
  assert.deepEqual(again.created, []);
  assert.ok(again.skipped.some((x) => x.key === disc.key && /open job/.test(x.why)));
});

test('GET /jobs re-reads a job file edited in place', async () => {
  const fix = (await jobs()).open.find((x) => x.type === 'fix-item');
  const f = join(dir, 'open', fix.id + '.md');
  writeFileSync(f, readFileSync(f, 'utf-8').trimEnd() + '\n\nAn agent note added in place.\n');
  const seen = await until(async () => ((await jobs()).open.find((x) => x.id === fix.id)?.body.includes('An agent note added in place.') ? true : null), 4000, 250);
  assert.ok(seen);
});

test('POST /jobs/dismiss moves the job to done/ and its key cools down', async () => {
  const disc = (await jobs()).open.find((x) => x.type === 'discover');
  assert.equal((await (await srv.post('/jobs/dismiss', { id: disc.id })).json()).ok, true);
  assert.ok(!existsSync(join(dir, 'open', disc.id + '.md')) && existsSync(join(dir, 'done', disc.id + '.md')));
  const closed = J.parseJob(readFileSync(join(dir, 'done', disc.id + '.md'), 'utf-8')).job;
  assert.equal(closed.status, 'dismissed');
  const j = await jobs();
  assert.ok(j.done.some((x) => x.id === disc.id && x.status === 'dismissed'));
  assert.ok(!j.open.some((x) => x.id === disc.id));
  const r = await (await srv.post('/jobs/refresh', {})).json();
  assert.ok(!r.created.some((id) => id.startsWith('discover') && J.parseJob(readFileSync(join(dir, 'open', id + '.md'), 'utf-8')).job.key === disc.key));
  assert.ok(r.skipped.some((x) => x.key === disc.key && /cool-down/.test(x.why)), JSON.stringify(r.skipped));
  assert.equal((await srv.post('/jobs/dismiss', { id: disc.id })).status, 404, 'already closed');
  assert.equal((await srv.post('/jobs/dismiss', { id: '../x' })).status, 400);
});

test('POST /jobs/flag writes the job and the picture; GET /jobs/asset serves it', async () => {
  const it = C.items.find((x) => x.id === 'arxiv:2402.03300');
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
  const body = { id: it.id, page: 7, kind: 'garbled', note: 'Figure 3 renders as a black box', view: { zoom: false, per: 2, crop: true, cols: false, flow: false, theme: 'reading' }, shot: 'data:image/png;base64,' + png.toString('base64') };
  const r = await (await srv.post('/jobs/flag', body)).json();
  assert.match(r.id, /^flag-\d{4}$/);
  assert.equal(r.path, join(dir, 'open', r.id + '.md'), 'outside the app folder, the path is absolute');
  assert.equal(r.asset, join(dir, 'assets', r.id + '.png'));
  const text = readFileSync(join(dir, 'open', r.id + '.md'), 'utf-8');
  const { job } = J.parseJob(text);
  assert.equal(job.type, 'flag'); assert.equal(job.priority, 'high');
  assert.match(job.title, /^Reader flag: Pages missing or garbled on p\. 7 of DeepSeekMath/);
  assert.match(text, /> Figure 3 renders as a black box/);
  assert.match(text, /Picture: `jobs\/assets\/flag-\d{4}\.png`/);
  assert.deepEqual(readFileSync(join(dir, 'assets', r.id + '.png')), png);
  const res = await fetch(srv.base + '/jobs/asset?name=' + r.id + '.png');
  assert.equal(res.headers.get('content-type'), 'image/png');
  assert.deepEqual(Buffer.from(await res.arrayBuffer()), png);
  assert.equal((await fetch(srv.base + '/jobs/asset?name=../state.json')).status, 400);
  // No picture; an unknown item; a bad kind; a bad picture.
  const plain = await (await srv.post('/jobs/flag', { id: it.id, page: 1, kind: 'meta', note: '' })).json();
  assert.equal(plain.asset, null);
  assert.equal((await srv.post('/jobs/flag', { id: 'nope:x', page: 1, kind: 'open' })).status, 400);
  assert.equal((await srv.post('/jobs/flag', { id: it.id, page: 1, kind: 'weird' })).status, 400);
  assert.equal((await srv.post('/jobs/flag', { id: it.id, page: 1, kind: 'open', shot: 'data:image/gif;base64,AAAA' })).status, 400);
  // Flags do not count toward the cap, and show first.
  const j = await jobs();
  assert.equal(j.open[0].type, 'flag');
});
