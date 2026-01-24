/**
 * Data Extraction Script
 *
 * Parses MDX files and extracts structured data from component props.
 * Outputs JSON that can be reviewed, deduplicated, and converted to YAML.
 *
 * Usage: node scripts/extract-data.mjs
 */

import { readFileSync, writeFileSync, readdirSync, statSync, mkdirSync, existsSync } from 'fs';
import { join, relative } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CONTENT_DIR = 'src/content/docs';
const OUTPUT_DIR = 'scripts/extracted';

// Components we want to extract data from
const TARGET_COMPONENTS = [
  'InfoBox',
  'DisagreementMap',
  'EstimateBox',
  'KeyQuestions',
  'EntityCard',
  'Crux',
  'CruxList',
];

// =============================================================================
// FILE DISCOVERY
// =============================================================================

function findMdxFiles(dir) {
  const files = [];

  function walk(currentDir) {
    const entries = readdirSync(currentDir);
    for (const entry of entries) {
      const fullPath = join(currentDir, entry);
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        walk(fullPath);
      } else if (entry.endsWith('.mdx')) {
        files.push(fullPath);
      }
    }
  }

  walk(dir);
  return files;
}

// =============================================================================
// COMPONENT EXTRACTION
// =============================================================================

/**
 * Extract JSX component usages from MDX content.
 */
function extractComponents(content, filePath) {
  const extractions = [];

  for (const componentName of TARGET_COMPONENTS) {
    // Match self-closing: <Component prop={value} />
    // Match with children: <Component prop={value}>...</Component>
    const pattern = new RegExp(
      `<${componentName}\\s+([\\s\\S]*?)(?:/>|>([\\s\\S]*?)</${componentName}>)`,
      'g'
    );

    let match;
    while ((match = pattern.exec(content)) !== null) {
      const propsString = match[1];
      const lineNumber = content.slice(0, match.index).split('\n').length;

      try {
        const props = parseProps(propsString);
        extractions.push({
          sourceFile: filePath,
          component: componentName,
          props,
          rawText: match[0].slice(0, 1000),
          lineNumber,
        });
      } catch (e) {
        console.warn(`Failed to parse ${componentName} in ${filePath}:${lineNumber}`, e.message);
      }
    }
  }

  return extractions;
}

/**
 * Parse JSX props string into an object.
 * This handles nested objects and arrays by finding matching braces.
 */
function parseProps(propsString) {
  const props = {};

  // First, handle simple string props: prop="value"
  const stringPropPattern = /(\w+)="([^"]*)"/g;
  let match;
  while ((match = stringPropPattern.exec(propsString)) !== null) {
    props[match[1]] = match[2];
  }

  // Then handle JSX expression props: prop={...}
  // We need to find matching braces
  const jsxPropPattern = /(\w+)=\{/g;
  while ((match = jsxPropPattern.exec(propsString)) !== null) {
    const propName = match[1];
    const startIndex = match.index + match[0].length;

    // Find matching closing brace
    let depth = 1;
    let endIndex = startIndex;
    while (depth > 0 && endIndex < propsString.length) {
      if (propsString[endIndex] === '{') depth++;
      if (propsString[endIndex] === '}') depth--;
      endIndex++;
    }

    const jsValue = propsString.slice(startIndex, endIndex - 1);

    try {
      // Try to parse as JSON-like
      let jsonLike = jsValue
        .replace(/'/g, '"')
        // Quote unquoted keys
        .replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3')
        // Remove trailing commas
        .replace(/,(\s*[}\]])/g, '$1');

      props[propName] = JSON.parse(jsonLike);
    } catch {
      // Store as raw string
      props[propName] = jsValue.trim();
    }
  }

  return props;
}

// =============================================================================
// DATA NORMALIZATION
// =============================================================================

function normalizeId(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function processExtractions(extractions) {
  const experts = new Map();
  const organizations = new Map();
  const estimates = [];
  const positions = [];
  const cruxes = [];

  for (const extraction of extractions) {
    const { component, props, sourceFile } = extraction;

    // Extract from InfoBox
    if (component === 'InfoBox') {
      const type = props.type;
      const title = props.title;

      if (type === 'researcher' && title) {
        const id = normalizeId(title);
        if (!experts.has(id)) {
          experts.set(id, { name: title, mentions: [] });
        }
        experts.get(id).mentions.push({
          file: sourceFile,
          context: 'InfoBox',
          role: props.role,
          affiliation: props.affiliation,
          knownFor: props.knownFor,
          website: props.website,
        });
      }

      if ((type === 'lab' || type === 'organization') && title) {
        const id = normalizeId(title);
        if (!organizations.has(id)) {
          organizations.set(id, { name: title, mentions: [] });
        }
        organizations.get(id).mentions.push({
          file: sourceFile,
          context: 'InfoBox',
          type: type,
        });
      }
    }

    // Extract from DisagreementMap
    if (component === 'DisagreementMap') {
      const topic = props.topic;
      const positionsArr = Array.isArray(props.positions) ? props.positions : [];

      for (const pos of positionsArr) {
        const actor = pos.actor || pos.name;
        if (actor) {
          const id = normalizeId(actor);
          if (!experts.has(id)) {
            experts.set(id, { name: actor, mentions: [] });
          }
          experts.get(id).mentions.push({
            file: sourceFile,
            context: `DisagreementMap: ${topic}`,
            estimate: pos.estimate,
            position: pos.position,
            confidence: pos.confidence,
            source: pos.source,
            url: pos.url,
          });

          positions.push({
            actor,
            actorId: id,
            topic: topic || 'unknown',
            position: pos.position || pos.description || '',
            estimate: pos.estimate,
            confidence: pos.confidence,
            source: pos.source,
            url: pos.url,
            file: sourceFile,
          });
        }
      }
    }

    // Extract from EstimateBox
    if (component === 'EstimateBox') {
      const variable = props.variable;
      const estimatesArr = Array.isArray(props.estimates) ? props.estimates : [];

      for (const est of estimatesArr) {
        estimates.push({
          variable: variable || 'unknown',
          source: est.source || 'unknown',
          value: est.value || '',
          date: est.date,
          url: est.url,
          notes: est.notes,
          file: sourceFile,
        });
      }
    }

    // Extract from Crux
    if (component === 'Crux') {
      cruxes.push({
        id: props.id,
        question: props.question || '',
        domain: props.domain,
        description: props.description,
        importance: props.importance,
        resolvability: props.resolvability,
        currentState: props.currentState,
        positions: props.positions || [],
        wouldUpdateOn: props.wouldUpdateOn || [],
        relatedCruxes: props.relatedCruxes || [],
        relevantResearch: props.relevantResearch || [],
        file: sourceFile,
      });
    }
  }

  return {
    experts,
    organizations,
    estimates,
    positions,
    cruxes,
    rawExtractions: extractions,
  };
}

// =============================================================================
// OUTPUT
// =============================================================================

function writeResults(result) {
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Write raw extractions
  writeFileSync(
    join(OUTPUT_DIR, 'raw-extractions.json'),
    JSON.stringify(result.rawExtractions, null, 2)
  );

  // Write experts
  const expertsArray = Array.from(result.experts.entries()).map(([id, data]) => ({
    id,
    ...data,
  }));
  writeFileSync(
    join(OUTPUT_DIR, 'experts-extracted.json'),
    JSON.stringify(expertsArray, null, 2)
  );

  // Write organizations
  const orgsArray = Array.from(result.organizations.entries()).map(([id, data]) => ({
    id,
    ...data,
  }));
  writeFileSync(
    join(OUTPUT_DIR, 'organizations-extracted.json'),
    JSON.stringify(orgsArray, null, 2)
  );

  // Write estimates (deduplicated by variable+source)
  const uniqueEstimates = [];
  const seen = new Set();
  for (const est of result.estimates) {
    const key = `${est.variable}::${est.source}::${est.value}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueEstimates.push(est);
    }
  }
  writeFileSync(
    join(OUTPUT_DIR, 'estimates-extracted.json'),
    JSON.stringify(uniqueEstimates, null, 2)
  );

  // Write positions
  writeFileSync(
    join(OUTPUT_DIR, 'positions-extracted.json'),
    JSON.stringify(result.positions, null, 2)
  );

  // Write cruxes
  writeFileSync(
    join(OUTPUT_DIR, 'cruxes-extracted.json'),
    JSON.stringify(result.cruxes, null, 2)
  );

  // Write summary
  const summary = {
    totalFiles: new Set(result.rawExtractions.map(e => e.sourceFile)).size,
    totalExtractions: result.rawExtractions.length,
    uniqueExperts: result.experts.size,
    uniqueOrganizations: result.organizations.size,
    totalEstimates: result.estimates.length,
    uniqueEstimates: uniqueEstimates.length,
    totalPositions: result.positions.length,
    totalCruxes: result.cruxes.length,
    byComponent: {},
  };

  for (const extraction of result.rawExtractions) {
    summary.byComponent[extraction.component] =
      (summary.byComponent[extraction.component] || 0) + 1;
  }

  writeFileSync(
    join(OUTPUT_DIR, 'summary.json'),
    JSON.stringify(summary, null, 2)
  );

  console.log('\n=== Extraction Summary ===');
  console.log(`Files processed: ${summary.totalFiles}`);
  console.log(`Total component usages: ${summary.totalExtractions}`);
  console.log(`Unique experts found: ${summary.uniqueExperts}`);
  console.log(`Unique organizations found: ${summary.uniqueOrganizations}`);
  console.log(`Total estimates: ${summary.totalEstimates} (${summary.uniqueEstimates} unique)`);
  console.log(`Total positions: ${summary.totalPositions}`);
  console.log(`Total cruxes: ${summary.totalCruxes}`);
  console.log('\nBy component:');
  for (const [comp, count] of Object.entries(summary.byComponent)) {
    console.log(`  ${comp}: ${count}`);
  }
  console.log(`\nOutput written to: ${OUTPUT_DIR}/`);
}

// =============================================================================
// MAIN
// =============================================================================

function main() {
  console.log('Scanning for MDX files...');
  const files = findMdxFiles(CONTENT_DIR);
  console.log(`Found ${files.length} MDX files`);

  const allExtractions = [];

  for (const file of files) {
    const content = readFileSync(file, 'utf-8');
    const extractions = extractComponents(content, relative(process.cwd(), file));
    allExtractions.push(...extractions);
  }

  console.log(`\nExtracted ${allExtractions.length} component usages`);

  const result = processExtractions(allExtractions);
  writeResults(result);
}

main();
