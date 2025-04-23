// Velocity System - Updates entity positions based on velocity
import { Quaternion, Vector3 } from 'three';

import { Transform, Velocity, velocityQuery, world } from '@core/lib/ecs';

// Temporary vectors to avoid garbage collection
const linearVelocity = new Vector3();
const angularVelocity = new Vector3();
const tempQuat = new Quaternion();

/**
 * System that applies velocity to transform positions
 *
 * @param deltaTime Time since last frame in seconds
 * @returns Number of entities processed
 */
export function runVelocitySystem(deltaTime: number): number {
  try {
    // Find all entities with Transform and Velocity components
    const entities = velocityQuery(world);

    for (let i = 0; i < entities.length; i++) {
      const eid = entities[i];

      // Get linear velocity
      linearVelocity.set(Velocity.linear[eid][0], Velocity.linear[eid][1], Velocity.linear[eid][2]);

      // Skip if velocity is zero
      if (linearVelocity.lengthSq() > 0.00001) {
        // Apply linear damping
        const linearDamping = Velocity.linearDamping[eid];
        if (linearDamping > 0) {
          linearVelocity.multiplyScalar(Math.pow(1 - linearDamping, deltaTime));

          // Update the component values
          Velocity.linear[eid][0] = linearVelocity.x;
          Velocity.linear[eid][1] = linearVelocity.y;
          Velocity.linear[eid][2] = linearVelocity.z;
        }

        // Scale by delta time
        linearVelocity.multiplyScalar(deltaTime);

        // Apply to position
        Transform.position[eid][0] += linearVelocity.x;
        Transform.position[eid][1] += linearVelocity.y;
        Transform.position[eid][2] += linearVelocity.z;

        // Mark for update
        Transform.needsUpdate[eid] = 1;
      }

      // Get angular velocity
      angularVelocity.set(
        Velocity.angular[eid][0],
        Velocity.angular[eid][1],
        Velocity.angular[eid][2],
      );

      // Skip if angular velocity is zero
      if (angularVelocity.lengthSq() > 0.00001) {
        // Apply angular damping
        const angularDamping = Velocity.angularDamping[eid];
        if (angularDamping > 0) {
          angularVelocity.multiplyScalar(Math.pow(1 - angularDamping, deltaTime));

          // Update the component values
          Velocity.angular[eid][0] = angularVelocity.x;
          Velocity.angular[eid][1] = angularVelocity.y;
          Velocity.angular[eid][2] = angularVelocity.z;
        }

        // Scale by delta time
        angularVelocity.multiplyScalar(deltaTime);

        // Create a rotation quaternion from the angular velocity
        // This is a simplified approach - in a real physics system, we'd use more accurate integration
        tempQuat.setFromAxisAngle(angularVelocity.normalize(), angularVelocity.length());

        // Current rotation
        const currentQuat = new Quaternion(
          Transform.rotation[eid][0],
          Transform.rotation[eid][1],
          Transform.rotation[eid][2],
          Transform.rotation[eid][3],
        );

        // Apply rotation (multiply quaternions)
        currentQuat.premultiply(tempQuat);
        currentQuat.normalize(); // Normalize to prevent floating point errors accumulating

        // Update the transform rotation
        Transform.rotation[eid][0] = currentQuat.x;
        Transform.rotation[eid][1] = currentQuat.y;
        Transform.rotation[eid][2] = currentQuat.z;
        Transform.rotation[eid][3] = currentQuat.w;

        // Mark for update
        Transform.needsUpdate[eid] = 1;
      }
    }

    return entities.length;
  } catch (error) {
    console.error('Error in velocity system:', error);
    return 0;
  }
}
