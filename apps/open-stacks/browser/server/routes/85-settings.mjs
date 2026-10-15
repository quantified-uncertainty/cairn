// Settings that live on the server, for the Settings sheet (ui/js/features/settings.js).
//
//   GET  /settings/server          -> { budget, envBudget, override, prices, spend }
//   POST /settings/budget {usd}    -> the daily AI budget in USD; null goes back to
//                                     STACKS_DAILY_BUDGET. Kept in CACHE/settings.json.
//   POST /settings/clear-queue     -> drops the server's prefetch queue (fetches in
//                                     flight finish) -> { dropped, queue }
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { setBudget, ENV_BUDGET, PRICES } from './30-summarize.mjs';

export default function (app) {
  const FILE = join(app.CACHE, 'settings.json');
  const read = () => { try { return JSON.parse(readFileSync(FILE, 'utf-8')); } catch { return {}; } };
  const save = (o) => writeFileSync(FILE, JSON.stringify(o, null, 1));
  let saved = read();
  if (Number.isFinite(saved.dailyBudget)) setBudget(saved.dailyBudget);
  const info = () => ({ budget: setBudget(saved.dailyBudget ?? null), envBudget: ENV_BUDGET, override: Number.isFinite(saved.dailyBudget), prices: PRICES });

  app.route('GET', '/settings/server', (req, res) => app.json(res, info()));
  app.route('POST', '/settings/budget', async (req, res) => {
    const b = await app.body(req);
    const usd = b.usd == null ? null : Number(b.usd);
    if (usd != null && !(Number.isFinite(usd) && usd >= 0 && usd <= 1000)) return app.json(res, { error: 'budget must be 0-1000 USD' }, 400);
    saved = { ...read(), dailyBudget: usd };
    if (usd == null) delete saved.dailyBudget;
    save(saved);
    app.json(res, info());
  });
  app.route('POST', '/settings/clear-queue', (req, res) => {
    const dropped = app.cache.clearQueue ? app.cache.clearQueue() : 0;
    app.json(res, { dropped, ...app.cache.queueState() });
  });
}
