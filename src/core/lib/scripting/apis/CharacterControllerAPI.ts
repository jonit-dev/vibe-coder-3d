/**
 * CharacterControllerAPI - Simple character controller for gameplay scripts
 * Provides movement, jump, and grounded detection for character entities
 */

import { Logger } from '@/core/lib/logger';
import type { EntityId } from '@/core/lib/ecs/types';
import { getRigidBody } from '../adapters/physics-binding';

const logger = Logger.create('CharacterControllerAPI');

/**
 * Character controller state per entity
 */
interface ICharacterControllerState {
  slopeLimit: number; // Max slope angle in degrees
  stepOffset: number; // Max step height
  skinWidth: number; // Offset from collider for ground detection
  lastGroundedTime: number; // For coyote time
  isGrounded: boolean;
  wasEverGrounded: boolean; // Track if entity was ever grounded
}

/**
 * Store for character controller state per entity
 */
const controllerStates = new Map<EntityId, ICharacterControllerState>();

/**
 * Get or create character controller state for an entity
 */
function getState(entityId: EntityId): ICharacterControllerState {
  let state = controllerStates.get(entityId);
  if (!state) {
    state = {
      slopeLimit: 45, // degrees
      stepOffset: 0.3,
      skinWidth: 0.08,
      lastGroundedTime: 0,
      isGrounded: false,
      wasEverGrounded: false,
    };
    controllerStates.set(entityId, state);
  }
  return state;
}

/**
 * Check if character is grounded using raycasting
 * Returns true if there's ground beneath the character
 */
function checkGrounded(entityId: EntityId): boolean {
  const state = getState(entityId);
  const rigidBody = getRigidBody(entityId);

  if (!rigidBody) {
    return false;
  }

  // Simple ground check: ray down from feet
  // This is a simplified version - a full implementation would use character capsule shape
  // For now, we assume the character is grounded if velocity.y is near zero and not moving up
  const velocity = rigidBody.linvel();

  // Character is grounded if vertical velocity is small and downward or zero
  const isGrounded = velocity.y <= 0.1 && velocity.y >= -0.1;

  state.isGrounded = isGrounded;
  if (isGrounded) {
    state.lastGroundedTime = performance.now();
    state.wasEverGrounded = true;
  }

  return isGrounded;
}

/**
 * Character Controller API interface
 */
export interface ICharacterControllerAPI {
  /**
   * Check if character is currently grounded
   */
  isGrounded(): boolean;

  /**
   * Move character horizontally with collision detection
   * @param inputXZ - Input vector [x, z] in range [-1, 1]
   * @param speed - Movement speed in units per second
   */
  move(inputXZ: [number, number], speed: number): void;

  /**
   * Make character jump
   * @param strength - Jump force/impulse strength
   */
  jump(strength: number): void;

  /**
   * Set maximum slope angle the character can climb
   * @param maxDegrees - Maximum slope angle in degrees
   */
  setSlopeLimit(maxDegrees: number): void;

  /**
   * Set maximum step height the character can climb
   * @param value - Step offset in units
   */
  setStepOffset(value: number): void;
}

/**
 * Create character controller API for an entity
 */
export function createCharacterControllerAPI(entityId: EntityId): ICharacterControllerAPI {
  return {
    isGrounded(): boolean {
      return checkGrounded(entityId);
    },

    move(inputXZ: [number, number], speed: number): void {
      const rigidBody = getRigidBody(entityId);
      if (!rigidBody) {
        logger.warn(`No rigid body found for entity ${entityId}`);
        return;
      }

      // Normalize input
      const length = Math.sqrt(inputXZ[0] * inputXZ[0] + inputXZ[1] * inputXZ[1]);
      const normalizedX = length > 0 ? inputXZ[0] / length : 0;
      const normalizedZ = length > 0 ? inputXZ[1] / length : 0;

      // Calculate target velocity
      const targetVelX = normalizedX * speed;
      const targetVelZ = normalizedZ * speed;

      // Get current velocity
      const currentVel = rigidBody.linvel();

      // Set horizontal velocity while preserving vertical velocity
      rigidBody.setLinvel(
        {
          x: targetVelX,
          y: currentVel.y,
          z: targetVelZ,
        },
        true,
      );
    },

    jump(strength: number): void {
      const state = getState(entityId);

      // Check current grounded state
      const currentlyGrounded = checkGrounded(entityId);

      // Allow coyote time: can jump shortly after leaving ground
      const timeSinceGrounded = performance.now() - state.lastGroundedTime;
      const coyoteTimeMs = 150; // 150ms grace period

      // Can't jump if never been grounded or too long since grounded
      if (!currentlyGrounded && (!state.wasEverGrounded || timeSinceGrounded > coyoteTimeMs)) {
        return; // Can't jump while airborne
      }

      const rigidBody = getRigidBody(entityId);
      if (!rigidBody) {
        logger.warn(`No rigid body found for entity ${entityId}`);
        return;
      }

      // Apply upward impulse
      rigidBody.applyImpulse({ x: 0, y: strength, z: 0 }, true);

      // Mark as no longer grounded
      state.isGrounded = false;
    },

    setSlopeLimit(maxDegrees: number): void {
      const state = getState(entityId);
      state.slopeLimit = Math.max(0, Math.min(90, maxDegrees));
    },

    setStepOffset(value: number): void {
      const state = getState(entityId);
      state.stepOffset = Math.max(0, value);
    },
  };
}

/**
 * Clean up character controller state when entity is destroyed
 */
export function cleanupCharacterControllerAPI(entityId: EntityId): void {
  controllerStates.delete(entityId);
  logger.debug(`Cleaned up character controller for entity ${entityId}`);
}
