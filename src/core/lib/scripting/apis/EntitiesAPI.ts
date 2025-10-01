/**
 * Entities API implementation
 * Provides scripts with entity reference resolution and queries
 */

import type { IEntitiesAPI, IEntityRef, IEntityScriptAPI } from '../ScriptAPI';
import { createEntityAPI } from '../ScriptAPI';
import { ComponentManager } from '@/core/lib/ecs/ComponentManager';
import { Logger } from '@/core/lib/logger';

const logger = Logger.create('EntitiesAPI');

/**
 * Creates an entities API for scripts
 */
export const createEntitiesAPI = (): IEntitiesAPI => {
  const componentManager = ComponentManager.getInstance();

  // Helper to check if entity exists
  const entityExists = (id: number): boolean => {
    try {
      // Try to get any component to verify entity exists
      return componentManager.hasComponent(id, 'Transform');
    } catch {
      return false;
    }
  };

  return {
    fromRef: (ref: IEntityRef | number | string): IEntityScriptAPI | null => {
      // Handle direct entity ID
      if (typeof ref === 'number') {
        return entityExists(ref) ? createEntityAPI(ref) : null;
      }

      // Handle string path/guid
      if (typeof ref === 'string') {
        // TODO: Implement path/guid resolution
        logger.warn('Entity path/guid resolution not yet implemented', { ref });
        return null;
      }

      // Handle IEntityRef object
      if (ref.entityId && entityExists(ref.entityId)) {
        return createEntityAPI(ref.entityId);
      }

      // TODO: Fallback to guid or path resolution
      logger.warn('Entity reference resolution incomplete', { ref });
      return null;
    },

    get: (entityId: number): IEntityScriptAPI | null => {
      return entityExists(entityId) ? createEntityAPI(entityId) : null;
    },

    findByName: (name: string): IEntityScriptAPI[] => {
      // TODO: Implement name-based entity search
      logger.debug(`Finding entities by name: ${name}`);
      logger.warn('findByName not yet implemented');
      return [];
    },

    findByTag: (tag: string): IEntityScriptAPI[] => {
      // TODO: Implement tag-based entity search
      logger.debug(`Finding entities by tag: ${tag}`);
      logger.warn('findByTag not yet implemented');
      return [];
    },

    exists: (entityId: number): boolean => {
      return entityExists(entityId);
    },
  };
};
