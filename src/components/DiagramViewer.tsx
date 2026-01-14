/**
 * DiagramViewer - Viewer for causeEffectGraph diagrams
 *
 * Usage: /diagrams/tmc-compute
 * Now designed to be embedded within Starlight pages
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getEntityById, getEntityHref, entities, pathRegistry } from '../data';
import { getNodeHrefFromMaster } from '../data/master-graph-data';
import CauseEffectGraph from './CauseEffectGraph';

/**
 * Hook to calculate available height from an element to the bottom of the viewport.
 * Updates on window resize and returns a stable height value.
 */
function useAvailableHeight(minHeight = 500, bottomPadding = 20) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(minHeight);

  const calculateHeight = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const availableHeight = window.innerHeight - rect.top - bottomPadding;
    setHeight(Math.max(minHeight, availableHeight));
  }, [minHeight, bottomPadding]);

  useEffect(() => {
    // Calculate on mount
    calculateHeight();

    // Recalculate on resize
    window.addEventListener('resize', calculateHeight);

    // Also recalculate after a short delay (for layout shifts)
    const timer = setTimeout(calculateHeight, 100);

    return () => {
      window.removeEventListener('resize', calculateHeight);
      clearTimeout(timer);
    };
  }, [calculateHeight]);

  return { containerRef, height };
}

// Get all entities that have causeEffectGraph diagrams
function getEntitiesWithDiagrams(): Array<{ id: string; title: string; graphTitle?: string; nodeCount: number }> {
  return entities
    .filter((e: any) => e.causeEffectGraph?.nodes?.length > 0)
    .map((e: any) => ({
      id: e.id,
      title: e.title,
      graphTitle: e.causeEffectGraph?.title,
      nodeCount: e.causeEffectGraph?.nodes?.length || 0,
    }));
}

interface DiagramViewerProps {
  entityId?: string;
}

// Entity type with causeEffectGraph
interface EntityWithGraph {
  id: string;
  title: string;
  causeEffectGraph?: {
    title?: string;
    description?: string;
    primaryNodeId?: string;
    nodes: Array<{
      id: string;
      label: string;
      description?: string;
      type: 'leaf' | 'cause' | 'intermediate' | 'effect';
      confidence?: number;
      details?: string;
      sources?: string[];
      relatedConcepts?: string[];
      entityRef?: string;
    }>;
    edges: Array<{
      id?: string;
      source: string;
      target: string;
      strength?: 'weak' | 'medium' | 'strong';
      confidence?: 'low' | 'medium' | 'high';
      effect?: 'increases' | 'decreases' | 'mixed';
      label?: string;
    }>;
  };
}

export default function DiagramViewer({ entityId: propEntityId }: DiagramViewerProps) {
  // Read entity ID from URL client-side (Astro props may not have query params in dev)
  const [entityId, setEntityId] = useState(propEntityId || '');

  useEffect(() => {
    // If no entity ID from props, read from URL path
    if (!propEntityId) {
      // Check for path-based URL (/diagrams/xxx)
      const pathMatch = window.location.pathname.match(/\/diagrams\/([^/]+)/);
      if (pathMatch) {
        setEntityId(pathMatch[1]);
      } else {
        // Fallback to query param for legacy URLs
        const params = new URLSearchParams(window.location.search);
        const urlEntityId = params.get('entity') || '';
        setEntityId(urlEntityId);
      }
    }
  }, [propEntityId]);

  // No entity ID provided - show index of all diagrams
  if (!entityId) {
    const availableDiagrams = getEntitiesWithDiagrams();

    return (
      <div className="diagram-list">
        {availableDiagrams.length === 0 ? (
          <p className="empty-state">No diagrams available yet.</p>
        ) : (
          <div className="diagram-grid">
            {availableDiagrams.map((diagram) => (
              <a
                key={diagram.id}
                href={`/diagrams/${diagram.id}`}
                className="diagram-card"
              >
                <div className="diagram-card-title">
                  {diagram.graphTitle || diagram.title}
                </div>
                <div className="diagram-card-meta">
                  <span className="diagram-card-id">{diagram.id}</span>
                  <span className="diagram-card-count">{diagram.nodeCount} nodes</span>
                </div>
              </a>
            ))}
          </div>
        )}

        <style>{`
          .diagram-list {
            margin-top: 0;
          }
          .empty-state {
            color: var(--sl-color-gray-3);
            font-style: italic;
          }
          .diagram-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 1rem;
          }
          .diagram-card {
            display: block;
            background: var(--sl-color-gray-6);
            border: 1px solid var(--sl-color-hairline);
            border-radius: 8px;
            padding: 1rem 1.25rem;
            text-decoration: none;
            color: inherit;
            transition: background 0.15s, border-color 0.15s;
          }
          .diagram-card:hover {
            background: var(--sl-color-gray-5);
            border-color: var(--sl-color-accent);
          }
          .diagram-card-title {
            font-size: 1rem;
            font-weight: 500;
            color: var(--sl-color-text);
            margin-bottom: 0.5rem;
          }
          .diagram-card-meta {
            display: flex;
            gap: 1rem;
            font-size: 0.8rem;
          }
          .diagram-card-id {
            color: var(--sl-color-text-accent);
            font-family: monospace;
          }
          .diagram-card-count {
            color: var(--sl-color-gray-3);
          }
        `}</style>
      </div>
    );
  }

  // Load entity
  const rawEntity = getEntityById(entityId);

  if (!rawEntity) {
    return (
      <div className="diagram-error">
        <h2>Entity Not Found</h2>
        <p>
          No entity found with ID: <code>{entityId}</code>
        </p>
        <a href="/diagrams/">← Back to Diagrams</a>

        <style>{`
          .diagram-error {
            background: var(--sl-color-red-low);
            border: 1px solid var(--sl-color-red);
            border-radius: 8px;
            padding: 1.5rem;
            max-width: 500px;
          }
          .diagram-error h2 {
            margin: 0 0 0.75rem 0;
            font-size: 1.25rem;
          }
          .diagram-error p {
            margin: 0 0 1rem 0;
            color: var(--sl-color-gray-2);
          }
          .diagram-error code {
            background: var(--sl-color-gray-6);
            padding: 0.2rem 0.5rem;
            border-radius: 4px;
            font-size: 0.9rem;
          }
          .diagram-error a {
            color: var(--sl-color-text-accent);
            text-decoration: none;
          }
        `}</style>
      </div>
    );
  }

  const entity = rawEntity as unknown as EntityWithGraph;

  if (!entity.causeEffectGraph || !entity.causeEffectGraph.nodes.length) {
    return (
      <div className="diagram-error">
        <h2>No Diagram Available</h2>
        <p>
          Entity <code>{entityId}</code> ({entity.title}) does not have a cause-effect diagram.
        </p>
        <a href="/diagrams/">← Back to Diagrams</a>

        <style>{`
          .diagram-error {
            background: var(--sl-color-orange-low);
            border: 1px solid var(--sl-color-orange);
            border-radius: 8px;
            padding: 1.5rem;
            max-width: 500px;
          }
          .diagram-error h2 {
            margin: 0 0 0.75rem 0;
            font-size: 1.25rem;
          }
          .diagram-error p {
            margin: 0 0 1rem 0;
            color: var(--sl-color-gray-2);
          }
          .diagram-error code {
            background: var(--sl-color-gray-6);
            padding: 0.2rem 0.5rem;
            border-radius: 4px;
            font-size: 0.9rem;
          }
          .diagram-error a {
            color: var(--sl-color-text-accent);
            text-decoration: none;
          }
        `}</style>
      </div>
    );
  }

  const graph = entity.causeEffectGraph;

  // Compute the back link from the entity's path or via getEntityHref
  const entityPath = (rawEntity as any).path || getEntityHref(entityId, (rawEntity as any).type) || '/ai-transition-model/';

  // Calculate available height dynamically
  const { containerRef, height: graphHeight } = useAvailableHeight(500, 20);

  return (
    <div className="diagram-viewer">
      {/* Compact header with description and page link */}
      <div className="diagram-header">
        {graph.description && (
          <p className="diagram-description">{graph.description}</p>
        )}
        <a href={entityPath} className="page-link">
          View {entity.title} →
        </a>
      </div>

      {/* Graph */}
      <div className="diagram-graph-container" ref={containerRef}>
        <CauseEffectGraph
          height={graphHeight}
          hideListView={true}
          selectedNodeId={graph.primaryNodeId}
          showFullscreenButton={false}
          graphConfig={{
            hideGroupBackgrounds: true,
            useDagre: true,
            typeLabels: {
              leaf: 'Root Causes',
              cause: 'Derived',
              intermediate: 'Direct Factors',
              effect: 'Target',
            },
          }}
          initialNodes={graph.nodes.map((node) => {
            // Compute href from entityRef if available, or try to match node ID to path registry
            let href: string | undefined;
            if (node.entityRef) {
              const refEntity = getEntityById(node.entityRef);
              if (refEntity) {
                href = getEntityHref(node.entityRef, refEntity.type);
              }
            }
            // Fallback: check if node ID exists in path registry (matches a page)
            if (!href && pathRegistry[node.id]) {
              href = pathRegistry[node.id];
            }
            // Fallback: check if node ID matches an entity
            if (!href) {
              const matchingEntity = getEntityById(node.id);
              if (matchingEntity) {
                href = getEntityHref(node.id, matchingEntity.type);
              }
            }
            // Fallback: check if node ID matches a master graph category or sub-item
            if (!href) {
              href = getNodeHrefFromMaster(node.id);
            }
            return {
              id: node.id,
              type: 'causeEffect' as const,
              position: { x: 0, y: 0 },
              data: {
                label: node.label,
                description: node.description || '',
                type: node.type,
                ...(node.confidence !== undefined && { confidence: node.confidence }),
                details: node.details || '',
                sources: node.sources || [],
                relatedConcepts: node.relatedConcepts || [],
                ...(href && { href }),
              },
            };
          })}
          initialEdges={graph.edges.map((edge) => ({
            id: edge.id || `e-${edge.source}-${edge.target}`,
            source: edge.source,
            target: edge.target,
            data: {
              strength: edge.strength || 'medium',
              confidence: edge.confidence || 'medium',
              effect: edge.effect || 'increases',
            },
            label: edge.label,
          }))}
        />
      </div>

      <style>{`
        .diagram-viewer {
          margin-top: 0;
        }
        .diagram-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1rem;
          margin-bottom: 1rem;
          flex-wrap: wrap;
        }
        .diagram-description {
          margin: 0;
          color: var(--sl-color-gray-2);
          font-size: 0.95rem;
          flex: 1;
          min-width: 200px;
        }
        .page-link {
          color: var(--sl-color-text-accent);
          text-decoration: none;
          font-size: 0.9rem;
          padding: 0.4rem 0.8rem;
          background: var(--sl-color-gray-6);
          border: 1px solid var(--sl-color-hairline);
          border-radius: 6px;
          white-space: nowrap;
        }
        .page-link:hover {
          background: var(--sl-color-gray-5);
        }
        .diagram-graph-container {
          border: 1px solid var(--sl-color-hairline);
          border-radius: 8px;
          overflow: hidden;
          min-height: 500px;
        }
      `}</style>
    </div>
  );
}
