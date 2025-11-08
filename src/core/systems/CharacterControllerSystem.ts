/**
 * Character Controller System
 * Unified system using CharacterMotor + KinematicBodyController
 * Replaces CharacterControllerAutoInputSystem with cleaner architecture
 *
 * BASELINE REFACTOR: Added diagnostic instrumentation and validation
 */

import type { World } from '@dimforge/rapier3d-compat';
import { InputManager } from '../lib/input/InputManager';
import { componentRegistry } from '../lib/ecs/ComponentRegistry';
import { KnownComponentTypes } from '../lib/ecs/IComponent';
import type { ICharacterControllerData } from '../lib/ecs/components/accessors/types';
import { Logger } from '../lib/logger';
import { CharacterMotor } from '../physics/character/CharacterMotor';
import { KinematicBodyController } from '../physics/character/KinematicBodyController';
import type { ICharacterMotorConfig } from '../physics/character/types';
import {
  getNormalizedInputMapping,
  readInputState,
  calculateMovementDirection,
  validateEntityPhysics,
  logEntityPhysicsDiagnostics,
  consumeIntents,
} from './CharacterControllerHelpers';
import {
  validateGoldenSignals,
  logComprehensiveHealthReport,
} from './CharacterControllerGoldenSignals';

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
 * Track last validation time to avoid spamming diagnostics
 */
let lastValidationTime = 0;
const VALIDATION_INTERVAL_MS = 5000; // Validate every 5 seconds

/**
 * Deferred registration tracking for entities missing physics handles
 * Implements one-frame retry mechanism before giving up or falling back
 */
interface IDeferredEntityInfo {
  firstSeen: number; // Timestamp when entity was first seen without physics
  retryCount: number; // Number of retry attempts
  maxRetries: number; // Maximum retries before giving up
  lastValidationTime: number; // Last time we checked for physics
}

const deferredEntities = new Map<number, IDeferredEntityInfo>();
const DEFERRED_MAX_RETRIES = 3; // Try for 3 frames (~50ms at 60fps)
const DEFERRED_RETRY_INTERVAL_MS = 100; // Check every 100ms

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

    logger.info('CharacterControllerSystem initialized');
  }

  // Periodic golden signal validation
  const now = Date.now();
  if (now - lastValidationTime > VALIDATION_INTERVAL_MS) {
    const isValid = validateGoldenSignals();
    if (!isValid) {
      logger.warn('Golden signal validation failed - entities may be dropping out');
    }
    lastValidationTime = now;
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

    // PHASE 3: Pre-flight check with deferred registration retry
    const physicsValidation = validateEntityPhysics(entityId);
    if (!physicsValidation.isValid) {
      const currentTime = Date.now();
      let deferredInfo = deferredEntities.get(entityId);

      if (!deferredInfo) {
        // First time seeing this entity without physics - start tracking it
        deferredInfo = {
          firstSeen: currentTime,
          retryCount: 0,
          maxRetries: DEFERRED_MAX_RETRIES,
          lastValidationTime: currentTime,
        };
        deferredEntities.set(entityId, deferredInfo);

        logger.debug('Entity deferred: waiting for physics registration', {
          entityId,
          maxRetries: DEFERRED_MAX_RETRIES,
        });
      }

      // Check if enough time has passed for another retry
      if (currentTime - deferredInfo.lastValidationTime >= DEFERRED_RETRY_INTERVAL_MS) {
        deferredInfo.retryCount++;
        deferredInfo.lastValidationTime = currentTime;

        if (deferredInfo.retryCount >= deferredInfo.maxRetries) {
          // Exhausted retries - log warning once and let controller fall back to simple physics
          if (!loggedEntities.has(entityId)) {
            logger.warn('Entity physics registration timeout', {
              entityId,
              retries: deferredInfo.retryCount,
              timeElapsed: currentTime - deferredInfo.firstSeen,
              diagnosticMessage: physicsValidation.diagnosticMessage,
              suggestion: 'Entity will use simple physics fallback if enabled',
            });
            logEntityPhysicsDiagnostics(entityId, 'CharacterControllerSystem deferred timeout');
            loggedEntities.add(entityId);
          }
          // Continue processing with fallback - don't skip
        } else {
          logger.debug('Entity physics retry', {
            entityId,
            retryCount: deferredInfo.retryCount,
            maxRetries: deferredInfo.maxRetries,
          });
          // Still retrying - skip this entity for now
          continue;
        }
      } else {
        // Not enough time has passed for retry - skip this entity
        continue;
      }

      // If we reach here, retries are exhausted - continue processing with fallback
    } else {
      // Physics is valid - remove from deferred tracking if present
      if (deferredEntities.has(entityId)) {
        const deferredInfo = deferredEntities.get(entityId)!;
        logger.debug('Entity physics registration succeeded after retry', {
          entityId,
          retries: deferredInfo.retryCount,
          timeElapsed: Date.now() - deferredInfo.firstSeen,
        });
        deferredEntities.delete(entityId);
      }
    }

    // Get or create motor for this entity
    const motor = getOrCreateMotor(entityId, controllerData);

    // Create controller with this entity's motor
    const controller = new KinematicBodyController(world, motor);

    // Process based on control mode
    if (controllerData.controlMode === 'auto') {
      // AUTO MODE: Process keyboard input
      // Get normalized input mapping (handles legacy fixes)
      const inputMapping = getNormalizedInputMapping(controllerData);

      // Read input state
      const inputState = readInputState(inputManager, inputMapping);

      // Calculate movement direction
      const [moveX, moveZ] = calculateMovementDirection(inputState);

      // Apply movement via kinematic controller
      controller.move(entityId, [moveX, moveZ], deltaTime);

      // Handle jump input
      if (inputState.jump) {
        controller.jump(entityId);
      }
    } else {
      // MANUAL MODE: Process script intents
      const intents = consumeIntents(entityId);

      for (const intent of intents) {
        if (intent.type === 'move' && intent.data?.inputXZ && intent.data?.speed !== undefined) {
          // Apply movement with script-provided speed
          const scriptSpeed = intent.data.speed;
          const normalizedInput = intent.data.inputXZ;

          // Pass speedOverride to controller (motor will use it instead of component maxSpeed)
          controller.move(entityId, normalizedInput, deltaTime, scriptSpeed);
        } else if (intent.type === 'jump' && intent.data?.strength !== undefined) {
          // Apply jump (jump strength is already stored in motor config)
          // TODO: Support custom jump strength from scripts
          controller.jump(entityId);
        }
      }
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
  // Log final health report before cleanup
  logger.info('Cleaning up CharacterControllerSystem - Final Health Report:');
  logComprehensiveHealthReport();

  // Cleanup kinematic controller
  if (kinematicController && world) {
    KinematicBodyController.cleanupAll(world);
    kinematicController = null;
  }

  // Clear motor cache
  motorCache.clear();
  loggedEntities.clear();

  // PHASE 3: Clear deferred registration tracking
  if (deferredEntities.size > 0) {
    logger.debug('Clearing deferred entity tracking', {
      count: deferredEntities.size,
      entityIds: Array.from(deferredEntities.keys()),
    });
    deferredEntities.clear();
  }

  // Reset validation timer
  lastValidationTime = 0;

  logger.info('CharacterControllerSystem cleaned up');
}

/**
 * Cleanup function for a specific entity when it's destroyed
 * PHASE 3: Entity removal hook
 */
export function cleanupEntityController(entityId: number, world: World | null): void {
  // Cleanup motor cache
  const hadMotor = motorCache.delete(entityId);

  // Cleanup logged entities
  loggedEntities.delete(entityId);

  // Cleanup deferred tracking
  const hadDeferred = deferredEntities.delete(entityId);

  // Cleanup kinematic controller for this entity
  if (world && kinematicController) {
    kinematicController.cleanup(entityId);
  }

  if (hadMotor || hadDeferred) {
    logger.debug('Cleaned up entity controller', {
      entityId,
      hadMotor,
      hadDeferred,
    });
  }
}
