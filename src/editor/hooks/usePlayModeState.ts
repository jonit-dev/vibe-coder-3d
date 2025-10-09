import { useCallback, useRef } from 'react';

import { useComponentManager } from './useComponentManager';
import { useEntityManager } from './useEntityManager';
import { componentRegistry } from '@/core/lib/ecs/ComponentRegistry';
import { Logger } from '@/core/lib/logger';

const logger = Logger.create('PlayModeState');

interface IComponentBackup {
  componentType: string;
  data: unknown;
}

interface IEntityBackup {
  entityId: number;
  components: IComponentBackup[];
  existed: boolean; // Whether entity existed before play mode
}

/**
 * Hook to manage complete entity state backup and restoration for play mode.
 *
 * When entering play mode, saves current state of ALL components for all entities.
 * When exiting play mode, restores original component states and removes any
 * components that were added during play mode.
 *
 * This ensures that any physics or script modifications during play mode
 * are completely reverted when the user stops the simulation.
 */
export const usePlayModeState = () => {
  const entityManager = useEntityManager();
  const componentManager = useComponentManager();

  // Store complete entity state backups
  const backupData = useRef<Map<number, IEntityBackup>>(new Map());

  /**
   * Backup current state of all entities and their components
   */
  const backupTransforms = useCallback(() => {
    const backupMap = new Map<number, IEntityBackup>();

    // Get all entities
    const allEntities = entityManager.getAllEntities();

    logger.info(`Backing up state for ${allEntities.length} entities`);

    for (const entity of allEntities) {
      const entityBackup: IEntityBackup = {
        entityId: entity.id,
        components: [],
        existed: true, // Entity exists before play mode
      };

      // Get all component types from the registry
      const allComponentTypes = componentRegistry.listComponents();

      // Back up each component that exists on this entity
      for (const componentType of allComponentTypes) {
        const componentData = componentManager.getComponentData(entity.id, componentType);

        if (componentData !== null) {
          // Deep clone the component data to prevent reference issues
          // Use structuredClone to handle undefined values properly
          const clonedData = structuredClone(componentData);

          entityBackup.components.push({
            componentType,
            data: clonedData,
          });
        }
      }
      backupMap.set(entity.id, entityBackup);
    }

    backupData.current = backupMap;
    logger.info(`State backup complete - ${backupMap.size} entities backed up`);
  }, [entityManager, componentManager]);

  /**
   * Restore backed up component states to all entities
   */
  const restoreTransforms = useCallback(() => {
    let restoredCount = 0;
    let componentsRestored = 0;
    let componentsRemoved = 0;
    let entitiesRemoved = 0;

    logger.info(`Starting state restoration - backup has ${backupData.current.size} entities`);

    if (backupData.current.size === 0) {
      logger.warn('No backup data found!');
      return;
    }

    // Step 1: Identify entities that were created during play mode and remove them
    const currentEntities = entityManager.getAllEntities();
    const backedUpEntityIds = new Set(backupData.current.keys());

    for (const entity of currentEntities) {
      if (!backedUpEntityIds.has(entity.id)) {
        // This entity was created during play mode, remove it
        logger.debug(`Removing entity ${entity.id} (created during play mode)`);
        try {
          entityManager.deleteEntity(entity.id);
          entitiesRemoved++;
        } catch (error) {
          logger.error(`Failed to remove entity ${entity.id}:`, error);
        }
      }
    }

    // Step 2: Restore state for entities that existed before play mode
    for (const [entityId, backup] of Array.from(backupData.current.entries())) {
      // Check if entity still exists
      const entity = entityManager.getEntity(entityId);
      if (!entity) {
        logger.warn(`Entity ${entityId} was deleted during play mode`);
        // TODO: In future, could recreate deleted entities if needed
        continue;
      }

      // Get current component types to detect additions during play mode
      const currentComponentTypes = new Set<string>();
      const allComponentTypes = componentRegistry.listComponents();

      for (const componentType of allComponentTypes) {
        if (componentManager.getComponentData(entityId, componentType) !== null) {
          currentComponentTypes.add(componentType);
        }
      }

      // Restore all backed up components
      for (const { componentType, data } of backup.components) {
        try {
          componentManager.updateComponent(
            entityId,
            componentType,
            data as Record<string, unknown>,
          );
          componentsRestored++;
        } catch (error) {
          logger.error(`Failed to restore ${componentType} for entity ${entityId}:`, error);
        }
      }

      // Remove components that were added during play mode
      const backedUpComponentTypes = new Set(backup.components.map((c) => c.componentType));

      for (const componentType of currentComponentTypes) {
        if (!backedUpComponentTypes.has(componentType)) {
          // This component was added during play mode, remove it
          logger.debug(`Removing ${componentType} from entity ${entityId} (added during play)`);
          try {
            componentManager.removeComponent(entityId, componentType);
            componentsRemoved++;
          } catch (error) {
            logger.error(`Failed to remove ${componentType} from entity ${entityId}:`, error);
          }
        }
      }

      restoredCount++;
    }

    logger.info(
      `State restoration complete: ${restoredCount} entities restored, ` +
        `${entitiesRemoved} entities removed, ` +
        `${componentsRestored} components restored, ${componentsRemoved} components removed`,
    );
  }, [entityManager, componentManager]);

  /**
   * Clear backup data (called when backup is no longer needed)
   */
  const clearBackup = useCallback(() => {
    backupData.current.clear();
    logger.debug('Backup data cleared');
  }, []);

  /**
   * Check if backup data exists
   */
  const hasBackup = useCallback(() => {
    return backupData.current.size > 0;
  }, []);

  return {
    backupTransforms,
    restoreTransforms,
    clearBackup,
    hasBackup,
  };
};
