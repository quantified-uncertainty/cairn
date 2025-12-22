import React, { useState } from 'react';
import './wiki.css';

interface TimelineEvent {
  date: string;
  title: string;
  description?: string;
  category: 'capability' | 'safety' | 'governance' | 'prediction' | 'incident';
  importance?: 'low' | 'medium' | 'high';
  link?: string;
}

interface TimelineVizProps {
  title?: string;
  events: TimelineEvent[];
  showFilters?: boolean;
}

const categoryColors: Record<string, { bg: string; border: string; label: string }> = {
  capability: { bg: '#dbeafe', border: '#3b82f6', label: 'Capability' },
  safety: { bg: '#dcfce7', border: '#22c55e', label: 'Safety' },
  governance: { bg: '#fef3c7', border: '#f59e0b', label: 'Governance' },
  prediction: { bg: '#e0e7ff', border: '#6366f1', label: 'Prediction' },
  incident: { bg: '#fee2e2', border: '#ef4444', label: 'Incident' },
};

export function TimelineViz({ title = "AI Timeline", events, showFilters = true }: TimelineVizProps) {
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(
    new Set(['capability', 'safety', 'governance', 'prediction', 'incident'])
  );

  const toggleCategory = (category: string) => {
    const newSet = new Set(selectedCategories);
    if (newSet.has(category)) {
      newSet.delete(category);
    } else {
      newSet.add(category);
    }
    setSelectedCategories(newSet);
  };

  const filteredEvents = events.filter(e => selectedCategories.has(e.category));
  const sortedEvents = [...filteredEvents].sort((a, b) =>
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return (
    <div className="timeline-viz">
      <div className="timeline-viz__header">
        <span className="timeline-viz__icon">📅</span>
        <span className="timeline-viz__title">{title}</span>
      </div>

      {showFilters && (
        <div className="timeline-viz__filters">
          {Object.entries(categoryColors).map(([key, { bg, border, label }]) => (
            <button
              key={key}
              className={`timeline-viz__filter ${selectedCategories.has(key) ? 'active' : ''}`}
              style={{
                backgroundColor: selectedCategories.has(key) ? bg : 'transparent',
                borderColor: border,
              }}
              onClick={() => toggleCategory(key)}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      <div className="timeline-viz__content">
        {sortedEvents.map((event, i) => {
          const colors = categoryColors[event.category];
          return (
            <div
              key={i}
              className={`timeline-viz__event timeline-viz__event--${event.importance || 'medium'}`}
            >
              <div className="timeline-viz__date">{event.date}</div>
              <div
                className="timeline-viz__marker"
                style={{ backgroundColor: colors.border }}
              />
              <div
                className="timeline-viz__card"
                style={{ borderLeftColor: colors.border }}
              >
                <span
                  className="timeline-viz__category"
                  style={{ backgroundColor: colors.bg, color: colors.border }}
                >
                  {colors.label}
                </span>
                <h4 className="timeline-viz__event-title">
                  {event.link ? (
                    <a href={event.link} target="_blank" rel="noopener noreferrer">
                      {event.title}
                    </a>
                  ) : (
                    event.title
                  )}
                </h4>
                {event.description && (
                  <p className="timeline-viz__description">{event.description}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default TimelineViz;
