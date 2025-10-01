import type { IPrefabEntity, IPrefabDefinition } from './Prefab.types';
import { componentRegistry } from '@/core/lib/ecs/ComponentRegistry';
import { EntityManager } from '@/core/lib/ecs/EntityManager';
import { Logger } from '@/core/lib/logger';
import { getEntityName } from '@/core/lib/ecs/DataConversion';

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
    logger.info('🔵 Starting serialization', { entityId });

    const components: Record<string, unknown> = {};

    // Get entity from EntityManager to check parent-child relationships
    const entityManager = EntityManager.getInstance();
    const entity = entityManager.getEntity(entityId);

    logger.info('🔵 Entity state', {
      entityId,
      hasEntity: !!entity,
      parentId: entity?.parentId,
      children: entity?.children || [],
      childrenCount: entity?.children?.length || 0,
    });

    // Get all component types for this entity
    const componentTypes = componentRegistry.getEntityComponents(entityId);
    logger.info('🔵 Component types found', {
      entityId,
      componentTypes,
      count: componentTypes.length,
    });

    if (componentTypes.length === 0) {
      logger.warn('Entity has no components', { entityId });
    }

    // Serialize each component (except PrefabInstance to avoid recursion)
    for (const type of componentTypes) {
      if (type === 'PrefabInstance') {
        logger.info('🔵 Skipping PrefabInstance component', { entityId });
        continue; // Don't serialize prefab instance data when creating new prefab
      }

      const data = componentRegistry.getComponentData(entityId, type);
      if (data) {
        components[type] = JSON.parse(JSON.stringify(data)); // Deep clone
        logger.debug('Component serialized', { entityId, type });
      }
    }

    // Get entity name
    const name = getEntityName(entityId) || `Entity_${entityId}`;
    logger.info('🔵 Entity name retrieved', { entityId, name });

    // Serialize children recursively
    const children: IPrefabEntity[] = [];
    const childIds = this.getChildren(entityId);

    logger.info('🔵 About to serialize children', {
      entityId,
      childIds,
      childCount: childIds.length,
      entityManagerChildren: entity?.children || [],
      match: JSON.stringify(childIds) === JSON.stringify(entity?.children || []),
    });

    for (const childId of childIds) {
      try {
        logger.info('🔵 Serializing child', { parentId: entityId, childId });
        const childEntity = this.serialize(childId);
        children.push(childEntity);
        logger.info('🔵 Child serialized successfully', {
          parentId: entityId,
          childId,
          childName: childEntity.name,
          hasGrandchildren: !!childEntity.children,
          grandchildrenCount: childEntity.children?.length || 0,
        });
      } catch (error) {
        logger.error(`Failed to serialize child entity ${childId}:`, error);
      }
    }

    const result: IPrefabEntity = {
      name,
      components,
      children: children.length > 0 ? children : undefined,
    };

    logger.info('🔵 Serialization complete', {
      entityId,
      name,
      childCount: children.length,
      hasChildren: children.length > 0,
      result: JSON.stringify(result, null, 2).substring(0, 500),
    });

    return result;
  }

  /**
   * Deserialize a prefab entity structure into the ECS
   */
  deserialize(entity: IPrefabEntity, parentId?: number): number {
    const entityManager = EntityManager.getInstance();

    logger.info('🟢 Starting deserialization', {
      name: entity.name,
      parentId,
      hasChildren: !!entity.children,
      childCount: entity.children?.length || 0,
      childrenData: entity.children?.map((c) => c.name),
    });

    // Create new entity
    const createdEntity = entityManager.createEntity(entity.name || 'Prefab Entity', parentId);
    const entityId = createdEntity.id;

    logger.info('🟢 Entity created', {
      entityId,
      name: entity.name,
      parentId,
      entityParentId: createdEntity.parentId,
      entityChildren: createdEntity.children,
    });

    // Add all components
    for (const [componentType, componentData] of Object.entries(entity.components)) {
      try {
        if (componentType === 'EntityMeta') {
          // EntityMeta is already set by createEntity, skip
          continue;
        }
        componentRegistry.addComponent(entityId, componentType, componentData);
        logger.debug('Component added', { entityId, componentType });
      } catch (error) {
        logger.error(`Failed to add component ${componentType} to entity ${entityId}:`, error);
      }
    }

    // Deserialize children recursively
    if (entity.children && entity.children.length > 0) {
      logger.info('🟢 Deserializing children', {
        parentEntityId: entityId,
        childCount: entity.children.length,
        childrenNames: entity.children.map((c) => c.name),
      });

      for (let i = 0; i < entity.children.length; i++) {
        const child = entity.children[i];
        try {
          logger.info('🟢 Deserializing child', {
            index: i,
            childName: child.name,
            parentEntityId: entityId,
          });

          const childId = this.deserialize(child, entityId);

          // Verify child was properly parented
          const childEntity = entityManager.getEntity(childId);
          logger.info('🟢 Child deserialized', {
            childId,
            childName: child.name,
            parentEntityId: entityId,
            childParentId: childEntity?.parentId,
            parentMatches: childEntity?.parentId === entityId,
          });
        } catch (error) {
          logger.error('Failed to deserialize child entity:', error);
        }
      }

      // Verify parent entity's children array
      const parentEntity = entityManager.getEntity(entityId);
      logger.info('🟢 Parent entity after all children deserialized', {
        parentEntityId: entityId,
        parentChildren: parentEntity?.children || [],
        expectedChildCount: entity.children.length,
        actualChildCount: parentEntity?.children?.length || 0,
        childrenMatch: (parentEntity?.children?.length || 0) === entity.children.length,
      });
    } else {
      logger.info('🟢 No children to deserialize', { entityId });
    }

    return entityId;
  }

  /**
   * Create prefab definition from entity
   */
  createPrefabFromEntity(entityId: number, name: string, id: string): IPrefabDefinition {
    logger.debug('Creating prefab from entity', { entityId, name, id });

    const root = this.serialize(entityId);
    logger.debug('Entity serialized', { root });

    // Collect dependencies (materials, scripts, etc.)
    const dependencies: string[] = [];
    const visited = new Set<string>();

    this.collectDependencies(root, dependencies, visited);
    logger.debug('Dependencies collected', { dependencies });

    const prefab = {
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

    logger.info('Prefab definition created', { prefabId: id, prefabName: name });
    return prefab;
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
   * Get entity children using EntityManager directly
   */
  private getChildren(entityId: number): number[] {
    const entityManager = EntityManager.getInstance();
    const entity = entityManager.getEntity(entityId);

    // Use EntityManager's children array directly - it's the source of truth
    const children = entity?.children || [];

    logger.info('🔵 getChildren called', {
      entityId,
      childrenFromEntityManager: children,
      childCount: children.length,
      hasEntity: !!entity,
      entityName: entity?.name,
    });

    return children;
  }
}
