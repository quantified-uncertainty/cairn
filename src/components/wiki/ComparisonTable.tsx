import React from 'react';
import './wiki.css';

interface ComparisonRow {
  name: string;
  link?: string;
  values?: Record<string, string | { value: string; badge?: 'high' | 'medium' | 'low' }>;
  attributes?: Record<string, string | { value: string; badge?: 'high' | 'medium' | 'low' }>;
}

interface ComparisonTableProps {
  title: string;
  columns?: string[];
  rows?: ComparisonRow[];
  items?: ComparisonRow[];
  highlightColumn?: string;
}

export function ComparisonTable({ title, columns, rows, items, highlightColumn }: ComparisonTableProps) {
  // Use rows or items (backwards compatibility)
  const tableRows = rows || items || [];

  // Use provided columns or derive from first row
  const tableColumns = columns || (() => {
    const firstRow = tableRows[0];
    if (!firstRow) return [];
    return Object.keys(firstRow.values || firstRow.attributes || {});
  })();

  if (tableRows.length === 0) {
    return (
      <div className="comparison-table">
        <div className="comparison-table__header">
          <span>📊</span>
          <span>{title}</span>
        </div>
        <div className="comparison-table__content">
          <p>No data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="comparison-table">
      <div className="comparison-table__header">
        <span>📊</span>
        <span>{title}</span>
      </div>
      <div className="comparison-table__content">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              {tableColumns.map(col => (
                <th key={col} className={col === highlightColumn ? 'comparison-table__highlight' : ''}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableRows.map((row, i) => {
              // Support both values and attributes
              const rowData = row.values || row.attributes || {};

              return (
                <tr key={i}>
                  <td>
                    {row.link ? (
                      <a href={row.link}>{row.name}</a>
                    ) : (
                      <strong>{row.name}</strong>
                    )}
                  </td>
                  {tableColumns.map(col => {
                    const cellValue = rowData[col];
                    if (!cellValue) return <td key={col}>—</td>;

                    if (typeof cellValue === 'string') {
                      return <td key={col}>{cellValue}</td>;
                    }

                    return (
                      <td key={col}>
                        {cellValue.value}
                        {cellValue.badge && (
                          <span className={`comparison-table__badge comparison-table__badge--${cellValue.badge}`}>
                            {cellValue.badge}
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ComparisonTable;
