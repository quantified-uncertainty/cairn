// The Message Batches path of server/augment.mjs with a stand-in SDK client:
// request shape, the reservation, results matched by custom_id, checks, the
// half price, failures listed for a re-run (node --test test/*.test.mjs).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, existsSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const HERE = join(dirname(fileURLToPath(import.meta.url)), '..');
process.env.STACKS_CACHE = mkdtempSync(join(tmpdir(), 'stacks-aug-batch-'));
delete process.env.STACKS_MOCK_AI;
const A = await import('../server/augment.mjs');
const { PRICES } = await import('../server/routes/30-summarize.mjs');

const texts = JSON.parse(readFileSync(join(HERE, 'corpus.json'), 'utf-8')).items.filter((it) => it.kind === 'web').slice(0, 3);
const book = (j) => '<nav>Menu</nav><article>' + Array.from({ length: 60 }, (_, c) => `<h2>Part ${c + 1}</h2><p>The Engine number ${j} of the Mill turns ${c + 2} times an hour when the River is high, as the Miller told his Apprentice.</p><p>A second sentence follows here so that the page has enough words to quote from at length, and a third adds a little more for the count.</p>`).join('') + '</article>';
const cache = {
  cached: (u) => texts.some((it) => it.url === u),
  read: (u) => Buffer.from(book(texts.findIndex((it) => it.url === u))),
  paths: () => ({ body: '/nonexistent' }),
};

test('a batch is submitted with the right requests and its results are checked and stored', { skip: texts.length < 3 && 'needs three web pages in the corpus' }, async () => {
  const charged = []; let reservedUsd = 0, released = 0;
  const sent = {};
  const fake = {
    messages: {
      batches: {
        async create({ requests }) { sent.requests = requests; return { id: 'msgbatch_test1', processing_status: 'in_progress', request_counts: { processing: requests.length, succeeded: 0, errored: 0, canceled: 0, expired: 0 } }; },
        async retrieve(id) { return { id, processing_status: 'ended', request_counts: { processing: 0, succeeded: 1, errored: 1, canceled: 0, expired: 1 } }; },
        async results() {
          const [a, b, c] = sent.requests;
          const textOf = (req) => req.params.messages[0].content[0].text.replace(/^[\s\S]*?<text>\n/, '').replace(/\n<\/text>[\s\S]*$/, '');
          const answer = A.mockAugment(textOf(a), { id: 'x', title: 'A page', n: 30, kind: 'web' });
          return (async function* () {
            // Results come in any order.
            yield { custom_id: c.custom_id, result: { type: 'expired' } };
            yield { custom_id: a.custom_id, result: { type: 'succeeded', message: { model: 'claude-haiku-5-5', stop_reason: 'end_turn', usage: { input_tokens: 20000, output_tokens: 3000 }, content: [{ type: 'thinking', thinking: '' }, { type: 'text', text: answer }] } } };
            yield { custom_id: b.custom_id, result: { type: 'errored', error: { type: 'error', error: { type: 'invalid_request_error', message: 'bad' } } } };
          })();
        },
      },
    },
  };
  const ai = {
    MOCK: false, pickModel: (m) => m || 'claude-haiku-5-5', spendInfo: () => ({ today: 0, budget: 3, calls: 0 }),
    reserve(model, chars, out) { const [pi, po] = PRICES[model]; reservedUsd = ((chars / 3.5) * pi + out * po) / 1e6; return () => { released++; }; },
    charge(model, usd) { charged.push(usd); }, costOf: (model, u) => { const [pi, po] = PRICES[model]; return (u.input_tokens * pi + u.output_tokens * po) / 1e6; },
    client: async () => fake,
  };
  const aug = A.createAugmenter({ ai, cache, port: null });
  const out = await aug.submitBatch({ ids: texts.map((it) => it.id) });
  assert.equal(out.batch, 'msgbatch_test1');
  assert.equal(out.n, 3);
  assert.ok(Math.abs(reservedUsd - out.est) < 1e-4, `reserved ${reservedUsd} for an estimate of ${out.est}`);
  const r0 = sent.requests[0];
  assert.match(r0.custom_id, /^a[0-9a-f]{40}$/);
  assert.equal(r0.params.model, 'claude-haiku-5-5');
  assert.equal(r0.params.max_tokens, 12000);
  assert.equal(r0.params.output_config.effort, 'low');
  assert.equal(r0.params.output_config.format.type, 'json_schema');
  assert.ok(!('stream' in r0.params) && !('fallbacks' in r0.params));
  assert.match(r0.params.messages[0].content[1].text, /You are preparing a reading guide/);

  const rec = await aug.pollBatch('msgbatch_test1');
  assert.equal(rec.done, true);
  assert.equal(released, 1, 'the reservation is released once the results are in');
  assert.equal(charged.length, 1);
  assert.ok(Math.abs(charged[0] - (20000 * 0.1 + 3000 * 0.5) / 1e6 / 2) < 1e-9, 'charged at half price');
  const a = JSON.parse(readFileSync(A.augPath(texts[0].id, 'claude-haiku-5-5'), 'utf-8'));
  assert.equal(a.batch, true);
  assert.equal(a.textSrc, 'html-approx');
  assert.ok(A.validateAugment(a).ok, A.validateAugment(a).errors.join());
  assert.equal(a.dropped.notes, 1, 'quotes were checked against the text the request carried');
  assert.ok(!existsSync(A.augPath(texts[1].id, 'claude-haiku-5-5')));
  assert.deepEqual(rec.failed.map((f) => [f.id, f.why, f.retry]), [[texts[2].id, 'expired', true], [texts[1].id, 'invalid_request_error', false]]);
  assert.equal(existsSync(join(A.BATCH_DIR, 'msgbatch_test1.texts.json')), false, 'the texts kept for checking are deleted');
  assert.deepEqual(aug.listBatches().map((b) => b.id), ['msgbatch_test1']);
  // A second submit skips the item that now has a guide.
  const again = await aug.submitBatch({ ids: texts.map((it) => it.id), dry: true });
  assert.deepEqual(again.skipped.map((s) => s.why), ['current']);
  rmSync(process.env.STACKS_CACHE, { recursive: true, force: true });
});
