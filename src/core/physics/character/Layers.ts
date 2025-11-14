/**
 * Physics Collision Layers
 * Defines collision groups and masks for character controller interactions
 * Centralized configuration prevents layer conflicts and misconfiguration
 */

/**
 * Collision groups using bitflags
 * Each group is a power of 2 to allow bitwise operations
 */
export const CollisionGroups = {
  /** Default collision group (everything not explicitly categorized) */
  DEFAULT: 0x0001,

  /** Character controller colliders */
  CHARACTER: 0x0002,

  /** Static environment (walls, floors, terrain) */
  ENVIRONMENT: 0x0004,

  /** Dynamic physics objects (boxes, ragdolls, etc.) */
  DYNAMIC: 0x0008,

  /** Trigger zones (no physical collision, events only) */
  TRIGGER: 0x0010,

  /** Projectiles (bullets, arrows) */
  PROJECTILE: 0x0020,

  /** Debris and particles */
  DEBRIS: 0x0040,

  /** Sensor/query volumes */
  SENSOR: 0x0080,
} as const;

/**
 * Collision masks define what each group can collide with
 * Mask is a bitwise OR of all groups this object should collide with
 */
export const CollisionMasks = {
  /** Default: collides with everything except triggers and sensors */
  DEFAULT:
    CollisionGroups.DEFAULT |
    CollisionGroups.CHARACTER |
    CollisionGroups.ENVIRONMENT |
    CollisionGroups.DYNAMIC |
    CollisionGroups.PROJECTILE |
    CollisionGroups.DEBRIS,

  /** Character: collides with environment, dynamic objects, and projectiles */
  CHARACTER:
    CollisionGroups.ENVIRONMENT |
    CollisionGroups.DYNAMIC |
    CollisionGroups.PROJECTILE |
    CollisionGroups.TRIGGER, // Triggers for events only

  /** Environment: collides with everything physical */
  ENVIRONMENT:
    CollisionGroups.DEFAULT |
    CollisionGroups.CHARACTER |
    CollisionGroups.DYNAMIC |
    CollisionGroups.PROJECTILE |
    CollisionGroups.DEBRIS,

  /** Dynamic: collides with everything except other dynamic objects (optional) */
  DYNAMIC:
    CollisionGroups.DEFAULT |
    CollisionGroups.CHARACTER |
    CollisionGroups.ENVIRONMENT |
    CollisionGroups.DYNAMIC | // Can be removed to prevent dynamic-dynamic collisions
    CollisionGroups.PROJECTILE,

  /** Trigger: only collides with characters (for event detection) */
  TRIGGER: CollisionGroups.CHARACTER,

  /** Projectile: collides with everything except debris and other projectiles */
  PROJECTILE:
    CollisionGroups.DEFAULT |
    CollisionGroups.CHARACTER |
    CollisionGroups.ENVIRONMENT |
    CollisionGroups.DYNAMIC,

  /** Debris: only collides with environment (lightweight) */
  DEBRIS: CollisionGroups.ENVIRONMENT,

  /** Sensor: queries only, no physical collision */
  SENSOR: 0x0000, // Collides with nothing
} as const;

/**
 * Helper to create custom collision filter
 * @param groups - Bitfield of groups this collider belongs to
 * @param mask - Bitfield of groups this collider can interact with
 * @returns Collision filter value for Rapier
 */
export function createCollisionFilter(groups: number, mask: number): number {
  // Rapier uses a 32-bit integer: lower 16 bits = groups, upper 16 bits = mask
  return (mask << 16) | groups;
}

/**
 * Get collision filter for character controller
 * Characters interact with environment, dynamic objects, and triggers
 */
export function getCharacterCollisionFilter(): number {
  return createCollisionFilter(CollisionGroups.CHARACTER, CollisionMasks.CHARACTER);
}

/**
 * Get collision filter for environment (static geometry)
 * Environment interacts with most groups except sensors
 */
export function getEnvironmentCollisionFilter(): number {
  return createCollisionFilter(CollisionGroups.ENVIRONMENT, CollisionMasks.ENVIRONMENT);
}

/**
 * Get collision filter for dynamic objects
 * Dynamic objects interact with characters, environment, and each other
 */
export function getDynamicCollisionFilter(): number {
  return createCollisionFilter(CollisionGroups.DYNAMIC, CollisionMasks.DYNAMIC);
}

/**
 * Get collision filter for trigger zones
 * Triggers only detect characters, no physical collision
 */
export function getTriggerCollisionFilter(): number {
  return createCollisionFilter(CollisionGroups.TRIGGER, CollisionMasks.TRIGGER);
}

/**
 * Predicate function for character controller collision filtering
 * Allows runtime filtering beyond static layer masks
 * @param _colliderHandle - Handle of collider being tested (unused for now)
 * @returns True if character should collide with this collider
 */
export function characterCollisionPredicate(): boolean {
  // For now, accept all collisions that pass group/mask filter
  // Can be extended to add dynamic filtering logic:
  // - Ignore specific entity types
  // - Implement one-way platforms
  // - Add custom collision rules
  return true;
}
