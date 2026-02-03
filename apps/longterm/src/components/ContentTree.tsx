"use client"

import { useState, useMemo } from "react"
import { ChevronRight, ChevronDown, FileText, FolderOpen, Folder } from "lucide-react"
import { cn } from "@/lib/utils"

interface TreeNode {
  name: string
  path: string
  count: number
  children: Map<string, TreeNode>
  items: ContentItem[]
}

interface ContentItem {
  id: string
  title: string
  path: string
  type: 'wiki' | 'tables' | 'diagrams' | 'insights' | 'models' | 'reports'
}

interface ContentTreeProps {
  items: ContentItem[]
  selectedPath: string | null
  onSelectPath: (path: string | null) => void
}

// Build tree from flat list of items
function buildTree(items: ContentItem[]): TreeNode {
  const root: TreeNode = {
    name: "All Content",
    path: "",
    count: items.length,
    children: new Map(),
    items: [],
  }

  for (const item of items) {
    // Parse path into segments, filtering out empty strings
    const segments = item.path.split('/').filter(Boolean)

    let current = root
    let currentPath = ""

    for (let i = 0; i < segments.length - 1; i++) {
      const segment = segments[i]
      currentPath += "/" + segment

      if (!current.children.has(segment)) {
        current.children.set(segment, {
          name: formatSegment(segment),
          path: currentPath,
          count: 0,
          children: new Map(),
          items: [],
        })
      }

      current = current.children.get(segment)!
      current.count++
    }

    // Add item to its parent folder
    current.items.push(item)
  }

  return root
}

// Format path segment to human-readable name
function formatSegment(segment: string): string {
  return segment
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

// Tree node component
function TreeNodeComponent({
  node,
  depth,
  selectedPath,
  onSelectPath,
  defaultExpanded = false,
}: {
  node: TreeNode
  depth: number
  selectedPath: string | null
  onSelectPath: (path: string | null) => void
  defaultExpanded?: boolean
}) {
  const [expanded, setExpanded] = useState(defaultExpanded || depth < 1)
  const hasChildren = node.children.size > 0
  const isSelected = selectedPath === node.path

  // Sort children by count (descending), then by name
  const sortedChildren = useMemo(() => {
    return [...node.children.values()].sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count
      return a.name.localeCompare(b.name)
    })
  }, [node.children])

  const handleToggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation()
    setExpanded(!expanded)
  }

  const handleSelect = () => {
    onSelectPath(isSelected ? null : node.path)
  }

  return (
    <div>
      <div
        className={cn(
          "w-full flex items-center gap-1.5 px-2 py-1.5 text-left text-[13px] rounded-md transition-all duration-150 cursor-pointer",
          "hover:bg-slate-100 dark:hover:bg-slate-700",
          isSelected && "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium",
          !isSelected && "text-slate-700 dark:text-slate-300",
          depth === 0 && !isSelected && "font-medium"
        )}
        style={{ paddingLeft: `${depth * 14 + 8}px` }}
        onClick={handleSelect}
      >
        {hasChildren ? (
          <button
            onClick={handleToggleExpand}
            className="p-0.5 -m-0.5 hover:bg-slate-200 dark:hover:bg-slate-600 rounded transition-colors"
            aria-label={expanded ? "Collapse" : "Expand"}
          >
            {expanded ? (
              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-500 dark:text-slate-400" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-500 dark:text-slate-400" />
            )}
          </button>
        ) : (
          <span className="w-3.5" />
        )}

        {hasChildren ? (
          expanded ? (
            <FolderOpen className={cn("h-3.5 w-3.5 shrink-0", isSelected ? "text-blue-500" : "text-slate-500 dark:text-slate-400")} />
          ) : (
            <Folder className={cn("h-3.5 w-3.5 shrink-0", isSelected ? "text-blue-500" : "text-slate-500 dark:text-slate-400")} />
          )
        ) : (
          <FileText className="h-3.5 w-3.5 shrink-0 text-slate-500 dark:text-slate-400" />
        )}

        <span className="truncate flex-1">{node.name}</span>
        <span className={cn(
          "text-[11px] tabular-nums",
          isSelected ? "text-blue-600 dark:text-blue-400" : "text-slate-400 dark:text-slate-500"
        )}>
          {node.count}
        </span>
      </div>

      {expanded && hasChildren && (
        <div>
          {sortedChildren.map(child => (
            <TreeNodeComponent
              key={child.path}
              node={child}
              depth={depth + 1}
              selectedPath={selectedPath}
              onSelectPath={onSelectPath}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function ContentTree({ items, selectedPath, onSelectPath }: ContentTreeProps) {
  const tree = useMemo(() => buildTree(items), [items])

  // Get top-level children (skip root)
  const topLevel = useMemo(() => {
    return [...tree.children.values()].sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count
      return a.name.localeCompare(b.name)
    })
  }, [tree])

  return (
    <div className="text-[13px]">
      {/* All content button */}
      <button
        onClick={() => onSelectPath(null)}
        className={cn(
          "w-full flex items-center gap-2 px-2 py-2 text-left rounded-md transition-all duration-150 mb-2",
          "hover:bg-slate-100 dark:hover:bg-slate-700",
          selectedPath === null
            ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-semibold"
            : "text-slate-700 dark:text-slate-300 font-medium"
        )}
      >
        <FolderOpen className={cn("h-4 w-4 shrink-0", selectedPath === null ? "text-blue-500" : "text-slate-500 dark:text-slate-400")} />
        <span className="flex-1">All Content</span>
        <span className={cn(
          "text-[11px] tabular-nums",
          selectedPath === null ? "text-blue-600 dark:text-blue-400" : "text-slate-400 dark:text-slate-500"
        )}>
          {items.length}
        </span>
      </button>

      {/* Tree */}
      <div className="border-l border-slate-200 dark:border-slate-700 ml-2 pl-0.5">
        {topLevel.map(node => (
          <TreeNodeComponent
            key={node.path}
            node={node}
            depth={0}
            selectedPath={selectedPath}
            onSelectPath={onSelectPath}
            defaultExpanded={topLevel.length <= 3}
          />
        ))}
      </div>
    </div>
  )
}
