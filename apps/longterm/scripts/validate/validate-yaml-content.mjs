#!/usr/bin/env node

/**
 * YAML Content Validator
 *
 * Checks AI Transition Model YAML files for content issues:
 * - JSX components that shouldn't be in YAML (should be in MDX)
 * - Broken markdown tables
 * - Other migration artifacts
 *
 * Usage: node scripts/validate-yaml-content.mjs
 */

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { parse } from 'yaml';

const DATA_DIR = 'src/data/entities';

// JSX patterns that shouldn't appear in YAML content
const JSX_PATTERNS = [
  { pattern: /<DataInfoBox[^>]*>/g, name: 'DataInfoBox' },
  { pattern: /<ATMPage[^>]*>/g, name: 'ATMPage' },
  { pattern: /<ImpactList[^>]*>/g, name: 'ImpactList' },
  { pattern: /<FactorRelationshipDiagram[^>]*>/g, name: 'FactorRelationshipDiagram' },
  { pattern: /<ParameterDistinctions[^>]*>/g, name: 'ParameterDistinctions' },
  { pattern: /<TransitionModelContent[^>]*>/g, name: 'TransitionModelContent' },
  { pattern: /<Mermaid[^>]*>/g, name: 'Mermaid (use mermaid: field instead)' },
  { pattern: /client:load/g, name: 'client:load directive' },
];

// R component is allowed but should be converted - warn about it
const R_COMPONENT_PATTERN = /<R\s+id="[^"]+">.*?<\/R>/g;

function getColors() {
  const noColor = process.env.NO_COLOR || !process.stdout.isTTY;
  return {
    red: noColor ? '' : '\x1b[31m',
    yellow: noColor ? '' : '\x1b[33m',
    green: noColor ? '' : '\x1b[32m',
    blue: noColor ? '' : '\x1b[34m',
    reset: noColor ? '' : '\x1b[0m',
  };
}

const colors = getColors();

function extractContentFields(obj, path = '') {
  const fields = [];

  if (typeof obj === 'string') {
    return [{ path, content: obj }];
  }

  if (Array.isArray(obj)) {
    obj.forEach((item, i) => {
      fields.push(...extractContentFields(item, `${path}[${i}]`));
    });
    return fields;
  }

  if (obj && typeof obj === 'object') {
    // Check specific content fields
    const contentKeys = ['intro', 'body', 'footer', 'description'];
    for (const key of contentKeys) {
      if (obj[key] && typeof obj[key] === 'string') {
        fields.push({ path: `${path}.${key}`, content: obj[key] });
      }
    }

    // Recurse into content and sections
    if (obj.content) {
      fields.push(...extractContentFields(obj.content, `${path}.content`));
    }
    if (obj.sections) {
      fields.push(...extractContentFields(obj.sections, `${path}.sections`));
    }
  }

  return fields;
}

function validateEntity(entity, filename) {
  const issues = [];
  const entityId = entity.id || 'unknown';

  const contentFields = extractContentFields(entity);

  for (const { path, content } of contentFields) {
    // Check for disallowed JSX patterns
    for (const { pattern, name } of JSX_PATTERNS) {
      const matches = content.match(pattern);
      if (matches) {
        issues.push({
          entityId,
          field: path,
          type: 'error',
          message: `Contains JSX component: ${name}`,
          matches: matches.slice(0, 3),
        });
      }
    }

    // Warn about <R> components (they work but could be cleaner as markdown links)
    const rMatches = content.match(R_COMPONENT_PATTERN);
    if (rMatches && rMatches.length > 5) {
      issues.push({
        entityId,
        field: path,
        type: 'warning',
        message: `Contains ${rMatches.length} <R> components (consider converting to markdown links in YAML)`,
        matches: [],
      });
    }

    // Check for broken table indicators (pipes not forming valid tables)
    const lines = content.split('\n');
    let inTable = false;
    let tableStart = -1;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const looksLikeTableRow = line.startsWith('|') && line.endsWith('|');

      if (looksLikeTableRow) {
        if (!inTable) {
          inTable = true;
          tableStart = i;
        }
      } else if (inTable && line === '') {
        // Blank line in middle of what looks like a table
        const nextLine = lines[i + 1]?.trim() || '';
        if (nextLine.startsWith('|') && nextLine.endsWith('|')) {
          issues.push({
            entityId,
            field: path,
            type: 'warning',
            message: `Possible broken table at line ${tableStart + 1} (blank line in table)`,
            matches: [],
          });
        }
        inTable = false;
      } else {
        inTable = false;
      }
    }
  }

  return issues;
}

function main() {
  console.log(`${colors.blue}Validating YAML content...${colors.reset}\n`);

  const files = readdirSync(DATA_DIR).filter(f => f.startsWith('ai-transition-model') && f.endsWith('.yaml'));

  let totalErrors = 0;
  let totalWarnings = 0;

  for (const file of files) {
    const filepath = join(DATA_DIR, file);
    const content = readFileSync(filepath, 'utf-8');
    const entities = parse(content) || [];

    const fileIssues = [];
    for (const entity of entities) {
      const issues = validateEntity(entity, file);
      fileIssues.push(...issues);
    }

    if (fileIssues.length > 0) {
      console.log(`${colors.yellow}${file}${colors.reset}`);

      for (const issue of fileIssues) {
        const icon = issue.type === 'error' ? `${colors.red}✗` : `${colors.yellow}⚠`;
        console.log(`  ${icon} ${issue.entityId}${colors.reset} (${issue.field})`);
        console.log(`    ${issue.message}`);
        if (issue.matches.length > 0) {
          for (const match of issue.matches) {
            console.log(`      ${colors.blue}→${colors.reset} ${match.slice(0, 60)}${match.length > 60 ? '...' : ''}`);
          }
        }

        if (issue.type === 'error') totalErrors++;
        else totalWarnings++;
      }
      console.log();
    }
  }

  // Summary
  console.log('─'.repeat(60));
  if (totalErrors === 0 && totalWarnings === 0) {
    console.log(`${colors.green}✓ No issues found${colors.reset}`);
  } else {
    if (totalErrors > 0) {
      console.log(`${colors.red}✗ ${totalErrors} error(s)${colors.reset} - JSX components should be removed from YAML`);
    }
    if (totalWarnings > 0) {
      console.log(`${colors.yellow}⚠ ${totalWarnings} warning(s)${colors.reset}`);
    }
  }

  process.exit(totalErrors > 0 ? 1 : 0);
}

main();
