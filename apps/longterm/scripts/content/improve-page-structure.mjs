#!/usr/bin/env node
/**
 * Improve page structure by adding missing sections
 *
 * This script analyzes pages against their template and adds missing section headings.
 * It can either add placeholder text or use AI to generate content.
 *
 * Usage:
 *   node scripts/improve-page-structure.mjs                    # Dry run
 *   node scripts/improve-page-structure.mjs --apply            # Apply changes
 *   node scripts/improve-page-structure.mjs --page bioweapons  # Specific page
 *   node scripts/improve-page-structure.mjs --template knowledge-base-risk  # Specific template
 *   node scripts/improve-page-structure.mjs --threshold 60     # Only pages below 60%
 */

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { findMdxFiles } from '../lib/file-utils.mjs';
import { CONTENT_DIR } from '../lib/content-types.mjs';

// Section definitions for each template with placeholder content
const TEMPLATE_SECTIONS = {
  'ai-transition-model-parameter': {
    order: ['parameter-network', 'current-state', 'healthy-state', 'threats', 'supports', 'why-matters', 'trajectory', 'key-debates', 'related-pages', 'sources'],
    sections: {
      'parameter-network': {
        heading: '## Parameter Network',
        alternates: ['## Parameter Network', '## Relationships', '## Network'],
        placeholder: `

<Mermaid client:load chart={\`
flowchart LR
    subgraph Enables["What Enables It"]
        E1[Enabler 1]
        E2[Enabler 2]
    end

    subgraph Constrains["What Constrains It"]
        C1[Constraint 1]
    end

    E1 -->|supports| PARAM[This Parameter]
    E2 -->|supports| PARAM
    C1 -->|constrains| PARAM

    PARAM --> OUT[Primary Outcome]

    style PARAM fill:#90EE90
\`} />

**Contributes to:** [Parent Factor](/ai-transition-model/factors/...)

**Primary outcomes affected:**
- [Outcome 1](/ai-transition-model/outcomes/...) - [How it affects]

`,
      },
      'current-state': {
        heading: '## Current State Assessment',
        alternates: ['## Current State Assessment', '## Current State', '## Assessment'],
        placeholder: `

### Key Metrics

| Metric | Current Value | Historical Baseline | Trend |
|--------|--------------|---------------------|-------|
| [Metric 1] | [Value] | [Baseline] | [Trend] |
| [Metric 2] | [Value] | [Baseline] | [Trend] |

### Empirical Evidence Summary

| Study | Year | Finding | Implication |
|-------|------|---------|-------------|
| [Study 1] | [Year] | [Finding] | [Implication] |

`,
      },
      'healthy-state': {
        heading: '## What "Healthy" Looks Like',
        alternates: ['## What "Healthy" Looks Like', '## Healthy State', '## Optimal State', '## Target State'],
        placeholder: `

[Description of what optimal values for this parameter would look like.]

### Key Characteristics

1. **[Characteristic 1]**: [Description]
2. **[Characteristic 2]**: [Description]
3. **[Characteristic 3]**: [Description]

`,
      },
      'threats': {
        heading: '## Factors That Decrease',
        alternates: ['## Factors That Decrease', '## Threats', '## What Decreases', '## Negative Factors'],
        placeholder: `

| Factor | Mechanism | Current Impact | Trajectory |
|--------|-----------|----------------|------------|
| **[Factor 1]** | [How it reduces this parameter] | [Current impact level] | [Increasing/Stable/Decreasing] |
| **[Factor 2]** | [Mechanism] | [Impact] | [Trajectory] |

`,
      },
      'supports': {
        heading: '## Factors That Increase',
        alternates: ['## Factors That Increase', '## Supports', '## What Increases', '## Positive Factors'],
        placeholder: `

| Factor | Mechanism | Current Status | Effectiveness |
|--------|-----------|----------------|---------------|
| **[Factor 1]** | [How it improves this parameter] | [Current status] | [Effectiveness estimate] |
| **[Factor 2]** | [Mechanism] | [Status] | [Effectiveness] |

`,
      },
      'why-matters': {
        heading: '## Why This Parameter Matters',
        alternates: ['## Why This Parameter Matters', '## Why This Matters', '## Importance'],
        placeholder: `

### Consequences of Low Values

| Domain | Impact | Severity | Example |
|--------|--------|----------|---------|
| **[Domain 1]** | [Impact description] | [Severity level] | [Example failure mode] |

### Connection to Existential Risk

[Explanation of how this parameter connects to existential risk pathways.]

`,
      },
      'trajectory': {
        heading: '## Trajectory and Scenarios',
        alternates: ['## Trajectory and Scenarios', '## Trajectory', '## Scenarios', '## Projections'],
        placeholder: `

### Projected Trajectory

| Timeframe | Key Developments | Parameter Impact |
|-----------|------------------|------------------|
| **2025-2026** | [Developments] | [Impact on parameter] |
| **2027-2028** | [Developments] | [Impact] |

### Scenario Analysis

| Scenario | Probability | Outcome | Key Indicators |
|----------|-------------|---------|----------------|
| [Scenario 1] | [X-Y%] | [Outcome description] | [What to watch for] |
| [Scenario 2] | [X-Y%] | [Outcome] | [Indicators] |

`,
      },
      'key-debates': {
        heading: '## Key Debates',
        alternates: ['## Key Debates', '## Debates', '## Controversies'],
        placeholder: `

### [Debate Topic 1]

**View A:** [Description of one position]

**View B:** [Description of opposing position]

`,
        optional: true,
      },
      'related-pages': {
        heading: '## Related Pages',
        alternates: ['## Related Pages', '## Related', '## See Also'],
        placeholder: `

### Related Risks
- [Risk 1](/knowledge-base/risks/...) — [Brief description]

### Related Interventions
- [Intervention 1](/knowledge-base/responses/...) — [Brief description]

### Related Parameters
- [Parameter 1](/ai-transition-model/parameters/...) — [Relationship]

`,
        optional: true,
      },
      'sources': {
        heading: '## Sources',
        alternates: ['## Sources', '## Sources & Key Research', '## References', '## Key Research'],
        placeholder: `

### Empirical Research
- [Citation 1]
- [Citation 2]

### Foundational Theory
- [Citation 3]

`,
        optional: true,
      },
    },
  },
  'knowledge-base-risk': {
    order: ['overview', 'risk-assessment', 'mechanisms', 'evidence', 'scenarios', 'responses', 'uncertainties', 'sources'],
    sections: {
      'overview': {
        heading: '## Overview',
        alternates: ['## Overview', '## Introduction', '## Summary'],
        placeholder: `

[Brief 2-3 paragraph description of this risk, its potential impact, and why it matters for AI safety.]

`,
      },
      'risk-assessment': {
        heading: '## Risk Assessment',
        alternates: ['## Risk Assessment', '## Assessment', '## Risk Summary'],
        placeholder: `

| Dimension | Assessment | Notes |
|-----------|------------|-------|
| **Likelihood** | [Low/Medium/High] | [Brief justification] |
| **Severity** | [Low/Medium/High/Catastrophic] | [Brief justification] |
| **Timeline** | [Near-term/Medium-term/Long-term] | [When this could manifest] |
| **Trend** | [Increasing/Stable/Decreasing] | [How the risk is evolving] |

`,
      },
      'mechanisms': {
        heading: '## How It Works',
        alternates: ['## How It Works', '## Mechanisms', '## How This Happens', '## Pathways', '## Attack Pathways'],
        placeholder: `

[Explain the mechanisms by which this risk manifests. Include:
- Key pathways and causal chains
- Technical or social factors that enable it
- Why current safeguards may be insufficient]

`,
      },
      'evidence': {
        heading: '## Evidence',
        alternates: ['## Evidence', '## Current Evidence', '## Empirical Evidence'],
        placeholder: `

[Summarize empirical evidence supporting this risk assessment. Include:
- Research findings and publications
- Historical precedents or analogies
- Current observations and trends]

`,
        optional: true,
      },
      'scenarios': {
        heading: '## Scenarios',
        alternates: ['## Scenarios', '## Risk Scenarios', '## How It Could Happen'],
        placeholder: `

| Scenario | Probability | Impact | Key Factors |
|----------|-------------|--------|-------------|
| [Scenario 1] | [X%] | [Description] | [Enabling conditions] |
| [Scenario 2] | [X%] | [Description] | [Enabling conditions] |

`,
        optional: true,
      },
      'responses': {
        heading: '## Responses',
        alternates: ['## Responses', '## Responses That Address This', '## Mitigations', '## Interventions'],
        placeholder: `

The following interventions may help address this risk:

- [Response 1](/knowledge-base/responses/...) - [Brief description]
- [Response 2](/knowledge-base/responses/...) - [Brief description]

`,
      },
      'uncertainties': {
        heading: '## Key Uncertainties',
        alternates: ['## Key Uncertainties', '## Uncertainties', "## What We Don't Know"],
        placeholder: `

- **[Uncertainty 1]**: [Description of what we don't know and why it matters]
- **[Uncertainty 2]**: [Description]
- **[Uncertainty 3]**: [Description]

`,
      },
      'sources': {
        heading: '## Sources',
        alternates: ['## Sources', '## References', '## Key Sources', '## Further Reading'],
        placeholder: `

[Add key sources and references here]

`,
        optional: true,
      },
    },
  },
  'knowledge-base-response': {
    order: ['overview', 'quick-assessment', 'how-it-works', 'current-state', 'key-actors', 'risks-addressed', 'limitations', 'sources'],
    sections: {
      'overview': {
        heading: '## Overview',
        alternates: ['## Overview', '## Introduction', '## Summary'],
        placeholder: `

[Brief 2-3 paragraph description of this response/intervention, how it works, and its potential effectiveness.]

`,
      },
      'quick-assessment': {
        heading: '## Quick Assessment',
        alternates: ['## Quick Assessment', '## Assessment', '## Summary Assessment', '## Evaluation'],
        placeholder: `

| Dimension | Grade | Notes |
|-----------|-------|-------|
| **Tractability** | [A-F] | [How feasible is implementation?] |
| **Effectiveness** | [A-F] | [How much does it reduce risk?] |
| **Neglectedness** | [A-F] | [How much attention is it getting?] |
| **Speed** | [A-F] | [How quickly can it be deployed?] |

`,
      },
      'how-it-works': {
        heading: '## How It Works',
        alternates: ['## How It Works', '## Mechanism', '## Approach', '## Method'],
        placeholder: `

[Explain the mechanism of action for this intervention. Include:
- Key components or steps
- How it addresses the target risks
- Dependencies and requirements]

`,
      },
      'current-state': {
        heading: '## Current State',
        alternates: ['## Current State', '## State of the Field', '## Current Progress'],
        placeholder: `

[Describe the current state of this intervention. Include:
- Level of development or deployment
- Key milestones achieved
- Remaining challenges]

`,
        optional: true,
      },
      'key-actors': {
        heading: '## Key Actors',
        alternates: ['## Key Actors', '## Organizations', "## Who's Working on This"],
        placeholder: `

| Organization | Role | Notable Work |
|--------------|------|--------------|
| [Org 1] | [Role] | [Description] |
| [Org 2] | [Role] | [Description] |

`,
        optional: true,
      },
      'risks-addressed': {
        heading: '## Risks Addressed',
        alternates: ['## Risks Addressed', '## Addresses These Risks', '## Target Risks'],
        placeholder: `

This intervention addresses the following risks:

- [Risk 1](/knowledge-base/risks/...) - [How it helps]
- [Risk 2](/knowledge-base/risks/...) - [How it helps]

`,
      },
      'limitations': {
        heading: '## Limitations',
        alternates: ['## Limitations', '## Challenges', '## Weaknesses', "## What This Doesn't Solve"],
        placeholder: `

- **[Limitation 1]**: [Description of what this doesn't address]
- **[Limitation 2]**: [Description]
- **[Limitation 3]**: [Description]

`,
      },
      'sources': {
        heading: '## Sources',
        alternates: ['## Sources', '## References', '## Key Sources', '## Further Reading'],
        placeholder: `

[Add key sources and references here]

`,
        optional: true,
      },
    },
  },
  'knowledge-base-model': {
    order: ['overview', 'framework', 'analysis', 'importance', 'limitations', 'sources'],
    sections: {
      'overview': {
        heading: '## Overview',
        alternates: ['## Overview', '## Introduction', '## Summary'],
        placeholder: `

[Brief 2-3 paragraph description of this model, its methodology, and key findings/conclusions.]

`,
      },
      'framework': {
        heading: '## Conceptual Framework',
        alternates: ['## Conceptual Framework', '## Framework', '## Model Structure', '## Methodology', '## Model'],
        placeholder: `

[Describe the model's structure and methodology. Include a diagram if possible.]

`,
      },
      'analysis': {
        heading: '## Quantitative Analysis',
        alternates: ['## Quantitative Analysis', '## Analysis', '## Results', '## Findings', '## Key Findings'],
        placeholder: `

| Parameter | Estimate | Uncertainty | Source |
|-----------|----------|-------------|--------|
| [Parameter 1] | [Value] | [Range] | [Citation] |
| [Parameter 2] | [Value] | [Range] | [Citation] |

`,
      },
      'importance': {
        heading: '## Strategic Importance',
        alternates: ['## Strategic Importance', '## Implications', '## Why This Matters', '## Key Insights'],
        placeholder: `

[Explain why this model matters and its implications for AI safety strategy.]

`,
      },
      'limitations': {
        heading: '## Limitations',
        alternates: ['## Limitations', '## Caveats', "## What This Doesn't Capture"],
        placeholder: `

- **[Limitation 1]**: [What the model doesn't capture]
- **[Limitation 2]**: [Description]
- **[Limitation 3]**: [Description]

`,
      },
      'sources': {
        heading: '## Sources',
        alternates: ['## Sources', '## References', '## Key Sources'],
        placeholder: `

[Add key sources and references here]

`,
        optional: true,
      },
    },
  },
};

function extractHeadings(content) {
  const headingRegex = /^##\s+(.+)$/gm;
  const headings = [];
  let match;
  while ((match = headingRegex.exec(content)) !== null) {
    headings.push({ text: match[1].trim(), fullMatch: match[0], index: match.index });
  }
  return headings;
}

function hasSectionHeading(content, sectionDef) {
  const lowerContent = content.toLowerCase();
  for (const alt of sectionDef.alternates) {
    if (lowerContent.includes(alt.toLowerCase())) {
      return true;
    }
  }
  return false;
}

function findInsertPosition(content, headings, sectionId, templateSections) {
  const order = templateSections.order;
  const sectionIndex = order.indexOf(sectionId);

  // Find the next section that exists in the content
  for (let i = sectionIndex + 1; i < order.length; i++) {
    const nextSectionId = order[i];
    const nextSectionDef = templateSections.sections[nextSectionId];
    if (nextSectionDef) {
      for (const heading of headings) {
        for (const alt of nextSectionDef.alternates) {
          if (heading.fullMatch.toLowerCase() === alt.toLowerCase()) {
            return heading.index;
          }
        }
      }
    }
  }

  // If no next section found, insert before sources/backlinks or at end
  const sourcesMatch = content.match(/^##\s+(Sources|References|Further Reading)/m);
  if (sourcesMatch) {
    return content.indexOf(sourcesMatch[0]);
  }

  const backlinksMatch = content.match(/<Backlinks/);
  if (backlinksMatch) {
    return backlinksMatch.index;
  }

  return content.length;
}

function analyzeAndImprove(filePath, templateId, applyChanges) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const { data: frontmatter, content: body } = matter(content);
  const relativePath = path.relative(CONTENT_DIR, filePath);

  const templateSections = TEMPLATE_SECTIONS[templateId];
  if (!templateSections) {
    return { filePath: relativePath, status: 'skipped', reason: 'no template sections defined' };
  }

  const headings = extractHeadings(body);
  const missingSections = [];

  for (const [sectionId, sectionDef] of Object.entries(templateSections.sections)) {
    if (!hasSectionHeading(body, sectionDef)) {
      if (!sectionDef.optional) {
        missingSections.push({ id: sectionId, def: sectionDef });
      }
    }
  }

  if (missingSections.length === 0) {
    return { filePath: relativePath, status: 'ok', message: 'all required sections present' };
  }

  if (!applyChanges) {
    return {
      filePath: relativePath,
      status: 'needs-update',
      missingSections: missingSections.map(s => s.def.heading),
    };
  }

  // Apply changes - add missing sections
  let newBody = body;

  // Sort sections to add by their order (reverse to avoid index shifting issues)
  missingSections.sort((a, b) => {
    const orderA = templateSections.order.indexOf(a.id);
    const orderB = templateSections.order.indexOf(b.id);
    return orderB - orderA; // Reverse order
  });

  for (const { id, def } of missingSections) {
    const insertPos = findInsertPosition(newBody, extractHeadings(newBody), id, templateSections);
    const sectionContent = `\n${def.heading}${def.placeholder}`;
    newBody = newBody.slice(0, insertPos) + sectionContent + newBody.slice(insertPos);
  }

  // Write back
  const newContent = matter.stringify(newBody, frontmatter);
  fs.writeFileSync(filePath, newContent);

  return {
    filePath: relativePath,
    status: 'updated',
    addedSections: missingSections.map(s => s.def.heading),
  };
}

async function main() {
  const args = process.argv.slice(2);
  const applyChanges = args.includes('--apply');
  const templateFilter = args.find((a, i) => args[i - 1] === '--template');
  const pageFilter = args.find((a, i) => args[i - 1] === '--page');
  const threshold = parseInt(args.find((a, i) => args[i - 1] === '--threshold') || '100');

  console.log(applyChanges ? 'Improving page structure...\n' : 'DRY RUN - analyzing page structure...\n');

  const files = findMdxFiles(CONTENT_DIR);
  const results = { updated: [], needsUpdate: [], ok: [], skipped: [] };

  for (const file of files) {
    if (file.endsWith('index.mdx')) continue;

    const content = fs.readFileSync(file, 'utf-8');
    const { data: frontmatter } = matter(content);

    // Skip stub pages - they're intentionally minimal
    if (frontmatter.pageType === 'stub') continue;

    const templateId = frontmatter.pageTemplate;

    if (!templateId || !TEMPLATE_SECTIONS[templateId]) continue;
    if (templateFilter && templateId !== templateFilter) continue;
    if (pageFilter && !file.includes(pageFilter)) continue;

    const result = analyzeAndImprove(file, templateId, applyChanges);

    if (result.status === 'updated') results.updated.push(result);
    else if (result.status === 'needs-update') results.needsUpdate.push(result);
    else if (result.status === 'ok') results.ok.push(result);
    else results.skipped.push(result);
  }

  // Output results
  if (results.needsUpdate.length > 0 || results.updated.length > 0) {
    console.log('Pages needing/receiving updates:\n');
    const toShow = applyChanges ? results.updated : results.needsUpdate;
    for (const r of toShow) {
      console.log(`  ${r.filePath}`);
      const sections = applyChanges ? r.addedSections : r.missingSections;
      for (const s of sections) {
        console.log(`    + ${s}`);
      }
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('Summary:');
  console.log(`  OK (all sections present): ${results.ok.length}`);
  console.log(`  ${applyChanges ? 'Updated' : 'Needs update'}: ${applyChanges ? results.updated.length : results.needsUpdate.length}`);
  console.log(`  Skipped: ${results.skipped.length}`);

  if (!applyChanges && results.needsUpdate.length > 0) {
    console.log('\nRun with --apply to add missing sections');
  }
}

main().catch(console.error);
