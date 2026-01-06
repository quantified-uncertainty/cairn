import React from 'react';
import { getEntityById, getEntityHref } from '../../data';
import './wiki.css';

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
    <div className="parameter-distinctions">
      <h3>Relationship to Related Parameters</h3>
      <table>
        <thead>
          <tr>
            <th>Parameter</th>
            <th>Focus</th>
            <th>Relationship</th>
          </tr>
        </thead>
        <tbody>
          {/* Current parameter row */}
          <tr className="parameter-distinctions__current">
            <td>
              <strong>{entity.title}</strong> (this page)
            </td>
            <td>
              <em>{focus}</em>
            </td>
            <td>—</td>
          </tr>
          {/* Related parameters */}
          {distinctFrom.map((distinction) => {
            const relatedEntity = getEntityById(distinction.id);
            const href = relatedEntity
              ? getEntityHref(distinction.id, relatedEntity.type)
              : `/ai-transition-model/factors/${distinction.id}/`;

            return (
              <tr key={distinction.id}>
                <td>
                  <a href={href}>{relatedEntity?.title || distinction.id}</a>
                </td>
                <td>
                  <em>{distinction.theirFocus}</em>
                </td>
                <td>{distinction.relationship}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default ParameterDistinctions;
