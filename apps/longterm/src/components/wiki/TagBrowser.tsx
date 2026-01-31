/**
 * TagBrowser Component
 *
 * Displays tags as a clickable cloud or list.
 * Can filter entities by tag or navigate to tag pages.
 */

"use client";

import React, { useState, useMemo } from 'react';
import { getAllTags, getEntitiesByTag } from '@data';
import { Tag, ChevronDown, ChevronUp, X } from 'lucide-react';

interface TagBrowserProps {
  mode?: 'cloud' | 'list' | 'compact';
  maxTags?: number;
  showCounts?: boolean;
  onTagSelect?: (tag: string) => void;
  selectedTags?: string[];
  filterByType?: string;
}

export function TagBrowser({
  mode = 'cloud',
  maxTags = 50,
  showCounts = true,
  onTagSelect,
  selectedTags = [],
  filterByType,
}: TagBrowserProps) {
  const [expanded, setExpanded] = useState(false);
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const allTags = useMemo(() => getAllTags(), []);

  // If filtering by type, only show tags that have entities of that type
  const filteredTags = useMemo(() => {
    if (!filterByType) return allTags;
    return allTags.filter(({ tag }) => {
      const entities = getEntitiesByTag(tag);
      return entities.some(e => e.type === filterByType);
    });
  }, [allTags, filterByType]);

  const displayTags = expanded ? filteredTags : filteredTags.slice(0, maxTags);
  const hasMore = filteredTags.length > maxTags;

  // Size based on count for cloud mode
  const maxCount = filteredTags[0]?.count || 1;
  const getSize = (count: number) => {
    const ratio = count / maxCount;
    if (ratio > 0.7) return 'lg';
    if (ratio > 0.4) return 'md';
    if (ratio > 0.2) return 'sm';
    return 'xs';
  };

  const handleTagClick = (tag: string) => {
    if (onTagSelect) {
      onTagSelect(tag);
    } else {
      setActiveTag(activeTag === tag ? null : tag);
    }
  };

  const activeTagEntities = activeTag ? getEntitiesByTag(activeTag) : [];

  if (mode === 'compact') {
    return (
      <div className="tag-browser tag-browser--compact">
        <div className="tag-browser__tags">
          {displayTags.slice(0, 10).map(({ tag, count }) => (
            <button
              key={tag}
              onClick={() => handleTagClick(tag)}
              className={`tag-browser__tag ${selectedTags.includes(tag) ? 'tag-browser__tag--selected' : ''}`}
            >
              {tag}
              {showCounts && <span className="tag-browser__count">{count}</span>}
            </button>
          ))}
          {filteredTags.length > 10 && (
            <span className="tag-browser__more">+{filteredTags.length - 10}</span>
          )}
        </div>
      </div>
    );
  }

  if (mode === 'list') {
    return (
      <div className="tag-browser tag-browser--list">
        <ul className="tag-browser__list">
          {displayTags.map(({ tag, count }) => (
            <li key={tag} className="tag-browser__list-item">
              <button
                onClick={() => handleTagClick(tag)}
                className={`tag-browser__tag ${selectedTags.includes(tag) ? 'tag-browser__tag--selected' : ''}`}
              >
                <Tag size={14} className="tag-browser__icon" />
                <span className="tag-browser__label">{tag}</span>
                {showCounts && <span className="tag-browser__count">{count}</span>}
              </button>
            </li>
          ))}
        </ul>
        {hasMore && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="tag-browser__expand"
          >
            {expanded ? (
              <>Show less <ChevronUp size={16} /></>
            ) : (
              <>Show all {filteredTags.length} tags <ChevronDown size={16} /></>
            )}
          </button>
        )}
      </div>
    );
  }

  // Cloud mode (default)
  return (
    <div className="tag-browser tag-browser--cloud">
      <div className="tag-browser__cloud">
        {displayTags.map(({ tag, count }) => (
          <button
            key={tag}
            onClick={() => handleTagClick(tag)}
            className={`tag-browser__tag tag-browser__tag--${getSize(count)} ${
              selectedTags.includes(tag) ? 'tag-browser__tag--selected' : ''
            } ${activeTag === tag ? 'tag-browser__tag--active' : ''}`}
          >
            {tag}
            {showCounts && <span className="tag-browser__count">{count}</span>}
          </button>
        ))}
      </div>

      {hasMore && !expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="tag-browser__expand"
        >
          Show all {filteredTags.length} tags <ChevronDown size={16} />
        </button>
      )}

      {/* Inline expansion showing entities for selected tag */}
      {activeTag && activeTagEntities.length > 0 && (
        <div className="tag-browser__expansion">
          <div className="tag-browser__expansion-header">
            <h4>
              <Tag size={14} />
              {activeTag}
              <span className="tag-browser__expansion-count">
                {activeTagEntities.length} {activeTagEntities.length === 1 ? 'article' : 'articles'}
              </span>
            </h4>
            <button onClick={() => setActiveTag(null)} className="tag-browser__close">
              <X size={16} />
            </button>
          </div>
          <ul className="tag-browser__expansion-list">
            {activeTagEntities.slice(0, 10).map((entity) => (
              <li key={entity.id}>
                <a href={entity.href}>{entity.title}</a>
                <span className="tag-browser__entity-type">{entity.type}</span>
              </li>
            ))}
            {activeTagEntities.length > 10 && (
              <li className="tag-browser__expansion-more">
                And {activeTagEntities.length - 10} more...
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

export default TagBrowser;
