/**
 * Entity Edit Tool
 * Allows the AI to modify entity properties, components, and transforms
 */

import { componentRegistry } from '@core/lib/ecs/ComponentRegistry';
import { EntityManager } from '@core/lib/ecs/EntityManager';
import { KnownComponentTypes } from '@core/lib/ecs/IComponent';
import { getComponentDefaults } from '@core/lib/serialization/defaults/ComponentDefaults';
import { Logger } from '@core/lib/logger';

const logger = Logger.create('EntityEditTool');
const entityManager = EntityManager.getInstance();

type Vec3 = { x: number; y: number; z: number };
type TransformProperty = 'position' | 'rotation' | 'scale';

function isPrefabRoot(entityId: number): boolean {
  return (
    componentRegistry.hasComponent(entityId, 'PrefabInstance') &&
    !componentRegistry.hasComponent(entityId, KnownComponentTypes.TRANSFORM)
  );
}

function updateEntityTransform(
  entityId: number,
  property: TransformProperty,
  value: Vec3,
): boolean {
  return componentRegistry.updateComponent(entityId, KnownComponentTypes.TRANSFORM, {
    [property]: [value.x, value.y, value.z],
  });
}

function propagatePositionToPrefabChildren(targetPos: Vec3, children: number[]): void {
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

function propagateRotationToPrefabChildren(targetRot: Vec3, children: number[]): void {
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

function propagateScaleToPrefabChildren(targetScale: Vec3, children: number[]): void {
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

function updateTransform(
  entityId: number,
  property: TransformProperty,
  value: Vec3,
): { success: boolean; message: string } {
  if (isPrefabRoot(entityId)) {
    const entity = entityManager.getEntity(entityId);
    if (!entity?.children || entity.children.length === 0) {
      return {
        success: false,
        message: `Error: Prefab root entity ${entityId} has no children to update`,
      };
    }

    if (property === 'position') {
      propagatePositionToPrefabChildren(value, entity.children);
    } else if (property === 'rotation') {
      propagateRotationToPrefabChildren(value, entity.children);
    } else {
      propagateScaleToPrefabChildren(value, entity.children);
    }

    const unit = property === 'rotation' ? '°' : '';
    return {
      success: true,
      message: `Set ${property} of prefab ${entityId} to (${value.x}${unit}, ${value.y}${unit}, ${value.z}${unit}) by propagating to ${entity.children.length} children`,
    };
  }

  const success = updateEntityTransform(entityId, property, value);
  if (!success) {
    return {
      success: false,
      message: `Error: Failed to update ${property} for entity ${entityId}. Entity may not exist or lack Transform component.`,
    };
  }

  const unit = property === 'rotation' ? '°' : '';
  return {
    success: true,
    message: `Set ${property} of entity ${entityId} to (${value.x}${unit}, ${value.y}${unit}, ${value.z}${unit})`,
  };
}

export const entityEditTool = {
  name: 'entity_edit',
  description: `Modify entity properties including transform, components, and other attributes.

IMPORTANT - Valid Component Types:
- Transform: Position, rotation, scale (usually already present)
- MeshRenderer: Visual mesh rendering (use for primitives)
- MeshCollider: Physics collision (types: box, sphere, capsule, mesh, heightfield)
- RigidBody: Physics body (types: dynamic, kinematic, fixed)
- Light: Light sources (types: directional, point, spot, ambient)
- Camera: Camera view
- CharacterController: Player movement
- Script: Lua scripting
- PrefabInstance: Prefab reference
- Terrain: Terrain generation
- CustomShape: Custom geometry
- GeometryAsset: External geometry file
- Enabled: Enable/disable entity

BEFORE adding components, check what the entity already has to avoid duplicates.`,
  input_schema: {
    type: 'object' as const,
    properties: {
      entity_id: {
        type: 'number',
        description: 'ID of the entity to modify',
      },
      action: {
        type: 'string',
        enum: [
          'set_position',
          'set_rotation',
          'set_scale',
          'rename',
          'delete',
          'batch_delete',
          'add_component',
          'remove_component',
          'set_component_property',
          'get_component',
          'duplicate',
          'set_parent',
          'set_enabled',
        ],
        description: 'Action to perform on the entity',
      },
      position: {
        type: 'object',
        properties: {
          x: { type: 'number' },
          y: { type: 'number' },
          z: { type: 'number' },
        },
        description: 'New position (for set_position)',
      },
      rotation: {
        type: 'object',
        properties: {
          x: { type: 'number' },
          y: { type: 'number' },
          z: { type: 'number' },
        },
        description: 'New rotation in degrees (for set_rotation)',
      },
      scale: {
        type: 'object',
        properties: {
          x: { type: 'number' },
          y: { type: 'number' },
          z: { type: 'number' },
        },
        description: 'New scale (for set_scale)',
      },
      name: {
        type: 'string',
        description: 'New name (for rename)',
      },
      component_type: {
        type: 'string',
        description:
          'Component type (for add_component, remove_component, set_component_property). Valid types: Transform, MeshRenderer, MeshCollider (NOT "Collider"), RigidBody, Light, Camera, CharacterController, Script, Terrain, CustomShape, GeometryAsset. See tool description for full list.',
      },
      property_name: {
        type: 'string',
        description: 'Property name (for set_component_property)',
      },
      property_value: {
        description: 'Property value (for set_component_property)',
      },
      parent_id: {
        type: 'number',
        description: 'Parent entity ID (for set_parent). Use null to unparent.',
      },
      enabled: {
        type: 'boolean',
        description: 'Enabled state (for set_enabled)',
      },
      entity_ids: {
        type: 'array',
        items: { type: 'number' },
        description: 'Array of entity IDs (for batch_delete)',
      },
    },
    required: ['action'],
  },
};

/**
 * Execute entity edit tool
 */
export async function executeEntityEdit(params: Record<string, unknown>): Promise<string> {
  logger.info('Executing entity edit', { params });

  const {
    entity_id: entityIdRaw,
    action,
    position,
    rotation,
    scale,
    name,
    component_type,
    property_name,
    property_value,
    parent_id,
    enabled,
    entity_ids,
  } = params;

  // For batch operations, entity_id is optional
  const isBatchOperation = action === 'batch_delete';

  // Validate entity_id for non-batch operations
  if (!isBatchOperation && typeof entityIdRaw !== 'number') {
    return 'Error: entity_id must be a number';
  }
  const entity_id = entityIdRaw as number;

  switch (action) {
    case 'set_position':
      if (
        !position ||
        typeof position !== 'object' ||
        !('x' in position) ||
        !('y' in position) ||
        !('z' in position)
      ) {
        return 'Error: position is required for set_position and must have x, y, z properties';
      }
      return setPosition(entity_id, position as { x: number; y: number; z: number });

    case 'set_rotation':
      if (
        !rotation ||
        typeof rotation !== 'object' ||
        !('x' in rotation) ||
        !('y' in rotation) ||
        !('z' in rotation)
      ) {
        return 'Error: rotation is required for set_rotation and must have x, y, z properties';
      }
      return setRotation(entity_id, rotation as { x: number; y: number; z: number });

    case 'set_scale':
      if (
        !scale ||
        typeof scale !== 'object' ||
        !('x' in scale) ||
        !('y' in scale) ||
        !('z' in scale)
      ) {
        return 'Error: scale is required for set_scale and must have x, y, z properties';
      }
      return setScale(entity_id, scale as { x: number; y: number; z: number });

    case 'rename':
      if (!name || typeof name !== 'string') {
        return 'Error: name is required for rename and must be a string';
      }
      return renameEntity(entity_id, name);

    case 'delete':
      return deleteEntity(entity_id);

    case 'batch_delete':
      if (!entity_ids || !Array.isArray(entity_ids) || entity_ids.length === 0) {
        return 'Error: entity_ids array is required for batch_delete and must not be empty';
      }
      return batchDeleteEntities(entity_ids as number[]);

    case 'add_component':
      if (!component_type || typeof component_type !== 'string') {
        return 'Error: component_type is required for add_component and must be a string';
      }
      return addComponent(entity_id, component_type);

    case 'remove_component':
      if (!component_type || typeof component_type !== 'string') {
        return 'Error: component_type is required for remove_component and must be a string';
      }
      return removeComponent(entity_id, component_type);

    case 'set_component_property':
      if (
        !component_type ||
        typeof component_type !== 'string' ||
        !property_name ||
        typeof property_name !== 'string' ||
        property_value === undefined
      ) {
        return 'Error: component_type (string), property_name (string), and property_value are required';
      }
      return setComponentProperty(entity_id, component_type, property_name, property_value);

    case 'get_component':
      if (!component_type || typeof component_type !== 'string') {
        return 'Error: component_type is required for get_component and must be a string';
      }
      return getComponent(entity_id, component_type);

    case 'duplicate':
      return duplicateEntity(entity_id);

    case 'set_parent':
      if (parent_id !== null && parent_id !== undefined && typeof parent_id !== 'number') {
        return 'Error: parent_id must be a number or null for set_parent';
      }
      return setParent(entity_id, parent_id as number | null | undefined);

    case 'set_enabled':
      if (typeof enabled !== 'boolean') {
        return 'Error: enabled is required for set_enabled and must be a boolean';
      }
      return setEnabled(entity_id, enabled);

    default:
      return `Unknown action: ${action}`;
  }
}

function setPosition(entityId: number, position: { x: number; y: number; z: number }): string {
  try {
    window.dispatchEvent(
      new CustomEvent('agent:set-position', {
        detail: { entityId, position },
      }),
    );

    const result = updateTransform(entityId, 'position', position);
    if (result.success) {
      logger.info('Position updated', { entityId, position });
    }
    return result.message;
  } catch (error) {
    logger.error('Failed to set position', { error, entityId });
    return `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}

function setRotation(entityId: number, rotation: { x: number; y: number; z: number }): string {
  try {
    window.dispatchEvent(
      new CustomEvent('agent:set-rotation', {
        detail: { entityId, rotation },
      }),
    );

    const result = updateTransform(entityId, 'rotation', rotation);
    if (result.success) {
      logger.info('Rotation updated', { entityId, rotation });
    }
    return result.message;
  } catch (error) {
    logger.error('Failed to set rotation', { error, entityId });
    return `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}

function setScale(entityId: number, scale: { x: number; y: number; z: number }): string {
  try {
    window.dispatchEvent(
      new CustomEvent('agent:set-scale', {
        detail: { entityId, scale },
      }),
    );

    const result = updateTransform(entityId, 'scale', scale);
    if (result.success) {
      logger.info('Scale updated', { entityId, scale });
    }
    return result.message;
  } catch (error) {
    logger.error('Failed to set scale', { error, entityId });
    return `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}

function renameEntity(entityId: number, name: string): string {
  try {
    window.dispatchEvent(
      new CustomEvent('agent:rename-entity', {
        detail: { entityId, name },
      }),
    );

    const entity = entityManager.getEntity(entityId);
    if (!entity) {
      return `Error: Entity ${entityId} not found`;
    }

    entity.name = name;
    logger.info('Entity renamed', { entityId, name });
    return `Renamed entity ${entityId} to "${name}"`;
  } catch (error) {
    logger.error('Failed to rename entity', { error, entityId });
    return `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}

function deleteEntity(entityId: number): string {
  try {
    window.dispatchEvent(
      new CustomEvent('agent:delete-entity', {
        detail: { entityId },
      }),
    );

    entityManager.deleteEntity(entityId);
    logger.info('Entity deleted', { entityId });
    return `Deleted entity ${entityId}`;
  } catch (error) {
    logger.error('Failed to delete entity', { error, entityId });
    return `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}

function addComponent(entityId: number, componentType: string): string {
  try {
    const defaults = getComponentDefaults(componentType);
    const componentData = defaults ? { ...defaults } : {};

    const success = componentRegistry.addComponent(entityId, componentType, componentData);
    if (!success) {
      return `Error: Failed to add ${componentType} component to entity ${entityId}. Check if component already exists or has conflicts.`;
    }

    logger.info('Component added', { entityId, componentType });
    return `Added ${componentType} component to entity ${entityId}`;
  } catch (error) {
    logger.error('Failed to add component', { error, entityId, componentType });
    return `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}

function removeComponent(entityId: number, componentType: string): string {
  try {
    const success = componentRegistry.removeComponent(entityId, componentType);
    if (!success) {
      return `Error: Failed to remove ${componentType} component from entity ${entityId}. Component may not exist.`;
    }

    logger.info('Component removed', { entityId, componentType });
    return `Removed ${componentType} component from entity ${entityId}`;
  } catch (error) {
    logger.error('Failed to remove component', { error, entityId, componentType });
    return `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}

function setComponentProperty(
  entityId: number,
  componentType: string,
  propertyName: string,
  propertyValue: unknown,
): string {
  try {
    // Parse JSON strings to objects if needed
    let parsedValue = propertyValue;
    if (typeof propertyValue === 'string') {
      try {
        parsedValue = JSON.parse(propertyValue);
      } catch {
        // If parsing fails, use the string as-is
        parsedValue = propertyValue;
      }
    }

    const success = componentRegistry.updateComponent(entityId, componentType, {
      [propertyName]: parsedValue,
    });

    if (!success) {
      return `Error: Failed to set ${componentType}.${propertyName} on entity ${entityId}. Entity may not have this component.`;
    }

    logger.info('Component property updated', {
      entityId,
      componentType,
      propertyName,
      propertyValue: parsedValue,
    });
    return `Set ${componentType}.${propertyName} = ${JSON.stringify(parsedValue)} on entity ${entityId}`;
  } catch (error) {
    logger.error('Failed to set component property', {
      error,
      entityId,
      componentType,
      propertyName,
    });
    return `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}

function getComponent(entityId: number, componentType: string): string {
  try {
    const data = componentRegistry.getComponentData(entityId, componentType);
    logger.info('Component data retrieved', { entityId, componentType, data });
    return `${componentType} component data for entity ${entityId}: ${JSON.stringify(data, null, 2)}`;
  } catch (error) {
    logger.error('Failed to get component', { error, entityId, componentType });
    return `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}

function duplicateEntity(entityId: number): string {
  try {
    const entity = entityManager.getEntity(entityId);
    if (!entity) {
      return `Error: Entity ${entityId} not found`;
    }

    // Create new entity with same name + " (Copy)"
    const newEntity = entityManager.createEntity(`${entity.name} (Copy)`);

    // Copy all components from original entity
    const components = componentRegistry.getEntityComponents(entityId);
    for (const componentType of components) {
      const componentData = componentRegistry.getComponentData(entityId, componentType);
      componentRegistry.addComponent(newEntity.id, componentType, componentData);
    }

    // Copy parent relationship
    if (entity.parentId !== undefined) {
      entityManager.setParent(newEntity.id, entity.parentId);
    }

    logger.info('Entity duplicated', { originalId: entityId, newId: newEntity.id });
    return `Duplicated entity ${entityId} to new entity ${newEntity.id}`;
  } catch (error) {
    logger.error('Failed to duplicate entity', { error, entityId });
    return `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}

function setParent(entityId: number, parentId: number | null | undefined): string {
  try {
    entityManager.setParent(entityId, parentId ?? undefined);
    logger.info('Entity parent updated', { entityId, parentId });

    if (parentId === null || parentId === undefined) {
      return `Unparented entity ${entityId}`;
    }
    return `Set parent of entity ${entityId} to ${parentId}`;
  } catch (error) {
    logger.error('Failed to set parent', { error, entityId, parentId });
    return `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}

function setEnabled(entityId: number, enabled: boolean): string {
  try {
    // Check if entity has an Enabled component, if not add it
    if (!componentRegistry.hasComponent(entityId, 'Enabled')) {
      componentRegistry.addComponent(entityId, 'Enabled', { enabled });
    } else {
      componentRegistry.updateComponent(entityId, 'Enabled', { enabled });
    }

    logger.info('Entity enabled state updated', { entityId, enabled });
    return `Set entity ${entityId} enabled state to ${enabled}`;
  } catch (error) {
    logger.error('Failed to set enabled state', { error, entityId, enabled });
    return `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}

function batchDeleteEntities(entityIds: number[]): string {
  try {
    const errors: string[] = [];
    let successCount = 0;

    for (const entityId of entityIds) {
      try {
        entityManager.deleteEntity(entityId);
        successCount++;
      } catch (error) {
        errors.push(
          `Failed to delete entity ${entityId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }
    }

    logger.info('Batch entity deletion completed', {
      requested: entityIds.length,
      succeeded: successCount,
      failed: errors.length,
    });

    if (errors.length > 0) {
      return `Batch deleted ${successCount}/${entityIds.length} entities. Errors: ${errors.join('; ')}`;
    }

    return `Batch deleted ${successCount} entities: ${entityIds.join(', ')}`;
  } catch (error) {
    logger.error('Failed to batch delete entities', { error, entityIds });
    return `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}
