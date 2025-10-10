/**
 * PhysicsBindingManager - Wires script physics mutations to Rapier world
 * Must be rendered inside the Physics component from @react-three/rapier
 */

import { usePhysicsBinding } from '@/core/hooks/usePhysicsBinding';
import { useCollisionEvents } from '@/core/hooks/useCollisionEvents';
import { dispatchPhysicsEvent } from '@/core/lib/scripting/apis/PhysicsEventsAPI';
import { componentRegistry } from '@/core/lib/ecs/ComponentRegistry';

export const PhysicsBindingManager: React.FC = () => {
  // This hook processes physics mutations and syncs velocities
  usePhysicsBinding();

  // Wire collision/sensor events to physics events API
  useCollisionEvents({
    onCollisionEnter: (entityA: number, entityB: number) => {
      // Check if entityB has MeshCollider with isTrigger = false
      const colliderData = componentRegistry.getComponentData<any>(entityB, 'MeshCollider');
      if (colliderData?.isTrigger) {
        // This is actually a trigger event, not a collision
        return;
      }

      // Dispatch collision enter to both entities
      dispatchPhysicsEvent(entityA, 'collisionEnter', entityB);
      dispatchPhysicsEvent(entityB, 'collisionEnter', entityA);
    },

    onCollisionExit: (entityA: number, entityB: number) => {
      // Check if entityB has MeshCollider with isTrigger = false
      const colliderData = componentRegistry.getComponentData<any>(entityB, 'MeshCollider');
      if (colliderData?.isTrigger) {
        // This is actually a trigger event, not a collision
        return;
      }

      // Dispatch collision exit to both entities
      dispatchPhysicsEvent(entityA, 'collisionExit', entityB);
      dispatchPhysicsEvent(entityB, 'collisionExit', entityA);
    },

    onSensorEnter: (entityA: number, entityB: number) => {
      // Sensors are triggers in our API
      dispatchPhysicsEvent(entityA, 'triggerEnter', entityB);
      dispatchPhysicsEvent(entityB, 'triggerEnter', entityA);
    },

    onSensorExit: (entityA: number, entityB: number) => {
      // Sensors are triggers in our API
      dispatchPhysicsEvent(entityA, 'triggerExit', entityB);
      dispatchPhysicsEvent(entityB, 'triggerExit', entityA);
    },
  });

  // This component doesn't render anything, it just runs the physics binding hooks
  return null;
};
