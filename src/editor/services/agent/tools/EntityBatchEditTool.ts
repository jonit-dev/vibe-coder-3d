/**
 * Entity Batch Edit Tool
 * Allows the AI to apply transforms/materials to multiple entities in one call
 * Following PRD: docs/PRDs/editor/ai-first-chat-flexibility-prd.md
 */

import { Logger } from '@core/lib/logger';
import { ComponentRegistry } from '@core/lib/ecs/ComponentRegistry';
import { EntityQueries } from '@core/lib/ecs/queries/entityQueries';
import { EntityManager } from '@core/lib/ecs/EntityManager';
import { KnownComponentTypes } from '@core/lib/ecs/IComponent';

const logger = Logger.create('EntityBatchEditTool');
const entityManager = EntityManager.getInstance();

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

// Helper functions for prefab handling (same as EntityEditTool)
function isPrefabRoot(entityId: number): boolean {
  const componentRegistry = ComponentRegistry.getInstance();
  return (
    componentRegistry.hasComponent(entityId, 'PrefabInstance') &&
    !componentRegistry.hasComponent(entityId, KnownComponentTypes.TRANSFORM)
  );
}

function propagatePositionToPrefabChildren(
  targetPos: { x: number; y: number; z: number },
  children: number[],
): void {
  const componentRegistry = ComponentRegistry.getInstance();
  const firstChildData = componentRegistry.getComponentData(
    children[0],
    KnownComponentTypes.TRANSFORM,
  ) as { position?: [number, number, number] } | undefined;
  const currentPos = firstChildData?.position || [0, 0, 0];
  const delta: [number, number, number] = [
    targetPos.x - currentPos[0],
    targetPos.y - currentPos[1],
    targetPos.z - currentPos[2],
  ];

  for (const childId of children) {
    if (componentRegistry.hasComponent(childId, KnownComponentTypes.TRANSFORM)) {
      const childData = componentRegistry.getComponentData(
        childId,
        KnownComponentTypes.TRANSFORM,
      ) as { position?: [number, number, number] } | undefined;
      const childPos = childData?.position || [0, 0, 0];
      componentRegistry.updateComponent(childId, KnownComponentTypes.TRANSFORM, {
        position: [childPos[0] + delta[0], childPos[1] + delta[1], childPos[2] + delta[2]],
      });
    }
  }
}

function propagateRotationToPrefabChildren(
  targetRot: { x: number; y: number; z: number },
  children: number[],
): void {
  const componentRegistry = ComponentRegistry.getInstance();
  const firstChildData = componentRegistry.getComponentData(
    children[0],
    KnownComponentTypes.TRANSFORM,
  ) as { rotation?: [number, number, number] } | undefined;
  const currentRot = firstChildData?.rotation || [0, 0, 0];
  const delta: [number, number, number] = [
    targetRot.x - currentRot[0],
    targetRot.y - currentRot[1],
    targetRot.z - currentRot[2],
  ];

  for (const childId of children) {
    if (componentRegistry.hasComponent(childId, KnownComponentTypes.TRANSFORM)) {
      const childData = componentRegistry.getComponentData(
        childId,
        KnownComponentTypes.TRANSFORM,
      ) as { rotation?: [number, number, number] } | undefined;
      const childRot = childData?.rotation || [0, 0, 0];
      componentRegistry.updateComponent(childId, KnownComponentTypes.TRANSFORM, {
        rotation: [childRot[0] + delta[0], childRot[1] + delta[1], childRot[2] + delta[2]],
      });
    }
  }
}

function propagateScaleToPrefabChildren(
  targetScale: { x: number; y: number; z: number },
  children: number[],
): void {
  const componentRegistry = ComponentRegistry.getInstance();
  const firstChildData = componentRegistry.getComponentData(
    children[0],
    KnownComponentTypes.TRANSFORM,
  ) as { scale?: [number, number, number] } | undefined;
  const currentScale = firstChildData?.scale || [1, 1, 1];
  const multiplier: [number, number, number] = [
    currentScale[0] !== 0 ? targetScale.x / currentScale[0] : 1,
    currentScale[1] !== 0 ? targetScale.y / currentScale[1] : 1,
    currentScale[2] !== 0 ? targetScale.z / currentScale[2] : 1,
  ];

  for (const childId of children) {
    if (componentRegistry.hasComponent(childId, KnownComponentTypes.TRANSFORM)) {
      const childData = componentRegistry.getComponentData(
        childId,
        KnownComponentTypes.TRANSFORM,
      ) as { scale?: [number, number, number] } | undefined;
      const childScale = childData?.scale || [1, 1, 1];
      componentRegistry.updateComponent(childId, KnownComponentTypes.TRANSFORM, {
        scale: [
          childScale[0] * multiplier[0],
          childScale[1] * multiplier[1],
          childScale[2] * multiplier[2],
        ],
      });
    }
  }
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

    // Handle prefab roots (entities with PrefabInstance but no Transform)
    if (isPrefabRoot(entity_id)) {
      const entityData = entityManager.getEntity(entity_id);
      if (!entityData?.children || entityData.children.length === 0) {
        results.push(`Entity ${entity_id}: prefab root with no children (skipped)`);
        skipCount++;
        continue;
      }

      try {
        if (position) {
          propagatePositionToPrefabChildren(position, entityData.children);
        }
        if (rotation) {
          propagateRotationToPrefabChildren(rotation, entityData.children);
        }
        if (scale) {
          propagateScaleToPrefabChildren(scale, entityData.children);
        }
        successCount++;
      } catch (error) {
        results.push(`Entity ${entity_id}: prefab propagation failed - ${error}`);
        skipCount++;
      }
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

    // Handle prefab roots (entities with PrefabInstance but no Transform)
    if (isPrefabRoot(entity_id)) {
      const entityData = entityManager.getEntity(entity_id);
      if (!entityData?.children || entityData.children.length === 0) {
        results.push(`Entity ${entity_id}: prefab root with no children (skipped)`);
        skipCount++;
        continue;
      }

      try {
        // For offset, we need to get the current position from first child and add offset
        const firstChildData = componentRegistry.getComponentData(
          entityData.children[0],
          KnownComponentTypes.TRANSFORM,
        ) as { position?: [number, number, number] } | undefined;
        const currentPos = firstChildData?.position || [0, 0, 0];
        const targetPos = {
          x: currentPos[0] + offset.x,
          y: currentPos[1] + offset.y,
          z: currentPos[2] + offset.z,
        };
        propagatePositionToPrefabChildren(targetPos, entityData.children);
        successCount++;
      } catch (error) {
        results.push(`Entity ${entity_id}: prefab offset failed - ${error}`);
        skipCount++;
      }
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
