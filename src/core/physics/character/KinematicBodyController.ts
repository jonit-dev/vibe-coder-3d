/**
 * Kinematic Body Controller
 * Thin wrapper around Rapier KinematicCharacterController
 * Handles collision-aware movement and body synchronization
 */

import type {
  World,
  KinematicCharacterController as RapierKCC,
} from '@dimforge/rapier3d-compat';
import { Logger } from '@core/lib/logger';
import { CharacterMotor } from './CharacterMotor';
import { colliderRegistry } from './ColliderRegistry';
import type { IVector3 } from './types';
import {
  getCharacterCollisionFilter,
  characterCollisionPredicate,
} from './Layers';
import { componentRegistry } from '@core/lib/ecs/ComponentRegistry';
import { KnownComponentTypes } from '@core/lib/ecs/IComponent';

const logger = Logger.create('KinematicBodyController');

/**
 * Cache for Rapier controller instances per entity
 */
const controllerCache = new Map<number, RapierKCC>();

/**
 * Velocity storage per entity (maintains state between frames)
 */
const velocityCache = new Map<number, IVector3>();

/**
 * Kinematic Body Controller
 * Manages character movement through Rapier's kinematic character controller
 */
export class KinematicBodyController {
  constructor(
    private readonly world: World,
    private readonly motor: CharacterMotor,
  ) {}

  /**
   * Move character with collision detection and response
   * @param entityId - Entity to move
   * @param desiredXZ - Desired horizontal input [-1 to 1, -1 to 1]
   * @param deltaTime - Frame time in seconds
   */
  move(entityId: number, desiredXZ: [number, number], deltaTime: number): void {
    // Get or create velocity state
    let velocity = velocityCache.get(entityId);
    if (!velocity) {
      velocity = { x: 0, y: 0, z: 0 };
      velocityCache.set(entityId, velocity);
    }

    // Get collider for this entity
    const collider = colliderRegistry.getCollider(entityId);
    if (!collider) {
      // TEMPORARY: Fall back to simple physics until collider registration is fixed
      // This maintains backward compatibility while we debug the timing issue
      logger.debug('No collider found for entity, using simple physics fallback', { entityId });
      this.moveSimplePhysics(entityId, desiredXZ, velocity, deltaTime);
      return;
    }

    // Get or create Rapier controller
    const controller = this.getOrCreateController(entityId);
    if (!controller) {
      logger.error('Failed to get/create controller', { entityId });
      return;
    }

    // Compute desired horizontal velocity from input
    const desiredVelocity = this.motor.computeDesiredVelocity(desiredXZ);

    // Update horizontal velocity (instant response for snappy feel)
    velocity.x = desiredVelocity.x;
    velocity.z = desiredVelocity.z;

    // Apply gravity
    this.motor.applyGravity(velocity, deltaTime);

    // Compute desired movement this frame
    const desiredMovement = {
      x: velocity.x * deltaTime,
      y: velocity.y * deltaTime,
      z: velocity.z * deltaTime,
    };

    try {
      // Get collision filter for character
      const collisionGroups = getCharacterCollisionFilter();

      // Compute collision-aware movement
      controller.computeColliderMovement(
        collider,
        desiredMovement,
        undefined, // Use default filter flags
        collisionGroups, // Apply character collision groups/masks
        characterCollisionPredicate, // Runtime collision filtering
      );

      // Get the computed movement (with collision resolution)
      const computedMovement = controller.computedMovement();

      // Check if grounded
      const isGrounded = controller.computedGrounded();

      // Reset vertical velocity if grounded
      if (isGrounded && velocity.y < 0) {
        velocity.y = 0;
      }

      // Detect if movement was blocked by collision (wall hit)
      // If desired movement differs significantly from computed movement, we hit something
      const movementBlocked = {
        x: Math.abs(computedMovement.x) < Math.abs(desiredMovement.x) * 0.1,
        z: Math.abs(computedMovement.z) < Math.abs(desiredMovement.z) * 0.1,
      };

      // Reset horizontal velocity if blocked by wall to prevent sliding/floating
      if (movementBlocked.x) {
        velocity.x = 0;
      }
      if (movementBlocked.z) {
        velocity.z = 0;
      }

      // Apply computed movement to rigid body
      const rigidBody = colliderRegistry.getRigidBody(entityId);
      if (rigidBody) {
        const currentTranslation = rigidBody.translation();
        const newTranslation = {
          x: currentTranslation.x + computedMovement.x,
          y: currentTranslation.y + computedMovement.y,
          z: currentTranslation.z + computedMovement.z,
        };

        rigidBody.setNextKinematicTranslation(newTranslation);
      }
    } catch (error) {
      logger.error('Failed to compute character movement', {
        entityId,
        error: String(error),
      });
    }
  }

  /**
   * Make character jump
   * @param entityId - Entity to jump
   */
  jump(entityId: number): void {
    // Only jump if grounded
    if (!this.isGrounded(entityId)) {
      return;
    }

    // Get or create velocity
    let velocity = velocityCache.get(entityId);
    if (!velocity) {
      velocity = { x: 0, y: 0, z: 0 };
      velocityCache.set(entityId, velocity);
    }

    // Apply jump velocity
    velocity.y = this.motor.getJumpVelocity();

    logger.debug('Character jump', {
      entityId,
      strength: velocity.y,
    });
  }

  /**
   * Check if character is grounded
   * @param entityId - Entity to check
   * @returns True if on ground
   */
  isGrounded(entityId: number): boolean {
    const controller = controllerCache.get(entityId);
    if (!controller) {
      return false;
    }

    return controller.computedGrounded();
  }

  /**
   * Get or create Rapier KinematicCharacterController for entity
   * @param entityId - Entity identifier
   * @returns Controller or null if failed
   */
  private getOrCreateController(entityId: number): RapierKCC | null {
    // Check cache first
    const cached = controllerCache.get(entityId);
    if (cached) {
      return cached;
    }

    // Create new controller
    const config = this.motor.getConfig();

    try {
      const controller = this.world.createCharacterController(config.skinWidth);

      // Configure controller properties
      controller.setUp({ x: 0.0, y: 1.0, z: 0.0 }); // Up direction
      controller.setMaxSlopeClimbAngle((config.slopeLimitDeg * Math.PI) / 180);
      controller.setSlideEnabled(true); // Enable wall sliding
      controller.enableSnapToGround(config.skinWidth * 2); // Snap distance
      controller.enableAutostep(
        config.stepOffset, // Max step height
        config.skinWidth * 2, // Min step width
        true, // Include dynamic bodies
      );
      controller.setApplyImpulsesToDynamicBodies(true); // Push dynamic objects
      controller.setCharacterMass(50.0); // Default character mass

      // Cache the controller
      controllerCache.set(entityId, controller);

      logger.debug('Created Rapier character controller', {
        entityId,
        skinWidth: config.skinWidth,
        slopeLimit: config.slopeLimitDeg,
        stepOffset: config.stepOffset,
      });

      return controller;
    } catch (error) {
      logger.error('Failed to create Rapier character controller', {
        entityId,
        error: String(error),
      });
      return null;
    }
  }

  /**
   * Simple physics fallback (no Rapier collision)
   * Used when collider registration is delayed or missing
   * @private
   */
  private moveSimplePhysics(
    entityId: number,
    desiredXZ: [number, number],
    velocity: IVector3,
    deltaTime: number,
  ): void {
    // Compute desired horizontal velocity
    const desiredVelocity = this.motor.computeDesiredVelocity(desiredXZ);
    velocity.x = desiredVelocity.x;
    velocity.z = desiredVelocity.z;

    // Apply gravity
    this.motor.applyGravity(velocity, deltaTime);

    // Get current transform
    const transform = componentRegistry.getComponentData(
      entityId,
      KnownComponentTypes.TRANSFORM,
    );

    if (!transform) return;

    // Update position
    const newPosition: [number, number, number] = [
      transform.position[0] + velocity.x * deltaTime,
      transform.position[1] + velocity.y * deltaTime,
      transform.position[2] + velocity.z * deltaTime,
    ];

    // Simple ground collision (floor at Y=0.5)
    const groundLevel = 0.5;
    let isGrounded = false;

    if (newPosition[1] < groundLevel) {
      newPosition[1] = groundLevel;
      velocity.y = 0;
      isGrounded = true;
    }

    // Update transform
    componentRegistry.updateComponent(entityId, KnownComponentTypes.TRANSFORM, {
      ...transform,
      position: newPosition,
    });

    // Update isGrounded state
    const controllerData = componentRegistry.getComponentData(
      entityId,
      KnownComponentTypes.CHARACTER_CONTROLLER,
    );
    if (controllerData) {
      componentRegistry.updateComponent(entityId, KnownComponentTypes.CHARACTER_CONTROLLER, {
        ...controllerData,
        isGrounded,
      });
    }
  }

  /**
   * Cleanup controller and velocity for entity
   * @param entityId - Entity to cleanup
   */
  cleanup(entityId: number): void {
    // Remove controller from world
    const controller = controllerCache.get(entityId);
    if (controller) {
      this.world.removeCharacterController(controller);
      controllerCache.delete(entityId);
    }

    // Remove velocity cache
    velocityCache.delete(entityId);

    logger.debug('Cleaned up character controller', { entityId });
  }

  /**
   * Cleanup all controllers and velocity caches
   * Called when play mode stops or scene changes
   */
  static cleanupAll(world: World): void {
    // Remove all controllers from world
    for (const [entityId, controller] of controllerCache.entries()) {
      world.removeCharacterController(controller);
      logger.debug('Removed controller for entity', { entityId });
    }

    controllerCache.clear();
    velocityCache.clear();

    logger.debug('Cleaned up all character controllers');
  }
}
