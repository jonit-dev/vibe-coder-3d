/**
 * Tests for physics-binding.ts
 * Verifies that physics mutations are correctly processed and applied to Rapier world
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentMutationBuffer } from '@/core/lib/ecs/mutations/ComponentMutationBuffer';
import {
  processPhysicsMutations,
  syncVelocitiesFromRapier,
  registerRigidBody,
  unregisterRigidBody,
  getRigidBody,
  entityToRigidBodyMap,
} from '../physics-binding';

// Mock Rapier types
interface IMockRigidBody {
  addForce: ReturnType<typeof vi.fn>;
  addForceAtPoint: ReturnType<typeof vi.fn>;
  applyImpulse: ReturnType<typeof vi.fn>;
  applyImpulseAtPoint: ReturnType<typeof vi.fn>;
  setLinvel: ReturnType<typeof vi.fn>;
  setAngvel: ReturnType<typeof vi.fn>;
  linvel: ReturnType<typeof vi.fn>;
  angvel: ReturnType<typeof vi.fn>;
}

describe('physics-binding', () => {
  let buffer: ComponentMutationBuffer;
  let mockWorld: any;
  let mockRigidBody: IMockRigidBody;

  beforeEach(() => {
    buffer = new ComponentMutationBuffer();
    mockRigidBody = {
      addForce: vi.fn(),
      addForceAtPoint: vi.fn(),
      applyImpulse: vi.fn(),
      applyImpulseAtPoint: vi.fn(),
      setLinvel: vi.fn(),
      setAngvel: vi.fn(),
      linvel: vi.fn(() => ({ x: 1, y: 2, z: 3 })),
      angvel: vi.fn(() => ({ x: 0.1, y: 0.2, z: 0.3 })),
    };
    mockWorld = {};

    // Clear the entity-to-rigid-body map
    entityToRigidBodyMap.clear();
  });

  describe('registerRigidBody / unregisterRigidBody', () => {
    it('should register a rigid body for an entity', () => {
      const entityId = 1;
      registerRigidBody(entityId, mockRigidBody as any);

      expect(getRigidBody(entityId)).toBe(mockRigidBody);
    });

    it('should unregister a rigid body for an entity', () => {
      const entityId = 1;
      registerRigidBody(entityId, mockRigidBody as any);
      unregisterRigidBody(entityId);

      expect(getRigidBody(entityId)).toBeUndefined();
    });

    it('should return undefined for unregistered entity', () => {
      expect(getRigidBody(999)).toBeUndefined();
    });
  });

  describe('processPhysicsMutations', () => {
    beforeEach(() => {
      const entityId = 1;
      registerRigidBody(entityId, mockRigidBody as any);
    });

    it('should apply force without point', () => {
      buffer.queue(1, 'RigidBody', '__applyForce', {
        force: [10, 20, 30],
      });

      processPhysicsMutations(buffer, mockWorld);

      expect(mockRigidBody.addForce).toHaveBeenCalledWith({ x: 10, y: 20, z: 30 }, true);
    });

    it('should apply force at point', () => {
      buffer.queue(1, 'RigidBody', '__applyForce', {
        force: [10, 20, 30],
        point: [1, 2, 3],
      });

      processPhysicsMutations(buffer, mockWorld);

      expect(mockRigidBody.addForceAtPoint).toHaveBeenCalledWith(
        { x: 10, y: 20, z: 30 },
        { x: 1, y: 2, z: 3 },
        true,
      );
    });

    it('should apply impulse without point', () => {
      buffer.queue(1, 'RigidBody', '__applyImpulse', {
        impulse: [5, 10, 15],
      });

      processPhysicsMutations(buffer, mockWorld);

      expect(mockRigidBody.applyImpulse).toHaveBeenCalledWith({ x: 5, y: 10, z: 15 }, true);
    });

    it('should apply impulse at point', () => {
      buffer.queue(1, 'RigidBody', '__applyImpulse', {
        impulse: [5, 10, 15],
        point: [0.5, 1.5, 2.5],
      });

      processPhysicsMutations(buffer, mockWorld);

      expect(mockRigidBody.applyImpulseAtPoint).toHaveBeenCalledWith(
        { x: 5, y: 10, z: 15 },
        { x: 0.5, y: 1.5, z: 2.5 },
        true,
      );
    });

    it('should set linear velocity', () => {
      buffer.queue(1, 'RigidBody', '__setLinearVelocity', [4, 5, 6]);

      processPhysicsMutations(buffer, mockWorld);

      expect(mockRigidBody.setLinvel).toHaveBeenCalledWith({ x: 4, y: 5, z: 6 }, true);
    });

    it('should set angular velocity', () => {
      buffer.queue(1, 'RigidBody', '__setAngularVelocity', [0.1, 0.2, 0.3]);

      processPhysicsMutations(buffer, mockWorld);

      expect(mockRigidBody.setAngvel).toHaveBeenCalledWith({ x: 0.1, y: 0.2, z: 0.3 }, true);
    });

    it('should skip mutations for entities without rigid bodies', () => {
      buffer.queue(999, 'RigidBody', '__applyForce', {
        force: [10, 20, 30],
      });

      // Should not throw
      expect(() => {
        processPhysicsMutations(buffer, mockWorld);
      }).not.toThrow();

      // No methods should be called
      expect(mockRigidBody.addForce).not.toHaveBeenCalled();
    });

    it('should skip non-physics mutations', () => {
      buffer.queue(1, 'RigidBody', 'mass', 10);

      processPhysicsMutations(buffer, mockWorld);

      // No physics methods should be called
      expect(mockRigidBody.addForce).not.toHaveBeenCalled();
      expect(mockRigidBody.applyImpulse).not.toHaveBeenCalled();
      expect(mockRigidBody.setLinvel).not.toHaveBeenCalled();
      expect(mockRigidBody.setAngvel).not.toHaveBeenCalled();
    });

    it('should handle multiple mutations in sequence', () => {
      buffer.queue(1, 'RigidBody', '__applyForce', { force: [1, 2, 3] });
      buffer.queue(1, 'RigidBody', '__applyImpulse', { impulse: [4, 5, 6] });
      buffer.queue(1, 'RigidBody', '__setLinearVelocity', [7, 8, 9]);

      processPhysicsMutations(buffer, mockWorld);

      expect(mockRigidBody.addForce).toHaveBeenCalledTimes(1);
      expect(mockRigidBody.applyImpulse).toHaveBeenCalledTimes(1);
      expect(mockRigidBody.setLinvel).toHaveBeenCalledTimes(1);
    });

    it('should handle errors gracefully', () => {
      mockRigidBody.addForce.mockImplementation(() => {
        throw new Error('Rapier error');
      });

      buffer.queue(1, 'RigidBody', '__applyForce', { force: [1, 2, 3] });

      // Should not throw
      expect(() => {
        processPhysicsMutations(buffer, mockWorld);
      }).not.toThrow();
    });
  });

  describe('syncVelocitiesFromRapier', () => {
    it('should sync velocities from Rapier to ECS', () => {
      // We need to mock componentRegistry for this test
      // For now, we'll just verify the function doesn't throw
      const entityId = 1;
      registerRigidBody(entityId, mockRigidBody as any);

      expect(() => {
        syncVelocitiesFromRapier();
      }).not.toThrow();

      // Verify velocity getters were called
      expect(mockRigidBody.linvel).toHaveBeenCalled();
      expect(mockRigidBody.angvel).toHaveBeenCalled();
    });

    it('should handle entities without component data', () => {
      const entityId = 999;
      registerRigidBody(entityId, mockRigidBody as any);

      // Should not throw even if entity doesn't have RigidBody component
      expect(() => {
        syncVelocitiesFromRapier();
      }).not.toThrow();
    });
  });
});
