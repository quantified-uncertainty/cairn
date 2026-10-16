// mu-render.js: one MuPDF command per process, for server/pdfnative.mjs (docs/performance/prerender.md, 2.4).
//   mutool run mu-render.js info <file>                     -> {"n":N,"pages":[{"w":pt,"h":pt},...]}
//   mutool run mu-render.js render <file> <k> <w> <out> [q] -> {"w":px,"h":px,"pw":pt,"ph":pt}
// MuPDF's page bounds are the crop box with /Rotate applied, y down: the page as pdf.js shows it.
// render draws page k (0-based), without annotations, to fit 0.85*w wide and w tall (render.js RENDER_H), and writes a JPEG
// to <out> (the caller passes a temporary name and renames it). mutool draw writes no JPEG in 1.23,
// so this goes through the scripting API (Appendix B measured saveAsJPEG at about 325 ms a page).
var a = scriptArgs, op = a[0], d = Document.openDocument(a[1]);
if (d.needsPassword() && !d.authenticatePassword('')) throw new Error('encrypted');
if (op === 'info') {
  var n = d.countPages(), pages = [];
  for (var i = 0; i < n; i++) { var b = d.loadPage(i).getBounds(); pages.push({ w: b[2] - b[0], h: b[3] - b[1] }); }
  print(JSON.stringify({ n: n, pages: pages }));
} else if (op === 'render') {
  var k = Number(a[2]), W = Number(a[3]), q = Number(a[5] || 80);
  if (!(k >= 0 && k < d.countPages())) throw new Error('no page ' + k);
  var page = d.loadPage(k), bb = page.getBounds(), pw = bb[2] - bb[0], ph = bb[3] - bb[1];
  var s = Math.min((0.85 * W) / pw, W / ph);
  var pix = page.toPixmap(Matrix.concat(Matrix.translate(-bb[0], -bb[1]), Matrix.scale(s, s)), ColorSpace.DeviceRGB, false, false); // no annotations: link boxes, as pdf.js's canvas
  pix.saveAsJPEG(a[4], q);
  print(JSON.stringify({ w: pix.getWidth(), h: pix.getHeight(), pw: pw, ph: ph }));
} else throw new Error('unknown op ' + op);
