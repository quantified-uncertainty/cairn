// HTTP tests for "this is wrong" reports on AI output (server/routes/31-aitrust.mjs) against a
// real server with a fresh temporary cache: reports land in CACHE/ai-errors.jsonl, flags in
// CACHE/ai-trust.json, and both survive a restart. Run: node --test test/*.test.mjs
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'child_process';
import { mkdtempSync, rmSync, readFileSync, existsSync } from 'fs';
import { tmpdir } from 'os';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const HERE = join(dirname(fileURLToPath(import.meta.url)), '..');
const CACHE = mkdtempSync(join(tmpdir(), 'stacks-aitrust-'));
const PORT = 20000 + Math.floor(Math.random() * 20000);
const B = `http://127.0.0.1:${PORT}`;

let server;
async function start() {
  server = spawn(process.execPath, ['server.mjs', '--port', String(PORT)], {
    cwd: HERE, stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, STACKS_CACHE: CACHE, STACKS_JOBS_DIR: join(CACHE, 'jobs'), STACKS_WARM_MB: '0', STACKS_RENDER_ENGINE: 'none', STACKS_CACHE_MAX: '200000000', ANTHROPIC_API_KEY: '' },
  });
  for (let j = 0; j < 100; j++) { try { if ((await fetch(B + '/status')).ok) return; } catch { /* starting */ } await new Promise((r) => setTimeout(r, 100)); }
  throw new Error('server did not start');
}
const stop = () => new Promise((r) => { if (!server || server.exitCode != null) return r(); server.once('exit', r); server.kill(); });
before(start);
after(async () => { await stop(); rmSync(CACHE, { recursive: true, force: true }); });

const post = (p, b) => fetch(B + p, { method: 'POST', body: JSON.stringify(b) });
const S1 = { id: 'arxiv:0000.00001', what: 'summary', model: 'claude-haiku-5-5', at: '2026-10-16T08:00:00.000Z' };

test('a report needs an id and a kind', async () => {
  assert.equal((await post('/ai/wrong', { id: 'x' })).status, 400);
  assert.equal((await post('/ai/wrong', { what: 'summary' })).status, 400);
  assert.equal((await post('/ai/wrong', { id: 'x', what: 'thread' })).status, 400);
  assert.deepEqual(await (await fetch(B + '/ai/trust')).json(), {});
});

test('a report is logged in the cache and flags that output; the same output twice is one flag', async () => {
  const r = await post('/ai/wrong', { ...S1, note: 'Point 2 is not in the paper', title: 'A Title', page: 3 });
  assert.equal(r.status, 200);
  const j = await r.json();
  assert.equal(j.flags.length, 1);
  assert.deepEqual({ what: j.flags[0].what, model: j.flags[0].model, at: j.flags[0].at }, { what: 'summary', model: S1.model, at: S1.at });
  await post('/ai/wrong', { ...S1, note: 'and point 3' });
  await post('/ai/wrong', { id: S1.id, what: 'guide', model: S1.model, at: '2026-10-16T08:01:00.000Z' });
  const all = await (await fetch(B + '/ai/trust')).json();
  assert.deepEqual(all[S1.id].map((f) => f.what), ['summary', 'guide']);
  const log = readFileSync(join(CACHE, 'ai-errors.jsonl'), 'utf8').trim().split('\n').map((l) => JSON.parse(l));
  assert.equal(log.length, 3, 'every report is a line');
  assert.equal(log[0].note, 'Point 2 is not in the paper'); assert.equal(log[0].page, 3); assert.equal(log[0].title, 'A Title');
  assert.ok(existsSync(join(CACHE, 'ai-trust.json')));
  assert.deepEqual((await (await fetch(B + '/status')).json()).aiTrust, { flagged: 1, reports: 3 });
});

test('flags survive a restart; Trust it again drops one kind, then all', async () => {
  await stop(); await start();
  assert.equal((await (await fetch(B + '/ai/trust')).json())[S1.id].length, 2);
  assert.deepEqual((await (await post('/ai/trust', { id: S1.id, what: 'summary' })).json()).flags.map((f) => f.what), ['guide']);
  assert.deepEqual((await (await post('/ai/trust', { id: S1.id })).json()).flags, []);
  assert.deepEqual(await (await fetch(B + '/ai/trust')).json(), {});
});
