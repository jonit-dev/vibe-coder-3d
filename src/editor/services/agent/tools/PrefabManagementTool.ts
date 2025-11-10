/**
 * Prefab Management Tool
 * Allows the AI to create, instantiate, and manage prefabs
 */

import { Logger } from '@core/lib/logger';

const logger = Logger.create('PrefabManagementTool');

export const prefabManagementTool = {
  name: 'prefab_management',
  description: `Manage prefabs (reusable entity templates) in the scene.

Prefabs are reusable templates that can be instantiated multiple times. They're useful for:
- Objects that appear multiple times (trees, rocks, enemies, props)
- Complex multi-entity structures (buildings, vehicles, characters)
- Templates for consistent object creation

Actions:
- create_from_primitives: Create a prefab from a specification of primitive shapes (PREFERRED for forests, buildings, props)
- create_from_selection: Create a prefab from currently selected entities
- instantiate: Place an instance of a prefab in the scene
- list_prefabs: List all available prefabs
- create_variant: Create a variant of an existing prefab
- unpack_instance: Convert prefab instance to regular entity`,
  input_schema: {
    type: 'object' as const,
    properties: {
      action: {
        type: 'string',
        enum: [
          'create_from_primitives',
          'create_from_selection',
          'instantiate',
          'list_prefabs',
          'create_variant',
          'unpack_instance',
        ],
        description: 'The prefab action to perform',
      },
      name: {
        type: 'string',
        description:
          'Prefab name (for create_from_primitives, create_from_selection, create_variant)',
      },
      primitives: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              description: 'Primitive type (Cube, Sphere, Cylinder, Cone, etc.)',
            },
            position: {
              type: 'object',
              properties: { x: { type: 'number' }, y: { type: 'number' }, z: { type: 'number' } },
            },
            rotation: {
              type: 'object',
              properties: { x: { type: 'number' }, y: { type: 'number' }, z: { type: 'number' } },
            },
            scale: {
              type: 'object',
              properties: { x: { type: 'number' }, y: { type: 'number' }, z: { type: 'number' } },
            },
            name: { type: 'string', description: 'Name for this part' },
            material: {
              type: 'object',
              properties: {
                color: { type: 'string', description: 'Hex color (e.g., "#ff0000" for red)' },
                materialId: { type: 'string', description: 'Material ID from material registry' },
              },
              description: 'Material properties for this primitive',
            },
          },
          required: ['type'],
        },
        description:
          'Array of primitive specifications to compose the prefab (for create_from_primitives)',
      },
      prefab_id: {
        type: 'string',
        description: 'Prefab ID (for instantiate, create_variant base)',
      },
      position: {
        type: 'object',
        properties: {
          x: { type: 'number' },
          y: { type: 'number' },
          z: { type: 'number' },
        },
        description: 'Position to instantiate prefab (optional, defaults to 0,0,0)',
      },
      entity_id: {
        type: 'number',
        description: 'Entity ID (for unpack_instance)',
      },
    },
    required: ['action'],
  },
};

/**
 * Execute prefab management tool
 */
export async function executePrefabManagement(params: any): Promise<string> {
  logger.info('Executing prefab management', { params });

  const { action, name, prefab_id, position, entity_id, primitives } = params;

  switch (action) {
    case 'create_from_primitives':
      if (!name || !primitives || !Array.isArray(primitives)) {
        return 'Error: name and primitives array are required for create_from_primitives';
      }
      return createPrefabFromPrimitives(name, primitives);

    case 'create_from_selection':
      if (!name) {
        return 'Error: name is required for create_from_selection';
      }
      return createPrefabFromSelection(name);

    case 'instantiate':
      if (!prefab_id) {
        return 'Error: prefab_id is required for instantiate';
      }
      return instantiatePrefab(prefab_id, position);

    case 'list_prefabs':
      return listPrefabs();

    case 'create_variant':
      if (!prefab_id || !name) {
        return 'Error: prefab_id and name are required for create_variant';
      }
      return createVariant(prefab_id, name);

    case 'unpack_instance':
      if (!entity_id) {
        return 'Error: entity_id is required for unpack_instance';
      }
      return unpackInstance(entity_id);

    default:
      return `Unknown action: ${action}`;
  }
}

interface IPrimitiveSpec {
  type: string;
  position?: { x: number; y: number; z: number };
  rotation?: { x: number; y: number; z: number };
  scale?: { x: number; y: number; z: number };
  name?: string;
  material?: {
    color?: string;
    materialId?: string;
  };
}

function createPrefabFromPrimitives(name: string, primitives: IPrimitiveSpec[]): string {
  const event = new CustomEvent('agent:create-prefab-from-primitives', {
    detail: { name, primitives },
  });
  window.dispatchEvent(event);

  const prefabId = name.toLowerCase().replace(/\s+/g, '-');
  logger.info('Prefab creation requested from primitives', {
    name,
    primitiveCount: primitives.length,
    primitiveTypes: primitives.map((p) => p.type),
  });

  return `Created prefab "${name}" (id: "${prefabId}") from ${primitives.length} primitives. You can now instantiate it multiple times using the instantiate action with prefab_id="${prefabId}".`;
}

function createPrefabFromSelection(name: string): string {
  const event = new CustomEvent('agent:create-prefab', {
    detail: { name },
  });
  window.dispatchEvent(event);

  logger.info('Prefab creation requested from selection', { name });
  return `Created prefab "${name}" from selected entities. You can now instantiate it using prefab_id="${name.toLowerCase().replace(/\s+/g, '-')}"`;
}

function instantiatePrefab(
  prefabId: string,
  position?: { x: number; y: number; z: number },
): string {
  const event = new CustomEvent('agent:instantiate-prefab', {
    detail: {
      prefabId,
      position: position ? [position.x, position.y, position.z] : [0, 0, 0],
    },
  });
  window.dispatchEvent(event);

  const posStr = position
    ? `at (${position.x}, ${position.y}, ${position.z})`
    : 'at origin (0, 0, 0)';
  logger.info('Prefab instantiation requested', { prefabId, position });
  return `Instantiated prefab "${prefabId}" ${posStr}`;
}

function listPrefabs(): string {
  const event = new CustomEvent('agent:list-prefabs');

  // Create a promise to wait for the result
  let resultReceived = false;
  let prefabList: Array<{ id: string; name: string; tags: string[] }> = [];

  const handleResult = (e: Event) => {
    const customEvent = e as CustomEvent;
    prefabList = customEvent.detail.prefabs;
    resultReceived = true;
  };

  window.addEventListener('agent:prefab-list-result', handleResult, { once: true });
  window.dispatchEvent(event);

  // Wait briefly for sync response (the event handler should fire immediately)
  // This is safe because the event is dispatched synchronously
  if (!resultReceived) {
    window.removeEventListener('agent:prefab-list-result', handleResult);
    return 'No prefabs available';
  }

  logger.info('Prefab list retrieved', { count: prefabList.length });

  if (prefabList.length === 0) {
    return 'No prefabs available. You can create prefabs from selected entities using create_from_selection action.';
  }

  const formattedList = prefabList
    .map(
      (p) =>
        `- ${p.name} (id: "${p.id}"${p.tags.length > 0 ? `, tags: ${p.tags.join(', ')}` : ''})`,
    )
    .join('\n');

  return `Available prefabs (${prefabList.length}):\n${formattedList}`;
}

function createVariant(baseId: string, name: string): string {
  const event = new CustomEvent('agent:create-variant', {
    detail: { baseId, name },
  });
  window.dispatchEvent(event);

  logger.info('Prefab variant creation requested', { baseId, name });
  return `Created variant "${name}" based on prefab "${baseId}"`;
}

function unpackInstance(entityId: number): string {
  const event = new CustomEvent('agent:unpack-prefab', {
    detail: { entityId },
  });
  window.dispatchEvent(event);

  logger.info('Prefab unpack requested', { entityId });
  return `Unpacked prefab instance ${entityId} into regular entity`;
}
