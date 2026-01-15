/**
 * DiagramViewer - Viewer for causeEffectGraph diagrams
 *
 * Usage: /diagrams/tmc-compute
 * Now designed to be embedded within Starlight pages
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getEntityById, getEntityHref, entities, pathRegistry } from '../data';
import { getNodeHrefFromMaster } from '../data/master-graph-data';
import CauseEffectGraph, { type ScoreHighlightMode } from './CauseEffectGraph';

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
      scores?: {
        novelty?: number;
        sensitivity?: number;
        changeability?: number;
        certainty?: number;
      };
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

// Layout settings type
interface LayoutSettings {
  algorithm: 'elk' | 'dagre';
  showDescriptions: boolean;
  showScores: boolean;
  straightEdges: boolean;
  // Numeric layout values
  layerGap: number;      // Vertical spacing between layers (2-150)
  nodeSpacing: number;   // Horizontal spacing between nodes (2-80)
  nodeWidth: number;     // Node width in pixels (60-250)
}

const DEFAULT_SETTINGS: LayoutSettings = {
  algorithm: 'elk',
  showDescriptions: true,
  showScores: false,
  straightEdges: false,
  layerGap: 25,
  nodeSpacing: 20,
  nodeWidth: 180,
};

export default function DiagramViewer({ entityId: propEntityId }: DiagramViewerProps) {
  // Read entity ID from URL client-side (Astro props may not have query params in dev)
  const [entityId, setEntityId] = useState(propEntityId || '');
  const [settings, setSettings] = useState<LayoutSettings>(DEFAULT_SETTINGS);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [scoreHighlight, setScoreHighlight] = useState<ScoreHighlightMode | undefined>(undefined);

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

  // Key for forcing re-render when settings change
  const settingsKey = JSON.stringify(settings);

  return (
    <div className="diagram-viewer-wrapper">
      <div className="diagram-viewer">
        {/* Compact header with back link, description and page link */}
        <div className="diagram-header">
          <a href="/diagrams/" className="back-link">
            ← All Diagrams
          </a>
          <div className="diagram-header-center">
            {graph.description && (
              <p className="diagram-description">{graph.description}</p>
            )}
          </div>
          <a href={entityPath} className="page-link">
            View {entity.title} →
          </a>
        </div>

        {/* Graph with settings button in tab bar */}
        <div className="diagram-graph-container" ref={containerRef}>
          <CauseEffectGraph
            key={settingsKey}
            height={graphHeight}
            hideListView={true}
            selectedNodeId={graph.primaryNodeId}
            showFullscreenButton={false}
            showDescriptions={settings.showDescriptions}
            showScores={settings.showScores}
            scoreHighlight={scoreHighlight}
            graphConfig={{
              hideGroupBackgrounds: true,
              layoutAlgorithm: settings.algorithm,
              straightEdges: settings.straightEdges,
              nodeWidth: settings.nodeWidth,
              layout: {
                layerGap: settings.layerGap,
                causeSpacing: settings.nodeSpacing,
                intermediateSpacing: settings.nodeSpacing,
                effectSpacing: settings.nodeSpacing,
              },
              typeLabels: {
                leaf: 'Root Causes',
                cause: 'Derived',
                intermediate: 'Direct Factors',
                effect: 'Target',
              },
            }}
            renderHeaderRight={() => (
              <button
                className={`settings-toggle ${settingsOpen ? 'active' : ''}`}
                onClick={() => setSettingsOpen(!settingsOpen)}
                title="Layout Settings"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
                </svg>
                Settings
              </button>
            )}
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
                ...(node.scores && { scores: node.scores }),
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
      </div>

      {/* Settings Sidebar */}
      {settingsOpen && (
        <div className="settings-sidebar">
          <div className="settings-header">
            <h3>Layout Settings</h3>
            <button className="settings-close" onClick={() => setSettingsOpen(false)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <div className="settings-section">
            <label className="settings-label">Layout Algorithm</label>
            <div className="settings-radio-group">
              <label className="settings-radio">
                <input
                  type="radio"
                  name="algorithm"
                  checked={settings.algorithm === 'dagre'}
                  onChange={() => setSettings({ ...settings, algorithm: 'dagre' })}
                />
                <span className="radio-label">
                  <strong>Dagre</strong>
                  <span className="radio-desc">Simpler hierarchical layout, often cleaner</span>
                </span>
              </label>
              <label className="settings-radio">
                <input
                  type="radio"
                  name="algorithm"
                  checked={settings.algorithm === 'elk'}
                  onChange={() => setSettings({ ...settings, algorithm: 'elk' })}
                />
                <span className="radio-label">
                  <strong>ELK</strong>
                  <span className="radio-desc">More powerful, supports layer constraints</span>
                </span>
              </label>
            </div>
          </div>

          <div className="settings-section">
            <label className="settings-label">Display Options</label>
            <label className="settings-checkbox">
              <input
                type="checkbox"
                checked={settings.showDescriptions}
                onChange={(e) => setSettings({ ...settings, showDescriptions: e.target.checked })}
              />
              <span>Show node descriptions</span>
            </label>
            <label className="settings-checkbox">
              <input
                type="checkbox"
                checked={settings.showScores}
                onChange={(e) => setSettings({ ...settings, showScores: e.target.checked })}
              />
              <span>Show scores on nodes</span>
            </label>
            <label className="settings-checkbox">
              <input
                type="checkbox"
                checked={settings.straightEdges}
                onChange={(e) => setSettings({ ...settings, straightEdges: e.target.checked })}
              />
              <span>Straight edges (vs curved)</span>
            </label>
          </div>

          <div className="settings-section">
            <label className="settings-label">View Mode</label>
            <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'nowrap', gap: '4px' }}>
              {[
                { key: undefined, title: 'Default view', color: undefined, icon: (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
                  </svg>
                )},
                { key: 'sensitivity' as const, title: 'Sensitivity: Impact on downstream nodes', color: '#3b82f6', icon: (
                  // Ripple/impact icon for sensitivity
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="2"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="10"/>
                  </svg>
                )},
                { key: 'novelty' as const, title: 'Novelty: How surprising to informed readers', color: '#8b5cf6', icon: (
                  // Lightbulb icon for novelty/new ideas
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 18h6"/><path d="M10 22h4"/>
                    <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/>
                  </svg>
                )},
                { key: 'changeability' as const, title: 'Changeability: How tractable to influence', color: '#22c55e', icon: (
                  // Hammer icon for changeability/tractability
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 12l-8.5 8.5c-.83.83-2.17.83-3 0 0 0 0 0 0 0a2.12 2.12 0 0 1 0-3L12 9"/>
                    <path d="M17.64 15L22 10.64"/><path d="M20.91 11.7l-1.25-1.25c-.6-.6-.93-1.4-.93-2.25v-.86L16.01 4.6a5.56 5.56 0 0 0-3.94-1.64H9l.92.82A6.18 6.18 0 0 1 12 8.4v1.56l2 2h2.47l2.26 1.91"/>
                  </svg>
                )},
                { key: 'certainty' as const, title: 'Certainty: How well understood', color: '#ef4444', icon: (
                  // Question mark icon for certainty/uncertainty
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                )},
              ].map((mode) => {
                const isActive = scoreHighlight === mode.key;
                const strokeColor = isActive ? (mode.color || 'var(--sl-color-accent)') : 'var(--sl-color-gray-3)';
                return (
                  <button
                    key={mode.title}
                    style={{
                      width: '28px',
                      height: '28px',
                      margin: 0,
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '6px',
                      border: `1px solid ${isActive ? (mode.color || 'var(--sl-color-accent)') : 'var(--sl-color-hairline)'}`,
                      background: isActive
                        ? (mode.color ? `${mode.color}20` : 'var(--sl-color-accent-low)')
                        : 'var(--sl-color-gray-5)',
                      color: strokeColor,
                      cursor: 'pointer',
                    }}
                    onClick={() => setScoreHighlight(mode.key)}
                    title={mode.title}
                  >
                    {mode.icon}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="settings-section">
            <label className="settings-label">Spacing</label>
            <div className="settings-slider-row">
              <span className="settings-slider-label">Layer gap</span>
              <input
                type="range"
                min="2"
                max="150"
                value={settings.layerGap}
                onChange={(e) => setSettings({ ...settings, layerGap: Number(e.target.value) })}
                className="settings-slider"
              />
              <span className="settings-slider-value">{settings.layerGap}</span>
            </div>
            <div className="settings-slider-row">
              <span className="settings-slider-label">Node spacing</span>
              <input
                type="range"
                min="2"
                max="80"
                value={settings.nodeSpacing}
                onChange={(e) => setSettings({ ...settings, nodeSpacing: Number(e.target.value) })}
                className="settings-slider"
              />
              <span className="settings-slider-value">{settings.nodeSpacing}</span>
            </div>
            <div className="settings-slider-row">
              <span className="settings-slider-label">Node width</span>
              <input
                type="range"
                min="60"
                max="250"
                value={settings.nodeWidth}
                onChange={(e) => setSettings({ ...settings, nodeWidth: Number(e.target.value) })}
                className="settings-slider"
              />
              <span className="settings-slider-value">{settings.nodeWidth}</span>
            </div>
          </div>

          <div className="settings-section settings-reset">
            <button
              className="reset-button"
              onClick={() => setSettings(DEFAULT_SETTINGS)}
            >
              Reset to Defaults
            </button>
          </div>
        </div>
      )}

      <style>{`
        .diagram-viewer-wrapper {
          display: flex;
          gap: 1rem;
        }
        .diagram-viewer {
          flex: 1;
          min-width: 0;
        }
        .diagram-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1rem;
          margin-bottom: 1rem;
          flex-wrap: wrap;
        }
        .back-link {
          color: var(--sl-color-gray-3);
          text-decoration: none;
          font-size: 0.9rem;
          padding: 0.4rem 0.8rem;
          background: var(--sl-color-gray-6);
          border: 1px solid var(--sl-color-hairline);
          border-radius: 6px;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .back-link:hover {
          background: var(--sl-color-gray-5);
          color: var(--sl-color-text);
        }
        .diagram-header-center {
          flex: 1;
          min-width: 0;
        }
        .diagram-description {
          margin: 0;
          color: var(--sl-color-gray-2);
          font-size: 0.95rem;
        }
        .diagram-header-actions {
          display: flex;
          gap: 0.5rem;
          align-items: center;
        }
        .settings-toggle {
          all: unset;
          box-sizing: border-box;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          height: 34px;
          padding: 0 12px;
          background: var(--sl-color-gray-6);
          border: 1px solid var(--sl-color-hairline);
          border-radius: 6px;
          color: var(--sl-color-gray-2);
          font-size: 13px;
          font-family: system-ui, -apple-system, sans-serif;
          font-weight: 500;
          line-height: 1;
          cursor: pointer;
          transition: all 0.15s;
        }
        .settings-toggle:hover, .settings-toggle.active {
          background: var(--sl-color-gray-5);
          color: var(--sl-color-text);
        }
        .settings-toggle.active {
          border-color: var(--sl-color-accent);
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

        /* Settings Sidebar */
        .settings-sidebar {
          width: 220px;
          flex-shrink: 0;
          background: var(--sl-color-gray-6);
          border: 1px solid var(--sl-color-hairline);
          border-radius: 8px;
          padding: 0.875rem;
          height: fit-content;
          max-height: calc(100vh - 200px);
          overflow-y: auto;
        }
        .settings-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid var(--sl-color-hairline);
        }
        .settings-header h3 {
          margin: 0;
          font-size: 0.9rem;
          font-weight: 600;
        }
        .settings-close {
          background: none;
          border: none;
          padding: 0.25rem;
          cursor: pointer;
          color: var(--sl-color-gray-3);
          border-radius: 4px;
        }
        .settings-close:hover {
          background: var(--sl-color-gray-5);
          color: var(--sl-color-text);
        }
        .settings-section {
          margin-bottom: 1rem;
        }
        .settings-label {
          display: block;
          font-size: 0.8rem;
          font-weight: 500;
          color: var(--sl-color-gray-2);
          margin-bottom: 0.375rem;
        }
        .settings-radio-group {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        .settings-radio {
          display: flex;
          align-items: flex-start;
          gap: 0.375rem;
          cursor: pointer;
          padding: 0.375rem;
          border-radius: 6px;
          transition: background 0.15s;
        }
        .settings-radio:hover {
          background: var(--sl-color-gray-5);
        }
        .settings-radio input {
          margin-top: 0.15rem;
        }
        .radio-label {
          display: flex;
          flex-direction: column;
        }
        .radio-label strong {
          font-size: 0.85rem;
          color: var(--sl-color-text);
        }
        .radio-desc {
          font-size: 0.7rem;
          color: var(--sl-color-gray-3);
          line-height: 1.3;
        }
        .settings-checkbox {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          cursor: pointer;
          font-size: 0.85rem;
        }
        .settings-select {
          width: 100%;
          padding: 0.5rem;
          background: var(--sl-color-gray-5);
          border: 1px solid var(--sl-color-hairline);
          border-radius: 6px;
          color: var(--sl-color-text);
          font-size: 0.85rem;
          cursor: pointer;
        }
        .settings-select:hover {
          background: var(--sl-color-gray-4);
        }
        .settings-slider-row {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          margin-bottom: 0.5rem;
        }
        .settings-slider-row:last-child {
          margin-bottom: 0;
        }
        .settings-slider-label {
          font-size: 0.8rem;
          color: var(--sl-color-gray-2);
          flex-shrink: 0;
          width: 55px;
        }
        .settings-slider {
          flex: 1;
          min-width: 60px;
          cursor: pointer;
          height: 4px;
          -webkit-appearance: none;
          appearance: none;
          background: var(--sl-color-gray-5);
          border-radius: 2px;
        }
        .settings-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: var(--sl-color-accent);
          cursor: pointer;
        }
        .settings-slider-value {
          font-size: 0.75rem;
          font-family: monospace;
          color: var(--sl-color-gray-3);
          width: 22px;
          text-align: right;
          flex-shrink: 0;
        }
        .settings-reset {
          padding-top: 1rem;
          border-top: 1px solid var(--sl-color-hairline);
        }
        .reset-button {
          width: 100%;
          padding: 0.5rem;
          background: var(--sl-color-gray-5);
          border: 1px solid var(--sl-color-hairline);
          border-radius: 6px;
          color: var(--sl-color-gray-2);
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.15s;
        }
        .reset-button:hover {
          background: var(--sl-color-gray-4);
          color: var(--sl-color-text);
        }

        @media (max-width: 900px) {
          .diagram-viewer-wrapper {
            flex-direction: column;
          }
          .settings-sidebar {
            width: 100%;
            max-height: none;
          }
        }
      `}</style>
    </div>
  );
}
