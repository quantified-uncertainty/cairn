#!/usr/bin/env node

/**
 * Content Generation Pipeline
 *
 * Generates MDX content from structured YAML input.
 * Used by Claude Code skills to create new content pages.
 *
 * Workflow:
 * 1. Read YAML input (from stdin or file)
 * 2. Validate against Zod schema
 * 3. Template to MDX using Handlebars
 * 4. Write to appropriate location
 * 5. Run validation suite
 *
 * Usage:
 *   echo "yaml content" | node scripts/generate-content.mjs --type model
 *   node scripts/generate-content.mjs --type risk --file input.yaml
 *   node scripts/generate-content.mjs --type model --validate-only --file input.yaml
 *
 * Options:
 *   --type <model|risk|response>  Content type to generate (required)
 *   --file <path>                 Read input from file instead of stdin
 *   --output <path>               Custom output path (default: auto-generated)
 *   --validate-only               Only validate, don't write file
 *   --dry-run                     Show what would be generated without writing
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { parse as parseYaml } from 'yaml';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Parse arguments
const args = process.argv.slice(2);
const typeArg = args.find(a => a.startsWith('--type'));
const typeValue = typeArg ? args[args.indexOf(typeArg) + 1] : args.find((_, i) => args[i - 1] === '--type');
const fileArg = args.find((_, i) => args[i - 1] === '--file');
const outputArg = args.find((_, i) => args[i - 1] === '--output');
const validateOnly = args.includes('--validate-only');
const dryRun = args.includes('--dry-run');

const CONTENT_TYPE = typeValue;
const INPUT_FILE = fileArg;
const OUTPUT_PATH = outputArg;

const CONTENT_DIR = 'src/content/docs/knowledge-base';
const TEMPLATES_DIR = join(__dirname, 'templates');

// Type-specific output directories
const TYPE_DIRS = {
  model: 'models',
  risk: 'risks/accident',  // Default subcategory
  response: 'responses/technical',  // Default subcategory
};

// Simple Handlebars-like template engine
function compileTemplate(template, data) {
  let result = template;

  // Helper: {{#if condition}}...{{/if}}
  result = result.replace(/\{\{#if\s+([^}]+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (_, condition, content) => {
    const value = getNestedValue(data, condition.trim());
    return value ? content : '';
  });

  // Helper: {{#unless condition}}...{{/unless}}
  result = result.replace(/\{\{#unless\s+([^}]+)\}\}([\s\S]*?)\{\{\/unless\}\}/g, (_, condition, content) => {
    const value = getNestedValue(data, condition.trim());
    return !value ? content : '';
  });

  // Helper: {{#each array}}...{{/each}}
  result = result.replace(/\{\{#each\s+([^}]+)\}\}([\s\S]*?)\{\{\/each\}\}/g, (_, arrayPath, content) => {
    const array = getNestedValue(data, arrayPath.trim());
    if (!Array.isArray(array)) return '';

    return array.map((item, index) => {
      let itemContent = content;

      // Replace {{this}} with item value (for string arrays)
      if (typeof item === 'string') {
        itemContent = itemContent.replace(/\{\{this\}\}/g, item);
      }

      // Replace {{@index}} with index
      itemContent = itemContent.replace(/\{\{@index\}\}/g, String(index));

      // Replace {{inc @index}} with index + 1
      itemContent = itemContent.replace(/\{\{inc\s+@index\}\}/g, String(index + 1));

      // Replace {{@last}} check
      itemContent = itemContent.replace(/\{\{#unless\s+@last\}\}([\s\S]*?)\{\{\/unless\}\}/g,
        index < array.length - 1 ? '$1' : ''
      );

      // Replace direct property access {{property}}
      if (typeof item === 'object') {
        itemContent = itemContent.replace(/\{\{([a-zA-Z_][a-zA-Z0-9_]*)\}\}/g, (_, prop) => {
          return item[prop] !== undefined ? String(item[prop]) : '';
        });

        // Handle ../columns style references
        itemContent = itemContent.replace(/\{\{\.\.\/([a-zA-Z_][a-zA-Z0-9_.]*)\}\}/g, (_, path) => {
          return getNestedValue(data, path) !== undefined ? String(getNestedValue(data, path)) : '';
        });

        // Handle lookup helper: {{lookup ../this columnName}}
        itemContent = itemContent.replace(/\{\{lookup\s+\.\.\/this\s+([a-zA-Z_][a-zA-Z0-9_]*)\}\}/g, (_, key) => {
          return item[key] !== undefined ? String(item[key]) : '';
        });
      }

      return itemContent;
    }).join('');
  });

  // Replace simple variables {{path.to.value}}
  result = result.replace(/\{\{([a-zA-Z_][a-zA-Z0-9_.]*)\}\}/g, (_, path) => {
    const value = getNestedValue(data, path);
    return value !== undefined ? String(value) : '';
  });

  return result;
}

function getNestedValue(obj, path) {
  const parts = path.split('.');
  let current = obj;

  for (const part of parts) {
    if (current === undefined || current === null) return undefined;
    current = current[part];
  }

  return current;
}

// Dynamically import Zod schemas
async function loadSchemas() {
  // Since we can't easily import TypeScript, we'll implement basic validation
  // In production, you'd compile the TypeScript or use a bundler
  return {
    model: validateModelContent,
    risk: validateRiskContent,
    response: validateResponseContent,
  };
}

function validateModelContent(data) {
  const errors = [];

  // Required fields
  if (!data.frontmatter?.title) errors.push('frontmatter.title is required');
  if (!data.frontmatter?.description) errors.push('frontmatter.description is required');
  if (!data.frontmatter?.lastEdited) errors.push('frontmatter.lastEdited is required');
  if (!data.entityId) errors.push('entityId is required');
  if (!data.overview?.paragraphs?.length) errors.push('overview.paragraphs is required (2-3 paragraphs)');
  if (data.overview?.paragraphs?.length < 2) errors.push('overview needs at least 2 paragraphs');
  if (!data.conceptualFramework?.diagram) errors.push('conceptualFramework.diagram is required');
  if (!data.quantitativeAnalysis?.tables?.length) errors.push('quantitativeAnalysis.tables is required');
  if (!data.strategicImportance) errors.push('strategicImportance is required');
  if (!data.strategicImportance?.magnitude) errors.push('strategicImportance.magnitude is required');
  if (!data.strategicImportance?.keyCruxes?.length) errors.push('strategicImportance.keyCruxes is required (at least 2)');
  if (!data.limitations?.prose) errors.push('limitations.prose is required');

  return errors.length === 0 ? { success: true, data } : { success: false, errors };
}

function validateRiskContent(data) {
  const errors = [];

  if (!data.frontmatter?.title) errors.push('frontmatter.title is required');
  if (!data.frontmatter?.description) errors.push('frontmatter.description is required');
  if (!data.entityId) errors.push('entityId is required');
  if (!data.overview?.paragraphs?.length) errors.push('overview.paragraphs is required');
  if (!data.riskAssessment) errors.push('riskAssessment is required');
  if (!data.responsesCrossLinks?.length) errors.push('responsesCrossLinks is required');
  if (!data.whyThisMatters) errors.push('whyThisMatters is required');
  if (!data.keyUncertainties?.length) errors.push('keyUncertainties is required');

  return errors.length === 0 ? { success: true, data } : { success: false, errors };
}

function validateResponseContent(data) {
  const errors = [];

  if (!data.frontmatter?.title) errors.push('frontmatter.title is required');
  if (!data.frontmatter?.description) errors.push('frontmatter.description is required');
  if (!data.entityId) errors.push('entityId is required');
  if (!data.overview?.paragraphs?.length) errors.push('overview.paragraphs is required');
  if (!data.quickAssessment) errors.push('quickAssessment is required');
  if (!data.risksAddressed?.length) errors.push('risksAddressed is required');
  if (!data.howItWorks) errors.push('howItWorks is required');
  if (!data.criticalAssessment) errors.push('criticalAssessment is required');

  return errors.length === 0 ? { success: true, data } : { success: false, errors };
}

// Read input from stdin or file
async function readInput() {
  if (INPUT_FILE) {
    return readFileSync(INPUT_FILE, 'utf-8');
  }

  // Read from stdin
  return new Promise((resolve) => {
    let input = '';
    process.stdin.setEncoding('utf-8');
    process.stdin.on('data', chunk => input += chunk);
    process.stdin.on('end', () => resolve(input));

    // Handle case where stdin is empty/not provided
    setTimeout(() => {
      if (!input) {
        console.error('Error: No input provided. Use --file or pipe YAML to stdin.');
        process.exit(1);
      }
    }, 1000);
  });
}

// Run validation on generated file
async function runValidation(filePath) {
  return new Promise((resolve) => {
    const child = spawn('node', ['scripts/validate-mdx-syntax.mjs'], {
      cwd: process.cwd(),
      stdio: 'inherit',
    });

    child.on('close', (code) => {
      resolve(code === 0);
    });
  });
}

async function main() {
  // Validate arguments
  if (!CONTENT_TYPE || !['model', 'risk', 'response'].includes(CONTENT_TYPE)) {
    console.error('Error: --type must be one of: model, risk, response');
    console.error('\nUsage: node scripts/generate-content.mjs --type <type> [--file input.yaml]');
    process.exit(1);
  }

  console.log(`\n📝 Content Generation Pipeline\n${'─'.repeat(40)}\n`);
  console.log(`Type: ${CONTENT_TYPE}`);

  // Load schemas
  const schemas = await loadSchemas();
  const validate = schemas[CONTENT_TYPE];

  // Read input
  console.log('Reading input...');
  let inputYaml;
  try {
    inputYaml = await readInput();
  } catch (e) {
    console.error('Error reading input:', e.message);
    process.exit(1);
  }

  // Parse YAML
  console.log('Parsing YAML...');
  let data;
  try {
    data = parseYaml(inputYaml);
  } catch (e) {
    console.error('Error parsing YAML:', e.message);
    process.exit(1);
  }

  // Validate
  console.log('Validating against schema...');
  const validationResult = validate(data);

  if (!validationResult.success) {
    console.error('\n❌ Validation failed:\n');
    for (const error of validationResult.errors) {
      console.error(`  • ${error}`);
    }
    console.error('\nFix these issues and try again.');
    process.exit(1);
  }

  console.log('✓ Validation passed\n');

  if (validateOnly) {
    console.log('--validate-only: Stopping here.');
    process.exit(0);
  }

  // Load template
  const templatePath = join(TEMPLATES_DIR, `${CONTENT_TYPE}.mdx.hbs`);
  if (!existsSync(templatePath)) {
    console.error(`Error: Template not found at ${templatePath}`);
    process.exit(1);
  }

  const template = readFileSync(templatePath, 'utf-8');

  // Generate MDX
  console.log('Generating MDX...');
  const mdxContent = compileTemplate(template, data);

  // Determine output path
  const outputDir = join(CONTENT_DIR, TYPE_DIRS[CONTENT_TYPE]);
  const outputFile = OUTPUT_PATH || join(outputDir, `${data.entityId}.mdx`);

  if (dryRun) {
    console.log('\n--dry-run: Would write to:', outputFile);
    console.log('\n--- Generated Content ---\n');
    console.log(mdxContent);
    console.log('\n--- End ---\n');
    process.exit(0);
  }

  // Write file
  console.log(`Writing to: ${outputFile}`);
  try {
    writeFileSync(outputFile, mdxContent, 'utf-8');
    console.log('✓ File written successfully\n');
  } catch (e) {
    console.error('Error writing file:', e.message);
    process.exit(1);
  }

  // Run validation
  console.log('Running validation...');
  const validationPassed = await runValidation(outputFile);

  if (!validationPassed) {
    console.error('\n⚠️  Generated file has validation warnings.');
    console.error('Review and fix any issues manually.');
  } else {
    console.log('✓ Validation passed\n');
  }

  console.log('${'─'.repeat(40)}\n');
  console.log(`✅ Content generated successfully!`);
  console.log(`   ${outputFile}\n`);
  console.log('Next steps:');
  console.log('  1. Review the generated content');
  console.log('  2. Add entity to src/data/entities.yaml');
  console.log('  3. Run npm run build:data');
  console.log('  4. Run npm run validate\n');
}

main().catch(console.error);
