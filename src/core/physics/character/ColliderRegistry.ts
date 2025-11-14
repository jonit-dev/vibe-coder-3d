/**
 * Collider Registry
 * Maps entity IDs to their Rapier physics handles (rigid bodies and colliders)
 * Provides reliable lookup for character controller and other physics systems
 */

import type { RigidBody, Collider } from '@dimforge/rapier3d-compat';
import { Logger } from '@core/lib/logger';
import type { IEntityPhysicsRefs } from './types';

const logger = Logger.create('ColliderRegistry');

/**
 * Diagnostic counters for tracking registration lifecycle
 */
interface IRegistryDiagnostics {
  totalRegistrations: number;
  totalUnregistrations: number;
  dropouts: number; // Failed lookups for entities that were expected to exist
  registrationTimestamps: Map<number, number>; // Track when each entity was registered
  lastDropoutEntity?: number;
  lastDropoutTime?: number;
}

/**
 * Global collider registry singleton
 * Tracks all entity physics handles for reliable lookup
 */
class ColliderRegistry {
  /** Map of entity ID to physics references */
  private readonly entityPhysicsMap = new Map<number, IEntityPhysicsRefs>();

  /** Diagnostic data for tracking registration lifecycle */
  private readonly diagnostics: IRegistryDiagnostics = {
    totalRegistrations: 0,
    totalUnregistrations: 0,
    dropouts: 0,
    registrationTimestamps: new Map(),
  };

  /**
   * Register physics handles for an entity
   * @param entityId - Entity identifier
   * @param refs - Physics references (rigid body and colliders)
   */
  register(entityId: number, refs: IEntityPhysicsRefs): void {
    const wasAlreadyRegistered = this.entityPhysicsMap.has(entityId);
    this.entityPhysicsMap.set(entityId, refs);

    // Update diagnostics
    this.diagnostics.totalRegistrations++;
    this.diagnostics.registrationTimestamps.set(entityId, Date.now());

    logger.debug('Registered entity physics', {
      entityId,
      hasRigidBody: !!refs.rigidBody,
      colliderCount: refs.colliders.length,
      reregistration: wasAlreadyRegistered,
      timestamp: Date.now(),
    });
  }

  /**
   * Unregister physics handles for an entity
   * @param entityId - Entity identifier
   */
  unregister(entityId: number): void {
    const existed = this.entityPhysicsMap.delete(entityId);

    if (existed) {
      // Update diagnostics
      this.diagnostics.totalUnregistrations++;
      this.diagnostics.registrationTimestamps.delete(entityId);

      logger.debug('Unregistered entity physics', {
        entityId,
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Get the primary collider for an entity
   * Returns the first collider if multiple exist
   * @param entityId - Entity identifier
   * @param expectToExist - If true, logs a dropout when not found
   * @returns Collider handle or null if not found
   */
  getCollider(entityId: number, expectToExist = false): Collider | null {
    const refs = this.entityPhysicsMap.get(entityId);
    const collider = refs?.colliders[0] ?? null;

    // Track dropouts when we expect physics to exist but it doesn't
    if (expectToExist && !collider) {
      this.diagnostics.dropouts++;
      this.diagnostics.lastDropoutEntity = entityId;
      this.diagnostics.lastDropoutTime = Date.now();

      logger.warn('Entity dropout detected', {
        entityId,
        reason: 'No collider found for entity',
        registeredCount: this.entityPhysicsMap.size,
        totalDropouts: this.diagnostics.dropouts,
      });
    }

    return collider;
  }

  /**
   * Get all colliders for an entity
   * @param entityId - Entity identifier
   * @returns Array of collider handles (empty if none)
   */
  getColliders(entityId: number): Collider[] {
    const refs = this.entityPhysicsMap.get(entityId);
    return refs?.colliders ?? [];
  }

  /**
   * Get the rigid body for an entity
   * @param entityId - Entity identifier
   * @returns RigidBody handle or null if not found
   */
  getRigidBody(entityId: number): RigidBody | null {
    const refs = this.entityPhysicsMap.get(entityId);
    return refs?.rigidBody ?? null;
  }

  /**
   * Check if entity has physics registered
   * @param entityId - Entity identifier
   * @returns True if entity has any physics handles
   */
  hasPhysics(entityId: number): boolean {
    return this.entityPhysicsMap.has(entityId);
  }

  /**
   * Get complete physics references for an entity
   * @param entityId - Entity identifier
   * @returns Physics references or null if not found
   */
  getPhysicsRefs(entityId: number): IEntityPhysicsRefs | null {
    return this.entityPhysicsMap.get(entityId) ?? null;
  }

  /**
   * Clear all registered physics handles
   * Used during scene cleanup or play mode stop
   */
  clear(): void {
    const count = this.entityPhysicsMap.size;
    this.entityPhysicsMap.clear();

    // Reset diagnostic timestamps but keep counters for analysis
    this.diagnostics.registrationTimestamps.clear();

    if (count > 0) {
      logger.debug('Cleared collider registry', {
        clearedCount: count,
        totalRegistrations: this.diagnostics.totalRegistrations,
        totalUnregistrations: this.diagnostics.totalUnregistrations,
        totalDropouts: this.diagnostics.dropouts,
      });
    }
  }

  /**
   * Get total number of registered entities
   * @returns Count of entities with physics
   */
  size(): number {
    return this.entityPhysicsMap.size;
  }

  /**
   * Get all currently registered entity IDs
   * @returns Array of entity IDs with physics handles
   */
  getRegisteredEntityIds(): number[] {
    return Array.from(this.entityPhysicsMap.keys());
  }

  /**
   * Get diagnostic information about the registry
   * @returns Diagnostic data including registration counts and dropouts
   */
  getDiagnostics(): Readonly<IRegistryDiagnostics> {
    return {
      ...this.diagnostics,
      registrationTimestamps: new Map(this.diagnostics.registrationTimestamps),
    };
  }

  /**
   * Log a comprehensive health report of the registry
   * Useful for debugging registration timing issues
   */
  logHealthReport(): void {
    const registeredIds = this.getRegisteredEntityIds();
    const now = Date.now();

    logger.debug('ColliderRegistry Health Report', {
      currentlyRegistered: registeredIds.length,
      registeredEntityIds: registeredIds,
      totalRegistrations: this.diagnostics.totalRegistrations,
      totalUnregistrations: this.diagnostics.totalUnregistrations,
      totalDropouts: this.diagnostics.dropouts,
      lastDropoutEntity: this.diagnostics.lastDropoutEntity,
      lastDropoutTimeAgo: this.diagnostics.lastDropoutTime
        ? `${now - this.diagnostics.lastDropoutTime}ms ago`
        : 'never',
    });
  }

  /**
   * Reset diagnostic counters (for testing or debugging)
   */
  resetDiagnostics(): void {
    this.diagnostics.totalRegistrations = 0;
    this.diagnostics.totalUnregistrations = 0;
    this.diagnostics.dropouts = 0;
    this.diagnostics.lastDropoutEntity = undefined;
    this.diagnostics.lastDropoutTime = undefined;

    logger.debug('Reset registry diagnostics');
  }
}

/**
 * Global collider registry instance
 * Import this to access the registry from anywhere
 */
export const colliderRegistry = new ColliderRegistry();
