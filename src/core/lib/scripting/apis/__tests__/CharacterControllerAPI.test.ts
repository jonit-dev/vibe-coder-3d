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
  });

  afterEach(() => {
    performance.now = originalPerformanceNow;
    unregisterRigidBody(entityId);
    cleanupCharacterControllerAPI(entityId);
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

      api.move([1, 0], 5, 0.016);

      expect(mockRigidBody.setLinvel).toHaveBeenCalledWith({ x: 5, y: 0, z: 0 }, true);
    });

    it('should normalize diagonal input', () => {
      const api = createCharacterControllerAPI(entityId);

      // Moving diagonally (1, 1) should be normalized to prevent faster movement
      api.move([1, 1], 10, 0.016);

      const call = mockRigidBody.setLinvel.mock.calls[0][0];
      const magnitude = Math.sqrt(call.x * call.x + call.z * call.z);

      // Should be approximately 10 (the speed), not 14.14 (sqrt(2) * 10)
      expect(magnitude).toBeCloseTo(10, 1);
    });

    it('should preserve vertical velocity when moving', () => {
      mockRigidBody.linvel.mockReturnValue({ x: 0, y: 5, z: 0 });

      const api = createCharacterControllerAPI(entityId);
      api.move([1, 0], 6, 0.016);

      const call = mockRigidBody.setLinvel.mock.calls[0][0];
      expect(call.y).toBe(5); // Vertical velocity preserved
    });

    it('should handle zero input', () => {
      const api = createCharacterControllerAPI(entityId);

      api.move([0, 0], 5, 0.016);

      expect(mockRigidBody.setLinvel).toHaveBeenCalledWith({ x: 0, y: 0, z: 0 }, true);
    });

    it('should handle negative input', () => {
      const api = createCharacterControllerAPI(entityId);

      api.move([-1, -1], 5, 0.016);

      const call = mockRigidBody.setLinvel.mock.calls[0][0];
      expect(call.x).toBeLessThan(0);
      expect(call.z).toBeLessThan(0);
    });

    it('should not throw when rigid body does not exist', () => {
      unregisterRigidBody(entityId);

      const api = createCharacterControllerAPI(entityId);

      expect(() => {
        api.move([1, 0], 5, 0.016);
      }).not.toThrow();
    });
  });

  describe('jump', () => {
    it('should apply upward impulse when grounded', () => {
      // Set velocity to indicate grounded state
      mockRigidBody.linvel.mockReturnValue({ x: 0, y: 0, z: 0 });

      const api = createCharacterControllerAPI(entityId);
      api.jump(10);

      expect(mockRigidBody.applyImpulse).toHaveBeenCalledWith({ x: 0, y: 10, z: 0 }, true);
    });

    it('should not jump when airborne', () => {
      // Set velocity to indicate airborne state
      mockRigidBody.linvel.mockReturnValue({ x: 0, y: 5, z: 0 });

      const api = createCharacterControllerAPI(entityId);
      api.jump(10);

      expect(mockRigidBody.applyImpulse).not.toHaveBeenCalled();
    });

    it('should allow jump during coyote time', () => {
      // First, be grounded
      mockRigidBody.linvel.mockReturnValue({ x: 0, y: 0, z: 0 });
      const api = createCharacterControllerAPI(entityId);
      api.isGrounded(); // Mark as grounded

      // Advance time by 100ms (within coyote time of 150ms)
      vi.mocked(performance.now).mockReturnValue(100);

      // Now set velocity to airborne
      mockRigidBody.linvel.mockReturnValue({ x: 0, y: 2, z: 0 });

      // Should still be able to jump due to coyote time
      api.jump(10);

      expect(mockRigidBody.applyImpulse).toHaveBeenCalled();
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
      mockRigidBody.linvel.mockReturnValue({ x: 0, y: 0, z: 0 });

      const api = createCharacterControllerAPI(entityId);

      // Check grounded
      expect(api.isGrounded()).toBe(true);

      // Move forward
      api.move([0, 1], 5, 0.016);
      expect(mockRigidBody.setLinvel).toHaveBeenCalled();

      // Jump
      api.jump(8);
      expect(mockRigidBody.applyImpulse).toHaveBeenCalled();
    });

    it('should prevent double jump', () => {
      mockRigidBody.linvel.mockReturnValue({ x: 0, y: 0, z: 0 });

      const api = createCharacterControllerAPI(entityId);

      // First jump should work
      api.jump(8);
      expect(mockRigidBody.applyImpulse).toHaveBeenCalledTimes(1);

      // Set to airborne state
      mockRigidBody.linvel.mockReturnValue({ x: 0, y: 5, z: 0 });

      // Advance time beyond coyote time
      vi.mocked(performance.now).mockReturnValue(200);

      // Second jump should not work
      api.jump(8);
      expect(mockRigidBody.applyImpulse).toHaveBeenCalledTimes(1); // Still only 1
    });
  });
});
