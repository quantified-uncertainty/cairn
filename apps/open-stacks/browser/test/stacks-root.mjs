// Test helper (not a test): a throwaway copy of the browser folder, so a server can
// run on a modified corpus.json and data/ without touching the real ones. server/,
// the scripts and data files are copied; ui/ and node_modules are linked.
//
//   const root = makeRoot({ corpus, data: true });
//   const srv = await startServer(root, { STACKS_JOBS_DIR: … });  … srv.base … srv.stop()
import { mkdtempSync, cpSync, symlinkSync, writeFileSync, existsSync, readFileSync, rmSync, mkdirSync } from 'fs';
import { tmpdir } from 'os';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

export const HERE = join(dirname(fileURLToPath(import.meta.url)), '..');
export const realCorpus = () => JSON.parse(readFileSync(join(HERE, 'corpus.json'), 'utf-8'));

/** A temp browser folder. corpus: an object for corpus.json (default: a copy); data: copy data/lanes and the agent data files. */
export function makeRoot({ corpus = null, data = true, prefix = 'stacks-root-' } = {}) {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  cpSync(join(HERE, 'server'), join(dir, 'server'), { recursive: true });
  for (const f of ['server.mjs', 'package.json', 'build-corpus.mjs', 'jobs.mjs']) if (existsSync(join(HERE, f))) cpSync(join(HERE, f), join(dir, f));
  symlinkSync(join(HERE, 'ui'), join(dir, 'ui'));
  if (existsSync(join(HERE, 'node_modules'))) symlinkSync(join(HERE, 'node_modules'), join(dir, 'node_modules'));
  mkdirSync(join(dir, 'data'), { recursive: true });
  if (data) {
    cpSync(join(HERE, 'data', 'lanes'), join(dir, 'data', 'lanes'), { recursive: true });
    for (const f of ['overrides.json', 'media-fixes.json']) if (existsSync(join(HERE, 'data', f))) cpSync(join(HERE, 'data', f), join(dir, 'data', f));
  }
  if (existsSync(join(HERE, 'jobs', 'hosts.json'))) { mkdirSync(join(dir, 'jobs'), { recursive: true }); cpSync(join(HERE, 'jobs', 'hosts.json'), join(dir, 'jobs', 'hosts.json')); }
  writeFileSync(join(dir, 'corpus.json'), JSON.stringify(corpus || realCorpus()));
  return dir;
}

/** Start server.mjs in root on a free port with a temp cache. → {base, port, cache, proc, stop()} */
export async function startServer(root, env = {}, { port = 4800 + Math.floor(Math.random() * 4000) } = {}) {
  const cache = env.STACKS_CACHE || mkdtempSync(join(tmpdir(), 'stacks-cache-'));
  const proc = spawn(process.execPath, ['server.mjs', '--port', String(port)], {
    cwd: root, stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, STACKS_CACHE: cache, STACKS_CACHE_MAX: '200000000', STACKS_WARM_MB: '0', STACKS_JOBS_EVERY: '0', STACKS_MOCK_AI: '1', ANTHROPIC_API_KEY: '', ...env },
  });
  let log = '';
  proc.stdout.on('data', (b) => { log += b; }); proc.stderr.on('data', (b) => { log += b; });
  const base = `http://127.0.0.1:${port}`;
  for (let j = 0; j < 150; j++) {
    try { if ((await fetch(base + '/status')).ok) break; } catch { /* starting */ }
    if (proc.exitCode != null) throw new Error('server exited: ' + log);
    await new Promise((r) => setTimeout(r, 100));
  }
  return {
    base, port, cache, proc, log: () => log,
    get: (p) => fetch(base + p).then((r) => r.json()),
    post: (p, b) => fetch(base + p, { method: 'POST', body: JSON.stringify(b) }),
    stop() { proc.kill(); if (!env.STACKS_CACHE) rmSync(cache, { recursive: true, force: true }); },
  };
}
/** Poll fn until it returns a truthy value (or time out). */
export async function until(fn, ms = 5000, step = 100) {
  const t = Date.now();
  for (;;) { const v = await fn(); if (v) return v; if (Date.now() - t > ms) throw new Error('timed out'); await new Promise((r) => setTimeout(r, step)); }
}
