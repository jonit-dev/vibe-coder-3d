/**
 * Scene Manipulation Tool
 * Allows the AI to add, modify, and query entities in the scene
 */

import { Logger } from '@core/lib/logger';
import { getShapeNames } from '../utils/shapeDiscovery';

const logger = Logger.create('SceneManipulationTool');

export interface IAddEntityParams {
  type: string;
  position?: { x: number; y: number; z: number };
  rotation?: { x: number; y: number; z: number };
  scale?: { x: number; y: number; z: number };
  name?: string;
}

// Scene manipulation tool parameter types
interface ISceneManipulationParams {
  action: 'add_entity' | 'list_entities' | 'get_entity';
  entity_type?: string;
  position?: { x: number; y: number; z: number };
  name?: string;
  entity_id?: number;
}

// Dynamically get available primitive shapes
const primitiveShapes = getShapeNames('primitive');

export const sceneManipulationTool = {
  name: 'scene_manipulation',
  description:
    'Manipulate the 3D scene by adding, modifying, or querying entities. Use ONLY for primitive shapes (cube, sphere, cylinder, plane, light).',
  input_schema: {
    type: 'object' as const,
    properties: {
      action: {
        type: 'string',
        enum: ['add_entity', 'list_entities', 'get_entity'],
        description: 'The action to perform',
      },
      entity_type: {
        type: 'string',
        enum: primitiveShapes,
        description: `Type of primitive entity to add (for add_entity action). Available: ${primitiveShapes.join(', ')}`,
      },
      position: {
        type: 'object',
        properties: {
          x: { type: 'number' },
          y: { type: 'number' },
          z: { type: 'number' },
        },
        description: 'Position in 3D space (for add_entity action)',
      },
      name: {
        type: 'string',
        description: 'Name for the entity',
      },
    },
    required: ['action'],
  },
};

/**
 * Execute the scene manipulation tool
 */
export async function executeSceneManipulation(params: ISceneManipulationParams): Promise<string> {
  logger.info('Executing scene manipulation', { params });

  const { action, entity_type, position, name } = params;

  switch (action) {
    case 'add_entity':
      return addEntity({
        type: entity_type || 'Cube',
        position: position || { x: 0, y: 0, z: 0 },
        name,
      });

    case 'list_entities':
      return listEntities();

    case 'get_entity':
      if (params.entity_id === undefined) {
        return 'Error: entity_id is required for get_entity action';
      }
      return getEntity(params.entity_id);

    default:
      return `Unknown action: ${action}`;
  }
}

function addEntity(params: IAddEntityParams): Promise<string> {
  return new Promise((resolve) => {
    const requestId = `add-entity-${Date.now()}-${Math.random()}`;

    const handleResponse = (event: CustomEvent) => {
      const { _requestId, success, entityId, error } = event.detail;

      if (_requestId !== requestId) return;

      if (success) {
        logger.info('Entity created successfully', { entityId, params });
        resolve(
          `Added ${params.type} to the scene at position (${params.position?.x}, ${params.position?.y}, ${params.position?.z}). Entity ID: ${entityId}`,
        );
      } else {
        logger.error('Entity creation failed', { error, params });
        resolve(`Failed to add ${params.type}: ${error}`);
      }

      window.removeEventListener('agent:add-entity-response', handleResponse as EventListener);
    };

    window.addEventListener('agent:add-entity-response', handleResponse as EventListener);

    // Dispatch a custom event that the editor can listen to
    const event = new CustomEvent('agent:add-entity', {
      detail: { ...params, _requestId: requestId },
    });
    window.dispatchEvent(event);

    logger.info('Entity add requested', params);

    // Timeout after 5 seconds
    setTimeout(() => {
      window.removeEventListener('agent:add-entity-response', handleResponse as EventListener);
      resolve(`Entity creation timed out for ${params.type}. The editor may not be responding.`);
    }, 5000);
  });
}

function listEntities(): string {
  // Dispatch event to get entity list
  const event = new CustomEvent('agent:list-entities');
  window.dispatchEvent(event);

  // For now, return placeholder
  return 'Entity list requested. Check the hierarchy panel.';
}

function getEntity(entityId: number): string {
  return `Entity ${entityId} details requested.`;
}
