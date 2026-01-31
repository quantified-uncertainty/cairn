import React from 'react';
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
  low: { text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/30' },
  medium: { text: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  high: { text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
};

export function KeyQuestions({ questions, title = "Key Questions" }: KeyQuestionsProps) {
  return (
    <div className="my-6 not-content">
      <details className="group" open>
        <summary className="cursor-pointer list-none flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-3">
          <svg
            className="w-4 h-4 transition-transform group-open:rotate-90"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          {title} ({questions.length})
        </summary>

        <ul className="space-y-2 ml-1 border-l-2 border-muted pl-4">
          {questions.map((item, i) => {
            const q = normalizeQuestion(item);
            const conf = q.confidence ? confidenceColors[q.confidence] : null;
            const hasDetails = q.currentEstimate || q.cruxFor?.length || q.updatesOn || q.evidenceLinks?.length;

            return (
              <li key={i} className="text-sm">
                <span className="text-foreground">{q.question}</span>

                {hasDetails && (
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    {q.currentEstimate && (
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded text-xs font-medium",
                          conf ? `${conf.bg} ${conf.text}` : "bg-muted text-muted-foreground"
                        )}
                      >
                        {q.currentEstimate}
                        {q.confidence && ` (${q.confidence})`}
                      </span>
                    )}
                    {q.cruxFor?.map((crux, j) => (
                      <span
                        key={j}
                        className="px-2 py-0.5 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 text-xs rounded"
                      >
                        {crux}
                      </span>
                    ))}
                    {q.evidenceLinks?.map((link, j) => (
                      <a
                        key={j}
                        href={link.url}
                        className="text-xs text-accent-foreground no-underline hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        [{link.label}]
                      </a>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </details>
    </div>
  );
}

export default KeyQuestions;
