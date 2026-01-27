"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { pages, entities, type Page } from "../data"

// Shared tables data - categories should match page.category values (normalized)
const TABLES = [
  { id: 'safety-approaches', title: 'Safety Approaches', description: 'Evaluate safety research on effectiveness vs capability uplift.', href: '/knowledge-base/responses/safety-approaches/table', category: 'Responses' },
  { id: 'safety-generalizability', title: 'Safety Generalizability', description: 'Which safety approaches generalize across different AI architectures?', href: '/knowledge-base/responses/safety-generalizability/table', category: 'Responses' },
  { id: 'safety-matrix', title: 'Safety × Architecture Matrix', description: 'Matrix view showing compatibility between safety approaches and architecture scenarios.', href: '/knowledge-base/responses/safety-generalizability/matrix', category: 'Responses' },
  { id: 'architecture-scenarios', title: 'Architecture Scenarios', description: 'Compare deployment patterns and base architectures.', href: '/knowledge-base/architecture-scenarios/table', category: 'Intelligence Paradigms' },
  { id: 'deployment-architectures', title: 'Deployment Architectures', description: 'Compare how AI systems are deployed.', href: '/knowledge-base/deployment-architectures/table', category: 'Intelligence Paradigms' },
  { id: 'accident-risks', title: 'Accident Risks', description: 'Compare accident and misalignment risks.', href: '/knowledge-base/risks/accident/table', category: 'Risks' },
  { id: 'eval-types', title: 'Evaluation Types', description: 'Compare different evaluation methodologies.', href: '/knowledge-base/models/eval-types/table', category: 'Models' },
  { id: 'transition-model', title: 'AI Transition Model Parameters', description: 'All parameters in the AI Transition Model.', href: '/ai-transition-model/table', category: 'Parameters' },
]

type ContentType = 'all' | 'wiki' | 'tables' | 'diagrams'

interface ContentItem {
  id: string
  title: string
  description: string
  href: string
  type: 'wiki' | 'tables' | 'diagrams'
  category: string
}

// Normalize category names for display (handles both slug and already-formatted names)
function normalizeCategory(slug: string): string {
  if (!slug) return 'Other'
  // If already has spaces or uppercase, assume it's formatted
  if (slug.includes(' ') || /[A-Z]/.test(slug)) return slug
  // Map common slugs to friendly names
  const categoryMap: Record<string, string> = {
    'ai-transition-model': 'AI Transition Model',
    'knowledge-base': 'Knowledge Base',
    'intelligence-paradigms': 'Intelligence Paradigms',
    'research-reports': 'Research Reports',
    'future-projections': 'Future Projections',
    'foundation-models': 'Foundation Models',
  }
  return categoryMap[slug] || slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

// Build content list once at module level (data is static)
function buildContentList(): ContentItem[] {
  const items: ContentItem[] = []

  // Wiki pages - use page.category for semantic grouping
  pages
    .filter((p: Page) => !p.path.includes('/internal/') && !p.path.includes('/meta/') && p.title)
    .forEach((page: Page) => {
      // Use page.category if available, fallback to path-based
      const rawCategory = (page as any).category || page.path.split('/').filter(Boolean)[1] || 'other'
      const category = normalizeCategory(rawCategory)
      items.push({
        id: page.path, // Use path as key - guaranteed unique
        title: page.title,
        description: page.description || page.llmSummary || '',
        href: page.path,
        type: 'wiki',
        category,
      })
    })

  // Tables
  TABLES.forEach(table => {
    items.push({
      id: `table-${table.id}`,
      title: table.title,
      description: table.description,
      href: table.href,
      type: 'tables',
      category: table.category,
    })
  })

  // Diagrams
  entities
    .filter((e: any) => e.causeEffectGraph?.nodes?.length > 0)
    .forEach((e: any) => {
      items.push({
        id: `diagram-${e.id}`,
        title: e.causeEffectGraph?.title || e.title,
        description: e.causeEffectGraph?.description || `Cause-effect diagram for ${e.title}`,
        href: `/diagrams/${e.id}`,
        type: 'diagrams',
        category: 'Diagram',
      })
    })

  return items
}

const ALL_CONTENT = buildContentList()

// Pre-computed counts (static data)
const COUNTS = {
  all: ALL_CONTENT.length,
  wiki: ALL_CONTENT.filter(i => i.type === 'wiki').length,
  tables: ALL_CONTENT.filter(i => i.type === 'tables').length,
  diagrams: ALL_CONTENT.filter(i => i.type === 'diagrams').length,
}

const TYPE_BUTTONS: { type: ContentType; label: string; color?: string }[] = [
  { type: 'all', label: 'All' },
  { type: 'wiki', label: 'Wiki', color: 'bg-blue-500 hover:bg-blue-600' },
  { type: 'tables', label: 'Tables', color: 'bg-emerald-500 hover:bg-emerald-600' },
  { type: 'diagrams', label: 'Diagrams', color: 'bg-orange-500 hover:bg-orange-600' },
]

function ContentCard({ item }: { item: ContentItem }) {
  const typeConfig = {
    wiki: { label: 'Wiki', color: 'bg-blue-500' },
    tables: { label: 'Table', color: 'bg-emerald-500' },
    diagrams: { label: 'Diagram', color: 'bg-orange-500' },
  }
  const { label, color } = typeConfig[item.type]

  return (
    <a href={item.href} className="no-underline group block">
      <Card className="h-full transition-all hover:shadow-md hover:border-primary/50">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-sm font-medium group-hover:text-primary transition-colors line-clamp-2">
              {item.title}
            </CardTitle>
            <Badge variant="secondary" className={`shrink-0 text-[10px] text-white ${color}`}>
              {label}
            </Badge>
          </div>
          <Badge variant="outline" className="text-[10px] w-fit mt-1">
            {item.category}
          </Badge>
        </CardHeader>
        <CardContent className="pt-0">
          <CardDescription className="text-xs leading-relaxed line-clamp-2">
            {item.description || 'No description available'}
          </CardDescription>
        </CardContent>
      </Card>
    </a>
  )
}

export default function ContentHub() {
  const [search, setSearch] = useState('')
  const [activeType, setActiveType] = useState<ContentType>('all')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  // Filter content
  const filtered = useMemo(() => {
    return ALL_CONTENT.filter(item => {
      if (activeType !== 'all' && item.type !== activeType) return false
      if (activeCategory && item.category !== activeCategory) return false
      if (search) {
        const s = search.toLowerCase()
        if (!item.title.toLowerCase().includes(s) && !item.description.toLowerCase().includes(s)) return false
      }
      return true
    })
  }, [activeType, activeCategory, search])

  // Get categories for current type
  const categories = useMemo(() => {
    const items = activeType === 'all' ? ALL_CONTENT : ALL_CONTENT.filter(i => i.type === activeType)
    return [...new Set(items.map(i => i.category))].sort()
  }, [activeType])

  return (
    <div className="space-y-4">
      {/* Search */}
      <Input
        type="search"
        placeholder="Search content..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="h-10"
      />

      {/* Type filters */}
      <div className="flex flex-wrap gap-2">
        {TYPE_BUTTONS.map(({ type, label, color }) => (
          <Button
            key={type}
            variant={activeType === type ? 'default' : 'outline'}
            size="sm"
            onClick={() => { setActiveType(type); setActiveCategory(null) }}
            className={activeType === type && color ? color : ''}
          >
            {label} ({COUNTS[type]})
          </Button>
        ))}
      </div>

      {/* Category filters */}
      {categories.length > 1 && (
        <div className="flex flex-wrap gap-1">
          <Button
            variant={activeCategory === null ? 'secondary' : 'ghost'}
            size="sm"
            className="h-7 text-xs"
            onClick={() => setActiveCategory(null)}
          >
            All
          </Button>
          {categories.map(cat => (
            <Button
              key={cat}
              variant={activeCategory === cat ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </Button>
          ))}
        </div>
      )}

      {/* Results */}
      <p className="text-sm text-muted-foreground">
        {filtered.length} items{search && ` matching "${search}"`}
      </p>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {filtered.map(item => (
          <ContentCard key={item.id} item={item} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No content found.{' '}
          <button className="underline" onClick={() => { setSearch(''); setActiveType('all'); setActiveCategory(null) }}>
            Clear filters
          </button>
        </div>
      )}
    </div>
  )
}
