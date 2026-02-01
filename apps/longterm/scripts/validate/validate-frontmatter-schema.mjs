#!/usr/bin/env node

/**
 * Frontmatter Schema Validator
 *
 * Validates MDX frontmatter against the content collection schema
 * to catch type errors before the full Astro build.
 *
 * Usage:
 *   node scripts/validate/validate-frontmatter-schema.mjs
 *   node scripts/validate/validate-frontmatter-schema.mjs --quick  # Changed files only
 *   node scripts/validate/validate-frontmatter-schema.mjs --ci     # JSON output
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { z } from 'zod';
import matter from 'gray-matter';
import { getColors } from '../lib/output.mjs';

const args = process.argv.slice(2);
const CI_MODE = args.includes('--ci');
const QUICK_MODE = args.includes('--quick');

const colors = getColors(CI_MODE);
const CONTENT_DIR = 'src/content/docs';

// Mirror the schema from content.config.ts
const frontmatterSchema = z.object({
  // Standard Starlight fields
  title: z.string(),
  description: z.string().optional(),

  // Sidebar config
  sidebar: z.object({
    label: z.string().optional(),
    order: z.number().optional(),
    hidden: z.boolean().optional(),
    badge: z.union([
      z.string(),
      z.object({
        text: z.string(),
        variant: z.enum(['note', 'tip', 'caution', 'danger', 'success', 'default']).optional(),
      })
    ]).optional(),
  }).optional(),

  // Page template
  template: z.enum(['doc', 'splash']).optional(),

  // Hero section
  hero: z.object({
    title: z.string().optional(),
    tagline: z.string().optional(),
    image: z.union([
      z.string(),
      z.object({
        src: z.string(),
        alt: z.string().optional(),
      })
    ]).optional(),
  }).optional(),

  // Table of contents
  tableOfContents: z.union([
    z.boolean(),
    z.object({
      minHeadingLevel: z.number().optional(),
      maxHeadingLevel: z.number().optional(),
    })
  ]).optional(),

  // Edit URL
  editUrl: z.union([z.string(), z.boolean()]).optional(),

  // Head elements
  head: z.array(z.any()).optional(),

  // Last updated - can be Date or boolean
  lastUpdated: z.union([z.date(), z.boolean()]).optional(),

  // Prev/next navigation
  prev: z.union([
    z.string(),
    z.boolean(),
    z.object({
      link: z.string(),
      label: z.string().optional(),
    })
  ]).optional(),
  next: z.union([
    z.string(),
    z.boolean(),
    z.object({
      link: z.string(),
      label: z.string().optional(),
    })
  ]).optional(),

  // Custom banner
  banner: z.object({
    content: z.string(),
  }).optional(),

  // Draft mode
  draft: z.boolean().optional(),

  // === Custom Cairn fields ===

  // Page type
  pageType: z.enum(['content', 'stub', 'documentation']).optional(),

  // Editorial metadata (0-100 scale)
  quality: z.number().min(0).max(100).optional(),
  importance: z.number().min(0).max(100).optional(),
  tractability: z.number().min(0).max(100).optional(),
  neglectedness: z.number().min(0).max(100).optional(),
  uncertainty: z.number().min(0).max(100).optional(),

  // Text fields
  llmSummary: z.string().optional(),
  lastEdited: z.string().optional(),
  todo: z.string().optional(),
  todos: z.array(z.string()).optional(),
  seeAlso: z.string().optional(),

  // Content quality ratings (0-10 scale)
  ratings: z.object({
    novelty: z.number().min(0).max(10).optional(),
    rigor: z.number().min(0).max(10).optional(),
    actionability: z.number().min(0).max(10).optional(),
    completeness: z.number().min(0).max(10).optional(),
    changeability: z.number().min(0).max(100).optional(),
    xriskImpact: z.number().min(0).max(100).optional(),
    trajectoryImpact: z.number().min(0).max(100).optional(),
    uncertainty: z.number().min(0).max(100).optional(),
  }).optional(),

  // Automated metrics
  metrics: z.object({
    wordCount: z.number().optional(),
    citations: z.number().optional(),
    tables: z.number().optional(),
    diagrams: z.number().optional(),
  }).optional(),

  // Other custom fields
  maturity: z.string().optional(),
  fullWidth: z.boolean().optional(),
  entityId: z.string().optional(),
  roles: z.array(z.string()).optional(),
  pageTemplate: z.string().optional(),

  // Allow unknown fields (for flexibility)
}).passthrough();

function findMdxFiles() {
  const files = [];

  function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.name.endsWith('.mdx') || entry.name.endsWith('.md')) {
        files.push(fullPath);
      }
    }
  }

  walk(CONTENT_DIR);
  return files;
}

function getChangedFiles() {
  try {
    const output = execSync('git diff --name-only HEAD~1 HEAD', { encoding: 'utf-8' });
    const staged = execSync('git diff --name-only --cached', { encoding: 'utf-8' });
    const unstaged = execSync('git diff --name-only', { encoding: 'utf-8' });

    const allChanged = [...output.split('\n'), ...staged.split('\n'), ...unstaged.split('\n')]
      .filter(f => f.endsWith('.mdx') || f.endsWith('.md'))
      .filter(f => f.startsWith('src/content/docs/') || f.startsWith('apps/longterm/src/content/docs/'))
      .map(f => f.replace('apps/longterm/', ''))
      .filter(f => fs.existsSync(f));

    return [...new Set(allChanged)];
  } catch {
    return [];
  }
}

function validateFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const { data: frontmatter } = matter(content);

  const issues = [];

  // Parse the frontmatter with Zod
  const result = frontmatterSchema.safeParse(frontmatter);

  if (!result.success) {
    for (const error of result.error.errors) {
      issues.push({
        field: error.path.join('.'),
        message: error.message,
        received: error.received,
        expected: error.expected,
      });
    }
  }

  // Additional checks

  // Check for quoted dates (common mistake)
  if (typeof frontmatter.lastUpdated === 'string') {
    // String dates are not allowed - must be YAML date (unquoted) or boolean
    if (/^\d{4}-\d{2}-\d{2}/.test(frontmatter.lastUpdated)) {
      issues.push({
        field: 'lastUpdated',
        message: 'Date should be unquoted in YAML (use lastUpdated: 2025-01-31, not lastUpdated: "2025-01-31")',
        received: `"${frontmatter.lastUpdated}"`,
        expected: frontmatter.lastUpdated,
      });
    }
  }

  // Check for quoted createdAt dates
  if (typeof frontmatter.createdAt === 'string' && /^\d{4}-\d{2}-\d{2}/.test(frontmatter.createdAt)) {
    issues.push({
      field: 'createdAt',
      message: 'Date should be unquoted in YAML',
      received: `"${frontmatter.createdAt}"`,
      expected: frontmatter.createdAt,
    });
  }

  return issues;
}

async function main() {
  if (!CI_MODE) {
    console.log(`${colors.bold}${colors.blue}Frontmatter Schema Validator${colors.reset}\n`);
  }

  let files;
  if (QUICK_MODE) {
    files = getChangedFiles();
    if (!CI_MODE) {
      console.log(`${colors.dim}Quick mode: checking ${files.length} changed files${colors.reset}\n`);
    }
    if (files.length === 0) {
      if (!CI_MODE) {
        console.log(`${colors.green}No changed MDX files to check${colors.reset}`);
      }
      process.exit(0);
    }
  } else {
    files = findMdxFiles();
    if (!CI_MODE) {
      console.log(`${colors.dim}Checking ${files.length} files${colors.reset}\n`);
    }
  }

  const results = {
    total: files.length,
    passed: 0,
    failed: 0,
    issues: [],
  };

  for (const file of files) {
    const issues = validateFile(file);

    if (issues.length > 0) {
      results.failed++;
      results.issues.push({
        file: file.replace('src/content/docs/', ''),
        issues,
      });

      if (!CI_MODE) {
        console.log(`${colors.red}✗${colors.reset} ${file.replace('src/content/docs/', '')}`);
        for (const issue of issues) {
          console.log(`  ${colors.dim}${issue.field}: ${issue.message}${colors.reset}`);
          if (issue.received !== undefined) {
            console.log(`    ${colors.dim}received: ${issue.received}${colors.reset}`);
          }
        }
      }
    } else {
      results.passed++;
    }
  }

  if (CI_MODE) {
    console.log(JSON.stringify(results, null, 2));
  } else {
    console.log();
    if (results.failed === 0) {
      console.log(`${colors.green}${colors.bold}✓ All ${results.total} files have valid frontmatter${colors.reset}`);
    } else {
      console.log(`${colors.red}${colors.bold}✗ ${results.failed} file(s) have frontmatter issues${colors.reset}`);
    }
  }

  process.exit(results.failed > 0 ? 1 : 0);
}

main().catch(console.error);
