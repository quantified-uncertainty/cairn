import React, { useState, useMemo } from 'react';
import { resources, getResourceCredibility, getResourcePublication } from '../../data';
import type { Resource } from '../../data/schema';
import { CredibilityBadge } from './CredibilityBadge';
import { ResourceTags } from './ResourceTags';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { cn } from '../../lib/utils';
import { getResourceTypeLabel, getResourceTypeIcon, resourceTypeBadgeColors } from './shared/style-config';

interface ResourcesIndexProps {
  showSearch?: boolean;
  showFilters?: boolean;
  defaultType?: string;
  showCredibility?: boolean;
  showTags?: boolean;
  showContent?: boolean;
}

/**
 * Get content status for a resource
 */
function getContentStatus(resource: Resource): { level: 'full' | 'partial' | 'metadata' | 'none'; label: string; color: string } {
  const hasLocalFile = !!resource.local_filename;
  const hasSummary = !!resource.summary;
  const hasReview = !!resource.review;
  const hasAbstract = !!resource.abstract;
  const hasKeyPoints = resource.key_points && resource.key_points.length > 0;

  if (hasLocalFile && hasReview && hasKeyPoints) {
    return { level: 'full', label: 'Full', color: '#2e7d32' };
  }
  if (hasSummary || hasAbstract) {
    return { level: 'partial', label: 'Summary', color: '#1976d2' };
  }
  if (resource.authors?.length || resource.published_date) {
    return { level: 'metadata', label: 'Metadata', color: '#f57c00' };
  }
  return { level: 'none', label: 'None', color: '#9e9e9e' };
}


export function ResourcesIndex({
  showSearch = true,
  showFilters = true,
  defaultType,
  showCredibility = true,
  showTags = true,
  showContent = true,
}: ResourcesIndexProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>(defaultType || 'all');
  const [selectedCredibility, setSelectedCredibility] = useState<string>('all');
  const [selectedContent, setSelectedContent] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'title' | 'date' | 'type' | 'credibility' | 'content'>('title');

  // Get unique types for filter
  const types = useMemo(() => {
    const typeSet = new Set(resources.map((r) => r.type));
    return Array.from(typeSet).sort();
  }, []);

  // Filter and sort resources
  const filteredResources = useMemo(() => {
    let result = [...resources];

    // Filter by type
    if (selectedType !== 'all') {
      result = result.filter((r) => r.type === selectedType);
    }

    // Filter by credibility
    if (selectedCredibility !== 'all') {
      const level = parseInt(selectedCredibility);
      result = result.filter((r) => getResourceCredibility(r) === level);
    }

    // Filter by content status
    if (selectedContent !== 'all') {
      result = result.filter((r) => getContentStatus(r).level === selectedContent);
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          r.title.toLowerCase().includes(query) ||
          r.authors?.some((a) => a.toLowerCase().includes(query)) ||
          r.summary?.toLowerCase().includes(query) ||
          r.tags?.some((t) => t.toLowerCase().includes(query))
      );
    }

    // Sort
    const contentOrder = { full: 0, partial: 1, metadata: 2, none: 3 };
    result.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return (b.published_date || '').localeCompare(a.published_date || '');
        case 'type':
          return a.type.localeCompare(b.type);
        case 'credibility':
          return (getResourceCredibility(b) || 0) - (getResourceCredibility(a) || 0);
        case 'content':
          return contentOrder[getContentStatus(a).level] - contentOrder[getContentStatus(b).level];
        case 'title':
        default:
          return a.title.localeCompare(b.title);
      }
    });

    return result;
  }, [searchQuery, selectedType, selectedCredibility, selectedContent, sortBy]);

  // Group by type for summary
  const typeStats = useMemo(() => {
    const stats: Record<string, number> = {};
    for (const r of resources) {
      stats[r.type] = (stats[r.type] || 0) + 1;
    }
    return stats;
  }, []);

  // Content stats
  const contentStats = useMemo(() => {
    const stats = { full: 0, partial: 0, metadata: 0, none: 0 };
    for (const r of resources) {
      stats[getContentStatus(r).level]++;
    }
    return stats;
  }, []);

  const selectClass = "h-9 px-3 py-1 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className="my-4">
      {/* Stats summary */}
      <div className="flex flex-wrap items-center gap-4 mb-4 p-4 bg-muted/50 rounded-lg">
        <span className="font-semibold text-lg">{resources.length} resources</span>
        <span className="flex flex-wrap gap-3 text-sm text-muted-foreground">
          {Object.entries(typeStats)
            .sort((a, b) => b[1] - a[1])
            .map(([type, count]) => (
              <span key={type}>
                {getResourceTypeIcon(type)} {count} {getResourceTypeLabel(type).toLowerCase()}s
              </span>
            ))}
        </span>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        {showSearch && (
          <input
            type="text"
            placeholder="Search resources..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 h-9 px-3 py-1 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
        )}

        {showFilters && (
          <div className="flex flex-wrap gap-2">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className={selectClass}
            >
              <option value="all">All Types</option>
              {types.map((type) => (
                <option key={type} value={type}>
                  {getResourceTypeLabel(type)} ({typeStats[type]})
                </option>
              ))}
            </select>

            {showCredibility && (
              <select
                value={selectedCredibility}
                onChange={(e) => setSelectedCredibility(e.target.value)}
                className={selectClass}
              >
                <option value="all">All Credibility</option>
                <option value="5">★★★★★ Gold (5)</option>
                <option value="4">★★★★☆ High (4)</option>
                <option value="3">★★★☆☆ Good (3)</option>
                <option value="2">★★☆☆☆ Mixed (2)</option>
                <option value="1">★☆☆☆☆ Low (1)</option>
              </select>
            )}

            {showContent && (
              <select
                value={selectedContent}
                onChange={(e) => setSelectedContent(e.target.value)}
                className={selectClass}
              >
                <option value="all">All Content ({resources.length})</option>
                <option value="full">Full ({contentStats.full})</option>
                <option value="partial">Summary ({contentStats.partial})</option>
                <option value="metadata">Metadata ({contentStats.metadata})</option>
                <option value="none">None ({contentStats.none})</option>
              </select>
            )}

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className={selectClass}
            >
              <option value="title">Sort by Title</option>
              <option value="date">Sort by Date</option>
              <option value="type">Sort by Type</option>
              <option value="credibility">Sort by Credibility</option>
              <option value="content">Sort by Content</option>
            </select>
          </div>
        )}
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground mb-3">
        Showing {filteredResources.length} of {resources.length} resources
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Title</TableHead>
              {showCredibility && <TableHead>Credibility</TableHead>}
              {showContent && <TableHead>Content</TableHead>}
              <TableHead>Authors</TableHead>
              <TableHead>Date</TableHead>
              {showTags && <TableHead>Tags</TableHead>}
              <TableHead>Cited By</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredResources.map((resource) => {
              const credibility = getResourceCredibility(resource);
              const publication = getResourcePublication(resource);
              const contentStatus = getContentStatus(resource);
              return (
                <TableRow key={resource.id}>
                  <TableCell>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded whitespace-nowrap",
                        resourceTypeBadgeColors[resource.type] || "bg-muted text-foreground"
                      )}
                      title={getResourceTypeLabel(resource.type)}
                    >
                      {getResourceTypeIcon(resource.type)} {getResourceTypeLabel(resource.type)}
                    </span>
                  </TableCell>
                  <TableCell className="max-w-md">
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent-foreground font-medium no-underline hover:underline"
                    >
                      {resource.title}
                    </a>
                    {publication && (
                      <span className="block text-[11px] text-muted-foreground italic">
                        {publication.name}
                      </span>
                    )}
                    {resource.summary && (
                      <p className="mt-1 mb-0 text-xs text-muted-foreground line-clamp-2">
                        {resource.summary}
                      </p>
                    )}
                  </TableCell>
                  {showCredibility && (
                    <TableCell>
                      {credibility ? (
                        <CredibilityBadge level={credibility} size="sm" />
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  )}
                  {showContent && (
                    <TableCell>
                      <span
                        className="inline-block text-[10px] px-1.5 py-0.5 rounded font-medium"
                        style={{
                          backgroundColor: `${contentStatus.color}20`,
                          color: contentStatus.color,
                        }}
                        title={
                          contentStatus.level === 'full' ? 'Downloaded, reviewed, with key points' :
                          contentStatus.level === 'partial' ? 'Has summary or abstract' :
                          contentStatus.level === 'metadata' ? 'Has author/date but no content' :
                          'No content fetched'
                        }
                      >
                        {contentStatus.label}
                      </span>
                    </TableCell>
                  )}
                  <TableCell className="text-sm text-muted-foreground max-w-[150px] truncate">
                    {resource.authors?.join(', ') || '—'}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {resource.published_date || '—'}
                  </TableCell>
                  {showTags && (
                    <TableCell>
                      {resource.tags && resource.tags.length > 0 ? (
                        <ResourceTags tags={resource.tags} limit={2} size="sm" />
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  )}
                  <TableCell className="text-sm">
                    {resource.cited_by && resource.cited_by.length > 0 ? (
                      <span title={resource.cited_by.join(', ')}>
                        {resource.cited_by.length} article{resource.cited_by.length !== 1 ? 's' : ''}
                      </span>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell>
                    <a
                      href={`/browse/resources/${resource.id}/`}
                      className="inline-block px-2 py-1 text-[11px] rounded bg-accent-foreground text-background no-underline whitespace-nowrap hover:opacity-90"
                    >
                      View →
                    </a>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {filteredResources.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No resources found matching your criteria.
        </div>
      )}
    </div>
  );
}

export default ResourcesIndex;
