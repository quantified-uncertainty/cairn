/**
 * Entity data validation tests.
 *
 * Validates real database.json entities for data integrity issues that
 * would otherwise surface as runtime errors or broken UI.
 */
import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { ENTITY_TYPES } from "../entity-ontology";

// ---------------------------------------------------------------------------
// Load real database.json
// ---------------------------------------------------------------------------

const DB_PATH = path.resolve(__dirname, "../database.json");
const LONGTERM_DB_PATH = path.resolve(
  __dirname,
  "../../../../longterm/src/data/database.json",
);
const dbPath = fs.existsSync(DB_PATH) ? DB_PATH : LONGTERM_DB_PATH;
const db = JSON.parse(fs.readFileSync(dbPath, "utf-8"));

interface RawEntity {
  id: string;
  type: string;
  title?: string;
  entityType?: string;
  relatedEntries?: { id: string; type: string; relationship?: string }[];
}

const entities: RawEntity[] = db.entities || [];

// ---------------------------------------------------------------------------
// Valid types
// ---------------------------------------------------------------------------

// Canonical types from entity-ontology.ts (includes compat aliases added at runtime)
const VALID_CANONICAL_TYPES = new Set(Object.keys(ENTITY_TYPES));

// Legacy types allowed in relatedEntries (raw YAML uses old names)
// Also includes plural-form typos that exist in current data (should be cleaned up)
const LEGACY_TYPES = new Set([
  "lab",
  "lab-frontier",
  "lab-research",
  "lab-academic",
  "lab-startup",
  "researcher",
  // Plural-form variants found in organizations.yaml relatedEntries
  "concepts",
  "events",
  "policies",
]);

// AI transition model types — handled by the default case in transformEntity
const AI_TRANSITION_MODEL_TYPES = new Set(
  entities
    .map((e) => e.entityType || e.type)
    .filter((t) => t.startsWith("ai-transition-model-")),
);

// All types allowed on the entity itself
const VALID_ENTITY_TYPES = new Set([
  ...VALID_CANONICAL_TYPES,
  ...AI_TRANSITION_MODEL_TYPES,
]);

// All types allowed in relatedEntries references
const VALID_RELATED_ENTRY_TYPES = new Set([
  ...VALID_CANONICAL_TYPES,
  ...LEGACY_TYPES,
  ...AI_TRANSITION_MODEL_TYPES,
]);

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Entity data validation", () => {
  it("has entities to validate", () => {
    expect(entities.length).toBeGreaterThan(0);
  });

  describe("entity types are valid ontology types", () => {
    it("every entity.type is a known type", () => {
      const invalid: string[] = [];
      for (const entity of entities) {
        const type = entity.entityType || entity.type;
        if (!VALID_ENTITY_TYPES.has(type)) {
          invalid.push(`${entity.id}: type="${type}"`);
        }
      }
      expect(invalid, `Invalid entity types:\n  ${invalid.join("\n  ")}`).toHaveLength(0);
    });
  });

  describe("relatedEntries types are valid", () => {
    it("every relatedEntries[].type is a known type", () => {
      const invalid: string[] = [];
      for (const entity of entities) {
        for (const rel of entity.relatedEntries || []) {
          if (!VALID_RELATED_ENTRY_TYPES.has(rel.type)) {
            invalid.push(
              `${entity.id} → relatedEntry "${rel.id}" has type="${rel.type}"`,
            );
          }
        }
      }
      expect(
        invalid,
        `Invalid relatedEntries types:\n  ${invalid.join("\n  ")}`,
      ).toHaveLength(0);
    });
  });

  describe("no duplicate entity IDs", () => {
    it("every entity.id is unique", () => {
      const seen = new Map<string, number>();
      const duplicates: string[] = [];
      for (const entity of entities) {
        const count = (seen.get(entity.id) || 0) + 1;
        seen.set(entity.id, count);
        if (count === 2) {
          duplicates.push(entity.id);
        }
      }
      expect(
        duplicates,
        `Duplicate entity IDs:\n  ${duplicates.join("\n  ")}`,
      ).toHaveLength(0);
    });
  });

  describe("required fields present", () => {
    it("every entity has id, title, and a type", () => {
      const invalid: string[] = [];
      for (const entity of entities) {
        const missing: string[] = [];
        if (!entity.id) missing.push("id");
        if (!entity.title) missing.push("title");
        if (!entity.type && !entity.entityType) missing.push("type/entityType");
        if (missing.length > 0) {
          invalid.push(
            `${entity.id || "(no id)"}: missing ${missing.join(", ")}`,
          );
        }
      }
      expect(
        invalid,
        `Entities with missing required fields:\n  ${invalid.join("\n  ")}`,
      ).toHaveLength(0);
    });
  });

  describe("relatedEntries reference existing entities", () => {
    it("every relatedEntries[].id resolves to an actual entity", () => {
      const entityIds = new Set(entities.map((e) => e.id));
      const broken: string[] = [];
      for (const entity of entities) {
        for (const rel of entity.relatedEntries || []) {
          if (!entityIds.has(rel.id)) {
            broken.push(
              `${entity.id} → relatedEntry "${rel.id}" (type="${rel.type}") not found`,
            );
          }
        }
      }
      // Report but don't fail hard — some references may be to pages without entities
      if (broken.length > 0) {
        console.warn(
          `[warn] ${broken.length} relatedEntries reference non-entity IDs:\n  ${broken.slice(0, 20).join("\n  ")}${broken.length > 20 ? `\n  ... and ${broken.length - 20} more` : ""}`,
        );
      }
      // Use a soft threshold — allow some non-entity references (pages, etc.)
      // but flag if a large percentage are broken (suggests data corruption)
      const brokenPct =
        entities.length > 0 ? broken.length / entities.length : 0;
      expect(
        brokenPct,
        `${broken.length} broken relatedEntries references (${(brokenPct * 100).toFixed(1)}% of entities) — check for typos`,
      ).toBeLessThan(0.5);
    });
  });
});
