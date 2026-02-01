# Knowledge Base System

A SQLite-based system for managing article content, source references, and AI-generated summaries.

## Setup

Requires `.env` file with:
```
ANTHROPIC_API_KEY=sk-ant-...
```

## Commands

```bash
npm run crux -- analyze scan                   # Scan MDX files, extract sources
npm run crux -- generate summaries             # Generate AI summaries
node scripts/scan-content.mjs --stats          # Show database statistics
```

## Detailed Usage

```bash
# Scan content (run after editing MDX files)
node scripts/scan-content.mjs
node scripts/scan-content.mjs --force    # Rescan all files
node scripts/scan-content.mjs --verbose  # Show per-file progress

# Generate summaries
node scripts/generate/generate-summaries.mjs --batch 50           # Summarize 50 articles
node scripts/generate/generate-summaries.mjs --type sources       # Summarize sources instead
node scripts/generate/generate-summaries.mjs --model sonnet       # Use Sonnet (more expensive)
node scripts/generate/generate-summaries.mjs --id deceptive-alignment  # Specific article
node scripts/generate/generate-summaries.mjs --dry-run            # Preview without API calls
```

## Database Location

All cached data is stored in `.cache/` (gitignored):
- `.cache/knowledge.db` - SQLite database with articles, sources, summaries
- `.cache/sources/` - Fetched source documents (PDFs, HTML, text)

## Cost Estimates

| Task | Model | Cost |
|------|-------|------|
| Summarize all 311 articles | Haiku | ~$2-3 |
| Summarize all 793 sources | Haiku | ~$10-15 |
| Improve single article | Sonnet | ~$0.20 |

## Architecture

```
scripts/lib/knowledge-db.mjs       # Core database module
scripts/lib/anthropic.mjs          # Shared Anthropic client
scripts/scan-content.mjs           # Populate articles + sources
scripts/generate/generate-summaries.mjs  # AI summary generation
```

The database stores:
- **articles**: Full text content extracted from MDX files
- **sources**: External references (papers, blogs, reports) found in articles
- **summaries**: AI-generated summaries with key points and claims
- **entity_relations**: Relationships from entities.yaml

## Security Note

The SQLite database in `.cache/knowledge.db` is a local cache for AI-assisted content workflows only. It is:
- Not exposed to any network
- Not used in production builds
- Contains only derived data from public content
