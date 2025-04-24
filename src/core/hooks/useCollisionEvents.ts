import { useRapier } from '@react-three/rapier';
import { useEffect, useRef } from 'react';

export type CollisionCallback = (entityA: number, entityB: number, started: boolean) => void;

export type SensorCallback = (entityA: number, entityB: number, overlapping: boolean) => void;

// Define types for Rapier events based on observation
interface IRapierEventPair {
  collider1: { userData?: { entityId?: number } };
  collider2: { userData?: { entityId?: number } };
}

interface IRapierEvent {
  pairs: IRapierEventPair[];
}

// Extended world type to include events which are not in the TypeScript definitions
interface IEventedRapierWorld {
  on: (event: string, callback: (event: IRapierEvent) => void) => () => void;
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
  const { world, rapier } = useRapier();
  const initialized = useRef(false);

  useEffect(() => {
    if (!world || initialized.current) return;

    // Some versions of Rapier may not have the event system initialized yet
    // or may use a different approach to event handling
    if (typeof (world as any).on !== 'function') {
      console.warn('Rapier world.on event function not available. Collision events will not work.');
      return;
    }

    // Cast world to our extended interface that includes the event methods
    const eventWorld = world as unknown as IEventedRapierWorld;

    // Setup event listeners for the Rapier physics world
    let unsubscribeCollisionEnter: (() => void) | null = null;
    let unsubscribeCollisionExit: (() => void) | null = null;
    let unsubscribeSensorEnter: (() => void) | null = null;
    let unsubscribeSensorExit: (() => void) | null = null;

    try {
      if (options.onCollisionEnter) {
        unsubscribeCollisionEnter = eventWorld.on('collisionStart', (event: IRapierEvent) => {
          event.pairs.forEach((pair: IRapierEventPair) => {
            // Get entity IDs from Rapier colliders (assuming they're stored in userData)
            const entityA = pair.collider1?.userData?.entityId ?? -1;
            const entityB = pair.collider2?.userData?.entityId ?? -1;

            options.onCollisionEnter?.(entityA, entityB, true);
          });
        });
      }

      if (options.onCollisionExit) {
        unsubscribeCollisionExit = eventWorld.on('collisionEnd', (event: IRapierEvent) => {
          event.pairs.forEach((pair: IRapierEventPair) => {
            const entityA = pair.collider1?.userData?.entityId ?? -1;
            const entityB = pair.collider2?.userData?.entityId ?? -1;

            options.onCollisionExit?.(entityA, entityB, false);
          });
        });
      }

      if (options.onSensorEnter) {
        unsubscribeSensorEnter = eventWorld.on('sensorStart', (event: IRapierEvent) => {
          event.pairs.forEach((pair: IRapierEventPair) => {
            const entityA = pair.collider1?.userData?.entityId ?? -1;
            const entityB = pair.collider2?.userData?.entityId ?? -1;

            options.onSensorEnter?.(entityA, entityB, true);
          });
        });
      }

      if (options.onSensorExit) {
        unsubscribeSensorExit = eventWorld.on('sensorEnd', (event: IRapierEvent) => {
          event.pairs.forEach((pair: IRapierEventPair) => {
            const entityA = pair.collider1?.userData?.entityId ?? -1;
            const entityB = pair.collider2?.userData?.entityId ?? -1;

            options.onSensorExit?.(entityA, entityB, false);
          });
        });
      }

      initialized.current = true;
    } catch (error) {
      console.error('Error setting up Rapier collision events:', error);
    }

    // Clean up event listeners when component unmounts
    return () => {
      try {
        if (unsubscribeCollisionEnter) unsubscribeCollisionEnter();
        if (unsubscribeCollisionExit) unsubscribeCollisionExit();
        if (unsubscribeSensorEnter) unsubscribeSensorEnter();
        if (unsubscribeSensorExit) unsubscribeSensorExit();
      } catch (error) {
        console.error('Error cleaning up Rapier collision events:', error);
      }
      initialized.current = false;
    };
  }, [world, options, rapier]); // Re-run if options or rapier world change
}
