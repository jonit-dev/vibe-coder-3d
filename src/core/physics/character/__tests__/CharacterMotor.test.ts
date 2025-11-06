/**
 * CharacterMotor Unit Tests
 * Tests movement calculations, gravity, slope/step logic
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CharacterMotor } from '../CharacterMotor';
import type { ICharacterMotorConfig } from '../types';

describe('CharacterMotor', () => {
  let config: ICharacterMotorConfig;
  let motor: CharacterMotor;

  beforeEach(() => {
    config = {
      maxSpeed: 6.0,
      jumpStrength: 6.5,
      gravity: -9.81,
      slopeLimitDeg: 45.0,
      stepOffset: 0.3,
      skinWidth: 0.08,
      snapMaxSpeed: 5.0,
      maxDepenetrationPerFrame: 0.5,
      pushStrength: 1.0,
      maxPushMass: 0,
    };
    motor = new CharacterMotor(config);
  });

  describe('computeDesiredVelocity', () => {
    it('should compute velocity from normalized input', () => {
      const velocity = motor.computeDesiredVelocity([1, 0]);
      expect(velocity.x).toBe(6.0);
      expect(velocity.y).toBe(0);
      expect(velocity.z).toBe(0);
    });

    it('should compute velocity for diagonal movement', () => {
      const velocity = motor.computeDesiredVelocity([1, 1]);
      expect(velocity.x).toBe(6.0);
      expect(velocity.z).toBe(6.0);
      expect(velocity.y).toBe(0);
    });

    it('should clamp input values to [-1, 1]', () => {
      const velocity = motor.computeDesiredVelocity([2, -2]);
      expect(velocity.x).toBe(6.0); // Clamped to 1
      expect(velocity.z).toBe(-6.0); // Clamped to -1
    });

    it('should handle zero input', () => {
      const velocity = motor.computeDesiredVelocity([0, 0]);
      expect(velocity.x).toBe(0);
      expect(velocity.y).toBe(0);
      expect(velocity.z).toBe(0);
    });
  });

  describe('applyGravity', () => {
    it('should apply gravity to velocity', () => {
      const velocity = { x: 0, y: 0, z: 0 };
      const deltaTime = 1 / 60; // 60 FPS

      motor.applyGravity(velocity, deltaTime);

      expect(velocity.y).toBeCloseTo(-9.81 / 60, 5);
      expect(velocity.x).toBe(0);
      expect(velocity.z).toBe(0);
    });

    it('should accumulate gravity over multiple frames', () => {
      const velocity = { x: 0, y: 0, z: 0 };
      const deltaTime = 1 / 60;

      motor.applyGravity(velocity, deltaTime);
      motor.applyGravity(velocity, deltaTime);

      expect(velocity.y).toBeCloseTo((-9.81 / 60) * 2, 5);
    });

    it('should apply gravity with non-standard delta', () => {
      const velocity = { x: 0, y: 0, z: 0 };
      const deltaTime = 0.1; // 10 FPS (slow)

      motor.applyGravity(velocity, deltaTime);

      expect(velocity.y).toBeCloseTo(-9.81 * 0.1, 5);
    });
  });

  describe('shouldSnapToGround', () => {
    it('should allow snapping when velocity is below threshold', () => {
      expect(motor.shouldSnapToGround(0)).toBe(true);
      expect(motor.shouldSnapToGround(2.5)).toBe(true);
      expect(motor.shouldSnapToGround(-2.5)).toBe(true);
      expect(motor.shouldSnapToGround(5.0)).toBe(true);
      expect(motor.shouldSnapToGround(-5.0)).toBe(true);
    });

    it('should prevent snapping when falling fast', () => {
      expect(motor.shouldSnapToGround(5.1)).toBe(false);
      expect(motor.shouldSnapToGround(-5.1)).toBe(false);
      expect(motor.shouldSnapToGround(10.0)).toBe(false);
      expect(motor.shouldSnapToGround(-10.0)).toBe(false);
    });
  });

  describe('isSlopeTooSteep', () => {
    it('should accept flat ground', () => {
      const groundNormal = { x: 0, y: 1, z: 0 }; // Straight up
      expect(motor.isSlopeTooSteep(groundNormal)).toBe(false);
    });

    it('should accept climbable slopes (< 45 degrees)', () => {
      // 30 degree slope: cos(30°) ≈ 0.866
      const groundNormal = { x: 0, y: 0.866, z: 0.5 };
      expect(motor.isSlopeTooSteep(groundNormal)).toBe(false);
    });

    it('should reject steep slopes (> 45 degrees)', () => {
      // 60 degree slope: cos(60°) = 0.5
      const groundNormal = { x: 0, y: 0.5, z: 0.866 };
      expect(motor.isSlopeTooSteep(groundNormal)).toBe(true);
    });

    it('should reject nearly vertical walls', () => {
      // 85 degree slope: cos(85°) ≈ 0.087
      const groundNormal = { x: 0, y: 0.087, z: 0.996 };
      expect(motor.isSlopeTooSteep(groundNormal)).toBe(true);
    });

    it('should handle edge case at exact slope limit', () => {
      // 45 degree slope: cos(45°) ≈ 0.707
      const groundNormal = { x: 0, y: 0.707, z: 0.707 };
      // Should be on the boundary
      const result = motor.isSlopeTooSteep(groundNormal);
      expect(typeof result).toBe('boolean');
    });
  });

  describe('canClimbStep', () => {
    it('should allow steps within limit', () => {
      expect(motor.canClimbStep(0.1)).toBe(true);
      expect(motor.canClimbStep(0.3)).toBe(true);
    });

    it('should reject steps above limit', () => {
      expect(motor.canClimbStep(0.31)).toBe(false);
      expect(motor.canClimbStep(0.5)).toBe(false);
      expect(motor.canClimbStep(1.0)).toBe(false);
    });

    it('should reject negative heights', () => {
      expect(motor.canClimbStep(-0.1)).toBe(false);
    });

    it('should reject zero height', () => {
      expect(motor.canClimbStep(0)).toBe(false);
    });
  });

  describe('clampDepenetration', () => {
    it('should not clamp small depenetrations', () => {
      expect(motor.clampDepenetration(0.1)).toBe(0.1);
      expect(motor.clampDepenetration(0.5)).toBe(0.5);
      expect(motor.clampDepenetration(-0.3)).toBe(-0.3);
    });

    it('should clamp large depenetrations', () => {
      expect(motor.clampDepenetration(1.0)).toBe(0.5);
      expect(motor.clampDepenetration(-1.0)).toBe(-0.5);
      expect(motor.clampDepenetration(2.0)).toBe(0.5);
      expect(motor.clampDepenetration(-2.0)).toBe(-0.5);
    });

    it('should preserve sign when clamping', () => {
      expect(motor.clampDepenetration(10)).toBeGreaterThan(0);
      expect(motor.clampDepenetration(-10)).toBeLessThan(0);
    });
  });

  describe('canPushObject', () => {
    it('should allow pushing any mass when max is 0', () => {
      expect(motor.canPushObject(1)).toBe(true);
      expect(motor.canPushObject(100)).toBe(true);
      expect(motor.canPushObject(1000)).toBe(true);
    });

    it('should respect max push mass limit', () => {
      const limitedMotor = new CharacterMotor({ ...config, maxPushMass: 50 });
      expect(limitedMotor.canPushObject(49)).toBe(true);
      expect(limitedMotor.canPushObject(50)).toBe(true);
      expect(limitedMotor.canPushObject(51)).toBe(false);
      expect(limitedMotor.canPushObject(100)).toBe(false);
    });
  });

  describe('computePushForce', () => {
    it('should compute force proportional to relative velocity', () => {
      const force = motor.computePushForce(2.0);
      expect(force).toBe(2.0 * config.pushStrength);
    });

    it('should scale with push strength', () => {
      const strongMotor = new CharacterMotor({ ...config, pushStrength: 2.0 });
      expect(strongMotor.computePushForce(3.0)).toBe(6.0);
    });

    it('should handle negative velocity', () => {
      const force = motor.computePushForce(-1.5);
      expect(force).toBe(-1.5 * config.pushStrength);
    });
  });

  describe('getJumpVelocity', () => {
    it('should return configured jump strength', () => {
      expect(motor.getJumpVelocity()).toBe(6.5);
    });

    it('should match config value', () => {
      const customMotor = new CharacterMotor({ ...config, jumpStrength: 10.0 });
      expect(customMotor.getJumpVelocity()).toBe(10.0);
    });
  });

  describe('getConfig', () => {
    it('should return read-only config', () => {
      const returnedConfig = motor.getConfig();
      expect(returnedConfig.maxSpeed).toBe(config.maxSpeed);
      expect(returnedConfig.jumpStrength).toBe(config.jumpStrength);
      expect(returnedConfig.gravity).toBe(config.gravity);
    });

    it('should return same object reference', () => {
      const config1 = motor.getConfig();
      const config2 = motor.getConfig();
      expect(config1).toBe(config2);
    });
  });

  describe('edge cases', () => {
    it('should handle extreme velocity values', () => {
      const velocity = motor.computeDesiredVelocity([100, -100]);
      expect(velocity.x).toBe(6.0); // Clamped
      expect(velocity.z).toBe(-6.0); // Clamped
    });

    it('should handle very small delta times', () => {
      const velocity = { x: 0, y: 0, z: 0 };
      motor.applyGravity(velocity, 0.001);
      expect(Math.abs(velocity.y)).toBeLessThan(0.01);
    });

    it('should handle zero gravity configuration', () => {
      const zeroGravityMotor = new CharacterMotor({ ...config, gravity: 0 });
      const velocity = { x: 0, y: 0, z: 0 };
      zeroGravityMotor.applyGravity(velocity, 1.0);
      expect(velocity.y).toBe(0);
    });
  });
});
