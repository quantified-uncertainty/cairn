"use client"

import { useState, useMemo } from "react"
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  type ColumnFiltersState,
  type SortingState,
  type PaginationState,
} from "@tanstack/react-table"

import { pages, entities, getEntityHref } from "@/data"
import { columns, filterPresets, type PageRow, type Attachment } from "./pages-columns"
import { DataTable } from "@/components/ui/data-table"
import { DataTableSearch } from "@/components/ui/data-table-search"
import { DataTablePagination } from "@/components/ui/data-table-pagination"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { contentCategoryColors } from "./shared/style-config"

interface PageIndexProps {
  showSearch?: boolean
  filterCategory?: string
  maxItems?: number
  title?: string
}

export function PageIndex({ showSearch = true, filterCategory, maxItems, title }: PageIndexProps) {
  // TanStack Table state
  const [globalFilter, setGlobalFilter] = useState("")
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [sorting, setSorting] = useState<SortingState>([
    { id: "importance", desc: true },
  ])
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25,
  })
  const [activePreset, setActivePreset] = useState<string>("all")

  // Transform pages data to PageRow format
  const allData = useMemo(() => {
    const today = new Date()
    const entityMap = new Map(entities.map(e => [e.id, e]))
    const researchReportPages = pages.filter(p => p.path.startsWith("/knowledge-base/research-reports/"))
    const reportsByTopicId = new Map(researchReportPages.map(r => [r.id, r]))

    return pages.map(p => {
      const structuralScore = p.metrics?.structuralScore ?? null
      const gapScore = (p.importance !== null && p.quality !== null)
        ? p.importance - p.quality
        : null

      let ageDays: number | null = null
      if (p.lastUpdated) {
        const updated = new Date(p.lastUpdated)
        ageDays = Math.floor((today.getTime() - updated.getTime()) / (1000 * 60 * 60 * 24))
      }

      const attachments: Attachment[] = []
      const entity = entityMap.get(p.id)
      if (entity?.relatedEntries) {
        for (const rel of entity.relatedEntries) {
          if (rel.type === 'model') {
            const relatedEntity = entityMap.get(rel.id)
            attachments.push({
              id: rel.id,
              title: relatedEntity?.title || rel.id,
              type: 'model',
              href: getEntityHref(rel.id, rel.type),
            })
          }
        }
      }
      const report = reportsByTopicId.get(p.id)
      if (report && report.path !== p.path) {
        attachments.push({
          id: report.id,
          title: 'Research Report',
          type: 'research-report',
          href: report.path,
        })
      }

      return {
        id: p.id,
        path: p.path,
        title: p.title,
        category: p.category,
        quality: p.quality,
        importance: p.importance,
        lastUpdated: p.lastUpdated,
        wordCount: p.wordCount ?? 0,
        backlinkCount: p.backlinkCount ?? 0,
        gapScore,
        ageDays,
        structuralScore,
        convertedLinkCount: p.convertedLinkCount ?? 0,
        unconvertedLinkCount: p.unconvertedLinkCount ?? 0,
        redundancyScore: p.redundancy?.maxSimilarity ?? 0,
        similarPages: p.redundancy?.similarPages ?? [],
        attachments,
      } as PageRow
    })
  }, [])

  // Apply external filters (category prop, preset, maxItems)
  const data = useMemo(() => {
    let result = allData

    if (filterCategory) {
      result = result.filter(p => p.category === filterCategory)
    }

    const preset = filterPresets.find(f => f.id === activePreset)
    if (preset && preset.id !== "all") {
      result = result.filter(preset.filter)
    }

    if (maxItems) {
      result = result.slice(0, maxItems)
    }

    return result
  }, [allData, filterCategory, activePreset, maxItems])

  // Get unique categories for filter
  const categories = useMemo(() => {
    const catSet = new Set(allData.map(p => p.category))
    return Array.from(catSet).sort()
  }, [allData])

  // Category stats
  const categoryStats = useMemo(() => {
    const stats: Record<string, number> = {}
    for (const p of allData) {
      stats[p.category] = (stats[p.category] || 0) + 1
    }
    return stats
  }, [allData])

  // Create table instance
  const table = useReactTable({
    data,
    columns,
    state: {
      globalFilter,
      columnFilters,
      sorting,
      pagination,
    },
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: (row, _columnId, filterValue) => {
      const query = filterValue.toLowerCase()
      const page = row.original
      return (
        page.title.toLowerCase().includes(query) ||
        page.category.toLowerCase().includes(query) ||
        page.path.toLowerCase().includes(query)
      )
    },
  })

  const filteredRowCount = table.getFilteredRowModel().rows.length

  // Helper to get current filter value
  const getFilterValue = (columnId: string): string => {
    const filter = columnFilters.find(f => f.id === columnId)
    return (filter?.value as string) ?? "all"
  }

  // Helper to set filter value
  const setFilterValue = (columnId: string, value: string) => {
    table.getColumn(columnId)?.setFilterValue(value === "all" ? undefined : value)
  }

  // Stats
  const stats = useMemo(() => {
    const withQuality = allData.filter(p => p.quality !== null).length
    const withImportance = allData.filter(p => p.importance !== null).length
    const avgImportance = withImportance > 0
      ? (allData.filter(p => p.importance !== null).reduce((sum, p) => sum + (p.importance || 0), 0) / withImportance).toFixed(0)
      : "—"
    return { total: allData.length, withQuality, withImportance, avgImportance }
  }, [allData])

  return (
    <div className="space-y-4">
      {title && <h2 className="text-xl font-bold">{title}</h2>}

      {/* Controls bar */}
      <div className="flex flex-col gap-3 p-4 bg-muted/30 rounded-lg border">
        {/* Preset filter buttons */}
        <div className="flex flex-wrap gap-2">
          {filterPresets.map((preset) => (
            <Button
              key={preset.id}
              variant={activePreset === preset.id ? "default" : "secondary"}
              size="sm"
              onClick={() => setActivePreset(preset.id)}
              className={cn(
                activePreset !== preset.id && "text-muted-foreground"
              )}
            >
              {preset.label}
            </Button>
          ))}
        </div>

        {/* Search and filters row */}
        <div className="flex flex-col lg:flex-row gap-3">
          {showSearch && (
            <DataTableSearch
              table={table}
              placeholder="Search pages..."
              className="lg:max-w-sm"
            />
          )}

          <div className="flex flex-wrap items-center gap-2">
            {/* Category filter */}
            <Select
              value={getFilterValue("category")}
              onValueChange={(v) => setFilterValue("category", v)}
            >
              <SelectTrigger className="h-9">
                <SelectValue>All Categories</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => {
                  const colorClass = contentCategoryColors[cat as keyof typeof contentCategoryColors]
                  return (
                    <SelectItem key={cat} value={cat}>
                      <span className={cn("inline-block w-2 h-2 rounded-full mr-2", colorClass?.split(" ")[0])} />
                      {cat.charAt(0).toUpperCase() + cat.slice(1)} ({categoryStats[cat]})
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <span className="font-medium">
            {filteredRowCount === data.length ? (
              <>{data.length} pages</>
            ) : (
              <>{filteredRowCount} of {data.length} pages</>
            )}
          </span>
          <span className="text-muted-foreground">|</span>
          <span className="text-muted-foreground">
            {stats.withImportance} with importance (avg {stats.avgImportance})
          </span>
          <span className="text-muted-foreground">|</span>
          <span className="text-muted-foreground">
            {stats.withQuality} with quality
          </span>
        </div>
      </div>

      {/* Table */}
      <DataTable table={table} />

      {/* Pagination */}
      <DataTablePagination table={table} />
    </div>
  )
}

export default PageIndex
