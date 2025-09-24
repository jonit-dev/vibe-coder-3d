/**
 * Override Applier - Apply override patches on top of base scenes
 * This merges editor changes back into the loaded scene
 */

import { componentRegistry } from '../../ecs/ComponentRegistry';
import { EntityManager } from '../../ecs/EntityManager';
import { OverridesFile, OverridePatch } from '../../serialization/SceneDiff';

/**
 * Apply overrides to the current world state
 */
export function applyOverrides(overrides: OverridesFile): void {
  console.log(
    `[OverrideApplier] Applying ${overrides.patches.length} patches for scene: ${overrides.sceneId}`,
  );

  const entityManager = EntityManager.getInstance();
  const persistentIdToEntity = buildPersistentIdMap();

  // Process each override patch
  overrides.patches.forEach((patch) => {
    try {
      applyPatch(patch, persistentIdToEntity, entityManager);
    } catch (error) {
      console.error(`[OverrideApplier] Failed to apply patch for ${patch.persistentId}:`, error);
    }
  });

  console.log(`[OverrideApplier] Applied overrides from: ${overrides.timestamp}`);
}

/**
 * Apply a single override patch
 */
function applyPatch(
  patch: OverridePatch,
  persistentIdToEntity: Map<string, number>,
  entityManager: EntityManager,
): void {
  const entityId = persistentIdToEntity.get(patch.persistentId);

  // Handle entity deletion
  if (patch.components._deleted) {
    if (entityId !== undefined) {
      console.log(`[OverrideApplier] Deleting entity: ${patch.persistentId}`);
      entityManager.deleteEntity(entityId);
    }
    return;
  }

  // Handle new entity creation
  if (entityId === undefined) {
    if (!patch.entityName) {
      console.warn(`[OverrideApplier] Cannot create entity without name: ${patch.persistentId}`);
      return;
    }

    console.log(
      `[OverrideApplier] Creating new entity: ${patch.entityName} (${patch.persistentId})`,
    );
    const newEntity = entityManager.createEntity(patch.entityName);

    // Override the auto-generated PersistentId with the one from the patch
    componentRegistry.updateComponent(newEntity.id, 'PersistentId', {
      id: patch.persistentId,
    });

    // Add all components from patch
    Object.entries(patch.components).forEach(([componentId, componentData]) => {
      if (componentId !== 'PersistentId' && componentData) {
        componentRegistry.addComponent(newEntity.id, componentId, componentData);
      }
    });

    return;
  }

  // Handle existing entity updates
  const entity = entityManager.getEntity(entityId);
  if (!entity) {
    console.warn(`[OverrideApplier] Entity not found: ${patch.persistentId}`);
    return;
  }

  console.log(`[OverrideApplier] Updating entity: ${entity.name} (${patch.persistentId})`);

  // Update entity name if changed
  if (patch.entityName && patch.entityName !== entity.name) {
    // EntityManager doesn't expose name updates directly
    // This would need to be implemented in EntityManager
    console.log(`[OverrideApplier] Name change: ${entity.name} -> ${patch.entityName}`);
  }

  // Apply component changes
  Object.entries(patch.components).forEach(([componentId, componentData]) => {
    if (componentId === '_deleted') return;

    if (componentData === null) {
      // Remove component
      if (componentRegistry.hasComponent(entityId, componentId)) {
        console.log(`[OverrideApplier] Removing component ${componentId} from entity ${entityId}`);
        componentRegistry.removeComponent(entityId, componentId);
      }
    } else if (componentRegistry.hasComponent(entityId, componentId)) {
      // Update existing component
      console.log(`[OverrideApplier] Updating component ${componentId} on entity ${entityId}`);

      // Get current component data
      const currentData = componentRegistry.getComponentData(entityId, componentId);
      if (currentData) {
        // Merge the override data with current data
        const mergedData = mergeComponentData(currentData, componentData);
        componentRegistry.updateComponent(entityId, componentId, mergedData as Partial<unknown>);
      } else {
        // Component exists but has no data, replace entirely
        componentRegistry.updateComponent(entityId, componentId, componentData as Partial<unknown>);
      }
    } else {
      // Add new component
      console.log(`[OverrideApplier] Adding component ${componentId} to entity ${entityId}`);
      componentRegistry.addComponent(entityId, componentId, componentData);
    }
  });
}

/**
 * Build a map of persistent ID to entity ID for quick lookup
 */
function buildPersistentIdMap(): Map<string, number> {
  const map = new Map<string, number>();
  const entityManager = EntityManager.getInstance();
  const allEntities = entityManager.getAllEntities();

  allEntities.forEach((entity) => {
    const persistentIdData = componentRegistry.getComponentData<{ id: string }>(
      entity.id,
      'PersistentId',
    );

    if (persistentIdData) {
      map.set(persistentIdData.id, entity.id);
    }
  });

  return map;
}

/**
 * Merge component data with overrides
 */
function mergeComponentData(currentData: unknown, overrideData: unknown): unknown {
  if (
    typeof currentData !== 'object' ||
    typeof overrideData !== 'object' ||
    currentData === null ||
    overrideData === null
  ) {
    // For primitives, override completely
    return overrideData;
  }

  const current = currentData as Record<string, unknown>;
  const override = overrideData as Record<string, unknown>;

  const merged = { ...current };

  // Apply each override property
  Object.entries(override).forEach(([key, value]) => {
    if (value === null) {
      // null indicates removal
      delete merged[key];
    } else if (
      typeof current[key] === 'object' &&
      typeof value === 'object' &&
      current[key] !== null &&
      value !== null
    ) {
      // Recursively merge nested objects
      merged[key] = mergeComponentData(current[key], value);
    } else {
      // Replace value
      merged[key] = value;
    }
  });

  return merged;
}

/**
 * Check if overrides can be applied to the current scene
 */
export function canApplyOverrides(overrides: OverridesFile, currentSceneId: string): boolean {
  if (overrides.sceneId !== currentSceneId) {
    console.warn(
      `[OverrideApplier] Scene ID mismatch: overrides for '${overrides.sceneId}', current scene '${currentSceneId}'`,
    );
    return false;
  }

  return true;
}

/**
 * Apply overrides if they match the current scene
 */
export function applyOverridesIfCompatible(
  overrides: OverridesFile,
  currentSceneId: string,
): boolean {
  if (!canApplyOverrides(overrides, currentSceneId)) {
    return false;
  }

  applyOverrides(overrides);
  return true;
}
