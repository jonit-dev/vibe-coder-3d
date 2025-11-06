/**
 * Character Controller System
 * Unified system using CharacterMotor + KinematicBodyController
 * Replaces CharacterControllerAutoInputSystem with cleaner architecture
 */

import type { World } from '@dimforge/rapier3d-compat';
import { InputManager } from '../lib/input/InputManager';
import { componentRegistry } from '../lib/ecs/ComponentRegistry';
import { KnownComponentTypes } from '../lib/ecs/IComponent';
import type { ICharacterControllerData, IInputMapping } from '../lib/ecs/components/accessors/types';
import { Logger } from '../lib/logger';
import { CharacterMotor } from '../physics/character/CharacterMotor';
import { KinematicBodyController } from '../physics/character/KinematicBodyController';
import type { ICharacterMotorConfig } from '../physics/character/types';

const logger = Logger.create('CharacterControllerSystem');

/**
 * Global controller instance (one per world)
 * Created when play mode starts, destroyed when it stops
 */
let kinematicController: KinematicBodyController | null = null;

/**
 * Motor instances per entity (cached for performance)
 * Each entity gets its own motor with its own config
 */
const motorCache = new Map<number, CharacterMotor>();

/**
 * Set of logged entities to prevent log spam
 */
const loggedEntities = new Set<number>();

/**
 * Normalize input key to match stored input mapping
 */
function normalizeInputKey(key: string): string {
  return key.toLowerCase();
}

/**
 * Calculate movement direction from key states
 */
function calculateMovementDirection(
  forwardKey: boolean,
  backwardKey: boolean,
  leftKey: boolean,
  rightKey: boolean,
): [number, number] {
  let x = 0;
  let z = 0;

  // Forward/backward (Z axis)
  if (forwardKey) z += 1;
  if (backwardKey) z -= 1;

  // Left/right (X axis)
  if (leftKey) x += 1;
  if (rightKey) x -= 1;

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
 * Create motor config from character controller component data
 */
function createMotorConfig(data: ICharacterControllerData): ICharacterMotorConfig {
  return {
    maxSpeed: data.maxSpeed,
    jumpStrength: data.jumpStrength,
    gravity: -9.81 * data.gravityScale, // Convert scale to actual gravity
    slopeLimitDeg: data.slopeLimit,
    stepOffset: data.stepOffset,
    skinWidth: data.skinWidth,
    // Use component values or defaults for interaction tuning
    snapMaxSpeed: data.snapMaxSpeed ?? 5.0,
    maxDepenetrationPerFrame: data.maxDepenetrationPerFrame ?? 0.5,
    pushStrength: data.pushStrength ?? 1.0,
    maxPushMass: data.maxPushMass ?? 0,
  };
}

/**
 * Get or create motor for entity
 */
function getOrCreateMotor(entityId: number, data: ICharacterControllerData): CharacterMotor {
  // Check if motor exists and config matches
  const existingMotor = motorCache.get(entityId);
  if (existingMotor) {
    // TODO: Check if config changed and recreate if needed
    return existingMotor;
  }

  // Create new motor
  const config = createMotorConfig(data);
  const motor = new CharacterMotor(config);
  motorCache.set(entityId, motor);

  logger.debug('Created character motor', { entityId });

  return motor;
}

/**
 * Main update function for Character Controller system
 * Called every frame during Play mode
 */
export function updateCharacterControllerSystem(
  inputManager: InputManager,
  isPlaying: boolean,
  deltaTime: number,
  world: World | null,
): void {
  // Only run during Play mode
  if (!isPlaying) {
    return;
  }

  // Ensure we have a world
  if (!world) {
    return;
  }

  // Create kinematic controller if not exists
  if (!kinematicController) {
    // We'll create a temporary motor just to get default config
    const defaultConfig: ICharacterMotorConfig = {
      maxSpeed: 6.0,
      jumpStrength: 6.5,
      gravity: -9.81,
      slopeLimitDeg: 45,
      stepOffset: 0.3,
      skinWidth: 0.08,
      snapMaxSpeed: 5.0,
      maxDepenetrationPerFrame: 0.5,
      pushStrength: 1.0,
      maxPushMass: 0,
    };
    const tempMotor = new CharacterMotor(defaultConfig);
    kinematicController = new KinematicBodyController(world, tempMotor);
  }

  // Get all entities with CharacterController components
  const entities = componentRegistry.getEntitiesWithComponent(
    KnownComponentTypes.CHARACTER_CONTROLLER,
  );

  for (const entityId of entities) {
    const controllerData = componentRegistry.getComponentData<ICharacterControllerData>(
      entityId,
      KnownComponentTypes.CHARACTER_CONTROLLER,
    );

    // Skip if no controller data or not enabled
    if (!controllerData || !controllerData.enabled) {
      continue;
    }

    // Only process auto mode controllers
    if (controllerData.controlMode !== 'auto') {
      continue;
    }

    // Get or create motor for this entity
    const motor = getOrCreateMotor(entityId, controllerData);

    // Create controller with this entity's motor
    const controller = new KinematicBodyController(world, motor);

    // Use default input mapping if none configured
    let inputMapping: IInputMapping = controllerData.inputMapping || {
      forward: 'w',
      backward: 's',
      left: 'a',
      right: 'd',
      jump: 'space',
    };

    // Fix legacy ' ' jump key to 'space'
    if (inputMapping.jump === ' ') {
      inputMapping = { ...inputMapping, jump: 'space' };
    }

    // Check key states
    const forwardKey = inputManager.isKeyDown(normalizeInputKey(inputMapping.forward));
    const backwardKey = inputManager.isKeyDown(normalizeInputKey(inputMapping.backward));
    const leftKey = inputManager.isKeyDown(normalizeInputKey(inputMapping.left));
    const rightKey = inputManager.isKeyDown(normalizeInputKey(inputMapping.right));
    const jumpKey = inputManager.isKeyDown(normalizeInputKey(inputMapping.jump));

    // Calculate movement direction
    const [moveX, moveZ] = calculateMovementDirection(forwardKey, backwardKey, leftKey, rightKey);

    // Apply movement via kinematic controller
    controller.move(entityId, [moveX, moveZ], deltaTime);

    // Handle jump input
    if (jumpKey) {
      controller.jump(entityId);
    }

    // Update isGrounded state in component
    const isGrounded = controller.isGrounded(entityId);
    componentRegistry.updateComponent(entityId, KnownComponentTypes.CHARACTER_CONTROLLER, {
      ...controllerData,
      isGrounded,
    });

    // Log warnings once per entity
    if (!loggedEntities.has(entityId)) {
      if (!controllerData.inputMapping) {
        logger.debug('CharacterController using default input mapping', {
          entityId,
          suggestion: 'Configure input mapping in the inspector for better control',
        });
      }

      loggedEntities.add(entityId);
    }
  }
}

/**
 * Cleanup function to clear caches and destroy controllers
 */
export function cleanupCharacterControllerSystem(world: World | null): void {
  // Cleanup kinematic controller
  if (kinematicController && world) {
    KinematicBodyController.cleanupAll(world);
    kinematicController = null;
  }

  // Clear motor cache
  motorCache.clear();
  loggedEntities.clear();

  logger.debug('CharacterControllerSystem cleaned up');
}
