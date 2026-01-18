import React from 'react';
import { resources } from '../../data';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

interface ArticleSourcesProps {
  entityId: string;
  title?: string;
}

function getResourceTypeIcon(type: string): string {
  const icons: Record<string, string> = {
    paper: '📄',
    book: '📚',
    blog: '✏️',
    report: '📋',
    talk: '🎤',
    podcast: '🎧',
    government: '🏛️',
    reference: '📖',
    web: '🔗',
  };
  return icons[type] || '🔗';
}

function getDomain(url: string | undefined | null): string {
  if (!url) return '';
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

/**
 * ArticleSources - Shows all external resources citing this article as a simple table
 */
export function ArticleSources({
  entityId,
  title = 'Sources & References',
}: ArticleSourcesProps) {
  const citingResources = resources.filter((r) => r.cited_by?.includes(entityId) && r.url);

  if (citingResources.length === 0) {
    return null;
  }

  const sorted = [...citingResources].sort((a, b) => a.title.localeCompare(b.title));

  return (
    <div className="mt-12 pt-8 border-t border-border">
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Resource</TableHead>
            <TableHead>Domain</TableHead>
            <TableHead>Links</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((resource) => (
            <TableRow key={resource.id}>
              <TableCell>
                <span className="mr-2">{getResourceTypeIcon(resource.type)}</span>
                {resource.title}
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {getDomain(resource.url)}
              </TableCell>
              <TableCell className="whitespace-nowrap">
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent-foreground no-underline hover:underline"
                >
                  Source
                </a>
                {' · '}
                <a
                  href={`/browse/resources/${resource.id}/`}
                  className="text-accent-foreground no-underline hover:underline"
                >
                  Notes
                </a>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default ArticleSources;
