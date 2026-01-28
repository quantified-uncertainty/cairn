# SQLite Migration Plan

## Overview

Migrate from JSON-based data layer to SQLite for better query capabilities while maintaining the current static deployment model.

**Key principle:** SQLite is a build-time tool only. YAML remains source of truth, static HTML remains the deployed output.

## Current Architecture

```
YAML files (source of truth)
    ↓ npm run build:data
database.json (5.8MB)
    ↓ imported by
src/data/index.ts (lookup functions with Map indexes)
    ↓ used by
Astro components during build
    ↓ outputs
Static HTML/JS/CSS (deployed)
```

**Pain points:**
- Ad-hoc relationship traversal code for each new query pattern
- Bidirectional relationships require manual inverse computation
- `getRisksForTable()` rebuilds solution mappings every call
- Adding new query patterns requires code changes to index.ts

## Proposed Architecture

```
YAML files (source of truth)
    ↓ npm run build:data
database.sqlite (build artifact, gitignored)
    ↓ queried by
src/data/index.ts (SQL queries)
    ↓ used by
Astro components during build
    ↓ outputs
Static HTML/JS/CSS (deployed)
```

**Benefits:**
- Real relational queries with JOINs
- Bidirectional relationships are just reversed queries
- No custom code per relationship type
- Full-text search built-in
- Scales to 100K+ items easily

## Schema Design

### Core Tables

```sql
-- All entities in one table with type discrimination
CREATE TABLE entities (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  severity TEXT,
  likelihood TEXT,
  timeframe TEXT,
  last_updated TEXT,
  data JSON  -- Full entity data for complex fields
);

CREATE INDEX idx_entities_type ON entities(type);

-- All resources
CREATE TABLE resources (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  title TEXT,
  type TEXT,
  publication_id TEXT,
  summary TEXT,
  data JSON
);

CREATE INDEX idx_resources_publication ON resources(publication_id);

-- Relationships between entities (bidirectional by query)
CREATE TABLE relationships (
  source_id TEXT NOT NULL,
  target_id TEXT NOT NULL,
  rel_type TEXT NOT NULL,  -- 'addresses', 'analyzes', 'enables', etc.
  data JSON,  -- Optional metadata
  PRIMARY KEY (source_id, target_id, rel_type),
  FOREIGN KEY (source_id) REFERENCES entities(id),
  FOREIGN KEY (target_id) REFERENCES entities(id)
);

CREATE INDEX idx_rel_source ON relationships(source_id);
CREATE INDEX idx_rel_target ON relationships(target_id);
CREATE INDEX idx_rel_type ON relationships(rel_type);

-- Resource citations (which pages cite which resources)
CREATE TABLE citations (
  page_id TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  PRIMARY KEY (page_id, resource_id)
);

-- Tags
CREATE TABLE entity_tags (
  entity_id TEXT NOT NULL,
  tag TEXT NOT NULL,
  PRIMARY KEY (entity_id, tag)
);

CREATE INDEX idx_tags_tag ON entity_tags(tag);

-- Full-text search
CREATE VIRTUAL TABLE entities_fts USING fts5(
  id, title, description, content='entities'
);
```

### Query Examples

```sql
-- Get solutions that address a risk (forward)
SELECT e.* FROM entities e
JOIN relationships r ON e.id = r.target_id
WHERE r.source_id = 'scheming'
  AND r.rel_type = 'addressed_by';

-- Get risks that a solution addresses (reverse - same table!)
SELECT e.* FROM entities e
JOIN relationships r ON e.id = r.source_id
WHERE r.target_id = 'ai-control'
  AND r.rel_type = 'addressed_by';

-- Entities with most incoming relationships
SELECT target_id, COUNT(*) as cnt
FROM relationships
GROUP BY target_id
ORDER BY cnt DESC;

-- Full-text search
SELECT * FROM entities_fts WHERE entities_fts MATCH 'deceptive alignment';

-- Resources by publication with citation count
SELECT r.*, COUNT(c.page_id) as citation_count
FROM resources r
LEFT JOIN citations c ON r.id = c.resource_id
WHERE r.publication_id = 'anthropic'
GROUP BY r.id
ORDER BY citation_count DESC;
```

## Implementation Steps

### Phase 1: Build Script (database creation)

**File:** `scripts/build-sqlite.mjs`

```javascript
import Database from 'better-sqlite3';
import { parse } from 'yaml';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const DB_PATH = 'src/data/database.sqlite';

function buildDatabase() {
  // Remove old database
  const db = new Database(DB_PATH);

  // Create schema
  db.exec(SCHEMA_SQL);

  // Load and insert entities
  const entities = loadYamlDir('src/data/entities');
  const insertEntity = db.prepare(`
    INSERT INTO entities (id, type, title, description, severity, data)
    VALUES (@id, @type, @title, @description, @severity, @data)
  `);

  for (const entity of entities) {
    insertEntity.run({
      id: entity.id,
      type: entity.type,
      title: entity.title,
      description: entity.description || null,
      severity: entity.severity || null,
      data: JSON.stringify(entity)
    });

    // Extract relationships from relatedEntries
    if (entity.relatedEntries) {
      for (const rel of entity.relatedEntries) {
        insertRelationship.run({
          source_id: entity.id,
          target_id: rel.id,
          rel_type: rel.relationship || 'related'
        });
      }
    }

    // Extract tags
    if (entity.tags) {
      for (const tag of entity.tags) {
        insertTag.run({ entity_id: entity.id, tag });
      }
    }
  }

  // Similar for resources...

  // Build FTS index
  db.exec(`INSERT INTO entities_fts(entities_fts) VALUES('rebuild')`);

  db.close();
}
```

**Estimated effort:** 2-3 hours

### Phase 2: Data Access Layer

**File:** `src/data/index.ts` (modify existing)

```typescript
import Database from 'better-sqlite3';

// Open database (read-only for safety)
const db = new Database('src/data/database.sqlite', { readonly: true });

// Prepared statements (created once, reused)
const stmts = {
  entityById: db.prepare('SELECT * FROM entities WHERE id = ?'),
  entitiesByType: db.prepare('SELECT * FROM entities WHERE type = ?'),
  resourceById: db.prepare('SELECT * FROM resources WHERE id = ?'),

  // Relationships - both directions with same table!
  getRelatedFrom: db.prepare(`
    SELECT e.*, r.rel_type FROM entities e
    JOIN relationships r ON e.id = r.target_id
    WHERE r.source_id = ?
  `),
  getRelatedTo: db.prepare(`
    SELECT e.*, r.rel_type FROM entities e
    JOIN relationships r ON e.id = r.source_id
    WHERE r.target_id = ?
  `),

  // Typed relationship queries
  solutionsForRisk: db.prepare(`
    SELECT e.* FROM entities e
    JOIN relationships r ON e.id = r.target_id
    WHERE r.source_id = ? AND e.type IN ('safety-agenda', 'intervention')
  `),
  risksForSolution: db.prepare(`
    SELECT e.* FROM entities e
    JOIN relationships r ON e.id = r.source_id
    WHERE r.target_id = ? AND e.type = 'risk'
  `),

  // Search
  search: db.prepare(`
    SELECT e.* FROM entities e
    JOIN entities_fts fts ON e.id = fts.id
    WHERE entities_fts MATCH ?
    ORDER BY rank
  `),
};

// Export functions that use prepared statements
export function getEntityById(id: string): Entity | undefined {
  const row = stmts.entityById.get(id);
  return row ? parseEntity(row) : undefined;
}

export function getSolutionsForRisk(riskId: string): Entity[] {
  return stmts.solutionsForRisk.all(riskId).map(parseEntity);
}

export function getRisksForSolution(solutionId: string): Entity[] {
  return stmts.risksForSolution.all(solutionId).map(parseEntity);
}

export function searchEntities(query: string): Entity[] {
  return stmts.search.all(query).map(parseEntity);
}

// Helper to parse JSON data column back to full entity
function parseEntity(row: any): Entity {
  return JSON.parse(row.data);
}
```

**Estimated effort:** 3-4 hours

### Phase 3: Update Build Pipeline

**File:** `package.json`

```json
{
  "scripts": {
    "build:data": "node scripts/build-data.mjs && node scripts/build-sqlite.mjs",
    "build": "npm run build:data && astro build"
  }
}
```

**File:** `.gitignore`

```
src/data/database.sqlite
```

**Estimated effort:** 30 minutes

### Phase 4: Migrate Existing Queries

Replace usages in these files:
- `src/data/index.ts` - Core lookup functions (done in Phase 2)
- `src/data/accident-risks-data.ts` - Risk table queries
- `src/data/safety-approaches-data.ts` - Safety matrix
- `src/data/parameter-graph-data.ts` - Graph data
- Components that call `getRisksForTable()`, `getEntityInfoBoxData()`, etc.

**Estimated effort:** 2-3 hours

### Phase 5: Remove Old Code

- Delete memoization/caching hacks
- Remove `getRiskToSolutions` manual computation
- Simplify `getEntityInfoBoxData()`
- Consider removing `database.json` entirely (or keep for debugging)

**Estimated effort:** 1 hour

## Total Estimated Effort

| Phase | Time |
|-------|------|
| Phase 1: Build script | 2-3 hours |
| Phase 2: Data access layer | 3-4 hours |
| Phase 3: Build pipeline | 30 min |
| Phase 4: Migrate queries | 2-3 hours |
| Phase 5: Cleanup | 1 hour |
| **Total** | **9-12 hours** |

## Risks and Mitigations

### Risk: Native dependency issues
`better-sqlite3` is a native Node module that requires compilation.

**Mitigation:**
- Works fine on most CI (GitHub Actions, Vercel, Netlify)
- Alternative: use `sql.js` (pure JS, no native deps) if issues arise
- Test on CI early in Phase 1

### Risk: Type safety
Raw SQL loses TypeScript type checking.

**Mitigation:**
- Keep `parseEntity()` that validates/casts results
- Consider Drizzle ORM later for type-safe queries
- JSON column preserves full typed entity

### Risk: Query performance debugging
Harder to debug than JS array methods.

**Mitigation:**
- SQLite EXPLAIN for query plans
- Add query logging in dev mode
- Prepared statements are fast by default

## Future Enhancements (not in initial scope)

1. **Client-side search** - Ship sql.js + read-only DB for `/explore` pages
2. **Drizzle ORM** - Type-safe query builder
3. **Incremental builds** - Only rebuild changed entities
4. **Multiple databases** - Separate DBs for entities, resources, insights

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2025-01-27 | SQLite over Postgres | No deployment complexity, sufficient scale |
| 2025-01-27 | Build-time only (Option 1) | Keeps static deployment, simplest path |
| 2025-01-27 | Single relationships table | Bidirectional queries without code duplication |
| 2025-01-27 | JSON data column | Preserves full entity without schema migration per field |

## Open Questions

1. Keep `database.json` as fallback/debugging, or remove entirely?
2. Should we also migrate `pages` data (MDX frontmatter) to SQLite?
3. Worth adding Drizzle ORM now, or start with raw SQL?
