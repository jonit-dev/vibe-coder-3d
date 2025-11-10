/**
 * Get Scene Info Tool
 * Provides detailed context about the current scene
 */

import { Logger } from '@core/lib/logger';

const logger = Logger.create('GetSceneInfoTool');

export const getSceneInfoTool = {
  name: 'get_scene_info',
  description:
    'Get detailed information about the current scene including entity count, types, bounding box, and scene statistics. Useful for understanding scene complexity before making changes.',
  input_schema: {
    type: 'object' as const,
    properties: {
      include_entities: {
        type: 'boolean',
        description: 'Include detailed entity list (default: false)',
      },
    },
    required: [],
  },
};

/**
 * Execute the get scene info tool
 */
export async function executeGetSceneInfo(params: any): Promise<string> {
  logger.info('Getting scene info', { params });

  const { include_entities = false } = params;

  // Dispatch event to get scene info from the editor
  return new Promise((resolve) => {
    const handleResponse = (event: CustomEvent) => {
      const sceneInfo = event.detail;

      let info = `Scene Information:\n\n`;
      info += `Name: ${sceneInfo.name || 'Unnamed'}\n`;
      info += `Total Entities: ${sceneInfo.entityCount || 0}\n\n`;

      if (sceneInfo.entityTypes) {
        info += `Entity Types:\n`;
        Object.entries(sceneInfo.entityTypes as Record<string, number>).forEach(([type, count]) => {
          info += `- ${type}: ${count}\n`;
        });
        info += `\n`;
      }

      if (sceneInfo.bounds) {
        info += `Scene Bounds:\n`;
        info += `- Min: (${sceneInfo.bounds.min.x.toFixed(2)}, ${sceneInfo.bounds.min.y.toFixed(2)}, ${sceneInfo.bounds.min.z.toFixed(2)})\n`;
        info += `- Max: (${sceneInfo.bounds.max.x.toFixed(2)}, ${sceneInfo.bounds.max.y.toFixed(2)}, ${sceneInfo.bounds.max.z.toFixed(2)})\n\n`;
      }

      if (include_entities && sceneInfo.entities) {
        info += `Entities:\n`;
        sceneInfo.entities.forEach((entity: any) => {
          info += `- ${entity.name} (${entity.type}) at (${entity.position.x.toFixed(2)}, ${entity.position.y.toFixed(2)}, ${entity.position.z.toFixed(2)})\n`;
        });
      }

      resolve(info);
      window.removeEventListener('agent:scene-info-response', handleResponse as EventListener);
    };

    window.addEventListener('agent:scene-info-response', handleResponse as EventListener);

    // Request scene info
    const event = new CustomEvent('agent:get-scene-info', {
      detail: { include_entities },
    });
    window.dispatchEvent(event);

    // Timeout after 5 seconds
    setTimeout(() => {
      window.removeEventListener('agent:scene-info-response', handleResponse as EventListener);
      resolve('Scene info request timed out. The editor may not be responding.');
    }, 5000);
  });
}
