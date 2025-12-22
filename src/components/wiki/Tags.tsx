import React from 'react';
import './wiki.css';

interface TagsProps {
  tags: string[];
}

export function Tags({ tags }: TagsProps) {
  return (
    <div className="wiki-tags">
      {tags.map((tag, index) => (
        <span key={index} className="wiki-tag">
          {tag}
        </span>
      ))}
    </div>
  );
}

export default Tags;
