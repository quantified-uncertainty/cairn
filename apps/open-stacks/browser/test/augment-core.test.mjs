// Unit tests for server/augment.mjs: text capping, the checks that turn a model
// answer into a stored reading guide, validation and mock mode (node --test test/*.test.mjs).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

process.env.STACKS_CACHE ||= mkdtempSync(join(tmpdir(), 'stacks-aug-'));
const A = await import('../server/augment.mjs');
const { indexText } = await import('../server/routes/30-summarize.mjs');

// A small marked document: 10 pages, a references page and an appendix.
const PAGES = [
  'Scaling Laws for Toy Models. We study how loss falls with compute in small transformers. The Chinchilla rule says data and parameters should grow together.',
  '1 Introduction. Large models are expensive to train, so predicting their loss in advance matters a great deal.',
  '2 Method. We train forty models between one million and one billion parameters on the same data. Each model is trained to convergence on a fixed token budget.',
  'Figure 1: Loss against compute for all forty models. The fitted power law has an exponent of minus 0.05 across six orders of magnitude.',
  '3 Results. The power law holds across six orders of magnitude of compute. Doubling the parameters lowers loss by about four percent.',
  'We note that the fit is worst for the smallest models, which are dominated by embedding parameters.',
  '4 Limitations. We only test one architecture and one dataset, so the exponent may not transfer.',
  '5 Conclusion. Loss is predictable from compute at small scale, which helps plan larger runs.',
  'References. [1] Kaplan et al. Scaling laws for neural language models. 2020. [2] Hoffmann et al. Training compute-optimal large language models. 2022.',
  'Appendix A. Hyperparameters. The learning rate was three times ten to the minus four for every run in this study.',
];
const TEXT = PAGES.map((t, k) => `[p. ${k + 1}] ${t}`).join('\n');
const PROFILE = {
  schema: 1, n: 10, src: { sha1: 'abc' },
  toc: [{ t: '1 Introduction', k: 1, d: 0, src: 'heads' }, { t: '2 Method', k: 2, d: 0, src: 'heads' }, { t: '3 Results', k: 4, d: 0, src: 'heads' }, { t: '4 Limitations', k: 6, d: 0, src: 'heads' }],
  ranges: { front: null, body: [0, 7], refs: [8, 8], appendix: [9, 9], index: null },
  pages: PAGES.map((_, k) => ({ k, ...(k === 3 && { fig: [{ b: [0.1, 0.1, 0.9, 0.6], kind: 'figure', lab: 'Figure 1', cap: 'Figure 1: Loss against compute for all forty models.' }] }) })),
  hints: [{ code: 'two-up', why: 'text pages' }],
};
// A hand-written model answer with something wrong in every list.
const RAW = {
  hook: 'Forty small transformers show loss is predictable from compute, which is exactly what you need before you spend a fortune on one big run',
  tags: ['Scaling Laws', 'compute', 'Compute', 'power law', 'transformers', 'loss', 'planning', 'extra'],
  minutes: 7,
  plan: [
    { page: 5, why: 'The main result', kind: 'result', quote: 'The power law holds across six orders of magnitude of compute.' },
    { page: 1, why: 'Where it starts', kind: 'start', quote: '' },
    { page: 4, why: 'The key figure', kind: 'figure', quote: 'This sentence is not in the text at all, not even close.' },
    { page: 9, why: 'References', kind: 'claim', quote: '' },
    { page: 5, why: 'Same page again', kind: 'claim', quote: '' },
    { page: 7, why: 'The limitation', kind: 'limit', quote: 'We only test one architecture and one dataset, so the exponent may not transfer.' },
    { page: 99, why: 'Out of range', kind: 'conclusion', quote: '' },
  ],
  skip: [{ from: 9, to: 9, why: 'references' }, { from: 10, to: 10, why: 'hyperparameters' }, { from: 1, to: 10, why: 'everything' }],
  sections: [
    { title: '1 Introduction', page: 3, depth: 0, summary: 'Why predicting loss matters.' },
    { title: '2 Method', page: 3, depth: 0, summary: 'Forty models, one dataset, trained to convergence on a fixed budget of tokens for every single run in the study, which is long.' },
    { title: 'Results', page: 5, depth: 0, summary: 'A clean power law.' },
    { title: 'Backwards', page: 2, depth: 0, summary: 'Goes backwards.' },
    { title: '5 Conclusion', page: 8, depth: 1, summary: 'Plan big runs from small ones.' },
  ],
  glossary: [
    { term: 'Chinchilla rule', definition: 'Grow data and parameters together.', page: 3, quote: 'The Chinchilla rule says data and parameters should grow together.' },
    { term: 'power law', definition: 'Loss proportional to compute to a fixed exponent.', page: 5, quote: 'A sentence that was made up.' },
    { term: 'Power Law', definition: 'Duplicate term.', page: 5, quote: '' },
    { term: 'embedding parameters', definition: 'Parameters of the token embedding table.', page: 6, quote: '' },
  ],
  notes: [
    { page: 3, quote: 'Each model is trained to convergence on a fixed token budget.', note: 'Training to convergence differs from compute-optimal training; the exponent depends on it.' },
    { page: 6, quote: 'We note that the fit is worst for the smallest models, which are dominated by embedding parameters.', note: 'Excluding embeddings from the count usually straightens the curve.' },
    { page: 6, quote: 'We note that the fit is worst for the tiniest models, which are dominated by embedding parameters.', note: 'Altered quote: must be dropped.' },
    { page: 2, quote: 'Large models are expensive to train, so predicting their loss in advance matters a great deal.', note: 'Found on page 2.' },
  ],
  figures: [{ fid: '3.0', what: 'Loss against compute on log axes.', look: 'The straight line.' }, { fid: '4.0', what: 'Not a figure.', look: '-' }],
  display: [{ code: 'two-up', why: 'Text pages.' }, { code: 'nonsense', why: '-' }, { code: 'two-up', why: 'dup' }, { code: 'skip-front', why: 'x' }, { code: 'one-up', why: 'y' }],
};
const O = { id: 'test:toy', model: 'claude-haiku-5-5', n: 10, ix: indexText(TEXT), profile: PROFILE, textSrc: 'client', textChars: TEXT.length, coverage: 1, srcSha1: 'abc', cost: 0.0042 };

test('checkAugment: notes need a verified quote; pages come from where the quote is', () => {
  const a = A.checkAugment(RAW, O);
  assert.deepEqual(a.notes.map((n) => n.k), [1, 2, 5]);
  assert.ok(a.notes.every((n) => n.ok === true));
  assert.equal(a.dropped.notes, 1);
});

test('checkAugment: the skim path is sorted, deduplicated, in range and out of the references and skips', () => {
  const a = A.checkAugment(RAW, O);
  assert.deepEqual(a.plan.map((s) => s.k), [0, 3, 4, 6]);
  const fig = a.plan.find((s) => s.k === 3);
  assert.equal(fig.quote, undefined, 'an unfound quote is removed');
  assert.equal(a.plan.find((s) => s.k === 4).ok, true);
  assert.ok(a.dropped.quotes >= 1);
  assert.ok(a.dropped.stops >= 3, JSON.stringify(a.dropped)); // references, same page, out of range (clamped to the appendix, which is skipped)
});

test('checkAugment: skip ranges merge, and a skip over the whole document is dropped', () => {
  const a = A.checkAugment(RAW, O);
  assert.deepEqual(a.skip.map((x) => [x.a, x.b]), [[8, 9]]);
  assert.match(a.skip[0].why, /references; hyperparameters/);
});

test('checkAugment: sections take the table of contents pages and never go backwards', () => {
  const a = A.checkAugment(RAW, O);
  assert.deepEqual(a.sections.map((s) => [s.t, s.k, s.toc]), [['1 Introduction', 1, true], ['2 Method', 2, true], ['Results', 4, true], ['5 Conclusion', 7, false]]);
  assert.ok(a.sections.every((s) => s.sum.length <= 160));
});

test('checkAugment: glossary quotes are checked; figures, hints, tags and hook are bounded', () => {
  const a = A.checkAugment(RAW, O);
  assert.deepEqual(a.glossary.map((g) => [g.term, g.ok, !!g.quote]), [['Chinchilla rule', true, true], ['power law', false, false], ['embedding parameters', false, false]]);
  assert.deepEqual(a.figs.map((f) => [f.fid, f.k]), [['3.0', 3]]);
  assert.equal(a.dropped.figs, 1);
  assert.deepEqual(a.display.map((d) => d.code), ['two-up', 'skip-front', 'one-up']);
  assert.deepEqual(a.tags, ['scaling-laws', 'compute', 'power-law', 'transformers', 'loss', 'planning']);
  assert.ok(a.hook.length <= 120);
  assert.equal(a.srcSha1, 'abc');
  assert.deepEqual(A.validateAugment(a), { ok: true, errors: [] });
});

test('checkAugment: partial answers keep quotes unchecked and leave notes out', () => {
  const p = A.checkAugment({ plan: RAW.plan.slice(0, 2), notes: RAW.notes }, { ...O, partial: true });
  assert.equal(p.partial, true);
  assert.equal(p.notes.length, 0);
  assert.equal(p.plan.find((s) => s.quote)?.ok, null);
});

test('validateAugment catches broken guides', () => {
  const a = A.checkAugment(RAW, O);
  const bad = { ...a, plan: [{ k: 3, kind: 'result', why: '' }, { k: 2, kind: 'result', why: '' }], notes: [{ k: 1, quote: 'x', note: 'y', ok: false }], n: 10 };
  const v = A.validateAugment(bad);
  assert.equal(v.ok, false);
  assert.ok(v.errors.some((e) => e.includes('order')) && v.errors.some((e) => e.startsWith('notes')), v.errors.join());
});

test('mockAugment is deterministic and loses exactly one note to its altered quote', () => {
  const opts = { id: 'test:toy', title: 'Scaling Laws for Toy Models', n: 10, profile: PROFILE, kind: 'pdf' };
  const m1 = A.mockAugment(TEXT, opts), m2 = A.mockAugment(TEXT, opts);
  assert.equal(m1, m2);
  const raw = JSON.parse(m1);
  const a = A.checkAugment(raw, O);
  assert.equal(raw.notes.length - a.notes.length, 1);
  assert.equal(a.dropped.notes, 1);
  assert.ok(a.plan.length >= 3 && a.sections.length >= 3 && a.figs.length === 1, JSON.stringify({ plan: a.plan.length, sec: a.sections.length, figs: a.figs.length }));
  assert.ok(A.validateAugment(a).ok, A.validateAugment(a).errors.join());
});

test('capText keeps the head, every later page\'s start and whole pages up to the cap', () => {
  const pages = Array.from({ length: 200 }, (_, k) => `Heading ${k + 1}. ` + 'word '.repeat(300));
  const text = pages.map((t, k) => `[p. ${k + 1}] ${t}`).join('\n');
  const { text: cut, coverage } = A.capText(text, 60000);
  assert.ok(cut.length <= 60000);
  assert.ok(coverage > 0.15 && coverage < 0.5, String(coverage));
  const kept = A.pagesOf(cut);
  assert.equal(kept[0].p, 1);
  assert.ok(kept.some((x) => x.p === 200), 'the last page keeps its heading');
  assert.ok(kept.filter((x) => x.t.startsWith('Heading')).length > 150, 'most pages keep their headings');
  assert.deepEqual(A.capText('[p. 1] short', 60000), { text: '[p. 1] short', coverage: 1 });
});

test('htmlPages strips tags and groups blocks into ~280-word pages', () => {
  const html = '<script>x()</script><h2>Intro</h2>' + Array.from({ length: 20 }, (_, j) => `<p>Paragraph ${j} &amp; ${'text '.repeat(60)}</p>`).join('');
  const pages = A.htmlPages(html);
  assert.ok(pages.length >= 4 && pages.length <= 6, String(pages.length));
  assert.ok(pages[0].startsWith('Intro') && !pages.join(' ').includes('x()') && pages[0].includes('&'));
});

test('facts lists the contents, ranges, figures and the summary to complement', () => {
  const f = A.facts({ kind: 'pdf', n: 10, profile: PROFILE, summary: { gist: 'Loss is predictable.', key_points: [{ point: 'Power law', page: 5 }] }, highlight: null, ix: indexText(TEXT) });
  assert.match(f, /\[p\. 2\] 1 Introduction/);
  assert.match(f, /References: p\. 9\. Appendix: p\. 10/);
  assert.match(f, /3\.0 \| p\. 4 \| Figure 1/);
  assert.match(f, /do not repeat it/);
  assert.match(A.facts({ kind: 'html', n: 3, profile: null }), /none are listed/);
});

test('the schema lists the hint codes and the custom ids are batch-safe', () => {
  const s = A.augSchema();
  assert.deepEqual(s.properties.display.items.properties.code.enum, A.hintCodes());
  assert.equal(A.hintCodes().length, 10);
  assert.match(A.customId('arxiv:1706.03762', 'claude-haiku-5-5'), /^a[0-9a-f]{40}$/);
});
