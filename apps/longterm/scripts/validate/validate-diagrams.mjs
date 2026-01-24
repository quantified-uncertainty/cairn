#!/usr/bin/env node

/**
 * Validate generated Mermaid diagrams
 */

import mermaid from 'mermaid';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

mermaid.initialize({ startOnLoad: false });

const dir = 'internal';
const files = readdirSync(dir).filter(f => f.endsWith('.mmd'));

console.log(`Validating ${files.length} Mermaid files...\n`);

let passed = 0;
let failed = 0;

for (const file of files) {
  const content = readFileSync(join(dir, file), 'utf-8');
  // Remove comments
  const code = content.split('\n').filter(l => !l.trim().startsWith('%%')).join('\n').trim();
  
  try {
    await mermaid.parse(code);
    console.log(`✓ ${file}`);
    passed++;
  } catch (err) {
    console.log(`✗ ${file}: ${err.message || err}`);
    failed++;
  }
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
