import React from 'react';
import './wiki.css';

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

export function Section({ title, children }: SectionProps) {
  return (
    <div className="wiki-section">
      <div className="wiki-section__title">{title}</div>
      {children}
    </div>
  );
}

export default Section;
