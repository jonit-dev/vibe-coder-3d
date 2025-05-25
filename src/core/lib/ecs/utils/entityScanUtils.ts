/**
 * Entity scanning utilities for BitECS
 * Provides efficient entity lookup and scanning operations
 */

import { hasComponent } from 'bitecs';

import { EntityMeta } from '../BitECSComponents';
import { EntityId } from '../types';

/**
 * Default maximum entity ID to scan when looking for entities.
 * This can be adjusted based on your game's needs.
 */
const DEFAULT_MAX_ENTITY_SCAN = 10000;

/**
 * Scans for all entities that have the EntityMeta component (i.e., all valid entities)
 */
export const scanAllEntities = (world: any, maxScan = DEFAULT_MAX_ENTITY_SCAN): EntityId[] => {
  const entities: EntityId[] = [];

  for (let eid = 0; eid < maxScan; eid++) {
    if (hasComponent(world, EntityMeta, eid)) {
      entities.push(eid);
    }
  }

  return entities;
};

/**
 * Scans for entities that have a specific component
 */
export const scanEntitiesWithComponent = (
  world: any,
  component: any,
  maxScan = DEFAULT_MAX_ENTITY_SCAN,
): EntityId[] => {
  const entities: EntityId[] = [];

  for (let eid = 0; eid < maxScan; eid++) {
    if (hasComponent(world, component, eid)) {
      entities.push(eid);
    }
  }

  return entities;
};

/**
 * Checks if an entity exists (has EntityMeta component)
 */
export const entityExists = (world: any, eid: EntityId): boolean => {
  return hasComponent(world, EntityMeta, eid);
};

/**
 * Find the first available entity ID (useful for debugging)
 */
export const findNextAvailableEntityId = (
  world: any,
  maxScan = DEFAULT_MAX_ENTITY_SCAN,
): EntityId => {
  for (let eid = 1; eid < maxScan; eid++) {
    if (!hasComponent(world, EntityMeta, eid)) {
      return eid;
    }
  }
  return maxScan; // Fallback
};
