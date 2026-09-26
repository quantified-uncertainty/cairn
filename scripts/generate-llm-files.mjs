#!/usr/bin/env node
/**
 * Generate the LLM-facing exports for a Starlight wiki app.
 *
 *   public/llms.txt       — an index: one line per chapter, with the chapter's
 *                           frontmatter description, grouped by sidebar section
 *   public/llms-full.txt  — the entire book, every chapter concatenated in
 *                           reading order, for e-readers and LLM context
 *
 * Both files are derived from the app's explicit Starlight `sidebar` in
 * astro.config.mjs, so they cannot drift from the book's structure (a
 * hand-maintained llms.txt did: its chapter numbers went stale after a
 * reordering). Site metadata comes from the app's `llms.config.json`:
 *
 *   { "name": "...", "url": "https://...", "description": "...", "intro": "..." }
 *
 * Usage, from an app directory (wired into each app's `build` script):
 *   node ../../scripts/generate-llm-files.mjs
 * or with an explicit app directory:
 *   node scripts/generate-llm-files.mjs apps/reasoning-processes
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, resolve } from 'path';

const APP = resolve(process.argv[2] ?? process.cwd());
const CONTENT_DIR = join(APP, 'src/content/docs');
const OUTPUT_DIR = join(APP, 'public');

function loadSite() {
  const path = join(APP, 'llms.config.json');
  if (!existsSync(path)) {
    throw new Error(`generate-llm-files: missing ${path}`);
  }
  const site = JSON.parse(readFileSync(path, 'utf-8'));
  for (const key of ['name', 'url', 'description']) {
    if (!site[key]) throw new Error(`generate-llm-files: llms.config.json lacks "${key}"`);
  }
  site.url = site.url.replace(/\/$/, '');
  return site;
}

/**
 * Walk the sidebar in astro.config.mjs and recover reading order. Returns
 * { type: 'part', label } for group headers, { type: 'chapter', label, slug }
 * for pages, and { type: 'planned', label } for `link:` placeholders.
 */
export function readSidebarOrder(configText) {
  const start = configText.indexOf('sidebar:');
  if (start === -1) throw new Error('generate-llm-files: no `sidebar:` in astro.config.mjs');
  const region = configText.slice(start);

  const re =
    /label:\s*'([^']+)',\s*(?:\n\s*)?collapsed:|\{\s*label:\s*'([^']+)',\s*slug:\s*'([^']+)'\s*\}|\{\s*label:\s*'([^']+)',\s*link:\s*'[^']*'\s*\}/g;

  const entries = [];
  let m;
  while ((m = re.exec(region)) !== null) {
    if (m[1] !== undefined) entries.push({ type: 'part', label: m[1] });
    else if (m[2] !== undefined) entries.push({ type: 'chapter', label: m[2], slug: m[3] });
    else entries.push({ type: 'planned', label: m[4] });
  }
  if (!entries.some((e) => e.type === 'chapter')) {
    throw new Error('generate-llm-files: sidebar parsed to zero chapters — has its syntax changed?');
  }
  return entries;
}

/** Resolve a Starlight slug to its source file (.md or .mdx, or <slug>/index). */
function resolveFile(slug) {
  for (const base of [slug, join(slug, 'index')]) {
    for (const ext of ['.md', '.mdx']) {
      const p = join(CONTENT_DIR, base + ext);
      if (existsSync(p)) return p;
    }
  }
  return null;
}

function frontmatterField(raw, field) {
  const fm = raw.match(/^---\n([\s\S]*?)\n---\n/);
  if (!fm) return null;
  const line = fm[1].match(new RegExp(`^${field}:\\s*(.*)$`, 'm'));
  if (!line) return null;
  return line[1].trim().replace(/^["']|["']$/g, '');
}

/** Strip frontmatter, imports, and JSX components down to readable prose. */
export function extractContent(raw) {
  let content = raw;
  content = content.replace(/^---\n[\s\S]*?\n---\n/, '');
  content = content.replace(/^import\s+.*?;?\s*$/gm, '');
  // Starlight admonitions (:::tip[Title] ... :::) become bold callouts
  content = content.replace(/^:::[a-z]+\[(.*)\]\s*$/gm, '**$1**');
  content = content.replace(/^:::[a-z]+\s*$/gm, '');
  content = content.replace(/^:::\s*$/gm, '');
  // Components: keep inner text, drop self-closing ones
  content = content.replace(/<([A-Z][a-zA-Z]*)[^>]*>([\s\S]*?)<\/\1>/g, '$2');
  content = content.replace(/<[A-Z][a-zA-Z]*[^>]*\/>/g, '');
  content = content.replace(/\n{3,}/g, '\n\n');
  return content.trim();
}

const estimateTokens = (text) => Math.ceil(text.length / 4);

function generate() {
  const site = loadSite();
  const order = readSidebarOrder(readFileSync(join(APP, 'astro.config.mjs'), 'utf-8'));

  let index = `# ${site.name}\n\n> ${site.description}\n\n`;
  if (site.intro) index += `${site.intro}\n\n`;

  let full = `# ${site.name} — Complete Text\n\n> ${site.description}\n>\n> This is the entire wiki concatenated into one document, in book reading order,\n> for offline reading (e-readers) and LLM context. Web version: ${site.url}\n\n`;

  const missing = [];
  let included = 0;

  for (const entry of order) {
    if (entry.type === 'part') {
      index += `\n## ${entry.label}\n\n`;
      full += `\n\n${'='.repeat(80)}\n# ${entry.label}\n${'='.repeat(80)}\n`;
      continue;
    }
    if (entry.type === 'planned') {
      index += `- ${entry.label} — planned, not yet written\n`;
      continue;
    }
    const file = resolveFile(entry.slug);
    if (!file) {
      missing.push(entry.slug);
      continue;
    }
    const raw = readFileSync(file, 'utf-8');
    const description = frontmatterField(raw, 'description');
    index += `- [${entry.label}](${site.url}/${entry.slug}/)${description ? `: ${description}` : ''}\n`;

    full += `\n\n${'-'.repeat(60)}\n## ${entry.label}\n`;
    full += `Source: ${site.url}/${entry.slug}/\n${'-'.repeat(60)}\n\n`;
    full += extractContent(raw) + '\n';
    included++;
  }

  // A sidebar entry with no file is a broken page link on the live site too;
  // fail the build rather than ship an export that silently skips it.
  if (missing.length) {
    throw new Error(`generate-llm-files: no source file for sidebar slug(s): ${missing.join(', ')}`);
  }

  index += `\n## Optional\n\n- [Complete text](${site.url}/llms-full.txt): every chapter above, concatenated in reading order\n`;
  full += `\n\n${'='.repeat(80)}\nGenerated from ${included} chapters.\nEstimated tokens: ~${Math.round(estimateTokens(full) / 1000)}K\n`;

  writeFileSync(join(OUTPUT_DIR, 'llms.txt'), index);
  writeFileSync(join(OUTPUT_DIR, 'llms-full.txt'), full);
  console.log(
    `generate-llm-files: ${site.name} — ${included} chapters → public/llms.txt, public/llms-full.txt (~${Math.round(estimateTokens(full) / 1000)}K tokens)`
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  generate();
}
