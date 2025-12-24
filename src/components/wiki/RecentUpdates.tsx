/**
 * RecentUpdates Component
 *
 * Shows recently updated entities sorted by lastUpdated date.
 */

import React from 'react';
import { getRecentlyUpdated } from '../../data';
import { Clock, ArrowRight } from 'lucide-react';

interface RecentUpdatesProps {
  limit?: number;
  title?: string;
  showType?: boolean;
  compact?: boolean;
}

function formatDate(dateStr: string): string {
  // Format: YYYY-MM -> "Dec 2024"
  const [year, month] = dateStr.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

function TypeBadge({ type }: { type: string }) {
  return (
    <span className="recent-updates__type">
      {type.replace(/-/g, ' ')}
    </span>
  );
}

export function RecentUpdates({
  limit = 10,
  title = 'Recently Updated',
  showType = true,
  compact = false,
}: RecentUpdatesProps) {
  const updates = getRecentlyUpdated(limit);

  if (updates.length === 0) {
    return null;
  }

  if (compact) {
    return (
      <div className="recent-updates recent-updates--compact">
        <h4 className="recent-updates__title">
          <Clock size={14} />
          {title}
        </h4>
        <ul className="recent-updates__list">
          {updates.map((item) => (
            <li key={item.id} className="recent-updates__item">
              <a href={item.href} className="recent-updates__link">
                {item.title}
              </a>
              <span className="recent-updates__date">{formatDate(item.lastUpdated)}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="recent-updates">
      <div className="recent-updates__header">
        <h3 className="recent-updates__title">
          <Clock size={18} />
          {title}
        </h3>
      </div>

      <ul className="recent-updates__list">
        {updates.map((item) => (
          <li key={item.id} className="recent-updates__item">
            <a href={item.href} className="recent-updates__link">
              <span className="recent-updates__item-title">{item.title}</span>
              <ArrowRight size={14} className="recent-updates__arrow" />
            </a>
            <div className="recent-updates__meta">
              {showType && <TypeBadge type={item.type} />}
              <span className="recent-updates__date">{formatDate(item.lastUpdated)}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default RecentUpdates;
