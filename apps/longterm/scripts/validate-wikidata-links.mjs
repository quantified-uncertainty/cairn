#!/usr/bin/env node
/**
 * Validate Wikidata Links
 *
 * Fetches actual labels from Wikidata API and compares them to page IDs
 * to detect hallucinated or incorrect Q-IDs.
 *
 * Usage:
 *   node scripts/validate-wikidata-links.mjs           # Check all wikidata links
 *   node scripts/validate-wikidata-links.mjs --fix     # Suggest corrections
 *   node scripts/validate-wikidata-links.mjs --apply   # Auto-fix with best matches
 *   node scripts/validate-wikidata-links.mjs --verbose # Show all entries, not just problems
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const EXTERNAL_LINKS_PATH = path.join(ROOT, 'src/data/external-links.yaml');

const args = process.argv.slice(2);
const verbose = args.includes('--verbose');
const fix = args.includes('--fix') || args.includes('--apply');
const apply = args.includes('--apply');

// Rate limiting: Wikidata allows 200 req/min for anonymous users
const BATCH_SIZE = 50;
const BATCH_DELAY_MS = 1000;

/**
 * Fetch labels for multiple Q-IDs from Wikidata API
 */
async function fetchWikidataLabels(qids) {
  const url = new URL('https://www.wikidata.org/w/api.php');
  url.searchParams.set('action', 'wbgetentities');
  url.searchParams.set('ids', qids.join('|'));
  url.searchParams.set('props', 'labels|descriptions|aliases');
  url.searchParams.set('languages', 'en');
  url.searchParams.set('format', 'json');

  const response = await fetch(url.toString(), {
    headers: {
      'User-Agent': 'CairnWikidataValidator/1.0 (https://github.com/cairn)'
    }
  });

  if (!response.ok) {
    throw new Error(`Wikidata API error: ${response.status}`);
  }

  const data = await response.json();
  return data.entities || {};
}

/**
 * Normalize text for comparison (lowercase, remove hyphens/underscores)
 */
function normalize(text) {
  return text.toLowerCase().replace(/[-_]/g, ' ').replace(/\s+/g, ' ').trim();
}

// Known abbreviations that map to full names
const KNOWN_ABBREVIATIONS = {
  'cais': 'center for ai safety',
  'miri': 'machine intelligence research institute',
  'fhi': 'future of humanity institute',
  'chai': 'center for human-compatible ai',
  'agi': 'artificial general intelligence',
  'rlhf': 'reinforcement learning from human feedback',
  'bci': 'brain computer interface',
};

/**
 * Check if the Wikidata label reasonably matches the page ID
 */
function checkMatch(pageId, wikidataLabel, wikidataDescription, wikidataAliases) {
  const normalizedPageId = normalize(pageId);
  const normalizedLabel = normalize(wikidataLabel || '');
  const normalizedDesc = normalize(wikidataDescription || '');
  const normalizedAliases = (wikidataAliases || []).map(a => normalize(a));

  // Direct match
  if (normalizedLabel.includes(normalizedPageId) || normalizedPageId.includes(normalizedLabel)) {
    return { match: true, reason: 'label match' };
  }

  // Check known abbreviations
  const knownExpansion = KNOWN_ABBREVIATIONS[normalizedPageId];
  if (knownExpansion && normalizedLabel.includes(knownExpansion)) {
    return { match: true, reason: 'abbreviation match' };
  }

  // Check aliases
  for (const alias of normalizedAliases) {
    if (alias.includes(normalizedPageId) || normalizedPageId.includes(alias)) {
      return { match: true, reason: 'alias match' };
    }
  }

  // Check description for key terms
  const pageTerms = normalizedPageId.split(' ');
  const matchingTerms = pageTerms.filter(term =>
    term.length > 3 && (normalizedLabel.includes(term) || normalizedDesc.includes(term))
  );

  if (matchingTerms.length >= Math.ceil(pageTerms.length / 2)) {
    return { match: true, reason: 'partial term match' };
  }

  // Check for common AI safety related terms
  const aiTerms = ['ai', 'artificial', 'intelligence', 'machine', 'learning', 'robot', 'autonomous'];
  const pageHasAiTerms = pageTerms.some(t => aiTerms.includes(t));
  const labelHasAiTerms = aiTerms.some(t => normalizedLabel.includes(t) || normalizedDesc.includes(t));

  if (pageHasAiTerms && !labelHasAiTerms) {
    return { match: false, reason: 'page is AI-related but Wikidata entry is not' };
  }

  return { match: false, reason: 'no term overlap' };
}

/**
 * Search Wikidata for the correct Q-ID given a search term
 */
async function searchWikidata(searchTerm) {
  const url = new URL('https://www.wikidata.org/w/api.php');
  url.searchParams.set('action', 'wbsearchentities');
  url.searchParams.set('search', searchTerm);
  url.searchParams.set('language', 'en');
  url.searchParams.set('limit', '5');
  url.searchParams.set('format', 'json');

  const response = await fetch(url.toString(), {
    headers: {
      'User-Agent': 'CairnWikidataValidator/1.0 (https://github.com/cairn)'
    }
  });

  if (!response.ok) {
    return [];
  }

  const data = await response.json();
  return data.search || [];
}

/**
 * Score how well a search result matches the page ID
 */
function scoreMatch(pageId, searchResult) {
  const normalizedPageId = normalize(pageId);
  const normalizedLabel = normalize(searchResult.label || '');
  const normalizedDesc = normalize(searchResult.description || '');

  let score = 0;

  // Exact label match is best
  if (normalizedLabel === normalizedPageId) {
    score += 100;
  } else if (normalizedLabel.includes(normalizedPageId) || normalizedPageId.includes(normalizedLabel)) {
    score += 50;
  }

  // Check for AI/safety/research terms in description (relevant for this domain)
  const relevantTerms = ['ai', 'artificial', 'intelligence', 'safety', 'research', 'risk',
    'machine', 'learning', 'philosophy', 'ethics', 'altruism', 'existential'];
  for (const term of relevantTerms) {
    if (normalizedDesc.includes(term)) score += 5;
  }

  // Penalize Wikimedia categories and disambiguation pages
  if (normalizedDesc.includes('wikimedia') || normalizedDesc.includes('disambiguation')) {
    score -= 50;
  }

  // Penalize results that are clearly wrong domain (plants, insects, locations)
  const wrongDomain = ['species', 'plant', 'insect', 'commune', 'village', 'hill', 'mountain',
    'neighborhood', 'scientific article', 'song', 'album'];
  for (const term of wrongDomain) {
    if (normalizedDesc.includes(term)) score -= 30;
  }

  return score;
}

async function main() {
  console.log('Validating Wikidata links...\n');

  // Load external links
  const externalLinks = yaml.load(fs.readFileSync(EXTERNAL_LINKS_PATH, 'utf-8'));
  const externalLinksMap = new Map(externalLinks.map(e => [e.pageId, e]));

  // Extract entries with wikidata links
  const wikidataEntries = externalLinks
    .filter(entry => entry.links?.wikidata)
    .map(entry => {
      const url = entry.links.wikidata;
      const qidMatch = url.match(/Q(\d+)/);
      return {
        pageId: entry.pageId,
        url,
        qid: qidMatch ? `Q${qidMatch[1]}` : null
      };
    })
    .filter(e => e.qid);

  console.log(`Found ${wikidataEntries.length} pages with Wikidata links\n`);

  // Fetch labels in batches
  const results = [];
  for (let i = 0; i < wikidataEntries.length; i += BATCH_SIZE) {
    const batch = wikidataEntries.slice(i, i + BATCH_SIZE);
    const qids = batch.map(e => e.qid);

    process.stdout.write(`Fetching batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(wikidataEntries.length / BATCH_SIZE)}...`);

    try {
      const entities = await fetchWikidataLabels(qids);

      for (const entry of batch) {
        const entity = entities[entry.qid];
        if (entity) {
          const label = entity.labels?.en?.value || '(no English label)';
          const description = entity.descriptions?.en?.value || '';
          const aliases = entity.aliases?.en?.map(a => a.value) || [];

          const { match, reason } = checkMatch(entry.pageId, label, description, aliases);

          results.push({
            ...entry,
            label,
            description,
            aliases,
            match,
            reason
          });
        } else {
          results.push({
            ...entry,
            label: '(Q-ID not found)',
            description: '',
            aliases: [],
            match: false,
            reason: 'Q-ID does not exist'
          });
        }
      }

      console.log(' done');
    } catch (error) {
      console.log(` error: ${error.message}`);
    }

    // Rate limiting
    if (i + BATCH_SIZE < wikidataEntries.length) {
      await new Promise(resolve => setTimeout(resolve, BATCH_DELAY_MS));
    }
  }

  // Report results
  const problems = results.filter(r => !r.match);
  const ok = results.filter(r => r.match);

  console.log('\n' + '='.repeat(80));

  const fixes = []; // Track fixes for --apply mode

  if (problems.length > 0) {
    console.log(`\n${'!'} POTENTIAL PROBLEMS (${problems.length}):\n`);

    for (const p of problems) {
      console.log(`  ${p.pageId}`);
      console.log(`    Current: ${p.qid} = "${p.label}"`);
      if (p.description) {
        console.log(`    Desc: ${p.description.slice(0, 80)}${p.description.length > 80 ? '...' : ''}`);
      }
      console.log(`    Reason: ${p.reason}`);
      console.log(`    URL: ${p.url}`);

      if (fix) {
        // Search for better matches
        const searchResults = await searchWikidata(p.pageId.replace(/-/g, ' '));
        if (searchResults.length > 0) {
          // Score and sort results
          const scored = searchResults.map(s => ({
            ...s,
            score: scoreMatch(p.pageId, s)
          })).sort((a, b) => b.score - a.score);

          console.log(`    Suggestions:`);
          for (const s of scored.slice(0, 3)) {
            const marker = apply && s === scored[0] && s.score > 0 ? ' <-- APPLYING' : '';
            console.log(`      - ${s.id}: "${s.label}" - ${s.description || '(no description)'}${marker}`);
          }

          // If applying and we have a good match, record it
          if (apply && scored[0] && scored[0].score > 0) {
            fixes.push({
              pageId: p.pageId,
              oldQid: p.qid,
              newQid: scored[0].id,
              newLabel: scored[0].label
            });
          } else if (apply) {
            console.log(`    ⚠ No confident match found, skipping`);
          }
        } else if (apply) {
          console.log(`    ⚠ No search results, skipping`);
        }
        await new Promise(resolve => setTimeout(resolve, 500)); // Rate limit searches
      }

      console.log();
    }
  }

  if (verbose && ok.length > 0) {
    console.log(`\nVALIDATED OK (${ok.length}):\n`);
    for (const o of ok) {
      console.log(`  ${o.pageId} -> ${o.qid} = "${o.label}" (${o.reason})`);
    }
  }

  // Apply fixes if requested
  if (apply && fixes.length > 0) {
    console.log('\n' + '='.repeat(80));
    console.log(`\nApplying ${fixes.length} fixes to external-links.yaml...\n`);

    for (const fix of fixes) {
      const entry = externalLinksMap.get(fix.pageId);
      if (entry) {
        entry.links.wikidata = `https://www.wikidata.org/wiki/${fix.newQid}`;
        console.log(`  Fixed: ${fix.pageId} -> ${fix.newQid} ("${fix.newLabel}")`);
      }
    }

    // Write back to file
    const yamlContent = yaml.dump(externalLinks, { lineWidth: 120, noRefs: true });
    fs.writeFileSync(EXTERNAL_LINKS_PATH, yamlContent);
    console.log(`\nWrote ${fixes.length} fixes to ${EXTERNAL_LINKS_PATH}`);
  }

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log(`\nSummary:`);
  console.log(`  Total checked: ${results.length}`);
  console.log(`  OK: ${ok.length}`);
  console.log(`  Problems: ${problems.length}`);
  if (apply) {
    console.log(`  Fixed: ${fixes.length}`);
    console.log(`  Remaining: ${problems.length - fixes.length}`);
  }

  if (problems.length > 0 && !apply) {
    console.log(`\nRun with --fix to see suggested corrections.`);
    console.log(`Run with --apply to auto-fix with best matches.`);
    process.exit(1);
  } else if (problems.length > fixes.length && apply) {
    console.log(`\nSome problems could not be auto-fixed. Review manually.`);
    process.exit(1);
  } else {
    console.log(`\nAll Wikidata links validated successfully!`);
  }
}

main().catch(console.error);
