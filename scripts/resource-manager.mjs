#!/usr/bin/env node
import 'dotenv/config';

/**
 * Resource Manager CLI
 *
 * Unified tool for managing external resource links in wiki content.
 *
 * Commands:
 *   list              List pages with unconverted links
 *   show <file>       Show unconverted links in a specific file
 *   process <file>    Convert links to <R>, creating resources as needed
 *   create <url>      Create a resource entry from a URL
 *   metadata <source> Extract metadata (arxiv|forum|scholar|web|all|stats)
 *   rebuild-citations Rebuild cited_by relationships from MDX files
 *
 * Examples:
 *   node scripts/resource-manager.mjs list --limit 20
 *   node scripts/resource-manager.mjs show bioweapons
 *   node scripts/resource-manager.mjs process bioweapons --apply
 *   node scripts/resource-manager.mjs metadata arxiv --batch 50
 *   node scripts/resource-manager.mjs metadata all
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, basename, dirname, relative } from 'path';
import { createHash } from 'crypto';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';

const CONTENT_DIR = 'src/content/docs';
const RESOURCES_FILE = 'src/data/resources.yaml';
const PAGES_FILE = 'src/data/pages.json';

// ============ Utilities ============

function hashId(str) {
  return createHash('sha256').update(str).digest('hex').slice(0, 16);
}

function loadResources() {
  const content = readFileSync(RESOURCES_FILE, 'utf-8');
  return parseYaml(content) || [];
}

function saveResources(resources) {
  const header = `# External Resources Referenced in the Knowledge Base
# ==================================================
#
# Auto-generated and manually curated.
# See src/data/schema.ts for Resource schema.

`;
  writeFileSync(RESOURCES_FILE, header + stringifyYaml(resources, { lineWidth: 100 }));
}

function loadPages() {
  return JSON.parse(readFileSync(PAGES_FILE, 'utf-8'));
}

function normalizeUrl(url) {
  const variations = new Set();
  try {
    const parsed = new URL(url);
    const base = parsed.href.replace(/\/$/, '');
    variations.add(base);
    variations.add(base + '/');
    // Without www
    if (parsed.hostname.startsWith('www.')) {
      const noWww = base.replace('://www.', '://');
      variations.add(noWww);
      variations.add(noWww + '/');
    }
    // With www
    if (!parsed.hostname.startsWith('www.')) {
      const withWww = base.replace('://', '://www.');
      variations.add(withWww);
      variations.add(withWww + '/');
    }
  } catch {
    variations.add(url);
  }
  return Array.from(variations);
}

function buildUrlToResourceMap(resources) {
  const map = new Map();
  for (const r of resources) {
    if (!r.url) continue;
    for (const url of normalizeUrl(r.url)) {
      map.set(url, r);
    }
  }
  return map;
}

function extractMarkdownLinks(content) {
  const links = [];
  const linkRegex = /(?<!!)\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g;
  let match;
  while ((match = linkRegex.exec(content)) !== null) {
    const [full, text, url] = match;
    links.push({ text, url, full, index: match.index });
  }
  return links;
}

function findMdxFiles(dir, files = []) {
  if (!existsSync(dir)) return files;
  const entries = readdirSync(dir);
  for (const entry of entries) {
    const path = join(dir, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) {
      findMdxFiles(path, files);
    } else if (entry.endsWith('.mdx')) {
      files.push(path);
    }
  }
  return files;
}

function findFileByName(name) {
  const allFiles = findMdxFiles(CONTENT_DIR);
  // Try exact match first
  let match = allFiles.find(f => basename(f, '.mdx') === name);
  if (match) return match;
  // Try partial match
  match = allFiles.find(f => f.includes(name));
  return match || null;
}

function getImportDepth(filePath) {
  const fromDir = dirname(filePath);
  const srcDir = 'src';
  const rel = relative(fromDir, srcDir);
  return rel.split('/').join('/') + '/';
}

function guessResourceType(url) {
  const domain = new URL(url).hostname.toLowerCase();
  if (domain.includes('arxiv.org')) return 'paper';
  if (domain.includes('nature.com') || domain.includes('science.org')) return 'paper';
  if (domain.includes('springer.com') || domain.includes('wiley.com')) return 'paper';
  if (domain.includes('ncbi.nlm.nih.gov') || domain.includes('pubmed')) return 'paper';
  if (domain.includes('gov') || domain.includes('government')) return 'government';
  if (domain.includes('wikipedia.org')) return 'reference';
  if (domain.includes('youtube.com') || domain.includes('youtu.be')) return 'talk';
  if (domain.includes('podcast') || domain.includes('spotify.com')) return 'podcast';
  if (domain.includes('substack.com') || domain.includes('medium.com')) return 'blog';
  if (domain.includes('forum.effectivealtruism.org')) return 'blog';
  if (domain.includes('lesswrong.com') || domain.includes('alignmentforum.org')) return 'blog';
  return 'web';
}

function parseArgs(args) {
  const opts = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].slice(2);
      const next = args[i + 1];
      if (next && !next.startsWith('--')) {
        opts[key] = isNaN(next) ? next : parseFloat(next);
        i++;
      } else {
        opts[key] = true;
      }
    } else if (!opts._cmd) {
      opts._cmd = args[i];
    } else {
      opts._args = opts._args || [];
      opts._args.push(args[i]);
    }
  }
  return opts;
}

// ============ List Command ============

function cmdList(opts) {
  const limit = opts.limit || 30;
  const minUnconv = opts['min-unconv'] || 1;

  const pages = loadPages();

  // Filter and sort by unconverted link count
  const sorted = pages
    .filter(p => (p.unconvertedLinkCount || 0) >= minUnconv)
    .sort((a, b) => (b.unconvertedLinkCount || 0) - (a.unconvertedLinkCount || 0))
    .slice(0, limit);

  console.log(`\nPages with unconverted links (min: ${minUnconv}):\n`);
  console.log('Unconv  Refs   Title');
  console.log('-'.repeat(70));

  for (const p of sorted) {
    const unconv = String(p.unconvertedLinkCount || 0).padStart(4);
    const refs = String(p.convertedLinkCount || 0).padStart(4);
    console.log(`${unconv}   ${refs}   ${p.title}`);
  }

  const total = pages.reduce((sum, p) => sum + (p.unconvertedLinkCount || 0), 0);
  const pagesWithUnconv = pages.filter(p => (p.unconvertedLinkCount || 0) > 0).length;

  console.log('\n' + '-'.repeat(70));
  console.log(`Total: ${total} unconverted links across ${pagesWithUnconv} pages`);
}

// ============ Show Command ============

function cmdShow(opts) {
  const name = opts._args?.[0];
  if (!name) {
    console.error('Usage: resource-manager.mjs show <file-name>');
    process.exit(1);
  }

  const filePath = findFileByName(name);
  if (!filePath) {
    console.error(`File not found: ${name}`);
    process.exit(1);
  }

  const content = readFileSync(filePath, 'utf-8');
  const links = extractMarkdownLinks(content);
  const resources = loadResources();
  const urlMap = buildUrlToResourceMap(resources);

  console.log(`\n📄 ${relative('.', filePath)}`);
  console.log(`   Total external links: ${links.length}\n`);

  const convertible = [];
  const needsResource = [];

  for (const link of links) {
    const resource = urlMap.get(link.url) || urlMap.get(link.url.replace(/\/$/, ''));
    if (resource) {
      convertible.push({ ...link, resource });
    } else {
      needsResource.push(link);
    }
  }

  if (convertible.length > 0) {
    console.log(`✅ Convertible (resource exists): ${convertible.length}`);
    for (const l of convertible) {
      console.log(`   [${l.text}] → <R id="${l.resource.id}">`);
    }
    console.log();
  }

  if (needsResource.length > 0) {
    console.log(`⚠️  Needs resource creation: ${needsResource.length}`);
    for (const l of needsResource) {
      const type = guessResourceType(l.url);
      console.log(`   [${l.text}] (${type})`);
      console.log(`      ${l.url}`);
    }
  }

  if (convertible.length === 0 && needsResource.length === 0) {
    console.log('No external links found.');
  }
}

// ============ Process Command ============

function cmdProcess(opts) {
  const name = opts._args?.[0];
  const dryRun = !opts.apply;
  const skipCreate = opts['skip-create'];

  if (!name) {
    console.error('Usage: resource-manager.mjs process <file-name> [--apply] [--skip-create]');
    process.exit(1);
  }

  const filePath = findFileByName(name);
  if (!filePath) {
    console.error(`File not found: ${name}`);
    process.exit(1);
  }

  let content = readFileSync(filePath, 'utf-8');
  const links = extractMarkdownLinks(content);
  let resources = loadResources();
  let urlMap = buildUrlToResourceMap(resources);

  console.log(`\n📄 ${relative('.', filePath)}`);
  console.log(`   Mode: ${dryRun ? 'DRY RUN' : 'APPLYING'}`);
  console.log(`   External links: ${links.length}\n`);

  const conversions = [];
  const newResources = [];

  for (const link of links) {
    let resource = urlMap.get(link.url) || urlMap.get(link.url.replace(/\/$/, ''));

    if (!resource && !skipCreate) {
      // Create new resource
      const id = hashId(link.url);
      const type = guessResourceType(link.url);
      resource = {
        id,
        url: link.url,
        title: link.text, // Use link text as initial title
        type,
      };
      newResources.push(resource);
      resources.push(resource);
      // Update map for any duplicate URLs
      for (const url of normalizeUrl(link.url)) {
        urlMap.set(url, resource);
      }
    }

    if (resource) {
      conversions.push({
        original: link.full,
        replacement: `<R id="${resource.id}">${link.text}</R>`,
        resource,
        isNew: newResources.includes(resource),
      });
    }
  }

  // Report new resources
  if (newResources.length > 0) {
    console.log(`📦 New resources to create: ${newResources.length}`);
    for (const r of newResources) {
      console.log(`   + ${r.id} (${r.type}): ${r.title}`);
    }
    console.log();
  }

  // Report conversions
  if (conversions.length > 0) {
    console.log(`🔄 Links to convert: ${conversions.length}`);
    for (const c of conversions) {
      const marker = c.isNew ? '(new)' : '';
      console.log(`   ${c.resource.title} ${marker}`);
    }
    console.log();
  }

  if (conversions.length === 0) {
    console.log('No links to process.');
    return;
  }

  // Apply conversions to content
  for (const c of conversions) {
    content = content.replace(c.original, c.replacement);
  }

  // Add R import if needed
  const hasRImport = /import\s*{[^}]*\bR\b[^}]*}\s*from/.test(content);
  if (!hasRImport) {
    const wikiImportRegex = /import\s*{([^}]+)}\s*from\s*['"]([^'"]*components\/wiki)['"]/;
    const wikiMatch = content.match(wikiImportRegex);
    if (wikiMatch) {
      const existingImports = wikiMatch[1];
      const newImports = existingImports.trim() + ', R';
      content = content.replace(wikiImportRegex, `import {${newImports}} from '${wikiMatch[2]}'`);
    } else {
      // Add new import after frontmatter
      const importDepth = getImportDepth(filePath);
      const importStatement = `\nimport {R} from '${importDepth}components/wiki';\n`;
      if (content.startsWith('---')) {
        const afterFirst = content.indexOf('\n') + 1;
        const closingMatch = content.slice(afterFirst).match(/\n---(?=\n|[^-]|$)/);
        if (closingMatch) {
          const insertPos = afterFirst + closingMatch.index + 4;
          content = content.slice(0, insertPos) + importStatement + content.slice(insertPos);
        }
      }
    }
  }

  // Save changes
  if (!dryRun) {
    // Save resources first
    if (newResources.length > 0) {
      saveResources(resources);
      console.log(`✅ Saved ${newResources.length} new resources to resources.yaml`);
    }

    // Save file
    writeFileSync(filePath, content);
    console.log(`✅ Updated ${relative('.', filePath)}`);

    // Remind to rebuild
    console.log('\n💡 Run `npm run build:data` to update the database.');
  } else {
    console.log('---');
    console.log('Dry run complete. Use --apply to make changes.');
  }
}

// ============ Create Command ============

function cmdCreate(opts) {
  const url = opts._args?.[0];
  const title = opts.title;
  const type = opts.type;

  if (!url) {
    console.error('Usage: resource-manager.mjs create <url> [--title "..."] [--type paper|blog|web]');
    process.exit(1);
  }

  const resources = loadResources();
  const urlMap = buildUrlToResourceMap(resources);

  // Check if already exists
  const existing = urlMap.get(url) || urlMap.get(url.replace(/\/$/, ''));
  if (existing) {
    console.log(`Resource already exists: ${existing.id}`);
    console.log(`  Title: ${existing.title}`);
    console.log(`  Type: ${existing.type}`);
    return;
  }

  const id = hashId(url);
  const resource = {
    id,
    url,
    title: title || new URL(url).hostname,
    type: type || guessResourceType(url),
  };

  resources.push(resource);

  if (!opts['dry-run']) {
    saveResources(resources);
    console.log(`✅ Created resource: ${id}`);
    console.log(`   URL: ${url}`);
    console.log(`   Title: ${resource.title}`);
    console.log(`   Type: ${resource.type}`);
    console.log('\n💡 Run `npm run build:data` to update the database.');
  } else {
    console.log('Would create resource:');
    console.log(`   ID: ${id}`);
    console.log(`   URL: ${url}`);
    console.log(`   Title: ${resource.title}`);
    console.log(`   Type: ${resource.type}`);
  }
}

// ============ Help ============

function showHelp() {
  console.log(`
Resource Manager CLI

Commands:
  list                    List pages with unconverted links
  show <file>            Show unconverted links in a file
  process <file>         Convert links to <R>, creating resources as needed
  create <url>           Create a resource entry from a URL

Options:
  --apply                Apply changes (default is dry-run)
  --limit N              Limit results (list command)
  --min-unconv N         Minimum unconverted links (list command)
  --skip-create          Don't create new resources (process command)
  --title "..."          Set resource title (create command)
  --type TYPE            Set resource type (create command)
  --dry-run              Preview without changes

Examples:
  node scripts/resource-manager.mjs list --limit 20
  node scripts/resource-manager.mjs show bioweapons
  node scripts/resource-manager.mjs process economic-labor --dry-run
  node scripts/resource-manager.mjs process economic-labor --apply
  node scripts/resource-manager.mjs create "https://arxiv.org/abs/2301.00001"
`);
}

// ============ Main ============

const opts = parseArgs(process.argv.slice(2));

switch (opts._cmd) {
  case 'list':
    cmdList(opts);
    break;
  case 'show':
    cmdShow(opts);
    break;
  case 'process':
    cmdProcess(opts);
    break;
  case 'create':
    cmdCreate(opts);
    break;
  case 'help':
  case '--help':
  case '-h':
  case undefined:
    showHelp();
    break;
  default:
    console.error(`Unknown command: ${opts._cmd}`);
    showHelp();
    process.exit(1);
}
