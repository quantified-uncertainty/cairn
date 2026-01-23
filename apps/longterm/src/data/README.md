# Data Layer for CAIRN

This directory contains structured data in YAML format, with TypeScript schemas for validation.

## Directory Structure

```
src/data/
├── schema.ts           # Zod schemas and TypeScript types
├── index.ts            # Data access functions and component helpers
├── database.json       # Combined JSON bundle (auto-generated)
├── README.md           # This file
│
├── experts.yaml        # People with positions on AI safety (29 experts)
├── organizations.yaml  # Labs, research orgs, funders (12 orgs)
├── estimates.yaml      # Probability estimates (36 variables)
├── cruxes.yaml         # Key uncertainties (53 cruxes)
├── glossary.yaml       # Terms and definitions (21 terms)
└── *.json              # Auto-generated JSON versions
```

## NPM Scripts

```bash
npm run build:data      # Regenerate JSON from YAML (run after editing YAML)
npm run build           # Full build (includes data build automatically)

# Migration scripts (for extracting from existing MDX)
npm run extract         # Extract data from MDX files → scripts/extracted/
npm run generate-yaml   # Convert extracted JSON to YAML
npm run cleanup-data    # Clean up generated YAML (remove duplicates, fix IDs)
```

## Why YAML Instead of Inline MDX Props?

### Before (inline in MDX - duplicated everywhere)

```mdx
<!-- estimates-dashboard.mdx -->
<EstimateBox
  variable="P(Transformative AI by 2030)"
  estimates={[
    { source: "Metaculus Community", value: "25%", date: "2024" },
    { source: "AI Impacts Survey", value: "10%", date: "2023" },
  ]}
/>

<!-- Same data duplicated in another file -->
```

### After (single source of truth)

```yaml
# estimates.yaml
- id: p-transformative-ai-by-2030
  variable: "P(Transformative AI by 2030)"
  estimates:
    - source: Metaculus Community
      value: "25%"
      date: "2024"
```

```mdx
<!-- Any MDX file -->
<DataEstimateBox dataId="p-transformative-ai-by-2030" />
```

Benefits:
- Single source of truth for each estimate
- Easy to update in one place
- Queryable ("what does expert X think about Y?")
- Type-safe with build-time validation

## Using Data-Aware Components

### DataEstimateBox

```jsx
// Fetch from YAML by ID
<DataEstimateBox dataId="p-transformative-ai-by-2030" />

// Or provide inline data (backwards compatible)
<DataEstimateBox
  variable="Custom Estimate"
  estimates={[{ source: "Me", value: "50%" }]}
/>
```

### DataDisagreementMap

```jsx
// Automatically pulls all expert positions on this topic from YAML
<DataDisagreementMap topic="p-doom" />

// Or provide inline positions
<DataDisagreementMap
  topic="Custom Topic"
  positions={[{ actor: "Expert", position: "View", estimate: "50%" }]}
/>
```

### DataInfoBox

```jsx
// Fetch expert data
<DataInfoBox expertId="paul-christiano" />

// Fetch organization data
<DataInfoBox orgId="anthropic" />

// Or provide inline
<DataInfoBox type="researcher" title="New Person" role="Researcher" />
```

### DataCrux

```jsx
// Fetch crux details
<DataCrux dataId="deceptive-alignment" />
```

## Direct Data Access

```typescript
import {
  getExpertById,
  getEstimateById,
  getDisagreementMapData,
  getPositionsOnTopic,
  experts,
  organizations,
} from '../../data';

// Get all positions on a topic
const pdoomPositions = getDisagreementMapData('p-doom');

// Get expert details
const paul = getExpertById('paul-christiano');

// Query all experts at an org
const anthropicExperts = experts.filter(e => e.affiliation === 'anthropic');
```

## Adding New Data

### Adding a New Expert

```yaml
# experts.yaml
- id: new-expert
  name: New Expert Name
  affiliation: org-id        # Must exist in organizations.yaml
  role: Researcher
  website: https://example.com
  knownFor:
    - Notable contribution 1
    - Notable contribution 2
  positions:
    - topic: p-doom
      view: Moderate concern
      estimate: "15-25%"
      confidence: medium
      source: Paper Title (2024)
      sourceUrl: https://example.com/paper
```

Then run `npm run build:data`.

### Adding a New Estimate Variable

```yaml
# estimates.yaml
- id: p-new-variable
  variable: "P(Something by 2030)"
  category: timelines
  description: What this estimate measures
  estimates:
    - source: Expert Name
      value: "30%"
      date: "2024"
      url: https://source.com
      notes: Context about this estimate
    - source: Survey
      value: "25%"
      date: "2023"
```

## Schema Reference

All data is validated against Zod schemas in `schema.ts`. Key types:

- **Expert**: Person with positions on topics
  - `id`, `name`, `affiliation?`, `role?`, `positions[]`
- **Organization**: Lab, research org, funder
  - `id`, `name`, `type`, `founded?`, `headquarters?`, `keyPeople[]`
- **Estimate**: Aggregated probability estimate
  - `id`, `variable`, `category?`, `estimates[]`
- **Crux**: Key uncertainty
  - `id`, `question`, `importance`, `positions[]`, `wouldUpdateOn[]`
- **GlossaryTerm**: Definition
  - `id`, `term`, `definition`, `related[]`

## Migration from Inline Data

1. Run `npm run extract` to scan all MDX files
2. Review extracted data in `scripts/extracted/`
3. Run `npm run generate-yaml` to create YAML files
4. Run `npm run cleanup-data` to clean duplicates
5. Update MDX files to use `<DataEstimateBox dataId="...">` etc.

The migration preserves backwards compatibility - existing inline props still work.
