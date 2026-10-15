// Export: the browser builds a PDF (ui/js/features/export.js) and posts it
// here to be saved in STACKS_EXPORT_DIR (default ~/Documents/Stacks). When the
// reMarkable cloud CLI `rmapi` is on PATH (or STACKS_RMAPI names it), a saved
// file can be sent to the tablet's /Stacks folder (STACKS_RM_FOLDER).
//
//   GET  /export/status          -> {dir, rmapi: bool, folder}
//   POST /export?name=Title      body = PDF bytes -> {path, file, size}
//   POST /export/remarkable      {file} (a name returned above) -> {ok, output}
import { mkdirSync, existsSync, writeFileSync, statSync, accessSync, constants } from 'fs';
import { join, delimiter, basename, isAbsolute } from 'path';
import { homedir } from 'os';
import { execFile } from 'child_process';

const DIR = process.env.STACKS_EXPORT_DIR || join(homedir(), 'Documents', 'Stacks');
const FOLDER = process.env.STACKS_RM_FOLDER || '/Stacks';
const MAX = 500e6;

function which(cmd) {
  const exe = (f) => { try { accessSync(f, constants.X_OK); return statSync(f).isFile(); } catch { return false; } };
  if (isAbsolute(cmd)) return exe(cmd) ? cmd : null;
  for (const d of (process.env.PATH || '').split(delimiter)) if (d && exe(join(d, cmd))) return join(d, cmd);
  return null;
}
let rm = { at: 0, path: null };
const rmapi = () => { if (Date.now() - rm.at > 30e3) rm = { at: Date.now(), path: which(process.env.STACKS_RMAPI || 'rmapi') }; return rm.path; };

/** Letters, digits, spaces and light punctuation only; `.pdf`; never overwrites. */
function safeName(name) {
  const base = String(name || '').normalize('NFC').replace(/\.pdf$/i, '')
    .replace(/[^\p{L}\p{N} ()[\],.&+_'-]+/gu, ' ').replace(/\s+/g, ' ')
    .replace(/^[\s.-]+|[\s.]+$/g, '').slice(0, 120).trim() || 'Stacks export';
  let f = base + '.pdf';
  for (let n = 2; existsSync(join(DIR, f)); n++) f = `${base} (${n}).pdf`;
  return f;
}

/** Run rmapi without a shell; stdin is closed so a missing login fails fast instead of waiting for a code. */
function run(bin, args) {
  return new Promise((resolve) => {
    const p = execFile(bin, args, { timeout: 180e3, maxBuffer: 4e6 }, (err, stdout, stderr) =>
      resolve({ ok: !err, output: `${stdout}${stderr}`.trim() || (err ? String(err.message) : '') }));
    p.stdin?.end();
  });
}

// Writes and uploads are for this app's own pages (same origin), not for any site the browser visits.
const local = (req) => { const o = req.headers.origin; try { return !o || new URL(o).host === req.headers.host; } catch { return false; } };

export default function (app) {
  app.route('GET', '/export/status', (req, res) => app.json(res, { dir: DIR, rmapi: !!rmapi(), folder: FOLDER }));

  app.route('POST', '/export', async (req, res, url) => {
    if (!local(req)) return app.json(res, { error: 'forbidden' }, 403);
    const chunks = []; let size = 0;
    for await (const c of req) { size += c.length; if (size > MAX) return app.json(res, { error: 'PDF too large' }, 413); chunks.push(c); }
    const buf = Buffer.concat(chunks);
    if (buf.subarray(0, 5).toString() !== '%PDF-') return app.json(res, { error: 'not a PDF' }, 400);
    mkdirSync(DIR, { recursive: true });
    const file = safeName(url.searchParams.get('name'));
    const path = join(DIR, file);
    writeFileSync(path, buf, { flag: 'wx' });
    app.json(res, { path, file, size: buf.length });
  });

  app.route('POST', '/export/remarkable', async (req, res) => {
    if (!local(req)) return app.json(res, { ok: false, output: 'forbidden' }, 403);
    const bin = rmapi();
    if (!bin) return app.json(res, { ok: false, output: 'rmapi is not installed (https://github.com/ddvk/rmapi)' }, 400);
    const { file } = await app.body(req);
    const path = join(DIR, basename(String(file || '')));
    if (!file || !existsSync(path)) return app.json(res, { ok: false, output: `no such export: ${file || '(none)'}` }, 404);
    await run(bin, ['mkdir', FOLDER]); // fails harmlessly when the folder exists
    const put = await run(bin, ['put', path, FOLDER]);
    app.json(res, { ...put, folder: FOLDER });
  });

  app.status(() => ({ exportDir: DIR }));
}
