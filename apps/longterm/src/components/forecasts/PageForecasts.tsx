/**
 * PageForecasts Component
 *
 * Displays all relevant forecasts for the current wiki page.
 * Reads from static page-forecasts.yaml data.
 *
 * Usage:
 *   <PageForecasts pageSlug="knowledge-base/risks/misuse/bioweapons" />
 *   <PageForecasts pageSlug="current-page" limit={3} />
 */

import { useState, useEffect } from 'react';
import { ForecastCard } from './ForecastCard';

interface PageForecast {
  id: string;
  title: string;
  url: string;
  platform: string;
  stars: number;
  relevance: number;
  discoveredVia: string;
}

interface PageForecastsProps {
  pageSlug: string;
  limit?: number;
  minRelevance?: number;
  showRelevance?: boolean;
}

export function PageForecasts({
  pageSlug,
  limit = 5,
  minRelevance = 0.5,
  showRelevance = false
}: PageForecastsProps) {
  const [forecasts, setForecasts] = useState<PageForecast[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch static page-forecasts data
    fetch('/data/page-forecasts.json')
      .then(res => {
        if (!res.ok) throw new Error('Failed to load page forecasts');
        return res.json();
      })
      .then(data => {
        const pageData = data[pageSlug];

        if (!pageData || !pageData.forecasts) {
          setForecasts([]);
        } else {
          // Filter by relevance and apply limit
          const filtered = pageData.forecasts
            .filter((f: PageForecast) => f.relevance >= minRelevance)
            .slice(0, limit);

          setForecasts(filtered);
        }
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [pageSlug, limit, minRelevance]);

  if (loading) {
    return (
      <div className="page-forecasts loading">
        <h3>Related Forecasts</h3>
        <div className="animate-pulse space-y-4">
          <div className="h-24 bg-gray-200 rounded"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return null; // Fail silently - forecasts are optional
  }

  if (forecasts.length === 0) {
    return null; // No forecasts = don't show section
  }

  return (
    <div className="page-forecasts not-content">
      <h3>Related Forecasts</h3>
      <p className="forecasts-description">
        Community predictions from Metaculus, Manifold Markets, and other forecasting platforms:
      </p>

      <div className="forecasts-grid">
        {forecasts.map(forecast => (
          <div key={forecast.id} className="forecast-wrapper">
            <ForecastCard id={forecast.id} />
            {showRelevance && (
              <div className="relevance-badge">
                Relevance: {(forecast.relevance * 100).toFixed(0)}%
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="forecasts-footer">
        <a
          href="https://metaforecast.org"
          target="_blank"
          rel="noopener noreferrer"
          className="metaforecast-link"
        >
          Browse more forecasts on Metaforecast →
        </a>
      </div>
    </div>
  );
}
