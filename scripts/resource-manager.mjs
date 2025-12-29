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

// ============ Metadata Extraction ============

/**
 * Extract ArXiv ID from URL
 */
function extractArxivId(url) {
  const patterns = [
    /arxiv\.org\/(?:abs|pdf|html)\/(\d+\.\d+)(?:v\d+)?/,
    /arxiv\.org\/(?:abs|pdf|html)\/([a-z-]+\/\d+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

/**
 * Fetch metadata from ArXiv API
 */
async function fetchArxivBatch(arxivIds) {
  const idList = arxivIds.join(',');
  const url = `http://export.arxiv.org/api/query?id_list=${idList}&max_results=${arxivIds.length}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`ArXiv API error: ${response.status}`);
  const xml = await response.text();

  const results = new Map();
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
  let match;

  while ((match = entryRegex.exec(xml)) !== null) {
    const entry = match[1];
    const idMatch = entry.match(/<id>https?:\/\/arxiv\.org\/abs\/([^<]+)<\/id>/);
    if (!idMatch) continue;
    const id = idMatch[1].replace(/v\d+$/, '');

    const authors = [];
    const authorRegex = /<author>[\s\S]*?<name>([^<]+)<\/name>[\s\S]*?<\/author>/g;
    let authorMatch;
    while ((authorMatch = authorRegex.exec(entry)) !== null) {
      authors.push(authorMatch[1].trim());
    }

    const publishedMatch = entry.match(/<published>([^<]+)<\/published>/);
    const summaryMatch = entry.match(/<summary>([\s\S]*?)<\/summary>/);

    results.set(id, {
      authors,
      published: publishedMatch ? publishedMatch[1].split('T')[0] : null,
      abstract: summaryMatch ? summaryMatch[1].replace(/\s+/g, ' ').trim() : null,
    });
  }
  return results;
}

/**
 * Extract ArXiv metadata for resources
 */
async function extractArxivMetadata(opts) {
  const batch = opts.batch || 100;
  const dryRun = opts['dry-run'];
  const verbose = opts.verbose;
  const skipSave = opts._skipSave;

  if (!opts._skipSave) console.log('📚 ArXiv Metadata Extractor');
  if (dryRun && !opts._skipSave) console.log('   DRY RUN');

  const resources = opts._resources || loadResources();
  const arxivResources = resources.filter(r => {
    if (!r.url || !r.url.includes('arxiv.org')) return false;
    if (r.authors && r.authors.length > 0) return false;
    return extractArxivId(r.url) !== null;
  });

  console.log(`   Found ${arxivResources.length} ArXiv papers without metadata`);

  const toProcess = arxivResources.slice(0, batch);
  if (toProcess.length === 0) {
    console.log('   ✅ All ArXiv papers have metadata');
    return 0;
  }

  const idToResource = new Map();
  for (const r of toProcess) {
    const arxivId = extractArxivId(r.url);
    if (arxivId) idToResource.set(arxivId, r);
  }

  const allIds = Array.from(idToResource.keys());
  let updated = 0;

  for (let i = 0; i < allIds.length; i += 20) {
    const batchIds = allIds.slice(i, i + 20);
    try {
      const metadata = await fetchArxivBatch(batchIds);
      for (const [arxivId, meta] of metadata) {
        const resource = idToResource.get(arxivId);
        if (!resource) continue;
        if (meta.authors?.length > 0) resource.authors = meta.authors;
        if (meta.published) resource.published_date = meta.published;
        if (meta.abstract && !resource.abstract) resource.abstract = meta.abstract;
        updated++;
        if (verbose) console.log(`   ✓ ${resource.title}`);
      }
      if (i + 20 < allIds.length) await sleep(3000);
    } catch (err) {
      console.error(`   Error: ${err.message}`);
    }
  }

  if (!opts._skipSave) console.log(`   ✅ Updated ${updated} papers`);

  if (!dryRun && updated > 0 && !opts._skipSave) {
    saveResources(resources);
    console.log('   Saved resources.yaml');
  }
  return updated;
}

/**
 * Extract forum post slug
 */
function extractForumSlug(url) {
  const match = url.match(/(?:lesswrong\.com|alignmentforum\.org|forum\.effectivealtruism\.org)\/posts\/([a-zA-Z0-9]+)/);
  return match ? match[1] : null;
}

/**
 * Fetch forum metadata via GraphQL
 */
async function fetchForumMetadata(postId, isEAForum) {
  const endpoint = isEAForum
    ? 'https://forum.effectivealtruism.org/graphql'
    : 'https://www.lesswrong.com/graphql';

  const query = `query { post(input: {selector: {_id: "${postId}"}}) { result { title postedAt user { displayName } coauthors { displayName } } } }`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) return null;
  const data = await response.json();
  const post = data?.data?.post?.result;
  if (!post) return null;

  const authors = [post.user?.displayName];
  if (post.coauthors) authors.push(...post.coauthors.map(c => c.displayName));

  return {
    title: post.title,
    authors: authors.filter(Boolean),
    published: post.postedAt ? post.postedAt.split('T')[0] : null,
  };
}

/**
 * Extract forum metadata for resources
 */
async function extractForumMetadata(opts) {
  const batch = opts.batch || 100;
  const dryRun = opts['dry-run'];
  const verbose = opts.verbose;

  if (!opts._skipSave) console.log('📝 Forum Metadata Extractor (LW/AF/EAF)');
  if (dryRun && !opts._skipSave) console.log('   DRY RUN');

  const resources = opts._resources || loadResources();
  const forumResources = resources.filter(r => {
    if (!r.url) return false;
    if (r.authors && r.authors.length > 0) return false;
    return extractForumSlug(r.url) !== null;
  });

  console.log(`   Found ${forumResources.length} forum posts without metadata`);

  const toProcess = forumResources.slice(0, batch);
  if (toProcess.length === 0) {
    console.log('   ✅ All forum posts have metadata');
    return 0;
  }

  let updated = 0;
  for (const r of toProcess) {
    const slug = extractForumSlug(r.url);
    const isEA = r.url.includes('forum.effectivealtruism.org');
    try {
      const meta = await fetchForumMetadata(slug, isEA);
      if (meta?.authors?.length > 0) {
        r.authors = meta.authors;
        if (meta.published) r.published_date = meta.published;
        updated++;
        if (verbose) console.log(`   ✓ ${r.title}`);
      }
      await sleep(200);
    } catch (err) {
      if (verbose) console.log(`   ✗ ${r.title}: ${err.message}`);
    }
  }

  if (!opts._skipSave) console.log(`   ✅ Updated ${updated} posts`);

  if (!dryRun && updated > 0 && !opts._skipSave) {
    saveResources(resources);
    console.log('   Saved resources.yaml');
  }
  return updated;
}

/**
 * Extract DOI from URL
 */
function extractDOI(url) {
  // Match DOI patterns
  const patterns = [
    /doi\.org\/(10\.\d{4,}\/[^\s]+)/,
    /nature\.com\/articles\/([^\s?#]+)/,
    /science\.org\/doi\/(10\.\d{4,}\/[^\s]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

/**
 * Fetch metadata from Semantic Scholar API
 */
async function fetchSemanticScholarMetadata(identifier) {
  const url = `https://api.semanticscholar.org/graph/v1/paper/${identifier}?fields=title,authors,year,abstract,publicationDate`;
  const response = await fetch(url);
  if (!response.ok) return null;
  const data = await response.json();
  if (!data) return null;

  return {
    title: data.title,
    authors: data.authors?.map(a => a.name) || [],
    published: data.publicationDate || (data.year ? `${data.year}` : null),
    abstract: data.abstract,
  };
}

/**
 * Check if URL could have Semantic Scholar data
 */
function isScholarlyUrl(url) {
  const scholarlyDomains = [
    'nature.com', 'science.org', 'springer.com', 'wiley.com',
    'sciencedirect.com', 'plos.org', 'pnas.org', 'cell.com',
    'ncbi.nlm.nih.gov', 'pubmed', 'doi.org', 'ssrn.com',
    'aeaweb.org', 'jstor.org', 'tandfonline.com'
  ];
  return scholarlyDomains.some(d => url.includes(d));
}

/**
 * Extract Semantic Scholar metadata for resources
 */
async function extractScholarMetadata(opts) {
  const batch = opts.batch || 50;
  const dryRun = opts['dry-run'];
  const verbose = opts.verbose;

  if (!opts._skipSave) console.log('🎓 Semantic Scholar Metadata Extractor');
  if (dryRun && !opts._skipSave) console.log('   DRY RUN');

  const resources = opts._resources || loadResources();

  // Find scholarly resources without authors
  const scholarResources = resources.filter(r => {
    if (!r.url) return false;
    if (r.authors && r.authors.length > 0) return false;
    if (r.url.includes('arxiv.org')) return false; // ArXiv handled separately
    return isScholarlyUrl(r.url);
  });

  console.log(`   Found ${scholarResources.length} scholarly resources without metadata`);

  const toProcess = scholarResources.slice(0, batch);
  if (toProcess.length === 0) {
    console.log('   ✅ All scholarly resources have metadata');
    return 0;
  }

  let updated = 0;
  let failed = 0;

  for (const r of toProcess) {
    // Try DOI first
    let doi = extractDOI(r.url);

    // For nature.com, construct DOI
    if (!doi && r.url.includes('nature.com/articles/')) {
      const match = r.url.match(/nature\.com\/articles\/([^?#]+)/);
      if (match) doi = `10.1038/${match[1]}`;
    }

    if (!doi) {
      failed++;
      continue;
    }

    try {
      const meta = await fetchSemanticScholarMetadata(doi);
      if (meta?.authors?.length > 0) {
        r.authors = meta.authors;
        if (meta.published) r.published_date = meta.published;
        if (meta.abstract && !r.abstract) r.abstract = meta.abstract;
        updated++;
        if (verbose) console.log(`   ✓ ${r.title}`);
      } else {
        failed++;
      }
      await sleep(100); // Rate limit
    } catch (err) {
      failed++;
      if (verbose) console.log(`   ✗ ${r.title}: ${err.message}`);
    }
  }

  if (!opts._skipSave) console.log(`   ✅ Updated ${updated} resources (${failed} failed/no data)`);

  if (!dryRun && updated > 0 && !opts._skipSave) {
    saveResources(resources);
    console.log('   Saved resources.yaml');
  }
  return updated;
}

/**
 * Extract metadata using Firecrawl for general web pages
 */
async function extractWebMetadata(opts) {
  const batch = opts.batch || 20;
  const dryRun = opts['dry-run'];
  const verbose = opts.verbose;

  if (!opts._skipSave) console.log('🔥 Web Metadata Extractor (Firecrawl)');

  const FIRECRAWL_KEY = process.env.FIRECRAWL_KEY;
  if (!FIRECRAWL_KEY) {
    if (!opts._skipSave) console.log('   ⚠️  FIRECRAWL_KEY not set in .env - skipping');
    return 0;
  }

  if (dryRun && !opts._skipSave) console.log('   DRY RUN');

  const resources = opts._resources || loadResources();

  // Find web resources without authors (excluding those handled by other extractors)
  const webResources = resources.filter(r => {
    if (!r.url) return false;
    if (r.authors && r.authors.length > 0) return false;
    if (r.url.includes('arxiv.org')) return false;
    if (extractForumSlug(r.url)) return false;
    if (isScholarlyUrl(r.url)) return false;
    if (r.url.includes('wikipedia.org')) return false;
    if (r.url.includes('github.com')) return false;
    return true;
  });

  console.log(`   Found ${webResources.length} web resources without metadata`);

  const toProcess = webResources.slice(0, batch);
  if (toProcess.length === 0) {
    console.log('   ✅ All processable web resources have metadata');
    return 0;
  }

  // Dynamic import for Firecrawl
  let FirecrawlApp;
  try {
    const module = await import('@mendable/firecrawl-js');
    FirecrawlApp = module.default;
  } catch {
    console.log('   ⚠️  @mendable/firecrawl-js not installed');
    return 0;
  }

  const firecrawl = new FirecrawlApp({ apiKey: FIRECRAWL_KEY });
  let updated = 0;

  for (const r of toProcess) {
    try {
      const result = await firecrawl.scrape(r.url, { formats: ['markdown'] });
      const metadata = result.metadata || {};

      // Extract authors from various metadata fields
      const authorFields = ['author', 'authors', 'DC.Contributor', 'DC.Creator', 'article:author', 'og:article:author'];
      let authors = null;
      for (const field of authorFields) {
        const value = metadata[field];
        if (value) {
          if (Array.isArray(value)) {
            authors = value.filter(a => a && typeof a === 'string');
          } else if (typeof value === 'string') {
            authors = value.includes(',') ? value.split(',').map(a => a.trim()) : [value];
          }
          if (authors?.length > 0) break;
        }
      }

      const publishedDate = metadata.publishedTime || metadata.datePublished || metadata.article?.publishedTime;

      if (authors?.length > 0) {
        r.authors = authors;
        updated++;
        if (verbose) console.log(`   ✓ ${r.title} (authors: ${authors.join(', ')})`);
      }
      if (publishedDate) {
        r.published_date = publishedDate.split('T')[0];
        if (!authors?.length) updated++; // Count if we got date but not authors
        if (verbose && !authors?.length) console.log(`   ✓ ${r.title} (date: ${publishedDate})`);
      }

      await sleep(7000); // Firecrawl rate limit
    } catch (err) {
      if (verbose) console.log(`   ✗ ${r.title}: ${err.message}`);
      if (err.message?.includes('Rate limit')) {
        console.log('   Waiting for rate limit...');
        await sleep(60000);
      }
    }
  }

  if (!opts._skipSave) console.log(`   ✅ Updated ${updated} resources`);

  if (!dryRun && updated > 0 && !opts._skipSave) {
    saveResources(resources);
    console.log('   Saved resources.yaml');
  }
  return updated;
}

/**
 * Show metadata statistics
 */
function showMetadataStats() {
  console.log('📊 Resource Metadata Statistics\n');

  const resources = loadResources();
  const total = resources.length;
  const withAuthors = resources.filter(r => r.authors?.length > 0).length;
  const withDate = resources.filter(r => r.published_date).length;
  const withAbstract = resources.filter(r => r.abstract).length;
  const withSummary = resources.filter(r => r.summary).length;

  console.log(`Total resources: ${total}`);
  console.log(`With authors: ${withAuthors} (${Math.round(withAuthors/total*100)}%)`);
  console.log(`With date: ${withDate} (${Math.round(withDate/total*100)}%)`);
  console.log(`With abstract: ${withAbstract} (${Math.round(withAbstract/total*100)}%)`);
  console.log(`With summary: ${withSummary} (${Math.round(withSummary/total*100)}%)`);

  // Count by extractable source
  const arxiv = resources.filter(r => r.url?.includes('arxiv.org') && !r.authors?.length).length;
  const forum = resources.filter(r => extractForumSlug(r.url) && !r.authors?.length).length;
  const scholarly = resources.filter(r => r.url && isScholarlyUrl(r.url) && !r.url.includes('arxiv.org') && !r.authors?.length).length;
  const web = resources.filter(r => r.url && !r.authors?.length && !r.url.includes('arxiv.org') && !extractForumSlug(r.url) && !isScholarlyUrl(r.url)).length;

  console.log('\nPending extraction:');
  console.log(`  ArXiv: ${arxiv}`);
  console.log(`  Forums (LW/AF/EAF): ${forum}`);
  console.log(`  Scholarly (Semantic Scholar): ${scholarly}`);
  console.log(`  Web (Firecrawl): ${web}`);

  // Top domains without metadata
  const domains = {};
  for (const r of resources.filter(r => r.url && !r.authors?.length)) {
    try {
      const domain = new URL(r.url).hostname.replace('www.', '');
      domains[domain] = (domains[domain] || 0) + 1;
    } catch {}
  }
  const sorted = Object.entries(domains).sort((a, b) => b[1] - a[1]).slice(0, 10);

  console.log('\nTop domains without metadata:');
  for (const [domain, count] of sorted) {
    console.log(`  ${count.toString().padStart(4)} ${domain}`);
  }
}

/**
 * Main metadata command router
 */
async function cmdMetadata(opts) {
  const source = opts._args?.[0];
  const parallel = opts.parallel;

  if (!source || source === 'stats') {
    showMetadataStats();
    return;
  }

  if (!['arxiv', 'forum', 'scholar', 'web', 'all', 'stats'].includes(source)) {
    console.error(`Unknown source: ${source}`);
    console.log('Valid sources: arxiv, forum, scholar, web, all, stats');
    process.exit(1);
  }

  let totalUpdated = 0;

  if (source === 'all' && parallel) {
    // Run all extractors in parallel (they use different APIs)
    // Load resources once, pass to all, save once at end
    console.log('🚀 Running all extractors in parallel...\n');

    const resources = loadResources();
    const sharedOpts = { ...opts, _resources: resources, _skipSave: true };

    const results = await Promise.allSettled([
      extractArxivMetadata(sharedOpts),
      extractForumMetadata(sharedOpts),
      extractScholarMetadata(sharedOpts),
      extractWebMetadata(sharedOpts),
    ]);

    const labels = ['ArXiv', 'Forum', 'Scholar', 'Web'];
    results.forEach((r, i) => {
      if (r.status === 'fulfilled') {
        console.log(`✅ ${labels[i]}: ${r.value} updated`);
        totalUpdated += r.value;
      } else {
        console.log(`❌ ${labels[i]}: ${r.reason?.message || 'failed'}`);
      }
    });

    // Save once at the end
    if (totalUpdated > 0 && !opts['dry-run']) {
      saveResources(resources);
      console.log('\n📁 Saved resources.yaml');
    }
  } else {
    // Sequential execution
    if (source === 'arxiv' || source === 'all') {
      totalUpdated += await extractArxivMetadata(opts);
      console.log();
    }

    if (source === 'forum' || source === 'all') {
      totalUpdated += await extractForumMetadata(opts);
      console.log();
    }

    if (source === 'scholar' || source === 'all') {
      totalUpdated += await extractScholarMetadata(opts);
      console.log();
    }

    if (source === 'web' || source === 'all') {
      totalUpdated += await extractWebMetadata(opts);
      console.log();
    }
  }

  if (totalUpdated > 0 && !opts['dry-run']) {
    console.log('\n💡 Run `npm run build:data` to update the database.');
  }
}

// ============ Rebuild Citations ============

async function cmdRebuildCitations(opts) {
  const dryRun = opts['dry-run'];

  console.log('🔗 Rebuilding cited_by relationships');
  if (dryRun) console.log('   DRY RUN');

  const resources = loadResources();
  const resourceMap = new Map();
  for (const r of resources) {
    r.cited_by = [];
    resourceMap.set(r.id, r);
  }

  const files = findMdxFiles(CONTENT_DIR);
  const rComponentRegex = /<R\s+id="([^"]+)"/g;
  let totalCitations = 0;

  for (const filePath of files) {
    const content = readFileSync(filePath, 'utf-8');
    const articleId = basename(filePath, '.mdx');
    if (articleId === 'index') continue;

    const ids = new Set();
    let match;
    while ((match = rComponentRegex.exec(content)) !== null) {
      ids.add(match[1]);
    }

    for (const id of ids) {
      const resource = resourceMap.get(id);
      if (resource && !resource.cited_by.includes(articleId)) {
        resource.cited_by.push(articleId);
        totalCitations++;
      }
    }
  }

  // Clean up empty cited_by arrays
  for (const r of resources) {
    if (r.cited_by.length === 0) delete r.cited_by;
  }

  const withCited = resources.filter(r => r.cited_by?.length > 0).length;
  console.log(`   Resources with citations: ${withCited}`);
  console.log(`   Total citations: ${totalCitations}`);

  if (!dryRun) {
    saveResources(resources);
    console.log('   Saved resources.yaml');
    console.log('\n💡 Run `npm run build:data` to update the database.');
  }
}

// ============ Utility ============

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
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
  metadata <source>      Extract metadata from resources
  rebuild-citations      Rebuild cited_by from MDX files

Metadata Sources:
  arxiv                  ArXiv papers (free API)
  forum                  LessWrong/AlignmentForum/EA Forum (GraphQL)
  scholar                Nature, Science, etc. (Semantic Scholar API)
  web                    General web pages (Firecrawl - requires API key)
  all                    Run all extractors
  stats                  Show metadata statistics

Options:
  --apply                Apply changes (default is dry-run for process)
  --batch N              Batch size for metadata extraction (default: varies)
  --limit N              Limit results (list command)
  --min-unconv N         Minimum unconverted links (list command)
  --skip-create          Don't create new resources (process command)
  --title "..."          Set resource title (create command)
  --type TYPE            Set resource type (create command)
  --dry-run              Preview without changes
  --verbose              Show detailed output

Examples:
  node scripts/resource-manager.mjs list --limit 20
  node scripts/resource-manager.mjs show bioweapons
  node scripts/resource-manager.mjs process economic-labor --apply
  node scripts/resource-manager.mjs metadata stats
  node scripts/resource-manager.mjs metadata arxiv --batch 50
  node scripts/resource-manager.mjs metadata all
  node scripts/resource-manager.mjs rebuild-citations
`);
}

// ============ Main ============

const opts = parseArgs(process.argv.slice(2));

async function main() {
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
    case 'metadata':
      await cmdMetadata(opts);
      break;
    case 'rebuild-citations':
      await cmdRebuildCitations(opts);
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
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
