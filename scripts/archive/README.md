# Archived Scripts

This directory contains one-off migration and utility scripts that have completed their purpose. They are kept for reference but are not intended for regular use.

## migrations/

Scripts that performed one-time data migrations:

| Script | Purpose | When Run |
|--------|---------|----------|
| `add-backlinks-to-pages.mjs` | Added backlinks section to content pages | Dec 2024 |
| `add-frontmatter-fields.mjs` | Bulk frontmatter field additions | Dec 2024 |
| `add-maturity-to-entities.mjs` | Added maturity ratings to entities.yaml | Dec 2024 |
| `add-maturity.mjs` | Added maturity ratings to risk pages | Dec 2024 |
| `add-page-status.mjs` | Added page status metadata | Dec 2024 |
| `add-timestamps.mjs` | Added git-based lastEdited dates | Dec 2024 |
| `migrate-likelihood-timeframe.mjs` | Schema migration for risk assessment | Dec 2024 |
| `migrate-related-sections.mjs` | Restructured related content sections | Dec 2024 |
| `migrate-sources-to-yaml.mjs` | Moved source data to YAML format | Dec 2024 |
| `migrate-tags.mjs` | Converted free-text tags to standardized format | Dec 2024 |
| `remove-manual-pagestatus.mjs` | Cleaned up old page status system | Dec 2024 |
| `fix-model-structure.mjs` | Fixed model page structure issues | Dec 2024 |

## one-offs/

Utility scripts for specific tasks:

| Script | Purpose |
|--------|---------|
| `cleanup-entities.mjs` | Cleaned up invalid entity references |
| `sync-experts-to-entities.mjs` | Synced expert data to entities.yaml |
| `extract-descriptions.mjs` | Extracted descriptions from MDX files |
| `fix-dates.mjs` | Fixed unquoted date values in frontmatter |
| `apply-summaries.mjs` | Applied reviewed summary drafts to MDX files |
| `generate-model-summaries.mjs` | Generated draft summaries from model content |

## Re-running archived scripts

If you need to re-run any of these scripts:

1. Check that the script is compatible with current data formats
2. Run from the project root: `node scripts/archive/migrations/script-name.mjs`
3. Test thoroughly before committing changes
