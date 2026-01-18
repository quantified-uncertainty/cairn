/**
 * MasterGraphViewer - Unified view of the AI Transition Model causal graph
 *
 * Supports two view levels:
 * - Overview: High-level categories with sub-items (clean, like existing graph)
 * - Detailed: All granular nodes with full causal chains
 *
 * Usage:
 *   Overview: /diagrams/master-graph
 *   Detailed: /diagrams/master-graph?level=detailed
 */

import React, { useState, useMemo, useEffect } from 'react';
import CauseEffectGraph, { type LayoutAlgorithm } from './CauseEffectGraph';
import {
  FilterControls,
  createInitialFilters,
  type GraphFilters,
  type CategoryInfo,
} from './CauseEffectGraph/components';
import {
  getGraphData,
  getMasterGraphStats,
  getAvailableSubgraphs,
  extractSubgraph,
  getFilterCategories,
  getFilteredDetailedData,
} from '../data/master-graph-data';

type ViewLevel = 'overview' | 'detailed';

interface MasterGraphViewerProps {
  initialLevel?: ViewLevel;
  defaultZoom?: number;  // Initial zoom level (overrides fitView)
}

export default function MasterGraphViewer({
  initialLevel = 'overview',
  defaultZoom,
}: MasterGraphViewerProps) {
  const [level, setLevel] = useState<ViewLevel>(initialLevel);
  const [selectedSubgraph, setSelectedSubgraph] = useState<string>('');

  // Get filter categories (for detailed view filtering)
  const filterCategories = useMemo(() => {
    try {
      const cats = getFilterCategories();
      // Convert to CategoryInfo format expected by FilterControls
      return cats.map((c) => ({
        id: c.id,
        label: c.label,
        type: c.type,
        subgroup: c.subgroup,
        nodeCount: c.nodeCount,
        subcategories: c.subcategories,
      })) as CategoryInfo[];
    } catch {
      return [];
    }
  }, []);

  // Filter state for detailed view
  const [filters, setFilters] = useState<GraphFilters>(() =>
    createInitialFilters(filterCategories)
  );

  // Layout algorithm state (default to grouped for detailed view)
  const [layoutAlgorithm, setLayoutAlgorithm] = useState<LayoutAlgorithm>('grouped');

  // Update filters when categories change
  useEffect(() => {
    if (filterCategories.length > 0) {
      setFilters(createInitialFilters(filterCategories));
    }
  }, [filterCategories]);

  // Read level from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlLevel = params.get('level');
    if (urlLevel === 'detailed' || urlLevel === 'overview') {
      setLevel(urlLevel);
    }
    const entity = params.get('entity');
    if (entity) {
      setSelectedSubgraph(entity);
    }
  }, []);

  // Get stats
  const stats = useMemo(() => {
    try {
      return getMasterGraphStats();
    } catch (e) {
      return null;
    }
  }, []);

  // Get available subgraphs
  const subgraphs = useMemo(() => {
    try {
      return getAvailableSubgraphs();
    } catch (e) {
      return [];
    }
  }, []);

  // Get graph data based on level
  const graphData = useMemo(() => {
    try {
      if (selectedSubgraph) {
        return extractSubgraph(selectedSubgraph, 3, level);
      }

      // For detailed view, apply filters
      if (level === 'detailed') {
        return getFilteredDetailedData(filters);
      }

      return getGraphData(level);
    } catch (e) {
      console.error('Failed to load graph data:', e);
      return { nodes: [], edges: [] };
    }
  }, [level, selectedSubgraph, filters]);

  // Handle level change
  const handleLevelChange = (newLevel: ViewLevel) => {
    setLevel(newLevel);
    setSelectedSubgraph(''); // Clear subgraph when changing level
    const url = new URL(window.location.href);
    url.searchParams.set('level', newLevel);
    url.searchParams.delete('entity');
    window.history.pushState({}, '', url.toString());
  };

  // Handle subgraph selection
  const handleSubgraphChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const entityId = e.target.value;
    setSelectedSubgraph(entityId);
    const url = new URL(window.location.href);
    if (entityId) {
      url.searchParams.set('entity', entityId);
    } else {
      url.searchParams.delete('entity');
    }
    window.history.pushState({}, '', url.toString());
  };

  // Titles
  const title = selectedSubgraph
    ? `Subgraph: ${selectedSubgraph}`
    : level === 'overview'
    ? 'AI Transition Model - Overview'
    : 'AI Transition Model - Detailed';

  const description = selectedSubgraph
    ? `Causal factors related to ${selectedSubgraph}`
    : level === 'overview'
    ? 'High-level categories and their relationships'
    : 'Granular causal factors and their connections';

  return (
    <div style={styles.fullscreen}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <h1 style={styles.title}>{title}</h1>
          <p style={styles.description}>{description}</p>
        </div>

        <div style={styles.headerRight}>
          {/* Level toggle */}
          <div style={styles.toggleGroup}>
            <button
              style={{
                ...styles.toggleBtn,
                ...(level === 'overview' ? styles.toggleBtnActive : {}),
              }}
              onClick={() => handleLevelChange('overview')}
              title="High-level categories with sub-items listed inside"
            >
              Overview
            </button>
            <button
              style={{
                ...styles.toggleBtn,
                ...(level === 'detailed' ? styles.toggleBtnActive : {}),
              }}
              onClick={() => handleLevelChange('detailed')}
              title="All granular causal factors"
            >
              Detailed
              {stats && <span style={styles.badge}>{stats.detailedNodeCount}</span>}
            </button>
          </div>

          {/* Subgraph selector (only in detailed mode) */}
          {level === 'detailed' && (
            <select
              style={styles.select}
              value={selectedSubgraph}
              onChange={handleSubgraphChange}
            >
              <option value="">All nodes</option>
              {subgraphs.map((spec) => (
                <option key={spec.entityId} value={spec.entityId}>
                  {spec.title || spec.entityId}
                </option>
              ))}
            </select>
          )}

          {/* Stats */}
          <div style={styles.statsRow}>
            <span style={styles.stat}>{graphData.nodes.length} nodes</span>
            <span style={styles.stat}>{graphData.edges.length} edges</span>
          </div>

          {/* Link to existing graph */}
          <a href="/ai-transition-model-views/graph" style={styles.link}>
            Original View →
          </a>
        </div>
      </div>

      {/* Graph */}
      <div style={styles.graphContainer}>
        <CauseEffectGraph
          height="100%"
          hideListView={true}
          minZoom={level === 'detailed' ? 0.05 : 0.15}
          maxZoom={2}
          defaultZoom={defaultZoom}
          fitViewPadding={0.15}
          showMiniMap={false}
          enablePathHighlighting={level === 'detailed'}
          graphConfig={{
            hideGroupBackgrounds: level === 'detailed' && layoutAlgorithm !== 'grouped',
            layoutAlgorithm: level === 'detailed' ? layoutAlgorithm : 'dagre',
            typeLabels:
              level === 'overview'
                ? {
                    cause: 'Root Factors',
                    intermediate: 'Scenarios',
                    effect: 'Outcomes',
                  }
                : {
                    cause: 'Inputs',
                    intermediate: 'Intermediate',
                    effect: 'Outputs',
                  },
            subgroups:
              level === 'overview'
                ? {
                    ai: {
                      label: 'AI System Factors',
                      bgColor: 'rgba(219, 234, 254, 0.2)',
                      borderColor: 'transparent',
                    },
                    society: {
                      label: 'Societal Factors',
                      bgColor: 'rgba(209, 250, 229, 0.2)',
                      borderColor: 'transparent',
                    },
                  }
                : undefined,
          }}
          initialNodes={graphData.nodes}
          initialEdges={graphData.edges}
        />
        {/* Filter controls for detailed view */}
        {level === 'detailed' && (
          <FilterControls
            categories={filterCategories}
            filters={filters}
            onFiltersChange={setFilters}
            totalNodes={stats?.detailedNodeCount || 0}
            visibleNodes={graphData.nodes.length}
            layoutAlgorithm={layoutAlgorithm}
            onLayoutChange={setLayoutAlgorithm}
          />
        )}
      </div>

      {/* Footer with legend */}
      <div style={styles.footer}>
        <span style={styles.footerText}>
          {level === 'overview'
            ? 'Click nodes to see sub-items. Use Detailed view for all granular factors.'
            : 'Use filters to focus on specific categories. Use the dropdown to select a subgraph.'}
        </span>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  fullscreen: {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    background: '#0f172a',
    color: '#e2e8f0',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '1rem 1.5rem',
    borderBottom: '1px solid #334155',
    background: '#1e293b',
    gap: '2rem',
    flexWrap: 'wrap',
  },
  headerLeft: {
    flex: '1 1 300px',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    flexWrap: 'wrap',
  },
  title: {
    margin: 0,
    fontSize: '1.25rem',
    fontWeight: 600,
    color: '#f1f5f9',
  },
  description: {
    margin: '0.5rem 0 0 0',
    color: '#94a3b8',
    fontSize: '0.9rem',
  },
  toggleGroup: {
    display: 'flex',
    background: '#334155',
    borderRadius: '6px',
    overflow: 'hidden',
  },
  toggleBtn: {
    padding: '0.5rem 1rem',
    border: 'none',
    background: 'transparent',
    color: '#94a3b8',
    cursor: 'pointer',
    fontSize: '0.9rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    transition: 'all 0.15s',
  },
  toggleBtnActive: {
    background: '#475569',
    color: '#f1f5f9',
  },
  badge: {
    background: '#64748b',
    padding: '0.1rem 0.4rem',
    borderRadius: '4px',
    fontSize: '0.75rem',
  },
  select: {
    padding: '0.5rem 0.75rem',
    background: '#334155',
    border: '1px solid #475569',
    borderRadius: '6px',
    color: '#f1f5f9',
    fontSize: '0.9rem',
    cursor: 'pointer',
    minWidth: '180px',
  },
  statsRow: {
    display: 'flex',
    gap: '1rem',
  },
  stat: {
    color: '#64748b',
    fontSize: '0.85rem',
    fontFamily: 'monospace',
  },
  link: {
    color: '#60a5fa',
    textDecoration: 'none',
    fontSize: '0.85rem',
    padding: '0.4rem 0.8rem',
    background: '#334155',
    borderRadius: '6px',
  },
  graphContainer: {
    flex: 1,
    minHeight: 0,
    position: 'relative',
  },
  footer: {
    padding: '0.75rem 1.5rem',
    borderTop: '1px solid #334155',
    background: '#1e293b',
  },
  footerText: {
    color: '#64748b',
    fontSize: '0.85rem',
  },
};
