/**
 * Get Available Materials Tool
 * Allows the AI to discover available materials in the system
 */

import { Logger } from '@core/lib/logger';
import { MaterialRegistry } from '@core/materials/MaterialRegistry';

const logger = Logger.create('GetAvailableMaterialsTool');

export const getAvailableMaterialsTool = {
  name: 'get_available_materials',
  description: `Get list of available materials that can be applied to primitives.

Returns material definitions with their IDs, names, and properties (color, shader type, etc.).
Use this to discover what materials exist before creating entities or prefabs.`,
  input_schema: {
    type: 'object' as const,
    properties: {
      include_properties: {
        type: 'boolean',
        description:
          'Include full material properties (color, metalness, roughness, etc.). Default: false',
      },
    },
    required: [],
  },
};

/**
 * Execute the get available materials tool
 */
export async function executeGetAvailableMaterials(params: { include_properties?: boolean }): Promise<string> {
  logger.info('Getting available materials', { params });

  const { include_properties = false } = params;

  try {
    const materialRegistry = MaterialRegistry.getInstance();
    const materials = materialRegistry.list();

    if (materials.length === 0) {
      return 'No materials available (only default material exists).';
    }

    let result = `Available Materials (${materials.length}):\n\n`;

    for (const material of materials) {
      result += `- **${material.name}** (id: "${material.id}")\n`;
      result += `  - Shader: ${material.shader}\n`;
      result += `  - Type: ${material.materialType}\n`;

      if (include_properties) {
        result += `  - Color: ${material.color}\n`;
        if (material.shader === 'standard') {
          result += `  - Metalness: ${material.metalness}\n`;
          result += `  - Roughness: ${material.roughness}\n`;
        }
        if (material.emissiveIntensity && material.emissiveIntensity > 0) {
          result += `  - Emissive: ${material.emissive} (intensity: ${material.emissiveIntensity})\n`;
        }
      }

      result += '\n';
    }

    result += '\n**Usage Example:**\n';
    result += '```json\n';
    result += '{\n';
    result += '  type: "Cube",\n';
    result += '  material: {\n';
    result += '    materialId: "default",  // Use existing material ID\n';
    result += '    color: "#ff0000"        // OR override with custom color\n';
    result += '  }\n';
    result += '}\n';
    result += '```';

    logger.info('Retrieved materials', { count: materials.length });
    return result;
  } catch (error) {
    logger.error('Failed to get materials', { error });
    return `Error getting materials: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}
