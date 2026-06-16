/**
 * Generate combined single-file exports of the whole wiki.
 *
 * Produces one document that concatenates every chapter in book order, so the
 * site can be sent to an e-reader or pasted into an LLM in one shot:
 *
 *   public/llms-full.txt  — the entire book, all chapters, plain text/markdown
 *
 * The reading order is read from the Starlight `sidebar` in astro.config.mjs,
 * so this stays in sync with the book's structure automatically.
 *
 * Run standalone, or as part of the build (see package.json):
 *   node scripts/generate-llm-files.mjs
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const CONTENT_DIR = join(ROOT, 'src/content/docs');
const OUTPUT_DIR = join(ROOT, 'public');

const SITE = {
  name: 'Evaluation Engineering',
  url: 'https://evaluation-engineering.quantifieduncertainty.org',
  description:
    'A working wiki on evaluation engineering: the discipline of designing, building, and operating systems that produce large numbers of estimates and evaluations at known cost. Maintained by QURI as part of the CAIRN project.',
};

/**
 * Walk the Starlight sidebar in astro.config.mjs to recover the book's reading
 * order. Returns a flat list of entries: { type: 'part', label } for section
 * headers, and { type: 'chapter', label, slug } for pages. Items defined with
 * `link:` (planned/external) instead of `slug:` are skipped.
 */
function readSidebarOrder() {
  const config = readFileSync(join(ROOT, 'astro.config.mjs'), 'utf-8');
  // Isolate the sidebar: [ ... ] block to avoid matching unrelated labels.
  const start = config.indexOf('sidebar:');
  const region = start === -1 ? config : config.slice(start);

  // Match either a group header (label followed by `collapsed:`) or a leaf
  // page object (label + slug), in source order.
  const re =
    /label:\s*'([^']+)',\s*(?:\n\s*)?collapsed:|\{\s*label:\s*'([^']+)',\s*slug:\s*'([^']+)'\s*\}/g;

  const entries = [];
  let m;
  while ((m = re.exec(region)) !== null) {
    if (m[1] !== undefined) {
      entries.push({ type: 'part', label: m[1] });
    } else {
      entries.push({ type: 'chapter', label: m[2], slug: m[3] });
    }
  }
  return entries;
}

/** Resolve a Starlight slug to its source file (.md or .mdx). */
function resolveFile(slug) {
  for (const ext of ['.md', '.mdx']) {
    const p = join(CONTENT_DIR, slug + ext);
    if (existsSync(p)) return p;
  }
  // index pages live at <slug>/index.md
  for (const ext of ['.md', '.mdx']) {
    const p = join(CONTENT_DIR, slug, 'index' + ext);
    if (existsSync(p)) return p;
  }
  return null;
}

/** Strip frontmatter, imports, and JSX components down to readable prose. */
function extractContent(filePath) {
  let content = readFileSync(filePath, 'utf-8');

  // Remove frontmatter
  content = content.replace(/^---\n[\s\S]*?\n---\n/, '');
  // Remove import statements
  content = content.replace(/^import\s+.*?;?\s*$/gm, '');
  // Convert Starlight admonitions (:::tip[Title] ... :::) to bold callouts
  content = content.replace(/^:::[a-z]+\[(.*)\]\s*$/gm, '**$1**');
  content = content.replace(/^:::[a-z]+\s*$/gm, '');
  content = content.replace(/^:::\s*$/gm, '');
  // Convert any remaining EntityLink-style tags to their inner text
  content = content.replace(/<([A-Z][a-zA-Z]*)[^>]*>([\s\S]*?)<\/\1>/g, '$2');
  // Drop any leftover self-closing components
  content = content.replace(/<[A-Z][a-zA-Z]*[^>]*\/>/g, '');
  // Collapse excess blank lines
  content = content.replace(/\n{3,}/g, '\n\n');

  return content.trim();
}

function estimateTokens(text) {
  return Math.ceil(text.length / 4);
}

function generateFullDoc() {
  const order = readSidebarOrder();

  let content = `# ${SITE.name} — Complete Text

> ${SITE.description}
>
> This is the entire wiki concatenated into one document, in book reading order,
> for offline reading (e-readers) and LLM context. Web version: ${SITE.url}

`;

  let included = 0;
  let skipped = 0;

  for (const entry of order) {
    if (entry.type === 'part') {
      content += `\n\n${'='.repeat(80)}\n# ${entry.label}\n${'='.repeat(80)}\n`;
      continue;
    }

    const file = resolveFile(entry.slug);
    if (!file) {
      skipped++;
      console.warn(`  ! no file for slug: ${entry.slug}`);
      continue;
    }

    const body = extractContent(file);
    content += `\n\n${'-'.repeat(60)}\n## ${entry.label}\n`;
    content += `Source: ${SITE.url}/${entry.slug}/\n${'-'.repeat(60)}\n\n`;
    content += body + '\n';
    included++;
  }

  content += `\n\n${'='.repeat(80)}\n`;
  content += `Generated from ${included} chapters` + (skipped ? ` (${skipped} skipped)` : '') + `.\n`;
  content += `Estimated tokens: ~${Math.round(estimateTokens(content) / 1000)}K\n`;

  return { content, included, skipped };
}

export function generateLLMFiles() {
  console.log('\nGenerating combined wiki export...');
  const { content, included, skipped } = generateFullDoc();
  writeFileSync(join(OUTPUT_DIR, 'llms-full.txt'), content);
  console.log(
    `  ✓ public/llms-full.txt (${included} chapters` +
      (skipped ? `, ${skipped} skipped` : '') +
      `, ~${Math.round(estimateTokens(content) / 1000)}K tokens)`
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  generateLLMFiles();
}
