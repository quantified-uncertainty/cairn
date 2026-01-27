"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { pages, entities, type Page } from "../data"
import ContentTree from "./ContentTree"

// Shared tables data
const TABLES = [
  { id: 'safety-approaches', title: 'Safety Approaches', description: 'Evaluate safety research on effectiveness vs capability uplift.', href: '/knowledge-base/responses/safety-approaches/table', path: '/knowledge-base/responses/safety-approaches' },
  { id: 'safety-generalizability', title: 'Safety Generalizability', description: 'Which safety approaches generalize across different AI architectures?', href: '/knowledge-base/responses/safety-generalizability/table', path: '/knowledge-base/responses/safety-generalizability' },
  { id: 'safety-matrix', title: 'Safety × Architecture Matrix', description: 'Matrix view showing compatibility between safety approaches and architecture scenarios.', href: '/knowledge-base/responses/safety-generalizability/matrix', path: '/knowledge-base/responses/safety-generalizability' },
  { id: 'architecture-scenarios', title: 'Architecture Scenarios', description: 'Compare deployment patterns and base architectures.', href: '/knowledge-base/architecture-scenarios/table', path: '/knowledge-base/architecture-scenarios' },
  { id: 'deployment-architectures', title: 'Deployment Architectures', description: 'Compare how AI systems are deployed.', href: '/knowledge-base/deployment-architectures/table', path: '/knowledge-base/deployment-architectures' },
  { id: 'accident-risks', title: 'Accident Risks', description: 'Compare accident and misalignment risks.', href: '/knowledge-base/risks/accident/table', path: '/knowledge-base/risks/accident' },
  { id: 'eval-types', title: 'Evaluation Types', description: 'Compare different evaluation methodologies.', href: '/knowledge-base/models/eval-types/table', path: '/knowledge-base/models/eval-types' },
  { id: 'transition-model', title: 'AI Transition Model Parameters', description: 'All parameters in the AI Transition Model.', href: '/ai-transition-model/table', path: '/ai-transition-model' },
]

type ContentType = 'all' | 'wiki' | 'tables' | 'diagrams'

interface ContentItem {
  id: string
  title: string
  description: string
  href: string
  path: string
  type: 'wiki' | 'tables' | 'diagrams'
}

// Build content list once at module level (data is static)
function buildContentList(): ContentItem[] {
  const items: ContentItem[] = []

  // Wiki pages
  pages
    .filter((p: Page) => !p.path.includes('/internal/') && !p.path.includes('/meta/') && p.title)
    .forEach((page: Page) => {
      items.push({
        id: page.path,
        title: page.title,
        description: page.description || page.llmSummary || '',
        href: page.path,
        path: page.path,
        type: 'wiki',
      })
    })

  // Tables
  TABLES.forEach(table => {
    items.push({
      id: `table-${table.id}`,
      title: table.title,
      description: table.description,
      href: table.href,
      path: table.path,
      type: 'tables',
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
        path: `/diagrams`,
        type: 'diagrams',
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
  const [selectedPath, setSelectedPath] = useState<string | null>(null)

  // Items filtered by type (for tree)
  const typeFilteredItems = useMemo(() => {
    if (activeType === 'all') return ALL_CONTENT
    return ALL_CONTENT.filter(item => item.type === activeType)
  }, [activeType])

  // Items for tree component
  const treeItems = useMemo(() => {
    return typeFilteredItems.map(item => ({
      id: item.id,
      title: item.title,
      path: item.path,
      type: item.type,
    }))
  }, [typeFilteredItems])

  // Final filtered content (type + path + search)
  const filtered = useMemo(() => {
    return typeFilteredItems.filter(item => {
      // Path filter
      if (selectedPath && !item.path.startsWith(selectedPath)) return false
      // Search filter
      if (search) {
        const s = search.toLowerCase()
        if (!item.title.toLowerCase().includes(s) && !item.description.toLowerCase().includes(s)) return false
      }
      return true
    })
  }, [typeFilteredItems, selectedPath, search])

  return (
    <div className="flex gap-6">
      {/* Left sidebar - Tree */}
      <div className="w-64 shrink-0 hidden md:block">
        <div className="sticky top-4">
          <div className="mb-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Browse
            </h3>
          </div>
          <ContentTree
            items={treeItems}
            selectedPath={selectedPath}
            onSelectPath={setSelectedPath}
          />
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0 space-y-4">
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
              onClick={() => { setActiveType(type); setSelectedPath(null) }}
              className={activeType === type && color ? color : ''}
            >
              {label} ({COUNTS[type]})
            </Button>
          ))}
        </div>

        {/* Mobile path indicator */}
        {selectedPath && (
          <div className="md:hidden flex items-center gap-2 text-sm text-muted-foreground">
            <span>Filtering:</span>
            <Badge variant="secondary" className="font-mono text-xs">
              {selectedPath}
            </Badge>
            <button
              className="text-primary hover:underline text-xs"
              onClick={() => setSelectedPath(null)}
            >
              Clear
            </button>
          </div>
        )}

        {/* Results count */}
        <p className="text-sm text-muted-foreground">
          {filtered.length} items
          {selectedPath && ` in ${selectedPath}`}
          {search && ` matching "${search}"`}
        </p>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(item => (
            <ContentCard key={item.id} item={item} />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No content found.{' '}
            <button className="underline" onClick={() => { setSearch(''); setActiveType('all'); setSelectedPath(null) }}>
              Clear filters
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
