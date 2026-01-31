# Claude Code Documentation Index

Reference documentation for working with the longterm wiki.

## Documentation Files

| File | Purpose | Use When |
|------|---------|----------|
| [page-types.md](page-types.md) | Page type system (content, stub, documentation) | Deciding what type a new page should be |
| [content-quality.md](content-quality.md) | Rating system, TODOs, template requirements | Assessing or improving page quality |
| [cause-effect-graphs.md](cause-effect-graphs.md) | causeEffectGraph YAML schema | Adding causal diagrams to ATM entities |
| [mermaid-diagrams.md](mermaid-diagrams.md) | Mermaid diagram syntax | Adding flowcharts, sequences to pages |
| [resource-linking.md](resource-linking.md) | External resource management | Working with `<R>` components and citations |
| [knowledge-base-system.md](knowledge-base-system.md) | SQLite cache architecture | Understanding the data layer |

## Related Skills

Skills provide workflow guidance:
- `/improving-pages` - Improve existing wiki pages
- `/generating-content` - Create new wiki pages
- `/managing-resources` - Manage external resource links

## Quick Commands

```bash
# Analysis
npm run analyze          # Full wiki health report
npm run analyze:brief    # Summary only

# Validation
npm run validate         # Full validation suite
npm run precommit        # Quick pre-commit checks

# Resources
npm run resources list   # Pages with unconverted links
```
