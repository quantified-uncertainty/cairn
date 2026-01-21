"use client"

import * as React from "react"
import type { Table } from "@tanstack/react-table"
import { Search } from "lucide-react"

import { cn } from "@/lib/utils"

interface DataTableSearchProps<TData> {
  table: Table<TData>
  placeholder?: string
  className?: string
}

export function DataTableSearch<TData>({
  table,
  placeholder = "Search...",
  className,
}: DataTableSearchProps<TData>) {
  const globalFilter = table.getState().globalFilter ?? ""

  return (
    <div
      className={cn(
        "flex items-center gap-2 h-9 w-full rounded-md border border-input bg-background px-3 shadow-sm focus-within:ring-1 focus-within:ring-ring",
        className
      )}
    >
      <Search className="h-4 w-4 text-muted-foreground shrink-0" />
      <input
        type="text"
        placeholder={placeholder}
        value={globalFilter}
        onChange={(e) => table.setGlobalFilter(e.target.value)}
        className="flex-1 bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none"
      />
    </div>
  )
}
