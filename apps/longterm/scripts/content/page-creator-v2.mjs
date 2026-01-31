#!/usr/bin/env node

/**
 * Page Creator V2 - Research-First Pipeline
 *
 * Creates high-quality wiki pages using a multi-phase research pipeline:
 * 1. Research: Gather sources from SCRY (EA Forum/LessWrong) + Web (Wikipedia, official sites)
 * 2. Extract: Pull cited facts into structured format with entity detection
 * 3. Synthesize: Write article from extracted facts with proper wiki conventions
 * 4. Review: Identify gaps, verify wiki convention compliance
 * 5. Gap-fill: Research missing topics
 * 6. Polish: Final integration and quality pass
 *
 * Research Sources:
 * - SCRY API (exopriors.ai): EA Forum, LessWrong, arXiv community posts
 * - Web Search: Wikipedia, official sites, news, Open Philanthropy grants
 *
 * Wiki Conventions Enforced:
 * - GFM footnotes [^1] with Sources section (NOT inline links)
 * - EntityLink components for internal references
 * - KeyPeople, KeyQuestions, Section components
 * - Proper frontmatter (quality, importance, ratings)
 * - Escaped dollar signs and comparison operators
 *
 * Usage:
 *   node scripts/content/page-creator-v2.mjs "SecureBio" --tier standard
 *   node scripts/content/page-creator-v2.mjs "Community Notes" --tier premium --output ./output.mdx
 *   node scripts/content/page-creator-v2.mjs --help
 *
 * Tiers:
 *   budget   ($3-5):   Basic research + single synthesis pass
 *   standard ($8-12):  Full 6-phase pipeline with Opus synthesis
 *   premium  ($15-25): Deep research, multiple review passes
 */

import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '../..');
const TEMP_DIR = path.join(ROOT, '.claude/temp/page-creator');

// ============ Configuration ============

const TIERS = {
  budget: {
    name: 'Budget',
    estimatedCost: '$3-5',
    phases: ['research-lite', 'extract', 'synthesize-sonnet', 'verify'],
    description: 'Basic research + Sonnet synthesis'
  },
  standard: {
    name: 'Standard',
    estimatedCost: '$8-12',
    phases: ['research', 'extract', 'synthesize-opus', 'review', 'gap-fill', 'polish'],
    description: 'Full pipeline with Opus synthesis'
  },
  premium: {
    name: 'Premium',
    estimatedCost: '$15-25',
    phases: ['research-deep', 'extract', 'synthesize-opus', 'critical-review', 'gap-fill', 'rewrite', 'polish'],
    description: 'Deep research, multiple review passes'
  }
};

const PHASE_CONFIG = {
  'research-lite': {
    model: 'sonnet',
    budget: 1.00,
    description: 'Basic source gathering'
  },
  'research': {
    model: 'sonnet',
    budget: 2.00,
    description: 'Comprehensive source gathering'
  },
  'research-deep': {
    model: 'sonnet',
    budget: 4.00,
    description: 'Deep research with multiple tools'
  },
  'extract': {
    model: 'sonnet',
    budget: 1.50,
    description: 'Extract cited facts from sources'
  },
  'synthesize-sonnet': {
    model: 'sonnet',
    budget: 1.50,
    description: 'Write article from facts (Sonnet)'
  },
  'synthesize-opus': {
    model: 'opus',
    budget: 2.50,
    description: 'Write article from facts (Opus)'
  },
  'verify': {
    model: 'haiku',
    budget: 0.50,
    description: 'Quick verification pass'
  },
  'review': {
    model: 'opus',
    budget: 1.50,
    description: 'Critical review for gaps'
  },
  'critical-review': {
    model: 'opus',
    budget: 2.00,
    description: 'Deep critical review (skeptic role)'
  },
  'gap-fill': {
    model: 'sonnet',
    budget: 1.50,
    description: 'Research missing topics'
  },
  'rewrite': {
    model: 'opus',
    budget: 2.00,
    description: 'Full rewrite with new material'
  },
  'polish': {
    model: 'opus',
    budget: 1.50,
    description: 'Final quality pass'
  }
};

// ============ Utility Functions ============

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function log(phase, message) {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  console.log(`[${timestamp}] [${phase}] ${message}`);
}

function saveIntermediateResult(topic, phase, data) {
  const sanitizedTopic = topic.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const filePath = path.join(TEMP_DIR, sanitizedTopic, `${phase}.json`);
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  return filePath;
}

function loadIntermediateResult(topic, phase) {
  const sanitizedTopic = topic.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const filePath = path.join(TEMP_DIR, sanitizedTopic, `${phase}.json`);
  if (fs.existsSync(filePath)) {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  }
  return null;
}

// ============ Claude Code SDK Runner ============

function runClaudePhase(prompt, options = {}) {
  const {
    model = 'sonnet',
    budget = 2.00,
    allowedTools = 'Read,Write,Glob,Grep,WebSearch,WebFetch'
  } = options;

  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    // Use stdin piping for long prompts with special characters
    const claude = spawn('npx', [
      '@anthropic-ai/claude-code',
      '-p',  // Read prompt from stdin
      '--print',
      '--dangerously-skip-permissions',
      '--model', model,
      '--max-budget-usd', String(budget),
      '--allowedTools', allowedTools
    ], {
      cwd: ROOT,
      env: { ...process.env },
      stdio: ['pipe', 'pipe', 'pipe']  // Enable stdin
    });

    // Write prompt to stdin and close it
    claude.stdin.write(prompt);
    claude.stdin.end();

    let stdout = '';
    let stderr = '';

    claude.stdout.on('data', (data) => {
      stdout += data.toString();
      // Stream output for visibility
      process.stdout.write(data);
    });

    claude.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    claude.on('close', (code) => {
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);

      if (code === 0) {
        resolve({
          success: true,
          output: stdout,
          duration,
          model,
          budget
        });
      } else {
        reject(new Error(`Claude exited with code ${code}: ${stderr.slice(0, 500)}`));
      }
    });

    claude.on('error', (err) => {
      reject(err);
    });
  });
}

// ============ Phase Prompts ============

function getResearchPrompt(topic, depth = 'standard') {
  const searchCount = depth === 'deep' ? 15 : depth === 'lite' ? 5 : 10;
  const scrySearches = depth === 'deep' ? 8 : depth === 'lite' ? 3 : 5;
  const hasScryKey = !!process.env.EXOPRIORS_API_KEY;

  const scrySection = hasScryKey ? `
### Part 1: SCRY Research (EA Forum, LessWrong, etc.)
Use the SCRY API to search the ExoPriors research corpus. This includes LessWrong, EA Forum, arXiv, and more.

**SCRY Search Queries (perform ${scrySearches} searches):**
Use Bash to run curl commands with the EXOPRIORS_API_KEY environment variable:

\`\`\`bash
# Example SCRY search using SQL-like query syntax:
curl -s -X POST "https://exopriors.com/v1/scry/query" \\
  -H "Authorization: Bearer $EXOPRIORS_API_KEY" \\
  -H "Content-Type: text/plain" \\
  -d "SELECT title, url, source, published_at, content FROM documents WHERE scry.search(content, '${topic}') ORDER BY published_at DESC LIMIT 10"
\`\`\`

**SCRY Searches to perform:**
1. Main topic: "${topic}"
2. With criticism: "${topic} criticism OR critique"
3. Historical: "${topic} history OR founding"
4. Related to AI safety: "${topic} AI safety alignment"
5. Funding/org: "${topic} funding OR grant OR organization"

Parse the JSON response and extract relevant posts. Note the source (lesswrong, eaforum, arxiv) and karma/score.
` : `
### Part 1: SCRY Research - SKIPPED
SCRY API key not configured (EXOPRIORS_API_KEY). Falling back to web-only research.
To enable SCRY, set the EXOPRIORS_API_KEY environment variable.
`;

  return `# Research Phase: ${topic}

You are gathering sources for a comprehensive wiki article about "${topic}".

## Task
Perform research using web searches${hasScryKey ? ' AND SCRY (EA/rationalist community corpus)' : ''}.
${scrySection}

### Part ${hasScryKey ? '2' : '1'}: Web Research (${searchCount} searches)
Use WebSearch for:
1. **Wikipedia article** (if exists) - search: "${topic} Wikipedia"
2. **Primary sources** - official websites, about pages, documentation
3. **Historical sources** - founding stories, timeline events
4. **Statistical sources** - surveys, metrics, usage data, ProPublica nonprofit data
5. **Funding sources** - Open Philanthropy grants database, other funders
6. **External perspectives** - news articles, academic papers
7. **Critical perspectives** - critiques, controversies, limitations
8. **EA Forum/LessWrong** - search: "${topic} site:forum.effectivealtruism.org" or "site:lesswrong.com"

## Process
${hasScryKey ? '1. First, search SCRY for community perspectives and discussions\n2. Then perform' : '1. Perform'} web searches for official/external sources
${hasScryKey ? '3' : '2'}. For each relevant web result, use WebFetch to get the full content
${hasScryKey ? '4' : '3'}. Combine all sources into a unified file

## Output
Write a JSON file to .claude/temp/page-creator/${topic.toLowerCase().replace(/[^a-z0-9]+/g, '-')}/sources.json:

\`\`\`json
{
  "topic": "${topic}",
  "sources": [
    {
      "url": "https://...",
      "title": "Source Title",
      "type": "wikipedia|primary|historical|statistical|external|critical|community",
      "source": "web|scry-lesswrong|scry-eaforum|scry-arxiv",
      "relevance": "high|medium|low",
      "keyContent": "Summary of relevant content (500-1000 words)",
      "fetchedAt": "ISO timestamp"
    }
  ],
  "scrySources": [
    {
      "url": "https://...",
      "title": "Post/Paper Title",
      "author": "Author Name",
      "platform": "lesswrong|eaforum|arxiv",
      "keyContent": "Summary of relevant content",
      "karma": 100
    }
  ],
  "searchesPerformed": {
    "scry": ["query 1", "query 2"],
    "web": ["search query 1", "search query 2"]
  },
  "missingSourceTypes": ["any types we couldn't find good sources for"]
}
\`\`\`

Focus on QUALITY over quantity. We need authoritative, citable sources with real URLs.
CRITICAL: Include at least one critical/skeptical source if available - check SCRY for community critiques.`;
}

function getExtractionPrompt(topic) {
  return `# Extraction Phase: ${topic}

You are extracting citable facts from research sources.

## Task
Read the sources file and extract every factual claim with its citation.

## Input
Read: .claude/temp/page-creator/${topic.toLowerCase().replace(/[^a-z0-9]+/g, '-')}/sources.json

## Rules
- EVERY fact must have a source URL
- Include direct quotes where possible
- Note confidence level (high/medium/low)
- Flag claims that appear in multiple sources
- Separate facts from opinions/analysis
- For SCRY sources, include the platform (lesswrong, eaforum, arxiv)

## Output
Write to .claude/temp/page-creator/${topic.toLowerCase().replace(/[^a-z0-9]+/g, '-')}/facts.json:

\`\`\`json
{
  "topic": "${topic}",
  "facts": [
    {
      "claim": "The exact factual claim",
      "quote": "Direct quote if available",
      "sourceUrl": "https://...",
      "sourceTitle": "Source name",
      "sourceType": "official|wikipedia|news|community|academic",
      "platform": "web|lesswrong|eaforum|arxiv|openphil",
      "confidence": "high|medium|low",
      "category": "founding|team|funding|strategy|impact|criticism|controversy",
      "multipleSourcesConfirm": false
    }
  ],
  "statistics": [
    {
      "metric": "What's being measured",
      "value": "The number/percentage",
      "date": "When measured",
      "sourceUrl": "https://...",
      "sourceTitle": "Source name"
    }
  ],
  "people": [
    {
      "name": "Person Name",
      "role": "Current or past role",
      "background": "Brief background (1 sentence)",
      "sourceUrl": "https://..."
    }
  ],
  "funding": [
    {
      "amount": "Dollar amount (escape as \\\\$X)",
      "funder": "Funder name",
      "purpose": "What it was for",
      "year": "Year or date",
      "sourceUrl": "https://..."
    }
  ],
  "controversies": [
    {
      "topic": "Controversy name",
      "summary": "Brief description",
      "perspectives": ["view 1", "view 2"],
      "sourceUrl": "https://..."
    }
  ],
  "communityPerspectives": [
    {
      "summary": "Key insight from community discussion",
      "sentiment": "positive|negative|mixed|neutral",
      "platform": "lesswrong|eaforum",
      "sourceUrl": "https://...",
      "karma": 100
    }
  ],
  "relatedEntities": ["List of entity IDs that should be linked to"],
  "gaps": ["Topics we have no facts for"]
}
\`\`\`

## Entity ID Detection
Look for mentions of these common entities (for EntityLink usage):
- Organizations: open-philanthropy, anthropic, openai, deepmind, miri, lesswrong, redwood-research, arc
- People: eliezer-yudkowsky, paul-christiano, dario-amodei, jan-leike
- Concepts: scheming, deceptive-alignment, misuse-risks

Note any related entities in the "relatedEntities" field.

Be thorough but accurate. If unsure about a fact, mark confidence as "low".`;
}

function getSynthesisPrompt(topic, model = 'opus') {
  const articleGuidance = model === 'opus'
    ? 'Write thoughtful prose that synthesizes and analyzes, not just lists facts.'
    : 'Write clear, well-organized prose covering all the facts.';

  // Note: Import path depth varies by page location. This assumes safety-orgs depth.
  // Adjust the relative path based on where the final page will live.
  const importPath = "'../../../../../components/wiki'";

  return `# Synthesis Phase: ${topic}

You are writing a wiki article using ONLY the extracted facts.

## Input
Read: .claude/temp/page-creator/${topic.toLowerCase().replace(/[^a-z0-9]+/g, '-')}/facts.json

## CRITICAL RULES
1. **Use GFM footnotes for citations** - format: claim text[^1] with [^1]: [Source](url) at bottom
2. **If a fact isn't in the facts.json, DO NOT include it** - no hallucination
3. **Maximum 4 tables** - use prose for analysis, tables for comparative data only
4. **Minimum 60% prose** - not just tables and bullet points
5. **Include a Controversies/Criticisms section** if facts support it
6. **Escape dollar signs**: \\$100M not $100M
7. **Use EntityLink for internal references** - <EntityLink id="open-philanthropy">Open Philanthropy</EntityLink>

## Wiki Components to Use
- **EntityLink**: For linking to other wiki entities - <EntityLink id="entity-id">Display Name</EntityLink>
- **KeyPeople**: For team/leadership sections - <KeyPeople people={[{name, role, background}]} />
- **KeyQuestions**: For open questions - <KeyQuestions questions={["Question 1?", "Question 2?"]} />
- **Section**: For collapsible sections - <Section title="Title">content</Section>
- **Backlinks**: At the very end - <Backlinks />

## Known Entity IDs (use these for EntityLinks)
- open-philanthropy, anthropic, openai, deepmind, miri, lesswrong
- eliezer-yudkowsky, paul-christiano, dario-amodei
- misuse-risks, scheming, deceptive-alignment

## Citation Format
DO NOT use inline [Source](url) links. Instead use GFM footnotes:

Wrong: "The organization received funding [OP Grant](https://openphil.org/grant)."
Correct: "The organization received funding from Open Philanthropy.[^2]"

Then at the end of the article:
[^2]: [Open Philanthropy - Grant Title](https://openphil.org/grant)

## Article Structure
\`\`\`mdx
---
title: "${topic}"
description: "Comprehensive description (1-2 sentences)..."
sidebar:
  order: 50
quality: 70
lastEdited: "${new Date().toISOString().split('T')[0]}"
importance: 50
ratings:
  novelty: 5
  rigor: 5
  actionability: 5
  completeness: 5
---
import {DataInfoBox, Backlinks, EntityLink, DataExternalLinks, KeyPeople, KeyQuestions, Section} from ${importPath};

{/* DataInfoBox only if entity exists in data layer */}
{/* <DataInfoBox entityId="${topic.toLowerCase().replace(/[^a-z0-9]+/g, '-')}" /> */}

## Quick Assessment

| Dimension | Assessment | Evidence |
|-----------|------------|----------|
| **Focus Area** | Brief description | Evidence with citation[^1] |
| **Funding** | Amount/sources | Evidence[^2] |
| **Team Size** | Number | Source[^3] |
| **Key Concern** | Main uncertainty | Evidence[^4] |

## Overview

[2-3 paragraphs of prose with footnote citations. Use <EntityLink> for internal wiki links.]

## History

[Narrative prose organized by time periods, not just a timeline. Include founding, key milestones, strategic pivots.]

## [Topic-Specific Sections]

[Mix of prose and selective tables. Use KeyPeople component for team sections:]

<Section title="Leadership Team">
  <KeyPeople people={[
    { name: "Person Name", role: "Title", background: "Brief background" }
  ]} />
</Section>

## Criticisms and Controversies

[If facts support this section - include balanced perspectives]

## Key Uncertainties

<KeyQuestions questions={[
  "Open question 1?",
  "Open question 2?"
]} />

## Sources

[^1]: [Source Title](https://url) - Brief description
[^2]: [Source Title](https://url)
[^3]: [Source Title](https://url)

<Backlinks />
\`\`\`

## Ratings Guidance
- **quality** (1-100): Overall article quality. 60-75 for solid first drafts
- **importance** (1-100): How important is this topic to AI safety?
- **novelty** (1-10): How novel are the insights?
- **rigor** (1-10): How well-sourced and accurate?
- **actionability** (1-10): How actionable for readers?
- **completeness** (1-10): How comprehensive?

## Output
Write the complete article to: .claude/temp/page-creator/${topic.toLowerCase().replace(/[^a-z0-9]+/g, '-')}/draft.mdx

${articleGuidance}
Remember: If you can't cite it from facts.json, don't write it.
Use GFM footnotes, not inline links. Use EntityLink for internal references.`;
}

function getReviewPrompt(topic, depth = 'standard') {
  const perspective = depth === 'critical'
    ? `You are a SKEPTICAL editor who assumes the article is biased and incomplete.
       Look for: one-sided framing, missing counterarguments, overclaiming, unsourced assertions.`
    : `You are a thorough editor checking for quality and completeness.`;

  return `# Review Phase: ${topic}

${perspective}

## Input
Read: .claude/temp/page-creator/${topic.toLowerCase().replace(/[^a-z0-9]+/g, '-')}/draft.mdx

## Check For

### Content Issues
1. **Uncited claims** - Any factual statements without footnote citations [^N]
2. **Missing topics** - Important aspects of ${topic} not covered
3. **One-sided framing** - Only positive or only negative perspective
4. **Table overuse** - More than 4 tables, or tables that should be prose
5. **Vague language** - "significant", "many", "rapidly" without numbers
6. **Missing context** - Claims that need more explanation

### Wiki Convention Issues
7. **Wrong citation format** - Using [Source](url) instead of footnotes [^N]
8. **Missing EntityLinks** - Plain text mentions of known entities that should be linked
9. **Unescaped dollars** - $100 should be \\$100
10. **Missing components** - Should use KeyPeople, KeyQuestions where appropriate
11. **Missing frontmatter** - Check for quality, importance, ratings fields
12. **Broken footnotes** - Footnote references without definitions, or vice versa

### Known Entity IDs to Link
Check if these are mentioned but not linked:
- Organizations: open-philanthropy, anthropic, openai, deepmind, miri, lesswrong
- People: eliezer-yudkowsky, paul-christiano, dario-amodei
- Concepts: scheming, deceptive-alignment, misuse-risks

## Output
Write to .claude/temp/page-creator/${topic.toLowerCase().replace(/[^a-z0-9]+/g, '-')}/review.json:

\`\`\`json
{
  "overallAssessment": "Good/Needs Work/Major Issues",
  "estimatedQuality": 70,
  "wikiConventionCompliance": {
    "usesFootnotes": true,
    "hasEntityLinks": true,
    "dollarsEscaped": true,
    "hasRatings": true,
    "hasBacklinks": true
  },
  "uncitedClaims": [
    {"claim": "...", "location": "Section X, paragraph Y"}
  ],
  "missingTopics": [
    {"topic": "...", "importance": "high|medium|low", "suggestedSearches": ["..."]}
  ],
  "missingEntityLinks": [
    {"text": "Open Philanthropy", "suggestedId": "open-philanthropy", "location": "Overview, para 2"}
  ],
  "wrongCitationFormat": [
    {"location": "...", "current": "[Source](url)", "shouldBe": "[^N]"}
  ],
  "framingIssues": [
    {"issue": "...", "suggestion": "..."}
  ],
  "structuralIssues": [
    {"issue": "...", "suggestion": "..."}
  ],
  "specificFixes": [
    {"location": "...", "current": "...", "suggested": "..."}
  ]
}
\`\`\`

Be specific and actionable. Every issue should have a clear fix.`;
}

function getGapFillPrompt(topic) {
  return `# Gap-Fill Phase: ${topic}

You are researching topics identified as missing in the review.

## Input
Read: .claude/temp/page-creator/${topic.toLowerCase().replace(/[^a-z0-9]+/g, '-')}/review.json

## Task
1. For each "missingTopics" item with importance "high" or "medium":
   - Perform the suggested web searches
   - Extract facts with citations

2. For each "uncitedClaims":
   - Try to find a source that supports or refutes it
   - If no source found, mark for removal

## Output
Write to .claude/temp/page-creator/${topic.toLowerCase().replace(/[^a-z0-9]+/g, '-')}/additional-facts.json:

\`\`\`json
{
  "newFacts": [
    {
      "claim": "...",
      "sourceUrl": "...",
      "sourceTitle": "...",
      "fillsGap": "which missing topic this addresses"
    }
  ],
  "claimsToRemove": [
    {"claim": "...", "reason": "No source found"}
  ],
  "claimsNowCited": [
    {"claim": "...", "newSourceUrl": "..."}
  ],
  "stillMissing": ["Topics we still couldn't find sources for"]
}
\`\`\``;
}

function getPolishPrompt(topic) {
  const importPath = "'../../../../../components/wiki'";

  return `# Polish Phase: ${topic}

Final integration and quality pass.

## Input Files
- Draft: .claude/temp/page-creator/${topic.toLowerCase().replace(/[^a-z0-9]+/g, '-')}/draft.mdx
- Review: .claude/temp/page-creator/${topic.toLowerCase().replace(/[^a-z0-9]+/g, '-')}/review.json
- Additional facts: .claude/temp/page-creator/${topic.toLowerCase().replace(/[^a-z0-9]+/g, '-')}/additional-facts.json (if exists)

## Tasks
1. **Integrate new facts** from additional-facts.json into the article
2. **Remove uncited claims** that couldn't be sourced
3. **Fix structural issues** identified in review
4. **Improve prose flow** - add transitions between sections
5. **Convert 1-2 tables to prose** if there are too many tables
6. **Update quality score** based on final assessment
7. **Verify all citations** use GFM footnotes [^N] format

## Wiki Convention Verification
Ensure the final article follows these conventions:

### Citation Format
- Use GFM footnotes: "Claim text.[^1]" with "[^1]: [Source](url)" at bottom
- NOT inline links: "Claim [Source](url)" is WRONG
- Group all footnotes in a "## Sources" section before <Backlinks />

### Entity Links
- Use <EntityLink id="entity-id">Display Name</EntityLink> for internal links
- Common IDs: open-philanthropy, anthropic, openai, miri, lesswrong

### Components
- Import from ${importPath}
- Required: EntityLink, Backlinks
- Optional: KeyPeople, KeyQuestions, Section, DataInfoBox

### Escaping
- Currency: \\$100M not $100M
- Comparisons: \\<100 not <100

### Frontmatter
Ensure these fields are present:
- title, description, quality (1-100), lastEdited, importance (1-100)
- ratings: { novelty, rigor, actionability, completeness } (each 1-10)
- sidebar: { order: 50 }

## Output
Write the final article to: .claude/temp/page-creator/${topic.toLowerCase().replace(/[^a-z0-9]+/g, '-')}/final.mdx

Also write a summary to: .claude/temp/page-creator/${topic.toLowerCase().replace(/[^a-z0-9]+/g, '-')}/summary.json:
\`\`\`json
{
  "finalQuality": 78,
  "wordCount": 2500,
  "citationCount": 35,
  "tableCount": 3,
  "sectionsCount": 8,
  "hasControversies": true,
  "usesFootnotes": true,
  "entityLinksUsed": ["open-philanthropy", "anthropic"],
  "changesFromDraft": ["List of major changes made"]
}
\`\`\``;
}

// ============ Pipeline Runner ============

async function runPipeline(topic, tier = 'standard') {
  const config = TIERS[tier];
  if (!config) {
    console.error(`Unknown tier: ${tier}. Options: ${Object.keys(TIERS).join(', ')}`);
    process.exit(1);
  }

  const hasScryKey = !!process.env.EXOPRIORS_API_KEY;

  console.log(`\n${'='.repeat(60)}`);
  console.log(`Creating article: "${topic}"`);
  console.log(`Tier: ${config.name} (${config.estimatedCost})`);
  console.log(`Phases: ${config.phases.join(' → ')}`);
  console.log(`SCRY API: ${hasScryKey ? '✓ Enabled' : '✗ Disabled (set EXOPRIORS_API_KEY to enable)'}`);
  console.log(`${'='.repeat(60)}\n`);

  const results = {
    topic,
    tier,
    startTime: new Date().toISOString(),
    phases: {},
    totalCost: 0
  };

  for (const phase of config.phases) {
    const phaseConfig = PHASE_CONFIG[phase];
    if (!phaseConfig) {
      log(phase, `⚠️ Unknown phase: ${phase}, skipping`);
      continue;
    }

    log(phase, `Starting (${phaseConfig.model}, $${phaseConfig.budget})`);
    log(phase, phaseConfig.description);

    try {
      let prompt;

      // Select the appropriate prompt for this phase
      switch (phase) {
        case 'research-lite':
          prompt = getResearchPrompt(topic, 'lite');
          break;
        case 'research':
          prompt = getResearchPrompt(topic, 'standard');
          break;
        case 'research-deep':
          prompt = getResearchPrompt(topic, 'deep');
          break;
        case 'extract':
          prompt = getExtractionPrompt(topic);
          break;
        case 'synthesize-sonnet':
          prompt = getSynthesisPrompt(topic, 'sonnet');
          break;
        case 'synthesize-opus':
          prompt = getSynthesisPrompt(topic, 'opus');
          break;
        case 'verify':
        case 'review':
          prompt = getReviewPrompt(topic, 'standard');
          break;
        case 'critical-review':
          prompt = getReviewPrompt(topic, 'critical');
          break;
        case 'gap-fill':
          prompt = getGapFillPrompt(topic);
          break;
        case 'rewrite':
        case 'polish':
          prompt = getPolishPrompt(topic);
          break;
        default:
          log(phase, `No prompt defined for phase: ${phase}`);
          continue;
      }

      const result = await runClaudePhase(prompt, {
        model: phaseConfig.model,
        budget: phaseConfig.budget
      });

      results.phases[phase] = {
        success: true,
        duration: result.duration,
        model: result.model,
        budgetUsed: result.budget
      };
      results.totalCost += phaseConfig.budget;

      log(phase, `✅ Complete (${result.duration}s)`);

    } catch (error) {
      log(phase, `❌ Failed: ${error.message}`);
      results.phases[phase] = {
        success: false,
        error: error.message
      };

      // For critical phases, stop the pipeline
      if (['research', 'research-lite', 'research-deep', 'extract', 'synthesize-sonnet', 'synthesize-opus'].includes(phase)) {
        console.error(`\nCritical phase failed, stopping pipeline.`);
        break;
      }
    }

    console.log(''); // Blank line between phases
  }

  results.endTime = new Date().toISOString();

  // Save results summary
  const summaryPath = saveIntermediateResult(topic, 'pipeline-results', results);

  // Print summary
  console.log(`\n${'='.repeat(60)}`);
  console.log('Pipeline Complete');
  console.log(`${'='.repeat(60)}`);
  console.log(`Topic: ${topic}`);
  console.log(`Tier: ${config.name}`);
  console.log(`Estimated cost: ~$${results.totalCost.toFixed(2)}`);
  console.log(`Results saved to: ${summaryPath}`);

  // Check for final output
  const sanitizedTopic = topic.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const finalPath = path.join(TEMP_DIR, sanitizedTopic, 'final.mdx');
  const draftPath = path.join(TEMP_DIR, sanitizedTopic, 'draft.mdx');

  if (fs.existsSync(finalPath)) {
    console.log(`\n📄 Final article: ${finalPath}`);
  } else if (fs.existsSync(draftPath)) {
    console.log(`\n📄 Draft article: ${draftPath}`);
  }

  return results;
}

// ============ CLI ============

function printHelp() {
  console.log(`
Page Creator V2 - Research-First Pipeline

Usage:
  node scripts/content/page-creator-v2.mjs "<topic>" [options]

Options:
  --tier <tier>     Quality tier: budget, standard, premium (default: standard)
  --output <path>   Copy final article to this path
  --resume          Resume from last completed phase
  --help            Show this help

Tiers:
${Object.entries(TIERS).map(([key, config]) =>
  `  ${key.padEnd(10)} ${config.estimatedCost.padEnd(10)} ${config.description}`
).join('\n')}

Examples:
  node scripts/content/page-creator-v2.mjs "LessWrong" --tier standard
  node scripts/content/page-creator-v2.mjs "Community Notes" --tier premium
  node scripts/content/page-creator-v2.mjs "MIRI" --tier budget --output ./miri.mdx
`);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.length === 0) {
    printHelp();
    process.exit(0);
  }

  // Parse arguments
  const topic = args.find(arg => !arg.startsWith('--'));
  const tierIndex = args.indexOf('--tier');
  const tier = tierIndex !== -1 ? args[tierIndex + 1] : 'standard';
  const outputIndex = args.indexOf('--output');
  const outputPath = outputIndex !== -1 ? args[outputIndex + 1] : null;

  if (!topic) {
    console.error('Error: Topic is required');
    printHelp();
    process.exit(1);
  }

  // Ensure temp directory exists
  ensureDir(TEMP_DIR);

  // Run the pipeline
  const results = await runPipeline(topic, tier);

  // Copy to output path if specified
  if (outputPath && results.phases['polish']?.success) {
    const sanitizedTopic = topic.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const finalPath = path.join(TEMP_DIR, sanitizedTopic, 'final.mdx');
    if (fs.existsSync(finalPath)) {
      fs.copyFileSync(finalPath, outputPath);
      console.log(`\n✅ Article copied to: ${outputPath}`);
    }
  }
}

main().catch(console.error);
