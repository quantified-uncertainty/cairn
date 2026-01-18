#!/usr/bin/env node
/**
 * Validate that pages follow their declared template
 *
 * Usage:
 *   node scripts/validate-templates.mjs           # Check all pages with templates
 *   node scripts/validate-templates.mjs --fix     # Add missing template fields (dry-run)
 *   node scripts/validate-templates.mjs --suggest # Suggest templates for pages without them
 */

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { findMdxFiles } from './lib/file-utils.mjs';
import { CONTENT_DIR } from './lib/content-types.mjs';

// Template definitions (simplified from page-templates.ts for script use)
const TEMPLATES = {
  'ai-transition-model-factor': {
    pathPattern: /^ai-transition-model\/factors\/[^/]+\/index\.mdx$/,
    requiredFrontmatter: ['title', 'description', 'lastEdited'],
    requiredSections: ['Overview'],
  },
  'ai-transition-model-scenario': {
    pathPattern: /^ai-transition-model\/scenarios\/[^/]+\/index\.mdx$/,
    requiredFrontmatter: ['title', 'description', 'lastEdited'],
    requiredSections: ['Overview'],
  },
  'ai-transition-model-outcome': {
    pathPattern: /^ai-transition-model\/outcomes\/[^/]+\.mdx$/,
    requiredFrontmatter: ['title', 'description', 'lastEdited'],
    requiredSections: ['Overview'],
  },
  'ai-transition-model-sub-item': {
    pathPattern: /^ai-transition-model\/(factors|scenarios)\/[^/]+\/[^/]+\.mdx$/,
    requiredFrontmatter: ['title', 'description', 'lastEdited', 'ratings'],
    requiredSections: ['Overview'],
  },
  'knowledge-base-risk': {
    pathPattern: /^knowledge-base\/risks\/.+\.mdx$/,
    requiredFrontmatter: ['title', 'description', 'quality', 'lastEdited'],
    requiredSections: ['Overview'],
  },
  'knowledge-base-response': {
    pathPattern: /^knowledge-base\/responses\/.+\.mdx$/,
    requiredFrontmatter: ['title', 'description', 'quality', 'lastEdited'],
    requiredSections: ['Overview'],
  },
  'knowledge-base-model': {
    pathPattern: /^knowledge-base\/models\/.+\.mdx$/,
    requiredFrontmatter: ['title', 'description', 'quality', 'lastEdited'],
    requiredSections: ['Overview'],
  },
};

function suggestTemplate(relativePath) {
  for (const [templateId, template] of Object.entries(TEMPLATES)) {
    if (template.pathPattern.test(relativePath)) {
      return templateId;
    }
  }
  return null;
}

function extractHeadings(content) {
  const headingRegex = /^##\s+(.+)$/gm;
  const headings = [];
  let match;
  while ((match = headingRegex.exec(content)) !== null) {
    headings.push(match[1].trim());
  }
  return headings;
}

async function validatePage(filePath, options = {}) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const { data: frontmatter, content: body } = matter(content);
  const relativePath = path.relative(CONTENT_DIR, filePath);

  const issues = [];
  const suggestions = [];

  const declaredTemplate = frontmatter.pageTemplate;
  const suggestedTemplate = suggestTemplate(relativePath);

  if (!declaredTemplate) {
    if (suggestedTemplate) {
      suggestions.push(`Add 'pageTemplate: ${suggestedTemplate}' to frontmatter`);
    }
    return { filePath, relativePath, issues, suggestions, template: null };
  }

  const template = TEMPLATES[declaredTemplate];
  if (!template) {
    issues.push(`Unknown template: ${declaredTemplate}`);
    return { filePath, relativePath, issues, suggestions, template: declaredTemplate };
  }

  // Check required frontmatter
  for (const field of template.requiredFrontmatter) {
    if (frontmatter[field] === undefined) {
      issues.push(`Missing required frontmatter: ${field}`);
    }
  }

  // Check required sections
  const headings = extractHeadings(body);
  for (const section of template.requiredSections) {
    if (!headings.includes(section)) {
      issues.push(`Missing required section: ## ${section}`);
    }
  }

  // Check path matches template pattern
  if (!template.pathPattern.test(relativePath)) {
    issues.push(`Path doesn't match template pattern (expected: ${template.pathPattern})`);
  }

  return { filePath, relativePath, issues, suggestions, template: declaredTemplate };
}

async function main() {
  const args = process.argv.slice(2);
  const showSuggestions = args.includes('--suggest');
  const showAll = args.includes('--all');

  console.log('Validating page templates...\n');

  const files = findMdxFiles(CONTENT_DIR);

  let pagesWithTemplate = 0;
  let pagesWithoutTemplate = 0;
  let pagesWithIssues = 0;
  const allResults = [];

  for (const file of files) {
    const result = await validatePage(file);
    allResults.push(result);

    if (result.template) {
      pagesWithTemplate++;
      if (result.issues.length > 0) {
        pagesWithIssues++;
        console.log(`\n❌ ${result.relativePath}`);
        console.log(`   Template: ${result.template}`);
        for (const issue of result.issues) {
          console.log(`   - ${issue}`);
        }
      } else if (showAll) {
        console.log(`✓ ${result.relativePath}`);
      }
    } else {
      pagesWithoutTemplate++;
      if (showSuggestions && result.suggestions.length > 0) {
        console.log(`\n📝 ${result.relativePath}`);
        for (const suggestion of result.suggestions) {
          console.log(`   → ${suggestion}`);
        }
      }
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('Summary:');
  console.log(`  Total pages: ${files.length}`);
  console.log(`  With template declared: ${pagesWithTemplate}`);
  console.log(`  Without template: ${pagesWithoutTemplate}`);
  console.log(`  With issues: ${pagesWithIssues}`);

  if (!showSuggestions && pagesWithoutTemplate > 0) {
    console.log(`\nRun with --suggest to see template suggestions for pages without templates`);
  }

  // Group suggestions by template
  if (showSuggestions) {
    const byTemplate = {};
    for (const result of allResults) {
      if (!result.template && result.suggestions.length > 0) {
        const suggested = suggestTemplate(result.relativePath);
        if (suggested) {
          if (!byTemplate[suggested]) byTemplate[suggested] = [];
          byTemplate[suggested].push(result.relativePath);
        }
      }
    }

    if (Object.keys(byTemplate).length > 0) {
      console.log('\n' + '='.repeat(60));
      console.log('Pages by suggested template:\n');
      for (const [template, pages] of Object.entries(byTemplate)) {
        console.log(`${template}: (${pages.length} pages)`);
        for (const page of pages.slice(0, 5)) {
          console.log(`  - ${page}`);
        }
        if (pages.length > 5) {
          console.log(`  ... and ${pages.length - 5} more`);
        }
        console.log();
      }
    }
  }

  process.exit(pagesWithIssues > 0 ? 1 : 0);
}

main().catch(console.error);
