/**
 * Prefab Management Tool
 * Allows the AI to create, instantiate, and manage prefabs
 */

import { Logger } from '@core/lib/logger';

const logger = Logger.create('PrefabManagementTool');

// Prefab management tool parameter types
interface IPrefabManagementParams {
  action:
    | 'create_from_primitives'
    | 'create_from_selection'
    | 'create_and_instantiate'
    | 'instantiate'
    | 'batch_instantiate'
    | 'list_prefabs'
    | 'create_variant'
    | 'unpack_instance';
  name?: string;
  primitives?: Array<{
    type: string;
    position?: [number, number, number];
    rotation?: [number, number, number];
    scale?: [number, number, number];
    material?: string;
  }>;
  prefab_id?: string;
  position?: [number, number, number] | { x: number; y: number; z: number };
  rotation?: [number, number, number];
  scale?: [number, number, number];
  variant_name?: string;
  entity_id?: number;
  instances?: Array<{
    position?: [number, number, number] | { x: number; y: number; z: number };
    rotation?: [number, number, number] | { x: number; y: number; z: number };
    scale?: [number, number, number] | { x: number; y: number; z: number };
  }>;
  // For create_and_instantiate action
  instance_positions?: Array<[number, number, number] | { x: number; y: number; z: number }>;
}

export const prefabManagementTool = {
  name: 'prefab_management',
  description: `Manage prefabs (reusable entity templates) in the scene.

Prefabs are reusable templates that can be instantiated multiple times. They're useful for:
- Objects that appear multiple times (trees, rocks, enemies, props)
- Complex multi-entity structures (buildings, vehicles, characters)
- Templates for consistent object creation

Actions:
- create_from_primitives: Create a reusable prefab template from primitives (USE ONLY when you want to create a template for later use - DOES NOT place anything in scene)
- create_from_selection: Create a reusable prefab template from selected entities (USE ONLY when you want to create a template for later use)
- create_and_instantiate: Create prefab AND immediately place instances (USE WHEN you want pieces visible in the scene immediately - MOST COMMON for chess pieces, characters, etc.)
- instantiate: Place an instance of an existing prefab in the scene (requires prefab_id)
- batch_instantiate: Place multiple instances of an existing prefab at specified positions (requires prefab_id and positions array)
- list_prefabs: List all available prefabs
- create_variant: Create a variant of an existing prefab
- unpack_instance: Convert prefab instance to regular entity

IMPORTANT:
- If you want pieces visible in the scene NOW, use create_and_instantiate or batch_instantiate
- If you want to create reusable templates ONLY (no visible pieces), use create_from_primitives
- Do NOT mix create_from_primitives with separate instantiation unless necessary`,
  input_schema: {
    type: 'object' as const,
    properties: {
      action: {
        type: 'string',
        enum: [
          'create_from_primitives',
          'create_from_selection',
          'create_and_instantiate',
          'instantiate',
          'batch_instantiate',
          'list_prefabs',
          'create_variant',
          'unpack_instance',
        ],
        description: 'The prefab action to perform',
      },
      name: {
        type: 'string',
        description:
          'Prefab name (for create_from_primitives, create_from_selection, create_and_instantiate, create_variant)',
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
          'Array of primitive specifications to compose the prefab (for create_from_primitives, create_and_instantiate)',
      },
      instance_positions: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            x: { type: 'number' },
            y: { type: 'number' },
            z: { type: 'number' },
          },
        },
        description:
          'Array of positions where instances should be placed (for create_and_instantiate). If empty, places one instance at the prefab creation position.',
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
      instances: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            position: {
              type: 'object',
              properties: {
                x: { type: 'number' },
                y: { type: 'number' },
                z: { type: 'number' },
              },
              description: 'Position for this instance',
            },
            rotation: {
              type: 'object',
              properties: {
                x: { type: 'number' },
                y: { type: 'number' },
                z: { type: 'number' },
              },
              description: 'Rotation for this instance (optional)',
            },
            scale: {
              type: 'object',
              properties: {
                x: { type: 'number' },
                y: { type: 'number' },
                z: { type: 'number' },
              },
              description: 'Scale for this instance (optional)',
            },
          },
        },
        description:
          'Array of instance transforms (for batch_instantiate). Each can have position, rotation, scale.',
      },
    },
    required: ['action'],
  },
};

/**
 * Execute prefab management tool
 */
export async function executePrefabManagement(params: IPrefabManagementParams): Promise<string> {
  logger.info('Executing prefab management', { params });

  const {
    action,
    name,
    prefab_id,
    position,
    entity_id,
    primitives,
    instances,
    instance_positions,
  } = params;

  switch (action) {
    case 'create_from_primitives':
      if (!name || !primitives || !Array.isArray(primitives)) {
        return 'Error: name and primitives array are required for create_from_primitives';
      }
      return createPrefabFromPrimitives(name, primitives as IPrimitiveSpec[]);

    case 'create_and_instantiate':
      if (!name || !primitives || !Array.isArray(primitives)) {
        return 'Error: name and primitives array are required for create_and_instantiate';
      }
      return createAndInstantiatePrefab(name, primitives as IPrimitiveSpec[], instance_positions);

    case 'create_from_selection':
      if (!name) {
        return 'Error: name is required for create_from_selection';
      }
      return createPrefabFromSelection(name);

    case 'instantiate': {
      if (!prefab_id) {
        return 'Error: prefab_id is required for instantiate';
      }
      // Convert object position to tuple if provided
      const positionTuple = position
        ? typeof position === 'object' && 'x' in position
          ? [position.x, position.y, position.z]
          : position
        : undefined;
      return instantiatePrefab(prefab_id, positionTuple as [number, number, number] | undefined);
    }

    case 'batch_instantiate': {
      if (!prefab_id) {
        return 'Error: prefab_id is required for batch_instantiate';
      }
      if (!instances || !Array.isArray(instances) || instances.length === 0) {
        return 'Error: instances array is required for batch_instantiate and must not be empty';
      }
      return batchInstantiatePrefab(prefab_id, instances);
    }

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
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  name?: string;
  material?: string;
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

  return `Created prefab "${name}" (id: "${prefabId}") from ${primitives.length} primitives. Use the instantiate action with prefab_id="${prefabId}" to place instances in the scene.`;
}

function createAndInstantiatePrefab(
  name: string,
  primitives: IPrimitiveSpec[],
  instance_positions?: Array<[number, number, number] | { x: number; y: number; z: number }>,
): string {
  const event = new CustomEvent('agent:create-and-instantiate-prefab', {
    detail: { name, primitives, instance_positions },
  });
  window.dispatchEvent(event);

  const prefabId = name.toLowerCase().replace(/\s+/g, '-');
  const instanceCount = instance_positions ? instance_positions.length : 1;

  logger.info('Prefab creation and instantiation requested from primitives', {
    name,
    primitiveCount: primitives.length,
    instanceCount,
    instancePositions: instance_positions,
  });

  return `Created prefab "${name}" (id: "${prefabId}") from ${primitives.length} primitives and placed ${instanceCount} instance${instanceCount > 1 ? 's' : ''} in the scene.`;
}

function createPrefabFromSelection(name: string): string {
  const event = new CustomEvent('agent:create-prefab', {
    detail: { name },
  });
  window.dispatchEvent(event);

  logger.info('Prefab creation requested from selection', { name });
  return `Created prefab "${name}" from selected entities and replaced them with an instance at their original position. You can create more instances using the instantiate action with prefab_id="${name.toLowerCase().replace(/\s+/g, '-')}"`;
}

function instantiatePrefab(prefabId: string, position?: [number, number, number]): string {
  const event = new CustomEvent('agent:instantiate-prefab', {
    detail: {
      prefabId,
      position: position || [0, 0, 0],
    },
  });
  window.dispatchEvent(event);

  const posStr = position
    ? `at (${position[0]}, ${position[1]}, ${position[2]})`
    : 'at origin (0, 0, 0)';
  logger.info('Prefab instantiation requested', { prefabId, position });
  return `Instantiated prefab "${prefabId}" ${posStr}`;
}

interface IInstanceTransform {
  position?: [number, number, number] | { x: number; y: number; z: number };
  rotation?: [number, number, number] | { x: number; y: number; z: number };
  scale?: [number, number, number] | { x: number; y: number; z: number };
}

function batchInstantiatePrefab(prefabId: string, instances: IInstanceTransform[]): string {
  // Validate input
  if (!instances || instances.length === 0) {
    return 'Error: No instances provided for batch instantiation';
  }

  // Normalize instances to tuple format
  const normalizedInstances = instances.map((inst) => {
    const position = inst.position
      ? typeof inst.position === 'object' && 'x' in inst.position
        ? [inst.position.x, inst.position.y, inst.position.z]
        : inst.position
      : [0, 0, 0];

    const rotation = inst.rotation
      ? typeof inst.rotation === 'object' && 'x' in inst.rotation
        ? [inst.rotation.x, inst.rotation.y, inst.rotation.z]
        : inst.rotation
      : undefined;

    const scale = inst.scale
      ? typeof inst.scale === 'object' && 'x' in inst.scale
        ? [inst.scale.x, inst.scale.y, inst.scale.z]
        : inst.scale
      : undefined;

    return { position, rotation, scale };
  });

  const event = new CustomEvent('agent:batch-instantiate-prefab', {
    detail: {
      prefabId,
      instances: normalizedInstances,
    },
  });
  window.dispatchEvent(event);

  logger.info('Batch prefab instantiation requested', {
    prefabId,
    instanceCount: instances.length,
    positions: normalizedInstances.map((inst) => inst.position),
  });

  return `Batch instantiation of ${instances.length} instances of prefab "${prefabId}" initiated. Check that all pieces are visible and properly positioned.`;
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
