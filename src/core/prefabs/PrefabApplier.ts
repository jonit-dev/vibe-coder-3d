import type { IPrefabDefinition, IPrefabEntity, IInstantiateOptions } from './Prefab.types';
import { PrefabSerializer } from './PrefabSerializer';
import { componentRegistry } from '@/core/lib/ecs/ComponentRegistry';
import { EntityManager } from '@/core/lib/ecs/EntityManager';
import { Logger } from '@/core/lib/logger';
import { applyOverridePatch } from './PrefabOverrides';
import { isMaxDepthExceeded } from './PrefabUtils';

const logger = Logger.create('PrefabApplier');

export class PrefabApplier {
  private static instance: PrefabApplier;

  static getInstance(): PrefabApplier {
    if (!PrefabApplier.instance) {
      PrefabApplier.instance = new PrefabApplier();
    }
    return PrefabApplier.instance;
  }

  /**
   * Reset the singleton instance (for testing)
   */
  static resetInstance(): void {
    PrefabApplier.instance = null as any;
  }

  /**
   * Instantiate a prefab into the ECS world
   */
  instantiate(prefab: IPrefabDefinition, options: IInstantiateOptions = {}): number {
    logger.info('🟡 Instantiating prefab', {
      prefabId: prefab.id,
      prefabName: prefab.name,
      hasRoot: !!prefab.root,
      rootChildren: prefab.root.children?.length || 0,
      parentEntityId: options.parentEntityId,
    });

    // Check max depth
    if (isMaxDepthExceeded(prefab.root)) {
      logger.error('Prefab exceeds maximum depth', { prefabId: prefab.id });
      throw new Error(`Prefab ${prefab.id} exceeds maximum depth of 10`);
    }

    // Apply overrides to prefab root if provided
    let rootEntity = prefab.root;
    if (options.applyOverrides) {
      rootEntity = applyOverridePatch(prefab.root, options.applyOverrides) as IPrefabEntity;
      logger.info('🟡 Overrides applied', { prefabId: prefab.id });
    }

    logger.info('🟡 Root entity structure', {
      name: rootEntity.name,
      hasChildren: !!rootEntity.children,
      childCount: rootEntity.children?.length || 0,
      childrenNames: rootEntity.children?.map((c) => c.name),
    });

    // Deserialize prefab entity tree
    const serializer = PrefabSerializer.getInstance();
    const rootEntityId = serializer.deserialize(rootEntity, options.parentEntityId ?? undefined);

    // Verify the deserialized entity structure
    const entityManager = EntityManager.getInstance();
    const instantiatedEntity = entityManager.getEntity(rootEntityId);
    logger.info('🟡 Instantiated entity structure', {
      rootEntityId,
      entityName: instantiatedEntity?.name,
      parentId: instantiatedEntity?.parentId,
      children: instantiatedEntity?.children || [],
      childrenCount: instantiatedEntity?.children?.length || 0,
    });

    // Add PrefabInstance component to track this instance
    const instanceUuid = crypto.randomUUID();
    componentRegistry.addComponent(rootEntityId, 'PrefabInstance', {
      prefabId: prefab.id,
      version: prefab.version,
      instanceUuid,
      overridePatch: options.applyOverrides,
    });

    // Apply position/rotation/scale if provided
    if (options.position || options.rotation || options.scale) {
      this.applyTransformOverrides(rootEntityId, options);
    }

    logger.info('🟡 Prefab instantiated successfully', {
      prefabId: prefab.id,
      entityId: rootEntityId,
      instanceUuid,
    });

    return rootEntityId;
  }

  /**
   * Apply transform overrides to instantiated entity
   */
  private applyTransformOverrides(entityId: number, options: IInstantiateOptions): void {
    const hasTransform = componentRegistry.hasComponent(entityId, 'Transform');
    const isPrefabRoot =
      componentRegistry.hasComponent(entityId, 'PrefabInstance') && !hasTransform;

    if (isPrefabRoot) {
      // Prefab root without Transform - propagate to children
      const entityManager = EntityManager.getInstance();
      const entity = entityManager.getEntity(entityId);
      const children = entity?.children || [];

      if (children.length === 0) {
        logger.warn('Prefab root has no children to apply transform to', { entityId });
        return;
      }

      // Apply position by propagating to all children
      if (options.position) {
        const firstChildData = componentRegistry.getComponentData(children[0], 'Transform') as
          | { position?: [number, number, number] }
          | undefined;
        const currentPos = firstChildData?.position || [0, 0, 0];
        const delta: [number, number, number] = [
          options.position[0] - currentPos[0],
          options.position[1] - currentPos[1],
          options.position[2] - currentPos[2],
        ];

        for (const childId of children) {
          if (componentRegistry.hasComponent(childId, 'Transform')) {
            const childData = componentRegistry.getComponentData(childId, 'Transform') as
              | { position?: [number, number, number] }
              | undefined;
            const childPos = childData?.position || [0, 0, 0];
            componentRegistry.updateComponent(childId, 'Transform', {
              position: [childPos[0] + delta[0], childPos[1] + delta[1], childPos[2] + delta[2]],
            });
          }
        }
      }

      // Apply rotation by propagating to all children
      if (options.rotation) {
        const firstChildData = componentRegistry.getComponentData(children[0], 'Transform') as
          | { rotation?: [number, number, number] }
          | undefined;
        const currentRot = firstChildData?.rotation || [0, 0, 0];
        const delta: [number, number, number] = [
          options.rotation[0] - currentRot[0],
          options.rotation[1] - currentRot[1],
          options.rotation[2] - currentRot[2],
        ];

        for (const childId of children) {
          if (componentRegistry.hasComponent(childId, 'Transform')) {
            const childData = componentRegistry.getComponentData(childId, 'Transform') as
              | { rotation?: [number, number, number] }
              | undefined;
            const childRot = childData?.rotation || [0, 0, 0];
            componentRegistry.updateComponent(childId, 'Transform', {
              rotation: [childRot[0] + delta[0], childRot[1] + delta[1], childRot[2] + delta[2]],
            });
          }
        }
      }

      // Apply scale by propagating to all children
      if (options.scale) {
        const firstChildData = componentRegistry.getComponentData(children[0], 'Transform') as
          | { scale?: [number, number, number] }
          | undefined;
        const currentScale = firstChildData?.scale || [1, 1, 1];
        const multiplier: [number, number, number] = [
          currentScale[0] !== 0 ? options.scale[0] / currentScale[0] : 1,
          currentScale[1] !== 0 ? options.scale[1] / currentScale[1] : 1,
          currentScale[2] !== 0 ? options.scale[2] / currentScale[2] : 1,
        ];

        for (const childId of children) {
          if (componentRegistry.hasComponent(childId, 'Transform')) {
            const childData = componentRegistry.getComponentData(childId, 'Transform') as
              | { scale?: [number, number, number] }
              | undefined;
            const childScale = childData?.scale || [1, 1, 1];
            componentRegistry.updateComponent(childId, 'Transform', {
              scale: [
                childScale[0] * multiplier[0],
                childScale[1] * multiplier[1],
                childScale[2] * multiplier[2],
              ],
            });
          }
        }
      }

      logger.info('Applied transform overrides to prefab children', {
        entityId,
        childCount: children.length,
        position: options.position,
        rotation: options.rotation,
        scale: options.scale,
      });
    } else if (hasTransform) {
      // Regular entity with Transform component
      const updates: Record<string, unknown> = {};

      if (options.position) {
        updates.position = options.position;
      }

      if (options.rotation) {
        updates.rotation = options.rotation;
      }

      if (options.scale) {
        updates.scale = options.scale;
      }

      if (Object.keys(updates).length > 0) {
        componentRegistry.updateComponent(entityId, 'Transform', updates);
      }

      logger.info('Applied transform overrides to entity', {
        entityId,
        position: options.position,
        rotation: options.rotation,
        scale: options.scale,
      });
    } else {
      logger.warn('Entity has no Transform component and is not a prefab root', { entityId });
    }
  }

  /**
   * Destroy a prefab instance and all its children
   */
  destroyInstance(entityId: number): void {
    const prefabInstance = componentRegistry.getComponentData(entityId, 'PrefabInstance');
    if (!prefabInstance) {
      logger.warn('Entity is not a prefab instance', { entityId });
    }

    // Remove the entity (this will cascade to children via EntityManager)
    try {
      const entityManager = EntityManager.getInstance();
      entityManager.deleteEntity(entityId);

      logger.debug('Prefab instance destroyed', { entityId });
    } catch (error) {
      logger.error('Failed to destroy prefab instance:', error);
      throw error;
    }
  }

  /**
   * Apply instance overrides back to prefab asset
   */
  applyToAsset(
    entityId: number,
    updatePrefab: (prefabId: string, updates: Partial<IPrefabDefinition>) => void,
  ): void {
    const prefabInstance = componentRegistry.getComponentData(entityId, 'PrefabInstance');
    if (!prefabInstance) {
      throw new Error('Entity is not a prefab instance');
    }

    const instance = prefabInstance as { prefabId: string; overridePatch?: unknown };

    // Serialize current entity state
    const serializer = PrefabSerializer.getInstance();
    const currentState = serializer.serialize(entityId);

    // Update prefab with new root
    updatePrefab(instance.prefabId, {
      root: currentState,
      version: (prefabInstance as { version: number }).version + 1,
    });

    // Clear override patch since it's now part of the base
    componentRegistry.updateComponent(entityId, 'PrefabInstance', {
      ...prefabInstance,
      overridePatch: undefined,
    });

    logger.debug('Instance overrides applied to prefab', {
      entityId,
      prefabId: instance.prefabId,
    });
  }

  /**
   * Revert instance to prefab defaults
   */
  revertInstance(
    entityId: number,
    getPrefab: (prefabId: string) => IPrefabDefinition | undefined,
  ): void {
    const prefabInstance = componentRegistry.getComponentData(entityId, 'PrefabInstance');
    if (!prefabInstance) {
      throw new Error('Entity is not a prefab instance');
    }

    const instance = prefabInstance as { prefabId: string };
    const prefab = getPrefab(instance.prefabId);

    if (!prefab) {
      throw new Error(`Prefab not found: ${instance.prefabId}`);
    }

    // Get parent and position before destroying
    const transform = componentRegistry.getComponentData(entityId, 'Transform');
    const parentId = transform ? (transform as { parent?: number }).parent : undefined;
    const position = transform
      ? (transform as { position?: [number, number, number] }).position
      : undefined;

    // Destroy current instance
    this.destroyInstance(entityId);

    // Re-instantiate from prefab
    const newEntityId = this.instantiate(prefab, {
      parentEntityId: parentId,
      position,
    });

    logger.debug('Instance reverted to prefab defaults', {
      oldEntityId: entityId,
      newEntityId,
      prefabId: instance.prefabId,
    });
  }

  /**
   * Update instance to new prefab version
   */
  updateToVersion(
    entityId: number,
    getPrefab: (prefabId: string) => IPrefabDefinition | undefined,
  ): void {
    const prefabInstance = componentRegistry.getComponentData(entityId, 'PrefabInstance');
    if (!prefabInstance) {
      throw new Error('Entity is not a prefab instance');
    }

    const instance = prefabInstance as {
      prefabId: string;
      version: number;
      overridePatch?: unknown;
    };
    const prefab = getPrefab(instance.prefabId);

    if (!prefab) {
      throw new Error(`Prefab not found: ${instance.prefabId}`);
    }

    if (prefab.version === instance.version) {
      logger.debug('Instance is already up to date', { entityId });
      return;
    }

    // Get transform info before update
    const transform = componentRegistry.getComponentData(entityId, 'Transform');
    const parentId = transform ? (transform as { parent?: number }).parent : undefined;
    const position = transform
      ? (transform as { position?: [number, number, number] }).position
      : undefined;

    // Destroy and re-instantiate with preserved overrides
    this.destroyInstance(entityId);

    const newEntityId = this.instantiate(prefab, {
      parentEntityId: parentId,
      position,
      applyOverrides: instance.overridePatch,
    });

    logger.debug('Instance updated to new version', {
      oldEntityId: entityId,
      newEntityId,
      oldVersion: instance.version,
      newVersion: prefab.version,
    });
  }

  /**
   * Check if entity is a prefab instance
   */
  isInstance(entityId: number): boolean {
    return componentRegistry.hasComponent(entityId, 'PrefabInstance');
  }

  /**
   * Get prefab ID from instance
   */
  getPrefabId(entityId: number): string | null {
    const prefabInstance = componentRegistry.getComponentData(entityId, 'PrefabInstance');
    if (!prefabInstance) {
      return null;
    }

    return (prefabInstance as { prefabId: string }).prefabId;
  }

  /**
   * Get all instances of a prefab
   */
  getInstances(prefabId: string): number[] {
    const instances: number[] = [];
    const entities = componentRegistry.getEntitiesWithComponent('PrefabInstance');

    for (const entityId of entities) {
      const instance = componentRegistry.getComponentData(entityId, 'PrefabInstance');
      if (instance && (instance as { prefabId: string }).prefabId === prefabId) {
        instances.push(entityId);
      }
    }

    return instances;
  }
}
