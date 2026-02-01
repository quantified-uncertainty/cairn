#!/usr/bin/env node
/**
 * Validate that pages follow their declared template
 *
 * Usage:
 *   node scripts/validate/validate-templates.mjs           # Check all pages with templates
 *   node scripts/validate/validate-templates.mjs --fix     # Add missing template fields (dry-run)
 *   node scripts/validate/validate-templates.mjs --suggest # Suggest templates for pages without them
 *   node scripts/validate/validate-templates.mjs --style-guides # Show style guide links
 *
 * Templates are defined in src/data/page-templates.ts with:
 * - Path patterns for auto-detection
 * - Required frontmatter fields
 * - Required sections
 * - Links to style guides
 */

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { findMdxFiles } from '../lib/file-utils.mjs';
import { CONTENT_DIR } from '../lib/content-types.mjs';

// Template definitions synchronized with src/data/page-templates.ts
// Path patterns are ordered by priority (most specific first)
const TEMPLATE_PATH_PATTERNS = [
  // AI Transition Model patterns (more specific first)
  { pattern: /^ai-transition-model\/factors\/[^/]+\/index\.mdx$/, templateId: 'ai-transition-model-factor', priority: 100 },
  { pattern: /^ai-transition-model\/scenarios\/[^/]+\/index\.mdx$/, templateId: 'ai-transition-model-scenario', priority: 100 },
  { pattern: /^ai-transition-model\/outcomes\/[^/]+\.mdx$/, templateId: 'ai-transition-model-outcome', priority: 90 },
  { pattern: /^ai-transition-model\/parameters\/[^/]+\.mdx$/, templateId: 'ai-transition-model-parameter', priority: 90 },
  { pattern: /^ai-transition-model\/(factors|scenarios)\/[^/]+\/[^/]+\.mdx$/, templateId: 'ai-transition-model-sub-item', priority: 80 },

  // Knowledge Base patterns
  { pattern: /^knowledge-base\/risks\/.*\.mdx$/, templateId: 'knowledge-base-risk', priority: 70 },
  { pattern: /^knowledge-base\/responses\/.*\.mdx$/, templateId: 'knowledge-base-response', priority: 70 },
  { pattern: /^knowledge-base\/models\/.*\.mdx$/, templateId: 'knowledge-base-model', priority: 70 },
  { pattern: /^knowledge-base\/concepts\/.*\.mdx$/, templateId: 'knowledge-base-concept', priority: 70 },
  { pattern: /^knowledge-base\/organizations\/.*\.mdx$/, templateId: 'knowledge-base-organization', priority: 70 },
  { pattern: /^knowledge-base\/people\/.*\.mdx$/, templateId: 'knowledge-base-person', priority: 70 },
];

// Template definitions with requirements and style guides
const TEMPLATES = {
  'ai-transition-model-factor': {
    pathPattern: /^ai-transition-model\/factors\/[^/]+\/index\.mdx$/,
    requiredFrontmatter: ['title'],
    optionalFrontmatter: ['description', 'pageTemplate'],
    requiredSections: ['Overview'],
    styleGuide: '/internal/ai-transition-model-style-guide/',
    note: 'YAML is the source of truth for ratings and metadata',
  },
  'ai-transition-model-scenario': {
    pathPattern: /^ai-transition-model\/scenarios\/[^/]+\/index\.mdx$/,
    requiredFrontmatter: ['title'],
    optionalFrontmatter: ['description', 'pageTemplate'],
    requiredSections: ['Overview'],
    styleGuide: '/internal/ai-transition-model-style-guide/',
    note: 'YAML is the source of truth for ratings and metadata',
  },
  'ai-transition-model-outcome': {
    pathPattern: /^ai-transition-model\/outcomes\/[^/]+\.mdx$/,
    requiredFrontmatter: ['title'],
    optionalFrontmatter: ['description', 'pageTemplate'],
    requiredSections: ['Overview'],
    styleGuide: '/internal/ai-transition-model-style-guide/',
    note: 'YAML is the source of truth for ratings and metadata',
  },
  'ai-transition-model-sub-item': {
    pathPattern: /^ai-transition-model\/(factors|scenarios)\/[^/]+\/[^/]+\.mdx$/,
    requiredFrontmatter: ['title'],
    optionalFrontmatter: ['pageTemplate'],
    requiredSections: [], // ATMPage renders content from YAML
    styleGuide: '/internal/ai-transition-model-style-guide/',
    note: 'MDX is minimal - YAML is the source of truth',
  },
  'ai-transition-model-parameter': {
    pathPattern: /^ai-transition-model\/parameters\/[^/]+\.mdx$/,
    requiredFrontmatter: ['title', 'description', 'lastEdited'],
    optionalFrontmatter: ['pageTemplate', 'quality', 'importance'],
    requiredSections: ['Overview'],
    styleGuide: '/internal/ai-transition-model-style-guide/',
  },
  'knowledge-base-risk': {
    pathPattern: /^knowledge-base\/risks\/.+\.mdx$/,
    requiredFrontmatter: ['title', 'description', 'quality', 'lastEdited'],
    optionalFrontmatter: ['pageTemplate', 'importance'],
    requiredSections: ['Overview'],
    styleGuide: '/internal/risk-style-guide/',
  },
  'knowledge-base-response': {
    pathPattern: /^knowledge-base\/responses\/.+\.mdx$/,
    requiredFrontmatter: ['title', 'description', 'quality', 'lastEdited'],
    optionalFrontmatter: ['pageTemplate', 'importance'],
    requiredSections: ['Overview'],
    styleGuide: '/internal/response-style-guide/',
  },
  'knowledge-base-model': {
    pathPattern: /^knowledge-base\/models\/.+\.mdx$/,
    requiredFrontmatter: ['title', 'description', 'quality', 'lastEdited'],
    optionalFrontmatter: ['pageTemplate', 'ratings'],
    requiredSections: ['Overview'],
    styleGuide: '/internal/models-style-guide/',
  },
  'knowledge-base-concept': {
    pathPattern: /^knowledge-base\/concepts\/.+\.mdx$/,
    requiredFrontmatter: ['title', 'description', 'lastEdited'],
    optionalFrontmatter: ['pageTemplate', 'quality'],
    requiredSections: ['Overview'],
  },
  'knowledge-base-organization': {
    pathPattern: /^knowledge-base\/organizations\/.+\.mdx$/,
    requiredFrontmatter: ['title', 'description', 'lastEdited'],
    optionalFrontmatter: ['pageTemplate', 'quality'],
    requiredSections: ['Overview'],
  },
  'knowledge-base-person': {
    pathPattern: /^knowledge-base\/people\/.+\.mdx$/,
    requiredFrontmatter: ['title', 'description', 'lastEdited'],
    optionalFrontmatter: ['pageTemplate', 'quality'],
    requiredSections: ['Overview'],
  },
};

/**
 * Suggest a template based on URL path, using priority ordering
 */
function suggestTemplate(relativePath) {
  // Skip non-content index pages (overview pages)
  if (relativePath.endsWith('/index.mdx') && !relativePath.includes('ai-transition-model')) {
    return null;
  }

  let bestMatch = null;

  for (const { pattern, templateId, priority } of TEMPLATE_PATH_PATTERNS) {
    if (pattern.test(relativePath)) {
      if (!bestMatch || priority > bestMatch.priority) {
        bestMatch = { templateId, priority };
      }
    }
  }

  return bestMatch?.templateId || null;
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
  const templateInfo = suggestedTemplate ? TEMPLATES[suggestedTemplate] : null;

  if (!declaredTemplate) {
    if (suggestedTemplate) {
      const styleGuideNote = templateInfo?.styleGuide
        ? ` (see ${templateInfo.styleGuide})`
        : '';
      suggestions.push(`Add 'pageTemplate: ${suggestedTemplate}' to frontmatter${styleGuideNote}`);
    }
    return { filePath, relativePath, issues, suggestions, template: null, suggestedTemplate };
  }

  const template = TEMPLATES[declaredTemplate];
  if (!template) {
    issues.push(`Unknown template: ${declaredTemplate}`);
    return { filePath, relativePath, issues, suggestions, template: declaredTemplate, suggestedTemplate };
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

  return { filePath, relativePath, issues, suggestions, template: declaredTemplate, suggestedTemplate, styleGuide: template.styleGuide };
}

async function main() {
  const args = process.argv.slice(2);
  const showSuggestions = args.includes('--suggest');
  const showAll = args.includes('--all');
  const showStyleGuides = args.includes('--style-guides');

  if (showStyleGuides) {
    console.log('Template Style Guides:\n');
    console.log('='.repeat(60));
    for (const [templateId, template] of Object.entries(TEMPLATES)) {
      console.log(`\n${templateId}:`);
      console.log(`  Style Guide: ${template.styleGuide || '(none)'}`);
      console.log(`  Required Frontmatter: ${template.requiredFrontmatter.join(', ')}`);
      console.log(`  Required Sections: ${template.requiredSections.join(', ') || '(none - YAML source)'}`);
      if (template.note) {
        console.log(`  Note: ${template.note}`);
      }
    }
    return;
  }

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
        console.log(`\n[X] ${result.relativePath}`);
        console.log(`   Template: ${result.template}`);
        if (result.styleGuide) {
          console.log(`   Style Guide: ${result.styleGuide}`);
        }
        for (const issue of result.issues) {
          console.log(`   - ${issue}`);
        }
      } else if (showAll) {
        console.log(`[OK] ${result.relativePath}`);
      }
    } else {
      pagesWithoutTemplate++;
      if (showSuggestions && result.suggestions.length > 0) {
        console.log(`\n[?] ${result.relativePath}`);
        for (const suggestion of result.suggestions) {
          console.log(`   -> ${suggestion}`);
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
    console.log(`Run with --style-guides to see all template style guide links`);
  }

  // Group suggestions by template
  if (showSuggestions) {
    const byTemplate = {};
    for (const result of allResults) {
      if (!result.template && result.suggestedTemplate) {
        const suggested = result.suggestedTemplate;
        if (!byTemplate[suggested]) byTemplate[suggested] = [];
        byTemplate[suggested].push(result.relativePath);
      }
    }

    if (Object.keys(byTemplate).length > 0) {
      console.log('\n' + '='.repeat(60));
      console.log('Pages by suggested template:\n');
      for (const [template, pages] of Object.entries(byTemplate)) {
        const templateInfo = TEMPLATES[template];
        console.log(`${template}: (${pages.length} pages)`);
        if (templateInfo?.styleGuide) {
          console.log(`  Style Guide: ${templateInfo.styleGuide}`);
        }
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
