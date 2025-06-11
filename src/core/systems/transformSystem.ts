// Transform System
// Synchronizes Transform components with Three.js objects and handles hierarchical transforms
import { defineQuery } from 'bitecs';
import { Euler, Matrix4, Quaternion, Vector3 } from 'three';

import { componentRegistry } from '@core/lib/ecs/ComponentRegistry';
import { EntityManager } from '@core/lib/ecs/EntityManager';
import { ECSWorld } from '@core/lib/ecs/World';
import { ITransformData } from '@core/lib/ecs/components/TransformComponent';

// Get world instance
const world = ECSWorld.getInstance().getWorld();

// Lazy-initialize the query to avoid module-load timing issues
let transformQuery: ReturnType<typeof defineQuery> | null = null;

// Initialize the query when needed
function getTransformQuery() {
  if (!transformQuery) {
    const transformComponent = componentRegistry.getBitECSComponent('Transform');
    if (!transformComponent) {
      console.warn('[transformSystem] Transform component not yet registered, skipping update');
      return null;
    }
    transformQuery = defineQuery([transformComponent]);
  }
  return transformQuery;
}

// Entity to Three.js object mapping (simplified for now)
const entityToObject = new Map<number, any>();

// Get entity manager
const entityManager = EntityManager.getInstance();

// Reusable objects to avoid garbage collection
const position = new Vector3();
const euler = new Euler();
const quaternion = new Quaternion();
const scale = new Vector3();
const localMatrix = new Matrix4();

// Cache for computed world transforms
const worldTransforms = new Map<
  number,
  {
    position: Vector3;
    quaternion: Quaternion;
    scale: Vector3;
    matrix: Matrix4;
  }
>();

// Conversion constants
const DEG_TO_RAD = Math.PI / 180;

/**
 * Computes world transform for an entity recursively
 */
function computeWorldTransform(eid: number): {
  position: Vector3;
  quaternion: Quaternion;
  scale: Vector3;
  matrix: Matrix4;
} | null {
  // Check cache first
  if (worldTransforms.has(eid)) {
    return worldTransforms.get(eid)!;
  }

  // Get local transform data
  const transformData = componentRegistry.getComponentData<ITransformData>(eid, 'Transform');
  if (!transformData) return null;

  // Create local transform
  position.set(transformData.position[0], transformData.position[1], transformData.position[2]);

  const rotDeg = transformData.rotation;
  const rotRad = [rotDeg[0] * DEG_TO_RAD, rotDeg[1] * DEG_TO_RAD, rotDeg[2] * DEG_TO_RAD];
  euler.set(rotRad[0], rotRad[1], rotRad[2]);
  quaternion.setFromEuler(euler);

  scale.set(transformData.scale[0], transformData.scale[1], transformData.scale[2]);

  // Create local matrix
  localMatrix.compose(position, quaternion, scale);

  // Get entity and check for parent
  const entity = entityManager.getEntity(eid);
  const finalMatrix = localMatrix.clone();
  const finalPos = position.clone();
  const finalQuat = quaternion.clone();
  const finalScale = scale.clone();

  if (entity?.parentId) {
    // Get parent's world transform
    const parentWorldTransform = computeWorldTransform(entity.parentId);
    if (parentWorldTransform) {
      // Multiply by parent's world matrix
      finalMatrix.multiplyMatrices(parentWorldTransform.matrix, localMatrix);

      // Decompose final matrix
      finalMatrix.decompose(finalPos, finalQuat, finalScale);
    }
  }

  // Cache the result
  const result = {
    position: finalPos.clone(),
    quaternion: finalQuat.clone(),
    scale: finalScale.clone(),
    matrix: finalMatrix.clone(),
  };

  worldTransforms.set(eid, result);
  return result;
}

/**
 * System that synchronizes ECS Transform data with Three.js objects
 * Handles hierarchical transforms with parent-child inheritance
 * Returns the number of transformed entities
 */
export function transformSystem(): number {
  // Get the query (lazy-initialized)
  const query = getTransformQuery();
  if (!query) {
    return 0; // Transform component not yet registered
  }

  // Clear world transform cache
  worldTransforms.clear();

  // Get all entities with Transform components
  const entities = query(world);
  let updatedCount = 0;

  // Process entities in hierarchical order (roots first)
  const processedEntities = new Set<number>();

  const processEntity = (eid: number) => {
    if (processedEntities.has(eid)) return;

    // Skip if no corresponding object
    const object = entityToObject.get(eid);
    if (!object) return;

    // Get entity for hierarchy info
    const entity = entityManager.getEntity(eid);
    if (!entity) return;

    // Process parent first if it exists
    if (entity.parentId && !processedEntities.has(entity.parentId)) {
      processEntity(entity.parentId);
    }

    // Compute world transform
    const worldTransform = computeWorldTransform(eid);
    if (!worldTransform) return;

    // Apply to Three.js object
    object.position.copy(worldTransform.position);
    object.quaternion.copy(worldTransform.quaternion);
    object.scale.copy(worldTransform.scale);

    processedEntities.add(eid);
    updatedCount++;

    // Process children
    entity.children.forEach((childId) => {
      if (!processedEntities.has(childId)) {
        processEntity(childId);
      }
    });
  };

  // Start with root entities first
  entities.forEach((eid: number) => {
    if (!processedEntities.has(eid)) {
      processEntity(eid);
    }
  });

  return updatedCount;
}

/**
 * Register a Three.js object with an entity for transform synchronization
 */
export function registerEntityObject(eid: number, object: any): void {
  entityToObject.set(eid, object);
}

/**
 * Unregister a Three.js object from an entity
 */
export function unregisterEntityObject(eid: number): void {
  entityToObject.delete(eid);
  worldTransforms.delete(eid);
}

/**
 * Get the Three.js object associated with an entity
 */
export function getEntityObject(eid: number): any {
  return entityToObject.get(eid);
}

/**
 * Clear all entity object registrations
 */
export function clearEntityObjects(): void {
  entityToObject.clear();
  worldTransforms.clear();
}
