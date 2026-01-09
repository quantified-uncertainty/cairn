import React from 'react';
import { getEntityById, getEntityHref } from '../../data';
import { Card } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

interface ParameterDistinctionsProps {
  /**
   * The entity ID of the current parameter
   */
  entityId: string;
}

/**
 * ParameterDistinctions - Renders a table showing how this parameter differs from related parameters
 *
 * Usage in MDX:
 *   <ParameterDistinctions entityId="epistemic-health" />
 *
 * Reads parameterDistinctions from the entity's YAML definition and renders a comparison table.
 */
export function ParameterDistinctions({ entityId }: ParameterDistinctionsProps) {
  const entity = getEntityById(entityId);

  if (!entity?.parameterDistinctions) {
    return null;
  }

  const { focus, distinctFrom } = entity.parameterDistinctions;

  if (!distinctFrom || distinctFrom.length === 0) {
    return null;
  }

  return (
    <Card className="my-6 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 bg-muted border-b border-border font-semibold">
        <span>🔗</span>
        <span>Relationship to Related Parameters</span>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Parameter</TableHead>
            <TableHead>Focus</TableHead>
            <TableHead>Relationship</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {/* Current parameter row */}
          <TableRow className="bg-accent/50">
            <TableCell className="font-medium">
              <strong>{entity.title}</strong>
              <span className="text-muted-foreground ml-1">(this page)</span>
            </TableCell>
            <TableCell>
              <em className="text-muted-foreground">{focus}</em>
            </TableCell>
            <TableCell className="text-muted-foreground">—</TableCell>
          </TableRow>
          {/* Related parameters */}
          {distinctFrom.map((distinction) => {
            const relatedEntity = getEntityById(distinction.id);
            const href = relatedEntity
              ? getEntityHref(distinction.id, relatedEntity.type)
              : `/ai-transition-model/factors/${distinction.id}/`;

            return (
              <TableRow key={distinction.id}>
                <TableCell>
                  <a
                    href={href}
                    className="text-accent-foreground no-underline hover:underline"
                  >
                    {relatedEntity?.title || distinction.id}
                  </a>
                </TableCell>
                <TableCell>
                  <em className="text-muted-foreground">{distinction.theirFocus}</em>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {distinction.relationship}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}

export default ParameterDistinctions;
