import { useCallback } from 'react';
import { usePrefabsStore } from '@/editor/store/prefabsStore';
import { PrefabManager } from '@/core/prefabs/PrefabManager';
import { useEditorStore } from '@/editor/store/editorStore';
import { componentRegistry } from '@/core/lib/ecs/ComponentRegistry';
import { Logger } from '@/core/lib/logger';

const logger = Logger.create('usePrefabs');

export const usePrefabs = () => {
  const prefabManager = PrefabManager.getInstance();
  const { selectedIds } = useEditorStore();
  const { openBrowser, closeBrowser, openCreate, closeCreate, _refreshPrefabs } = usePrefabsStore();

  /**
   * Create prefab from currently selected entity
   */
  const createFromSelection = useCallback(
    (options: { name: string; id?: string }) => {
      if (selectedIds.length === 0) {
        logger.warn('No entity selected');
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
    [selectedIds, prefabManager, _refreshPrefabs],
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
      if (selectedIds.length === 0) {
        logger.warn('No entities selected');
        return;
      }

      try {
        const newEntityIds: number[] = [];

        for (const entityId of selectedIds) {
          // Get entity transform for placement
          const transform = componentRegistry.getComponentData(entityId, 'Transform') as
            | { position?: number[]; parent?: number }
            | undefined;

          const position = transform?.position;
          const parent = transform?.parent;

          // Destroy old entity
          prefabManager.destroy(entityId);

          // Create prefab instance at same location
          const newEntityId = prefabManager.instantiate(prefabId, { position }, parent);
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
    [selectedIds, prefabManager],
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
