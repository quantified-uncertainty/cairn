import React from 'react';

interface Source {
  title: string;
  url?: string;
  author?: string;
  date?: string;
}

interface SourcesProps {
  sources: (string | Source)[];
}

type SourceType = 'arxiv' | 'lesswrong' | 'book' | 'company' | 'other';

function getSourceType(url?: string): SourceType {
  if (!url) return 'book';

  const lowerUrl = url.toLowerCase();

  if (lowerUrl.includes('arxiv.org')) return 'arxiv';
  if (lowerUrl.includes('lesswrong.com') || lowerUrl.includes('alignmentforum.org')) return 'lesswrong';
  if (lowerUrl.includes('amazon.com/') || lowerUrl.includes('books.google.com')) return 'book';
  if (
    lowerUrl.includes('anthropic.com') ||
    lowerUrl.includes('openai.com') ||
    lowerUrl.includes('deepmind.com') ||
    lowerUrl.includes('deepmind.google')
  )
    return 'company';

  return 'other';
}

function getSourceTypeLabel(type: SourceType): string {
  switch (type) {
    case 'arxiv':
      return 'ArXiv Paper';
    case 'lesswrong':
      return 'LessWrong / Alignment Forum';
    case 'book':
      return 'Book';
    case 'company':
      return 'Company Blog';
    case 'other':
      return 'External Link';
  }
}

function SourceIcon({ type }: { type: SourceType }) {
  switch (type) {
    case 'arxiv':
      // Document/paper icon
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <line x1="10" y1="9" x2="8" y2="9" />
        </svg>
      );
    case 'lesswrong':
      // Pencil/writing icon
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
        </svg>
      );
    case 'book':
      // Book icon
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      );
    case 'company':
      // Building icon
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
          <line x1="9" y1="22" x2="9" y2="2" />
          <line x1="14" y1="22" x2="14" y2="2" />
          <line x1="4" y1="12" x2="20" y2="12" />
        </svg>
      );
    case 'other':
    default:
      // External link icon
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          <polyline points="15 3 21 3 21 9" />
          <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
      );
  }
}

export function Sources({ sources }: SourcesProps) {
  return (
    <div className="my-8 p-4 bg-muted rounded-lg">
      <div className="text-sm font-semibold text-muted-foreground mb-3">Sources & References</div>
      <ul className="m-0 pl-5 space-y-1.5">
        {sources.map((source, index) => {
          if (typeof source === 'string') {
            const type = getSourceType(undefined);
            return (
              <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="w-4 h-4 flex-shrink-0 mt-0.5" title={getSourceTypeLabel(type)}>
                  <SourceIcon type={type} />
                </span>
                <span>{source}</span>
              </li>
            );
          }
          const type = getSourceType(source.url);
          return (
            <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
              <span className="w-4 h-4 flex-shrink-0 mt-0.5" title={getSourceTypeLabel(type)}>
                <SourceIcon type={type} />
              </span>
              <span>
                {source.url ? (
                  <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-accent-foreground hover:underline">
                    {source.title}
                  </a>
                ) : (
                  source.title
                )}
                {source.author && ` - ${source.author}`}
                {source.date && ` (${source.date})`}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default Sources;
