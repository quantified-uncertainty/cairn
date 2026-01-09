"use client"

import * as React from "react"
import { Mermaid } from "./Mermaid"
import {
  getRootFactors,
  getScenarios,
  getOutcomes,
  getEdgesFrom,
  getEdgesTo,
  type RootFactor
} from "@/data/parameter-graph-data"

interface FactorRelationshipDiagramProps {
  /** The factor/scenario/outcome ID to center the diagram on */
  nodeId: string
  /** Direction: 'outgoing' shows what this node affects, 'incoming' shows what affects it, 'both' shows all */
  direction?: 'outgoing' | 'incoming' | 'both'
  /** Include the node's sub-items in the diagram */
  showSubItems?: boolean
  /** Diagram orientation */
  orientation?: 'TD' | 'LR'
}

// Get node by ID
function getNodeById(nodeId: string): RootFactor | undefined {
  const allNodes = [...getRootFactors(), ...getScenarios(), ...getOutcomes()]
  return allNodes.find(n => n.id === nodeId)
}

// Get node type for styling
function getNodeType(nodeId: string): 'factor' | 'scenario' | 'outcome' | 'unknown' {
  const factors = getRootFactors()
  const scenarios = getScenarios()
  const outcomes = getOutcomes()

  if (factors.find(n => n.id === nodeId)) return 'factor'
  if (scenarios.find(n => n.id === nodeId)) return 'scenario'
  if (outcomes.find(n => n.id === nodeId)) return 'outcome'
  return 'unknown'
}

// Generate node ID safe for Mermaid
function mermaidId(id: string): string {
  return id.replace(/-/g, '_')
}

// Generate Mermaid style based on node type
function getNodeStyle(nodeType: 'factor' | 'scenario' | 'outcome' | 'unknown'): string {
  switch (nodeType) {
    case 'factor':
      return 'fill:#e3f2fd'
    case 'scenario':
      return 'fill:#fff3e0'
    case 'outcome':
      return 'fill:#ffebee'
    default:
      return 'fill:#f5f5f5'
  }
}

export function FactorRelationshipDiagram({
  nodeId,
  direction = 'both',
  showSubItems = false,
  orientation = 'TD'
}: FactorRelationshipDiagramProps) {
  const node = getNodeById(nodeId)

  if (!node) {
    return <span className="text-slate-400">Node not found: {nodeId}</span>
  }

  const allNodes = [...getRootFactors(), ...getScenarios(), ...getOutcomes()]
  const nodeMap = new Map(allNodes.map(n => [n.id, n]))

  // Get edges
  const outgoingEdges = direction !== 'incoming' ? getEdgesFrom(nodeId) : []
  const incomingEdges = direction !== 'outgoing' ? getEdgesTo(nodeId) : []

  // Collect all node IDs we need to show
  const nodeIds = new Set<string>([nodeId])
  outgoingEdges.forEach(e => nodeIds.add(e.target))
  incomingEdges.forEach(e => nodeIds.add(e.source))

  // Build Mermaid syntax
  const lines: string[] = [`flowchart ${orientation}`]

  // Define nodes
  nodeIds.forEach(id => {
    const n = nodeMap.get(id)
    if (n) {
      const mid = mermaidId(id)
      lines.push(`    ${mid}["${n.label}"]`)
    }
  })

  // Add sub-items if requested
  if (showSubItems && node.subItems && node.subItems.length > 0) {
    const mid = mermaidId(nodeId)
    lines.push(`    subgraph ${mid}_sub["${node.label} Components"]`)
    node.subItems.forEach((item, i) => {
      const subId = `${mid}_s${i}`
      lines.push(`        ${subId}["${item.label}"]`)
    })
    lines.push(`    end`)
    // Connect sub-items to main node
    node.subItems.forEach((_, i) => {
      const subId = `${mid}_s${i}`
      lines.push(`    ${subId} --> ${mid}`)
    })
  }

  // Add edges
  outgoingEdges.forEach(edge => {
    const sourceId = mermaidId(edge.source)
    const targetId = mermaidId(edge.target)
    const label = edge.effect === 'increases' ? 'increases' :
                  edge.effect === 'decreases' ? 'decreases' : ''
    if (label) {
      lines.push(`    ${sourceId} -->|${label}| ${targetId}`)
    } else {
      lines.push(`    ${sourceId} --> ${targetId}`)
    }
  })

  incomingEdges.forEach(edge => {
    const sourceId = mermaidId(edge.source)
    const targetId = mermaidId(edge.target)
    const label = edge.effect === 'increases' ? 'increases' :
                  edge.effect === 'decreases' ? 'decreases' : ''
    // Only add if not already added by outgoing
    if (direction === 'incoming' || edge.source !== nodeId) {
      if (label) {
        lines.push(`    ${sourceId} -->|${label}| ${targetId}`)
      } else {
        lines.push(`    ${sourceId} --> ${targetId}`)
      }
    }
  })

  // Add styles
  nodeIds.forEach(id => {
    const nodeType = getNodeType(id)
    const mid = mermaidId(id)
    const style = getNodeStyle(nodeType)
    lines.push(`    style ${mid} ${style}`)
  })

  const chart = lines.join('\n')

  return <Mermaid chart={chart} />
}

interface FullModelDiagramProps {
  /** Orientation */
  orientation?: 'TD' | 'LR'
  /** Show all edges or simplified */
  simplified?: boolean
}

export function FullModelDiagram({
  orientation = 'TD',
  simplified = false
}: FullModelDiagramProps) {
  const factors = getRootFactors()
  const scenarios = getScenarios()
  const outcomes = getOutcomes()

  const lines: string[] = [`flowchart ${orientation}`]

  // Subgraph for factors
  lines.push(`    subgraph Factors["Root Factors"]`)
  factors.forEach(f => {
    const mid = mermaidId(f.id)
    lines.push(`        ${mid}["${f.label}"]`)
  })
  lines.push(`    end`)

  // Subgraph for scenarios
  lines.push(`    subgraph Scenarios["Ultimate Scenarios"]`)
  scenarios.forEach(s => {
    const mid = mermaidId(s.id)
    lines.push(`        ${mid}["${s.label}"]`)
  })
  lines.push(`    end`)

  // Subgraph for outcomes
  lines.push(`    subgraph Outcomes["Ultimate Outcomes"]`)
  outcomes.forEach(o => {
    const mid = mermaidId(o.id)
    lines.push(`        ${mid}["${o.label}"]`)
  })
  lines.push(`    end`)

  // Add all edges from factors to scenarios
  factors.forEach(f => {
    const edges = getEdgesFrom(f.id)
    edges.forEach(edge => {
      const sourceId = mermaidId(edge.source)
      const targetId = mermaidId(edge.target)
      const label = edge.effect === 'increases' ? 'increases' :
                    edge.effect === 'decreases' ? 'decreases' : ''
      if (label && !simplified) {
        lines.push(`    ${sourceId} -->|${label}| ${targetId}`)
      } else {
        lines.push(`    ${sourceId} --> ${targetId}`)
      }
    })
  })

  // Add edges from scenarios to outcomes
  scenarios.forEach(s => {
    const edges = getEdgesFrom(s.id)
    edges.forEach(edge => {
      const sourceId = mermaidId(edge.source)
      const targetId = mermaidId(edge.target)
      const label = edge.effect === 'increases' ? 'increases' :
                    edge.effect === 'decreases' ? 'decreases' : ''
      if (label && !simplified) {
        lines.push(`    ${sourceId} -->|${label}| ${targetId}`)
      } else {
        lines.push(`    ${sourceId} --> ${targetId}`)
      }
    })
  })

  // Styles
  scenarios.forEach(s => {
    const mid = mermaidId(s.id)
    lines.push(`    style ${mid} fill:#ffe66d`)
  })
  outcomes.forEach(o => {
    const mid = mermaidId(o.id)
    lines.push(`    style ${mid} fill:#ff6b6b`)
  })

  const chart = lines.join('\n')

  return <Mermaid chart={chart} />
}

export default FactorRelationshipDiagram
