/**
 * Entities API implementation
 * Provides scripts with entity reference resolution and queries
 */

import { ComponentManager } from '@/core/lib/ecs/ComponentManager';
import { EntityMetadataManager } from '@/core/lib/ecs/metadata/EntityMetadataManager';
import { TagManager } from '@/core/lib/ecs/tags/TagManager';
import { Logger } from '@/core/lib/logger';

import type { IEntitiesAPI, IEntityRef, IEntityScriptAPI } from '../ScriptAPI';
import { createEntityAPI } from '../ScriptAPI';

const logger = Logger.create('EntitiesAPI');

/**
 * Creates an entities API for scripts
 */
export const createEntitiesAPI = (): IEntitiesAPI => {
  const componentManager = ComponentManager.getInstance();
  const metadataManager = EntityMetadataManager.getInstance();
  const tagManager = TagManager.getInstance();

  // Helper to check if entity exists
  const entityExists = (id: number): boolean => {
    // Check if entity has Transform component (all entities must have one)
    return componentManager.hasComponent(id, 'Transform');
  };

  return {
    fromRef: (ref: IEntityRef | number | string): IEntityScriptAPI | null => {
      let entityId: number | null = null;

      // Handle direct entity ID
      if (typeof ref === 'number') {
        entityId = ref;
      }
      // Handle string GUID
      else if (typeof ref === 'string') {
        entityId = metadataManager.findByGuid(ref);
        if (entityId === null) {
          logger.debug('Entity not found by GUID', { guid: ref });
        }
      }
      // Handle IEntityRef object
      else {
        // Try entityId field
        if (ref.entityId !== undefined) {
          entityId = ref.entityId;
        }
        // Try GUID
        else if (ref.guid) {
          entityId = metadataManager.findByGuid(ref.guid);
        }
        // Try name (returns first match)
        else if (ref.name) {
          const matches = metadataManager.findByName(ref.name);
          entityId = matches.length > 0 ? matches[0] : null;
        }
      }

      // Validate entity exists
      if (entityId !== null && entityExists(entityId)) {
        return createEntityAPI(entityId);
      }

      return null;
    },

    get: (entityId: number): IEntityScriptAPI | null => {
      return entityExists(entityId) ? createEntityAPI(entityId) : null;
    },

    findByName: (name: string): IEntityScriptAPI[] => {
      logger.debug(`Finding entities by name: ${name}`);
      const entityIds = metadataManager.findByName(name);
      return entityIds.filter(entityExists).map(createEntityAPI);
    },

    findByTag: (tag: string): IEntityScriptAPI[] => {
      logger.debug(`Finding entities by tag: ${tag}`);
      const entityIds = tagManager.findByTag(tag);
      return entityIds.filter(entityExists).map(createEntityAPI);
    },

    exists: (entityId: number): boolean => {
      return entityExists(entityId);
    },
  };
};
