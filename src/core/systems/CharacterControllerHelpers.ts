/**
 * Character Controller Helpers
 * Isolated helper functions for input mapping, intent queuing, and collider lookups
 * Part of baseline refactor to separate concerns before full migration
 */

import type { ICharacterControllerData, IInputMapping } from '../lib/ecs/components/accessors/types';
import { InputManager } from '../lib/input/InputManager';
import { colliderRegistry } from '../physics/character/ColliderRegistry';
import { Logger } from '../lib/logger';

const logger = Logger.create('CharacterControllerHelpers');

/**
 * Normalize input key to match stored input mapping
 * Handles legacy ' ' space key and ensures lowercase
 */
export function normalizeInputKey(key: string): string {
  // Handle legacy space key
  if (key === ' ') {
    return 'space';
  }
  return key.toLowerCase();
}

/**
 * Get normalized input mapping from controller data
 * Applies legacy fixes (e.g., ' ' -> 'space')
 */
export function getNormalizedInputMapping(
  controllerData: ICharacterControllerData,
): IInputMapping {
  const mapping = controllerData.inputMapping || {
    forward: 'w',
    backward: 's',
    left: 'a',
    right: 'd',
    jump: 'space',
  };

  // Fix legacy ' ' jump key to 'space'
  if (mapping.jump === ' ') {
    return { ...mapping, jump: 'space' };
  }

  return mapping;
}

/**
 * Read input state from InputManager using input mapping
 * Returns normalized key states
 */
export interface IInputState {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  jump: boolean;
}

export function readInputState(
  inputManager: InputManager,
  mapping: IInputMapping,
): IInputState {
  return {
    forward: inputManager.isKeyDown(normalizeInputKey(mapping.forward)),
    backward: inputManager.isKeyDown(normalizeInputKey(mapping.backward)),
    left: inputManager.isKeyDown(normalizeInputKey(mapping.left)),
    right: inputManager.isKeyDown(normalizeInputKey(mapping.right)),
    jump: inputManager.isKeyDown(normalizeInputKey(mapping.jump)),
  };
}

/**
 * Calculate normalized movement direction from input state
 * Returns [x, z] with length <= 1.0
 */
export function calculateMovementDirection(inputState: IInputState): [number, number] {
  let x = 0;
  let z = 0;

  // Forward/backward (Z axis)
  if (inputState.forward) z += 1;
  if (inputState.backward) z -= 1;

  // Left/right (X axis)
  if (inputState.left) x += 1;
  if (inputState.right) x -= 1;

  // Normalize if movement in multiple directions
  if (x !== 0 || z !== 0) {
    const length = Math.sqrt(x * x + z * z);
    if (length > 0) {
      x /= length;
      z /= length;
    }
  }

  return [x, z];
}

/**
 * Validate that an entity has required physics components registered
 * Returns validation result with detailed diagnostics
 */
export interface IPhysicsValidationResult {
  isValid: boolean;
  hasCollider: boolean;
  hasRigidBody: boolean;
  colliderCount: number;
  diagnosticMessage?: string;
}

export function validateEntityPhysics(entityId: number): IPhysicsValidationResult {
  const hasPhysics = colliderRegistry.hasPhysics(entityId);

  if (!hasPhysics) {
    return {
      isValid: false,
      hasCollider: false,
      hasRigidBody: false,
      colliderCount: 0,
      diagnosticMessage: 'Entity not registered in physics registry',
    };
  }

  const colliders = colliderRegistry.getColliders(entityId);
  const rigidBody = colliderRegistry.getRigidBody(entityId);

  const result: IPhysicsValidationResult = {
    isValid: colliders.length > 0 && rigidBody !== null,
    hasCollider: colliders.length > 0,
    hasRigidBody: rigidBody !== null,
    colliderCount: colliders.length,
  };

  if (!result.isValid) {
    const missing: string[] = [];
    if (!result.hasCollider) missing.push('collider');
    if (!result.hasRigidBody) missing.push('rigid body');
    result.diagnosticMessage = `Missing physics components: ${missing.join(', ')}`;
  }

  return result;
}

/**
 * Log a detailed diagnostic report for entity physics state
 * Useful for debugging dropout issues
 */
export function logEntityPhysicsDiagnostics(entityId: number, context: string): void {
  const validation = validateEntityPhysics(entityId);
  const diagnostics = colliderRegistry.getDiagnostics();

  logger.debug('Entity physics diagnostics', {
    context,
    entityId,
    validation,
    registrySize: colliderRegistry.size(),
    registryDiagnostics: {
      totalRegistrations: diagnostics.totalRegistrations,
      totalUnregistrations: diagnostics.totalUnregistrations,
      totalDropouts: diagnostics.dropouts,
    },
  });
}

/**
 * Intent queue for script API
 * Stores movement/jump intents that can be processed by the controller
 * Part of the migration path to route script API through the controller
 */
export interface ICharacterIntent {
  entityId: number;
  type: 'move' | 'jump';
  timestamp: number;
  data?: {
    inputXZ?: [number, number];
    speed?: number;
    strength?: number;
  };
}

/**
 * Simple intent queue (to be expanded as needed)
 */
const intentQueue: ICharacterIntent[] = [];

/**
 * Enqueue a character intent (for script API)
 */
export function enqueueIntent(intent: Omit<ICharacterIntent, 'timestamp'>): void {
  intentQueue.push({
    ...intent,
    timestamp: Date.now(),
  });
}

/**
 * Get and clear all intents for an entity
 */
export function consumeIntents(entityId: number): ICharacterIntent[] {
  const entityIntents = intentQueue.filter((intent) => intent.entityId === entityId);

  // Remove consumed intents
  for (let i = intentQueue.length - 1; i >= 0; i--) {
    if (intentQueue[i].entityId === entityId) {
      intentQueue.splice(i, 1);
    }
  }

  return entityIntents;
}

/**
 * Clear all intents (used during cleanup)
 */
export function clearAllIntents(): void {
  intentQueue.length = 0;
  logger.debug('Cleared all character intents');
}
