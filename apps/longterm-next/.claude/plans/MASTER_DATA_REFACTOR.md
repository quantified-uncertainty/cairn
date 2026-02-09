# Master Data Refactor Plan

## Overview

Four phases to extract the data layer from `apps/longterm-next/` into a standalone `packages/data/` package, eliminating the runtime dependency on the sunset `apps/longterm/` app.

| Phase | Summary | Key Win | Touches longterm? |
|-------|---------|---------|-------------------|
| **1** | Switch to longterm-next's own build script | Stop depending on longterm's build-data.mjs | Minimal (just prebuild path) |
| **2** | Move entity transformation to build time | index.ts drops from 1246 → ~960 lines | Yes (build script outputs typedEntities) |
| **3** | Create `@cairn/data` package | Data layer has its own package, clean API | No |
| **4** | Move YAML sources + build scripts to package | Complete decoupling from longterm | Yes (moves files out) |

**PR strategy:** Each phase = one PR. Phases 1+2 could be combined if they're small enough.

**Existing PRs:**
- **PR #4** (facts system): Independent, can merge anytime. If merged before Phase 3, `facts.ts` stays in the app (it introduces its own YAML files).
- **PR #5** (entity transform): Close it. It duplicated modules into longterm/scripts/lib/ — wrong direction. This plan replaces it.

---

## Red-Teaming Findings (Critical Bugs & Gaps)

Thorough investigation identified the following issues. Each is tagged with the phase it affects and its severity.

### CRITICAL: Phase 1 — Missing `scanFrontmatterEntities()` in longterm-next build script

**What:** `apps/longterm/scripts/build-data.mjs` (canonical, lines 865-930) has a `scanFrontmatterEntities()` function that scans MDX files for `entityType` frontmatter and auto-creates entities for pages that don't have corresponding YAML entries. **The longterm-next build script does not have this function at all.**

**Impact:** If we switch to longterm-next's build script without porting this, any entity that exists only because its MDX page declares `entityType: "risk"` (etc.) in frontmatter — with no matching YAML entry — will silently disappear from database.json. This could lose dozens of entities.

**Fix required in Step 1.2:** Port `scanFrontmatterEntities()` to a new `scripts/lib/frontmatter-scanner.mjs` module and wire it into `build-data.mjs` before the entity merge step. The function needs:
- `yamlEntityIds` (Set of IDs already covered by YAML)
- `CONTENT_DIR` path to scan for `.mdx` files
- Return array of auto-entity objects `{ id, type, title, description, tags, ... }`

### CRITICAL: Phase 2 — `entity-transform.mjs` default case drops extra fields

**What:** In `scripts/lib/entity-transform.mjs` (lines 264-266), the default case for unknown entity types returns:
```javascript
default:
  return { ...base, entityType: canonicalType };
```

But in the runtime `src/data/index.ts` (lines 319-324), the default case preserves all raw fields:
```javascript
default: {
  const { type: _type, ...rawRest } = raw;
  return { ...rawRest, ...base, entityType: canonicalType };
}
```

**Impact:** All ai-transition-model-* entities (factors, scenarios, outcomes) would lose their specialized fields: `content`, `currentAssessment`, `ratings`, `causeEffectGraph`, and any other extra fields. These fields are used by the ATM pages.

**Fix required in Step 2.1:** Update the default case in `entity-transform.mjs` to:
```javascript
default: {
  const { type: _type, ...rawRest } = raw;
  return { ...rawRest, ...base, entityType: canonicalType };
}
```

### MEDIUM: Phase 2 — Missing null-safety in `applyEntityOverrides`

**What:** In `entity-transform.mjs` line 104-141, the `applyEntityOverrides()` function doesn't guard against `entities` or `pages` being null/undefined. The runtime version in `index.ts` includes `|| []` fallbacks.

**Fix:** Add null guards at the top of `applyEntityOverrides()`:
```javascript
function applyEntityOverrides(entities, pages) {
  entities = entities || [];
  pages = pages || [];
  // ... rest of function
}
```

### MEDIUM: Phase 3 — Missing `transpilePackages` config for Next.js

**What:** `apps/longterm-next/next.config.ts` has a `transpilePackages` array that currently includes `@cairn/ui`. When creating `@cairn/data` as a workspace package with TypeScript source exports (no build step), it **must also be added to `transpilePackages`** or Next.js will fail to compile the TypeScript imports.

**Fix required in Step 3.8:** After adding `@cairn/data` to `package.json`, also update `next.config.ts`:
```typescript
transpilePackages: [
  "@cairn/ui",
  "@cairn/data",  // ← ADD THIS
  "@quri/squiggle-components",
  "@quri/squiggle-lang",
  "@quri/ui",
],
```

### LOW: Phase 3 — `getEntityHref()` has app-specific routing

**What:** `getEntityHref(id)` in `index.ts` returns `/wiki/${numericId}` with a hardcoded `/wiki/` prefix. This is app-specific routing that doesn't belong in a shared package.

**Acceptable for now:** The only consumer is longterm-next. Document the concern and plan to make the prefix configurable via `config.ts` in a follow-up if other apps need different routing.

### VALIDATED: Phase 3 — Icon split approach is safe

Investigation of all 5 consumers of `entity-ontology.ts` confirmed:
- **1 consumer** (`EntityTypeIcon.tsx`) uses `.icon` property (LucideIcon component)
- **4 consumers** (`InfoBox.tsx`, `ExploreGrid.tsx`, `explore-utils.ts`, `validate-entities.test.ts`) only use string properties (labels, colors, badges)

The enrichment wrapper approach will work correctly.

### VALIDATED: Phase 3 — Re-export pattern works

`@cairn/ui` already uses the exact same pattern (`export * from "@cairn/ui"` wrappers). Confirmed no issues with barrel exports, type re-exports, or package resolution.

---

## Current State (as of main)

### Source of truth
- All YAML data: `apps/longterm/src/data/` (entities/, facts/, resources/, insights/, graphs/, plus root YAML files)
- All MDX content: `apps/longterm/src/content/docs/`
- Build script (canonical): `apps/longterm/scripts/build-data.mjs` (1182 lines, monolithic)
- Build script (modularized): `apps/longterm-next/scripts/build-data.mjs` (596 lines, imports from lib/)
- Runtime data layer: `apps/longterm-next/src/data/index.ts` (1246 lines)

### Build flow
```
longterm-next prebuild
  → cd ../longterm && node scripts/build-data.mjs    ← uses longterm's monolithic script
  → generates apps/longterm/src/data/database.json

longterm-next runtime
  → src/data/index.ts reads database.json from longterm (or local copy)
  → transforms entities at runtime (type mapping, expert merging, etc.)
```

### Key insight: longterm-next already has a modularized build script
`apps/longterm-next/scripts/build-data.mjs` (596 lines) already imports from `scripts/lib/`:
- `computed-facts.mjs` (286 lines)
- `entity-transform.mjs` (301 lines)
- `statistics.mjs` (85 lines)
- `unconverted-links.mjs` (101 lines)
- `mdx-generator.mjs` (96 lines)
- `metrics-extractor.mjs`, `redundancy.mjs`, `content-types.mjs`, `file-utils.mjs`, `output.mjs`

This script is NOT currently used — prebuild runs longterm's version instead.

---

## Phase 1: Switch to longterm-next's Own Build Script

### Goal
Stop depending on `apps/longterm/scripts/build-data.mjs`. Use `apps/longterm-next/scripts/build-data.mjs` instead, which is already modularized.

### Why first
This is the foundation — all subsequent phases modify the build script and index.ts. We need to know which build script we're working with. Using the longterm-next one means future changes go in the right place.

### Steps

#### Step 1.1: Verify functional equivalence

Run both build scripts and compare output:

```bash
# Build with longterm's script (current behavior)
cd apps/longterm && node scripts/build-data.mjs
cp src/data/database.json /tmp/database-longterm.json

# Build with longterm-next's script
cd apps/longterm-next && node scripts/build-data.mjs
cp src/data/database.json /tmp/database-next.json

# Compare (ignore timestamps and ordering)
diff <(jq --sort-keys 'del(.stats.lastBuilt)' /tmp/database-longterm.json) \
     <(jq --sort-keys 'del(.stats.lastBuilt)' /tmp/database-next.json)
```

If there are differences, catalog them and decide which behavior is correct. The longterm-next version should be the source of truth going forward.

**Known potential differences:**
- The longterm-next script may already call `transformEntities()` (check if entity-transform.mjs is wired in)
- Output paths may differ (longterm writes to its own src/data/, longterm-next writes to its own src/data/)
- Some features in longterm's build-data.mjs may not be in the next version yet (e.g., LLM file generation, link health checking)

#### Step 1.2: Fix any gaps (CRITICAL — at least one known gap)

**KNOWN BLOCKER:** The longterm-next build script is missing `scanFrontmatterEntities()`. This function (in `apps/longterm/scripts/build-data.mjs` lines 865-930) scans all MDX files for `entityType` frontmatter and auto-creates entities for pages that don't have corresponding YAML entries. Without it, frontmatter-only entities will be silently lost.

**Required fix:**
1. Create `apps/longterm-next/scripts/lib/frontmatter-scanner.mjs` — port `scanFrontmatterEntities()` from `apps/longterm/scripts/build-data.mjs` lines 865-920
2. The function takes a Set of YAML entity IDs and returns auto-created entity objects
3. Wire it into `build-data.mjs` after YAML entity loading, before the merge step:
   ```javascript
   import { scanFrontmatterEntities } from './lib/frontmatter-scanner.mjs';
   // ... after loading YAML entities:
   const yamlEntityIds = new Set(database.entities.map(e => e.id));
   const frontmatterEntities = scanFrontmatterEntities(yamlEntityIds, CONTENT_DIR);
   database.entities = [...database.entities, ...frontmatterEntities];
   ```

For any other missing features:
- Add the missing functionality by importing from lib/ modules (don't inline code)
- Or remove the feature if it's longterm-only (e.g., Astro-specific stuff)

#### Step 1.3: Update prebuild to use longterm-next's script

In `apps/longterm-next/package.json`, change:
```json
// Before:
"prebuild": "cd ../longterm && node scripts/build-data.mjs"

// After:
"prebuild": "node scripts/build-data.mjs"
```

The longterm-next build script already reads YAML from `../longterm/src/data/` and MDX from `../longterm/src/content/docs/` via its `content-types.mjs` module. Verify these paths are correct.

#### Step 1.4: Update sync:data script

```json
// Before:
"sync:data": "cd ../longterm && node scripts/build-data.mjs && cd ../longterm-next && cp ..."

// After:
"sync:data": "node scripts/build-data.mjs"
```

The longterm-next build script should write database.json directly to `src/data/database.json` (its own directory).

#### Step 1.5: Verify

```bash
pnpm --filter longterm-next build    # Full build succeeds
pnpm --filter longterm-next test     # All tests pass
pnpm --filter longterm-next dev      # Dev server works
```

### What this changes
- `apps/longterm-next/package.json` — prebuild and sync:data scripts
- `apps/longterm-next/scripts/lib/frontmatter-scanner.mjs` — NEW file (ported from longterm)
- `apps/longterm-next/scripts/build-data.mjs` — imports and calls `scanFrontmatterEntities()`
- No code changes to the data layer.

### What this does NOT change
- `apps/longterm/scripts/build-data.mjs` — left untouched (longterm can still use its own script for Astro builds)
- No import paths change
- No runtime behavior change

---

## Phase 2: Move Entity Transformation to Build Time

### Goal
Move the ~286 lines of runtime entity transformation from `src/data/index.ts` into the build script, so `database.json` contains pre-transformed `typedEntities`.

### Prerequisites
- Phase 1 complete (we're using longterm-next's build script)
- `apps/longterm-next/scripts/lib/entity-transform.mjs` exists (it does — 301 lines)

### Current runtime transformation (in index.ts)

These functions run every time the data layer loads:

| Function | Lines | What it does |
|----------|-------|--------------|
| `PROJECT_PATH_PATTERNS` | 115-117 | Path patterns for entity type overrides |
| `ENTITY_TYPE_OVERRIDES` | 122-125 | Explicit entity ID → type overrides |
| `applyEntityOverrides()` | 127-169 | Remaps types by path/ID, creates missing entities |
| `transformEntity()` | 181-326 | Type mapping, expert/org merging, customField extraction |
| `RISK_CATEGORIES` | 883-911 | Risk category assignment mapping |
| `getRiskCategory()` | 913-927 | Risk category lookup |
| `getTypedEntities()` | 359-390 | Orchestrates all above |

Total: ~286 lines of runtime transformation code.

### Steps

#### Step 2.1: Fix known bugs in entity-transform.mjs, then verify coverage

**CRITICAL BUG FIX — default case drops extra fields:**

In `scripts/lib/entity-transform.mjs` lines 264-266, the default case returns `{ ...base, entityType: canonicalType }`. This drops all extra raw fields for unknown entity types (ai-transition-model-*, etc.). The runtime `index.ts` version (lines 319-324) correctly preserves them with `{ ...rawRest, ...base, entityType: canonicalType }`.

Fix the default case in `entity-transform.mjs`:
```javascript
// BEFORE (BUGGY):
default:
  return { ...base, entityType: canonicalType };

// AFTER (FIXED):
default: {
  const { type: _type, ...rawRest } = raw;
  return { ...rawRest, ...base, entityType: canonicalType };
}
```

Without this fix, ATM entities lose `content`, `currentAssessment`, `ratings`, `causeEffectGraph`, and other specialized fields.

**MEDIUM BUG FIX — null-safety in applyEntityOverrides:**

Add null guards at the top of `applyEntityOverrides()` (line 104):
```javascript
function applyEntityOverrides(entities, pages) {
  entities = entities || [];
  pages = pages || [];
  // ... rest of function
}
```

**Then verify full coverage:**

Read `entity-transform.mjs` and compare with the runtime functions in `index.ts`. Verify it handles:

- [x] `OLD_TYPE_MAP` — lab-* → organization, researcher → person
- [x] `OLD_LAB_TYPE_TO_ORG_TYPE` — lab-* → orgType
- [x] `RISK_CATEGORIES` + `getRiskCategory()` — risk category assignment
- [x] `PROJECT_PATH_PATTERNS` + `ENTITY_TYPE_OVERRIDES` — type overrides
- [x] `applyEntityOverrides()` — path-based + explicit type remapping
- [x] `transformEntity()` — full entity transformation (person/org/policy/risk/etc.)
- [x] `transformEntities()` — orchestrator
- [ ] **Default case preserves extra raw fields** (bug fix above)

#### Step 2.2: Wire entity-transform into the build script

In `apps/longterm-next/scripts/build-data.mjs`, the `transformEntities` import should already exist (check line ~22). If not, add it:

```javascript
import { transformEntities } from './lib/entity-transform.mjs';
```

In the `main()` function, after the pages registry is built and entities/experts/organizations are loaded, add:

```javascript
// Transform entities at build time
const typedEntities = transformEntities(
  database.entities,
  database.pages,          // pages array (for path-based type overrides)
  database.experts,
  database.organizations
);
database.typedEntities = typedEntities;
console.log(`  typedEntities: ${typedEntities.length}`);
```

**Placement:** After `database.pages` is populated but before JSON output. The `transformEntities()` function needs all four arrays.

#### Step 2.3: Update DatabaseShape in index.ts

In `apps/longterm-next/src/data/index.ts`, add `typedEntities` to the `DatabaseShape` interface:

```typescript
interface DatabaseShape {
  entities: RawEntity[];
  typedEntities?: Array<Record<string, unknown>>; // Pre-transformed entities from build
  resources: Resource[];
  publications: Publication[];
  experts: Expert[];
  organizations: Organization[];
  backlinks: Record<string, BacklinkEntry[]>;
  pathRegistry: Record<string, string>;
  idRegistry: IdRegistryMaps;
  pages: Page[];
  facts: Record<string, Fact>;
  insights: DatabaseInsight[];
  stats: Record<string, unknown>;
}
```

#### Step 2.4: Simplify getTypedEntities() in index.ts

Replace the current `getTypedEntities()` function (lines 359-390) with a version that reads pre-transformed entities:

```typescript
function getTypedEntities(): AnyEntity[] {
  if (_typedEntities) return _typedEntities;

  const db = getDatabase();

  if (!db.typedEntities || db.typedEntities.length === 0) {
    throw new Error(
      'database.json is missing typedEntities. ' +
      'Run "pnpm --filter longterm-next prebuild" to rebuild.'
    );
  }

  // Parse pre-transformed entities via Zod
  const entities: AnyEntity[] = [];
  const isDev = process.env.NODE_ENV === "development";

  for (const raw of db.typedEntities) {
    const result = TypedEntitySchema.safeParse(raw);
    if (result.success) {
      entities.push(result.data);
    } else {
      // Fall back to generic schema for unknown types
      const generic = GenericEntitySchema.safeParse(raw);
      if (generic.success) {
        entities.push(generic.data);
      } else if (isDev) {
        console.warn(
          `[entity-validation] ${(raw as any).id}: ${result.error.issues.map(i => i.message).join(", ")}`
        );
      }
    }
  }

  _typedEntities = entities;
  return _typedEntities;
}
```

**Key change:** No more runtime `transformEntity()` calls. Just Zod validation of pre-built data.

#### Step 2.5: Remove applyEntityOverrides() call from getDatabase()

In `getDatabase()` (around line 349), remove the `applyEntityOverrides()` call:

```typescript
function getDatabase(): DatabaseShape {
  if (_database) return _database;

  const localDbPath = path.join(LOCAL_DATA_DIR, "database.json");
  const longtermDbPath = path.join(LONGTERM_DATA_DIR, "database.json");
  const dbPath = fs.existsSync(localDbPath) ? localDbPath : longtermDbPath;

  try {
    const raw = fs.readFileSync(dbPath, "utf-8");
    _database = JSON.parse(raw) as DatabaseShape;
    // REMOVED: _database = applyEntityOverrides(rawDb);
  } catch (err) {
    throw new Error(
      `Failed to load database from ${dbPath}: ${err instanceof Error ? err.message : err}. ` +
      `Run "pnpm --filter longterm-next prebuild" first.`
    );
  }
  return _database;
}
```

#### Step 2.6: Delete dead code from index.ts

Remove these sections (in order from bottom to top to preserve line numbers):

1. **RISK_CATEGORIES + getRiskCategory()** (lines 883-927, ~45 lines)
2. **transformEntity()** (lines 181-326, ~145 lines)
3. **applyEntityOverrides() + constants** (lines 105-169, ~65 lines):
   - `PROJECT_PATH_PATTERNS`
   - `ENTITY_TYPE_OVERRIDES`
   - `applyEntityOverrides()`

4. **Unused imports** from entity-schemas — remove `OLD_TYPE_MAP`, `OLD_LAB_TYPE_TO_ORG_TYPE` if not used elsewhere.

5. **RawEntity interface** (lines 60-88) — only used by transformEntity(). Can be removed if no other code references it. Check first!

**Important:** Do NOT remove `RawEntity` if it's still referenced by `getDatabase()` or the `DatabaseShape` interface. The raw `entities` array still exists in database.json for backward compat.

#### Step 2.7: Update tests

In `apps/longterm-next/src/data/__tests__/data.test.ts`, the mock database needs `typedEntities`:

```typescript
const mockDatabase = {
  entities: [ /* existing raw entities */ ],
  typedEntities: [
    {
      id: "test-entity",
      entityType: "risk",
      title: "Test Entity",
      description: "A test entity",
      severity: "high",
      tags: ["ai", "safety"],
      relatedEntries: [{ id: "other-entity", type: "concept" }],
      riskCategory: "accident",
      clusters: [],
      sources: [],
      customFields: [],
      relatedTopics: [],
    },
    {
      id: "other-entity",
      entityType: "concept",
      title: "Other Entity",
      description: "Another entity",
      tags: [],
      clusters: [],
      sources: [],
      customFields: [],
      relatedTopics: [],
    },
    {
      id: "researcher-1",
      entityType: "person",
      title: "Dr. Test",
      role: "Researcher",
      affiliation: "Test Org",
      knownFor: [],
      tags: [],
      clusters: [],
      sources: [],
      customFields: [],
      relatedTopics: [],
    },
  ],
  // ... rest of mock data unchanged
};
```

#### Step 2.8: Verify

```bash
# Rebuild database.json with typedEntities
node apps/longterm-next/scripts/build-data.mjs

# Spot-check typedEntities
node -e "
const db = JSON.parse(require('fs').readFileSync('apps/longterm-next/src/data/database.json','utf-8'));
console.log('typedEntities:', (db.typedEntities || []).length);
console.log('entities:', (db.entities || []).length);
const p = (db.typedEntities||[]).find(e => e.id === 'geoffrey-hinton');
if (p) console.log('Person:', {type: p.entityType, role: p.role, affiliation: p.affiliation});
const o = (db.typedEntities||[]).find(e => e.id === 'anthropic');
if (o) console.log('Org:', {type: o.entityType, orgType: o.orgType});
const r = (db.typedEntities||[]).find(e => e.id === 'scheming');
if (r) console.log('Risk:', {type: r.entityType, riskCategory: r.riskCategory});
"

# Full verification
pnpm --filter longterm-next test
pnpm --filter longterm-next build
```

### Line count impact
- `index.ts`: 1246 → ~960 lines (remove ~286 lines of transformation code)
- `build-data.mjs`: +5 lines (import + call + log)

---

## Phase 3: Create `packages/data/` (@cairn/data)

### Goal
Extract the data access layer into a standalone package. Zero import changes in ~31 component/page files — re-export wrappers maintain existing `@data` and `@/data/*` aliases.

### Prerequisites
- Phase 2 complete (index.ts is simplified — no more runtime transforms)

### What moves to the package

| File | From | To | Changes needed |
|------|------|-----|----------------|
| `entity-schemas.ts` | `apps/longterm-next/src/data/` | `packages/data/src/` | None (pure Zod) |
| `entity-ontology.ts` | `apps/longterm-next/src/data/` | `packages/data/src/` | Strip lucide-react → use `iconName: string` |
| `index.ts` (access layer) | `apps/longterm-next/src/data/` | `packages/data/src/` | Replace hardcoded paths with config getters |
| `parameter-graph-data.ts` | `apps/longterm-next/src/data/` | `packages/data/src/` | Replace hardcoded paths with config getters |
| `__tests__/data.test.ts` | `apps/longterm-next/src/data/` | `packages/data/src/__tests__/` | Update imports |
| `__tests__/validate-entities.test.ts` | `apps/longterm-next/src/data/` | `packages/data/src/__tests__/` | Update imports |

### What stays in the app

| File | Why |
|------|-----|
| `master-graph-data.ts` | Imports `@xyflow/react` types and `@/components/` — deep React coupling |
| Icon mapping (lucide-react) | React dependency. Stays as enrichment wrapper in `src/data/entity-ontology.ts` |
| Build scripts (`scripts/`) | Read MDX content — build orchestration, not data access |
| YAML sources | Stay in `apps/longterm/src/data/` for now. Move in Phase 4 |

### Steps

#### Step 3.1: Create package scaffold

```
packages/data/
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── src/
    ├── index.ts
    ├── entity-schemas.ts
    ├── entity-ontology.ts
    ├── parameter-graph-data.ts
    ├── config.ts
    └── __tests__/
        ├── data.test.ts
        └── validate-entities.test.ts
```

**`packages/data/package.json`:**
```json
{
  "name": "@cairn/data",
  "version": "0.0.1",
  "type": "module",
  "exports": {
    ".": { "types": "./src/index.ts", "default": "./src/index.ts" },
    "./entity-schemas": { "types": "./src/entity-schemas.ts", "default": "./src/entity-schemas.ts" },
    "./entity-ontology": { "types": "./src/entity-ontology.ts", "default": "./src/entity-ontology.ts" },
    "./parameter-graph-data": { "types": "./src/parameter-graph-data.ts", "default": "./src/parameter-graph-data.ts" },
    "./config": { "types": "./src/config.ts", "default": "./src/config.ts" }
  },
  "dependencies": {
    "zod": "^3.25.76",
    "js-yaml": "^4.1.1"
  },
  "devDependencies": {
    "@types/js-yaml": "^4.0.9",
    "@types/node": "^22.0.0",
    "typescript": "^5.9.3",
    "vitest": "^4.0.18"
  }
}
```

**`packages/data/tsconfig.json`:**
```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**`packages/data/vitest.config.ts`:**
```typescript
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

`pnpm-workspace.yaml` already has `packages/*` glob — automatic.

#### Step 3.2: Create config module

**`packages/data/src/config.ts`:**
```typescript
import path from "path";

interface DataPaths {
  localDataDir: string;
  longtermDataDir: string;
}

let _config: DataPaths = {
  localDataDir: path.resolve(process.cwd(), "src/data"),
  longtermDataDir: path.resolve(process.cwd(), "../longterm/src/data"),
};

export function configureDataPaths(config: Partial<DataPaths>): void {
  _config = { ..._config, ...config };
}

export function getLocalDataDir(): string {
  return _config.localDataDir;
}

export function getLongtermDataDir(): string {
  return _config.longtermDataDir;
}
```

Default values match current behavior (process.cwd() is `apps/longterm-next/` when the Next.js app runs).

#### Step 3.3: Move entity-schemas.ts

Copy `apps/longterm-next/src/data/entity-schemas.ts` → `packages/data/src/entity-schemas.ts`. Zero changes needed — it only imports from `zod`.

Replace app file with re-export:
```typescript
// apps/longterm-next/src/data/entity-schemas.ts
export * from "@cairn/data/entity-schemas";
export type * from "@cairn/data/entity-schemas";
```

#### Step 3.4: Move entity-ontology.ts (with icon split)

This is the trickiest move because `entity-ontology.ts` imports 23 lucide-react icons.

**In `packages/data/src/entity-ontology.ts`** (the package version):
- Copy the full file
- Replace `icon: LucideIcon` field with `iconName: string` in `EntityTypeDefinition`
- Replace `icon: LucideIcon` field with `iconName: string` in `OrgTypeDefinition`
- Remove the lucide-react import
- Remove the `LucideIcon` type
- Replace all icon component references with string names:
  ```typescript
  risk: { label: "Risk", iconName: "Bug", iconColor: "...", badgeColor: "...", headerColor: "..." },
  person: { label: "Person", iconName: "User", iconColor: "...", badgeColor: "...", headerColor: "..." },
  // etc.
  ```
- All helper functions (`getEntityType`, `getEntityTypeLabel`, `getEntityTypeBadgeColor`, `getEntityTypeHeader`, `getOrgTypeLabel`, `ENTITY_GROUPS`) move as-is — they only use labels/colors, not icons
- The `getEntityTypeIcon()` function cannot move (it returns `LucideIcon`). Remove it from the package version.

**Icon name mapping (for reference when creating the package file):**
```
Bug → "Bug"               AlertTriangle → "AlertTriangle"
User → "User"             Scale → "Scale"
Cpu → "Cpu"               Shield → "Shield"
Building2 → "Building2"   HelpCircle → "HelpCircle"
Lightbulb → "Lightbulb"   ClipboardList → "ClipboardList"
Clock → "Clock"           BookOpen → "BookOpen"
BarChart3 → "BarChart3"   Box → "Box"
Gauge → "Gauge"           Activity → "Activity"
Route → "Route"           Banknote → "Banknote"
Compass → "Compass"       Package → "Package"
Rocket → "Rocket"         Microscope → "Microscope"
GraduationCap → "GraduationCap"  FlaskConical → "FlaskConical"
```

**In `apps/longterm-next/src/data/entity-ontology.ts`** (enrichment wrapper):
```typescript
import {
  Bug, User, Scale, Cpu, Shield, Building2, FlaskConical,
  HelpCircle, Clock, BookOpen, GraduationCap, BarChart3,
  Rocket, ClipboardList, Route, Banknote, Microscope,
  Gauge, AlertTriangle, Lightbulb, Box, Activity, Compass, Package,
} from "lucide-react";
import {
  ENTITY_TYPES as PURE_ENTITY_TYPES,
  ORG_TYPE_DISPLAY as PURE_ORG_TYPE_DISPLAY,
  type EntityTypeDefinition as PureEntityTypeDefinition,
  type OrgTypeDefinition as PureOrgTypeDefinition,
} from "@cairn/data/entity-ontology";

// Re-export everything pure from the package
export {
  ENTITY_GROUPS,
  getEntityType,
  getEntityTypeLabel,
  getEntityTypeBadgeColor,
  getEntityTypeHeader,
  getOrgTypeLabel,
} from "@cairn/data/entity-ontology";

type LucideIcon = React.ForwardRefExoticComponent<
  React.SVGProps<SVGSVGElement> & { size?: number | string }
>;

// Icon name → component mapping
const ICON_MAP: Record<string, LucideIcon> = {
  Bug, User, Scale, Cpu, Shield, Building2, FlaskConical,
  HelpCircle, Clock, BookOpen, GraduationCap, BarChart3,
  Rocket, ClipboardList, Route, Banknote, Microscope,
  Gauge, AlertTriangle, Lightbulb, Box, Activity, Compass, Package,
};

// Enriched type with actual icon components
export interface EntityTypeDefinition extends Omit<PureEntityTypeDefinition, 'iconName'> {
  icon: LucideIcon;
  iconName: string;
}

// Build enriched ENTITY_TYPES with resolved icons
export const ENTITY_TYPES: Record<string, EntityTypeDefinition> = {};
for (const [key, def] of Object.entries(PURE_ENTITY_TYPES)) {
  ENTITY_TYPES[key] = {
    ...def,
    icon: ICON_MAP[def.iconName] || Bug,
  };
}

// Enriched org type with actual icon components
export interface OrgTypeDefinition extends Omit<PureOrgTypeDefinition, 'iconName'> {
  icon: LucideIcon;
  iconName: string;
}

export const ORG_TYPE_DISPLAY: Record<string, OrgTypeDefinition> = {};
for (const [key, def] of Object.entries(PURE_ORG_TYPE_DISPLAY)) {
  ORG_TYPE_DISPLAY[key] = {
    ...def,
    icon: ICON_MAP[def.iconName] || Bug,
  };
}

export function getEntityTypeIcon(type: string): LucideIcon | null {
  return ENTITY_TYPES[type]?.icon ?? null;
}
```

**Verify:** Components that import `ENTITY_TYPES` and use `.icon` (like `EntityTypeIcon.tsx`, `InfoBox.tsx`) see the same interface — `icon` is a LucideIcon component.

#### Step 3.5: Move index.ts (access layer)

Copy `apps/longterm-next/src/data/index.ts` → `packages/data/src/index.ts`.

Changes needed in the package version:
- Replace `import ... from "./entity-schemas"` with `import ... from "./entity-schemas"` (same — relative path still works within the package)
- Replace hardcoded `LOCAL_DATA_DIR` and `LONGTERM_DATA_DIR` with config getters:
  ```typescript
  import { getLocalDataDir, getLongtermDataDir } from "./config";

  // Replace:
  // const LOCAL_DATA_DIR = path.resolve(process.cwd(), "src/data");
  // const LONGTERM_DATA_DIR = path.resolve(process.cwd(), "../longterm/src/data");

  // With usage of getters throughout:
  // path.join(getLocalDataDir(), "database.json")
  // path.join(getLongtermDataDir(), "database.json")
  ```
- Update all references to `LOCAL_DATA_DIR` → `getLocalDataDir()` and `LONGTERM_DATA_DIR` → `getLongtermDataDir()`. There are ~6 occurrences:
  - `getDatabase()`: localDbPath and longtermDbPath
  - `loadExternalLinksMap()`: localYamlPath and longtermYamlPath

Replace app file with re-export:
```typescript
// apps/longterm-next/src/data/index.ts
export * from "@cairn/data";
export type * from "@cairn/data";
```

#### Step 3.6: Move parameter-graph-data.ts

Copy → `packages/data/src/parameter-graph-data.ts`.

Changes: Replace hardcoded paths with config getters:
```typescript
import { getLocalDataDir, getLongtermDataDir } from "./config";

// Replace:
// const LOCAL_DATA_DIR = path.resolve(process.cwd(), "src/data");
// const LONGTERM_DATA_DIR = path.resolve(process.cwd(), "../longterm/src/data");

function readYaml(relativePath: string): string {
  const localPath = path.join(getLocalDataDir(), relativePath);
  if (fs.existsSync(localPath)) return fs.readFileSync(localPath, "utf-8");
  return fs.readFileSync(path.join(getLongtermDataDir(), relativePath), "utf-8");
}
```

Replace app file with re-export:
```typescript
// apps/longterm-next/src/data/parameter-graph-data.ts
export * from "@cairn/data/parameter-graph-data";
export type * from "@cairn/data/parameter-graph-data";
```

#### Step 3.7: Move tests

Copy test files to `packages/data/src/__tests__/`.

**`data.test.ts`:** Update dynamic imports from `../../data/index` to `../index` (package-relative).

**`validate-entities.test.ts`:** Update imports:
- `../entity-ontology` → `../entity-ontology`  (same relative path within package)
- Update `DB_PATH` resolution to use package-relative paths or config getters

#### Step 3.8: Wire up the dependency

Add to `apps/longterm-next/package.json`:
```json
"dependencies": {
  "@cairn/data": "workspace:*",
  // ... existing deps
}
```

**CRITICAL: Add to `transpilePackages` in `apps/longterm-next/next.config.ts`:**
```typescript
transpilePackages: [
  "@cairn/ui",
  "@cairn/data",  // ← ADD THIS — required for TS source exports
  "@quri/squiggle-components",
  "@quri/squiggle-lang",
  "@quri/ui",
],
```

Without this, Next.js will fail to compile TypeScript imports from the workspace package. This is the same pattern used by `@cairn/ui`.

Run `pnpm install`.

#### Step 3.9: Verify

```bash
pnpm --filter @cairn/data test          # Package tests pass
pnpm --filter longterm-next test         # App tests still pass
pnpm --filter longterm-next build        # Full build succeeds
```

### Resulting file structure

```
packages/data/
├── package.json              # @cairn/data
├── tsconfig.json
├── vitest.config.ts
└── src/
    ├── index.ts              # ~960 lines — full data access layer
    ├── entity-schemas.ts     # Zod schemas, type guards
    ├── entity-ontology.ts    # Pure data: labels, colors, iconName strings
    ├── parameter-graph-data.ts
    ├── config.ts             # Data directory path configuration
    └── __tests__/
        ├── data.test.ts
        └── validate-entities.test.ts

apps/longterm-next/src/data/
├── index.ts                  # Re-export: export * from "@cairn/data"
├── entity-schemas.ts         # Re-export: export * from "@cairn/data/entity-schemas"
├── entity-ontology.ts        # Enrichment wrapper: adds lucide-react icons
├── parameter-graph-data.ts   # Re-export: export * from "@cairn/data/parameter-graph-data"
└── master-graph-data.ts      # UNCHANGED (stays in app)
```

### What does NOT change
- **No import changes in ~31 component/page files.** `@data` and `@/data/*` aliases resolve to local wrappers that re-export from the package.
- **No changes to `master-graph-data.ts`** — stays in app.
- **No changes to build scripts or YAML data** — stay where they are.
- **No changes to the content pipeline** (`src/lib/mdx.ts`, MDX files, etc.)

---

## Phase 4: Move YAML Sources + Build Scripts to Package

### Goal
Complete decoupling from `apps/longterm/`. The data package owns its own source files and build pipeline.

### Prerequisites
- Phase 3 complete (package exists with access layer)

### Steps

#### Step 4.1: Move YAML sources

Move all YAML data from `apps/longterm/src/data/` to `packages/data/sources/`:

```
packages/data/sources/
├── entities/               # 24 YAML files
│   ├── risks.yaml
│   ├── capabilities.yaml
│   ├── organizations.yaml
│   ├── people.yaml
│   ├── ai-transition-model-*.yaml
│   └── ...
├── facts/                  # 4+ YAML files
├── resources/              # 10 YAML files
├── insights/               # 6 YAML files
├── graphs/                 # 4 YAML files
├── experts.yaml
├── organizations.yaml
├── estimates.yaml
├── cruxes.yaml
├── glossary.yaml
├── literature.yaml
├── funders.yaml
├── publications.yaml
├── external-links.yaml
└── parameter-graph.yaml
```

#### Step 4.2: Move build scripts

Move from `apps/longterm-next/scripts/` to `packages/data/scripts/`:
- `build-data.mjs`
- `lib/` (all modules)
- `generate-llm-files.mjs`
- `flatten-content.mjs`
- `validate/` directory

Update `content-types.mjs` to accept `--content-dir` argument:
```javascript
// Default content dir (can be overridden via CLI)
const CONTENT_DIR = process.argv.includes('--content-dir')
  ? process.argv[process.argv.indexOf('--content-dir') + 1]
  : path.resolve(process.cwd(), '../longterm/src/content/docs');
```

#### Step 4.3: Move generated output

`database.json` and related JSON files → `packages/data/generated/`.

`id-registry.json` → `packages/data/generated/id-registry.json` (committed — persistent state).

#### Step 4.4: Update all path references

**`packages/data/src/config.ts`:** Update defaults to point to package-relative paths:
```typescript
let _config: DataPaths = {
  localDataDir: path.resolve(__dirname, "../generated"),
  longtermDataDir: path.resolve(__dirname, "../sources"),
};
```

**`apps/longterm-next/package.json`:** Update scripts:
```json
"prebuild": "pnpm --filter @cairn/data build",
"sync:data": "pnpm --filter @cairn/data build"
```

**`packages/data/package.json`:** Add build script:
```json
"scripts": {
  "build": "node scripts/build-data.mjs --content-dir ../../apps/longterm/src/content/docs",
  "test": "vitest run"
}
```

**`apps/longterm/`:** Update to read from the package instead of its own data:
- Symlink or update Astro config to read from `packages/data/generated/database.json`
- Or keep longterm reading its own files (it's being sunset anyway)

#### Step 4.5: Update .gitignore

Add `packages/data/generated/` (except `id-registry.json` which must be committed):
```gitignore
packages/data/generated/*
!packages/data/generated/id-registry.json
```

Or commit `database.json` (deterministic builds, no build step for dev) — see tradeoffs in PLAN_FOR_DATA_SEPARATION.md.

#### Step 4.6: Verify

```bash
pnpm --filter @cairn/data build       # Build pipeline runs
pnpm --filter @cairn/data test        # Data tests pass
pnpm --filter longterm-next build     # App builds correctly
pnpm --filter longterm-next test      # App tests pass
```

### Final file structure

```
packages/data/
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── sources/                  # All YAML source data
│   ├── entities/
│   ├── facts/
│   ├── resources/
│   ├── insights/
│   ├── graphs/
│   └── *.yaml
├── generated/                # Build output
│   ├── database.json
│   ├── id-registry.json      # committed
│   └── *.json
├── scripts/                  # Build pipeline
│   ├── build-data.mjs
│   ├── generate-llm-files.mjs
│   └── lib/
└── src/                      # TypeScript access layer
    ├── index.ts
    ├── entity-schemas.ts
    ├── entity-ontology.ts
    ├── parameter-graph-data.ts
    ├── config.ts
    └── __tests__/
```

---

## Dependency Graph Between Phases

```
Phase 1 (switch build script)
    │
    ▼
Phase 2 (entity transform to build time)
    │
    ▼
Phase 3 (create @cairn/data package)
    │
    ▼
Phase 4 (move YAML + build scripts)
```

Each phase depends on the previous. Phases 1+2 could potentially be combined into a single PR since they both modify the build script and index.ts. Phases 3 and 4 should be separate PRs.

---

## Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|-----------|
| **Missing `scanFrontmatterEntities()`** — longterm-next build script silently drops frontmatter-only entities | **CRITICAL** | Port the function in Step 1.2 before switching. Step 1.1 JSON diff will catch the missing entities as a safety net. |
| **Default case drops extra fields** — `entity-transform.mjs` loses ATM entity data (content, ratings, causeEffectGraph) | **CRITICAL** | Fix the default case to use `{ ...rawRest, ...base }` in Step 2.1 before using the .mjs version. |
| **Missing `transpilePackages` entry** — Next.js can't compile `@cairn/data` TS imports | **MEDIUM** | Add `"@cairn/data"` to `transpilePackages` in Step 3.8. Same pattern as `@cairn/ui`. |
| longterm-next build script produces different output than longterm's | Medium | Step 1.1 does a full JSON diff before switching |
| Entity transformation at build time misses other edge cases | Medium | Step 2.1 verifies entity-transform.mjs covers all runtime logic; tests catch regressions |
| Null/undefined entities or pages arrays crash `applyEntityOverrides()` | Low | Add `|| []` null guards in Step 2.1 |
| Re-export wrappers break type inference | Low | Use `export type *` alongside `export *` for TypeScript types |
| entity-ontology icon split breaks consumers | Low | Only 1 of 5 consumers uses `.icon`; enrichment wrapper preserves the `icon: LucideIcon` field |
| `getEntityHref()` has hardcoded `/wiki/` prefix in shared package | Low | Acceptable for now (only consumer is longterm-next). Make configurable via `config.ts` if needed later. |
| config.ts defaults break in CI or different working directories | Low | Defaults match current `process.cwd()` behavior; `configureDataPaths()` available for override |
| database.json grows with typedEntities | Low | Acceptable tradeoff (~8MB → ~16MB). Can strip raw `entities` in a follow-up once transition is complete |

---

## Commands Reference

```bash
# Build data (after Phase 1)
node apps/longterm-next/scripts/build-data.mjs

# Build data (after Phase 4)
pnpm --filter @cairn/data build

# Run package tests
pnpm --filter @cairn/data test

# Run app tests
pnpm --filter longterm-next test

# Full app build
pnpm --filter longterm-next build

# Dev server
pnpm --filter longterm-next dev
```

---

## What This Plan Does NOT Cover

- **`master-graph-data.ts` extraction** — Stays in app due to `@xyflow/react` + component coupling. Could move if graph types get decoupled from React.
- **Content (MDX) separation** — MDX files stay in `apps/longterm/src/content/docs/`. A `packages/content/` is a separate future effort.
- **Database migration** (JSON → SQLite → Turso) — The access layer API is designed to make this possible later. See PLAN_FOR_DATA_SEPARATION.md.
- **Validation rules** — 34 rules in `apps/longterm/scripts/lib/rules/`. Data rules should eventually move to the package; content rules stay. Not in scope for this plan.
- **PR #4 (facts system)** — Independent. If merged before Phase 3, `facts.ts` stays in the app and gets moved in a follow-up.
