/**
 * PhysicsEventsAPI - Collision and trigger event subscription for scripts
 * Provides onCollisionEnter/Exit and onTriggerEnter/Exit callbacks
 */

import { Logger } from '@/core/lib/logger';
import type { EntityId } from '@/core/lib/ecs/types';

const logger = Logger.create('PhysicsEventsAPI');

/**
 * Physics event types
 */
export type PhysicsEventType = 'collisionEnter' | 'collisionExit' | 'triggerEnter' | 'triggerExit';

/**
 * Event handler callback type
 */
export type PhysicsEventHandler = (otherEntityId: number) => void;

/**
 * Store for event subscriptions per entity
 * Structure: Map<entityId, Map<eventType, Set<handler>>>
 */
const eventSubscriptions = new Map<EntityId, Map<PhysicsEventType, Set<PhysicsEventHandler>>>();

/**
 * Subscribe to a physics event for an entity
 */
function subscribeToEvent(
  entityId: EntityId,
  eventType: PhysicsEventType,
  handler: PhysicsEventHandler,
): () => void {
  // Get or create entity's event map
  let entityEvents = eventSubscriptions.get(entityId);
  if (!entityEvents) {
    entityEvents = new Map();
    eventSubscriptions.set(entityId, entityEvents);
  }

  // Get or create handler set for this event type
  let handlers = entityEvents.get(eventType);
  if (!handlers) {
    handlers = new Set();
    entityEvents.set(eventType, handlers);
  }

  // Add handler
  handlers.add(handler);

  logger.debug(`Subscribed to ${eventType} for entity ${entityId}`);

  // Return unsubscribe function
  return () => {
    const entityEvents = eventSubscriptions.get(entityId);
    if (entityEvents) {
      const handlers = entityEvents.get(eventType);
      if (handlers) {
        handlers.delete(handler);

        // Clean up empty sets
        if (handlers.size === 0) {
          entityEvents.delete(eventType);
        }
      }

      // Clean up empty entity maps
      if (entityEvents.size === 0) {
        eventSubscriptions.delete(entityId);
      }
    }

    logger.debug(`Unsubscribed from ${eventType} for entity ${entityId}`);
  };
}

/**
 * Dispatch a physics event to all subscribed handlers
 * Called by the physics system when collisions/triggers occur
 */
export function dispatchPhysicsEvent(
  entityId: EntityId,
  eventType: PhysicsEventType,
  otherEntityId: number,
): void {
  const entityEvents = eventSubscriptions.get(entityId);
  if (!entityEvents) return;

  const handlers = entityEvents.get(eventType);
  if (!handlers) return;

  // Call all handlers
  for (const handler of handlers) {
    try {
      handler(otherEntityId);
    } catch (error) {
      logger.error(`Error in ${eventType} handler for entity ${entityId}:`, error);
    }
  }
}

/**
 * Clean up all event subscriptions for an entity
 * Should be called when entity is destroyed
 */
export function cleanupPhysicsEventsAPI(entityId: EntityId): void {
  eventSubscriptions.delete(entityId);
  logger.debug(`Cleaned up physics events for entity ${entityId}`);
}

/**
 * Create physics events API for an entity
 */
export interface IPhysicsEventsAPI {
  onCollisionEnter(cb: (otherEntityId: number) => void): () => void;
  onCollisionExit(cb: (otherEntityId: number) => void): () => void;
  onTriggerEnter(cb: (otherEntityId: number) => void): () => void;
  onTriggerExit(cb: (otherEntityId: number) => void): () => void;
}

export function createPhysicsEventsAPI(entityId: EntityId): IPhysicsEventsAPI {
  return {
    onCollisionEnter(cb: (otherEntityId: number) => void): () => void {
      return subscribeToEvent(entityId, 'collisionEnter', cb);
    },

    onCollisionExit(cb: (otherEntityId: number) => void): () => void {
      return subscribeToEvent(entityId, 'collisionExit', cb);
    },

    onTriggerEnter(cb: (otherEntityId: number) => void): () => void {
      return subscribeToEvent(entityId, 'triggerEnter', cb);
    },

    onTriggerExit(cb: (otherEntityId: number) => void): () => void {
      return subscribeToEvent(entityId, 'triggerExit', cb);
    },
  };
}
