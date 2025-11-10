/**
 * Get Shape Schema Tool
 * Allows the AI to inspect the structure of a geometry file
 */

import { Logger } from '@core/lib/logger';

const logger = Logger.create('GetShapeSchemaTool');

export const getShapeSchemaTool = {
  name: 'get_shape_schema',
  description:
    'Get the schema/structure of a custom geometry shape. Returns vertex count, triangle count, colors, and metadata. Use this to understand existing shapes before creating similar ones.',
  input_schema: {
    type: 'object' as const,
    properties: {
      shape_name: {
        type: 'string',
        description: 'Name of the shape to inspect (e.g., "tree_oak", "battleship")',
      },
    },
    required: ['shape_name'],
  },
};

/**
 * Execute the get shape schema tool
 */
export async function executeGetShapeSchema(params: any): Promise<string> {
  logger.info('Getting shape schema', { params });

  const { shape_name } = params;

  try {
    // Try to fetch the geometry file
    const response = await fetch(`/src/game/geometry/${shape_name}.shape.json`);

    if (!response.ok) {
      return `Shape "${shape_name}" not found. Use get_available_shapes tool to see available shapes.`;
    }

    const shapeData = await response.json();

    // Extract metadata
    const vertexCount = shapeData.data?.attributes?.position?.array?.length / 3 || 0;
    const indexCount = shapeData.data?.index?.array?.length || 0;
    const triangleCount = indexCount / 3;
    const hasNormals = !!shapeData.data?.attributes?.normal;
    const hasUVs = !!shapeData.data?.attributes?.uv;
    const hasColors = !!shapeData.data?.attributes?.color;

    let schema = `Shape Schema: ${shape_name}\n\n`;
    schema += `Geometry Stats:\n`;
    schema += `- Vertices: ${vertexCount}\n`;
    schema += `- Triangles: ${triangleCount}\n`;
    schema += `- Has Normals: ${hasNormals}\n`;
    schema += `- Has UVs: ${hasUVs}\n`;
    schema += `- Has Vertex Colors: ${hasColors}\n\n`;

    if (shapeData.meta) {
      schema += `Metadata:\n`;
      schema += `- ID: ${shapeData.meta.id || 'N/A'}\n`;
      schema += `- Name: ${shapeData.meta.name || 'N/A'}\n`;
      schema += `- Category: ${shapeData.meta.category || 'N/A'}\n`;
      schema += `- Tags: ${shapeData.meta.tags?.join(', ') || 'None'}\n`;
    }

    return schema;
  } catch (error) {
    logger.error('Failed to get shape schema', { error, shape_name });
    return `Failed to load shape schema for "${shape_name}". Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}
