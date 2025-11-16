import { Logger } from '@core/lib/logger';
import { PrefabManager } from '@core/prefabs/PrefabManager';
import { EntityManager } from '@core/lib/ecs/EntityManager';
import { ComponentRegistry } from '@core/lib/ecs/ComponentRegistry';

const logger = Logger.create('AgentPrefabService');

export interface IPrefabCreationOptions {
  name: string;
  selectedIds: number[];
}

export interface IRefreshPrefabsCallback {
  (): void;
}

export class AgentPrefabService {
  constructor(
    private readonly prefabManager: PrefabManager,
    private readonly entityManager: EntityManager,
    private readonly componentRegistry: ComponentRegistry,
    private readonly refreshPrefabs: IRefreshPrefabsCallback,
  ) {}

  createFromEntity(entityId: number, name: string): string | null {
    try {
      const prefabId = this.generatePrefabId(name);

      this.prefabManager.createFromEntity(entityId, name, prefabId);
      this.refreshPrefabs();

      logger.info('Prefab created from entity', { prefabId, name, entityId });
      return prefabId;
    } catch (error) {
      logger.error('Failed to create prefab from entity', { error, entityId, name });
      return null;
    }
  }

  createFromSelection(
    options: IPrefabCreationOptions,
  ): { prefabId: string; instanceId: number } | null {
    const { name, selectedIds } = options;

    if (selectedIds.length === 0) {
      logger.warn('No entities selected for prefab creation', { name });
      return null;
    }

    try {
      let entityId: number;

      if (selectedIds.length === 1) {
        entityId = selectedIds[0];
      } else {
        const container = this.entityManager.createEntity(name);
        entityId = container.id;

        for (const id of selectedIds) {
          this.entityManager.setParent(id, entityId);
        }
      }

      const sourceTransform = this.componentRegistry.getComponentData(entityId, 'Transform') as
        | { position?: [number, number, number] }
        | undefined;
      const sourcePosition = sourceTransform?.position || [0, 0, 0];

      const prefabId = this.generatePrefabId(name);
      this.prefabManager.createFromEntity(entityId, name, prefabId);
      this.refreshPrefabs();

      // Clean up source entities
      this.deleteEntityWithChildren(entityId, selectedIds.length > 1);

      // Instantiate at original position
      const instanceId = this.prefabManager.instantiate(prefabId, { position: sourcePosition });

      if (instanceId === -1) {
        logger.error('Failed to instantiate newly created prefab', { prefabId });
        return null;
      }

      logger.info('Prefab created from selection and instantiated', { prefabId, instanceId });
      return { prefabId, instanceId };
    } catch (error) {
      logger.error('Failed to create prefab from selection', { error, name });
      return null;
    }
  }

  instantiate(prefabId: string, position?: [number, number, number]): number {
    try {
      const options: Record<string, unknown> = {};
      if (position) {
        options.position = position;
      }

      const entityId = this.prefabManager.instantiate(prefabId, options);

      if (entityId === -1) {
        logger.error('Failed to instantiate prefab', { prefabId });
        return -1;
      }

      logger.info('Prefab instantiated', { prefabId, entityId, position });
      return entityId;
    } catch (error) {
      logger.error('Failed to instantiate prefab', { error, prefabId });
      return -1;
    }
  }

  batchInstantiate(
    prefabId: string,
    instances: Array<{
      position?: [number, number, number];
      rotation?: [number, number, number];
      scale?: [number, number, number];
    }>,
  ): number[] {
    try {
      const instanceIds: number[] = [];

      for (const instance of instances) {
        const options: Record<string, unknown> = {};

        if (instance.position) {
          options.position = instance.position;
        }
        if (instance.rotation) {
          options.rotation = instance.rotation;
        }
        if (instance.scale) {
          options.scale = instance.scale;
        }

        const entityId = this.prefabManager.instantiate(prefabId, options);

        if (entityId !== -1) {
          instanceIds.push(entityId);
        } else {
          logger.warn('Failed to instantiate one instance in batch', { prefabId, instance });
        }
      }

      logger.info('Batch prefab instantiation completed', {
        prefabId,
        requestedCount: instances.length,
        successfulCount: instanceIds.length,
        instanceIds,
      });

      return instanceIds;
    } catch (error) {
      logger.error('Failed to batch instantiate prefab', { error, prefabId });
      return [];
    }
  }

  unpack(entityId: number): boolean {
    try {
      if (this.componentRegistry.hasComponent(entityId, 'PrefabInstance')) {
        this.componentRegistry.removeComponent(entityId, 'PrefabInstance');
        logger.info('Prefab instance unpacked', { entityId });
        return true;
      } else {
        logger.warn('Entity is not a prefab instance', { entityId });
        return false;
      }
    } catch (error) {
      logger.error('Failed to unpack prefab', { error, entityId });
      return false;
    }
  }

  list(): Array<{ id: string; name: string; tags: string[] }> {
    try {
      const prefabs = this.prefabManager.getAll();
      const prefabList = prefabs.map((p) => ({
        id: p.id,
        name: p.name,
        tags: p.tags || [],
      }));

      logger.info('Prefab list retrieved', { count: prefabs.length });
      return prefabList;
    } catch (error) {
      logger.error('Failed to list prefabs', { error });
      return [];
    }
  }

  createVariant(
    baseId: string,
    name: string,
    registry: {
      get: (id: string) => unknown;
      upsertVariant: (v: {
        id: string;
        name: string;
        version: number;
        baseId: string;
        patch?: unknown;
      }) => void;
    },
  ): boolean {
    try {
      const basePrefab = registry.get(baseId);

      if (!basePrefab) {
        logger.error('Base prefab not found', { baseId });
        return false;
      }

      const variantId = `${name.toLowerCase().replace(/\s+/g, '-')}-variant`;

      registry.upsertVariant({
        id: variantId,
        baseId,
        name,
        version: 1,
        patch: {},
      });

      this.refreshPrefabs();
      logger.info('Variant created', { variantId, baseId, name });
      return true;
    } catch (error) {
      logger.error('Failed to create prefab variant', { error, baseId, name });
      return false;
    }
  }

  private generatePrefabId(name: string): string {
    return name.toLowerCase().replace(/\s+/g, '-');
  }

  private deleteEntityWithChildren(entityId: number, isContainer: boolean): void {
    if (isContainer) {
      const containerEntity = this.entityManager.getEntity(entityId);
      const children = [...(containerEntity?.children || [])];

      for (const childId of children) {
        this.entityManager.deleteEntity(childId);
      }
    }

    this.entityManager.deleteEntity(entityId);
    logger.debug('Entity deleted with children', { entityId, isContainer });
  }
}
