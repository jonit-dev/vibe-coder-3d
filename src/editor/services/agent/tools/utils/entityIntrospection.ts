/**
 * Entity Introspection Utility
 * Provides structured scene introspection for AI agent tools
 * Following PRD: docs/PRDs/editor/ai-first-chat-flexibility-prd.md
 */

import { Logger } from '@core/lib/logger';
import { ComponentRegistry } from '@core/lib/ecs/ComponentRegistry';
import { EntityQueries } from '@core/lib/ecs/queries/entityQueries';
import { getEntityName, getEntityParent } from '@core/lib/ecs/DataConversion';

const logger = Logger.create('EntityIntrospection');

export interface IEntitySummary {
  id: number;
  name: string;
  components: string[];
  transform?: {
    position: [number, number, number];
    rotation?: [number, number, number];
    scale?: [number, number, number];
  };
  material?: {
    meshId?: string;
    materialId?: string;
    color?: string;
  };
  parent?: number;
}

export interface IEntityDetail extends IEntitySummary {
  allComponents: Record<string, unknown>;
  children: number[];
  depth: number;
}

export interface ISceneStats {
  totalEntities: number;
  rootEntities: number;
  componentCounts: Record<string, number>;
  truncated: boolean;
  bounds?: {
    min: [number, number, number];
    max: [number, number, number];
  };
}

/**
 * Get summaries of entities in the scene
 * @param limit Maximum number of entities to return (default: 50)
 * @param filter Optional filter criteria
 * @returns Array of entity summaries
 */
export function getEntitySummaries(
  limit = 50,
  filter?: {
    component?: string;
    nameContains?: string;
    parentId?: number;
  },
): IEntitySummary[] {
  try {
    const queries = EntityQueries.getInstance();
    const componentRegistry = ComponentRegistry.getInstance();

    // Get all entities or filter by component
    let entityIds: number[] = filter?.component
      ? queries.listEntitiesWithComponent(filter.component)
      : queries.listAllEntities();

    // Filter by parent if specified
    if (filter?.parentId !== undefined) {
      const children = queries.getChildren(filter.parentId);
      entityIds = entityIds.filter((id) => children.includes(id));
    }

    // Filter by name if specified
    if (filter?.nameContains) {
      const nameFilter = filter.nameContains.toLowerCase();
      entityIds = entityIds.filter((id) => {
        const name = getEntityName(id);
        return name?.toLowerCase().includes(nameFilter);
      });
    }

    // Limit results
    const limitedIds = entityIds.slice(0, limit);

    // Build summaries
    const summaries: IEntitySummary[] = limitedIds.map((id) => {
      const summary: IEntitySummary = {
        id,
        name: getEntityName(id) || `Entity_${id}`,
        components: componentRegistry.getEntityComponents(id),
      };

      // Add transform if available
      const transformData = componentRegistry.getComponentData(id, 'Transform') as
        | {
            position?: [number, number, number];
            rotation?: [number, number, number];
            scale?: [number, number, number];
          }
        | undefined;
      if (transformData) {
        summary.transform = {
          position: transformData.position || [0, 0, 0],
          rotation: transformData.rotation,
          scale: transformData.scale,
        };
      }

      // Add material if available
      const meshRenderer = componentRegistry.getComponentData(id, 'MeshRenderer') as
        | { geometry?: string; material?: { id?: string; color?: string } }
        | undefined;
      if (meshRenderer) {
        summary.material = {
          meshId: meshRenderer.geometry,
          materialId: meshRenderer.material?.id,
          color: meshRenderer.material?.color,
        };
      }

      // Add parent
      const parent = getEntityParent(id);
      if (parent !== undefined && parent !== null) {
        summary.parent = parent;
      }

      return summary;
    });

    return summaries;
  } catch (error) {
    logger.error('Failed to get entity summaries', { error });
    return [];
  }
}

/**
 * Get detailed information about a specific entity
 * @param entityId Entity ID to inspect
 * @returns Detailed entity information or null if not found
 */
export function getEntityDetail(entityId: number): IEntityDetail | null {
  try {
    const queries = EntityQueries.getInstance();
    const componentRegistry = ComponentRegistry.getInstance();

    // Check if entity exists
    const allEntities = queries.listAllEntities();
    if (!allEntities.includes(entityId)) {
      logger.warn('Entity not found', { entityId });
      return null;
    }

    // Build base summary directly
    const summary: IEntitySummary = {
      id: entityId,
      name: getEntityName(entityId) || `Entity_${entityId}`,
      components: componentRegistry.getEntityComponents(entityId),
    };

    // Add transform if available
    const transformData = componentRegistry.getComponentData(entityId, 'Transform') as
      | {
          position?: [number, number, number];
          rotation?: [number, number, number];
          scale?: [number, number, number];
        }
      | undefined;
    if (transformData) {
      summary.transform = {
        position: transformData.position || [0, 0, 0],
        rotation: transformData.rotation,
        scale: transformData.scale,
      };
    }

    // Add material if available
    const meshRenderer = componentRegistry.getComponentData(entityId, 'MeshRenderer') as
      | { geometry?: string; material?: { id?: string; color?: string } }
      | undefined;
    if (meshRenderer) {
      summary.material = {
        meshId: meshRenderer.geometry,
        materialId: meshRenderer.material?.id,
        color: meshRenderer.material?.color,
      };
    }

    // Add parent
    const parent = getEntityParent(entityId);
    if (parent !== undefined && parent !== null) {
      summary.parent = parent;
    }

    // Get all component data
    const allComponents: Record<string, unknown> = {};
    const componentTypes = componentRegistry.getEntityComponents(entityId);
    for (const componentType of componentTypes) {
      const data = componentRegistry.getComponentData(entityId, componentType);
      if (data) {
        allComponents[componentType] = data;
      }
    }

    // Get children
    const children = queries.getChildren(entityId);

    // Get depth
    const depth = queries.getDepth(entityId);

    const detail: IEntityDetail = {
      ...summary,
      allComponents,
      children,
      depth,
    };

    return detail;
  } catch (error) {
    logger.error('Failed to get entity detail', { entityId, error });
    return null;
  }
}

/**
 * Get scene statistics and overview
 * @returns Scene statistics
 */
export function getSceneStats(): ISceneStats {
  try {
    const queries = EntityQueries.getInstance();
    const componentRegistry = ComponentRegistry.getInstance();

    const allEntities = queries.listAllEntities();
    const rootEntities = queries.getRootEntities();

    // Count components
    const componentTypes = componentRegistry.listComponents();
    const componentCounts: Record<string, number> = {};
    for (const componentType of componentTypes) {
      componentCounts[componentType] = queries.getComponentCount(componentType);
    }

    // Calculate bounds (if Transform components exist)
    let bounds: { min: [number, number, number]; max: [number, number, number] } | undefined;
    const transformEntities = queries.listEntitiesWithComponent('Transform');
    if (transformEntities.length > 0) {
      let minX = Infinity;
      let minY = Infinity;
      let minZ = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      let maxZ = -Infinity;

      for (const entityId of transformEntities) {
        const transformData = componentRegistry.getComponentData(entityId, 'Transform') as
          | { position?: [number, number, number] }
          | undefined;
        if (transformData?.position) {
          const [x, y, z] = transformData.position;
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          minZ = Math.min(minZ, z);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
          maxZ = Math.max(maxZ, z);
        }
      }

      if (isFinite(minX)) {
        bounds = {
          min: [minX, minY, minZ],
          max: [maxX, maxY, maxZ],
        };
      }
    }

    const stats: ISceneStats = {
      totalEntities: allEntities.length,
      rootEntities: rootEntities.length,
      componentCounts,
      truncated: false,
      bounds,
    };

    return stats;
  } catch (error) {
    logger.error('Failed to get scene stats', { error });
    return {
      totalEntities: 0,
      rootEntities: 0,
      componentCounts: {},
      truncated: false,
    };
  }
}

/**
 * Format entity summaries as markdown/JSON string for LLM consumption
 * @param summaries Entity summaries
 * @param truncated Whether results were truncated
 * @returns Formatted string
 */
export function formatEntityList(summaries: IEntitySummary[], truncated = false): string {
  if (summaries.length === 0) {
    return 'No entities found in the scene.';
  }

  const lines: string[] = [];
  lines.push(`Found ${summaries.length} entit${summaries.length === 1 ? 'y' : 'ies'}:`);
  lines.push('');

  for (const entity of summaries) {
    lines.push(`**Entity ${entity.id}**: ${entity.name}`);
    lines.push(`  Components: ${entity.components.join(', ')}`);

    if (entity.transform) {
      const { position, rotation, scale } = entity.transform;
      lines.push(`  Position: (${position.join(', ')})`);
      if (rotation) {
        lines.push(`  Rotation: (${rotation.join(', ')}°)`);
      }
      if (scale) {
        lines.push(`  Scale: (${scale.join(', ')})`);
      }
    }

    if (entity.material) {
      const parts: string[] = [];
      if (entity.material.meshId) parts.push(`mesh: ${entity.material.meshId}`);
      if (entity.material.materialId) parts.push(`material: ${entity.material.materialId}`);
      if (entity.material.color) parts.push(`color: ${entity.material.color}`);
      if (parts.length > 0) {
        lines.push(`  Material: ${parts.join(', ')}`);
      }
    }

    if (entity.parent !== undefined) {
      lines.push(`  Parent: Entity ${entity.parent}`);
    }

    lines.push('');
  }

  if (truncated) {
    lines.push('**Note**: Results truncated. Use filters to narrow down the search.');
  }

  return lines.join('\n');
}

/**
 * Format scene stats as markdown string
 * @param stats Scene statistics
 * @returns Formatted string
 */
export function formatSceneStats(stats: ISceneStats): string {
  const lines: string[] = [];
  lines.push('## Scene Overview');
  lines.push('');
  lines.push(`- Total Entities: ${stats.totalEntities}`);
  lines.push(`- Root Entities: ${stats.rootEntities}`);
  lines.push('');
  lines.push('### Component Distribution:');
  lines.push('');

  const sortedComponents = Object.entries(stats.componentCounts).sort((a, b) => b[1] - a[1]);
  for (const [componentType, count] of sortedComponents) {
    lines.push(`- ${componentType}: ${count}`);
  }

  if (stats.bounds) {
    lines.push('');
    lines.push('### Scene Bounds:');
    lines.push(`- Min: (${stats.bounds.min.join(', ')})`);
    lines.push(`- Max: (${stats.bounds.max.join(', ')})`);
  }

  return lines.join('\n');
}
