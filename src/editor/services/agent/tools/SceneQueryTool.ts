/**
 * Scene Query Tool
 * Allows the AI to query scene information, entity schemas, and component details
 */

import { Logger } from '@core/lib/logger';

const logger = Logger.create('SceneQueryTool');

// Scene query tool parameter types
interface ISceneQueryParams {
  query_type: 'list_entities' | 'get_entity_details' | 'list_components' | 'get_component_schema' | 'get_scene_summary';
  entity_id?: number;
  component_type?: string;
}

export const sceneQueryTool = {
  name: 'scene_query',
  description: 'Query information about the scene, entities, components, and schemas',
  input_schema: {
    type: 'object' as const,
    properties: {
      query_type: {
        type: 'string',
        enum: [
          'list_entities',
          'get_entity_details',
          'list_components',
          'get_component_schema',
          'get_scene_summary',
        ],
        description: 'Type of query to execute',
      },
      entity_id: {
        type: 'number',
        description: 'Entity ID (for get_entity_details)',
      },
      component_type: {
        type: 'string',
        description: 'Component type name (for get_component_schema)',
      },
    },
    required: ['query_type'],
  },
};

/**
 * Execute scene query tool
 */
export async function executeSceneQuery(params: ISceneQueryParams): Promise<string> {
  logger.info('Executing scene query', { params });

  const { query_type, entity_id, component_type } = params;

  switch (query_type) {
    case 'list_entities':
      return listEntities();

    case 'get_entity_details':
      if (!entity_id) {
        return 'Error: entity_id is required for get_entity_details';
      }
      return getEntityDetails(entity_id);

    case 'list_components':
      return listComponents();

    case 'get_component_schema':
      if (!component_type) {
        return 'Error: component_type is required for get_component_schema';
      }
      return getComponentSchema(component_type);

    case 'get_scene_summary':
      return getSceneSummary();

    default:
      return `Unknown query type: ${query_type}`;
  }
}

function listEntities(): string {
  const event = new CustomEvent('agent:list-entities');
  window.dispatchEvent(event);

  // TODO: Implement actual entity listing via state query
  return 'Query sent to list all entities. Check the hierarchy panel for the current entity list.';
}

function getEntityDetails(entityId: number): string {
  const event = new CustomEvent('agent:get-entity', { detail: { entityId } });
  window.dispatchEvent(event);

  return `Query sent for entity ${entityId} details.`;
}

function listComponents(): string {
  // Return known component types
  const components = [
    'Transform',
    'MeshRenderer',
    'Light',
    'Camera',
    'Script',
    'RigidBody',
    'Collider',
    'Material',
  ];

  return `Available component types:\n${components.map((c) => `- ${c}`).join('\n')}`;
}

function getComponentSchema(componentType: string): string {
  // Return schema information for common components
  const schemas: Record<string, string> = {
    Transform: `Transform Component Schema:
- position: { x: number, y: number, z: number }
- rotation: { x: number, y: number, z: number } (Euler angles in degrees)
- scale: { x: number, y: number, z: number }`,

    MeshRenderer: `MeshRenderer Component Schema:
- geometry: string (geometry type)
- material: string | Material (material reference or inline material)
- castShadow: boolean
- receiveShadow: boolean`,

    Light: `Light Component Schema:
- type: 'directional' | 'point' | 'spot' | 'ambient'
- color: string (hex color)
- intensity: number
- distance: number (for point/spot lights)
- angle: number (for spot lights)`,

    RigidBody: `RigidBody Component Schema:
- type: 'static' | 'dynamic' | 'kinematic'
- mass: number
- gravity: boolean
- linearDamping: number
- angularDamping: number`,

    Collider: `Collider Component Schema:
- shape: 'box' | 'sphere' | 'capsule' | 'cylinder' | 'trimesh'
- size: { x: number, y: number, z: number }
- offset: { x: number, y: number, z: number }
- isTrigger: boolean`,
  };

  const schema = schemas[componentType];
  if (!schema) {
    return `Unknown component type: ${componentType}. Use list_components to see available types.`;
  }

  return schema;
}

function getSceneSummary(): string {
  const event = new CustomEvent('agent:get-scene-summary');
  window.dispatchEvent(event);

  return 'Query sent for scene summary.';
}
