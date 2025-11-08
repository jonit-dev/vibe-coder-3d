/**
 * Character Controller Golden Signals
 * Tracks and validates expected system state during play mode
 * Helps detect when entities drop out of physics/input handling
 */

import { Logger } from '../lib/logger';
import { colliderRegistry } from '../physics/character/ColliderRegistry';
import { componentRegistry } from '../lib/ecs/ComponentRegistry';
import { KnownComponentTypes } from '../lib/ecs/IComponent';
import type { ICharacterControllerData } from '../lib/ecs/components/accessors/types';

const logger = Logger.create('CharacterControllerGoldenSignals');

/**
 * Golden signal snapshot - captures expected state at a point in time
 */
export interface IGoldenSignalSnapshot {
  timestamp: number;
  expectedEntities: number[]; // Entities with CharacterController components
  registeredEntities: number[]; // Entities in ColliderRegistry
  missingFromRegistry: number[]; // Expected but not registered
  unexpectedInRegistry: number[]; // Registered but not expected
  enabledControllers: number; // Count of enabled controllers
  autoModeControllers: number; // Count of auto-mode controllers
}

/**
 * Golden signal history for trend analysis
 */
const signalHistory: IGoldenSignalSnapshot[] = [];
const MAX_HISTORY_SIZE = 100;

/**
 * Capture current golden signal snapshot
 */
export function captureGoldenSignals(): IGoldenSignalSnapshot {
  // Get all entities with CharacterController components
  const expectedEntities = componentRegistry.getEntitiesWithComponent(
    KnownComponentTypes.CHARACTER_CONTROLLER,
  );

  // Get all entities currently registered in physics
  const registeredEntities = colliderRegistry.getRegisteredEntityIds();

  // Find mismatches
  const missingFromRegistry = expectedEntities.filter(
    (id) => !registeredEntities.includes(id),
  );
  const unexpectedInRegistry = registeredEntities.filter(
    (id) => !expectedEntities.includes(id),
  );

  // Count enabled and auto-mode controllers
  let enabledControllers = 0;
  let autoModeControllers = 0;

  for (const entityId of expectedEntities) {
    const controllerData = componentRegistry.getComponentData<ICharacterControllerData>(
      entityId,
      KnownComponentTypes.CHARACTER_CONTROLLER,
    );

    if (controllerData?.enabled) {
      enabledControllers++;
      if (controllerData.controlMode === 'auto') {
        autoModeControllers++;
      }
    }
  }

  const snapshot: IGoldenSignalSnapshot = {
    timestamp: Date.now(),
    expectedEntities,
    registeredEntities,
    missingFromRegistry,
    unexpectedInRegistry,
    enabledControllers,
    autoModeControllers,
  };

  // Add to history
  signalHistory.push(snapshot);
  if (signalHistory.length > MAX_HISTORY_SIZE) {
    signalHistory.shift();
  }

  return snapshot;
}

/**
 * Validate golden signals and log warnings if issues detected
 * @returns True if validation passed, false if issues found
 */
export function validateGoldenSignals(): boolean {
  const snapshot = captureGoldenSignals();

  let isValid = true;

  // Check for entities missing from registry
  if (snapshot.missingFromRegistry.length > 0) {
    logger.warn('Entities with CharacterController missing from physics registry', {
      count: snapshot.missingFromRegistry.length,
      entityIds: snapshot.missingFromRegistry,
      suggestion: 'Check physics registration timing in EntityPhysicsBody',
    });
    isValid = false;
  }

  // Check for unexpected entities in registry
  if (snapshot.unexpectedInRegistry.length > 0) {
    logger.debug('Entities in physics registry without CharacterController', {
      count: snapshot.unexpectedInRegistry.length,
      entityIds: snapshot.unexpectedInRegistry,
      note: 'This is normal for non-character physics objects',
    });
  }

  // Log current state
  logger.debug('Golden signals snapshot', {
    timestamp: snapshot.timestamp,
    expectedCount: snapshot.expectedEntities.length,
    registeredCount: snapshot.registeredEntities.length,
    enabledControllers: snapshot.enabledControllers,
    autoModeControllers: snapshot.autoModeControllers,
    validationPassed: isValid,
  });

  return isValid;
}

/**
 * Get golden signal history
 * @param count - Number of recent snapshots to retrieve (default: all)
 */
export function getSignalHistory(count?: number): IGoldenSignalSnapshot[] {
  if (count === undefined) {
    return [...signalHistory];
  }
  return signalHistory.slice(-count);
}

/**
 * Analyze signal history for trends
 * Detects if entities are consistently dropping out
 */
export interface ISignalTrendAnalysis {
  totalSnapshots: number;
  averageMissingFromRegistry: number;
  peakMissingFromRegistry: number;
  consistentlyMissingEntities: number[]; // Entities missing in >50% of snapshots
  recentDropouts: number[]; // Entities that appeared then disappeared
}

export function analyzeSignalTrends(): ISignalTrendAnalysis {
  if (signalHistory.length === 0) {
    return {
      totalSnapshots: 0,
      averageMissingFromRegistry: 0,
      peakMissingFromRegistry: 0,
      consistentlyMissingEntities: [],
      recentDropouts: [],
    };
  }

  // Calculate averages
  const totalMissing = signalHistory.reduce(
    (sum, snap) => sum + snap.missingFromRegistry.length,
    0,
  );
  const averageMissingFromRegistry = totalMissing / signalHistory.length;

  // Find peak
  const peakMissingFromRegistry = Math.max(
    ...signalHistory.map((snap) => snap.missingFromRegistry.length),
  );

  // Find consistently missing entities (>50% of snapshots)
  const entityMissingCount = new Map<number, number>();
  for (const snapshot of signalHistory) {
    for (const entityId of snapshot.missingFromRegistry) {
      entityMissingCount.set(entityId, (entityMissingCount.get(entityId) || 0) + 1);
    }
  }

  const threshold = signalHistory.length * 0.5;
  const consistentlyMissingEntities = Array.from(entityMissingCount.entries())
    .filter(([, count]) => count > threshold)
    .map(([entityId]) => entityId);

  // Detect recent dropouts (registered in earlier snapshots but missing in recent ones)
  const recentDropouts: number[] = [];
  if (signalHistory.length >= 2) {
    const recentSnapshot = signalHistory[signalHistory.length - 1];
    const earlierSnapshot = signalHistory[Math.max(0, signalHistory.length - 10)];

    for (const entityId of earlierSnapshot.registeredEntities) {
      if (
        recentSnapshot.expectedEntities.includes(entityId) &&
        !recentSnapshot.registeredEntities.includes(entityId)
      ) {
        recentDropouts.push(entityId);
      }
    }
  }

  return {
    totalSnapshots: signalHistory.length,
    averageMissingFromRegistry,
    peakMissingFromRegistry,
    consistentlyMissingEntities,
    recentDropouts,
  };
}

/**
 * Log comprehensive trend analysis
 */
export function logTrendAnalysis(): void {
  const analysis = analyzeSignalTrends();

  logger.info('Golden signals trend analysis', analysis);

  if (analysis.consistentlyMissingEntities.length > 0) {
    logger.warn('Entities consistently missing from physics registry', {
      entityIds: analysis.consistentlyMissingEntities,
      occurrenceRate: '>50% of snapshots',
      suggestion: 'These entities likely have registration timing issues',
    });
  }

  if (analysis.recentDropouts.length > 0) {
    logger.warn('Recent physics registration dropouts detected', {
      entityIds: analysis.recentDropouts,
      suggestion: 'These entities were registered but dropped out during play',
    });
  }
}

/**
 * Clear signal history (for testing or when starting new play session)
 */
export function clearSignalHistory(): void {
  signalHistory.length = 0;
  logger.debug('Golden signals history cleared');
}

/**
 * Log comprehensive health report combining multiple diagnostic sources
 */
export function logComprehensiveHealthReport(): void {
  logger.info('=== Character Controller System Health Report ===');

  // Golden signals
  const snapshot = captureGoldenSignals();
  logger.info('Current State', {
    expectedEntities: snapshot.expectedEntities.length,
    registeredEntities: snapshot.registeredEntities.length,
    missingFromRegistry: snapshot.missingFromRegistry.length,
    enabledControllers: snapshot.enabledControllers,
    autoModeControllers: snapshot.autoModeControllers,
  });

  // Trend analysis
  logTrendAnalysis();

  // Registry diagnostics
  colliderRegistry.logHealthReport();

  logger.info('=== End Health Report ===');
}
