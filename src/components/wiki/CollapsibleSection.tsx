import React, { useState } from 'react';
import './wiki.css';

interface CollapsibleSectionProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  badge?: string;
}

export function CollapsibleSection({
  title,
  defaultOpen = false,
  children,
  badge,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={`collapsible-section ${isOpen ? 'collapsible-section--open' : ''}`}>
      <button
        className="collapsible-section__header"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="collapsible-section__toggle">
          {isOpen ? '▼' : '▶'}
        </span>
        <span className="collapsible-section__title">{title}</span>
        {badge && <span className="collapsible-section__badge">{badge}</span>}
      </button>
      {isOpen && (
        <div className="collapsible-section__content">
          {children}
        </div>
      )}
    </div>
  );
}

export default CollapsibleSection;
