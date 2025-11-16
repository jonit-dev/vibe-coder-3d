/**
 * Scene Manipulation Tool
 * Allows the AI to add, modify, and query entities in the scene
 * Enhanced with structured list_entities per PRD: docs/PRDs/editor/ai-first-chat-flexibility-prd.md
 */

import { Logger } from '@core/lib/logger';
import { getShapeNames } from '../utils/shapeDiscovery';
import { getEntitySummaries, formatEntityList } from './utils/entityIntrospection';

const logger = Logger.create('SceneManipulationTool');

export interface IAddEntityParams {
  type: string;
  position?: { x: number; y: number; z: number };
  rotation?: { x: number; y: number; z: number };
  scale?: { x: number; y: number; z: number };
  name?: string;
  material?: {
    materialId?: string;
    color?: string;
    metalness?: number;
    roughness?: number;
  };
}

// Scene manipulation tool parameter types
interface ISceneManipulationParams {
  action: 'add_entity' | 'batch_add_entities' | 'list_entities' | 'get_entity';
  entity_type?: string;
  position?: { x: number; y: number; z: number };
  rotation?: { x: number; y: number; z: number };
  scale?: { x: number; y: number; z: number };
  name?: string;
  entity_id?: number;
  material?: {
    materialId?: string;
    color?: string;
    metalness?: number;
    roughness?: number;
  };
  entities?: Array<{
    type: string;
    position?: { x: number; y: number; z: number };
    rotation?: { x: number; y: number; z: number };
    scale?: { x: number; y: number; z: number };
    name?: string;
    material?: {
      materialId?: string;
      color?: string;
      metalness?: number;
      roughness?: number;
    };
  }>;
}

// Dynamically get available primitive shapes
const primitiveShapes = getShapeNames('primitive');

export const sceneManipulationTool = {
  name: 'scene_manipulation',
  description:
    'Manipulate the 3D scene by adding, modifying, or querying entities. Use for primitive shapes (cube, sphere, cylinder, plane, light) or empty entities. When creating entities, consider thoughtful material choices, appropriate scales, and proper rotations to create visually appealing scenes.',
  input_schema: {
    type: 'object' as const,
    properties: {
      action: {
        type: 'string',
        enum: ['add_entity', 'batch_add_entities', 'list_entities', 'get_entity'],
        description: 'The action to perform',
      },
      entity_type: {
        type: 'string',
        enum: [...primitiveShapes, 'Entity'],
        description: `Type of entity to add (for add_entity action). Use 'Entity' for empty entities. Available: ${primitiveShapes.join(', ')}, Entity`,
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
      rotation: {
        type: 'object',
        properties: {
          x: { type: 'number', description: 'Rotation around X axis in degrees' },
          y: { type: 'number', description: 'Rotation around Y axis in degrees' },
          z: { type: 'number', description: 'Rotation around Z axis in degrees' },
        },
        description: 'Rotation in degrees (for add_entity action)',
      },
      scale: {
        type: 'object',
        properties: {
          x: { type: 'number', description: 'Scale on X axis' },
          y: { type: 'number', description: 'Scale on Y axis' },
          z: { type: 'number', description: 'Scale on Z axis' },
        },
        description: 'Scale (for add_entity action). Defaults to [1, 1, 1]',
      },
      name: {
        type: 'string',
        description: 'Name for the entity',
      },
      material: {
        type: 'object',
        properties: {
          materialId: {
            type: 'string',
            description:
              'ID of an existing material to use. Check get_available_materials tool first.',
          },
          color: {
            type: 'string',
            description:
              'Hex color string (e.g., "#ff0000" for red). Use this to customize appearance.',
          },
          metalness: {
            type: 'number',
            description: 'Metalness value (0.0 to 1.0). Higher values make surface more metallic.',
          },
          roughness: {
            type: 'number',
            description:
              'Roughness value (0.0 to 1.0). Higher values make surface rougher/less shiny.',
          },
        },
        description:
          'Material properties for the entity. Thoughtful material choices enhance visual quality.',
      },
      entities: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              enum: [...primitiveShapes, 'Entity'],
              description: `Entity type. Available: ${primitiveShapes.join(', ')}, Entity`,
            },
            position: {
              type: 'object',
              properties: {
                x: { type: 'number' },
                y: { type: 'number' },
                z: { type: 'number' },
              },
              description: 'Position in 3D space',
            },
            rotation: {
              type: 'object',
              properties: {
                x: { type: 'number', description: 'Rotation around X axis in degrees' },
                y: { type: 'number', description: 'Rotation around Y axis in degrees' },
                z: { type: 'number', description: 'Rotation around Z axis in degrees' },
              },
              description: 'Rotation in degrees',
            },
            scale: {
              type: 'object',
              properties: {
                x: { type: 'number' },
                y: { type: 'number' },
                z: { type: 'number' },
              },
              description: 'Scale (defaults to [1, 1, 1])',
            },
            name: {
              type: 'string',
              description: 'Name for the entity',
            },
            material: {
              type: 'object',
              properties: {
                materialId: { type: 'string' },
                color: { type: 'string', description: 'Hex color (e.g., "#ff0000")' },
                metalness: { type: 'number' },
                roughness: { type: 'number' },
              },
              description: 'Material properties',
            },
          },
          required: ['type'],
        },
        description: 'Array of entities to add (for batch_add_entities action)',
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

  const { action, entity_type, position, rotation, scale, name, material, entities } = params;

  switch (action) {
    case 'add_entity':
      return addEntity({
        type: entity_type || 'Cube',
        position: position || { x: 0, y: 0, z: 0 },
        rotation,
        scale,
        name,
        material,
      });

    case 'batch_add_entities':
      if (!entities || !Array.isArray(entities) || entities.length === 0) {
        return 'Error: entities array is required for batch_add_entities and must not be empty';
      }
      return batchAddEntities(entities);

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

        const details = [];
        if (params.position) {
          details.push(
            `position (${params.position.x}, ${params.position.y}, ${params.position.z})`,
          );
        }
        if (params.rotation) {
          details.push(
            `rotation (${params.rotation.x}°, ${params.rotation.y}°, ${params.rotation.z}°)`,
          );
        }
        if (params.scale) {
          details.push(`scale (${params.scale.x}, ${params.scale.y}, ${params.scale.z})`);
        }
        if (params.material?.color) {
          details.push(`color ${params.material.color}`);
        }

        const detailsStr = details.length > 0 ? ` with ${details.join(', ')}` : '';
        resolve(`Added ${params.type} to the scene${detailsStr}. Entity ID: ${entityId}`);
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
  // Use introspection helper to get structured entity data
  const summaries = getEntitySummaries(25);
  const truncated = summaries.length === 25;

  return formatEntityList(summaries, truncated);
}

function getEntity(entityId: number): string {
  return `Entity ${entityId} details requested.`;
}

async function batchAddEntities(entities: IAddEntityParams[]): Promise<string> {
  const results: string[] = [];
  const entityIds: number[] = [];

  for (const entity of entities) {
    try {
      const result = await addEntity({
        type: entity.type,
        position: entity.position || { x: 0, y: 0, z: 0 },
        rotation: entity.rotation,
        scale: entity.scale,
        name: entity.name,
        material: entity.material,
      });

      // Extract entity ID from result string
      const match = result.match(/Entity ID: (\d+)/);
      if (match) {
        const entityId = parseInt(match[1], 10);
        entityIds.push(entityId);
      }

      results.push(result);
    } catch (error) {
      logger.error('Failed to add entity in batch', { entity, error });
      results.push(`Failed to add ${entity.type}: ${error}`);
    }
  }

  const successCount = entityIds.length;
  const summary = `Batch added ${successCount}/${entities.length} entities. Entity IDs: ${entityIds.join(', ')}`;

  return summary;
}
