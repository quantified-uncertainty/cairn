#!/usr/bin/env node
/**
 * Add Key Links section to existing wiki pages
 *
 * Usage: node scripts/content/add-key-links.mjs [--dry-run] [file1.mdx file2.mdx ...]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');

// Import the canonical links finder
import { perplexityResearch } from '../lib/openrouter.mjs';

const CANONICAL_DOMAINS = [
  { domain: 'en.wikipedia.org', name: 'Wikipedia', priority: 1 },
  { domain: 'www.wikidata.org', name: 'Wikidata', priority: 2 },
  { domain: 'lesswrong.com', name: 'LessWrong', priority: 3 },
  { domain: 'forum.effectivealtruism.org', name: 'EA Forum', priority: 3 },
  { domain: 'www.britannica.com', name: 'Britannica', priority: 4 },
  { domain: 'arxiv.org', name: 'arXiv', priority: 5 },
  { domain: 'twitter.com', name: 'Twitter/X', priority: 6 },
  { domain: 'x.com', name: 'Twitter/X', priority: 6 },
  { domain: 'github.com', name: 'GitHub', priority: 6 },
];

async function findCanonicalLinks(topic) {
  const searchQuery = `Find official and reference pages for "${topic}". Include:
- Wikipedia page URL (if exists)
- Wikidata ID and URL (if exists)
- LessWrong profile or wiki page (if exists)
- EA Forum profile or posts (if exists)
- Official website (if organization or person)
- Twitter/X profile (if exists)

For each, provide the exact URL. Only include links that actually exist.`;

  try {
    const result = await perplexityResearch(searchQuery, { maxTokens: 1500 });

    // Extract URLs
    const urlRegex = /https?:\/\/[^\s<>"{}|\\^`\[\]]+/g;
    const foundUrls = (result.content.match(urlRegex) || []).map(url => {
      return url.replace(/[.,;:!?]+$/, '').replace(/\)+$/, '');
    });

    const allUrls = [...new Set([...foundUrls, ...(result.citations || [])])];

    // Categorize
    const canonicalLinks = [];
    const seenDomains = new Set();

    for (const url of allUrls) {
      try {
        const urlObj = new URL(url);
        const hostname = urlObj.hostname.replace(/^www\./, '');

        for (const { domain, name, priority } of CANONICAL_DOMAINS) {
          const domainHost = domain.replace(/^www\./, '');
          if (hostname === domainHost || hostname.endsWith('.' + domainHost)) {
            if (!seenDomains.has(name)) {
              canonicalLinks.push({ name, url, priority, domain: hostname });
              seenDomains.add(name);
            }
            break;
          }
        }

        // Check for official website
        if (!seenDomains.has('Official Website') &&
            !CANONICAL_DOMAINS.some(d => hostname.includes(d.domain.replace(/^www\./, '')))) {
          if (hostname.split('.').length <= 3 && !hostname.includes('google')) {
            canonicalLinks.push({ name: 'Official Website', url, priority: 0, domain: hostname });
            seenDomains.add('Official Website');
          }
        }
      } catch (e) {}
    }

    canonicalLinks.sort((a, b) => a.priority - b.priority);
    return { success: true, links: canonicalLinks };
  } catch (error) {
    console.error(`  Error: ${error.message}`);
    return { success: false, links: [] };
  }
}

function generateKeyLinksSection(links) {
  if (links.length === 0) return null;

  const rows = links.map(link => `| ${link.name} | [${link.domain}](${link.url}) |`).join('\n');

  return `## Key Links

| Source | Link |
|--------|------|
${rows}

`;
}

function extractTitle(content) {
  const match = content.match(/^---\n[\s\S]*?title:\s*["']?([^"'\n]+)["']?/m);
  return match ? match[1].trim() : null;
}

function hasKeyLinksSection(content) {
  return /^## Key Links/m.test(content);
}

function addKeyLinksToContent(content, keyLinksSection) {
  // Try to add after ## Quick Assessment
  if (content.includes('## Quick Assessment')) {
    // Find the end of Quick Assessment section (next ## heading)
    const qaMatch = content.match(/(## Quick Assessment[\s\S]*?)(\n## )/);
    if (qaMatch) {
      return content.replace(qaMatch[0], qaMatch[1] + '\n\n' + keyLinksSection + qaMatch[2]);
    }
  }

  // Otherwise add after frontmatter and imports
  const fmEnd = content.indexOf('---', 4);
  if (fmEnd !== -1) {
    const afterFm = content.slice(fmEnd + 3);
    // Skip import statements
    const importMatch = afterFm.match(/^(\s*import[^;]+;\s*)+/);
    const insertPoint = fmEnd + 3 + (importMatch ? importMatch[0].length : 0);

    return content.slice(0, insertPoint) + '\n\n' + keyLinksSection + content.slice(insertPoint);
  }

  return content;
}

async function processFile(filePath, dryRun = false) {
  const relativePath = path.relative(ROOT, filePath);
  console.log(`\nProcessing: ${relativePath}`);

  const content = fs.readFileSync(filePath, 'utf-8');

  // Check if already has Key Links
  if (hasKeyLinksSection(content)) {
    console.log('  ✓ Already has Key Links section');
    return { status: 'skipped', reason: 'already has section' };
  }

  // Extract title
  const title = extractTitle(content);
  if (!title) {
    console.log('  ⚠ Could not extract title');
    return { status: 'error', reason: 'no title' };
  }

  console.log(`  Topic: ${title}`);

  // Find canonical links
  console.log('  Searching for canonical links...');
  const result = await findCanonicalLinks(title);

  if (!result.success || result.links.length === 0) {
    console.log('  ⚠ No canonical links found');
    return { status: 'skipped', reason: 'no links found' };
  }

  console.log(`  Found ${result.links.length} links:`);
  result.links.forEach(l => console.log(`    - ${l.name}: ${l.url}`));

  // Generate section
  const keyLinksSection = generateKeyLinksSection(result.links);

  // Add to content
  const newContent = addKeyLinksToContent(content, keyLinksSection);

  if (dryRun) {
    console.log('  [DRY RUN] Would add Key Links section');
    return { status: 'would-update', links: result.links };
  }

  // Write file
  fs.writeFileSync(filePath, newContent);
  console.log('  ✓ Added Key Links section');

  return { status: 'updated', links: result.links };
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const files = args.filter(a => !a.startsWith('--'));

  if (files.length === 0) {
    console.log('Usage: node add-key-links.mjs [--dry-run] <file1.mdx> [file2.mdx ...]');
    console.log('\nExample:');
    console.log('  node scripts/content/add-key-links.mjs --dry-run src/content/docs/knowledge-base/people/*.mdx');
    process.exit(1);
  }

  console.log(`Processing ${files.length} files${dryRun ? ' (dry run)' : ''}...`);

  const results = { updated: 0, skipped: 0, errors: 0 };

  for (const file of files) {
    const fullPath = path.isAbsolute(file) ? file : path.join(process.cwd(), file);

    if (!fs.existsSync(fullPath)) {
      console.log(`\n⚠ File not found: ${file}`);
      results.errors++;
      continue;
    }

    try {
      const result = await processFile(fullPath, dryRun);
      if (result.status === 'updated' || result.status === 'would-update') {
        results.updated++;
      } else if (result.status === 'skipped') {
        results.skipped++;
      } else {
        results.errors++;
      }
    } catch (error) {
      console.error(`\n✗ Error processing ${file}: ${error.message}`);
      results.errors++;
    }

    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 500));
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log(`Done! Updated: ${results.updated}, Skipped: ${results.skipped}, Errors: ${results.errors}`);
}

main().catch(console.error);
