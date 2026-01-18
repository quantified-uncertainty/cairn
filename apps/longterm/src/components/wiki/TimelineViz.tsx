import React, { useState } from 'react';
import { Card } from '../ui/card';
import { cn } from '../../lib/utils';

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

const categoryStyles: Record<string, { bg: string; border: string; text: string; label: string }> = {
  capability: { bg: 'bg-blue-100 dark:bg-blue-900/30', border: 'border-blue-500', text: 'text-blue-600 dark:text-blue-400', label: 'Capability' },
  safety: { bg: 'bg-green-100 dark:bg-green-900/30', border: 'border-green-500', text: 'text-green-600 dark:text-green-400', label: 'Safety' },
  governance: { bg: 'bg-amber-100 dark:bg-amber-900/30', border: 'border-amber-500', text: 'text-amber-600 dark:text-amber-400', label: 'Governance' },
  prediction: { bg: 'bg-indigo-100 dark:bg-indigo-900/30', border: 'border-indigo-500', text: 'text-indigo-600 dark:text-indigo-400', label: 'Prediction' },
  incident: { bg: 'bg-red-100 dark:bg-red-900/30', border: 'border-red-500', text: 'text-red-600 dark:text-red-400', label: 'Incident' },
};

const markerColors: Record<string, string> = {
  capability: 'bg-blue-500',
  safety: 'bg-green-500',
  governance: 'bg-amber-500',
  prediction: 'bg-indigo-500',
  incident: 'bg-red-500',
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
    <Card className="my-6 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-500 to-purple-700 text-white font-semibold">
        <span>📅</span>
        <span>{title}</span>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="flex flex-wrap gap-2 p-4 border-b border-border">
          {Object.entries(categoryStyles).map(([key, style]) => (
            <button
              key={key}
              className={cn(
                "px-3 py-1 text-sm font-medium rounded border-2 transition-colors",
                style.border,
                selectedCategories.has(key)
                  ? `${style.bg} ${style.text}`
                  : "bg-transparent text-muted-foreground opacity-50"
              )}
              onClick={() => toggleCategory(key)}
            >
              {style.label}
            </button>
          ))}
        </div>
      )}

      {/* Timeline content */}
      <div className="relative py-6 px-4">
        {/* Vertical timeline line */}
        <div className="absolute left-[70px] top-6 bottom-6 w-0.5 bg-border" />

        {sortedEvents.map((event, i) => {
          const style = categoryStyles[event.category];
          return (
            <div
              key={i}
              className={cn(
                "relative flex gap-4 mb-6 last:mb-0",
                event.importance === 'high' && "scale-[1.02]",
                event.importance === 'low' && "opacity-80"
              )}
            >
              {/* Date */}
              <div className="w-[55px] flex-shrink-0 text-right text-sm text-muted-foreground font-medium pt-1">
                {event.date}
              </div>

              {/* Marker dot */}
              <div className={cn(
                "w-3 h-3 rounded-full flex-shrink-0 mt-1.5 z-10 ring-2 ring-background",
                markerColors[event.category]
              )} />

              {/* Event card */}
              <div className={cn("flex-1 pl-3 border-l-3", style.border)} style={{ borderLeftWidth: '3px' }}>
                <span className={cn("inline-block px-2 py-0.5 text-xs font-medium rounded mb-1", style.bg, style.text)}>
                  {style.label}
                </span>
                <h4 className="text-base font-semibold text-foreground m-0">
                  {event.link ? (
                    <a
                      href={event.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-foreground no-underline hover:text-accent-foreground hover:underline"
                    >
                      {event.title}
                    </a>
                  ) : (
                    event.title
                  )}
                </h4>
                {event.description && (
                  <p className="mt-1 mb-0 text-sm text-muted-foreground">{event.description}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

export default TimelineViz;
