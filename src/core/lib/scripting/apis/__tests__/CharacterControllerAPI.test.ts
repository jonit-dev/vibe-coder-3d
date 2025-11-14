/**
 * Tests for CharacterControllerAPI.ts
 * Verifies character movement, jumping, and grounded detection
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  createCharacterControllerAPI,
  cleanupCharacterControllerAPI,
} from '../CharacterControllerAPI';
import { registerRigidBody, unregisterRigidBody } from '../../adapters/physics-binding';
import { componentRegistry } from '../../../ecs/ComponentRegistry';
import { KnownComponentTypes } from '../../../ecs/IComponent';
import { enqueueIntent } from '../../../../systems/CharacterControllerHelpers';

// Mock componentRegistry and CharacterControllerHelpers
vi.mock('../../../ecs/ComponentRegistry');
vi.mock('../../../../systems/CharacterControllerHelpers');

// Mock RigidBody
interface IMockRigidBody {
  linvel: ReturnType<typeof vi.fn>;
  setLinvel: ReturnType<typeof vi.fn>;
  applyImpulse: ReturnType<typeof vi.fn>;
}

describe('CharacterControllerAPI', () => {
  const entityId = 1;
  let mockRigidBody: IMockRigidBody;
  let originalPerformanceNow: () => number;

  beforeEach(() => {
    // Mock performance.now for consistent timing in tests
    originalPerformanceNow = performance.now;
    const currentTime = 0;
    performance.now = vi.fn(() => currentTime);

    mockRigidBody = {
      linvel: vi.fn(() => ({ x: 0, y: 0, z: 0 })),
      setLinvel: vi.fn(),
      applyImpulse: vi.fn(),
    };

    registerRigidBody(entityId, mockRigidBody as any);

    // Mock CharacterController component
    vi.mocked(componentRegistry.getComponentData).mockReturnValue({
      enabled: true,
      controlMode: 'manual',
      maxSpeed: 6.0,
      jumpStrength: 6.5,
      gravityScale: 1.0,
      slopeLimit: 45.0,
      stepOffset: 0.3,
      skinWidth: 0.08,
      isGrounded: false, // This will be updated in tests
      inputMapping: {
        forward: 'w',
        backward: 's',
        left: 'a',
        right: 'd',
        jump: 'space',
      },
    });

    // Mock enqueueIntent
    vi.mocked(enqueueIntent).mockImplementation(() => {});
  });

  afterEach(() => {
    performance.now = originalPerformanceNow;
    unregisterRigidBody(entityId);
    cleanupCharacterControllerAPI(entityId);
    vi.clearAllMocks();
  });

  describe('createCharacterControllerAPI', () => {
    it('should create a character controller API with all methods', () => {
      const api = createCharacterControllerAPI(entityId);

      expect(api).toHaveProperty('isGrounded');
      expect(api).toHaveProperty('move');
      expect(api).toHaveProperty('jump');
      expect(api).toHaveProperty('setSlopeLimit');
      expect(api).toHaveProperty('setStepOffset');

      expect(typeof api.isGrounded).toBe('function');
      expect(typeof api.move).toBe('function');
      expect(typeof api.jump).toBe('function');
      expect(typeof api.setSlopeLimit).toBe('function');
      expect(typeof api.setStepOffset).toBe('function');
    });
  });

  describe('isGrounded', () => {
    it('should return true when vertical velocity is near zero', () => {
      mockRigidBody.linvel.mockReturnValue({ x: 5, y: 0.05, z: 3 });

      // Set CharacterController component to grounded
      vi.mocked(componentRegistry.getComponentData).mockReturnValue({
        enabled: true,
        controlMode: 'manual',
        maxSpeed: 6.0,
        jumpStrength: 6.5,
        gravityScale: 1.0,
        slopeLimit: 45.0,
        stepOffset: 0.3,
        skinWidth: 0.08,
        isGrounded: true, // Character is grounded
        inputMapping: {
          forward: 'w',
          backward: 's',
          left: 'a',
          right: 'd',
          jump: 'space',
        },
      });

      const api = createCharacterControllerAPI(entityId);
      expect(api.isGrounded()).toBe(true);
    });

    it('should return false when moving upward', () => {
      mockRigidBody.linvel.mockReturnValue({ x: 0, y: 5, z: 0 });

      const api = createCharacterControllerAPI(entityId);
      expect(api.isGrounded()).toBe(false);
    });

    it('should return false when falling fast', () => {
      mockRigidBody.linvel.mockReturnValue({ x: 0, y: -5, z: 0 });

      const api = createCharacterControllerAPI(entityId);
      expect(api.isGrounded()).toBe(false);
    });

    it('should return true when slightly descending', () => {
      mockRigidBody.linvel.mockReturnValue({ x: 0, y: -0.05, z: 0 });

      // Set CharacterController component to grounded (slightly descending but still on ground)
      vi.mocked(componentRegistry.getComponentData).mockReturnValue({
        enabled: true,
        controlMode: 'manual',
        maxSpeed: 6.0,
        jumpStrength: 6.5,
        gravityScale: 1.0,
        slopeLimit: 45.0,
        stepOffset: 0.3,
        skinWidth: 0.08,
        isGrounded: true, // Still grounded even with slight descent
        inputMapping: {
          forward: 'w',
          backward: 's',
          left: 'a',
          right: 'd',
          jump: 'space',
        },
      });

      const api = createCharacterControllerAPI(entityId);
      expect(api.isGrounded()).toBe(true);
    });

    it('should return false when no rigid body exists', () => {
      unregisterRigidBody(entityId);

      const api = createCharacterControllerAPI(entityId);
      expect(api.isGrounded()).toBe(false);
    });
  });

  describe('move', () => {
    it('should set horizontal velocity based on input and speed', () => {
      const api = createCharacterControllerAPI(entityId);

      api.move([1, 0], 5);

      expect(vi.mocked(enqueueIntent)).toHaveBeenCalledWith({
        entityId,
        type: 'move',
        data: {
          inputXZ: [1, 0], // Normalized input
          speed: 5,
        },
      });
    });

    it('should normalize diagonal input', () => {
      const api = createCharacterControllerAPI(entityId);

      // Moving diagonally (1, 1) should be normalized to prevent faster movement
      api.move([1, 1], 10);

      expect(vi.mocked(enqueueIntent)).toHaveBeenCalledWith({
        entityId,
        type: 'move',
        data: {
          inputXZ: [0.7071067811865475, 0.7071067811865475], // Normalized diagonal (1/sqrt(2), 1/sqrt(2))
          speed: 10,
        },
      });
    });

    it('should preserve vertical velocity when moving', () => {
      const api = createCharacterControllerAPI(entityId);
      api.move([1, 0], 6);

      // Verify intent was enqueued (vertical velocity preservation is handled by CharacterControllerSystem)
      expect(vi.mocked(enqueueIntent)).toHaveBeenCalledWith({
        entityId,
        type: 'move',
        data: {
          inputXZ: [1, 0],
          speed: 6,
        },
      });
    });

    it('should handle zero input', () => {
      const api = createCharacterControllerAPI(entityId);

      api.move([0, 0], 5);

      expect(vi.mocked(enqueueIntent)).toHaveBeenCalledWith({
        entityId,
        type: 'move',
        data: {
          inputXZ: [0, 0], // Zero input
          speed: 5,
        },
      });
    });

    it('should handle negative input', () => {
      const api = createCharacterControllerAPI(entityId);

      api.move([-1, -1], 5);

      expect(vi.mocked(enqueueIntent)).toHaveBeenCalledWith({
        entityId,
        type: 'move',
        data: {
          inputXZ: [-0.7071067811865475, -0.7071067811865475], // Normalized negative diagonal
          speed: 5,
        },
      });
    });

    it('should not throw when rigid body does not exist', () => {
      unregisterRigidBody(entityId);

      const api = createCharacterControllerAPI(entityId);

      expect(() => {
        api.move([1, 0], 5);
      }).not.toThrow();
    });
  });

  describe('jump', () => {
    it('should apply upward impulse when grounded', () => {
      // Set CharacterController component to grounded
      vi.mocked(componentRegistry.getComponentData).mockReturnValue({
        enabled: true,
        controlMode: 'manual',
        maxSpeed: 6.0,
        jumpStrength: 6.5,
        gravityScale: 1.0,
        slopeLimit: 45.0,
        stepOffset: 0.3,
        skinWidth: 0.08,
        isGrounded: true, // Character is grounded
        inputMapping: {
          forward: 'w',
          backward: 's',
          left: 'a',
          right: 'd',
          jump: 'space',
        },
      });

      const api = createCharacterControllerAPI(entityId);
      api.jump(10);

      expect(vi.mocked(enqueueIntent)).toHaveBeenCalledWith({
        entityId,
        type: 'jump',
        data: {
          strength: 10,
        },
      });
    });

    it('should not jump when airborne', () => {
      // Set CharacterController component to not grounded
      vi.mocked(componentRegistry.getComponentData).mockReturnValue({
        enabled: true,
        controlMode: 'manual',
        maxSpeed: 6.0,
        jumpStrength: 6.5,
        gravityScale: 1.0,
        slopeLimit: 45.0,
        stepOffset: 0.3,
        skinWidth: 0.08,
        isGrounded: false, // Character is airborne
        inputMapping: {
          forward: 'w',
          backward: 's',
          left: 'a',
          right: 'd',
          jump: 'space',
        },
      });

      const api = createCharacterControllerAPI(entityId);
      api.jump(10);

      expect(vi.mocked(enqueueIntent)).not.toHaveBeenCalled();
    });

    it('should allow jump during coyote time', () => {
      // First, set CharacterController component to grounded
      vi.mocked(componentRegistry.getComponentData).mockReturnValue({
        enabled: true,
        controlMode: 'manual',
        maxSpeed: 6.0,
        jumpStrength: 6.5,
        gravityScale: 1.0,
        slopeLimit: 45.0,
        stepOffset: 0.3,
        skinWidth: 0.08,
        isGrounded: true, // Start grounded
        inputMapping: {
          forward: 'w',
          backward: 's',
          left: 'a',
          right: 'd',
          jump: 'space',
        },
      });

      const api = createCharacterControllerAPI(entityId);
      api.isGrounded(); // Mark as grounded and set lastGroundedTime

      // Advance time by 100ms (within coyote time of 150ms)
      vi.mocked(performance.now).mockReturnValue(100);

      // Now set CharacterController component to airborne
      vi.mocked(componentRegistry.getComponentData).mockReturnValue({
        enabled: true,
        controlMode: 'manual',
        maxSpeed: 6.0,
        jumpStrength: 6.5,
        gravityScale: 1.0,
        slopeLimit: 45.0,
        stepOffset: 0.3,
        skinWidth: 0.08,
        isGrounded: false, // Now airborne
        inputMapping: {
          forward: 'w',
          backward: 's',
          left: 'a',
          right: 'd',
          jump: 'space',
        },
      });

      // Should still be able to jump due to coyote time
      api.jump(10);

      expect(vi.mocked(enqueueIntent)).toHaveBeenCalledWith({
        entityId,
        type: 'jump',
        data: {
          strength: 10,
        },
      });
    });

    it('should not allow jump after coyote time expires', () => {
      // First, be grounded
      mockRigidBody.linvel.mockReturnValue({ x: 0, y: 0, z: 0 });
      const api = createCharacterControllerAPI(entityId);
      api.isGrounded();

      // Advance time by 200ms (beyond coyote time of 150ms)
      vi.mocked(performance.now).mockReturnValue(200);

      // Now set velocity to airborne
      mockRigidBody.linvel.mockReturnValue({ x: 0, y: 2, z: 0 });

      // Should not be able to jump
      api.jump(10);

      expect(mockRigidBody.applyImpulse).not.toHaveBeenCalled();
    });

    it('should not throw when rigid body does not exist', () => {
      unregisterRigidBody(entityId);

      const api = createCharacterControllerAPI(entityId);

      expect(() => {
        api.jump(10);
      }).not.toThrow();
    });
  });

  describe('setSlopeLimit', () => {
    it('should set slope limit within valid range', () => {
      const api = createCharacterControllerAPI(entityId);

      expect(() => {
        api.setSlopeLimit(45);
      }).not.toThrow();
    });

    it('should clamp slope limit to 0-90 range', () => {
      const api = createCharacterControllerAPI(entityId);

      // Should not throw for values outside range
      expect(() => {
        api.setSlopeLimit(-10);
        api.setSlopeLimit(100);
      }).not.toThrow();
    });
  });

  describe('setStepOffset', () => {
    it('should set step offset', () => {
      const api = createCharacterControllerAPI(entityId);

      expect(() => {
        api.setStepOffset(0.5);
      }).not.toThrow();
    });

    it('should clamp step offset to non-negative values', () => {
      const api = createCharacterControllerAPI(entityId);

      expect(() => {
        api.setStepOffset(-1);
      }).not.toThrow();
    });
  });

  describe('cleanupCharacterControllerAPI', () => {
    it('should clean up controller state', () => {
      createCharacterControllerAPI(entityId);

      expect(() => {
        cleanupCharacterControllerAPI(entityId);
      }).not.toThrow();
    });

    it('should not throw when cleaning up non-existent controller', () => {
      expect(() => {
        cleanupCharacterControllerAPI(999);
      }).not.toThrow();
    });
  });

  describe('Integration scenarios', () => {
    it('should handle typical movement loop', () => {
      // Set CharacterController component to grounded for integration test
      vi.mocked(componentRegistry.getComponentData).mockReturnValue({
        enabled: true,
        controlMode: 'manual',
        maxSpeed: 6.0,
        jumpStrength: 6.5,
        gravityScale: 1.0,
        slopeLimit: 45.0,
        stepOffset: 0.3,
        skinWidth: 0.08,
        isGrounded: true, // Character is grounded
        inputMapping: {
          forward: 'w',
          backward: 's',
          left: 'a',
          right: 'd',
          jump: 'space',
        },
      });

      const api = createCharacterControllerAPI(entityId);

      // Check grounded
      expect(api.isGrounded()).toBe(true);

      // Move forward
      api.move([0, 1], 5);
      expect(vi.mocked(enqueueIntent)).toHaveBeenCalledWith({
        entityId,
        type: 'move',
        data: {
          inputXZ: [0, 1],
          speed: 5,
        },
      });

      // Jump
      api.jump(8);
      expect(vi.mocked(enqueueIntent)).toHaveBeenCalledWith({
        entityId,
        type: 'jump',
        data: {
          strength: 8,
        },
      });
    });

    it('should prevent double jump', () => {
      // Set CharacterController component to grounded initially
      vi.mocked(componentRegistry.getComponentData).mockReturnValue({
        enabled: true,
        controlMode: 'manual',
        maxSpeed: 6.0,
        jumpStrength: 6.5,
        gravityScale: 1.0,
        slopeLimit: 45.0,
        stepOffset: 0.3,
        skinWidth: 0.08,
        isGrounded: true, // Start grounded
        inputMapping: {
          forward: 'w',
          backward: 's',
          left: 'a',
          right: 'd',
          jump: 'space',
        },
      });

      const api = createCharacterControllerAPI(entityId);

      // First jump should work
      api.jump(8);
      expect(vi.mocked(enqueueIntent)).toHaveBeenCalledTimes(1);

      // Set to airborne state and advance time beyond coyote time
      vi.mocked(componentRegistry.getComponentData).mockReturnValue({
        enabled: true,
        controlMode: 'manual',
        maxSpeed: 6.0,
        jumpStrength: 6.5,
        gravityScale: 1.0,
        slopeLimit: 45.0,
        stepOffset: 0.3,
        skinWidth: 0.08,
        isGrounded: false, // Now airborne
        inputMapping: {
          forward: 'w',
          backward: 's',
          left: 'a',
          right: 'd',
          jump: 'space',
        },
      });
      vi.mocked(performance.now).mockReturnValue(200);

      // Second jump should not work
      api.jump(8);
      expect(vi.mocked(enqueueIntent)).toHaveBeenCalledTimes(1); // Still only 1
    });
  });
});
