/**
 * Collider Registry Unit Tests
 * Tests the entity-to-physics-handles mapping system
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { colliderRegistry } from '../ColliderRegistry';
import type { IEntityPhysicsRefs } from '../types';
import type { RigidBody, Collider } from '@dimforge/rapier3d-compat';

// Mock dependencies
vi.mock('@core/lib/logger', () => ({
  Logger: {
    create: vi.fn(() => ({
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    })),
  },
}));

describe('ColliderRegistry', () => {
  let mockRigidBody: RigidBody;
  let mockCollider1: Collider;
  let mockCollider2: Collider;
  let mockRefs: IEntityPhysicsRefs;

  beforeEach(() => {
    vi.clearAllMocks();
    colliderRegistry.clear();

    // Create mock physics objects
    mockRigidBody = {
      linvel: vi.fn().mockReturnValue({ x: 0, y: 0, z: 0 }),
      setLinvel: vi.fn(),
      applyImpulse: vi.fn(),
    } as any;

    mockCollider1 = {
      parent: null,
      position: { x: 0, y: 1, z: 0 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
    } as any;

    mockCollider2 = {
      parent: null,
      position: { x: 1, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
    } as any;

    mockRefs = {
      rigidBody: mockRigidBody,
      colliders: [mockCollider1, mockCollider2],
    };
  });

  afterEach(() => {
    colliderRegistry.clear();
  });

  describe('registration and lookup', () => {
    it('should register and retrieve entity physics references', () => {
      const entityId = 1;

      colliderRegistry.register(entityId, mockRefs);

      const retrieved = colliderRegistry.getPhysicsRefs(entityId);
      expect(retrieved).toBe(mockRefs);
    });

    it('should return null for unregistered entity', () => {
      const entityId = 999;

      const retrieved = colliderRegistry.getPhysicsRefs(entityId);
      expect(retrieved).toBeNull();
    });

    it('should handle registration without rigid body', () => {
      const entityId = 1;
      const refsWithoutRigidBody = {
        rigidBody: undefined,
        colliders: [mockCollider1],
      };

      colliderRegistry.register(entityId, refsWithoutRigidBody);

      const retrieved = colliderRegistry.getPhysicsRefs(entityId);
      expect(retrieved).toEqual(refsWithoutRigidBody);
    });

    it('should handle registration without any colliders', () => {
      const entityId = 1;
      const refsWithoutColliders = {
        rigidBody: mockRigidBody,
        colliders: [],
      };

      colliderRegistry.register(entityId, refsWithoutColliders);

      const retrieved = colliderRegistry.getPhysicsRefs(entityId);
      expect(retrieved).toEqual(refsWithoutColliders);
    });

    it('should update existing entity registration', () => {
      const entityId = 1;
      const initialRefs = {
        rigidBody: mockRigidBody,
        colliders: [mockCollider1],
      };
      const updatedRefs = {
        rigidBody: mockRigidBody,
        colliders: [mockCollider2], // Different collider
      };

      colliderRegistry.register(entityId, initialRefs);
      colliderRegistry.register(entityId, updatedRefs);

      const retrieved = colliderRegistry.getPhysicsRefs(entityId);
      expect(retrieved).toBe(updatedRefs);
    });
  });

  describe('entity checking', () => {
    it('should return true for registered entities', () => {
      const entityId = 1;
      colliderRegistry.register(entityId, mockRefs);

      const hasEntity = colliderRegistry.hasPhysics(entityId);
      expect(hasEntity).toBe(true);
    });

    it('should return false for unregistered entities', () => {
      const entityId = 999;

      const hasEntity = colliderRegistry.hasPhysics(entityId);
      expect(hasEntity).toBe(false);
    });
  });

  describe('physics component access', () => {
    beforeEach(() => {
      colliderRegistry.register(1, mockRefs);
    });

    it('should get rigid body for registered entity', () => {
      const rigidBody = colliderRegistry.getRigidBody(1);
      expect(rigidBody).toBe(mockRigidBody);
    });

    it('should return null for rigid body of unregistered entity', () => {
      const rigidBody = colliderRegistry.getRigidBody(999);
      expect(rigidBody).toBeNull();
    });

    it('should get colliders for registered entity', () => {
      const colliders = colliderRegistry.getColliders(1);
      expect(colliders).toEqual([mockCollider1, mockCollider2]);
    });

    it('should return empty array for colliders of unregistered entity', () => {
      const colliders = colliderRegistry.getColliders(999);
      expect(colliders).toEqual([]);
    });

    it('should return null for rigid body when entity has none', () => {
      const entityId = 2;
      const refsWithoutRigidBody = {
        rigidBody: undefined,
        colliders: [mockCollider1],
      };
      colliderRegistry.register(entityId, refsWithoutRigidBody);

      const rigidBody = colliderRegistry.getRigidBody(entityId);
      expect(rigidBody).toBeNull();
    });
  });

  describe('unregistration', () => {
    it('should remove registered entity', () => {
      const entityId = 1;
      colliderRegistry.register(entityId, mockRefs);

      colliderRegistry.unregister(entityId);
      expect(colliderRegistry.hasPhysics(entityId)).toBe(false);
    });

    it('should handle unregistering non-existent entity gracefully', () => {
      const entityId = 999;

      expect(() => {
        colliderRegistry.unregister(entityId);
      }).not.toThrow();
    });
  });

  describe('registry management', () => {
    it('should get all registered entity IDs', () => {
      colliderRegistry.register(1, mockRefs);
      colliderRegistry.register(2, mockRefs);
      colliderRegistry.register(3, mockRefs);

      const entityIds = colliderRegistry.getRegisteredEntityIds();
      expect(entityIds).toContain(1);
      expect(entityIds).toContain(2);
      expect(entityIds).toContain(3);
      expect(entityIds).toHaveLength(3);
    });

    it('should return empty array for empty registry', () => {
      const entityIds = colliderRegistry.getRegisteredEntityIds();
      expect(entityIds).toEqual([]);
    });

    it('should clear all registrations', () => {
      colliderRegistry.register(1, mockRefs);
      colliderRegistry.register(2, mockRefs);
      colliderRegistry.register(3, mockRefs);

      colliderRegistry.clear();

      const entityIds = colliderRegistry.getRegisteredEntityIds();
      expect(entityIds).toEqual([]);
    });

    it('should report correct size', () => {
      expect(colliderRegistry.size()).toBe(0);

      colliderRegistry.register(1, mockRefs);
      expect(colliderRegistry.size()).toBe(1);

      colliderRegistry.register(2, mockRefs);
      expect(colliderRegistry.size()).toBe(2);

      colliderRegistry.unregister(1);
      expect(colliderRegistry.size()).toBe(1);
    });
  });

  describe('diagnostics', () => {
    it('should track registration diagnostics', () => {
      // Reset diagnostics to get a clean starting point
      colliderRegistry.resetDiagnostics();
      const initialDiagnostics = colliderRegistry.getDiagnostics();
      expect(initialDiagnostics.totalRegistrations).toBe(0);
      expect(initialDiagnostics.totalUnregistrations).toBe(0);
      expect(initialDiagnostics.dropouts).toBe(0);

      colliderRegistry.register(1, mockRefs);
      const afterRegistration = colliderRegistry.getDiagnostics();
      expect(afterRegistration.totalRegistrations).toBe(1);

      colliderRegistry.unregister(1);
      const afterUnregistration = colliderRegistry.getDiagnostics();
      expect(afterUnregistration.totalUnregistrations).toBe(1);
    });

    it('should track dropouts when accessing non-existent entities', () => {
      colliderRegistry.register(1, mockRefs);

      // Initial diagnostics
      const initialDiagnostics = colliderRegistry.getDiagnostics();
      expect(initialDiagnostics.dropouts).toBe(0);

      // Access non-existent entity should increment dropout counter when expectToExist is true
      colliderRegistry.getCollider(999, true); // This should increment dropout counter
      const afterDropout = colliderRegistry.getDiagnostics();
      expect(afterDropout.dropouts).toBe(1);

      // Multiple accesses with expectToExist should count as multiple dropouts
      colliderRegistry.getCollider(999, true);
      colliderRegistry.getCollider(888, true);
      const afterMultipleDropouts = colliderRegistry.getDiagnostics();
      expect(afterMultipleDropouts.dropouts).toBe(3);
    });

    it('should track registration timestamps', () => {
      const entityId = 1;
      const beforeRegistration = Date.now();

      colliderRegistry.register(entityId, mockRefs);
      const afterRegistration = Date.now();

      const diagnostics = colliderRegistry.getDiagnostics();
      const registrationTime = diagnostics.registrationTimestamps.get(entityId);

      expect(registrationTime).toBeDefined();
      expect(registrationTime).toBeGreaterThanOrEqual(beforeRegistration);
      expect(registrationTime).toBeLessThanOrEqual(afterRegistration);
    });

    it('should clean up timestamp on unregistration', () => {
      const entityId = 1;
      colliderRegistry.register(entityId, mockRefs);

      const beforeUnregistration = colliderRegistry.getDiagnostics();
      expect(beforeUnregistration.registrationTimestamps.has(entityId)).toBe(true);

      colliderRegistry.unregister(entityId);
      const afterUnregistration = colliderRegistry.getDiagnostics();
      expect(afterUnregistration.registrationTimestamps.has(entityId)).toBe(false);
    });

    it('should track last dropout information', () => {
      const dropEntityId = 999;
      const beforeDropout = Date.now();

      colliderRegistry.getCollider(dropEntityId, true); // This should trigger a dropout
      const afterDropout = Date.now();

      const diagnostics = colliderRegistry.getDiagnostics();
      expect(diagnostics.lastDropoutEntity).toBe(dropEntityId);
      expect(diagnostics.lastDropoutTime).toBeGreaterThanOrEqual(beforeDropout);
      expect(diagnostics.lastDropoutTime).toBeLessThanOrEqual(afterDropout);
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle registering same entity multiple times', () => {
      const entityId = 1;
      const refs1 = { ...mockRefs, colliders: [mockCollider1] };
      const refs2 = { ...mockRefs, colliders: [mockCollider2] };

      colliderRegistry.register(entityId, refs1);
      colliderRegistry.register(entityId, refs2);

      // Should update to latest refs
      const retrieved = colliderRegistry.getPhysicsRefs(entityId);
      expect(retrieved).toBe(refs2);
    });

    it('should handle clearing empty registry', () => {
      expect(() => {
        colliderRegistry.clear();
      }).not.toThrow();
    });

    // This test was moved above

    it('should handle null or undefined refs', () => {
      const entityId = 1;

      // The register method expects an IEntityPhysicsRefs, so it won't accept null
      // But it should handle refs with undefined properties
      const invalidRefs = {
        rigidBody: undefined,
        colliders: [],
      };

      expect(() => {
        colliderRegistry.register(entityId, invalidRefs);
      }).not.toThrow();

      // Should register the refs even with undefined properties
      expect(colliderRegistry.hasPhysics(entityId)).toBe(true);
    });

    it('should handle rapid registration/unregistration cycles', () => {
      // Reset diagnostics to start from zero
      colliderRegistry.resetDiagnostics();

      for (let i = 0; i < 100; i++) {
        colliderRegistry.register(i, mockRefs);
        colliderRegistry.unregister(i);
      }

      const diagnostics = colliderRegistry.getDiagnostics();
      expect(diagnostics.totalRegistrations).toBe(100);
      expect(diagnostics.totalUnregistrations).toBe(100);
      expect(colliderRegistry.size()).toBe(0);
    });
  });

  describe('integration scenarios', () => {
    it('should handle typical character controller lifecycle', () => {
      const characterId = 1;
      const otherId = 2;

      // Character enters scene
      colliderRegistry.register(characterId, {
        rigidBody: mockRigidBody,
        colliders: [mockCollider1],
      });

      // Static environment object appears
      colliderRegistry.register(otherId, {
        rigidBody: undefined,
        colliders: [mockCollider2],
      });

      // Character gets components
      expect(colliderRegistry.getRigidBody(characterId)).toBe(mockRigidBody);
      expect(colliderRegistry.getColliders(characterId)).toEqual([mockCollider1]);

      // Environment object gets components
      expect(colliderRegistry.getRigidBody(otherId)).toBeNull();
      expect(colliderRegistry.getColliders(otherId)).toEqual([mockCollider2]);

      // Character leaves scene
      colliderRegistry.unregister(characterId);
      expect(colliderRegistry.hasPhysics(characterId)).toBe(false);
      expect(colliderRegistry.hasPhysics(otherId)).toBe(true);

      // Scene cleanup
      colliderRegistry.clear();
      expect(colliderRegistry.size()).toBe(0);
    });

    it('should handle mixed entity types', () => {
      const entities = [
        { id: 1, type: 'character', hasRigidBody: true, colliderCount: 1 },
        { id: 2, type: 'environment', hasRigidBody: false, colliderCount: 2 },
        { id: 3, type: 'dynamic', hasRigidBody: true, colliderCount: 1 },
        { id: 4, type: 'trigger', hasRigidBody: false, colliderCount: 1 },
      ];

      // Register all entities
      entities.forEach((entity) => {
        const refs: IEntityPhysicsRefs = {
          rigidBody: entity.hasRigidBody ? mockRigidBody : undefined,
          colliders: Array(entity.colliderCount).fill(mockCollider1),
        };
        colliderRegistry.register(entity.id, refs);
      });

      // Verify all are registered
      expect(colliderRegistry.size()).toBe(entities.length);

      // Verify entity counts by type
      let rigidBodyCount = 0;
      let totalColliderCount = 0;
      entities.forEach((entity) => {
        const refs = colliderRegistry.getPhysicsRefs(entity.id)!;
        if (refs.rigidBody) rigidBodyCount++;
        totalColliderCount += refs.colliders.length;
      });

      expect(rigidBodyCount).toBe(2); // character + dynamic
      expect(totalColliderCount).toBe(5); // 1 + 2 + 1 + 1
    });
  });
});
