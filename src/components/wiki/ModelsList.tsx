/**
 * ModelsList Component
 *
 * Displays analytical models related to a specific entity (e.g., a risk).
 * Shows a table with title, description, and ratings.
 */

import React from 'react';
import { getModelsForEntity, getPageById } from '../../data';
import { FileBarChart } from 'lucide-react';

interface ModelsListProps {
  entityId: string;
  title?: string;
  showEmpty?: boolean;
}

/**
 * Simple numeric rating display
 */
function RatingValue({ value }: { value?: number }) {
  if (!value) return <span className="models-list__rating-empty">—</span>;
  return <span className="models-list__rating-value">{value}</span>;
}

export function ModelsList({
  entityId,
  title = 'Analytical Models',
  showEmpty = false,
}: ModelsListProps) {
  const models = getModelsForEntity(entityId);

  if (models.length === 0 && !showEmpty) {
    return null;
  }

  // Enrich models with page data (which includes ratings)
  const enrichedModels = models.map((model) => {
    const page = getPageById(model.id);
    const modelType = model.customFields?.find(f => f.label === 'Model Type')?.value;
    return {
      ...model,
      modelType,
      ratings: page?.ratings || null,
      quality: page?.quality || null,
    };
  });

  return (
    <div className="models-list">
      <h3 className="models-list__title">
        <FileBarChart className="models-list__icon" size={18} />
        {title}
      </h3>

      {models.length === 0 ? (
        <p className="models-list__empty">No models available for this topic yet.</p>
      ) : (
        <>
          <p className="models-list__intro">
            The following analytical models provide structured frameworks for understanding this risk:
          </p>
          <div className="models-list__table-wrapper">
            <table className="models-list__table">
              <thead>
                <tr>
                  <th>Model</th>
                  <th>Type</th>
                  <th title="Novelty: Does this provide new insights?">Nov</th>
                  <th title="Rigor: Is the methodology sound?">Rig</th>
                  <th title="Actionability: Can this inform decisions?">Act</th>
                  <th title="Completeness: Does this cover the topic adequately?">Cmp</th>
                </tr>
              </thead>
              <tbody>
                {enrichedModels.map((model) => (
                  <tr key={model.id}>
                    <td className="models-list__table-title-cell">
                      <a href={model.href} className="models-list__table-link">
                        {model.title}
                      </a>
                      {model.description && (
                        <p className="models-list__table-desc">{model.description}</p>
                      )}
                    </td>
                    <td className="models-list__table-type">
                      {model.modelType && (
                        <span className="models-list__type-badge">{model.modelType}</span>
                      )}
                    </td>
                    <td className="models-list__table-rating">
                      <RatingValue value={model.ratings?.novelty} />
                    </td>
                    <td className="models-list__table-rating">
                      <RatingValue value={model.ratings?.rigor} />
                    </td>
                    <td className="models-list__table-rating">
                      <RatingValue value={model.ratings?.actionability} />
                    </td>
                    <td className="models-list__table-rating">
                      <RatingValue value={model.ratings?.completeness} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

export default ModelsList;
