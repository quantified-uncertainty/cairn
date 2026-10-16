// Synthetic files for the local-folder tests (test/local-*.test.mjs and the Playwright
// check): a zip writer, a tiny PDF, an EPUB built from scratch, and a folder of them.
// Nothing here reads or copies a real document.
import { deflateRawSync } from 'zlib';
import * as zlib from 'zlib';
import { mkdirSync, writeFileSync, symlinkSync } from 'fs';
import { join, dirname } from 'path';

const CRC_T = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc32 = zlib.crc32 || ((b) => { let c = 0xffffffff; for (const x of b) c = CRC_T[(c ^ x) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; });

/** A zip archive from [[name, Buffer|string, {store}?]]; zip64: write zip64 records (sizes and offsets in extra fields), as big archives have. */
export function makeZip(entries, { zip64 = false } = {}) {
  const locals = [], centrals = [];
  let off = 0;
  for (const [name, content, opt = {}] of entries) {
    const data = Buffer.isBuffer(content) ? content : Buffer.from(content, 'utf-8');
    const store = opt.store || name === 'mimetype';
    const comp = store ? data : deflateRawSync(data);
    const nb = Buffer.from(name, 'utf-8');
    const crc = crc32(data);
    const lh = Buffer.alloc(30);
    lh.writeUInt32LE(0x04034b50, 0); lh.writeUInt16LE(20, 4); lh.writeUInt16LE(0x800, 6); lh.writeUInt16LE(store ? 0 : 8, 8);
    lh.writeUInt32LE(crc, 14); lh.writeUInt32LE(comp.length, 18); lh.writeUInt32LE(data.length, 22); lh.writeUInt16LE(nb.length, 26);
    const ch = Buffer.alloc(46);
    ch.writeUInt32LE(0x02014b50, 0); ch.writeUInt16LE(zip64 ? 45 : 20, 4); ch.writeUInt16LE(zip64 ? 45 : 20, 6); ch.writeUInt16LE(0x800, 8); ch.writeUInt16LE(store ? 0 : 8, 10);
    ch.writeUInt32LE(crc, 16); ch.writeUInt32LE(zip64 ? 0xffffffff : comp.length, 20); ch.writeUInt32LE(zip64 ? 0xffffffff : data.length, 24); ch.writeUInt16LE(nb.length, 28); ch.writeUInt32LE(zip64 ? 0xffffffff : off, 42);
    let extra = Buffer.alloc(0);
    if (zip64) { extra = Buffer.alloc(28); extra.writeUInt16LE(1, 0); extra.writeUInt16LE(24, 2); extra.writeBigUInt64LE(BigInt(data.length), 4); extra.writeBigUInt64LE(BigInt(comp.length), 12); extra.writeBigUInt64LE(BigInt(off), 20); ch.writeUInt16LE(28, 30); }
    locals.push(lh, nb, comp); centrals.push(ch, nb, extra);
    off += 30 + nb.length + comp.length;
  }
  const cd = Buffer.concat(centrals);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  if (!zip64) { end.writeUInt16LE(entries.length, 8); end.writeUInt16LE(entries.length, 10); end.writeUInt32LE(cd.length, 12); end.writeUInt32LE(off, 16); return Buffer.concat([...locals, cd, end]); }
  end.writeUInt16LE(0xffff, 8); end.writeUInt16LE(0xffff, 10); end.writeUInt32LE(0xffffffff, 12); end.writeUInt32LE(0xffffffff, 16);
  const z = Buffer.alloc(56);
  z.writeUInt32LE(0x06064b50, 0); z.writeBigUInt64LE(44n, 4); z.writeUInt16LE(45, 12); z.writeUInt16LE(45, 14);
  z.writeBigUInt64LE(BigInt(entries.length), 24); z.writeBigUInt64LE(BigInt(entries.length), 32); z.writeBigUInt64LE(BigInt(cd.length), 40); z.writeBigUInt64LE(BigInt(off), 48);
  const loc = Buffer.alloc(20);
  loc.writeUInt32LE(0x07064b50, 0); loc.writeBigUInt64LE(BigInt(off + cd.length), 8); loc.writeUInt32LE(1, 16);
  return Buffer.concat([...locals, cd, z, loc, end]);
}

/** A small valid PDF: `pages` pages, each saying "Page k" (and `words` after it), with an Info title and author. */
export function makePdf({ pages = 3, title = 'A Synthetic Test Document', author = 'Test Author', date = '20210304', words = '' } = {}) {
  const objs = [];
  const kids = [];
  const font = 3 + 2 * pages;
  objs[1] = '<< /Type /Catalog /Pages 2 0 R >>';
  for (let k = 0; k < pages; k++) {
    const p = 3 + 2 * k, c = p + 1;
    kids.push(`${p} 0 R`);
    const text = `BT /F1 28 Tf 40 330 Td (Page ${k + 1}) Tj ET` + (words ? ` BT /F1 10 Tf 40 300 Td (${words}) Tj ET` : '');
    objs[p] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 400] /Contents ${c} 0 R /Resources << /Font << /F1 ${font} 0 R >> >> >>`;
    objs[c] = `<< /Length ${text.length} >>\nstream\n${text}\nendstream`;
  }
  objs[2] = `<< /Type /Pages /Kids [${kids.join(' ')}] /Count ${pages} >>`;
  objs[font] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';
  const info = font + 1;
  objs[info] = `<< /Title (${title}) /Author (${author}) /CreationDate (D:${date}000000Z) >>`;
  let out = '%PDF-1.4\n';
  const at = [];
  for (let n = 1; n < objs.length; n++) { at[n] = out.length; out += `${n} 0 obj\n${objs[n]}\nendobj\n`; }
  const x = out.length;
  out += `xref\n0 ${objs.length}\n0000000000 65535 f \n` + at.slice(1).map((o) => String(o).padStart(10, '0') + ' 00000 n \n').join('');
  out += `trailer\n<< /Size ${objs.length} /Root 1 0 R /Info ${info} 0 R >>\nstartxref\n${x}\n%%EOF\n`;
  return Buffer.from(out, 'latin1');
}

/** A w×h RGB PNG in two colours (a checkerboard of 8-pixel squares). */
export function makePng(w = 16, h = 16, [r1, g1, b1] = [200, 60, 40], [r2, g2, b2] = [240, 230, 210]) {
  const chunk = (type, data) => { const l = Buffer.alloc(4); l.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type, 'latin1'), data]); const c = Buffer.alloc(4); c.writeUInt32BE(crc32(td)); return Buffer.concat([l, td, c]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2;
  const raw = Buffer.alloc(h * (1 + 3 * w));
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const o = y * (1 + 3 * w) + 1 + 3 * x, a = ((x >> 3) + (y >> 3)) % 2; raw[o] = a ? r1 : r2; raw[o + 1] = a ? g1 : g2; raw[o + 2] = a ? b1 : b2; }
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
export const PNG = makePng();

/** An EPUB 3 with `chapters` chapters, an image and links between chapters. */
export function makeEpub({ title = 'The Synthetic Book', author = 'Ada Example', chapters = 3, words = 120 } = {}) {
  const para = (k) => Array.from({ length: words }, (_, j) => `word${k}x${j}`).join(' ');
  const chap = (k) => `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops"><head><title>Chapter ${k}</title><link rel="stylesheet" href="../css/book.css"/><style>p{color:red}</style></head>
<body><section epub:type="chapter"><h1 id="top">Chapter ${k}</h1>
<p>Opening of chapter ${k}. ${para(k)}</p>
${k === 1 ? '<p><img src="../images/fig.png" alt="A figure"/></p><p><a href="ch2.xhtml#top">On to chapter two</a> and <a href="#top">back to the top</a>.</p><div class="empty"/><script>alert(1)</script><p onclick="alert(2)">Clickable</p>' : ''}
<p>End of chapter ${k}.</p></section></body></html>`;
  const items = Array.from({ length: chapters }, (_, j) => `<item id="c${j + 1}" href="text/ch${j + 1}.xhtml" media-type="application/xhtml+xml"/>`).join('\n    ');
  const spine = Array.from({ length: chapters }, (_, j) => `<itemref idref="c${j + 1}"/>`).join('');
  const opf = `<?xml version="1.0" encoding="utf-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="uid">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="uid">urn:uuid:00000000-0000-4000-8000-000000000000</dc:identifier>
    <dc:title>${title}</dc:title><dc:creator id="a1">${author}</dc:creator><dc:date>2019-05-01</dc:date><dc:language>en</dc:language>
  </metadata>
  <manifest>
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
    ${items}
    <item id="img" href="images/fig.png" media-type="image/png"/>
    <item id="css" href="css/book.css" media-type="text/css"/>
  </manifest>
  <spine>${spine}</spine>
</package>`;
  return makeZip([
    ['mimetype', 'application/epub+zip', { store: true }],
    ['META-INF/container.xml', '<?xml version="1.0"?><container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>'],
    ['OEBPS/content.opf', opf],
    ['OEBPS/nav.xhtml', '<html><body><nav><ol><li><a href="text/ch1.xhtml">One</a></li></ol></nav></body></html>'],
    ...Array.from({ length: chapters }, (_, j) => [`OEBPS/text/ch${j + 1}.xhtml`, chap(j + 1)]),
    ['OEBPS/images/fig.png', PNG],
    ['OEBPS/css/book.css', 'p { margin: 0 }'],
  ]);
}

export const MARKDOWN = `---
title: Notes on Synthetic Things
author: Test Author
date: 2024-02-03
---

# A heading the front matter overrides

Some *emphasis*, **strong** text, \`code\`, and a [link](https://example.org/a?b=1&c=2).

![A picture](pics/dot.png)

- one
- two
  - nested

1. first
2. second

> A quote
> over two lines.

| Name | Count |
|------|------:|
| a    | 1     |

\`\`\`js
const x = 1 < 2;
\`\`\`

## Longer notes

${Array.from({ length: 30 }, (_, k) => `Paragraph ${k + 1} of the longer notes. ` + Array.from({ length: 50 }, (_, j) => `note${k + 1}w${j}`).join(' ') + '.').join('\n\n')}
`;

const put = (f, data) => { mkdirSync(dirname(f), { recursive: true }); writeFileSync(f, data); };
/**
 * The synthetic folder the index, API and browser tests read:
 *   Root.pdf, Papers/{Alpha paper.pdf, beta_notes.md, pics/dot.png}, Books/{Synthetic Book.epub, plain.txt},
 *   Books/Deep/Deeper/inner.pdf, Maps/{a.png, b.png} (a gallery), Papers/.Later.pdf.icloud (not downloaded),
 *   .hidden.pdf, .DS_Store, empty.pdf, Archive.zip next to Archive/ (left out), Lone.zip, partial.pdf.crdownload, page.html
 */
export function makeFolder(dir, { links = true } = {}) {
  put(join(dir, 'Root.pdf'), makePdf({ pages: 2, title: 'Root Level Paper' }));
  put(join(dir, 'Papers', 'Alpha paper.pdf'), makePdf({ pages: 5, title: 'Untitled', author: 'Administrator', date: '20190101' }));
  put(join(dir, 'Papers', 'beta_notes.md'), MARKDOWN);
  put(join(dir, 'Papers', 'pics', 'dot.png'), PNG);
  put(join(dir, 'Papers', '.Later.pdf.icloud'), Buffer.from('bplist00 placeholder'));
  put(join(dir, 'Books', 'Synthetic Book.epub'), makeEpub({ words: 400 }));
  put(join(dir, 'Books', 'plain.txt'), 'Title: A Plain Text\nAuthor: Someone Plain\n\nFirst paragraph of plain text.\n\nSecond paragraph.\n');
  put(join(dir, 'Books', 'Deep', 'Deeper', 'inner.pdf'), makePdf({ pages: 1, title: 'Inner Paper' }));
  put(join(dir, 'Maps', 'a.png'), PNG);
  put(join(dir, 'Maps', 'b.png'), PNG);
  put(join(dir, '.hidden.pdf'), makePdf({ pages: 1 }));
  put(join(dir, '.DS_Store'), Buffer.alloc(64, 1));
  put(join(dir, 'empty.pdf'), Buffer.alloc(0));
  put(join(dir, 'Archive.zip'), makeZip([['x.txt', 'x']]));
  put(join(dir, 'Archive', 'x.txt'), 'x');
  put(join(dir, 'Lone.zip'), makeZip([['y.txt', 'y']]));
  put(join(dir, 'partial.pdf.crdownload'), Buffer.alloc(10, 1));
  put(join(dir, 'page.html'), '<html><head><title>A Local Page</title><script>window.bad = 1</script></head><body><h1>Local page</h1><p onmouseover="x()">Hello <a href="javascript:alert(1)">bad</a> <a href="Papers/beta_notes.md">notes</a> <img src="Papers/pics/dot.png"></p></body></html>');
  if (links) { try { symlinkSync('/etc', join(dir, 'escape')); } catch { /* no symlinks here */ } }
  return dir;
}

/** Words for a document long enough to take several pages. */
const prose = (k, n) => Array.from({ length: n }, (_, j) => `bundle${k}w${j}`).join(' ');
/**
 * Bundles (docs/authoring.md): folders that are one document each.
 *   Field Report.stack/  index.md (front matter, figures in assets/ and images/deep/, TeX), cover.png,
 *                        notes/draft.md and assets/ (two pictures: a gallery anywhere else)
 *   site-export/         index.html (head metadata, a script, handlers, MathML, a pandoc math span),
 *                        images/{chart.png, b.png}, stack.json (a new title, tags, the cover)
 *   Loose.stack/         article.md only (no index file)
 *   Empty.stack/         a picture only
 *   plain/               notes.md (an ordinary folder, for contrast)
 */
export function makeBundles(dir, { links = true } = {}) {
  const rep = join(dir, 'Field Report.stack');
  put(join(rep, 'index.md'), `---
title: "A Field Report on Synthetic Stacks"
authors:
  - Ada Example
  - Bo Sample
date: 2025-07-14
source: https://example.org/field-report
summary: What happens when a folder is one document.
tags: [Synthetic Testing, bundles]
---

# A Field Report on Synthetic Stacks

Opening paragraph of the field report. ${prose(0, 60)}

![Figure 1: a wide checkerboard](assets/fig-1.png)

Inline math $a^2 + b^2 = c^2$ and a price of $5 and $10 that stays text.

$$\\int_0^1 x\\,dx = \\tfrac12$$

${Array.from({ length: 14 }, (_, k) => `## Section ${k + 1}\n\n${prose(k + 1, 170)}.\n\n${k === 3 ? '![Figure 2: a square](assets/fig-2.png)\n\n' : ''}${k === 8 ? '![Figure 3: from a subfolder](images/deep/fig-3.png)\n\n' : ''}`).join('')}
Closing paragraph of the field report.
`);
  put(join(rep, 'cover.png'), makePng(120, 160));
  put(join(rep, 'assets', 'fig-1.png'), makePng(640, 360));
  put(join(rep, 'assets', 'fig-2.png'), makePng(400, 400, [40, 90, 200]));
  put(join(rep, 'images', 'deep', 'fig-3.png'), makePng(300, 200, [30, 150, 60]));
  put(join(rep, 'notes', 'draft.md'), '# A Draft Inside The Bundle\n\nNot a Library item.\n');
  const site = join(dir, 'site-export');
  put(join(site, 'index.html'), `<!doctype html><html><head><meta charset="utf-8"><title>An Exported Site Page</title>
<meta name="author" content="Cy Writer"><meta name="author" content="Di Editor"><meta name="dcterms.date" content="2024-11-02">
<meta name="description" content="A page exported with its pictures."><meta name="keywords" content="exports, html">
<link rel="canonical" href="https://example.org/exported"><script>window.bad = 1</script><style>p { color: red }</style></head>
<body><h1>An Exported Site Page</h1><p>First paragraph of the exported page.</p>
<figure><img src="images/chart.png" alt="A chart" onerror="alert(1)"><figcaption>Figure 1. A chart.</figcaption></figure>
<p><a href="javascript:alert(2)">bad link</a> <a href="#sec">inside</a> <a href="https://example.org/">outside</a></p>
<p>MathML: <math><mi>x</mi><mo>=</mo><mn>2</mn></math> and <span class="math inline">\\(y^2\\)</span>.</p>
<p><img src="images/b.png" alt="A second picture" width="50" height="25"></p></body></html>`);
  put(join(site, 'images', 'chart.png'), makePng(800, 500));
  put(join(site, 'images', 'b.png'), makePng(64, 32));
  put(join(site, 'stack.json'), JSON.stringify({ title: 'The Exported Site, Retitled', tags: ['Forecasting', 'AI Safety'], cover: 'images/chart.png' }));
  put(join(dir, 'Loose.stack', 'article.md'), '# The Loose Article\n\nA bundle without an index file.\n');
  put(join(dir, 'Empty.stack', 'only.png'), PNG);
  put(join(dir, 'plain', 'notes.md'), '# Plain Notes\n\nAn ordinary folder.\n');
  if (links) { try { symlinkSync('/etc/hostname', join(rep, 'assets', 'escape.png')); } catch { /* no symlinks here */ } }
  return dir;
}
