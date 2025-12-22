import React from 'react';
import './wiki.css';

interface Source {
  title: string;
  url?: string;
  author?: string;
  date?: string;
}

interface SourcesProps {
  sources: (string | Source)[];
}

export function Sources({ sources }: SourcesProps) {
  return (
    <div className="wiki-sources">
      <div className="wiki-sources__title">Sources & References</div>
      <ul className="wiki-sources__list">
        {sources.map((source, index) => {
          if (typeof source === 'string') {
            return <li key={index}>{source}</li>;
          }
          return (
            <li key={index}>
              {source.url ? (
                <a href={source.url} target="_blank" rel="noopener noreferrer">
                  {source.title}
                </a>
              ) : (
                source.title
              )}
              {source.author && ` - ${source.author}`}
              {source.date && ` (${source.date})`}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default Sources;
