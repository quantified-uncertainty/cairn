// Report text boxes that overlap each other or leave the viewBox, per visible SVG, at 1280 and 375.
const path = require('path');
const { chromium } = require(path.join(require('child_process').execSync('npm root -g').toString().trim(), 'playwright'));
(async () => {
  const b = await chromium.launch();
  for (const w of [1280, 700, 600, 375, 320]) {
    const p = await b.newPage({ viewport: { width: w, height: 900 } });
    await p.goto('file://' + path.resolve(process.argv[2]));
    const r = await p.evaluate(() => {
      const svg = [...document.querySelectorAll('figure svg')].find(s => s.getBoundingClientRect().width > 0);
      const vb = svg.viewBox.baseVal;
      const boxes = [...svg.querySelectorAll('text')].map(t => { const bb = t.getBBox(); return { s: t.textContent, x0: bb.x, x1: bb.x + bb.width, y0: bb.y, y1: bb.y + bb.height }; });
      const issues = [];
      for (const a of boxes) {
        if (a.x0 < 0 || a.x1 > vb.width || a.y0 < 0 || a.y1 > vb.height) issues.push('OUT ' + a.s + ' ' + [a.x0, a.x1, a.y0, a.y1].map(Math.round));
      }
      for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i], c = boxes[j];
        if (a.x0 < c.x1 - 1 && c.x0 < a.x1 - 1 && a.y0 < c.y1 - 1 && c.y0 < a.y1 - 1) issues.push('OVERLAP ' + a.s + ' | ' + c.s);
      }
      const rw = svg.getBoundingClientRect().width;
      return { cls: svg.getAttribute('class'), renderW: Math.round(rw), scale: +(rw / vb.width).toFixed(2), docW: document.documentElement.scrollWidth, issues,
        widths: boxes.map(a => a.s + '=' + Math.round(a.x0) + '..' + Math.round(a.x1)) };
    });
    console.log(w, JSON.stringify({ ...r, widths: process.argv[3] ? r.widths : undefined }));
  }
  await b.close();
})();
