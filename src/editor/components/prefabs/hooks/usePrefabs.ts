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
   * Create prefab from currently selected entities
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

      const prefabId = options.id || `prefab_${Date.now()}`;
      const entityManager = EntityManager.getInstance();

      try {
        let entityId: number;
        let isTemporaryContainer = false;

        if (selectedIds.length === 1) {
          // Single entity: use directly
          entityId = selectedIds[0];
        } else {
          // Multiple entities: create temporary container
          // Filter out child entities if their parent is also selected
          const rootSelectedIds = selectedIds.filter((id) => {
            const entity = entityManager.getEntity(id);
            if (!entity) return false;
            return !entity.parentId || !selectedIds.includes(entity.parentId);
          });

          logger.debug('Filtered root entities for prefab creation', {
            original: selectedIds,
            filtered: rootSelectedIds,
          });

          // Create temporary container entity
          const container = entityManager.createEntity(options.name);
          entityId = container.id;
          isTemporaryContainer = true;

          // Parent all root selected entities to the container
          for (const id of rootSelectedIds) {
            entityManager.setParent(id, entityId);
          }

          logger.debug('Created temporary container for multi-selection', {
            containerId: entityId,
            childCount: rootSelectedIds.length,
          });
        }

        // Create prefab from the entity (single or container)
        const prefab = prefabManager.createFromEntity(entityId, options.name, prefabId);
        _refreshPrefabs();

        // Clean up temporary container if created
        if (isTemporaryContainer) {
          // Unparent children before destroying container
          const containerEntity = entityManager.getEntity(entityId);
          const children = [...(containerEntity?.children || [])];
          for (const childId of children) {
            entityManager.setParent(childId, undefined);
          }
          entityManager.deleteEntity(entityId);
          logger.debug('Cleaned up temporary container', { containerId: entityId });
        }

        logger.info('Prefab created from selection', {
          prefabId,
          entityId,
          isMultiSelection: selectedIds.length > 1,
        });
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
   * Replace selected entities with a single prefab instance
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

        // Filter out child entities - only work with root entities in the selection
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

        if (rootSelectedIds.length === 0) {
          logger.warn('No root entities to replace');
          return;
        }

        // Calculate center position of all selected entities for placement
        const avgPosition: [number, number, number] = [0, 0, 0];
        let validTransformCount = 0;

        for (const entityId of rootSelectedIds) {
          const transform = componentRegistry.getComponentData<ITransformData>(
            entityId,
            'Transform',
          );
          if (transform?.position) {
            avgPosition[0] += transform.position[0];
            avgPosition[1] += transform.position[1];
            avgPosition[2] += transform.position[2];
            validTransformCount++;
          }
        }

        if (validTransformCount > 0) {
          avgPosition[0] /= validTransformCount;
          avgPosition[1] /= validTransformCount;
          avgPosition[2] /= validTransformCount;
        }

        // Get parent from first entity (if all have same parent, use it)
        const firstParent = entityManager.getEntity(rootSelectedIds[0])?.parentId;

        // Destroy all selected entities
        for (const entityId of rootSelectedIds) {
          prefabManager.destroy(entityId);
        }

        // Create single prefab instance at average position
        const newEntityId = prefabManager.instantiate(
          prefabId,
          {
            position: avgPosition,
          },
          firstParent,
        );

        // Update selection to new entity
        if (newEntityId !== -1) {
          useEditorStore.getState().setSelectedIds([newEntityId]);
          logger.info('Selection replaced with single prefab instance', {
            prefabId,
            newEntityId,
            replacedCount: rootSelectedIds.length,
          });
        }
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
