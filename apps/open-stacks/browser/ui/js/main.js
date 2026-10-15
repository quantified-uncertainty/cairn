// Stacks Browser: load the core modules, then any feature modules the server
// lists (ui/js/features/*.js, ui/features/*.css), then start.
import { h } from './util.js';
import './corpus.js';
import './state.js';
import './feed.js';
import './nav.js';
import './panel.js';
import './summary.js';
import './notes.js';
import './text.js';
import './wall.js';
import './search.js';
import './riffle.js';
import './route.js';
import './stack.js';
import './header.js';
import { boot } from './chrome.js';

// One feature failing (or waiting on something that never comes) must not keep the
// others from loading: each gets 4 s, and failures are named in a notice after start.
const failed = [];
try {
  const f = await (await fetch('/features.json')).json();
  for (const c of f.css || []) document.head.append(h('link', { rel: 'stylesheet', href: '/' + c }));
  for (const m of f.js || []) {
    const name = m.replace(/^.*\/|\.js$/g, '');
    const load = import('/' + m).catch((e) => { console.error('feature failed to load:', m, e); failed.push(name); });
    const slow = new Promise((r) => setTimeout(() => r('slow'), 4000));
    if ((await Promise.race([load, slow])) === 'slow') console.warn('feature slow to load, going on without waiting:', m);
  }
} catch { /* no features */ }
window.__featuresFailed = failed;
await boot();
if (failed.length) import('./util.js').then(({ toast }) => toast(`${failed.length === 1 ? 'A feature' : failed.length + ' features'} did not load`, { icon: 'circle-alert', kind: 'bad', sub: `${failed.join(', ')} · details in the browser console (⌥⌘K in Firefox)` }));
