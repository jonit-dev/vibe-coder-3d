/**
 * Prefab API implementation
 * Provides scripts with entity spawning and destruction capabilities
 */

import type { IPrefabAPI } from '../ScriptAPI';
import { Logger } from '@/core/lib/logger';
import { PrefabManager } from '@/core/prefabs/PrefabManager';

const logger = Logger.create('PrefabAPI');

/**
 * Creates a prefab API for scripts
 */
export const createPrefabAPI = (entityId: number): IPrefabAPI => {
  const prefabManager = PrefabManager.getInstance();

  return {
    spawn: (prefabId: string, overrides?: Record<string, unknown>): number => {
      logger.debug(`Spawning prefab: ${prefabId}`, { entityId, overrides });

      try {
        const newEntityId = prefabManager.instantiate(prefabId, overrides);

        if (newEntityId === -1) {
          logger.error(`Failed to spawn prefab: ${prefabId}`);
          return -1;
        }

        logger.info(`Spawned prefab ${prefabId} as entity ${newEntityId}`);
        return newEntityId;
      } catch (error) {
        logger.error('Prefab spawn error:', error);
        return -1;
      }
    },

    destroy: (targetEntityId?: number): void => {
      const targetId = targetEntityId ?? entityId;
      logger.debug(`Destroying entity: ${targetId}`, { entityId });

      try {
        prefabManager.destroy(targetId);
        logger.info(`Destroyed entity: ${targetId}`);
      } catch (error) {
        logger.error('Entity destruction error:', error);
      }
    },

    setActive: (targetEntityId: number, active: boolean): void => {
      logger.debug(`Setting entity ${targetEntityId} active: ${active}`, { entityId });

      try {
        prefabManager.setActive(targetEntityId, active);
      } catch (error) {
        logger.error('setActive error:', error);
      }
    },
  };
};
