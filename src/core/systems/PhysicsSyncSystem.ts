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
});

// Define the type for our physics body references
// This is a simplified approach - in a real implementation,
// we might use the actual Rapier types more directly
type PhysicsBody = {
  handle: number;
  isKinematic: boolean;
  translation: () => { x: number; y: number; z: number };
  rotation: () => { x: number; y: number; z: number; w: number };
  setTranslation: (position: Vector3, wakeUp?: boolean) => void;
  setRotation: (rotation: Quaternion, wakeUp?: boolean) => void;
};

// Map to store references to physics bodies
export const bodyRefs = new Map<number, PhysicsBody>();

// Query for entities with both Transform and PhysicsBodyRef components
export const physicsQuery = defineQuery([Transform, PhysicsBodyRef]);

// Temporary objects to avoid allocations in the update loop
const tempPosition = new Vector3();
const tempQuaternion = new Quaternion();

/**
 * System to synchronize physics bodies with ECS Transform components
 *
 * @param _ Time since last frame (unused)
 */
export function runPhysicsSyncSystem(_: number) {
  try {
    const entities = physicsQuery(world);

    // For each entity with both Transform and PhysicsBodyRef
    for (let i = 0; i < entities.length; i++) {
      const eid = entities[i];

      // Get the body reference
      const bodyId = PhysicsBodyRef.bodyId[eid];
      const body = bodyRefs.get(bodyId);

      // Skip if the body reference is missing or invalid
      if (!body) {
        // Clean up invalid reference
        unregisterPhysicsBody(eid);
        console.warn(`Physics body reference missing for entity ${eid}, removing reference`);
        continue;
      }

      // Additional safety checks for required methods
      if (typeof body.setTranslation !== 'function' || typeof body.setRotation !== 'function') {
        console.warn(`Physics body for entity ${eid} has invalid methods, skipping sync`);
        continue;
      }

      try {
        // Check if Transform needs update from physics
        if (body.isKinematic) {
          // If kinematic, update physics from Transform
          tempPosition.set(
            Transform.position[eid][0],
            Transform.position[eid][1],
            Transform.position[eid][2],
          );

          tempQuaternion.set(
            Transform.rotation[eid][0],
            Transform.rotation[eid][1],
            Transform.rotation[eid][2],
            Transform.rotation[eid][3],
          );

          // Update the physical body position and rotation
          // Wrap in try-catch to handle potential errors
          try {
            body.setTranslation(tempPosition, true);
            body.setRotation(tempQuaternion, true);
          } catch (error) {
            console.error(`Error updating physics body for entity ${eid}:`, error);
            // Clean up the invalid body reference
            unregisterPhysicsBody(eid);
          }
        } else {
          // If dynamic, update Transform from physics
          // Wrap in try-catch to handle potential errors
          let position, rotation;
          try {
            position = body.translation();
            rotation = body.rotation();
          } catch (error) {
            console.error(`Error reading physics body for entity ${eid}:`, error);
            // Clean up the invalid body reference
            unregisterPhysicsBody(eid);
            continue;
          }

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
        }
      } catch (error) {
        console.error(`Unexpected error in physics sync for entity ${eid}:`, error);
        // Clean up on error
        unregisterPhysicsBody(eid);
      }
    }

    return entities.length;
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
 */
export function registerPhysicsBody(entity: number, body: PhysicsBody) {
  try {
    // Validate the body object
    if (!body) {
      console.warn('Attempted to register null physics body');
      return entity;
    }

    // Check for required methods
    if (typeof body.setTranslation !== 'function' || typeof body.setRotation !== 'function') {
      console.warn('Physics body is missing required methods');
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
