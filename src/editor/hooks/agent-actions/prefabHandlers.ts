/**
 * Prefab management handlers for agent actions
 */

import { EntityManager } from '@core/lib/ecs/EntityManager';
import { componentRegistry } from '@core/lib/ecs/ComponentRegistry';
import { PrefabManager } from '@core/prefabs/PrefabManager';
import { Logger } from '@core/lib/logger';

const logger = Logger.create('AgentActions:Prefab');

export const createPrefabHandlers = (
  refreshPrefabs: () => void,
  getSelectedIds: () => number[],
) => {
  const handleCreatePrefab = (event: Event) => {
    const customEvent = event as CustomEvent;
    const { name } = customEvent.detail;

    logger.info('Agent requested prefab creation from selection', { name });

    try {
      const selectedIds = getSelectedIds();

      if (selectedIds.length === 0) {
        logger.warn('No entities selected for prefab creation', { name });
        return;
      }

      const entityManager = EntityManager.getInstance();
      const prefabManager = PrefabManager.getInstance();
      let entityId: number;

      if (selectedIds.length === 1) {
        entityId = selectedIds[0];
      } else {
        const container = entityManager.createEntity(name);
        entityId = container.id;

        for (const id of selectedIds) {
          entityManager.setParent(id, entityId);
        }
      }

      const prefabId = name.toLowerCase().replace(/\s+/g, '-');
      prefabManager.createFromEntity(entityId, name, prefabId);
      refreshPrefabs();

      if (selectedIds.length > 1) {
        const containerEntity = entityManager.getEntity(entityId);
        const children = [...(containerEntity?.children || [])];
        for (const childId of children) {
          entityManager.setParent(childId, undefined);
        }
        entityManager.deleteEntity(entityId);
      }

      logger.info('Prefab created from selection', { prefabId, name });
    } catch (error) {
      logger.error('Failed to create prefab', { error, name });
    }
  };

  const handleInstantiatePrefab = (event: Event) => {
    const customEvent = event as CustomEvent;
    const { prefabId, position } = customEvent.detail;

    logger.info('Agent requested prefab instantiation', { prefabId, position });

    try {
      const prefabManager = PrefabManager.getInstance();
      const options: Record<string, unknown> = {};
      if (position) {
        options.position = position;
      }

      const entityId = prefabManager.instantiate(prefabId, options);

      if (entityId === -1) {
        logger.error('Failed to instantiate prefab', { prefabId });
        return;
      }

      logger.info('Prefab instantiated', { prefabId, entityId, position });
    } catch (error) {
      logger.error('Failed to instantiate prefab', { error, prefabId });
    }
  };

  const handleListPrefabs = () => {
    logger.info('Agent requested prefab list');

    try {
      const prefabManager = PrefabManager.getInstance();
      const prefabs = prefabManager.getAll();
      const prefabList = prefabs.map((p) => ({
        id: p.id,
        name: p.name,
        tags: p.tags || [],
      }));

      logger.info('Prefab list retrieved', {
        count: prefabs.length,
        prefabs: prefabList,
      });

      window.dispatchEvent(
        new CustomEvent('agent:prefab-list-result', {
          detail: { prefabs: prefabList },
        }),
      );
    } catch (error) {
      logger.error('Failed to list prefabs', { error });
    }
  };

  const handleCreateVariant = (event: Event) => {
    const customEvent = event as CustomEvent;
    const { baseId, name } = customEvent.detail;

    logger.info('Agent requested prefab variant creation', { baseId, name });

    try {
      const prefabManager = PrefabManager.getInstance();
      const registry = prefabManager['registry'];
      const basePrefab = registry.get(baseId);

      if (!basePrefab) {
        logger.error('Base prefab not found', { baseId });
        return;
      }

      const variantId = `${name.toLowerCase().replace(/\s+/g, '-')}-variant`;

      registry.upsertVariant({
        id: variantId,
        baseId,
        name,
        version: 1,
        patch: {},
      });

      refreshPrefabs();
      logger.info('Variant created', { variantId, baseId, name });
    } catch (error) {
      logger.error('Failed to create prefab variant', { error, baseId, name });
    }
  };

  const handleUnpackPrefab = (event: Event) => {
    const customEvent = event as CustomEvent;
    const { entityId } = customEvent.detail;

    logger.info('Agent requested prefab unpack', { entityId });

    try {
      if (componentRegistry.hasComponent(entityId, 'PrefabInstance')) {
        componentRegistry.removeComponent(entityId, 'PrefabInstance');
        logger.info('Prefab instance unpacked', { entityId });
      } else {
        logger.warn('Entity is not a prefab instance', { entityId });
      }
    } catch (error) {
      logger.error('Failed to unpack prefab', { error, entityId });
    }
  };

  return {
    handleCreatePrefab,
    handleInstantiatePrefab,
    handleListPrefabs,
    handleCreateVariant,
    handleUnpackPrefab,
  };
};
