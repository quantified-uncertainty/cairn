/**
 * Quality Dashboard Component
 *
 * Displays interactive quality metrics including:
 * - Quality distribution bar chart
 * - Gap analysis summaries
 */

import React from 'react';
import type { DashboardMetrics } from '@lib/dashboard';

interface QualityDashboardProps {
  metrics: DashboardMetrics;
}

const QUALITY_COLORS: Record<number, string> = {
  0: '#9ca3af', // gray
  1: '#ef4444', // red
  2: '#f97316', // orange
  3: '#eab308', // yellow
  4: '#22c55e', // green
  5: '#10b981', // emerald
};

const QUALITY_LABELS: Record<number, string> = {
  0: 'Unrated',
  1: 'Stub',
  2: 'Draft',
  3: 'Adequate',
  4: 'Good',
  5: 'Excellent',
};

export default function QualityDashboard({ metrics }: QualityDashboardProps) {
  const maxCount = Math.max(...metrics.qualityDistribution.map(d => d.count));

  return (
    <div className="quality-dashboard">
      {/* Quality Distribution Chart */}
      <div className="quality-chart">
        <div className="flex items-end gap-2 h-40 mb-4">
          {metrics.qualityDistribution.map(({ quality, count }) => {
            const height = maxCount > 0 ? (count / maxCount) * 100 : 0;
            return (
              <div key={quality} className="flex-1 flex flex-col items-center">
                <div className="text-sm font-medium mb-1">{count}</div>
                <div
                  className="w-full rounded-t transition-all duration-300"
                  style={{
                    height: `${height}%`,
                    minHeight: count > 0 ? '4px' : '0',
                    backgroundColor: QUALITY_COLORS[quality],
                  }}
                  title={`${QUALITY_LABELS[quality]}: ${count} entities`}
                />
                <div className="text-xs mt-2 text-center">
                  <div className="font-medium">{quality}</div>
                  <div className="text-gray-500 dark:text-gray-400">
                    {QUALITY_LABELS[quality]}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <SummaryCard
          title="Low Quality (1-2)"
          count={
            metrics.qualityDistribution
              .filter(d => d.quality === 1 || d.quality === 2)
              .reduce((sum, d) => sum + d.count, 0)
          }
          color="text-red-600"
          description="Needs significant improvement"
        />
        <SummaryCard
          title="Adequate (3)"
          count={
            metrics.qualityDistribution.find(d => d.quality === 3)?.count || 0
          }
          color="text-yellow-600"
          description="Meets basic standards"
        />
        <SummaryCard
          title="High Quality (4-5)"
          count={
            metrics.qualityDistribution
              .filter(d => d.quality === 4 || d.quality === 5)
              .reduce((sum, d) => sum + d.count, 0)
          }
          color="text-green-600"
          description="Well-developed content"
        />
      </div>

      {/* Average Quality */}
      <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Average Quality Score
          </span>
          <span className="text-2xl font-bold">
            {metrics.averageQuality.toFixed(1)} / 5.0
          </span>
        </div>
        <div className="mt-2 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${(metrics.averageQuality / 5) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}

interface SummaryCardProps {
  title: string;
  count: number;
  color: string;
  description: string;
}

function SummaryCard({ title, count, color, description }: SummaryCardProps) {
  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <div className="text-sm text-gray-600 dark:text-gray-400">{title}</div>
      <div className={`text-3xl font-bold ${color}`}>{count}</div>
      <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
        {description}
      </div>
    </div>
  );
}
