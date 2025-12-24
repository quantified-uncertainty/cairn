/**
 * Data Extraction Script
 *
 * Parses MDX files and extracts structured data from component props.
 * Outputs JSON that can be reviewed, deduplicated, and converted to YAML.
 *
 * Usage: npx ts-node scripts/extract-data.ts
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

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

interface ExtractedData {
  sourceFile: string;
  component: string;
  props: Record<string, unknown>;
  rawText: string;
  lineNumber: number;
}

interface ExtractionResult {
  experts: Map<string, ExtractedExpert>;
  organizations: Map<string, ExtractedOrg>;
  estimates: ExtractedEstimate[];
  positions: ExtractedPosition[];
  cruxes: ExtractedCrux[];
  glossaryTerms: ExtractedGlossaryTerm[];
  rawExtractions: ExtractedData[];
}

interface ExtractedExpert {
  name: string;
  mentions: Array<{
    file: string;
    context: string;
    role?: string;
    affiliation?: string;
    estimate?: string;
    position?: string;
  }>;
}

interface ExtractedOrg {
  name: string;
  mentions: Array<{
    file: string;
    context: string;
    type?: string;
  }>;
}

interface ExtractedEstimate {
  variable: string;
  source: string;
  value: string;
  date?: string;
  file: string;
}

interface ExtractedPosition {
  actor: string;
  topic: string;
  position: string;
  estimate?: string;
  file: string;
}

interface ExtractedCrux {
  id?: string;
  question: string;
  positions: unknown[];
  file: string;
}

interface ExtractedGlossaryTerm {
  term: string;
  definition: string;
}

// =============================================================================
// FILE DISCOVERY
// =============================================================================

function findMdxFiles(dir: string): string[] {
  const files: string[] = [];

  function walk(currentDir: string) {
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
 * This is a regex-based approach that handles most cases.
 */
function extractComponents(content: string, filePath: string): ExtractedData[] {
  const extractions: ExtractedData[] = [];

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
          rawText: match[0].slice(0, 500), // Truncate for readability
          lineNumber,
        });
      } catch (e) {
        console.warn(`Failed to parse ${componentName} in ${filePath}:${lineNumber}`);
      }
    }
  }

  return extractions;
}

/**
 * Parse JSX props string into an object.
 * Handles: prop="string", prop={expression}, prop={[array]}, prop={{object}}
 */
function parseProps(propsString: string): Record<string, unknown> {
  const props: Record<string, unknown> = {};

  // Match prop="value" or prop={value}
  const propPattern = /(\w+)=(?:"([^"]*)"|{([^{}]*(?:{[^{}]*}[^{}]*)*)})/g;

  let match;
  while ((match = propPattern.exec(propsString)) !== null) {
    const [, name, stringValue, jsValue] = match;

    if (stringValue !== undefined) {
      props[name] = stringValue;
    } else if (jsValue !== undefined) {
      try {
        // Try to evaluate as JSON-like structure
        // Replace single quotes with double quotes for JSON parsing
        let jsonLike = jsValue
          .replace(/'/g, '"')
          .replace(/(\w+):/g, '"$1":') // Quote object keys
          .replace(/,\s*}/g, '}')      // Remove trailing commas
          .replace(/,\s*]/g, ']');

        props[name] = JSON.parse(jsonLike);
      } catch {
        // Store as raw string if parsing fails
        props[name] = jsValue.trim();
      }
    }
  }

  return props;
}

// =============================================================================
// DATA NORMALIZATION
// =============================================================================

function normalizeId(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function processExtractions(extractions: ExtractedData[]): ExtractionResult {
  const experts = new Map<string, ExtractedExpert>();
  const organizations = new Map<string, ExtractedOrg>();
  const estimates: ExtractedEstimate[] = [];
  const positions: ExtractedPosition[] = [];
  const cruxes: ExtractedCrux[] = [];
  const glossaryTerms: ExtractedGlossaryTerm[] = [];

  for (const extraction of extractions) {
    const { component, props, sourceFile } = extraction;

    // Extract from InfoBox
    if (component === 'InfoBox') {
      const type = props.type as string;
      const title = props.title as string;

      if (type === 'researcher' && title) {
        const id = normalizeId(title);
        if (!experts.has(id)) {
          experts.set(id, { name: title, mentions: [] });
        }
        experts.get(id)!.mentions.push({
          file: sourceFile,
          context: 'InfoBox',
          role: props.role as string,
          affiliation: props.affiliation as string,
        });
      }

      if (type === 'lab' && title) {
        const id = normalizeId(title);
        if (!organizations.has(id)) {
          organizations.set(id, { name: title, mentions: [] });
        }
        organizations.get(id)!.mentions.push({
          file: sourceFile,
          context: 'InfoBox',
          type: type,
        });
      }
    }

    // Extract from DisagreementMap
    if (component === 'DisagreementMap') {
      const topic = props.topic as string;
      const positionsArr = props.positions as Array<Record<string, unknown>> || [];

      for (const pos of positionsArr) {
        const actor = (pos.actor || pos.name) as string;
        if (actor) {
          const id = normalizeId(actor);
          if (!experts.has(id)) {
            experts.set(id, { name: actor, mentions: [] });
          }
          experts.get(id)!.mentions.push({
            file: sourceFile,
            context: `DisagreementMap: ${topic}`,
            estimate: pos.estimate as string,
            position: pos.position as string,
          });

          positions.push({
            actor,
            topic: topic || 'unknown',
            position: (pos.position || pos.description) as string || '',
            estimate: pos.estimate as string,
            file: sourceFile,
          });
        }
      }
    }

    // Extract from EstimateBox
    if (component === 'EstimateBox') {
      const variable = props.variable as string;
      const estimatesArr = props.estimates as Array<Record<string, unknown>> || [];

      for (const est of estimatesArr) {
        estimates.push({
          variable: variable || 'unknown',
          source: est.source as string || 'unknown',
          value: est.value as string || '',
          date: est.date as string,
          file: sourceFile,
        });
      }
    }

    // Extract from Crux
    if (component === 'Crux') {
      cruxes.push({
        id: props.id as string,
        question: props.question as string || '',
        positions: props.positions as unknown[] || [],
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
    glossaryTerms,
    rawExtractions: extractions,
  };
}

// =============================================================================
// OUTPUT
// =============================================================================

function writeResults(result: ExtractionResult) {
  const { mkdirSync, existsSync } = require('fs');

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

  // Write estimates
  writeFileSync(
    join(OUTPUT_DIR, 'estimates-extracted.json'),
    JSON.stringify(result.estimates, null, 2)
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
    totalPositions: result.positions.length,
    totalCruxes: result.cruxes.length,
    byComponent: {} as Record<string, number>,
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
  console.log(`Estimates extracted: ${summary.totalEstimates}`);
  console.log(`Positions extracted: ${summary.totalPositions}`);
  console.log(`Cruxes extracted: ${summary.totalCruxes}`);
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

  const allExtractions: ExtractedData[] = [];

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
