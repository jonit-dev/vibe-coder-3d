import { useRapier } from '@react-three/rapier';
import { useEffect, useRef } from 'react';

export type CollisionCallback = (entityA: number, entityB: number, started: boolean) => void;

export type SensorCallback = (entityA: number, entityB: number, overlapping: boolean) => void;

// Define types for Rapier events based on observation
interface RapierEventPair {
  collider1: { userData?: { entityId?: number } };
  collider2: { userData?: { entityId?: number } };
}

interface RapierEvent {
  pairs: RapierEventPair[];
}

/**
 * Hook for subscribing to physics collision events
 */
export function useCollisionEvents(options: {
  onCollisionEnter?: CollisionCallback;
  onCollisionExit?: CollisionCallback;
  onSensorEnter?: SensorCallback;
  onSensorExit?: SensorCallback;
}) {
  const { world } = useRapier();
  const initialized = useRef(false);

  useEffect(() => {
    if (!world || initialized.current) return;

    // Setup event listeners for the Rapier physics world
    // Using any type temporarily since Rapier's TypeScript types might not fully expose event system
    // @ts-expect-error - Rapier's world.on might not be in types but exists at runtime
    const unsubscribeCollisionEnter = world.on('collisionStart', (event: RapierEvent) => {
      if (!options.onCollisionEnter) return;

      event.pairs.forEach((pair: RapierEventPair) => {
        // Get entity IDs from Rapier colliders (assuming they're stored in userData)
        const entityA = pair.collider1.userData?.entityId ?? -1;
        const entityB = pair.collider2.userData?.entityId ?? -1;

        options.onCollisionEnter?.(entityA, entityB, true);
      });
    });

    // @ts-expect-error - Rapier's world.on might not be in types but exists at runtime
    const unsubscribeCollisionExit = world.on('collisionEnd', (event: RapierEvent) => {
      if (!options.onCollisionExit) return;

      event.pairs.forEach((pair: RapierEventPair) => {
        const entityA = pair.collider1.userData?.entityId ?? -1;
        const entityB = pair.collider2.userData?.entityId ?? -1;

        options.onCollisionExit?.(entityA, entityB, false);
      });
    });

    // @ts-expect-error - Rapier's world.on might not be in types but exists at runtime
    const unsubscribeSensorEnter = world.on('sensorStart', (event: RapierEvent) => {
      if (!options.onSensorEnter) return;

      event.pairs.forEach((pair: RapierEventPair) => {
        const entityA = pair.collider1.userData?.entityId ?? -1;
        const entityB = pair.collider2.userData?.entityId ?? -1;

        options.onSensorEnter?.(entityA, entityB, true);
      });
    });

    // @ts-expect-error - Rapier's world.on might not be in types but exists at runtime
    const unsubscribeSensorExit = world.on('sensorEnd', (event: RapierEvent) => {
      if (!options.onSensorExit) return;

      event.pairs.forEach((pair: RapierEventPair) => {
        const entityA = pair.collider1.userData?.entityId ?? -1;
        const entityB = pair.collider2.userData?.entityId ?? -1;

        options.onSensorExit?.(entityA, entityB, false);
      });
    });

    initialized.current = true;

    // Clean up event listeners when component unmounts
    return () => {
      if (unsubscribeCollisionEnter) unsubscribeCollisionEnter();
      if (unsubscribeCollisionExit) unsubscribeCollisionExit();
      if (unsubscribeSensorEnter) unsubscribeSensorEnter();
      if (unsubscribeSensorExit) unsubscribeSensorExit();
      initialized.current = false;
    };
  }, [world, options]); // Re-run if options change
}
