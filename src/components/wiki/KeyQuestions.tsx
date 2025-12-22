import React from 'react';

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
  questions: Question[];
  title?: string;
}

const confidenceColors = {
  low: '#f59e0b',
  medium: '#3b82f6',
  high: '#10b981',
};

const importanceLabels = {
  low: '○',
  medium: '◐',
  high: '●',
  critical: '★',
};

export function KeyQuestions({ questions, title = "Key Questions" }: KeyQuestionsProps) {
  return (
    <div className="key-questions">
      <h3 className="key-questions-title">{title}</h3>

      <div className="questions-list">
        {questions.map((q, i) => (
          <div key={i} className="question-card">
            <div className="question-header">
              {q.importance && (
                <span
                  className="question-importance"
                  title={`Importance: ${q.importance}`}
                >
                  {importanceLabels[q.importance]}
                </span>
              )}
              <span className="question-text">{q.question}</span>
            </div>

            {q.currentEstimate && (
              <div className="question-estimate">
                <span className="estimate-label">Current estimate:</span>
                <span
                  className="estimate-value"
                  style={q.confidence ? {
                    borderColor: confidenceColors[q.confidence],
                    backgroundColor: `${confidenceColors[q.confidence]}15`
                  } : undefined}
                >
                  {q.currentEstimate}
                </span>
                {q.confidence && (
                  <span
                    className="confidence-badge"
                    style={{ color: confidenceColors[q.confidence] }}
                  >
                    {q.confidence} confidence
                  </span>
                )}
              </div>
            )}

            {q.cruxFor && q.cruxFor.length > 0 && (
              <div className="question-cruxes">
                <span className="crux-label">Crux for:</span>
                {q.cruxFor.map((crux, j) => (
                  <span key={j} className="crux-tag">{crux}</span>
                ))}
              </div>
            )}

            {q.updatesOn && (
              <div className="question-updates">
                <span className="updates-label">Would update on:</span>
                <span className="updates-text">{q.updatesOn}</span>
              </div>
            )}

            {q.evidenceLinks && q.evidenceLinks.length > 0 && (
              <div className="question-evidence">
                <span className="evidence-label">Evidence:</span>
                {q.evidenceLinks.map((link, j) => (
                  <a
                    key={j}
                    href={link.url}
                    className="evidence-link"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default KeyQuestions;
