// Physics Sync System
// Synchronizes physics bodies with ECS Transform components
import { addComponent, defineComponent, defineQuery, Types } from 'bitecs';
import { Quaternion, Vector3 } from 'three';

import { Transform, world } from '../lib/ecs';

// Define a component to store references to physics bodies
export const PhysicsBodyRef = defineComponent({
  // This is a "tag" component that doesn't store data
  // It indicates that an entity has a physics body
  bodyId: Types.ui32, // Store an ID that can be used to look up the actual body
  isActive: Types.ui8, // Flag for if the body is active in the simulation
  priority: Types.ui8, // Priority for update (higher gets updated more frequently)
});

// Define the type for our physics body references
// This is a simplified approach - in a real implementation,
// we might use the actual Rapier types more directly
type PhysicsBody = {
  handle: number;
  isKinematic: boolean;
  isSleeping?: () => boolean;
  translation: () => { x: number; y: number; z: number };
  rotation: () => { x: number; y: number; z: number; w: number };
  setTranslation: (position: Vector3, wakeUp?: boolean) => void;
  setRotation: (rotation: Quaternion, wakeUp?: boolean) => void;
};

// Map to store references to physics bodies
export const bodyRefs = new Map<number, PhysicsBody>();

// Query for entities with both Transform and PhysicsBodyRef components
export const physicsQuery = defineQuery([Transform, PhysicsBodyRef]);

// Shared object pool to minimize allocations
const vectorPool: Vector3[] = Array(32)
  .fill(0)
  .map(() => new Vector3());
const quaternionPool: Quaternion[] = Array(32)
  .fill(0)
  .map(() => new Quaternion());
let poolIndex = 0;

// Get vector from pool
const getVector = (): Vector3 => {
  const v = vectorPool[poolIndex];
  poolIndex = (poolIndex + 1) % vectorPool.length;
  return v;
};

// Get quaternion from pool
const getQuaternion = (): Quaternion => {
  const q = quaternionPool[poolIndex];
  poolIndex = (poolIndex + 1) % quaternionPool.length;
  return q;
};

// Frame counter for staggered updates
let frameCount = 0;

/**
 * System to synchronize physics bodies with ECS Transform components
 * Includes optimizations like object pooling and staggered updates
 *
 * @param deltaTime Time since last frame in seconds
 */
export function runPhysicsSyncSystem(_deltaTime: number) {
  try {
    frameCount++;
    const entities = physicsQuery(world);
    let updatedCount = 0;

    // Process in batches for better performance
    const batchSize = 64;
    const numBatches = Math.ceil(entities.length / batchSize);

    for (let batch = 0; batch < numBatches; batch++) {
      const start = batch * batchSize;
      const end = Math.min(start + batchSize, entities.length);

      for (let i = start; i < end; i++) {
        const eid = entities[i];

        // Skip low priority entities on some frames for staggered updates
        const priority = PhysicsBodyRef.priority[eid] || 1;
        if (priority < 3 && frameCount % (4 - priority) !== 0) {
          continue;
        }

        // Get the body reference
        const bodyId = PhysicsBodyRef.bodyId[eid];
        const body = bodyRefs.get(bodyId);

        // Skip if the body reference is missing or invalid
        if (!body) {
          unregisterPhysicsBody(eid);
          continue;
        }

        // Skip sleeping bodies when possible
        if (body.isSleeping && body.isSleeping() && !body.isKinematic) {
          if (Transform.needsUpdate[eid] === 0) {
            continue;
          }
        }

        // Check if active
        if (PhysicsBodyRef.isActive[eid] === 0) {
          continue;
        }

        try {
          // Check if Transform needs update from physics
          if (body.isKinematic) {
            // If kinematic, update physics from Transform
            const tempPosition = getVector().set(
              Transform.position[eid][0],
              Transform.position[eid][1],
              Transform.position[eid][2],
            );

            const tempQuaternion = getQuaternion().set(
              Transform.rotation[eid][0],
              Transform.rotation[eid][1],
              Transform.rotation[eid][2],
              Transform.rotation[eid][3],
            );

            // Only update if needed
            if (Transform.needsUpdate[eid] === 1) {
              // Update the physical body position and rotation
              body.setTranslation(tempPosition, true);
              body.setRotation(tempQuaternion, true);

              // Clear update flag
              Transform.needsUpdate[eid] = 0;
            }
          } else {
            // If dynamic, update Transform from physics
            // Get position and rotation from physics
            const position = body.translation();
            const rotation = body.rotation();

            // Only update if the position has actually changed
            const hasChanged =
              Math.abs(Transform.position[eid][0] - position.x) > 0.0001 ||
              Math.abs(Transform.position[eid][1] - position.y) > 0.0001 ||
              Math.abs(Transform.position[eid][2] - position.z) > 0.0001 ||
              Math.abs(Transform.rotation[eid][0] - rotation.x) > 0.0001 ||
              Math.abs(Transform.rotation[eid][1] - rotation.y) > 0.0001 ||
              Math.abs(Transform.rotation[eid][2] - rotation.z) > 0.0001 ||
              Math.abs(Transform.rotation[eid][3] - rotation.w) > 0.0001;

            if (hasChanged) {
              // Update the ECS Transform component
              Transform.position[eid][0] = position.x;
              Transform.position[eid][1] = position.y;
              Transform.position[eid][2] = position.z;

              Transform.rotation[eid][0] = rotation.x;
              Transform.rotation[eid][1] = rotation.y;
              Transform.rotation[eid][2] = rotation.z;
              Transform.rotation[eid][3] = rotation.w;

              // Mark as updated
              Transform.needsUpdate[eid] = 1;
              updatedCount++;
            }
          }
        } catch (error) {
          unregisterPhysicsBody(eid);
        }
      }
    }

    return updatedCount;
  } catch (error) {
    console.error('Error in physics sync system:', error);
    return 0;
  }
}

/**
 * Helper to register a physics body with an entity
 *
 * @param entity The ECS entity ID
 * @param body The physics body reference
 * @param priority Update priority (3=every frame, 2=every other frame, 1=every third frame)
 */
export function registerPhysicsBody(entity: number, body: PhysicsBody, priority = 3) {
  try {
    // Validate the body object
    if (!body) {
      return entity;
    }

    // Add the PhysicsBodyRef component if not already present
    if (!PhysicsBodyRef.bodyId[entity]) {
      addComponent(world, PhysicsBodyRef, entity);
    }

    // Generate a unique ID for the body or use an existing one
    const bodyId = body.handle || entity;

    // Store the reference
    PhysicsBodyRef.bodyId[entity] = bodyId;
    PhysicsBodyRef.isActive[entity] = 1;
    PhysicsBodyRef.priority[entity] = Math.min(priority, 3);
    bodyRefs.set(bodyId, body);

    return entity;
  } catch (error) {
    console.error('Error registering physics body:', error);
    return entity;
  }
}

/**
 * Helper to unregister a physics body
 *
 * @param entity The ECS entity ID
 */
export function unregisterPhysicsBody(entity: number) {
  try {
    const bodyId = PhysicsBodyRef.bodyId[entity];

    if (bodyId) {
      bodyRefs.delete(bodyId);
    }
  } catch (error) {
    console.error('Error unregistering physics body:', error);
  }
}

/**
 * Set a physics body as active/inactive
 * Inactive bodies won't be synced with ECS
 *
 * @param entity The ECS entity ID
 * @param active Whether the body should be active
 */
export function setPhysicsBodyActive(entity: number, active: boolean) {
  PhysicsBodyRef.isActive[entity] = active ? 1 : 0;
}
