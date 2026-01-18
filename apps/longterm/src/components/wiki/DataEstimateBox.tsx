/**
 * Data-aware EstimateBox Component
 *
 * Uses createDataWrapper HOC to support both:
 * 1. Inline data via `estimates` prop (backwards compatible)
 * 2. Data lookup via `dataId` prop (pulls from YAML data)
 */

import { EstimateBox } from './EstimateBox';
import { getEstimateBoxData } from '../../data';
import { createDataWrapper } from './shared/createDataWrapper';

// Create the data-aware wrapper using the HOC
export const DataEstimateBox = createDataWrapper(EstimateBox, {
  getData: getEstimateBoxData,
  requiredInlineProps: ['variable', 'estimates'],
  displayName: 'EstimateBox',
});

export default DataEstimateBox;
