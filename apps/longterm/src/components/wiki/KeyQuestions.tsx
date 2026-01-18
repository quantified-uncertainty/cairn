import React from 'react';
import { Card } from '../ui/card';
import { cn } from '../../lib/utils';

interface Question {
  question: string;
  currentEstimate?: string;
  confidence?: 'low' | 'medium' | 'high';
  importance?: 'low' | 'medium' | 'high' | 'critical';
  cruxFor?: string[];
  evidenceLinks?: { label: string; url: string }[];
  updatesOn?: string;
}

interface KeyQuestionsProps {
  questions: (Question | string)[];
  title?: string;
}

function normalizeQuestion(q: Question | string): Question {
  return typeof q === 'string' ? { question: q } : q;
}

const confidenceColors = {
  low: { text: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500' },
  medium: { text: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500' },
  high: { text: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500' },
};

const importanceLabels = {
  low: '○',
  medium: '◐',
  high: '●',
  critical: '★',
};

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide mr-2">
      {children}
    </span>
  );
}

export function KeyQuestions({ questions, title = "Key Questions" }: KeyQuestionsProps) {
  return (
    <div className="my-6">
      <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
        <span>❓</span>
        {title}
      </h3>

      <div className="flex flex-col gap-3">
        {questions.map((item, i) => {
          const q = normalizeQuestion(item);
          const conf = q.confidence ? confidenceColors[q.confidence] : null;

          return (
            <Card key={i} className="p-4 hover:shadow-md transition-shadow">
              {/* Question header */}
              <div className="flex items-start gap-2">
                {q.importance && (
                  <span
                    className="text-amber-500 font-bold flex-shrink-0"
                    title={`Importance: ${q.importance}`}
                  >
                    {importanceLabels[q.importance]}
                  </span>
                )}
                <span className="font-medium text-foreground">{q.question}</span>
              </div>

              {/* Current estimate */}
              {q.currentEstimate && (
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  <Label>Current estimate:</Label>
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded border text-sm font-medium",
                      conf ? `${conf.bg} ${conf.border}` : "bg-muted border-border"
                    )}
                  >
                    {q.currentEstimate}
                  </span>
                  {q.confidence && conf && (
                    <span className={cn("text-xs font-medium", conf.text)}>
                      {q.confidence} confidence
                    </span>
                  )}
                </div>
              )}

              {/* Crux for */}
              {q.cruxFor && q.cruxFor.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  <Label>Crux for:</Label>
                  {q.cruxFor.map((crux, j) => (
                    <span
                      key={j}
                      className="px-2 py-0.5 bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 text-xs rounded"
                    >
                      {crux}
                    </span>
                  ))}
                </div>
              )}

              {/* Updates on */}
              {q.updatesOn && (
                <div className="flex items-start gap-2 mt-3">
                  <Label>Would update on:</Label>
                  <span className="text-sm text-muted-foreground">{q.updatesOn}</span>
                </div>
              )}

              {/* Evidence links */}
              {q.evidenceLinks && q.evidenceLinks.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  <Label>Evidence:</Label>
                  {q.evidenceLinks.map((link, j) => (
                    <a
                      key={j}
                      href={link.url}
                      className="text-sm text-accent-foreground no-underline hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {link.label}
                    </a>
                  ))}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export default KeyQuestions;
