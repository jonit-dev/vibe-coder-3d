/**
 * Character Controller Auto Input System
 * Provides Unity-like auto-input handling for character controllers in Play mode
 * Handles WASD + Space movement with physics-based collision detection and response
 */

import { InputManager } from '../lib/input/InputManager';
import { componentRegistry } from '../lib/ecs/ComponentRegistry';
import { KnownComponentTypes } from '../lib/ecs/IComponent';
import { ICharacterControllerData, IInputMapping } from '../lib/ecs/components/accessors/types';
import { TransformData } from '../lib/ecs/components/definitions/TransformComponent';
import { Logger } from '../lib/logger';
import type { World, KinematicCharacterController, Collider } from '@dimforge/rapier3d-compat';

const logger = Logger.create('CharacterControllerAutoInputSystem');

// Cache for Rapier controller instances per entity
const rapierControllerCache = new Map<number, KinematicCharacterController>();

// Set of logged entities to prevent log spam
const loggedEntities = new Set<number>();

// Velocity storage for physics-based movement
const characterVelocities = new Map<number, { x: number; y: number; z: number }>();

/**
 * Character Controller API wrapper with physics-based movement
 */
class CharacterControllerAPI {
  constructor(
    private entityId: number,
    private getComponentData: () => ICharacterControllerData | null,
    private world: World | null,
    _getCollider: () => Collider | null, // Intentionally unused parameter (for now)
  ) {
    // Initialize velocity if needed
    if (!characterVelocities.has(entityId)) {
      characterVelocities.set(entityId, { x: 0, y: 0, z: 0 });
    }
  }

  /**
   * Move the character in a direction using physics
   * @param direction - Normalized movement vector [x, z]
   * @param speed - Movement speed (optional, uses controller maxSpeed if not provided)
   */
  move(direction: [number, number], speed?: number): void {
    const controllerData = this.getComponentData();
    if (!controllerData?.enabled) return;

    const moveSpeed = speed ?? controllerData.maxSpeed;
    const velocity = characterVelocities.get(this.entityId);

    if (velocity) {
      // Update horizontal velocity based on input
      velocity.x = direction[0] * moveSpeed;
      velocity.z = direction[1] * moveSpeed;
    }
  }

  /**
   * Make the character jump using physics impulse
   * @param strength - Jump strength (optional, uses controller jumpStrength if not provided)
   */
  jump(strength?: number): void {
    const controllerData = this.getComponentData();
    if (!controllerData?.enabled) return;

    const jumpStrength = strength ?? controllerData.jumpStrength;
    const velocity = characterVelocities.get(this.entityId);

    if (velocity && this.isGrounded()) {
      // Apply upward velocity for jump
      velocity.y = jumpStrength;

      logger.debug('Character jump', {
        entityId: this.entityId,
        strength: jumpStrength,
      });
    }
  }

  /**
   * Check if character is grounded using Rapier physics
   */
  isGrounded(): boolean {
    const controller = rapierControllerCache.get(this.entityId);
    if (!controller) {
      // Fallback: check Y position if no Rapier controller yet
      const transform = componentRegistry.getComponentData<TransformData>(
        this.entityId,
        KnownComponentTypes.TRANSFORM,
      );
      return transform ? transform.position[1] <= 0.6 : false;
    }

    // Use Rapier's ground detection result from last movement computation
    return controller.computedGrounded();
  }

  /**
   * Get or create Rapier KinematicCharacterController for this entity
   */
  getRapierController(): KinematicCharacterController | null {
    if (!this.world) return null;

    // Check cache first
    if (rapierControllerCache.has(this.entityId)) {
      return rapierControllerCache.get(this.entityId)!;
    }

    // Create new controller
    const controllerData = this.getComponentData();
    if (!controllerData) return null;

    try {
      // Create character controller with offset (skinWidth)
      const controller = this.world.createCharacterController(controllerData.skinWidth);

      // Configure controller properties
      controller.setUp({ x: 0.0, y: 1.0, z: 0.0 }); // Up direction
      controller.setMaxSlopeClimbAngle((controllerData.slopeLimit * Math.PI) / 180); // Convert degrees to radians
      controller.setSlideEnabled(true); // Enable wall sliding
      controller.enableSnapToGround(controllerData.skinWidth * 2); // Snap to ground within tolerance
      controller.enableAutostep(
        controllerData.stepOffset, // Max step height
        controllerData.skinWidth * 2, // Min step width
        true, // Include dynamic bodies
      );
      controller.setApplyImpulsesToDynamicBodies(true); // Push dynamic objects
      controller.setCharacterMass(50.0); // Default character mass

      // Cache the controller
      rapierControllerCache.set(this.entityId, controller);

      logger.debug('Created Rapier character controller', {
        entityId: this.entityId,
        offset: controllerData.skinWidth,
        slopeLimit: controllerData.slopeLimit,
        stepOffset: controllerData.stepOffset,
      });

      return controller;
    } catch (error) {
      logger.error('Failed to create Rapier character controller', {
        entityId: this.entityId,
        error: String(error),
      });
      return null;
    }
  }
}

/**
 * Creates or retrieves a cached CharacterControllerAPI instance
 */
function getCharacterControllerAPI(
  entityId: number,
  world: World | null,
  getCollider: () => Collider | null,
): CharacterControllerAPI {
  // Get component data function
  const getComponentData = (): ICharacterControllerData | null => {
    const data = componentRegistry.getComponentData<ICharacterControllerData>(
      entityId,
      KnownComponentTypes.CHARACTER_CONTROLLER,
    );
    return data ?? null;
  };

  // Create API instance (lightweight, not cached)
  return new CharacterControllerAPI(entityId, getComponentData, world, getCollider);
}

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

  // Forward/backward (Z axis) - Forward is positive Z (camera looks at negative Z)
  if (forwardKey) z += 1;
  if (backwardKey) z -= 1;

  // Left/right (X axis) - Left is positive X, Right is negative X (inverted from camera POV)
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
 * Main update function for Character Controller auto input
 * Called every frame during Play mode
 */
export function updateCharacterControllerAutoInputSystem(
  inputManager: InputManager,
  isPlaying: boolean,
  deltaTime: number = 1 / 60,
  world: World | null = null,
  getEntityCollider: (entityId: number) => Collider | null = () => null,
): void {
  // Only run during Play mode
  if (!isPlaying) {
    // Clear caches when not playing to ensure fresh state
    for (const controller of rapierControllerCache.values()) {
      if (world) {
        world.removeCharacterController(controller);
      }
    }
    rapierControllerCache.clear();
    loggedEntities.clear();
    characterVelocities.clear();
    return;
  }

  // Get all entities with CharacterController components
  const entities = componentRegistry.getEntitiesWithComponent(
    KnownComponentTypes.CHARACTER_CONTROLLER,
  );

  if (entities.length > 0) {
    logger.debug('Processing CharacterController entities', {
      count: entities.length,
      entityIds: Array.from(entities),
    });
  }

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

    // Get API instance
    const getCollider = () => getEntityCollider(entityId);
    const api = getCharacterControllerAPI(entityId, world, getCollider);

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

    // Apply movement
    if (moveX !== 0 || moveZ !== 0) {
      api.move([moveX, moveZ]);
    } else {
      // Important: Always call move([0, 0]) when no keys pressed to stop character momentum
      api.move([0, 0]);
    }

    // Handle jump input
    if (jumpKey && api.isGrounded()) {
      api.jump();
    }

    // Log warnings once per entity for missing configurations
    if (!loggedEntities.has(entityId)) {
      if (!controllerData.inputMapping) {
        logger.debug('CharacterController using default input mapping', {
          entityId,
          suggestion: 'Configure input mapping in the inspector for better control',
        });
      }

      // Check for required collider
      const collider = getCollider();
      if (!collider) {
        logger.warn('CharacterController missing required MeshCollider component', {
          entityId,
          suggestion:
            'Add a MeshCollider component (preferably Capsule) for physics-based movement',
        });
      }

      loggedEntities.add(entityId);
    }

    // Apply physics: Update transform based on physics-computed movement
    const velocity = characterVelocities.get(entityId);
    if (velocity && world) {
      const collider = getCollider();
      if (!collider) {
        // No collider - fall back to simple physics
        applySimplePhysics(entityId, controllerData, velocity, deltaTime);
        continue;
      }

      // Get or create Rapier controller
      const rapierController = api.getRapierController();
      if (!rapierController) {
        // Failed to create controller - fall back to simple physics
        applySimplePhysics(entityId, controllerData, velocity, deltaTime);
        continue;
      }

      // Apply gravity
      const gravity = -9.81 * controllerData.gravityScale;
      velocity.y += gravity * deltaTime;

      // Compute desired movement using Rapier physics
      const desiredMovement = {
        x: velocity.x * deltaTime,
        y: velocity.y * deltaTime,
        z: velocity.z * deltaTime,
      };

      try {
        // Compute collision-aware movement
        rapierController.computeColliderMovement(
          collider,
          desiredMovement,
          undefined, // filterFlags
          undefined, // filterGroups
          undefined, // filterPredicate
        );

        // Get the computed movement (with collision resolution)
        const computedMovement = rapierController.computedMovement();

        // Update transform with physics-resolved position
        const transform = componentRegistry.getComponentData<TransformData>(
          entityId,
          KnownComponentTypes.TRANSFORM,
        );

        if (transform) {
          const newPosition: [number, number, number] = [
            transform.position[0] + computedMovement.x,
            transform.position[1] + computedMovement.y,
            transform.position[2] + computedMovement.z,
          ];

          // Check if grounded
          const isGrounded = rapierController.computedGrounded();

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

          // Update transform
          componentRegistry.updateComponent(entityId, KnownComponentTypes.TRANSFORM, {
            ...transform,
            position: newPosition,
          });

          // Update isGrounded state
          componentRegistry.updateComponent(entityId, KnownComponentTypes.CHARACTER_CONTROLLER, {
            ...controllerData,
            isGrounded,
          });
        }
      } catch (error) {
        logger.error('Failed to compute character movement', {
          entityId,
          error: String(error),
        });
        // Fall back to simple physics
        applySimplePhysics(entityId, controllerData, velocity, deltaTime);
      }
    } else if (velocity) {
      // No physics world - use simple physics
      applySimplePhysics(entityId, controllerData, velocity, deltaTime);
    }
  }
}

/**
 * Apply simple physics-based movement (fallback when Rapier not available)
 */
function applySimplePhysics(
  entityId: number,
  controllerData: ICharacterControllerData,
  velocity: { x: number; y: number; z: number },
  deltaTime: number,
): void {
  const transform = componentRegistry.getComponentData<TransformData>(
    entityId,
    KnownComponentTypes.TRANSFORM,
  );

  if (!transform) return;

  // Apply gravity
  const gravity = -9.81 * controllerData.gravityScale;
  velocity.y += gravity * deltaTime;

  // Update position
  const newPosition: [number, number, number] = [
    transform.position[0] + velocity.x * deltaTime,
    transform.position[1] + velocity.y * deltaTime,
    transform.position[2] + velocity.z * deltaTime,
  ];

  // Simple ground collision (floor at Y=0.5)
  const groundLevel = 0.5;
  if (newPosition[1] < groundLevel) {
    newPosition[1] = groundLevel;
    velocity.y = 0;

    // Update isGrounded state
    componentRegistry.updateComponent(entityId, KnownComponentTypes.CHARACTER_CONTROLLER, {
      ...controllerData,
      isGrounded: true,
    });
  } else {
    // Update isGrounded state
    componentRegistry.updateComponent(entityId, KnownComponentTypes.CHARACTER_CONTROLLER, {
      ...controllerData,
      isGrounded: false,
    });
  }

  // Update transform
  componentRegistry.updateComponent(entityId, KnownComponentTypes.TRANSFORM, {
    ...transform,
    position: newPosition,
  });
}

/**
 * Cleanup function to clear caches and destroy Rapier controllers
 */
export function cleanupCharacterControllerAutoInputSystem(world: World | null = null): void {
  // Destroy all Rapier controllers
  if (world) {
    for (const controller of rapierControllerCache.values()) {
      world.removeCharacterController(controller);
    }
  }

  rapierControllerCache.clear();
  loggedEntities.clear();
  characterVelocities.clear();
  logger.debug('CharacterControllerAutoInputSystem cleaned up');
}
