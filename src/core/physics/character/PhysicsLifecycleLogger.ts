/**
 * Physics Lifecycle Logger
 * Tracks component addition/removal events for physics-related components
 * Used for debugging registration timing issues and dropout detection
 */

import { Logger } from '@core/lib/logger';
import { on, off } from '@core/lib/events';
import { KnownComponentTypes } from '@core/lib/ecs/IComponent';

const logger = Logger.create('PhysicsLifecycleLogger');

/**
 * Component types we track for physics lifecycle
 */
const TRACKED_COMPONENTS = [
  KnownComponentTypes.RIGID_BODY,
  KnownComponentTypes.MESH_COLLIDER,
  KnownComponentTypes.CHARACTER_CONTROLLER,
] as const;

/**
 * Lifecycle event tracking
 */
interface ILifecycleEvent {
  entityId: number;
  componentId: string;
  timestamp: number;
  eventType: 'added' | 'removed';
  data?: unknown;
}

/**
 * Global lifecycle event history
 */
const lifecycleHistory: ILifecycleEvent[] = [];
const MAX_HISTORY_SIZE = 1000;

/**
 * Handler for component:added events
 */
function handleComponentAdded(event: { entityId: number; componentId: string; data: unknown }): void {
  // Only track physics-related components
  if (!TRACKED_COMPONENTS.includes(event.componentId as typeof TRACKED_COMPONENTS[number])) {
    return;
  }

  const lifecycleEvent: ILifecycleEvent = {
    entityId: event.entityId,
    componentId: event.componentId,
    timestamp: Date.now(),
    eventType: 'added',
    data: event.data,
  };

  // Add to history
  lifecycleHistory.push(lifecycleEvent);
  if (lifecycleHistory.length > MAX_HISTORY_SIZE) {
    lifecycleHistory.shift();
  }

  logger.debug('Physics component added', {
    entityId: event.entityId,
    componentType: event.componentId,
    timestamp: lifecycleEvent.timestamp,
  });
}

/**
 * Handler for component:removed events
 */
function handleComponentRemoved(event: { entityId: number; componentId: string }): void {
  // Only track physics-related components
  if (!TRACKED_COMPONENTS.includes(event.componentId as typeof TRACKED_COMPONENTS[number])) {
    return;
  }

  const lifecycleEvent: ILifecycleEvent = {
    entityId: event.entityId,
    componentId: event.componentId,
    timestamp: Date.now(),
    eventType: 'removed',
  };

  // Add to history
  lifecycleHistory.push(lifecycleEvent);
  if (lifecycleHistory.length > MAX_HISTORY_SIZE) {
    lifecycleHistory.shift();
  }

  logger.debug('Physics component removed', {
    entityId: event.entityId,
    componentType: event.componentId,
    timestamp: lifecycleEvent.timestamp,
  });
}

/**
 * Start tracking physics component lifecycle events
 */
export function startPhysicsLifecycleLogging(): void {
  on('component:added', handleComponentAdded);
  on('component:removed', handleComponentRemoved);

  logger.info('Physics lifecycle logging started', {
    trackedComponents: TRACKED_COMPONENTS,
  });
}

/**
 * Stop tracking physics component lifecycle events
 */
export function stopPhysicsLifecycleLogging(): void {
  off('component:added', handleComponentAdded);
  off('component:removed', handleComponentRemoved);

  logger.info('Physics lifecycle logging stopped');
}

/**
 * Get lifecycle history for a specific entity
 * @param entityId - Entity to get history for
 * @returns Array of lifecycle events for the entity
 */
export function getEntityLifecycleHistory(entityId: number): ILifecycleEvent[] {
  return lifecycleHistory.filter((event) => event.entityId === entityId);
}

/**
 * Get recent lifecycle events (last N events)
 * @param count - Number of recent events to retrieve
 * @returns Array of recent lifecycle events
 */
export function getRecentLifecycleEvents(count = 50): ILifecycleEvent[] {
  return lifecycleHistory.slice(-count);
}

/**
 * Log a comprehensive lifecycle report for an entity
 * Shows the timeline of component additions/removals
 * @param entityId - Entity to report on
 */
export function logEntityLifecycleReport(entityId: number): void {
  const events = getEntityLifecycleHistory(entityId);

  if (events.length === 0) {
    logger.info('No lifecycle events for entity', { entityId });
    return;
  }

  const timeline = events.map((event) => ({
    componentType: event.componentId,
    eventType: event.eventType,
    timestamp: event.timestamp,
    relativeTime: events[0] ? `+${event.timestamp - events[0].timestamp}ms` : '0ms',
  }));

  logger.info('Entity lifecycle timeline', {
    entityId,
    eventCount: events.length,
    timeline,
  });
}

/**
 * Check for potential timing issues in entity lifecycle
 * Detects cases where CharacterController is added before physics components
 * @param entityId - Entity to check
 * @returns Warning messages if timing issues detected
 */
export function checkLifecycleTimingIssues(entityId: number): string[] {
  const events = getEntityLifecycleHistory(entityId);
  const warnings: string[] = [];

  let characterControllerAddTime: number | null = null;
  let rigidBodyAddTime: number | null = null;
  let colliderAddTime: number | null = null;

  for (const event of events) {
    if (event.eventType === 'added') {
      if (event.componentId === KnownComponentTypes.CHARACTER_CONTROLLER) {
        characterControllerAddTime = event.timestamp;
      } else if (event.componentId === KnownComponentTypes.RIGID_BODY) {
        rigidBodyAddTime = event.timestamp;
      } else if (event.componentId === KnownComponentTypes.MESH_COLLIDER) {
        colliderAddTime = event.timestamp;
      }
    }
  }

  // Check if CharacterController was added before physics components
  if (characterControllerAddTime !== null) {
    if (rigidBodyAddTime === null) {
      warnings.push('CharacterController added but no RigidBody component found');
    } else if (characterControllerAddTime < rigidBodyAddTime) {
      warnings.push(
        `CharacterController added ${rigidBodyAddTime - characterControllerAddTime}ms before RigidBody`,
      );
    }

    if (colliderAddTime === null) {
      warnings.push('CharacterController added but no MeshCollider component found');
    } else if (characterControllerAddTime < colliderAddTime) {
      warnings.push(
        `CharacterController added ${colliderAddTime - characterControllerAddTime}ms before MeshCollider`,
      );
    }
  }

  return warnings;
}

/**
 * Clear lifecycle history (for testing or debugging)
 */
export function clearLifecycleHistory(): void {
  lifecycleHistory.length = 0;
  logger.debug('Lifecycle history cleared');
}
