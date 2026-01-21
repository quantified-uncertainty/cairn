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
  type VisibilityState,
} from "@tanstack/react-table"

import { resources } from "@/data"
import { columns, getContentStatus } from "./resources-columns"
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
import { getResourceTypeLabel, getResourceTypeIcon } from "./shared/style-config"

interface ResourcesIndexProps {
  showSearch?: boolean
  showFilters?: boolean
  defaultType?: string
  showCredibility?: boolean
  showTags?: boolean
  showContent?: boolean
}

export function ResourcesIndex({
  showSearch = true,
  showFilters = true,
  defaultType,
  showCredibility = true,
  showTags = true,
  showContent = true,
}: ResourcesIndexProps) {
  // TanStack Table state
  const [globalFilter, setGlobalFilter] = useState("")
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(
    defaultType ? [{ id: "type", value: defaultType }] : []
  )
  const [sorting, setSorting] = useState<SortingState>([
    { id: "title", desc: false },
  ])
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25,
  })
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    credibility: showCredibility,
    content: showContent,
    tags: showTags,
  })

  // Get unique types for filter dropdown
  const types = useMemo(() => {
    const typeSet = new Set(resources.map((r) => r.type))
    return Array.from(typeSet).sort()
  }, [])

  // Type stats for filter labels
  const typeStats = useMemo(() => {
    const stats: Record<string, number> = {}
    for (const r of resources) {
      stats[r.type] = (stats[r.type] || 0) + 1
    }
    return stats
  }, [])

  // Content stats for filter labels
  const contentStats = useMemo(() => {
    const stats = { full: 0, partial: 0, metadata: 0, none: 0 }
    for (const r of resources) {
      stats[getContentStatus(r).level]++
    }
    return stats
  }, [])

  // Create table instance
  const table = useReactTable({
    data: resources,
    columns,
    state: {
      globalFilter,
      columnFilters,
      sorting,
      pagination,
      columnVisibility,
    },
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: (row, columnId, filterValue) => {
      const query = filterValue.toLowerCase()
      const resource = row.original
      return (
        resource.title.toLowerCase().includes(query) ||
        resource.authors?.some((a: string) => a.toLowerCase().includes(query)) ||
        resource.summary?.toLowerCase().includes(query) ||
        resource.tags?.some((t: string) => t.toLowerCase().includes(query)) ||
        false
      )
    },
  })

  // Get filtered row count for stats
  const filteredRowCount = table.getFilteredRowModel().rows.length

  // Helper to get current filter value
  const getFilterValue = (columnId: string): string => {
    const filter = columnFilters.find((f) => f.id === columnId)
    return (filter?.value as string) ?? "all"
  }

  // Helper to set filter value
  const setFilterValue = (columnId: string, value: string) => {
    table.getColumn(columnId)?.setFilterValue(value === "all" ? undefined : value)
  }

  return (
    <div className="space-y-4">
      {/* Controls bar */}
      <div className="flex flex-col gap-3 p-4 bg-muted/30 rounded-lg border">
        {/* Search and filters row */}
        <div className="flex flex-col lg:flex-row gap-3">
          {showSearch && (
            <DataTableSearch
              table={table}
              placeholder="Search resources..."
              className="lg:max-w-sm"
            />
          )}

          {showFilters && (
            <div className="flex flex-wrap items-center gap-2">
              {/* Type filter */}
              <Select
                value={getFilterValue("type")}
                onValueChange={(v) => setFilterValue("type", v)}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {types.map((type) => (
                    <SelectItem key={type} value={type}>
                      {getResourceTypeIcon(type)} {getResourceTypeLabel(type)} ({typeStats[type]})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Credibility filter */}
              {showCredibility && (
                <Select
                  value={getFilterValue("credibility")}
                  onValueChange={(v) => setFilterValue("credibility", v)}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="All Credibility" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Credibility</SelectItem>
                    <SelectItem value="5">Gold (5)</SelectItem>
                    <SelectItem value="4">High (4)</SelectItem>
                    <SelectItem value="3">Good (3)</SelectItem>
                    <SelectItem value="2">Mixed (2)</SelectItem>
                    <SelectItem value="1">Low (1)</SelectItem>
                  </SelectContent>
                </Select>
              )}

              {/* Content filter */}
              {showContent && (
                <Select
                  value={getFilterValue("content")}
                  onValueChange={(v) => setFilterValue("content", v)}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="All Content" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Content</SelectItem>
                    <SelectItem value="full">Full ({contentStats.full})</SelectItem>
                    <SelectItem value="partial">Summary ({contentStats.partial})</SelectItem>
                    <SelectItem value="metadata">Metadata ({contentStats.metadata})</SelectItem>
                    <SelectItem value="none">None ({contentStats.none})</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          )}
        </div>

        {/* Stats row */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <span className="font-medium">
            {filteredRowCount === resources.length ? (
              <>{resources.length} resources</>
            ) : (
              <>{filteredRowCount} of {resources.length} resources</>
            )}
          </span>
          <span className="text-muted-foreground">|</span>
          <span className="flex flex-wrap gap-x-3 gap-y-1 text-muted-foreground">
            {Object.entries(typeStats)
              .sort((a, b) => b[1] - a[1])
              .map(([type, count]) => (
                <span key={type} className="whitespace-nowrap">
                  {getResourceTypeIcon(type)} {count}
                </span>
              ))}
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

export default ResourcesIndex
