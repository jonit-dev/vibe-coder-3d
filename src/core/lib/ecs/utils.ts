import { EntityId } from './types';

/**
 * Helper function to check if an entity ID is valid.
 * Handles the case where 0 is a valid entity ID but null/undefined are not.
 *
 * @param entityId - The entity ID to validate (can be number, null, or undefined)
 * @returns true if the entity ID is a valid number (including 0), false otherwise
 *
 * @example
 * ```typescript
 * if (isValidEntityId(entityId)) {
 *   // entityId is guaranteed to be a number here
 *   componentManager.getComponent(entityId, 'transform');
 * }
 * ```
 */
export const isValidEntityId = (entityId: EntityId | null | undefined): entityId is EntityId => {
  return entityId !== null && entityId !== undefined;
};

/**
 * Type guard for checking if a value is a valid entity ID
 * More explicit version of isValidEntityId for better readability
 */
export const isEntity = isValidEntityId;

// Export utility modules
export * from './utils/colorUtils';
export * from './utils/componentConverters';
export * from './utils/entityScanUtils';
export * from './utils/stringHashUtils';

// Export utility modules
export * from './utils/colorUtils';
export * from './utils/componentConverters';
export * from './utils/entityScanUtils';
export * from './utils/stringHashUtils';
