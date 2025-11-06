/**
 * Character Motor
 * Pure movement math for character controller
 * Handles velocity computation, gravity, ground snapping, and slope/step logic
 * No Rapier dependencies - just normalized parameters and calculations
 */

import { Logger } from '@core/lib/logger';
import type { ICharacterMotorConfig, IVector3 } from './types';

const logger = Logger.create('CharacterMotor');

/**
 * Character Motor - Computes desired movement velocities
 * Handles all physics-agnostic character movement calculations
 */
export class CharacterMotor {
  constructor(private readonly config: ICharacterMotorConfig) {}

  /**
   * Compute desired horizontal velocity from input
   * @param inputXZ - Normalized input direction [x, z] (-1 to 1 range)
   * @returns Desired velocity vector (y component is 0)
   */
  computeDesiredVelocity(inputXZ: [number, number]): IVector3 {
    const [x, z] = inputXZ;

    // Clamp and normalize input
    const clampedX = Math.max(-1, Math.min(1, x));
    const clampedZ = Math.max(-1, Math.min(1, z));

    // Apply max speed
    const desiredX = clampedX * this.config.maxSpeed;
    const desiredZ = clampedZ * this.config.maxSpeed;

    return {
      x: desiredX,
      y: 0, // Horizontal movement only
      z: desiredZ,
    };
  }

  /**
   * Apply gravity to velocity
   * @param velocity - Current velocity vector (mutated)
   * @param deltaTime - Frame time in seconds
   */
  applyGravity(velocity: IVector3, deltaTime: number): void {
    // Gravity is negative (downward)
    const gravityAcceleration = this.config.gravity * deltaTime;
    velocity.y += gravityAcceleration;
  }

  /**
   * Check if character should snap to ground
   * Prevents snapping when falling fast or jumping
   * @param verticalSpeed - Current Y velocity (m/s)
   * @returns True if snapping should be enabled
   */
  shouldSnapToGround(verticalSpeed: number): boolean {
    // Only snap if not moving too fast vertically
    const absSpeed = Math.abs(verticalSpeed);
    return absSpeed <= this.config.snapMaxSpeed;
  }

  /**
   * Check if slope is too steep to climb
   * @param groundNormal - Ground surface normal vector (should be normalized)
   * @returns True if slope exceeds climb limit
   */
  isSlopeTooSteep(groundNormal: IVector3): boolean {
    // Dot product of surface normal with up vector gives cosine of angle
    // Normal pointing straight up = 1.0, horizontal = 0.0, down = -1.0
    const dotUp = groundNormal.y;

    // Convert slope limit from degrees to cosine
    const slopeLimitRad = (this.config.slopeLimitDeg * Math.PI) / 180;
    const cosLimit = Math.cos(slopeLimitRad);

    // If dot product is less than cosine limit, slope is too steep
    return dotUp < cosLimit;
  }

  /**
   * Check if step height is within climbable range
   * @param stepHeight - Height of step in meters
   * @returns True if step can be climbed
   */
  canClimbStep(stepHeight: number): boolean {
    return stepHeight > 0 && stepHeight <= this.config.stepOffset;
  }

  /**
   * Clamp depenetration distance to prevent tunneling
   * @param depenetration - Requested depenetration distance (meters)
   * @returns Clamped depenetration distance
   */
  clampDepenetration(depenetration: number): number {
    const absDepenetration = Math.abs(depenetration);

    if (absDepenetration > this.config.maxDepenetrationPerFrame) {
      logger.warn('Large depenetration detected', {
        requested: depenetration,
        max: this.config.maxDepenetrationPerFrame,
      });

      // Clamp to max and preserve sign
      return (
        Math.sign(depenetration) * this.config.maxDepenetrationPerFrame
      );
    }

    return depenetration;
  }

  /**
   * Check if object can be pushed based on mass
   * @param objectMass - Mass of object in kg
   * @returns True if object is pushable
   */
  canPushObject(objectMass: number): boolean {
    // maxPushMass of 0 means unlimited
    if (this.config.maxPushMass === 0) {
      return true;
    }

    return objectMass <= this.config.maxPushMass;
  }

  /**
   * Compute push force magnitude
   * @param relativeVelocity - Velocity difference between character and object
   * @returns Force multiplier to apply
   */
  computePushForce(relativeVelocity: number): number {
    // Push force proportional to relative velocity and push strength
    return relativeVelocity * this.config.pushStrength;
  }

  /**
   * Get jump velocity
   * @returns Upward velocity for jump (m/s)
   */
  getJumpVelocity(): number {
    return this.config.jumpStrength;
  }

  /**
   * Get current configuration (for debugging/inspection)
   */
  getConfig(): Readonly<ICharacterMotorConfig> {
    return this.config;
  }
}
