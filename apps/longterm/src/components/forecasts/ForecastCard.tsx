/**
 * ForecastCard Component
 *
 * Displays a single forecast from Metaforecast with live probability updates.
 *
 * Usage:
 *   <ForecastCard id="metaculus-12345" />
 *   <ForecastCard id="manifold-abc123" showHistory />
 */

import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';

interface ForecastOption {
  name: string | null;
  probability: number | null;
}

interface ForecastData {
  id: string;
  title: string;
  url: string;
  platform: { label: string } | string;
  options: ForecastOption[];
  qualityIndicators?: {
    stars: number;
    numForecasters?: number;
  };
  stars?: number;
  numForecasters?: number;
  fetched?: string;
  lastUpdated?: string;
  _cached?: boolean;
  _cacheDate?: string;
}

interface ForecastCardProps {
  id: string;
  showHistory?: boolean;
  compact?: boolean;
}

export function ForecastCard({ id, showHistory = false, compact = false }: ForecastCardProps) {
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/forecasts/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setError(data.error);
        } else {
          setForecast(data);
        }
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="forecast-card loading">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (error || !forecast) {
    return (
      <div className="forecast-card error">
        <p className="text-sm text-red-600">Failed to load forecast: {error}</p>
      </div>
    );
  }

  const platform = typeof forecast.platform === 'string'
    ? forecast.platform
    : forecast.platform.label;

  const stars = forecast.qualityIndicators?.stars ?? forecast.stars ?? 0;
  const numForecasters = forecast.qualityIndicators?.numForecasters ?? forecast.numForecasters;

  const isCached = forecast._cached;
  const updateDate = forecast.fetched || forecast.lastUpdated || forecast._cacheDate;

  return (
    <div className={`forecast-card ${compact ? 'compact' : ''}`}>
      <div className="forecast-header">
        <a
          href={forecast.url}
          target="_blank"
          rel="noopener noreferrer"
          className="forecast-title"
        >
          {forecast.title}
        </a>
        <div className="forecast-meta">
          <span className="platform-badge">{platform}</span>
          {stars > 0 && (
            <span className="quality-badge">
              {'★'.repeat(stars)}{'☆'.repeat(5 - stars)}
            </span>
          )}
          {numForecasters && (
            <span className="forecasters-badge">
              {numForecasters} forecasters
            </span>
          )}
        </div>
      </div>

      <div className="forecast-probabilities">
        {forecast.options.map((option, idx) => {
          const hasName = option.name && option.name.trim() !== '';
          const prob = option.probability ?? 0;

          return (
            <div key={idx} className="probability-row">
              {hasName ? (
                <>
                  <span className="outcome-name">{option.name}</span>
                  <span className="probability-value">{(prob * 100).toFixed(1)}%</span>
                </>
              ) : (
                <span className="probability-value single">{(prob * 100).toFixed(1)}%</span>
              )}
              <div className="probability-bar">
                <div
                  className="probability-fill"
                  style={{ width: `${prob * 100}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>

      {updateDate && (
        <div className="forecast-footer">
          <span className="update-date">
            {isCached ? '📦 Cached' : '🔄 Updated'} {new Date(updateDate).toLocaleDateString()}
          </span>
        </div>
      )}
    </div>
  );
}
