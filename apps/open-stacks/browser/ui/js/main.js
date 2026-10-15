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
import { boot } from './chrome.js';

try {
  const f = await (await fetch('/features.json')).json();
  for (const c of f.css || []) document.head.append(h('link', { rel: 'stylesheet', href: '/' + c }));
  for (const m of f.js || []) {
    try { await import('/' + m); } catch (e) { console.error('feature failed to load:', m, e); }
  }
} catch { /* no features */ }
await boot();
