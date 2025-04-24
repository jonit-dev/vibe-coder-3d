// Velocity System - Updates entity positions based on velocity
import { Quaternion, Vector3 } from 'three';

import { Transform, Velocity, velocityQuery, world } from '@core/lib/ecs';

// Object pool for vector calculations to minimize garbage collection
const vectorPool: Vector3[] = Array(16)
  .fill(0)
  .map(() => new Vector3());
const quaternionPool: Quaternion[] = Array(16)
  .fill(0)
  .map(() => new Quaternion());
let poolIndex = 0;

// Get a vector from the pool
const getVector = (): Vector3 => {
  const vector = vectorPool[poolIndex];
  poolIndex = (poolIndex + 1) % vectorPool.length;
  return vector;
};

// Get a quaternion from the pool
const getQuaternion = (): Quaternion => {
  const quat = quaternionPool[poolIndex];
  poolIndex = (poolIndex + 1) % quaternionPool.length;
  return quat;
};

// Frame counter for staggered processing
let frameCounter = 0;

// Minimum velocity magnitude to consider for processing (performance optimization)
const MIN_LINEAR_VELOCITY_SQ = 0.00001;
const MIN_ANGULAR_VELOCITY_SQ = 0.00001;

/**
 * System that applies velocity to transform positions
 * Optimized for performance with object pooling and efficient updates
 *
 * @param deltaTime Time since last frame in seconds
 * @returns Number of entities processed
 */
export function runVelocitySystem(deltaTime: number): number {
  try {
    // Increment frame counter for staggered processing
    frameCounter++;

    // Find all entities with Transform and Velocity components
    const entities = velocityQuery(world);
    let processedCount = 0;

    // Process in batches for better performance
    const batchSize = 64;
    const numBatches = Math.ceil(entities.length / batchSize);

    for (let batch = 0; batch < numBatches; batch++) {
      const start = batch * batchSize;
      const end = Math.min(start + batchSize, entities.length);

      for (let i = start; i < end; i++) {
        const eid = entities[i];

        // Simple load balancing - process lower priority velocities every other frame
        const priority = Velocity.priority[eid] || 1;
        if (priority < 2 && frameCounter % 2 !== 0) {
          continue;
        }

        // Get linear velocity
        const linearVelocity = getVector().set(
          Velocity.linear[eid][0],
          Velocity.linear[eid][1],
          Velocity.linear[eid][2],
        );

        // Get angular velocity
        const angularVelocity = getVector().set(
          Velocity.angular[eid][0],
          Velocity.angular[eid][1],
          Velocity.angular[eid][2],
        );

        // Skip if both velocities are negligible
        if (
          linearVelocity.lengthSq() < MIN_LINEAR_VELOCITY_SQ &&
          angularVelocity.lengthSq() < MIN_ANGULAR_VELOCITY_SQ
        ) {
          continue;
        }

        let needsUpdate = false;

        // Process linear velocity
        if (linearVelocity.lengthSq() >= MIN_LINEAR_VELOCITY_SQ) {
          // Apply linear damping
          const linearDamping = Velocity.linearDamping[eid];
          if (linearDamping > 0) {
            const dampingFactor = Math.pow(1 - linearDamping, deltaTime);
            linearVelocity.multiplyScalar(dampingFactor);

            // Update the component values
            Velocity.linear[eid][0] = linearVelocity.x;
            Velocity.linear[eid][1] = linearVelocity.y;
            Velocity.linear[eid][2] = linearVelocity.z;
          }

          // Scale velocity by delta time
          const deltaVelocity = getVector().copy(linearVelocity).multiplyScalar(deltaTime);

          // Apply to position
          Transform.position[eid][0] += deltaVelocity.x;
          Transform.position[eid][1] += deltaVelocity.y;
          Transform.position[eid][2] += deltaVelocity.z;

          needsUpdate = true;
        }

        // Process angular velocity
        if (angularVelocity.lengthSq() >= MIN_ANGULAR_VELOCITY_SQ) {
          // Apply angular damping
          const angularDamping = Velocity.angularDamping[eid];
          if (angularDamping > 0) {
            const dampingFactor = Math.pow(1 - angularDamping, deltaTime);
            angularVelocity.multiplyScalar(dampingFactor);

            // Update the component values
            Velocity.angular[eid][0] = angularVelocity.x;
            Velocity.angular[eid][1] = angularVelocity.y;
            Velocity.angular[eid][2] = angularVelocity.z;
          }

          // Get scaled angular velocity for this frame
          const deltaAngular = getVector().copy(angularVelocity).multiplyScalar(deltaTime);

          // Create rotation quaternion from angular velocity
          const rotationDelta = getQuaternion().setFromAxisAngle(
            deltaAngular.normalize(),
            deltaAngular.length(),
          );

          // Get current rotation
          const currentQuat = getQuaternion().set(
            Transform.rotation[eid][0],
            Transform.rotation[eid][1],
            Transform.rotation[eid][2],
            Transform.rotation[eid][3],
          );

          // Apply rotation and normalize to prevent accumulated errors
          currentQuat.premultiply(rotationDelta).normalize();

          // Update the transform rotation
          Transform.rotation[eid][0] = currentQuat.x;
          Transform.rotation[eid][1] = currentQuat.y;
          Transform.rotation[eid][2] = currentQuat.z;
          Transform.rotation[eid][3] = currentQuat.w;

          needsUpdate = true;
        }

        // Only mark for update if needed
        if (needsUpdate) {
          Transform.needsUpdate[eid] = 1;
          processedCount++;
        }
      }
    }

    return processedCount;
  } catch (error) {
    console.error('Error in velocity system:', error);
    return 0;
  }
}
