import React from 'react';
import { Card } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { cn } from '@lib/utils';

interface Estimate {
  source: string;
  value: string;
  date?: string;
  url?: string;
  notes?: string;
}

interface EstimateBoxProps {
  variable: string;
  description?: string;
  estimates: Estimate[];
  unit?: string;
  aggregateRange?: string;
}

export function EstimateBox({
  variable,
  description,
  estimates,
  unit = '%',
  aggregateRange
}: EstimateBoxProps) {
  return (
    <Card className="my-6 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-700 text-white">
        <span className="text-xl">📊</span>
        <span className="font-semibold">{variable}</span>
      </div>

      {/* Description */}
      {description && (
        <p className="m-0 px-4 py-3 text-sm text-muted-foreground border-b border-border">
          {description}
        </p>
      )}

      {/* Aggregate Range */}
      {aggregateRange && (
        <div className="flex items-center gap-2 px-4 py-3 bg-muted">
          <span className="text-sm text-muted-foreground">Aggregate Range:</span>
          <span className="font-semibold text-lg text-accent-foreground">{aggregateRange}</span>
        </div>
      )}

      {/* Table */}
      <div className="p-2">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-semibold">Source</TableHead>
              <TableHead className="font-semibold">Estimate</TableHead>
              <TableHead className="font-semibold">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {estimates.map((est, i) => (
              <TableRow key={i}>
                <TableCell>
                  {est.url ? (
                    <a
                      href={est.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent-foreground no-underline hover:underline"
                    >
                      {est.source}
                    </a>
                  ) : (
                    est.source
                  )}
                </TableCell>
                <TableCell className="font-semibold">
                  {est.value}{unit && !est.value.includes('%') && !est.value.includes('-') ? unit : ''}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {est.date || '—'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Notes */}
      {estimates.some(e => e.notes) && (
        <div className="px-4 py-3 bg-muted border-t border-border">
          {estimates.filter(e => e.notes).map((est, i) => (
            <p key={i} className={cn("m-0 text-[0.8rem] text-muted-foreground", i < estimates.filter(e => e.notes).length - 1 && "mb-2")}>
              <strong>{est.source}:</strong> {est.notes}
            </p>
          ))}
        </div>
      )}
    </Card>
  );
}

export default EstimateBox;
