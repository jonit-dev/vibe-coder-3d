/**
 * Get Available Shapes Tool
 * Allows the AI to query available shapes dynamically
 */

import { Logger } from '@core/lib/logger';
import { getAllShapes, getPrimitiveShapes, getCustomGeometryShapes } from '../utils/shapeDiscovery';

const logger = Logger.create('GetAvailableShapesTool');

export const getAvailableShapesTool = {
  name: 'get_available_shapes',
  description:
    'Get a list of all available shapes in the codebase (primitives and custom geometry). Use this to discover what shapes can be created or referenced.',
  input_schema: {
    type: 'object' as const,
    properties: {
      filter: {
        type: 'string',
        enum: ['all', 'primitive', 'geometry'],
        description:
          'Filter shapes by type: all (default), primitive (cube, sphere, etc.), or geometry (custom shapes)',
      },
    },
    required: [],
  },
};

/**
 * Execute the get available shapes tool
 */
export async function executeGetAvailableShapes(params: any): Promise<string> {
  logger.info('Getting available shapes', { params });

  const filter = params.filter || 'all';
  let shapes;

  switch (filter) {
    case 'primitive':
      shapes = getPrimitiveShapes();
      break;
    case 'geometry':
      shapes = getCustomGeometryShapes();
      break;
    case 'all':
    default:
      shapes = getAllShapes();
      break;
  }

  if (shapes.length === 0) {
    return `No shapes found for filter: ${filter}`;
  }

  const shapeList = shapes
    .map((shape) => {
      return `- ${shape.name} (${shape.type}) - Source: ${shape.source}`;
    })
    .join('\n');

  return `Available shapes (filter: ${filter}):\n\n${shapeList}\n\nTotal: ${shapes.length} shapes`;
}
