import { useFrame } from '@react-three/fiber';
import { useRapier } from '@react-three/rapier';
import { EventQueue } from '@dimforge/rapier3d-compat';
import { useRef } from 'react';

import { Logger } from '../lib/logger';

const logger = Logger.create('useCollisionEvents');

export type CollisionCallback = (entityA: number, entityB: number, started: boolean) => void;

export type SensorCallback = (entityA: number, entityB: number, overlapping: boolean) => void;

/**
 * Hook for subscribing to physics collision events
 * Uses Rapier's EventQueue to poll for collision events each frame
 */
export function useCollisionEvents(options: {
  onCollisionEnter?: CollisionCallback;
  onCollisionExit?: CollisionCallback;
  onSensorEnter?: SensorCallback;
  onSensorExit?: SensorCallback;
}) {
  const { world } = useRapier();
  const eventQueue = useRef<EventQueue | null>(null);

  // Initialize event queue once
  if (!eventQueue.current) {
    eventQueue.current = new EventQueue(false);
  }

  useFrame(() => {
    if (!eventQueue.current) return;

    // Drain collision events from the queue
    eventQueue.current.drainCollisionEvents((handle1, handle2, started) => {
      try {
        // Get colliders from handles
        const collider1 = world.getCollider(handle1);
        const collider2 = world.getCollider(handle2);

        if (!collider1 || !collider2) return;

        // Extract entity IDs from collider userData
        const entityA =
          ((collider1 as unknown as { userData?: { entityId?: number } }).userData
            ?.entityId as number | undefined) ?? -1;
        const entityB =
          ((collider2 as unknown as { userData?: { entityId?: number } }).userData
            ?.entityId as number | undefined) ?? -1;

        // Check if this is a sensor collision
        const isSensor = collider1.isSensor() || collider2.isSensor();

        if (isSensor) {
          // Verify intersection for sensors
          const isIntersecting = world.intersectionPair(collider1, collider2);

          if (started && isIntersecting) {
            options.onSensorEnter?.(entityA, entityB, true);
          } else if (!started) {
            options.onSensorExit?.(entityA, entityB, false);
          }
        } else {
          // Regular collision
          if (started) {
            options.onCollisionEnter?.(entityA, entityB, true);
          } else {
            options.onCollisionExit?.(entityA, entityB, false);
          }
        }
      } catch (error) {
        logger.error('Error processing collision event', { error });
      }
    });
  });
}
