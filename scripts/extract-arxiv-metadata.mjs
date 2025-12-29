#!/usr/bin/env node
/**
 * Extract metadata from ArXiv papers
 *
 * ArXiv provides a free API to get authors, dates, and abstracts.
 * This script updates resources.yaml with this metadata.
 *
 * Usage:
 *   node scripts/extract-arxiv-metadata.mjs [options]
 *
 * Options:
 *   --batch <n>    Number of papers to process (default: 50)
 *   --dry-run      Show what would be updated without saving
 *   --verbose      Show detailed output
 */

import { readFileSync, writeFileSync } from 'fs';
import { parse, stringify } from 'yaml';

const RESOURCES_FILE = 'src/data/resources.yaml';

const args = process.argv.slice(2);
const BATCH_SIZE = parseInt(args.find((a, i) => args[i-1] === '--batch') || '50');
const DRY_RUN = args.includes('--dry-run');
const VERBOSE = args.includes('--verbose');

/**
 * Extract ArXiv ID from URL
 * Handles formats: arxiv.org/abs/1234.5678, arxiv.org/pdf/1234.5678, arxiv.org/html/1234.5678v1
 */
function extractArxivId(url) {
  // Try various formats
  const patterns = [
    /arxiv\.org\/(?:abs|pdf|html)\/(\d+\.\d+)(?:v\d+)?/,  // Modern format
    /arxiv\.org\/(?:abs|pdf|html)\/([a-z-]+\/\d+)/,       // Old format: hep-th/0123456
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
async function fetchArxivMetadata(arxivIds) {
  const idList = arxivIds.join(',');
  const url = `http://export.arxiv.org/api/query?id_list=${idList}&max_results=${arxivIds.length}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`ArXiv API error: ${response.status}`);
  }

  const xml = await response.text();
  return parseArxivResponse(xml);
}

/**
 * Parse ArXiv API XML response
 */
function parseArxivResponse(xml) {
  const results = new Map();

  // Match each entry
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
  let match;

  while ((match = entryRegex.exec(xml)) !== null) {
    const entry = match[1];

    // Extract ID (handles both http and https, strips version suffix)
    const idMatch = entry.match(/<id>https?:\/\/arxiv\.org\/abs\/([^<]+)<\/id>/);
    if (!idMatch) continue;
    // Strip version suffix (e.g., 2310.19852v6 -> 2310.19852)
    const id = idMatch[1].replace(/v\d+$/, '');

    // Extract authors
    const authors = [];
    const authorRegex = /<author>[\s\S]*?<name>([^<]+)<\/name>[\s\S]*?<\/author>/g;
    let authorMatch;
    while ((authorMatch = authorRegex.exec(entry)) !== null) {
      authors.push(authorMatch[1].trim());
    }

    // Extract published date
    const publishedMatch = entry.match(/<published>([^<]+)<\/published>/);
    const published = publishedMatch ? publishedMatch[1].split('T')[0] : null;

    // Extract title
    const titleMatch = entry.match(/<title>([^<]+)<\/title>/);
    const title = titleMatch ? titleMatch[1].replace(/\s+/g, ' ').trim() : null;

    // Extract abstract
    const summaryMatch = entry.match(/<summary>([^<]+)<\/summary>/);
    const abstract = summaryMatch ? summaryMatch[1].replace(/\s+/g, ' ').trim() : null;

    results.set(id, { authors, published, title, abstract });
  }

  return results;
}

async function main() {
  console.log('📚 ArXiv Metadata Extractor');
  console.log(`   Batch size: ${BATCH_SIZE}`);
  if (DRY_RUN) console.log('   DRY RUN - no changes will be saved');
  console.log();

  // Load resources
  const resources = parse(readFileSync(RESOURCES_FILE, 'utf-8'));

  // Find ArXiv resources without authors
  const arxivResources = resources.filter(r => {
    if (!r.url || !r.url.includes('arxiv.org')) return false;
    if (r.authors && r.authors.length > 0) return false;
    return extractArxivId(r.url) !== null;
  });

  console.log(`Found ${arxivResources.length} ArXiv papers without metadata`);

  // Take batch
  const batch = arxivResources.slice(0, BATCH_SIZE);
  if (batch.length === 0) {
    console.log('✅ All ArXiv papers have metadata');
    return;
  }

  console.log(`Processing ${batch.length} papers...\n`);

  // Extract IDs
  const idToResource = new Map();
  for (const r of batch) {
    const arxivId = extractArxivId(r.url);
    if (arxivId) {
      idToResource.set(arxivId, r);
    }
  }

  // Fetch metadata in batches of 20 (ArXiv API recommendation)
  const allIds = Array.from(idToResource.keys());
  let updated = 0;

  for (let i = 0; i < allIds.length; i += 20) {
    const batchIds = allIds.slice(i, i + 20);

    try {
      const metadata = await fetchArxivMetadata(batchIds);

      for (const [arxivId, meta] of metadata) {
        const resource = idToResource.get(arxivId);
        if (!resource) continue;

        // Update resource
        if (meta.authors && meta.authors.length > 0) {
          resource.authors = meta.authors;
        }
        if (meta.published) {
          resource.published_date = meta.published;
        }
        if (meta.abstract && !resource.abstract) {
          resource.abstract = meta.abstract;
        }

        updated++;

        if (VERBOSE) {
          console.log(`✓ ${resource.title || arxivId}`);
          console.log(`  Authors: ${meta.authors?.slice(0, 3).join(', ')}${meta.authors?.length > 3 ? '...' : ''}`);
          console.log(`  Date: ${meta.published}`);
        }
      }

      // Rate limit: ArXiv recommends 3 second delay
      if (i + 20 < allIds.length) {
        await new Promise(r => setTimeout(r, 3000));
      }
    } catch (err) {
      console.error(`Error fetching batch: ${err.message}`);
    }
  }

  console.log(`\n✅ Updated ${updated} papers with metadata`);

  if (!DRY_RUN && updated > 0) {
    const header = `# External Resources Referenced in the Knowledge Base
# ==================================================
#
# Auto-generated and manually curated.
# See src/data/schema.ts for Resource schema.

`;
    writeFileSync(RESOURCES_FILE, header + stringify(resources, { lineWidth: 100 }));
    console.log('Saved resources.yaml');
    console.log('\nRun: npm run build:data');
  }
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
