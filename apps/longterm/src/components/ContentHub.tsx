"use client"

import { useState, useMemo, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { pages, entities, type Page } from "@data"
import type { Entity } from "@data/schema"
import { insights, type Insight } from "@data/insights-data"
import ContentTree from "./ContentTree"
import { cn } from "@/lib/utils"

// Shared tables data with dimensions
const TABLES = [
  { id: 'safety-approaches', title: 'Safety Approaches', description: 'Safety research effectiveness vs capability uplift.', href: '/knowledge-base/responses/safety-approaches/table', path: '/knowledge-base/responses/safety-approaches', rows: 42, cols: 9 },
  { id: 'safety-generalizability', title: 'Safety Generalizability', description: 'Safety approaches across AI architectures.', href: '/knowledge-base/responses/safety-generalizability/table', path: '/knowledge-base/responses/safety-generalizability', rows: 42, cols: 8 },
  { id: 'safety-matrix', title: 'Safety × Architecture Matrix', description: 'Safety approaches vs architecture scenarios.', href: '/knowledge-base/responses/safety-generalizability/matrix', path: '/knowledge-base/responses/safety-generalizability', rows: 42, cols: 12 },
  { id: 'architecture-scenarios', title: 'Architecture Scenarios', description: 'Deployment patterns and base architectures.', href: '/knowledge-base/architecture-scenarios/table', path: '/knowledge-base/architecture-scenarios', rows: 12, cols: 7 },
  { id: 'deployment-architectures', title: 'Deployment Architectures', description: 'How AI systems are deployed.', href: '/knowledge-base/deployment-architectures/table', path: '/knowledge-base/deployment-architectures', rows: 8, cols: 6 },
  { id: 'accident-risks', title: 'Accident Risks', description: 'Accident and misalignment risks.', href: '/knowledge-base/risks/accident/table', path: '/knowledge-base/risks/accident', rows: 16, cols: 7 },
  { id: 'eval-types', title: 'Evaluation Types', description: 'Evaluation methodologies comparison.', href: '/knowledge-base/models/eval-types/table', path: '/knowledge-base/models/eval-types', rows: 18, cols: 8 },
  { id: 'transition-model', title: 'AI Transition Model Parameters', description: 'All AI Transition Model parameters.', href: '/ai-transition-model/table', path: '/ai-transition-model', rows: 45, cols: 6 },
]

// Content types
type ContentType = 'all' | 'wiki' | 'models' | 'reports' | 'insights' | 'tables' | 'diagrams'

interface ContentItem {
  id: string
  title: string
  description: string
  href: string
  path: string
  type: ContentType
  meta: string
}

// Format word count for display
function formatWordCount(count: number): string {
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k words`
  return `${count} words`
}

// Check if a page is a model
function isModelPage(page: Page): boolean {
  return page.category === 'models' || page.path.includes('/models/')
}

// Check if a page is a research report
function isResearchReport(page: Page): boolean {
  return page.category === 'research-reports' || page.category === 'reports' || page.path.includes('/research-reports/')
}

// Build content list once at module level (data is static)
function buildContentList(): ContentItem[] {
  const items: ContentItem[] = []

  // Wiki pages (excluding models and research reports)
  pages
    .filter((p: Page) => !p.path.includes('/internal/') && !p.path.includes('/meta/') && p.title)
    .forEach((page: Page) => {
      let type: ContentType = 'wiki'
      if (isModelPage(page)) {
        type = 'models'
      } else if (isResearchReport(page)) {
        type = 'reports'
      }

      items.push({
        id: page.path,
        title: page.title,
        description: page.description || page.llmSummary || '',
        href: page.path,
        path: page.path,
        type,
        meta: page.wordCount ? formatWordCount(page.wordCount) : '',
      })
    })

  // Insights - use full text, no truncation
  insights.forEach((insight: Insight) => {
    items.push({
      id: `insight-${insight.id}`,
      title: insight.insight, // Full text, no truncation
      description: insight.insight,
      href: '', // Not a link
      path: insight.source || '/insight-hunting',
      type: 'insights',
      meta: `${insight.type} · ${insight.composite?.toFixed(1) || '?'}`,
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
      meta: `${table.rows} × ${table.cols}`,
    })
  })

  // Diagrams - filter entities that have causeEffectGraph with nodes
  entities
    .filter((e: Entity) => {
      const graph = (e as Entity & { causeEffectGraph?: { nodes?: unknown[] } }).causeEffectGraph
      return graph?.nodes && graph.nodes.length > 0
    })
    .forEach((e: Entity) => {
      const graph = (e as Entity & { causeEffectGraph?: { nodes?: unknown[]; title?: string; description?: string } }).causeEffectGraph!
      const nodeCount = graph.nodes?.length || 0
      items.push({
        id: `diagram-${e.id}`,
        title: graph.title || e.title,
        description: graph.description || `Cause-effect diagram for ${e.title}`,
        href: `/diagrams/${e.id}`,
        path: `/diagrams`,
        type: 'diagrams',
        meta: `${nodeCount} nodes`,
      })
    })

  return items
}

const ALL_CONTENT = buildContentList()

// Pre-computed counts (static data)
const COUNTS: Record<ContentType, number> = {
  all: ALL_CONTENT.length,
  wiki: ALL_CONTENT.filter(i => i.type === 'wiki').length,
  models: ALL_CONTENT.filter(i => i.type === 'models').length,
  reports: ALL_CONTENT.filter(i => i.type === 'reports').length,
  insights: ALL_CONTENT.filter(i => i.type === 'insights').length,
  tables: ALL_CONTENT.filter(i => i.type === 'tables').length,
  diagrams: ALL_CONTENT.filter(i => i.type === 'diagrams').length,
}

const TYPE_BUTTONS: { type: ContentType; label: string; color?: string }[] = [
  { type: 'all', label: 'All' },
  { type: 'wiki', label: 'Wiki', color: 'bg-blue-500 hover:bg-blue-600' },
  { type: 'models', label: 'Models', color: 'bg-violet-500 hover:bg-violet-600' },
  { type: 'reports', label: 'Reports', color: 'bg-indigo-500 hover:bg-indigo-600' },
  { type: 'insights', label: 'Insights', color: 'bg-amber-500 hover:bg-amber-600' },
  { type: 'tables', label: 'Tables', color: 'bg-emerald-500 hover:bg-emerald-600' },
  { type: 'diagrams', label: 'Diagrams', color: 'bg-orange-500 hover:bg-orange-600' },
]

const TYPE_CONFIG: Record<ContentType, { label: string; color: string }> = {
  all: { label: 'All', color: 'bg-gray-500' },
  wiki: { label: 'Wiki', color: 'bg-blue-500' },
  models: { label: 'Model', color: 'bg-violet-500' },
  reports: { label: 'Report', color: 'bg-indigo-500' },
  insights: { label: 'Insight', color: 'bg-amber-500' },
  tables: { label: 'Table', color: 'bg-emerald-500' },
  diagrams: { label: 'Diagram', color: 'bg-orange-500' },
}

function ContentCard({ item }: { item: ContentItem }) {
  const { label, color } = TYPE_CONFIG[item.type]
  const isInsight = item.type === 'insights'

  const cardContent = (
    <div className={cn(
      "px-3 py-2 rounded-md border border-border bg-card transition-all",
      !isInsight && "hover:bg-accent/30 hover:border-primary/50"
    )}>
      {isInsight ? (
        // Insight card - full text with source link at bottom
        <>
          <div className="flex items-start justify-between gap-2 mb-1">
            <span className="text-sm leading-snug">
              {item.title}
            </span>
            <Badge variant="secondary" className={`shrink-0 text-[10px] text-white ${color}`}>
              {label}
            </Badge>
          </div>
          <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-border/50">
            <a
              href={item.path}
              className="text-[10px] text-muted-foreground hover:text-primary truncate"
            >
              {item.path}
            </a>
            {item.meta && (
              <span className="text-[10px] text-muted-foreground shrink-0 tabular-nums">
                {item.meta}
              </span>
            )}
          </div>
        </>
      ) : (
        // Regular card - clickable link
        <>
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-sm font-medium group-hover:text-primary transition-colors truncate">
              {item.title}
            </span>
            <Badge variant="secondary" className={`shrink-0 text-[10px] text-white ${color}`}>
              {label}
            </Badge>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground truncate">
              {item.description || ''}
            </span>
            {item.meta && (
              <span className="text-[10px] text-muted-foreground shrink-0 tabular-nums">
                {item.meta}
              </span>
            )}
          </div>
        </>
      )}
    </div>
  )

  if (isInsight) {
    return <div className="block">{cardContent}</div>
  }

  return (
    <a href={item.href} className="no-underline group block">
      {cardContent}
    </a>
  )
}

export default function ContentHub() {
  // Use URL params for persistence across navigation
  const [search, setSearch] = useState('')
  const [activeType, setActiveType] = useState<ContentType>('all')
  const [selectedPath, setSelectedPath] = useState<string | null>(null)

  // Initialize from URL params on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const q = params.get('q')
    const type = params.get('type') as ContentType | null
    const path = params.get('path')

    if (q) setSearch(q)
    if (type && COUNTS[type] !== undefined) setActiveType(type)
    if (path) setSelectedPath(path)
  }, [])

  // Update URL when state changes
  useEffect(() => {
    const params = new URLSearchParams()
    if (search) params.set('q', search)
    if (activeType !== 'all') params.set('type', activeType)
    if (selectedPath) params.set('path', selectedPath)

    const newUrl = params.toString()
      ? `${window.location.pathname}?${params.toString()}`
      : window.location.pathname

    window.history.replaceState({}, '', newUrl)
  }, [search, activeType, selectedPath])

  // Items filtered by type (for tree)
  const typeFilteredItems = useMemo(() => {
    if (activeType === 'all') return ALL_CONTENT
    return ALL_CONTENT.filter(item => item.type === activeType)
  }, [activeType])

  // Items for tree component (all types including insights)
  const treeItems = useMemo(() => {
    return typeFilteredItems
      .map(item => ({
        id: item.id,
        title: item.title,
        path: item.path,
        type: item.type as 'wiki' | 'tables' | 'diagrams' | 'insights' | 'models' | 'reports',
      }))
  }, [typeFilteredItems])

  // Final filtered content (type + path + search)
  const filtered = useMemo(() => {
    return typeFilteredItems.filter(item => {
      // Path filter (applies to all types including insights)
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
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
