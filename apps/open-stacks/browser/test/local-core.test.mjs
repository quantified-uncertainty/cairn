// The pure parts of server/local.mjs: the zip reader, the Markdown converter, EPUB and
// HTML clean-up, what a file is, titles, PDF facts and the folder list.
//   node --test test/local-core.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir, homedir } from 'os';
import { join } from 'path';
import * as L from '../server/local.mjs';
import { makeZip, makePdf, makeEpub, makePng, PNG, MARKDOWN } from './local-fixtures.mjs';

const tmp = () => mkdtempSync(join(tmpdir(), 'stacks-local-core-'));

// ---------------------------------------------------------------- zip
test('zip: stored and deflated entries, UTF-8 names, zip64 records', (t) => {
  const d = tmp(); t.after(() => rmSync(d, { recursive: true, force: true }));
  const big = 'All work and no play. '.repeat(4000);
  for (const zip64 of [false, true]) {
    const f = join(d, `a${zip64}.zip`);
    writeFileSync(f, makeZip([['plain.txt', big], ['dir/naïve é.png', PNG, { store: true }], ['dir/', '']], { zip64 }));
    const z = L.openZip(f);
    try {
      assert.deepEqual([...z.entries.keys()].sort(), ['dir/naïve é.png', 'plain.txt'], 'directories are not entries');
      assert.equal(z.entries.get('plain.txt').method, 8);
      assert.equal(z.entries.get('plain.txt').size, big.length);
      assert.ok(z.entries.get('plain.txt').csize < big.length / 10, 'deflated');
      assert.equal(z.text('plain.txt'), big);
      assert.deepEqual(z.read('dir/naïve é.png'), PNG);
      assert.throws(() => z.read('nope'), /no such entry/);
      assert.throws(() => z.read('plain.txt', 1000), /too large/, 'an entry bigger than the cap is refused before inflating');
    } finally { z.close(); }
  }
});
test('zip: not a zip, and a truncated one, are errors', (t) => {
  const d = tmp(); t.after(() => rmSync(d, { recursive: true, force: true }));
  writeFileSync(join(d, 'x.zip'), 'not a zip at all');
  assert.throws(() => L.openZip(join(d, 'x.zip')), /not a zip/);
  const z = makeZip([['a.txt', 'abc']]);
  writeFileSync(join(d, 'cut.zip'), z.subarray(0, z.length - 30));
  assert.throws(() => L.openZip(join(d, 'cut.zip')));
});

// ---------------------------------------------------------------- Markdown
const md = (s, url) => L.mdToHtml(s, url ? { url } : {}).html;
test('markdown: headings, paragraphs, emphasis and code', () => {
  assert.equal(md('# Title\n\nSome *em* and **strong** and ***both*** and ~~gone~~ and `a<b`.'),
    '<h1 id="title">Title</h1>\n<p>Some <em>em</em> and <strong>strong</strong> and <strong><em>both</em></strong> and <del>gone</del> and <code>a&lt;b</code>.</p>');
  assert.equal(md('Setext one\n===\n\nSetext two\n---'), '<h1 id="setext-one">Setext one</h1>\n<h2 id="setext-two">Setext two</h2>');
  assert.equal(md('## Same\n\n## Same'), '<h2 id="same">Same</h2>\n<h2 id="same-1">Same</h2>', 'repeated headings get distinct ids');
  assert.equal(md('snake_case_word and _em_ and __strong__'), '<p>snake_case_word and <em>em</em> and <strong>strong</strong></p>');
  assert.equal(md('line one  \nline two\\\nline three'), '<p>line one<br>\nline two<br>\nline three</p>');
  assert.equal(md('\\*not em\\* and 2 * 3 * 4'), '<p>*not em* and 2 * 3 * 4</p>');
  assert.equal(md('***\n\n- - -'), '<hr>\n<hr>');
});
test('markdown: raw HTML is shown as text, except a few plain inline tags', () => {
  assert.equal(md('<script>alert(1)</script> <img src=x onerror=alert(1)>'), '<p>&lt;script&gt;alert(1)&lt;/script&gt; &lt;img src=x onerror=alert(1)&gt;</p>');
  assert.equal(md('H<sub>2</sub>O and x<sup>2</sup>, <kbd>⌘</kbd>, a<br>b'), '<p>H<sub>2</sub>O and x<sup>2</sup>, <kbd>⌘</kbd>, a<br>b</p>');
  assert.equal(md('<b onclick="x()">b</b>'), '<p>&lt;b onclick=&quot;x()&quot;&gt;b<b></p>'.replace('<b></p>', '</b></p>'));
});
test('markdown: links, images, references, autolinks and bare URLs', () => {
  const url = (u, img) => (/^[a-z]+:/i.test(u) || u.startsWith('#') ? u : (img ? '/I/' : '/L/') + u);
  assert.equal(md('[a link](https://example.org/x?a=1&b=2 "Title") and [rel](notes/other.md)', url),
    '<p><a href="https://example.org/x?a=1&amp;b=2" title="Title">a link</a> and <a href="/L/notes/other.md">rel</a></p>');
  assert.equal(md('![alt *text*](pics/a.png) ![](<pics/b c.png>)', url), '<p><img src="/I/pics/a.png" alt="alt *text*"> <img src="/I/pics/b c.png" alt=""></p>');
  assert.equal(md('See [the docs][d] and [d].\n\n[d]: https://example.com/docs "Docs"', url),
    '<p>See <a href="https://example.com/docs" title="Docs">the docs</a> and <a href="https://example.com/docs" title="Docs">d</a>.</p>');
  assert.equal(md('<https://example.com/a> and https://example.com/b, done.'), '<p><a href="https://example.com/a">https://example.com/a</a> and <a href="https://example.com/b">https://example.com/b</a>, done.</p>');
  assert.equal(md('[**bold** link](#frag)'), '<p><a href="#frag"><strong>bold</strong> link</a></p>');
  assert.equal(md('[x](https://en.wikipedia.org/wiki/Foo_(bar))'), '<p><a href="https://en.wikipedia.org/wiki/Foo_(bar)">x</a></p>', 'parentheses inside a URL');
  assert.equal(md('`[not](a link)`'), '<p><code>[not](a link)</code></p>');
});
test('markdown: lists: nested, ordered with a start, tasks, loose, lazy lines', () => {
  assert.equal(md('- a\n- b\n  - c\n  - d\n- e'), '<ul><li>a</li>\n<li>b\n<ul><li>c</li>\n<li>d</li></ul></li>\n<li>e</li></ul>');
  assert.equal(md('3. three\n4. four'), '<ol start="3"><li>three</li>\n<li>four</li></ol>');
  assert.equal(md('- [ ] todo\n- [x] done'), '<ul><li class="task"><input type="checkbox" disabled> todo</li>\n<li class="task"><input type="checkbox" disabled checked> done</li></ul>');
  assert.equal(md('- one\n\n- two'), '<ul><li><p>one</p></li>\n<li><p>two</p></li></ul>', 'a blank line between items makes paragraphs');
  assert.equal(md('- item that\ncontinues lazily\n- next'), '<ul><li>item that\ncontinues lazily</li>\n<li>next</li></ul>');
  assert.equal(md('1. a\n\n   more of a\n2. b'), '<ol><li><p>a</p>\n<p>more of a</p></li>\n<li><p>b</p></li></ol>');
  assert.equal(md('Text\n- list right after'), '<p>Text</p>\n<ul><li>list right after</li></ul>');
  assert.equal(md('The year\n1999. was good'), '<p>The year\n1999. was good</p>', 'a number in a paragraph does not start a list');
});
test('markdown: quotes, code blocks and tables', () => {
  assert.equal(md('> a\n> > nested\n\n> b\nlazy'), '<blockquote><p>a</p>\n<blockquote><p>nested</p></blockquote></blockquote>\n<blockquote><p>b\nlazy</p></blockquote>');
  assert.equal(md('```python\nif a < b:\n    print("x")\n```'), '<pre><code class="language-python">if a &lt; b:\n    print(&quot;x&quot;)</code></pre>');
  assert.equal(md('~~~\n# not a heading\n~~~'), '<pre><code># not a heading</code></pre>');
  assert.equal(md('    indented code\n    more'), '<pre><code>indented code\nmore</code></pre>');
  assert.equal(md('| a | b | c |\n|:--|:-:|--:|\n| 1 | `x|y` | 3 |\n| 4 | 5 |'),
    '<table><thead><tr><th style="text-align:left">a</th><th style="text-align:center">b</th><th style="text-align:right">c</th></tr></thead><tbody><tr><td style="text-align:left">1</td><td style="text-align:center"><code>x|y</code></td><td style="text-align:right">3</td></tr><tr><td style="text-align:left">4</td><td style="text-align:center">5</td><td style="text-align:right"></td></tr></tbody></table>');
  assert.equal(md('a | b\n--|--\n1 | 2'), '<table><thead><tr><th>a</th><th>b</th></tr></thead><tbody><tr><td>1</td><td>2</td></tr></tbody></table>', 'no outer pipes');
});
test('markdown: front matter and the title', () => {
  const r = L.mdToHtml(MARKDOWN, { url: (u) => u });
  assert.equal(r.title, 'Notes on Synthetic Things');
  assert.deepEqual(r.meta, { title: 'Notes on Synthetic Things', author: 'Test Author', date: '2024-02-03' });
  assert.ok(!r.html.includes('---'), 'front matter is not shown');
  assert.equal(L.mdToHtml('Intro\n\n# The *Real* Title\n\ntext').title, 'The Real Title', 'else the first level-1 heading');
  assert.equal(L.mdToHtml('just text').title, null);
  assert.equal(L.mdToHtml('\uFEFF# BOM\r\n\r\ntext\r\n').title, 'BOM', 'a byte order mark and CRLF lines');
});

// ---------------------------------------------------------------- EPUB, HTML
test('epub: the spine in order, pictures through asset(), links between chapters as anchors, no scripts', (t) => {
  const d = tmp(); t.after(() => rmSync(d, { recursive: true, force: true }));
  const f = join(d, 'b.epub');
  writeFileSync(f, makeEpub({ chapters: 3 }));
  const b = L.epubBook(f, { asset: (p) => '/A/' + p });
  assert.equal(b.title, 'The Synthetic Book');
  assert.deepEqual(b.authors, ['Ada Example']);
  assert.equal(b.date, '2019-05-01');
  assert.equal(b.chapters, 3);
  const at = (s) => b.html.indexOf(s);
  assert.ok(at('Opening of chapter 1') < at('Opening of chapter 2') && at('Opening of chapter 2') < at('Opening of chapter 3'), 'spine order');
  assert.match(b.html, /<img src="\/A\/OEBPS\/images\/fig\.png" alt="A figure"\/?>/);
  assert.match(b.html, /<a href="#c1-top">On to chapter two<\/a>/);
  assert.match(b.html, /<a href="#c0-top">back to the top<\/a>/);
  assert.match(b.html, /<section id="c0" class="lc-ch">/);
  assert.match(b.html, /<h1 id="c0-top">Chapter 1<\/h1>/);
  assert.ok(!/script|onclick|alert|<style|<link|stylesheet/i.test(b.html), 'scripts, handlers, styles and links to CSS are gone');
  assert.match(b.html, /<div class="empty"><\/div>/, 'XHTML self-closing tags are closed for the HTML parser');
  assert.deepEqual(L.epubMeta(f), { title: 'The Synthetic Book', authors: ['Ada Example'], date: '2019-05-01', lang: 'en' });
  writeFileSync(join(d, 'bad.epub'), makeZip([['mimetype', 'application/epub+zip']]));
  assert.throws(() => L.epubBook(join(d, 'bad.epub')), /not an EPUB/);
});
test('html: body only, no scripts, handlers or javascript: links, relative URLs rewritten, title found', () => {
  const r = L.htmlDoc(Buffer.from('<html><head><title>T &amp; U</title><style>p{}</style></head><body onload="x()"><p onclick=\'y()\' style="color:red">Hi <a href="javascript:alert(1)">j</a> <a href="#a">a</a> <a href="https://e.org/">e</a> <img src="pics/x.png" srcset="pics/x2.png 2x"> <img src="data:image/png;base64,AAA"> <a href="data:text/html,x">d</a></p><iframe src="https://evil"></iframe><form action="/x"><input name=q></form><svg><image xlink:href="pics/y.png"/></svg></body></html>'),
    (v, img) => (img ? 'IMG:' : 'LINK:') + v);
  assert.equal(r.title, 'T & U');
  assert.equal(r.html, '<p style="color:red">Hi <a href="#">j</a> <a href="LINK:#a">a</a> <a href="LINK:https://e.org/">e</a> <img src="IMG:pics/x.png"> <img src="IMG:data:image/png;base64,AAA"> <a href="#">d</a></p><svg><image xlink:href="IMG:pics/y.png"></image></svg>');
  assert.equal(L.htmlDoc(Buffer.from('<meta charset="iso-8859-1"><p>caf\xe9</p>', 'latin1')).html, '<p>café</p>', 'a declared Latin-1 page');
  assert.equal(L.htmlDoc('<h1>Only a heading</h1>').title, 'Only a heading');
});

// ---------------------------------------------------------------- files
test('classify: hidden, partial, iCloud placeholders and types', () => {
  assert.deepEqual(L.classify('.DS_Store'), { skip: 'hidden' });
  assert.deepEqual(L.classify('._paper.pdf'), { skip: 'hidden' });
  assert.deepEqual(L.classify('.hidden.pdf'), { skip: 'hidden' });
  assert.deepEqual(L.classify('Icon\r'), { skip: 'hidden' });
  assert.deepEqual(L.classify('book.pdf.crdownload'), { skip: 'partial' });
  assert.deepEqual(L.classify('~$draft.docx'), { skip: 'partial' });
  assert.deepEqual(L.classify('Paper.PDF'), { type: 'pdf', ext: 'pdf' });
  assert.deepEqual(L.classify('.Paper.pdf.icloud'), { type: 'pdf', ext: 'pdf', real: 'Paper.pdf', stub: true });
  assert.deepEqual(L.classify('.notes.md.icloud'), { type: 'md', ext: 'md', real: 'notes.md', stub: true });
  assert.deepEqual(L.classify('..x.icloud'), { skip: 'hidden' }, 'a hidden file’s placeholder stays hidden');
  for (const [n, t] of [['b.epub', 'epub'], ['n.markdown', 'md'], ['p.htm', 'html'], ['r.txt', 'txt'], ['w.docx', 'word'], ['m.PNG', 'image'], ['s.mp3', 'audio'], ['a.zip', 'archive'], ['k.mobi', 'kindle'], ['d.djvu', 'djvu'], ['c.cbz', 'comic']]) assert.equal(L.classify(n).type, t, n);
  assert.deepEqual(L.classify('data.bin'), { skip: 'other', ext: 'bin' });
});
test('planFolder: pictures and sound in twos become one item; an unpacked archive is left out', () => {
  const f = (name) => ({ name, ...L.classify(name) });
  const plan = L.planFolder([f('b.png'), f('a.png'), f('one.pdf'), f('song.mp3'), f('Maps_Pack.zip'), f('Other.zip')], ['Maps Pack']);
  assert.deepEqual(plan.map((p) => [p.kind, p.files.map((x) => x.name).join(',')]),
    [['file', 'one.pdf'], ['file', 'Other.zip'], ['gallery', 'a.png,b.png'], ['file', 'song.mp3']]);
  assert.deepEqual(L.planFolder([f('x.mp3'), f('y.mp3')]).map((p) => p.kind), ['playlist']);
  assert.deepEqual(L.planFolder([f('.c.png.icloud'), f('d.png')]).map((p) => p.kind), ['file', 'file'], 'a placeholder is not part of a gallery');
});
test('titles: metadata titles worth showing, file names cleaned, authors', () => {
  assert.equal(L.cleanTitle('blades-in-the-dark_core.pdf'), 'Blades in the dark core');
  assert.equal(L.cleanTitle('Some_Book_v1.3.pdf'), 'Some Book v1.3');
  assert.equal(L.cleanTitle('Already Fine - Part 2.epub'), 'Already Fine - Part 2');
  assert.equal(L.cleanTitle('a-b-c'), 'A b c');
  for (const bad of ['Untitled', 'untitled-3', 'Microsoft Word - Document1.docx', 'layout 1', 'x', '12345', 'final.indd', 'C:\\Users\\x\\a.doc', 'Document2', 'some_file_name']) assert.equal(L.goodTitle(bad), null, bad);
  assert.equal(L.goodTitle('Microsoft Word - An Essay on Things'), 'An Essay on Things');
  assert.equal(L.goodTitle('  A  Real\tTitle '), 'A Real Title');
  assert.equal(L.goodAuthor('Administrator'), null);
  assert.equal(L.goodAuthor('Jane Q. Writer'), 'Jane Q. Writer');
});
test('PDF facts: pdfinfo, mdls (macOS Spotlight) and the no-tools fallback', (t) => {
  assert.deepEqual(L.parsePdfinfo('Title:           A Book: Subtitle\nAuthor:          Ann Author\nCreationDate:    Thu Mar  4 00:00:00 2021 UTC\nPages:           212\n'),
    { title: 'A Book: Subtitle', author: 'Ann Author', year: 2021, n: 212 });
  assert.deepEqual(L.parsePdfinfo('Producer: x\nPages: 3\n'), { title: null, author: null, year: null, n: 3 });
  assert.deepEqual(L.parseMdls('kMDItemAuthors              = (\n    "Ann Author",\n    "Bo Other"\n)\nkMDItemContentCreationDate  = 2019-04-05 10:00:00 +0000\nkMDItemNumberOfPages        = 48\nkMDItemTitle                = "Spotlight \\"Title\\""\n'),
    { title: 'Spotlight "Title"', author: 'Ann Author, Bo Other', year: 2019, n: 48 });
  assert.deepEqual(L.parseMdls('kMDItemAuthors = (null)\nkMDItemContentCreationDate = (null)\nkMDItemNumberOfPages = (null)\nkMDItemTitle = (null)\n'), { title: null, author: null, year: null, n: null });
  const d = tmp(); t.after(() => rmSync(d, { recursive: true, force: true }));
  writeFileSync(join(d, 'a.pdf'), makePdf({ pages: 7, title: 'Sniffed Title', date: '19991231' }));
  assert.deepEqual(L.sniffPdf(join(d, 'a.pdf')), { title: 'Sniffed Title', author: null, year: 1999, n: 7 });
});
test('folders: ":" or new lines between paths, ~ expanded, absolute, no repeats; the precedence', () => {
  const h = homedir();
  assert.deepEqual(L.parseDirs('~/A:/tmp/B\n /tmp/B \n\n"~/C D"'), [join(h, 'A'), '/tmp/B', join(h, 'C D')]);
  assert.deepEqual(L.parseDirs(['~', '']), [h]);
  assert.equal(L.parseDirs(L.ICLOUD_DEFAULT)[0], join(h, 'Library/Mobile Documents/com~apple~CloudDocs/Recent Things to Read'), '~ only at the start');
  assert.deepEqual(L.effectiveDirs(['/x'], '/y'), { dirs: ['/x'], from: 'settings' });
  assert.deepEqual(L.effectiveDirs(null, '/y:/z'), { dirs: ['/y', '/z'], from: 'env' });
  assert.deepEqual(L.effectiveDirs([], '/y'), { dirs: [], from: 'settings' }, 'an empty list saved in Settings means no folders');
  assert.ok(['default', 'none'].includes(L.effectiveDirs(null, '').from));
});
test('ids: from the folder name and the path inside it', () => {
  assert.match(L.idOf('Reading', 'Papers/a.pdf'), /^local:[0-9a-f]{20}$/);
  assert.equal(L.idOf('Reading', 'Papers/a.pdf'), L.idOf('Reading', 'Papers/a.pdf'));
  assert.notEqual(L.idOf('Reading', 'Papers/a.pdf'), L.idOf('Other', 'Papers/a.pdf'));
  assert.ok(makePng(4, 4).subarray(1, 4).toString() === 'PNG');
});
