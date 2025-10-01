import { componentRegistry } from '@/core/lib/ecs/ComponentRegistry';
import type { ITransformData } from '@/core/lib/ecs/components/TransformComponent';
import { EntityManager } from '@/core/lib/ecs/EntityManager';
import { Logger } from '@/core/lib/logger';
import { PrefabManager } from '@/core/prefabs/PrefabManager';
import { useEditorStore } from '@/editor/store/editorStore';
import { usePrefabsStore } from '@/editor/store/prefabsStore';
import { useCallback } from 'react';

const logger = Logger.create('usePrefabs');

export const usePrefabs = () => {
  const prefabManager = PrefabManager.getInstance();
  const { openBrowser, closeBrowser, openCreate, closeCreate, _refreshPrefabs } = usePrefabsStore();

  /**
   * Create prefab from currently selected entity
   */
  const createFromSelection = useCallback(
    (options: { name: string; id?: string }) => {
      // Read selectedIds directly from store to ensure latest value
      const selectedIds = useEditorStore.getState().selectedIds;

      logger.debug('Creating prefab from selection', { selectedIds, options });

      if (selectedIds.length === 0) {
        logger.warn('No entity selected', { selectedIds });
        return null;
      }

      const entityId = selectedIds[0]; // Use first selected entity
      const prefabId = options.id || `prefab_${Date.now()}`;

      try {
        const prefab = prefabManager.createFromEntity(entityId, options.name, prefabId);
        _refreshPrefabs();
        logger.info('Prefab created from selection', { prefabId, entityId });
        return prefab;
      } catch (error) {
        logger.error('Failed to create prefab from selection:', error);
        return null;
      }
    },
    [prefabManager, _refreshPrefabs],
  );

  /**
   * Instantiate prefab into scene
   */
  const instantiate = useCallback(
    (
      prefabId: string,
      options?: { parentEntityId?: number; position?: [number, number, number] },
    ) => {
      try {
        const entityId = prefabManager.instantiate(prefabId, options, options?.parentEntityId);
        if (entityId === -1) {
          logger.error('Failed to instantiate prefab', { prefabId });
          return -1;
        }

        logger.info('Prefab instantiated', { prefabId, entityId });
        return entityId;
      } catch (error) {
        logger.error('Failed to instantiate prefab:', error);
        return -1;
      }
    },
    [prefabManager],
  );

  /**
   * Replace selected entities with prefab instances
   */
  const replaceSelectionWithPrefab = useCallback(
    (prefabId: string) => {
      const selectedIds = useEditorStore.getState().selectedIds;

      if (selectedIds.length === 0) {
        logger.warn('No entities selected');
        return;
      }

      try {
        const entityManager = EntityManager.getInstance();

        // Filter out child entities - only replace root entities in the selection
        // to avoid duplication when parent deletion cascades to children
        const rootSelectedIds = selectedIds.filter((entityId) => {
          const entity = entityManager.getEntity(entityId);
          if (!entity) return false;

          // Keep this entity only if its parent is not also selected
          return !entity.parentId || !selectedIds.includes(entity.parentId);
        });

        logger.debug('Filtered selection for replacement', {
          original: selectedIds,
          filtered: rootSelectedIds,
        });

        const newEntityIds: number[] = [];

        for (const entityId of rootSelectedIds) {
          // Get entity transform for placement
          const transform = componentRegistry.getComponentData<ITransformData>(
            entityId,
            'Transform',
          );

          // Preserve parent relationship using EntityManager (source of truth)
          const parent = entityManager.getEntity(entityId)?.parentId;

          // Destroy old entity (this will cascade to children)
          prefabManager.destroy(entityId);

          // Create prefab instance at same location with full transform
          const newEntityId = prefabManager.instantiate(
            prefabId,
            {
              position: transform?.position,
              rotation: transform?.rotation,
              scale: transform?.scale,
            },
            parent,
          );
          if (newEntityId !== -1) {
            newEntityIds.push(newEntityId);
          }
        }

        // Update selection to new entities
        useEditorStore.getState().setSelectedIds(newEntityIds);

        logger.info('Selection replaced with prefab', { prefabId, count: newEntityIds.length });
      } catch (error) {
        logger.error('Failed to replace selection with prefab:', error);
      }
    },
    [prefabManager],
  );

  /**
   * Apply instance overrides back to prefab asset
   */
  const applyToAsset = useCallback(
    (entityId: number) => {
      try {
        prefabManager.applyToAsset(entityId);
        _refreshPrefabs();
        logger.info('Instance overrides applied to asset', { entityId });
      } catch (error) {
        logger.error('Failed to apply to asset:', error);
      }
    },
    [prefabManager, _refreshPrefabs],
  );

  /**
   * Revert instance to prefab defaults
   */
  const revertInstance = useCallback(
    (entityId: number) => {
      try {
        prefabManager.revertInstance(entityId);
        logger.info('Instance reverted to defaults', { entityId });
      } catch (error) {
        logger.error('Failed to revert instance:', error);
      }
    },
    [prefabManager],
  );

  /**
   * Create variant from base prefab
   */
  const createVariant = useCallback(
    (options: { baseId: string; name: string; id?: string }) => {
      const variantId = options.id || `${options.baseId}_variant_${Date.now()}`;

      try {
        const { registry } = usePrefabsStore.getState();
        const basePrefab = registry.get(options.baseId);

        if (!basePrefab) {
          logger.error('Base prefab not found', { baseId: options.baseId });
          return null;
        }

        registry.upsertVariant({
          id: variantId,
          baseId: options.baseId,
          name: options.name,
          version: 1,
          patch: {},
        });

        _refreshPrefabs();
        logger.info('Variant created', { variantId, baseId: options.baseId });
        return variantId;
      } catch (error) {
        logger.error('Failed to create variant:', error);
        return null;
      }
    },
    [_refreshPrefabs],
  );

  /**
   * Unpack prefab instance (convert to regular entity)
   */
  const unpackInstance = useCallback((entityId: number) => {
    try {
      // Remove PrefabInstance component to detach from prefab
      if (componentRegistry.hasComponent(entityId, 'PrefabInstance')) {
        componentRegistry.removeComponent(entityId, 'PrefabInstance');
        logger.info('Prefab instance unpacked', { entityId });
      }
    } catch (error) {
      logger.error('Failed to unpack instance:', error);
    }
  }, []);

  return {
    // Commands
    createFromSelection,
    instantiate,
    replaceSelectionWithPrefab,
    applyToAsset,
    revertInstance,
    createVariant,
    unpackInstance,

    // Modal controls
    openBrowser,
    closeBrowser,
    openCreate,
    closeCreate,
  };
};
