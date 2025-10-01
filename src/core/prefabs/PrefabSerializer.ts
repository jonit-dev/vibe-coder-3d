import type { IPrefabEntity, IPrefabDefinition } from './Prefab.types';
import { componentRegistry } from '@/core/lib/ecs/ComponentRegistry';
import { EntityManager } from '@/core/lib/ecs/EntityManager';
import { Logger } from '@/core/lib/logger';
import { getEntityName } from '@/core/lib/ecs/DataConversion';
import { EntityQueries } from '@/core/lib/ecs/queries/entityQueries';

const logger = Logger.create('PrefabSerializer');

export class PrefabSerializer {
  private static instance: PrefabSerializer;

  static getInstance(): PrefabSerializer {
    if (!PrefabSerializer.instance) {
      PrefabSerializer.instance = new PrefabSerializer();
    }
    return PrefabSerializer.instance;
  }

  /**
   * Serialize an entity and its children into a prefab entity structure
   */
  serialize(entityId: number): IPrefabEntity {
    const components: Record<string, unknown> = {};

    // Get all component types for this entity
    const componentTypes = componentRegistry.getComponentTypes(entityId);

    // Serialize each component (except PrefabInstance to avoid recursion)
    for (const type of componentTypes) {
      if (type === 'PrefabInstance') {
        continue; // Don't serialize prefab instance data when creating new prefab
      }

      const data = componentRegistry.getComponentData(entityId, type);
      if (data) {
        components[type] = JSON.parse(JSON.stringify(data)); // Deep clone
      }
    }

    // Get entity name
    const name = getEntityName(entityId) || `Entity_${entityId}`;

    // Serialize children recursively
    const children: IPrefabEntity[] = [];
    const childIds = this.getChildren(entityId);

    for (const childId of childIds) {
      try {
        children.push(this.serialize(childId));
      } catch (error) {
        logger.error(`Failed to serialize child entity ${childId}:`, error);
      }
    }

    return {
      name,
      components,
      children: children.length > 0 ? children : undefined,
    };
  }

  /**
   * Deserialize a prefab entity structure into the ECS
   */
  deserialize(entity: IPrefabEntity, parentId?: number): number {
    const entityManager = EntityManager.getInstance();

    // Create new entity
    const entityId = entityManager.createEntity();

    // Set entity name
    if (entity.name) {
      componentRegistry.updateComponent(entityId, 'EntityMeta', { name: entity.name });
    }

    // Add all components
    for (const [componentType, componentData] of Object.entries(entity.components)) {
      try {
        if (componentType === 'EntityMeta') {
          // Handle EntityMeta specially to avoid overwriting
          componentRegistry.updateComponent(entityId, componentType, {
            ...componentData,
            name: entity.name,
          });
        } else {
          componentRegistry.addComponent(entityId, componentType, componentData);
        }
      } catch (error) {
        logger.error(`Failed to add component ${componentType} to entity ${entityId}:`, error);
      }
    }

    // Set parent if specified
    if (parentId !== undefined) {
      this.setParent(entityId, parentId);
    }

    // Deserialize children recursively
    if (entity.children) {
      for (const child of entity.children) {
        try {
          this.deserialize(child, entityId);
        } catch (error) {
          logger.error('Failed to deserialize child entity:', error);
        }
      }
    }

    return entityId;
  }

  /**
   * Create prefab definition from entity
   */
  createPrefabFromEntity(entityId: number, name: string, id: string): IPrefabDefinition {
    const root = this.serialize(entityId);

    // Collect dependencies (materials, scripts, etc.)
    const dependencies: string[] = [];
    const visited = new Set<string>();

    this.collectDependencies(root, dependencies, visited);

    return {
      id,
      name,
      version: 1,
      root,
      metadata: {
        createdAt: new Date().toISOString(),
        createdFrom: entityId,
      },
      dependencies,
      tags: [],
    };
  }

  /**
   * Collect dependencies from prefab entity tree
   */
  private collectDependencies(
    entity: IPrefabEntity,
    dependencies: string[],
    visited: Set<string>,
  ): void {
    // Check MeshRenderer for material dependencies
    if (entity.components.MeshRenderer) {
      const renderer = entity.components.MeshRenderer as Record<string, unknown>;
      if (renderer.materialId && typeof renderer.materialId === 'string') {
        if (!visited.has(renderer.materialId)) {
          dependencies.push(renderer.materialId);
          visited.add(renderer.materialId);
        }
      }
    }

    // Check Script for script dependencies
    if (entity.components.Script) {
      const script = entity.components.Script as Record<string, unknown>;
      if (script.scriptRef) {
        const scriptRef = script.scriptRef as Record<string, unknown>;
        if (scriptRef.scriptId && typeof scriptRef.scriptId === 'string') {
          if (!visited.has(scriptRef.scriptId)) {
            dependencies.push(scriptRef.scriptId);
            visited.add(scriptRef.scriptId);
          }
        }
      }
    }

    // Recurse into children
    if (entity.children) {
      for (const child of entity.children) {
        this.collectDependencies(child, dependencies, visited);
      }
    }
  }

  /**
   * Set parent-child relationship
   */
  private setParent(entityId: number, parentId: number): void {
    try {
      // Update Transform parent reference
      const transform = componentRegistry.getComponentData(entityId, 'Transform');
      if (transform) {
        componentRegistry.updateComponent(entityId, 'Transform', {
          ...transform,
          parent: parentId,
        });
      }
    } catch (error) {
      logger.error(`Failed to set parent ${parentId} for entity ${entityId}:`, error);
    }
  }

  /**
   * Get entity children using HierarchyIndex
   */
  private getChildren(entityId: number): number[] {
    const queries = EntityQueries.getInstance();
    return queries.getChildren(entityId);
  }
}
