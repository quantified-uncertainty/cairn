#!/usr/bin/env node
/**
 * Add template declarations to all pages based on their path
 *
 * Usage:
 *   node scripts/add-template-declarations.mjs           # Dry run
 *   node scripts/add-template-declarations.mjs --apply   # Apply changes
 */

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { findMdxFiles } from '../lib/file-utils.mjs';
import { CONTENT_DIR } from '../lib/content-types.mjs';

// Template patterns - order matters (more specific first)
const TEMPLATE_PATTERNS = [
  // AI Transition Model - specific patterns first
  {
    id: 'ai-transition-model-factor',
    pattern: /^ai-transition-model\/factors\/[^/]+\/index\.mdx$/,
  },
  {
    id: 'ai-transition-model-scenario',
    pattern: /^ai-transition-model\/scenarios\/[^/]+\/index\.mdx$/,
  },
  {
    id: 'ai-transition-model-outcome',
    pattern: /^ai-transition-model\/outcomes\/(?!index)[^/]+\.mdx$/,
  },
  {
    id: 'ai-transition-model-parameter',
    pattern: /^ai-transition-model\/parameters\/(?!index)[^/]+\.mdx$/,
  },
  {
    id: 'ai-transition-model-sub-item',
    pattern: /^ai-transition-model\/(factors|scenarios)\/[^/]+\/(?!index)[^/]+\.mdx$/,
  },
  // Knowledge Base patterns
  {
    id: 'knowledge-base-risk',
    pattern: /^knowledge-base\/risks\/(?!.*\/index\.mdx$).+\.mdx$/,
  },
  {
    id: 'knowledge-base-response',
    pattern: /^knowledge-base\/responses\/(?!.*\/index\.mdx$).+\.mdx$/,
  },
  {
    id: 'knowledge-base-model',
    pattern: /^knowledge-base\/models\/(?!.*\/index\.mdx$).+\.mdx$/,
  },
  {
    id: 'knowledge-base-concept',
    pattern: /^knowledge-base\/concepts\/(?!.*\/index\.mdx$).+\.mdx$/,
  },
];

function getTemplateForPath(relativePath) {
  for (const { id, pattern } of TEMPLATE_PATTERNS) {
    if (pattern.test(relativePath)) {
      return id;
    }
  }
  return null;
}

async function processFile(filePath, applyChanges) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const { data: frontmatter, content: body } = matter(content);
  const relativePath = path.relative(CONTENT_DIR, filePath);

  // Skip if already has template
  if (frontmatter.pageTemplate) {
    return { status: 'skipped', reason: 'already has template', relativePath };
  }

  // Skip index pages that aren't factor/scenario indexes
  if (relativePath.endsWith('index.mdx')) {
    const suggestedTemplate = getTemplateForPath(relativePath);
    if (!suggestedTemplate) {
      return { status: 'skipped', reason: 'index page without template', relativePath };
    }
  }

  const suggestedTemplate = getTemplateForPath(relativePath);
  if (!suggestedTemplate) {
    return { status: 'skipped', reason: 'no matching template', relativePath };
  }

  if (applyChanges) {
    // Add template to frontmatter
    frontmatter.pageTemplate = suggestedTemplate;

    // Reconstruct the file
    const newContent = matter.stringify(body, frontmatter);
    fs.writeFileSync(filePath, newContent);

    return { status: 'updated', template: suggestedTemplate, relativePath };
  }

  return { status: 'would-update', template: suggestedTemplate, relativePath };
}

async function main() {
  const args = process.argv.slice(2);
  const applyChanges = args.includes('--apply');

  console.log(applyChanges ? 'Adding template declarations...\n' : 'DRY RUN - would add template declarations...\n');

  const files = findMdxFiles(CONTENT_DIR);

  const results = {
    updated: [],
    skipped: [],
    byTemplate: {},
  };

  for (const file of files) {
    const result = await processFile(file, applyChanges);

    if (result.status === 'updated' || result.status === 'would-update') {
      results.updated.push(result);
      if (!results.byTemplate[result.template]) {
        results.byTemplate[result.template] = [];
      }
      results.byTemplate[result.template].push(result.relativePath);
    } else {
      results.skipped.push(result);
    }
  }

  // Print results by template
  console.log('Changes by template:\n');
  for (const [template, pages] of Object.entries(results.byTemplate).sort()) {
    console.log(`${template}: ${pages.length} pages`);
    for (const page of pages.slice(0, 3)) {
      console.log(`  - ${page}`);
    }
    if (pages.length > 3) {
      console.log(`  ... and ${pages.length - 3} more`);
    }
    console.log();
  }

  // Summary
  console.log('='.repeat(60));
  console.log('Summary:');
  console.log(`  Total files: ${files.length}`);
  console.log(`  ${applyChanges ? 'Updated' : 'Would update'}: ${results.updated.length}`);
  console.log(`  Skipped: ${results.skipped.length}`);

  // Breakdown of skipped
  const skipReasons = {};
  for (const { reason } of results.skipped) {
    skipReasons[reason] = (skipReasons[reason] || 0) + 1;
  }
  console.log('\nSkipped breakdown:');
  for (const [reason, count] of Object.entries(skipReasons).sort((a, b) => b[1] - a[1])) {
    console.log(`  - ${reason}: ${count}`);
  }

  if (!applyChanges) {
    console.log('\nRun with --apply to make changes');
  }
}

main().catch(console.error);
