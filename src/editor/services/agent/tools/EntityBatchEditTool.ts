/**
 * Entity Batch Edit Tool
 * Allows the AI to apply transforms/materials to multiple entities in one call
 * Following PRD: docs/PRDs/editor/ai-first-chat-flexibility-prd.md
 */

import { Logger } from '@core/lib/logger';
import { ComponentRegistry } from '@core/lib/ecs/ComponentRegistry';
import { EntityQueries } from '@core/lib/ecs/queries/entityQueries';

const logger = Logger.create('EntityBatchEditTool');

interface ITransformUpdate {
  entity_id: number;
  position?: { x: number; y: number; z: number };
  rotation?: { x: number; y: number; z: number };
  scale?: { x: number; y: number; z: number };
}

interface IMaterialUpdate {
  entity_id: number;
  material?: {
    color?: string;
    materialId?: string;
    metalness?: number;
    roughness?: number;
  };
}

interface IEntityBatchEditParams {
  action: 'set_transforms' | 'offset_position' | 'set_material';
  entities?: ITransformUpdate[];
  entity_ids?: number[];
  offset?: { x: number; y: number; z: number };
  material?: {
    color?: string;
    materialId?: string;
    metalness?: number;
    roughness?: number;
  };
  materials?: IMaterialUpdate[];
}

export const entityBatchEditTool = {
  name: 'entity_batch_edit',
  description: `Apply transforms/materials to multiple entities in one call. Efficient for bulk scene edits.

IMPORTANT: When applying materials, consider:
- Use appropriate colors for object types (e.g., wood = brown, metal = gray, grass = green)
- Vary materials slightly to avoid monotony (different shades, metalness values)
- Check get_available_materials for existing material options
- Use metalness and roughness to create visual interest`,
  input_schema: {
    type: 'object' as const,
    properties: {
      action: {
        type: 'string',
        enum: ['set_transforms', 'offset_position', 'set_material'],
        description: 'Batch action to perform',
      },
      entities: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            entity_id: { type: 'number' },
            position: {
              type: 'object',
              properties: {
                x: { type: 'number' },
                y: { type: 'number' },
                z: { type: 'number' },
              },
            },
            rotation: {
              type: 'object',
              properties: {
                x: { type: 'number' },
                y: { type: 'number' },
                z: { type: 'number' },
              },
            },
            scale: {
              type: 'object',
              properties: {
                x: { type: 'number' },
                y: { type: 'number' },
                z: { type: 'number' },
              },
            },
          },
          required: ['entity_id'],
        },
        description: 'Array of entities with transform updates (for set_transforms)',
      },
      entity_ids: {
        type: 'array',
        items: { type: 'number' },
        description:
          'Array of entity IDs to apply uniform updates (for offset_position, set_material)',
      },
      offset: {
        type: 'object',
        properties: {
          x: { type: 'number' },
          y: { type: 'number' },
          z: { type: 'number' },
        },
        description: 'Offset to apply to positions (for offset_position)',
      },
      material: {
        type: 'object',
        properties: {
          color: { type: 'string', description: 'Material color (hex, e.g., "#8B4513" for brown)' },
          materialId: { type: 'string', description: 'Material ID reference' },
          metalness: {
            type: 'number',
            description: 'Metalness value (0.0-1.0). Higher = more metallic',
          },
          roughness: {
            type: 'number',
            description: 'Roughness value (0.0-1.0). Higher = rougher/less shiny',
          },
        },
        description:
          'Material to apply to all entities (for set_material). Use thoughtful color choices and PBR properties.',
      },
      materials: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            entity_id: { type: 'number' },
            material: {
              type: 'object',
              properties: {
                color: { type: 'string', description: 'Material color (hex)' },
                materialId: { type: 'string', description: 'Material ID reference' },
                metalness: { type: 'number', description: 'Metalness (0.0-1.0)' },
                roughness: { type: 'number', description: 'Roughness (0.0-1.0)' },
              },
            },
          },
          required: ['entity_id'],
        },
        description: 'Array of entities with individual material updates (for set_material)',
      },
    },
    required: ['action'],
  },
};

/**
 * Execute entity batch edit tool
 */
export async function executeEntityBatchEdit(params: IEntityBatchEditParams): Promise<string> {
  logger.info('Executing entity batch edit', { params });

  const { action } = params;

  switch (action) {
    case 'set_transforms':
      return setTransforms(params.entities || []);

    case 'offset_position':
      return offsetPosition(params.entity_ids || [], params.offset || { x: 0, y: 0, z: 0 });

    case 'set_material':
      if (params.materials) {
        return setMaterialsIndividual(params.materials);
      } else if (params.entity_ids && params.material) {
        return setMaterialUniform(params.entity_ids, params.material);
      } else {
        return 'Error: set_material requires either materials array or entity_ids + material';
      }

    default:
      return `Unknown action: ${action}`;
  }
}

/**
 * Set transforms for multiple entities
 */
async function setTransforms(entities: ITransformUpdate[]): Promise<string> {
  const componentRegistry = ComponentRegistry.getInstance();
  const queries = EntityQueries.getInstance();
  const results: string[] = [];
  let successCount = 0;
  let skipCount = 0;

  for (const entity of entities) {
    const { entity_id, position, rotation, scale } = entity;

    // Check if entity exists
    const allEntities = queries.listAllEntities();
    if (!allEntities.includes(entity_id)) {
      results.push(`Entity ${entity_id}: not found (skipped)`);
      skipCount++;
      continue;
    }

    // Check if entity has Transform component
    if (!queries.hasComponent(entity_id, 'Transform')) {
      results.push(`Entity ${entity_id}: no Transform component (skipped)`);
      skipCount++;
      continue;
    }

    // Apply transforms
    const transformData = componentRegistry.getComponentData(entity_id, 'Transform');
    if (!transformData) {
      results.push(`Entity ${entity_id}: failed to get Transform data (skipped)`);
      skipCount++;
      continue;
    }

    const updates: Record<string, unknown> = {};
    if (position) updates.position = [position.x, position.y, position.z];
    if (rotation) updates.rotation = [rotation.x, rotation.y, rotation.z];
    if (scale) updates.scale = [scale.x, scale.y, scale.z];

    try {
      await componentRegistry.updateComponent(entity_id, 'Transform', updates);
      successCount++;
    } catch (error) {
      results.push(`Entity ${entity_id}: update failed - ${error}`);
      skipCount++;
    }
  }

  const summary = `Batch transform update: ${successCount} succeeded, ${skipCount} skipped`;
  if (results.length > 0) {
    return `${summary}\n\nDetails:\n${results.join('\n')}`;
  }
  return summary;
}

/**
 * Offset positions for multiple entities
 */
async function offsetPosition(
  entityIds: number[],
  offset: { x: number; y: number; z: number },
): Promise<string> {
  const componentRegistry = ComponentRegistry.getInstance();
  const queries = EntityQueries.getInstance();
  const results: string[] = [];
  let successCount = 0;
  let skipCount = 0;

  for (const entity_id of entityIds) {
    // Check if entity exists
    const allEntities = queries.listAllEntities();
    if (!allEntities.includes(entity_id)) {
      results.push(`Entity ${entity_id}: not found (skipped)`);
      skipCount++;
      continue;
    }

    // Check if entity has Transform component
    if (!queries.hasComponent(entity_id, 'Transform')) {
      results.push(`Entity ${entity_id}: no Transform component (skipped)`);
      skipCount++;
      continue;
    }

    // Get current position
    const transformData = componentRegistry.getComponentData(entity_id, 'Transform') as
      | { position?: [number, number, number] }
      | undefined;
    if (!transformData?.position) {
      results.push(`Entity ${entity_id}: no position data (skipped)`);
      skipCount++;
      continue;
    }

    const currentPos = transformData.position;
    const newPosition = [
      currentPos[0] + offset.x,
      currentPos[1] + offset.y,
      currentPos[2] + offset.z,
    ];

    try {
      await componentRegistry.updateComponent(entity_id, 'Transform', { position: newPosition });
      successCount++;
    } catch (error) {
      results.push(`Entity ${entity_id}: update failed - ${error}`);
      skipCount++;
    }
  }

  const summary = `Batch position offset (${offset.x}, ${offset.y}, ${offset.z}): ${successCount} succeeded, ${skipCount} skipped`;
  if (results.length > 0) {
    return `${summary}\n\nDetails:\n${results.join('\n')}`;
  }
  return summary;
}

/**
 * Set materials uniformly for multiple entities
 */
async function setMaterialUniform(
  entityIds: number[],
  material: { color?: string; materialId?: string; metalness?: number; roughness?: number },
): Promise<string> {
  const componentRegistry = ComponentRegistry.getInstance();
  const queries = EntityQueries.getInstance();
  const results: string[] = [];
  let successCount = 0;
  let skipCount = 0;

  for (const entity_id of entityIds) {
    // Check if entity exists
    const allEntities = queries.listAllEntities();
    if (!allEntities.includes(entity_id)) {
      results.push(`Entity ${entity_id}: not found (skipped)`);
      skipCount++;
      continue;
    }

    // Check if entity has MeshRenderer component
    if (!queries.hasComponent(entity_id, 'MeshRenderer')) {
      results.push(`Entity ${entity_id}: no MeshRenderer component (skipped)`);
      skipCount++;
      continue;
    }

    try {
      const updates: Record<string, unknown> = {};

      if (material.materialId) {
        updates.materialId = material.materialId;
      }

      if (material.color || material.metalness !== undefined || material.roughness !== undefined) {
        updates.material = {
          shader: 'standard' as const,
          materialType: 'solid' as const,
          color: material.color || '#ffffff',
          metalness: material.metalness ?? 0,
          roughness: material.roughness ?? 0.7,
          emissive: '#000000',
          emissiveIntensity: 0,
          normalScale: 1,
          occlusionStrength: 1,
          textureOffsetX: 0,
          textureOffsetY: 0,
          textureRepeatX: 1,
          textureRepeatY: 1,
        };
      }

      if (Object.keys(updates).length > 0) {
        await componentRegistry.updateComponent(entity_id, 'MeshRenderer', updates);
        successCount++;
      }
    } catch (error) {
      results.push(`Entity ${entity_id}: update failed - ${error}`);
      skipCount++;
    }
  }

  const summary = `Batch material update: ${successCount} succeeded, ${skipCount} skipped`;
  if (results.length > 0) {
    return `${summary}\n\nDetails:\n${results.join('\n')}`;
  }
  return summary;
}

/**
 * Set materials individually for multiple entities
 */
async function setMaterialsIndividual(materials: IMaterialUpdate[]): Promise<string> {
  const componentRegistry = ComponentRegistry.getInstance();
  const queries = EntityQueries.getInstance();
  const results: string[] = [];
  let successCount = 0;
  let skipCount = 0;

  for (const item of materials) {
    const { entity_id, material } = item;

    // Check if entity exists
    const allEntities = queries.listAllEntities();
    if (!allEntities.includes(entity_id)) {
      results.push(`Entity ${entity_id}: not found (skipped)`);
      skipCount++;
      continue;
    }

    // Check if entity has MeshRenderer component
    if (!queries.hasComponent(entity_id, 'MeshRenderer')) {
      results.push(`Entity ${entity_id}: no MeshRenderer component (skipped)`);
      skipCount++;
      continue;
    }

    try {
      const updates: Record<string, unknown> = {};

      if (material?.materialId) {
        updates.materialId = material.materialId;
      }

      if (
        material &&
        (material.color || material.metalness !== undefined || material.roughness !== undefined)
      ) {
        updates.material = {
          shader: 'standard' as const,
          materialType: 'solid' as const,
          color: material.color || '#ffffff',
          metalness: material.metalness ?? 0,
          roughness: material.roughness ?? 0.7,
          emissive: '#000000',
          emissiveIntensity: 0,
          normalScale: 1,
          occlusionStrength: 1,
          textureOffsetX: 0,
          textureOffsetY: 0,
          textureRepeatX: 1,
          textureRepeatY: 1,
        };
      }

      if (Object.keys(updates).length > 0) {
        await componentRegistry.updateComponent(entity_id, 'MeshRenderer', updates);
        successCount++;
      }
    } catch (error) {
      results.push(`Entity ${entity_id}: update failed - ${error}`);
      skipCount++;
    }
  }

  const summary = `Batch material update: ${successCount} succeeded, ${skipCount} skipped`;
  if (results.length > 0) {
    return `${summary}\n\nDetails:\n${results.join('\n')}`;
  }
  return summary;
}
