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
  const entities = physicsQuery(world);

  // For each entity with both Transform and PhysicsBodyRef
  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i];

    // Get the body reference
    const bodyId = PhysicsBodyRef.bodyId[eid];
    const body = bodyRefs.get(bodyId);

    if (!body) continue;

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
      // This approach would be refined based on how you're using @react-three/rapier
      body.setTranslation(tempPosition, true);
      body.setRotation(tempQuaternion, true);
    } else {
      // If dynamic, update Transform from physics
      // Get position and rotation from the physics body
      const position = body.translation();
      const rotation = body.rotation();

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
  }

  return entities.length;
}

/**
 * Helper to register a physics body with an entity
 *
 * @param entity The ECS entity ID
 * @param body The physics body reference
 */
export function registerPhysicsBody(entity: number, body: PhysicsBody) {
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
}

/**
 * Helper to unregister a physics body
 *
 * @param entity The ECS entity ID
 */
export function unregisterPhysicsBody(entity: number) {
  const bodyId = PhysicsBodyRef.bodyId[entity];

  if (bodyId) {
    bodyRefs.delete(bodyId);
  }
}
