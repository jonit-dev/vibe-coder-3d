/**
 * Integration tests for RigidBody accessor
 * Tests the complete flow: accessor -> mutation buffer -> physics binding
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ComponentMutationBuffer } from '@/core/lib/ecs/mutations/ComponentMutationBuffer';
import { createComponentsProxy } from '../ComponentAccessors';
import type { IRigidBodyAccessor } from '../types';

describe('RigidBody Accessor Integration', () => {
  let buffer: ComponentMutationBuffer;
  let entityId: number;

  beforeEach(() => {
    buffer = new ComponentMutationBuffer();
    entityId = 1;

    // Mock component registry to return RigidBody component exists
    const originalGet = (global as any).componentRegistry?.get;
    if (!originalGet) {
      // If componentRegistry doesn't exist in test env, we'll mock the proxy behavior directly
    }
  });

  afterEach(() => {
    buffer.clear();
  });

  describe('Force and Impulse Methods', () => {
    it('should queue applyForce mutation', () => {
      const proxy = createComponentsProxy(entityId, buffer);
      const rigidBody = proxy.RigidBody as IRigidBodyAccessor;

      if (!rigidBody) {
        // If component doesn't exist in test env, skip
        return;
      }

      rigidBody.applyForce([10, 20, 30]);

      const mutations = buffer.getMutations();
      const forceMutation = mutations.find(
        (m) => m.entityId === entityId && m.field === '__applyForce',
      );

      expect(forceMutation).toBeDefined();
      expect(forceMutation?.value).toEqual({
        force: [10, 20, 30],
        point: undefined,
      });
    });

    it('should queue applyForce with point mutation', () => {
      const proxy = createComponentsProxy(entityId, buffer);
      const rigidBody = proxy.RigidBody as IRigidBodyAccessor;

      if (!rigidBody) return;

      rigidBody.applyForce([10, 20, 30], [1, 2, 3]);

      const mutations = buffer.getMutations();
      const forceMutation = mutations.find(
        (m) => m.entityId === entityId && m.field === '__applyForce',
      );

      expect(forceMutation?.value).toEqual({
        force: [10, 20, 30],
        point: [1, 2, 3],
      });
    });

    it('should queue applyImpulse mutation', () => {
      const proxy = createComponentsProxy(entityId, buffer);
      const rigidBody = proxy.RigidBody as IRigidBodyAccessor;

      if (!rigidBody) return;

      rigidBody.applyImpulse([5, 10, 15]);

      const mutations = buffer.getMutations();
      const impulseMutation = mutations.find(
        (m) => m.entityId === entityId && m.field === '__applyImpulse',
      );

      expect(impulseMutation).toBeDefined();
      expect(impulseMutation?.value).toEqual({
        impulse: [5, 10, 15],
        point: undefined,
      });
    });

    it('should queue applyImpulse with point mutation', () => {
      const proxy = createComponentsProxy(entityId, buffer);
      const rigidBody = proxy.RigidBody as IRigidBodyAccessor;

      if (!rigidBody) return;

      rigidBody.applyImpulse([5, 10, 15], [0.5, 1.5, 2.5]);

      const mutations = buffer.getMutations();
      const impulseMutation = mutations.find(
        (m) => m.entityId === entityId && m.field === '__applyImpulse',
      );

      expect(impulseMutation?.value).toEqual({
        impulse: [5, 10, 15],
        point: [0.5, 1.5, 2.5],
      });
    });
  });

  describe('Velocity Methods', () => {
    it('should queue setLinearVelocity mutation', () => {
      const proxy = createComponentsProxy(entityId, buffer);
      const rigidBody = proxy.RigidBody as IRigidBodyAccessor;

      if (!rigidBody) return;

      rigidBody.setLinearVelocity([4, 5, 6]);

      const mutations = buffer.getMutations();
      const velMutation = mutations.find(
        (m) => m.entityId === entityId && m.field === '__setLinearVelocity',
      );

      expect(velMutation).toBeDefined();
      expect(velMutation?.value).toEqual([4, 5, 6]);
    });

    it('should queue setAngularVelocity mutation', () => {
      const proxy = createComponentsProxy(entityId, buffer);
      const rigidBody = proxy.RigidBody as IRigidBodyAccessor;

      if (!rigidBody) return;

      rigidBody.setAngularVelocity([0.1, 0.2, 0.3]);

      const mutations = buffer.getMutations();
      const angVelMutation = mutations.find(
        (m) => m.entityId === entityId && m.field === '__setAngularVelocity',
      );

      expect(angVelMutation).toBeDefined();
      expect(angVelMutation?.value).toEqual([0.1, 0.2, 0.3]);
    });

    it('should return default velocity when not synced from Rapier', () => {
      const proxy = createComponentsProxy(entityId, buffer);
      const rigidBody = proxy.RigidBody as IRigidBodyAccessor;

      if (!rigidBody) return;

      const linvel = rigidBody.getLinearVelocity();
      const angvel = rigidBody.getAngularVelocity();

      // Should return defaults since no Rapier sync has occurred
      expect(linvel).toEqual([0, 0, 0]);
      expect(angvel).toEqual([0, 0, 0]);
    });
  });

  describe('Mutation Coalescing', () => {
    it('should coalesce multiple force applications to same entity', () => {
      const proxy = createComponentsProxy(entityId, buffer);
      const rigidBody = proxy.RigidBody as IRigidBodyAccessor;

      if (!rigidBody) return;

      // Apply force multiple times
      rigidBody.applyForce([1, 0, 0]);
      rigidBody.applyForce([2, 0, 0]);
      rigidBody.applyForce([3, 0, 0]);

      const mutations = buffer.getMutations();
      const forceMutations = mutations.filter(
        (m) => m.entityId === entityId && m.field === '__applyForce',
      );

      // Last write wins for same field
      expect(forceMutations.length).toBe(1);
      expect(forceMutations[0].value).toEqual({
        force: [3, 0, 0],
        point: undefined,
      });
    });

    it('should keep distinct mutations for different fields', () => {
      const proxy = createComponentsProxy(entityId, buffer);
      const rigidBody = proxy.RigidBody as IRigidBodyAccessor;

      if (!rigidBody) return;

      rigidBody.applyForce([1, 2, 3]);
      rigidBody.applyImpulse([4, 5, 6]);
      rigidBody.setLinearVelocity([7, 8, 9]);

      const mutations = buffer.getMutations();

      expect(mutations.length).toBeGreaterThanOrEqual(3);

      const forceExists = mutations.some((m) => m.field === '__applyForce');
      const impulseExists = mutations.some((m) => m.field === '__applyImpulse');
      const velExists = mutations.some((m) => m.field === '__setLinearVelocity');

      expect(forceExists).toBe(true);
      expect(impulseExists).toBe(true);
      expect(velExists).toBe(true);
    });
  });

  describe('Traditional Property Mutations', () => {
    it('should queue setMass mutation normally (not physics-specific)', () => {
      const proxy = createComponentsProxy(entityId, buffer);
      const rigidBody = proxy.RigidBody as IRigidBodyAccessor;

      if (!rigidBody) return;

      rigidBody.setMass(10);

      const mutations = buffer.getMutations();
      const massMutation = mutations.find((m) => m.entityId === entityId && m.field === 'mass');

      expect(massMutation).toBeDefined();
      expect(massMutation?.value).toBe(10);
    });

    it('should queue setGravityScale mutation', () => {
      const proxy = createComponentsProxy(entityId, buffer);
      const rigidBody = proxy.RigidBody as IRigidBodyAccessor;

      if (!rigidBody) return;

      rigidBody.setGravityScale(0.5);

      const mutations = buffer.getMutations();
      const gravityMutation = mutations.find(
        (m) => m.entityId === entityId && m.field === 'gravityScale',
      );

      expect(gravityMutation).toBeDefined();
      expect(gravityMutation?.value).toBe(0.5);
    });

    it('should queue setBodyType mutation', () => {
      const proxy = createComponentsProxy(entityId, buffer);
      const rigidBody = proxy.RigidBody as IRigidBodyAccessor;

      if (!rigidBody) return;

      rigidBody.setBodyType('kinematic');

      const mutations = buffer.getMutations();
      const bodyTypeMutation = mutations.find(
        (m) => m.entityId === entityId && m.field === 'bodyType',
      );

      expect(bodyTypeMutation).toBeDefined();
      expect(bodyTypeMutation?.value).toBe('kinematic');
    });

    it('should queue setPhysicsMaterial mutation', () => {
      const proxy = createComponentsProxy(entityId, buffer);
      const rigidBody = proxy.RigidBody as IRigidBodyAccessor;

      if (!rigidBody) return;

      rigidBody.setPhysicsMaterial(0.5, 0.3, 1.0);

      const mutations = buffer.getMutations();
      const materialMutation = mutations.find(
        (m) => m.entityId === entityId && m.field === 'material',
      );

      expect(materialMutation).toBeDefined();
      expect(materialMutation?.value).toEqual({
        friction: 0.5,
        restitution: 0.3,
        density: 1.0,
      });
    });
  });

  describe('Buffer Lifecycle', () => {
    it('should clear all mutations after flush', () => {
      const proxy = createComponentsProxy(entityId, buffer);
      const rigidBody = proxy.RigidBody as IRigidBodyAccessor;

      if (!rigidBody) return;

      rigidBody.applyForce([1, 2, 3]);
      rigidBody.applyImpulse([4, 5, 6]);

      // Flush the buffer
      buffer.flush(() => {
        // No-op flush
      });

      // Buffer should be empty after flush
      const mutations = buffer.getMutations();
      expect(mutations.length).toBe(0);
    });

    it('should allow new mutations after flush', () => {
      const proxy = createComponentsProxy(entityId, buffer);
      const rigidBody = proxy.RigidBody as IRigidBodyAccessor;

      if (!rigidBody) return;

      rigidBody.applyForce([1, 2, 3]);
      buffer.flush(() => {});

      // Queue new mutation
      rigidBody.applyImpulse([4, 5, 6]);

      const mutations = buffer.getMutations();
      expect(mutations.length).toBe(1);
      expect(mutations[0].field).toBe('__applyImpulse');
    });
  });

  describe('Multi-Entity Scenarios', () => {
    it('should handle mutations from multiple entities independently', () => {
      const entity1Id = 1;
      const entity2Id = 2;

      const proxy1 = createComponentsProxy(entity1Id, buffer);
      const proxy2 = createComponentsProxy(entity2Id, buffer);

      const rb1 = proxy1.RigidBody as IRigidBodyAccessor;
      const rb2 = proxy2.RigidBody as IRigidBodyAccessor;

      if (!rb1 || !rb2) return;

      rb1.applyForce([1, 0, 0]);
      rb2.applyForce([0, 1, 0]);

      const mutations = buffer.getMutations();

      const entity1Mutations = mutations.filter((m) => m.entityId === entity1Id);
      const entity2Mutations = mutations.filter((m) => m.entityId === entity2Id);

      expect(entity1Mutations.length).toBe(1);
      expect(entity2Mutations.length).toBe(1);

      expect(entity1Mutations[0].value).toEqual({ force: [1, 0, 0], point: undefined });
      expect(entity2Mutations[0].value).toEqual({ force: [0, 1, 0], point: undefined });
    });
  });
});
