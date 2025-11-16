/**
 * Scene Query Tool
 * Allows the AI to query scene information, entity schemas, and component details
 * Enhanced with structured responses per PRD: docs/PRDs/editor/ai-first-chat-flexibility-prd.md
 */

import { Logger } from '@core/lib/logger';
import {
  getEntitySummaries,
  getEntityDetail,
  getSceneStats,
  formatEntityList,
  formatSceneStats,
} from './utils/entityIntrospection';

const logger = Logger.create('SceneQueryTool');

// Scene query tool parameter types
interface ISceneQueryParams {
  query_type:
    | 'list_entities'
    | 'get_entity_details'
    | 'list_components'
    | 'get_component_schema'
    | 'get_scene_summary';
  entity_id?: number;
  component_type?: string;
  limit?: number;
  filter?: {
    component?: string;
    nameContains?: string;
    parentId?: number;
  };
}

export const sceneQueryTool = {
  name: 'scene_query',
  description:
    'Query information about the scene, entities, components, and schemas. Returns structured data with IDs, transforms, and materials.',
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
      limit: {
        type: 'number',
        description: 'Maximum number of entities to return (default: 25, max: 100)',
      },
      filter: {
        type: 'object',
        properties: {
          component: {
            type: 'string',
            description: 'Filter entities by component type',
          },
          nameContains: {
            type: 'string',
            description: 'Filter entities by name substring (case-insensitive)',
          },
          parentId: {
            type: 'number',
            description: 'Filter to children of a specific parent entity',
          },
        },
        description: 'Filter criteria for list_entities',
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

  const { query_type, entity_id, component_type, limit, filter } = params;

  switch (query_type) {
    case 'list_entities':
      return listEntities(limit, filter);

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

function listEntities(
  limit?: number,
  filter?: { component?: string; nameContains?: string; parentId?: number },
): string {
  const effectiveLimit = Math.min(limit || 25, 100);
  const summaries = getEntitySummaries(effectiveLimit, filter);
  const truncated = summaries.length === effectiveLimit;

  return formatEntityList(summaries, truncated);
}

function getEntityDetails(entityId: number): string {
  const detail = getEntityDetail(entityId);

  if (!detail) {
    return `Entity ${entityId} not found in the scene.`;
  }

  const lines: string[] = [];
  lines.push(`# Entity ${detail.id}: ${detail.name}`);
  lines.push('');
  lines.push(`**Depth in hierarchy**: ${detail.depth}`);
  lines.push(`**Components**: ${detail.components.join(', ')}`);
  lines.push('');

  if (detail.transform) {
    lines.push('## Transform');
    lines.push(`- Position: (${detail.transform.position.join(', ')})`);
    if (detail.transform.rotation) {
      lines.push(`- Rotation: (${detail.transform.rotation.join(', ')}°)`);
    }
    if (detail.transform.scale) {
      lines.push(`- Scale: (${detail.transform.scale.join(', ')})`);
    }
    lines.push('');
  }

  if (detail.material) {
    lines.push('## Material');
    if (detail.material.meshId) lines.push(`- Mesh: ${detail.material.meshId}`);
    if (detail.material.materialId) lines.push(`- Material ID: ${detail.material.materialId}`);
    if (detail.material.color) lines.push(`- Color: ${detail.material.color}`);
    lines.push('');
  }

  if (detail.parent !== undefined) {
    lines.push(`**Parent**: Entity ${detail.parent}`);
  }

  if (detail.children.length > 0) {
    lines.push(`**Children** (${detail.children.length}): ${detail.children.join(', ')}`);
  }

  lines.push('');
  lines.push('## Component Data');
  lines.push('```json');
  lines.push(JSON.stringify(detail.allComponents, null, 2));
  lines.push('```');

  return lines.join('\n');
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
  const stats = getSceneStats();
  return formatSceneStats(stats);
}
