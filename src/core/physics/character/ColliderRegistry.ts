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
 * Global collider registry singleton
 * Tracks all entity physics handles for reliable lookup
 */
class ColliderRegistry {
  /** Map of entity ID to physics references */
  private readonly entityPhysicsMap = new Map<number, IEntityPhysicsRefs>();

  /**
   * Register physics handles for an entity
   * @param entityId - Entity identifier
   * @param refs - Physics references (rigid body and colliders)
   */
  register(entityId: number, refs: IEntityPhysicsRefs): void {
    this.entityPhysicsMap.set(entityId, refs);

    logger.debug('Registered entity physics', {
      entityId,
      hasRigidBody: !!refs.rigidBody,
      colliderCount: refs.colliders.length,
    });
  }

  /**
   * Unregister physics handles for an entity
   * @param entityId - Entity identifier
   */
  unregister(entityId: number): void {
    const existed = this.entityPhysicsMap.delete(entityId);

    if (existed) {
      logger.debug('Unregistered entity physics', { entityId });
    }
  }

  /**
   * Get the primary collider for an entity
   * Returns the first collider if multiple exist
   * @param entityId - Entity identifier
   * @returns Collider handle or null if not found
   */
  getCollider(entityId: number): Collider | null {
    const refs = this.entityPhysicsMap.get(entityId);
    return refs?.colliders[0] ?? null;
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

    if (count > 0) {
      logger.debug('Cleared collider registry', { clearedCount: count });
    }
  }

  /**
   * Get total number of registered entities
   * @returns Count of entities with physics
   */
  size(): number {
    return this.entityPhysicsMap.size;
  }
}

/**
 * Global collider registry instance
 * Import this to access the registry from anywhere
 */
export const colliderRegistry = new ColliderRegistry();
