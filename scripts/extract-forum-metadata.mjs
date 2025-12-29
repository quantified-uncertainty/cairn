#!/usr/bin/env node
/**
 * Extract metadata from LessWrong, Alignment Forum, and EA Forum posts
 *
 * These forums use GraphQL APIs to provide author and date metadata.
 *
 * Usage:
 *   node scripts/extract-forum-metadata.mjs [options]
 *
 * Options:
 *   --batch <n>    Number of posts to process (default: 100)
 *   --dry-run      Show what would be updated without saving
 *   --verbose      Show detailed output
 */

import { readFileSync, writeFileSync } from 'fs';
import { parse, stringify } from 'yaml';

const RESOURCES_FILE = 'src/data/resources.yaml';

const args = process.argv.slice(2);
const BATCH_SIZE = parseInt(args.find((a, i) => args[i-1] === '--batch') || '100');
const DRY_RUN = args.includes('--dry-run');
const VERBOSE = args.includes('--verbose');

/**
 * Extract post slug from LessWrong/Alignment Forum URL
 */
function extractPostSlug(url) {
  // Handle: lesswrong.com/posts/XXXXX/title, alignmentforum.org/posts/XXXXX/title
  const match = url.match(/(?:lesswrong\.com|alignmentforum\.org)\/posts\/([a-zA-Z0-9]+)/);
  return match ? match[1] : null;
}

/**
 * Extract post slug from EA Forum URL
 */
function extractEAForumSlug(url) {
  const match = url.match(/forum\.effectivealtruism\.org\/posts\/([a-zA-Z0-9]+)/);
  return match ? match[1] : null;
}

/**
 * Fetch metadata from LessWrong/Alignment Forum GraphQL API
 */
async function fetchLWMetadata(postId) {
  const query = `
    query {
      post(input: {selector: {_id: "${postId}"}}) {
        result {
          title
          postedAt
          user {
            displayName
          }
          coauthors {
            displayName
          }
        }
      }
    }
  `;

  const response = await fetch('https://www.lesswrong.com/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) return null;
  const data = await response.json();
  const post = data?.data?.post?.result;
  if (!post) return null;

  const authors = [post.user?.displayName];
  if (post.coauthors) {
    authors.push(...post.coauthors.map(c => c.displayName));
  }

  return {
    title: post.title,
    authors: authors.filter(Boolean),
    published: post.postedAt ? post.postedAt.split('T')[0] : null,
  };
}

/**
 * Fetch metadata from EA Forum GraphQL API
 */
async function fetchEAForumMetadata(postId) {
  const query = `
    query {
      post(input: {selector: {_id: "${postId}"}}) {
        result {
          title
          postedAt
          user {
            displayName
          }
          coauthors {
            displayName
          }
        }
      }
    }
  `;

  const response = await fetch('https://forum.effectivealtruism.org/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) return null;
  const data = await response.json();
  const post = data?.data?.post?.result;
  if (!post) return null;

  const authors = [post.user?.displayName];
  if (post.coauthors) {
    authors.push(...post.coauthors.map(c => c.displayName));
  }

  return {
    title: post.title,
    authors: authors.filter(Boolean),
    published: post.postedAt ? post.postedAt.split('T')[0] : null,
  };
}

async function main() {
  console.log('📝 Forum Metadata Extractor');
  console.log(`   Batch size: ${BATCH_SIZE}`);
  if (DRY_RUN) console.log('   DRY RUN - no changes will be saved');
  console.log();

  // Load resources
  const resources = parse(readFileSync(RESOURCES_FILE, 'utf-8'));

  // Find forum resources without authors
  const forumResources = resources.filter(r => {
    if (!r.url) return false;
    if (r.authors && r.authors.length > 0) return false;
    const isLW = r.url.includes('lesswrong.com/posts/') || r.url.includes('alignmentforum.org/posts/');
    const isEA = r.url.includes('forum.effectivealtruism.org/posts/');
    return isLW || isEA;
  });

  console.log(`Found ${forumResources.length} forum posts without metadata`);

  const batch = forumResources.slice(0, BATCH_SIZE);
  if (batch.length === 0) {
    console.log('✅ All forum posts have metadata');
    return;
  }

  console.log(`Processing ${batch.length} posts...\n`);

  let updated = 0;
  let failed = 0;

  for (const r of batch) {
    const isEA = r.url.includes('forum.effectivealtruism.org');
    const slug = isEA ? extractEAForumSlug(r.url) : extractPostSlug(r.url);

    if (!slug) {
      if (VERBOSE) console.log(`✗ Could not extract slug from: ${r.url}`);
      failed++;
      continue;
    }

    try {
      const meta = isEA
        ? await fetchEAForumMetadata(slug)
        : await fetchLWMetadata(slug);

      if (meta && meta.authors && meta.authors.length > 0) {
        r.authors = meta.authors;
        if (meta.published) {
          r.published_date = meta.published;
        }
        updated++;

        if (VERBOSE) {
          console.log(`✓ ${r.title || meta.title}`);
          console.log(`  Authors: ${meta.authors.join(', ')}`);
          console.log(`  Date: ${meta.published}`);
        }
      } else {
        failed++;
        if (VERBOSE) console.log(`✗ No metadata for: ${r.url}`);
      }

      // Rate limit
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (err) {
      failed++;
      if (VERBOSE) console.log(`✗ Error fetching ${r.url}: ${err.message}`);
    }
  }

  console.log(`\n✅ Updated ${updated} posts with metadata`);
  if (failed > 0) console.log(`   ${failed} failed`);

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
