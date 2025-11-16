/**
 * Entity Edit Tool
 * Allows the AI to modify entity properties, components, and transforms
 */

import { Logger } from '@core/lib/logger';

const logger = Logger.create('EntityEditTool');

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
  const event = new CustomEvent('agent:set-position', {
    detail: { entityId, position },
  });
  window.dispatchEvent(event);

  return `Set position of entity ${entityId} to (${position.x}, ${position.y}, ${position.z})`;
}

function setRotation(entityId: number, rotation: { x: number; y: number; z: number }): string {
  const event = new CustomEvent('agent:set-rotation', {
    detail: { entityId, rotation },
  });
  window.dispatchEvent(event);

  return `Set rotation of entity ${entityId} to (${rotation.x}°, ${rotation.y}°, ${rotation.z}°)`;
}

function setScale(entityId: number, scale: { x: number; y: number; z: number }): string {
  const event = new CustomEvent('agent:set-scale', {
    detail: { entityId, scale },
  });
  window.dispatchEvent(event);

  return `Set scale of entity ${entityId} to (${scale.x}, ${scale.y}, ${scale.z})`;
}

function renameEntity(entityId: number, name: string): string {
  const event = new CustomEvent('agent:rename-entity', {
    detail: { entityId, name },
  });
  window.dispatchEvent(event);

  return `Renamed entity ${entityId} to "${name}"`;
}

function deleteEntity(entityId: number): string {
  const event = new CustomEvent('agent:delete-entity', {
    detail: { entityId },
  });
  window.dispatchEvent(event);

  return `Deleted entity ${entityId}`;
}

function addComponent(entityId: number, componentType: string): string {
  const event = new CustomEvent('agent:add-component', {
    detail: { entityId, componentType },
  });
  window.dispatchEvent(event);

  return `Added ${componentType} component to entity ${entityId}`;
}

function removeComponent(entityId: number, componentType: string): string {
  const event = new CustomEvent('agent:remove-component', {
    detail: { entityId, componentType },
  });
  window.dispatchEvent(event);

  return `Removed ${componentType} component from entity ${entityId}`;
}

function setComponentProperty(
  entityId: number,
  componentType: string,
  propertyName: string,
  propertyValue: unknown,
): string {
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

  const event = new CustomEvent('agent:set-component-property', {
    detail: { entityId, componentType, propertyName, propertyValue: parsedValue },
  });
  window.dispatchEvent(event);

  return `Set ${componentType}.${propertyName} = ${JSON.stringify(parsedValue)} on entity ${entityId}`;
}

function getComponent(entityId: number, componentType: string): string {
  const event = new CustomEvent('agent:get-component', {
    detail: { entityId, componentType },
  });
  window.dispatchEvent(event);

  return `Requested ${componentType} component data for entity ${entityId}`;
}

function duplicateEntity(entityId: number): string {
  const event = new CustomEvent('agent:duplicate-entity', {
    detail: { entityId },
  });
  window.dispatchEvent(event);

  return `Duplicated entity ${entityId}`;
}

function setParent(entityId: number, parentId: number | null | undefined): string {
  const event = new CustomEvent('agent:set-parent', {
    detail: { entityId, parentId },
  });
  window.dispatchEvent(event);

  if (parentId === null || parentId === undefined) {
    return `Unparented entity ${entityId}`;
  }
  return `Set parent of entity ${entityId} to ${parentId}`;
}

function setEnabled(entityId: number, enabled: boolean): string {
  const event = new CustomEvent('agent:set-enabled', {
    detail: { entityId, enabled },
  });
  window.dispatchEvent(event);

  return `Set entity ${entityId} enabled state to ${enabled}`;
}

function batchDeleteEntities(entityIds: number[]): string {
  const event = new CustomEvent('agent:batch-delete-entities', {
    detail: { entityIds },
  });
  window.dispatchEvent(event);

  logger.info('Batch entity deletion requested', { count: entityIds.length, entityIds });
  return `Batch deleted ${entityIds.length} entities: ${entityIds.join(', ')}`;
}
