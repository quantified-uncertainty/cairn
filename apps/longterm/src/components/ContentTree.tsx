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
  type: 'wiki' | 'tables' | 'diagrams'
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
          "w-full flex items-center gap-1 px-2 py-1 text-left text-sm rounded hover:bg-accent/50 transition-colors cursor-pointer",
          isSelected && "bg-accent text-accent-foreground font-medium",
          depth === 0 && "font-medium"
        )}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        onClick={handleSelect}
      >
        {hasChildren ? (
          <button
            onClick={handleToggleExpand}
            className="p-0.5 -m-0.5 hover:bg-accent rounded transition-colors"
            aria-label={expanded ? "Collapse" : "Expand"}
          >
            {expanded ? (
              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            )}
          </button>
        ) : (
          <span className="w-3.5" />
        )}

        {hasChildren ? (
          expanded ? (
            <FolderOpen className="h-3.5 w-3.5 shrink-0 text-amber-500" />
          ) : (
            <Folder className="h-3.5 w-3.5 shrink-0 text-amber-500" />
          )
        ) : (
          <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        )}

        <span className="truncate flex-1">{node.name}</span>
        <span className="text-xs text-muted-foreground tabular-nums">
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
    <div className="text-sm">
      {/* All content button */}
      <button
        onClick={() => onSelectPath(null)}
        className={cn(
          "w-full flex items-center gap-1 px-2 py-1.5 text-left rounded hover:bg-accent/50 transition-colors mb-1",
          selectedPath === null && "bg-accent text-accent-foreground font-medium"
        )}
      >
        <FolderOpen className="h-4 w-4 shrink-0 text-amber-500" />
        <span className="flex-1 font-medium">All Content</span>
        <span className="text-xs text-muted-foreground tabular-nums">
          {items.length}
        </span>
      </button>

      {/* Tree */}
      <div className="border-l border-border ml-2 pl-1">
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
