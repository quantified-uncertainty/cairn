/**
 * EntityIndex Component
 *
 * A filterable, sortable table of entities.
 * Supports filtering by type, tags, severity, and text search.
 */

"use client";

import React, { useState, useMemo } from 'react';
import { entities as allEntities, getAllTags, getEntityHref } from '../../data';
import { Search, Filter, SortAsc, SortDesc, X, Grid, List, Table } from 'lucide-react';
import type { Entity } from '../../data/schema';
import { EntityTypeBadge } from './EntityTypeIcon';

type ViewMode = 'table' | 'cards' | 'list';
type SortField = 'title' | 'type' | 'severity' | 'lastUpdated';
type SortDirection = 'asc' | 'desc';

interface EntityIndexProps {
  type?: string | string[];
  columns?: Array<'title' | 'type' | 'description' | 'severity' | 'tags' | 'lastUpdated'>;
  showFilters?: boolean;
  showSearch?: boolean;
  showViewToggle?: boolean;
  defaultView?: ViewMode;
  maxItems?: number;
  title?: string;
}

const SEVERITY_ORDER = { catastrophic: 0, high: 1, medium: 2, low: 3 };

function SeverityBadge({ severity }: { severity?: string }) {
  if (!severity) return <span className="text-muted">—</span>;

  const colorClass = {
    catastrophic: 'entity-index__badge--catastrophic',
    high: 'entity-index__badge--high',
    medium: 'entity-index__badge--medium',
    low: 'entity-index__badge--low',
  }[severity] || '';

  return (
    <span className={`entity-index__badge ${colorClass}`}>
      {severity}
    </span>
  );
}

function TypeBadge({ type }: { type: string }) {
  return <EntityTypeBadge type={type} size="xs" />;
}

export function EntityIndex({
  type,
  columns = ['title', 'type', 'severity', 'lastUpdated'],
  showFilters = true,
  showSearch = true,
  showViewToggle = true,
  defaultView = 'table',
  maxItems,
  title,
}: EntityIndexProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedSeverity, setSelectedSeverity] = useState<string[]>([]);
  const [sortField, setSortField] = useState<SortField>('title');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [viewMode, setViewMode] = useState<ViewMode>(defaultView);
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  // Get available types for filtering
  const availableTypes = useMemo(() => {
    const types = new Set<string>();
    allEntities.forEach(e => types.add(e.type));
    return Array.from(types).sort();
  }, []);

  // Get top tags for filtering
  const topTags = useMemo(() => getAllTags().slice(0, 20), []);

  // Filter and sort entities
  const filteredEntities = useMemo(() => {
    let result = [...allEntities];

    // Filter by type prop
    if (type) {
      const types = Array.isArray(type) ? type : [type];
      result = result.filter(e => types.includes(e.type));
    }

    // Filter by selected types
    if (selectedTypes.length > 0) {
      result = result.filter(e => selectedTypes.includes(e.type));
    }

    // Filter by selected tags
    if (selectedTags.length > 0) {
      result = result.filter(e =>
        e.tags?.some(t => selectedTags.includes(t))
      );
    }

    // Filter by severity
    if (selectedSeverity.length > 0) {
      result = result.filter(e =>
        e.severity && selectedSeverity.includes(e.severity)
      );
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(e =>
        e.title.toLowerCase().includes(query) ||
        e.description?.toLowerCase().includes(query) ||
        e.tags?.some(t => t.toLowerCase().includes(query))
      );
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
        case 'severity':
          const aOrder = SEVERITY_ORDER[a.severity as keyof typeof SEVERITY_ORDER] ?? 4;
          const bOrder = SEVERITY_ORDER[b.severity as keyof typeof SEVERITY_ORDER] ?? 4;
          comparison = aOrder - bOrder;
          break;
        case 'lastUpdated':
          comparison = (b.lastUpdated || '').localeCompare(a.lastUpdated || '');
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    // Limit
    if (maxItems) {
      result = result.slice(0, maxItems);
    }

    return result;
  }, [type, selectedTypes, selectedTags, selectedSeverity, searchQuery, sortField, sortDirection, maxItems]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const clearFilters = () => {
    setSelectedTypes([]);
    setSelectedTags([]);
    setSelectedSeverity([]);
    setSearchQuery('');
  };

  const hasActiveFilters = selectedTypes.length > 0 || selectedTags.length > 0 || selectedSeverity.length > 0 || searchQuery;

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <SortAsc size={14} /> : <SortDesc size={14} />;
  };

  return (
    <div className="entity-index">
      {title && <h2 className="entity-index__title">{title}</h2>}

      {/* Controls bar */}
      <div className="entity-index__controls">
        {showSearch && (
          <div className="entity-index__search">
            <Search size={16} className="entity-index__search-icon" />
            <input
              type="text"
              placeholder="Search entities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="entity-index__search-input"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="entity-index__search-clear">
                <X size={14} />
              </button>
            )}
          </div>
        )}

        <div className="entity-index__actions">
          {showFilters && (
            <button
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              className={`entity-index__filter-toggle ${showFilterPanel ? 'entity-index__filter-toggle--active' : ''}`}
            >
              <Filter size={16} />
              Filters
              {hasActiveFilters && (
                <span className="entity-index__filter-count">
                  {selectedTypes.length + selectedTags.length + selectedSeverity.length}
                </span>
              )}
            </button>
          )}

          {showViewToggle && (
            <div className="entity-index__view-toggle">
              <button
                onClick={() => setViewMode('table')}
                className={viewMode === 'table' ? 'active' : ''}
                title="Table view"
              >
                <Table size={16} />
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={viewMode === 'cards' ? 'active' : ''}
                title="Cards view"
              >
                <Grid size={16} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={viewMode === 'list' ? 'active' : ''}
                title="List view"
              >
                <List size={16} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Filter panel */}
      {showFilterPanel && showFilters && (
        <div className="entity-index__filter-panel">
          <div className="entity-index__filter-section">
            <h4>Type</h4>
            <div className="entity-index__filter-options">
              {availableTypes.map(t => (
                <label key={t} className="entity-index__filter-option">
                  <input
                    type="checkbox"
                    checked={selectedTypes.includes(t)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedTypes([...selectedTypes, t]);
                      } else {
                        setSelectedTypes(selectedTypes.filter(x => x !== t));
                      }
                    }}
                  />
                  {t.replace(/-/g, ' ')}
                </label>
              ))}
            </div>
          </div>

          <div className="entity-index__filter-section">
            <h4>Severity</h4>
            <div className="entity-index__filter-options">
              {['catastrophic', 'high', 'medium', 'low'].map(s => (
                <label key={s} className="entity-index__filter-option">
                  <input
                    type="checkbox"
                    checked={selectedSeverity.includes(s)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedSeverity([...selectedSeverity, s]);
                      } else {
                        setSelectedSeverity(selectedSeverity.filter(x => x !== s));
                      }
                    }}
                  />
                  {s}
                </label>
              ))}
            </div>
          </div>

          <div className="entity-index__filter-section">
            <h4>Tags</h4>
            <div className="entity-index__filter-tags">
              {topTags.map(({ tag }) => (
                <button
                  key={tag}
                  onClick={() => {
                    if (selectedTags.includes(tag)) {
                      setSelectedTags(selectedTags.filter(t => t !== tag));
                    } else {
                      setSelectedTags([...selectedTags, tag]);
                    }
                  }}
                  className={`entity-index__filter-tag ${selectedTags.includes(tag) ? 'entity-index__filter-tag--selected' : ''}`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {hasActiveFilters && (
            <button onClick={clearFilters} className="entity-index__clear-filters">
              <X size={14} /> Clear all filters
            </button>
          )}
        </div>
      )}

      {/* Results count */}
      <div className="entity-index__results-info">
        Showing {filteredEntities.length} of {allEntities.length} entities
      </div>

      {/* Table view */}
      {viewMode === 'table' && (
        <div className="entity-index__table-wrapper">
          <table className="entity-index__table">
            <thead>
              <tr>
                {columns.includes('title') && (
                  <th onClick={() => handleSort('title')} className="sortable">
                    Title <SortIcon field="title" />
                  </th>
                )}
                {columns.includes('type') && (
                  <th onClick={() => handleSort('type')} className="sortable">
                    Type <SortIcon field="type" />
                  </th>
                )}
                {columns.includes('description') && <th>Description</th>}
                {columns.includes('severity') && (
                  <th onClick={() => handleSort('severity')} className="sortable">
                    Severity <SortIcon field="severity" />
                  </th>
                )}
                {columns.includes('tags') && <th>Tags</th>}
                {columns.includes('lastUpdated') && (
                  <th onClick={() => handleSort('lastUpdated')} className="sortable">
                    Updated <SortIcon field="lastUpdated" />
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {filteredEntities.map((entity) => (
                <tr key={entity.id}>
                  {columns.includes('title') && (
                    <td>
                      <a href={getEntityHref(entity.id, entity.type)} className="entity-index__link">
                        {entity.title}
                      </a>
                    </td>
                  )}
                  {columns.includes('type') && (
                    <td><TypeBadge type={entity.type} /></td>
                  )}
                  {columns.includes('description') && (
                    <td className="entity-index__description">
                      {entity.description?.slice(0, 100)}
                      {entity.description && entity.description.length > 100 && '...'}
                    </td>
                  )}
                  {columns.includes('severity') && (
                    <td><SeverityBadge severity={entity.severity} /></td>
                  )}
                  {columns.includes('tags') && (
                    <td className="entity-index__tags-cell">
                      {entity.tags?.slice(0, 3).map(tag => (
                        <span key={tag} className="entity-index__tag">{tag}</span>
                      ))}
                      {entity.tags && entity.tags.length > 3 && (
                        <span className="entity-index__tag-more">+{entity.tags.length - 3}</span>
                      )}
                    </td>
                  )}
                  {columns.includes('lastUpdated') && (
                    <td className="entity-index__date">{entity.lastUpdated || '—'}</td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Cards view */}
      {viewMode === 'cards' && (
        <div className="entity-index__cards">
          {filteredEntities.map((entity) => (
            <a
              key={entity.id}
              href={getEntityHref(entity.id, entity.type)}
              className="entity-index__card"
            >
              <div className="entity-index__card-header">
                <TypeBadge type={entity.type} />
                {entity.severity && <SeverityBadge severity={entity.severity} />}
              </div>
              <h3 className="entity-index__card-title">{entity.title}</h3>
              {entity.description && (
                <p className="entity-index__card-description">
                  {entity.description.slice(0, 120)}
                  {entity.description.length > 120 && '...'}
                </p>
              )}
              {entity.tags && entity.tags.length > 0 && (
                <div className="entity-index__card-tags">
                  {entity.tags.slice(0, 3).map(tag => (
                    <span key={tag} className="entity-index__tag">{tag}</span>
                  ))}
                </div>
              )}
            </a>
          ))}
        </div>
      )}

      {/* List view */}
      {viewMode === 'list' && (
        <ul className="entity-index__list">
          {filteredEntities.map((entity) => (
            <li key={entity.id} className="entity-index__list-item">
              <a href={getEntityHref(entity.id, entity.type)} className="entity-index__list-link">
                <span className="entity-index__list-title">{entity.title}</span>
                <TypeBadge type={entity.type} />
              </a>
              {entity.description && (
                <p className="entity-index__list-description">
                  {entity.description.slice(0, 150)}
                  {entity.description.length > 150 && '...'}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}

      {filteredEntities.length === 0 && (
        <div className="entity-index__empty">
          <p>No entities found matching your criteria.</p>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="entity-index__clear-filters">
              Clear filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default EntityIndex;
