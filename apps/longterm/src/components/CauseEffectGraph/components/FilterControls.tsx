import { useState, useCallback } from 'react';
import { ChevronIcon } from './icons';
import { getCategoryColor } from '@data/master-graph-data';
import type { LayoutAlgorithm } from '../types';

// Edge density levels
export type EdgeDensity = 'minimal' | 'low' | 'medium' | 'high' | 'all';

// Filter state structure
export interface GraphFilters {
  // Toggle by category ID (e.g., 'ai-capabilities', 'misalignment-potential')
  categories: Record<string, boolean>;
  // Toggle by subgroup (e.g., 'ai', 'society')
  subgroups: Record<string, boolean>;
  // Toggle by node type (cause, intermediate, effect)
  types: Record<string, boolean>;
  // Toggle by subcategory (e.g., 'compute', 'algorithms')
  subcategories: Record<string, boolean>;
  // Edge density control
  edgeDensity: EdgeDensity;
}

export interface CategoryInfo {
  id: string;
  label: string;
  type: 'cause' | 'intermediate' | 'effect';
  subgroup?: string;
  subcategories?: Array<{ id: string; label: string; nodeCount: number }>;
  nodeCount: number;
}

interface FilterControlsProps {
  categories: CategoryInfo[];
  filters: GraphFilters;
  onFiltersChange: (filters: GraphFilters) => void;
  totalNodes: number;
  visibleNodes: number;
  // Layout algorithm selector
  layoutAlgorithm?: LayoutAlgorithm;
  onLayoutChange?: (algorithm: LayoutAlgorithm) => void;
}

// Helper for density tooltip
function getDensityTooltip(level: EdgeDensity): string {
  switch (level) {
    case 'minimal': return 'Show only strongest connections (~10%)';
    case 'low': return 'Show strong connections (~25%)';
    case 'medium': return 'Show strong + medium connections (~50%)';
    case 'high': return 'Show most connections (~75%)';
    case 'all': return 'Show all connections (100%)';
  }
}

export function FilterControls({
  categories,
  filters,
  onFiltersChange,
  totalNodes,
  visibleNodes,
  layoutAlgorithm = 'dagre',
  onLayoutChange,
}: FilterControlsProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['categories'])
  );

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  // Toggle a single category
  const toggleCategory = useCallback(
    (categoryId: string) => {
      onFiltersChange({
        ...filters,
        categories: {
          ...filters.categories,
          [categoryId]: !filters.categories[categoryId],
        },
      });
    },
    [filters, onFiltersChange]
  );

  // Toggle a subgroup (AI vs Society)
  const toggleSubgroup = useCallback(
    (subgroup: string) => {
      onFiltersChange({
        ...filters,
        subgroups: {
          ...filters.subgroups,
          [subgroup]: !filters.subgroups[subgroup],
        },
      });
    },
    [filters, onFiltersChange]
  );

  // Toggle a node type
  const toggleType = useCallback(
    (type: string) => {
      onFiltersChange({
        ...filters,
        types: {
          ...filters.types,
          [type]: !filters.types[type],
        },
      });
    },
    [filters, onFiltersChange]
  );

  // Show all
  const showAll = useCallback(() => {
    const allCategories: Record<string, boolean> = {};
    const allSubcategories: Record<string, boolean> = {};
    categories.forEach((c) => {
      allCategories[c.id] = true;
      c.subcategories?.forEach((sc) => {
        allSubcategories[sc.id] = true;
      });
    });
    onFiltersChange({
      categories: allCategories,
      subgroups: { ai: true, society: true },
      types: { cause: true, intermediate: true, effect: true },
      subcategories: allSubcategories,
    });
  }, [categories, onFiltersChange]);

  // Hide all
  const hideAll = useCallback(() => {
    const allCategories: Record<string, boolean> = {};
    const allSubcategories: Record<string, boolean> = {};
    categories.forEach((c) => {
      allCategories[c.id] = false;
      c.subcategories?.forEach((sc) => {
        allSubcategories[sc.id] = false;
      });
    });
    onFiltersChange({
      categories: allCategories,
      subgroups: { ai: false, society: false },
      types: { cause: false, intermediate: false, effect: false },
      subcategories: allSubcategories,
    });
  }, [categories, onFiltersChange]);

  // Group categories by type
  const causeCategories = categories.filter((c) => c.type === 'cause');
  const scenarioCategories = categories.filter((c) => c.type === 'intermediate');
  const outcomeCategories = categories.filter((c) => c.type === 'effect');

  // Check if all in a group are visible
  const allCausesVisible = causeCategories.every((c) => filters.categories[c.id] !== false);
  const allScenariosVisible = scenarioCategories.every((c) => filters.categories[c.id] !== false);
  const allOutcomesVisible = outcomeCategories.every((c) => filters.categories[c.id] !== false);
  const allScenariosAndOutcomesVisible = allScenariosVisible && allOutcomesVisible;

  // Toggle all scenarios and outcomes together
  const toggleScenariosAndOutcomes = useCallback(() => {
    const newValue = !allScenariosAndOutcomesVisible;
    const categoryUpdates: Record<string, boolean> = { ...filters.categories };
    [...scenarioCategories, ...outcomeCategories].forEach((cat) => {
      categoryUpdates[cat.id] = newValue;
    });
    onFiltersChange({
      ...filters,
      categories: categoryUpdates,
    });
  }, [filters, onFiltersChange, allScenariosAndOutcomesVisible, scenarioCategories, outcomeCategories]);

  return (
    <div style={styles.container}>
      <div style={styles.header} onClick={() => setIsExpanded(!isExpanded)}>
        <span style={styles.title}>Filters</span>
        <span style={styles.nodeCount}>
          {visibleNodes}/{totalNodes} nodes
        </span>
        <ChevronIcon expanded={isExpanded} />
      </div>

      {isExpanded && (
        <div style={styles.content}>
          {/* Quick actions */}
          <div style={styles.quickActions}>
            <button style={styles.quickBtn} onClick={showAll}>
              Show All
            </button>
            <button style={styles.quickBtn} onClick={hideAll}>
              Hide All
            </button>
          </div>

          {/* Layout selector */}
          {onLayoutChange && (
            <div style={styles.section}>
              <div style={styles.sectionTitle}>Layout</div>
              <select
                style={styles.select}
                value={layoutAlgorithm}
                onChange={(e) => onLayoutChange(e.target.value as LayoutAlgorithm)}
              >
                <option value="grouped">Grouped (Sections)</option>
                <option value="dagre">Hierarchical (Dagre)</option>
                <option value="elk">Layered (ELK)</option>
              </select>
            </div>
          )}

          {/* Edge density selector */}
          <div style={styles.section}>
            <div style={styles.sectionTitle}>Edge Density</div>
            <div style={styles.densityButtons}>
              {(['minimal', 'low', 'medium', 'high', 'all'] as const).map((level) => (
                <button
                  key={level}
                  style={{
                    ...styles.densityBtn,
                    ...(filters.edgeDensity === level ? styles.densityBtnActive : {}),
                  }}
                  onClick={() => onFiltersChange({ ...filters, edgeDensity: level })}
                  title={getDensityTooltip(level)}
                >
                  {level === 'minimal' ? '10%' : level === 'low' ? '25%' : level === 'medium' ? '50%' : level === 'high' ? '75%' : '100%'}
                </button>
              ))}
            </div>
          </div>

          {/* Subgroup toggles (AI vs Society) */}
          <div style={styles.section}>
            <div style={styles.sectionTitle}>By Domain</div>
            <label style={styles.checkboxRow}>
              <input
                type="checkbox"
                checked={filters.subgroups.ai !== false}
                onChange={() => toggleSubgroup('ai')}
                style={styles.checkbox}
              />
              <span style={{ ...styles.badge, backgroundColor: '#dbeafe', color: '#1e40af' }}>
                AI System Factors
              </span>
            </label>
            <label style={styles.checkboxRow}>
              <input
                type="checkbox"
                checked={filters.subgroups.society !== false}
                onChange={() => toggleSubgroup('society')}
                style={styles.checkbox}
              />
              <span style={{ ...styles.badge, backgroundColor: '#dcfce7', color: '#166534' }}>
                Societal Factors
              </span>
            </label>
          </div>

          {/* Type toggles */}
          <div style={styles.section}>
            <div style={styles.sectionTitle}>By Layer</div>
            <label style={styles.checkboxRow}>
              <input
                type="checkbox"
                checked={filters.types.cause !== false}
                onChange={() => toggleType('cause')}
                style={styles.checkbox}
              />
              <span>Root Factors ({causeCategories.reduce((sum, c) => sum + c.nodeCount, 0)})</span>
            </label>
            <label style={styles.checkboxRow}>
              <input
                type="checkbox"
                checked={filters.types.intermediate !== false}
                onChange={() => toggleType('intermediate')}
                style={styles.checkbox}
              />
              <span style={{ ...styles.badge, backgroundColor: '#ede9fe', color: '#5b21b6' }}>
                Scenarios ({scenarioCategories.reduce((sum, c) => sum + c.nodeCount, 0)})
              </span>
            </label>
            <label style={styles.checkboxRow}>
              <input
                type="checkbox"
                checked={filters.types.effect !== false}
                onChange={() => toggleType('effect')}
                style={styles.checkbox}
              />
              <span>Outcomes ({outcomeCategories.reduce((sum, c) => sum + c.nodeCount, 0)})</span>
            </label>
          </div>

          {/* Category toggles */}
          <div style={styles.section}>
            <div
              style={styles.sectionHeader}
              onClick={() => toggleSection('categories')}
            >
              <span style={styles.sectionTitle}>By Category</span>
              <ChevronIcon expanded={expandedSections.has('categories')} />
            </div>

            {expandedSections.has('categories') && (
              <div style={styles.categoryList}>
                {/* Root Factors */}
                <div style={styles.categoryGroup}>
                  <div style={styles.groupLabel}>Root Factors</div>
                  {causeCategories.map((cat) => {
                    const color = getCategoryColor(cat.id);
                    return (
                      <label key={cat.id} style={styles.checkboxRow}>
                        <input
                          type="checkbox"
                          checked={filters.categories[cat.id] !== false}
                          onChange={() => toggleCategory(cat.id)}
                          style={styles.checkbox}
                        />
                        {color && (
                          <span
                            style={{
                              ...styles.colorSwatch,
                              backgroundColor: color.accent,
                            }}
                          />
                        )}
                        <span style={styles.categoryLabel}>
                          {cat.label}
                          <span style={styles.count}>({cat.nodeCount})</span>
                        </span>
                      </label>
                    );
                  })}
                </div>

                {/* Scenarios & Outcomes combined */}
                <div style={styles.categoryGroup}>
                  <label style={styles.checkboxRow}>
                    <input
                      type="checkbox"
                      checked={allScenariosAndOutcomesVisible}
                      onChange={toggleScenariosAndOutcomes}
                      style={styles.checkbox}
                    />
                    <span
                      style={{
                        ...styles.colorSwatch,
                        backgroundColor: '#a855f7',
                      }}
                    />
                    <span style={styles.categoryLabel}>
                      Scenarios & Outcomes
                      <span style={styles.count}>
                        ({scenarioCategories.reduce((sum, c) => sum + c.nodeCount, 0) +
                          outcomeCategories.reduce((sum, c) => sum + c.nodeCount, 0)})
                      </span>
                    </span>
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'absolute',
    top: '10px',
    right: '10px',
    backgroundColor: 'rgba(30, 41, 59, 0.95)',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
    zIndex: 100,
    maxWidth: '280px',
    maxHeight: 'calc(100vh - 140px)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 12px',
    cursor: 'pointer',
    borderBottom: '1px solid #334155',
    backgroundColor: '#1e293b',
  },
  title: {
    fontWeight: 600,
    fontSize: '14px',
    color: '#f1f5f9',
    flex: 1,
  },
  nodeCount: {
    fontSize: '12px',
    color: '#94a3b8',
    fontFamily: 'monospace',
  },
  content: {
    padding: '8px',
    overflowY: 'auto',
    flex: 1,
  },
  quickActions: {
    display: 'flex',
    gap: '6px',
    marginBottom: '12px',
  },
  quickBtn: {
    flex: 1,
    padding: '6px 10px',
    fontSize: '12px',
    backgroundColor: '#334155',
    color: '#e2e8f0',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  select: {
    width: '100%',
    padding: '6px 10px',
    fontSize: '12px',
    backgroundColor: '#334155',
    color: '#e2e8f0',
    border: '1px solid #475569',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  densityButtons: {
    display: 'flex',
    gap: '4px',
  },
  densityBtn: {
    flex: 1,
    padding: '5px 6px',
    fontSize: '11px',
    backgroundColor: '#334155',
    color: '#94a3b8',
    border: '1px solid #475569',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  densityBtnActive: {
    backgroundColor: '#475569',
    color: '#f1f5f9',
    borderColor: '#60a5fa',
  },
  section: {
    marginBottom: '12px',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    cursor: 'pointer',
    marginBottom: '6px',
  },
  sectionTitle: {
    fontSize: '11px',
    fontWeight: 600,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '6px',
  },
  checkboxRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '4px 0',
    cursor: 'pointer',
    fontSize: '13px',
    color: '#e2e8f0',
  },
  checkbox: {
    width: '14px',
    height: '14px',
    cursor: 'pointer',
  },
  colorSwatch: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    flexShrink: 0,
  },
  badge: {
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 500,
  },
  categoryList: {
    marginTop: '4px',
  },
  categoryGroup: {
    marginBottom: '10px',
  },
  groupLabel: {
    fontSize: '11px',
    color: '#64748b',
    marginBottom: '4px',
    paddingLeft: '22px',
  },
  categoryLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  count: {
    fontSize: '11px',
    color: '#64748b',
  },
};

// Helper to create initial filters with everything visible
export function createInitialFilters(categories: CategoryInfo[]): GraphFilters {
  const categoryFilters: Record<string, boolean> = {};
  const subcategoryFilters: Record<string, boolean> = {};

  categories.forEach((c) => {
    categoryFilters[c.id] = true;
    c.subcategories?.forEach((sc) => {
      subcategoryFilters[sc.id] = true;
    });
  });

  return {
    categories: categoryFilters,
    subgroups: { ai: true, society: true },
    types: { cause: true, intermediate: true, effect: true },
    subcategories: subcategoryFilters,
    edgeDensity: 'medium',  // Default to medium density
  };
}
