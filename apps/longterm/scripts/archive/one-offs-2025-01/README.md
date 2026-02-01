# Archived One-Off Scripts (January 2025)

These scripts were used for one-time migrations, batch operations, or data cleanup tasks.
They're preserved here for reference but shouldn't need to be run again.

## Scripts

| Script | Purpose |
|--------|---------|
| add-80k-links.mjs | Added 80,000 Hours links to pages |
| add-alignment-forum-links.mjs | Added Alignment Forum links |
| add-atm-links.mjs | Added AI Transition Model links |
| add-comprehensive-links.mjs | Comprehensive link addition pass |
| add-wikidata-links.mjs | Added Wikidata references |
| analyze-estimate-boxes.mjs | Analyzed EstimateBox usage |
| audit-site.mjs | One-time site audit |
| cleanup-atm-placeholders.mjs | Cleaned up ATM placeholder text |
| expand-external-links.mjs | Expanded external link metadata |
| feedback-reviewer.mjs | Reviewed user feedback |
| fix-estimate-boxes.mjs | Fixed EstimateBox formatting |
| fix-parameters-links.mjs | Fixed parameter links |
| fix-yaml-parameter-links.mjs | Fixed YAML parameter links |
| list-high-gap-pages.mjs | Listed pages with high insight gaps |
| list-uncovered.mjs | Listed uncovered topics |
| match-external-links.mjs | Matched external links to resources |
| migrate-placeholders-to-todos.mjs | Migrated placeholders to todo items |
| remove-stub-sections.mjs | Removed stub section markers |
| split-general-yaml.mjs | Split general.yaml into category files |
| validate-external-links.mjs | Validated external link accessibility |
| validate-wikidata-links.mjs | Validated Wikidata link integrity |
| fix-broken-atm-links.mjs | Fixed broken ATM entity links |
| fix-model-links.mjs | Fixed model page links |
| fix-trailing-slashes.mjs | Fixed trailing slash issues |
| migrate-mdx-to-yaml.mjs | Migrated MDX content to YAML |
| remove-placeholder-links.mjs | Removed placeholder links |
| sync-model-descriptions.mjs | Synced model descriptions to entities.yaml |

## Graph Sync Scripts

| Script | Purpose |
|--------|---------|
| graph-sync/add-missing-nodes-to-master.mjs | Added missing nodes to master graph |
| graph-sync/analyze-graph-sync.mjs | Analyzed sync status between diagrams |
| graph-sync/sync-graph-nodes.mjs | Synced nodes between entity diagrams |

## If You Need to Run One

```bash
node scripts/archive/one-offs-2025-01/script-name.mjs
```

Note: Some scripts may have outdated dependencies or paths.
