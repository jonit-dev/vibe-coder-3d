// Transform System
// Synchronizes Transform components with Three.js objects and handles hierarchical transforms
import { defineQuery } from 'bitecs';
import { Vector3, Quaternion, Matrix4, Object3D } from 'three';

import { EntityManager } from '@core/lib/ecs/EntityManager';
import { ECSWorld } from '@core/lib/ecs/World';
import { ITransformData } from '@core/lib/ecs/components/TransformComponent';
import { componentRegistry } from '../lib/ecs/ComponentRegistry';
import {
  acquireEuler,
  acquireMatrix4,
  acquireQuaternion,
  acquireVector3,
  arrayPool,
  releaseEuler,
  releaseMatrix4,
  releaseQuaternion,
  releaseVector3,
} from '../lib/perf/MathPools';

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
const entityToObject = new Map<number, Object3D>();

// Get entity manager
const entityManager = EntityManager.getInstance();

// Pooled objects for zero-allocation transform calculations

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
 * Computes world transform for an entity recursively using object pools
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

  // Acquire pooled objects for calculations
  const position = acquireVector3(
    transformData.position[0],
    transformData.position[1],
    transformData.position[2],
  );
  const scale = acquireVector3(
    transformData.scale[0],
    transformData.scale[1],
    transformData.scale[2],
  );
  const euler = acquireEuler();
  const quaternion = acquireQuaternion();
  const localMatrix = acquireMatrix4();

  try {
    // Create local transform
    const rotDeg = transformData.rotation;
    const rotRad = arrayPool.acquire();
    try {
      rotRad[0] = rotDeg[0] * DEG_TO_RAD;
      rotRad[1] = rotDeg[1] * DEG_TO_RAD;
      rotRad[2] = rotDeg[2] * DEG_TO_RAD;
      euler.set(rotRad[0], rotRad[1], rotRad[2]);
      quaternion.setFromEuler(euler);

      // Create local matrix
      localMatrix.compose(position, quaternion, scale);

      // Get entity and check for parent
      const entity = entityManager.getEntity(eid);
      const finalMatrix = acquireMatrix4();
      const finalPos = acquireVector3();
      const finalQuat = acquireQuaternion();
      const finalScale = acquireVector3();

      try {
        finalMatrix.copy(localMatrix);
        finalPos.copy(position);
        finalQuat.copy(quaternion);
        finalScale.copy(scale);

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
          position: acquireVector3().copy(finalPos),
          quaternion: acquireQuaternion().copy(finalQuat),
          scale: acquireVector3().copy(finalScale),
          matrix: acquireMatrix4().copy(finalMatrix),
        };

        worldTransforms.set(eid, result);
        return result;
      } finally {
        // Release temporary objects
        releaseMatrix4(finalMatrix);
        releaseVector3(finalPos);
        releaseQuaternion(finalQuat);
        releaseVector3(finalScale);
      }
    } finally {
      arrayPool.release(rotRad);
    }
  } finally {
    // Release pooled objects
    releaseVector3(position);
    releaseVector3(scale);
    releaseEuler(euler);
    releaseQuaternion(quaternion);
    releaseMatrix4(localMatrix);
  }
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

    // Apply to Three.js object using pooled vectors to avoid temporary allocations
    const tempPos = acquireVector3();
    const tempQuat = acquireQuaternion();
    const tempScale = acquireVector3();

    try {
      tempPos.copy(worldTransform.position);
      tempQuat.copy(worldTransform.quaternion);
      tempScale.copy(worldTransform.scale);

      object.position.copy(tempPos);
      object.quaternion.copy(tempQuat);
      object.scale.copy(tempScale);
    } finally {
      releaseVector3(tempPos);
      releaseQuaternion(tempQuat);
      releaseVector3(tempScale);
    }

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
export function registerEntityObject(eid: number, object: Object3D): void {
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
export function getEntityObject(eid: number): Object3D | undefined {
  return entityToObject.get(eid);
}

/**
 * Clear all entity object registrations
 */
export function clearEntityObjects(): void {
  entityToObject.clear();
  worldTransforms.clear();
}
