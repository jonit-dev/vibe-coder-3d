import { describe, it, expect } from 'vitest';
import type { IRigidBodyData } from '../RigidBodyComponent';

describe('RigidBodyComponent', () => {
  describe('IRigidBodyData interface', () => {
    it('should have required properties', () => {
      const rigidBody: IRigidBodyData = {
        type: 'dynamic',
        mass: 1.0,
      };

      expect(rigidBody.type).toBe('dynamic');
      expect(rigidBody.mass).toBe(1.0);
    });

    it('should support optional properties', () => {
      const rigidBody: IRigidBodyData = {
        type: 'dynamic',
        mass: 2.5,
        isStatic: false,
        restitution: 0.8,
        friction: 0.5,
        enabled: true,
        bodyType: 'dynamic',
        gravityScale: 1.0,
        canSleep: true,
        material: {
          friction: 0.6,
          restitution: 0.7,
          density: 1.2,
        },
      };

      expect(rigidBody.isStatic).toBe(false);
      expect(rigidBody.restitution).toBe(0.8);
      expect(rigidBody.friction).toBe(0.5);
      expect(rigidBody.enabled).toBe(true);
      expect(rigidBody.bodyType).toBe('dynamic');
      expect(rigidBody.gravityScale).toBe(1.0);
      expect(rigidBody.canSleep).toBe(true);
      expect(rigidBody.material?.friction).toBe(0.6);
      expect(rigidBody.material?.restitution).toBe(0.7);
      expect(rigidBody.material?.density).toBe(1.2);
    });

    it('should support different body types', () => {
      const bodyTypes: IRigidBodyData['bodyType'][] = ['dynamic', 'kinematic', 'fixed'];

      bodyTypes.forEach((bodyType) => {
        const rigidBody: IRigidBodyData = {
          type: 'test',
          mass: 1.0,
          bodyType,
        };

        expect(['dynamic', 'kinematic', 'fixed']).toContain(rigidBody.bodyType);
      });
    });

    it('should handle fixed body configuration', () => {
      const fixedBody: IRigidBodyData = {
        type: 'fixed',
        mass: 0,
        isStatic: true,
        bodyType: 'fixed',
        canSleep: false,
      };

      expect(fixedBody.isStatic).toBe(true);
      expect(fixedBody.mass).toBe(0);
      expect(fixedBody.bodyType).toBe('fixed');
      expect(fixedBody.canSleep).toBe(false);
    });

    it('should handle kinematic body configuration', () => {
      const kinematicBody: IRigidBodyData = {
        type: 'kinematic',
        mass: 0,
        bodyType: 'kinematic',
        gravityScale: 0,
      };

      expect(kinematicBody.bodyType).toBe('kinematic');
      expect(kinematicBody.mass).toBe(0);
      expect(kinematicBody.gravityScale).toBe(0);
    });

    it('should handle dynamic body configuration', () => {
      const dynamicBody: IRigidBodyData = {
        type: 'dynamic',
        mass: 5.0,
        bodyType: 'dynamic',
        gravityScale: 1.0,
        canSleep: true,
        material: {
          friction: 0.5,
          restitution: 0.3,
          density: 2.0,
        },
      };

      expect(dynamicBody.bodyType).toBe('dynamic');
      expect(dynamicBody.mass).toBeGreaterThan(0);
      expect(dynamicBody.gravityScale).toBe(1.0);
      expect(dynamicBody.canSleep).toBe(true);
      expect(dynamicBody.material?.density).toBe(2.0);
    });

    it('should validate material properties', () => {
      const rigidBody: IRigidBodyData = {
        type: 'dynamic',
        mass: 1.0,
        material: {
          friction: 0.5,
          restitution: 0.8,
          density: 1.0,
        },
      };

      expect(rigidBody.material?.friction).toBeGreaterThanOrEqual(0);
      expect(rigidBody.material?.restitution).toBeGreaterThanOrEqual(0);
      expect(rigidBody.material?.restitution).toBeLessThanOrEqual(1);
      expect(rigidBody.material?.density).toBeGreaterThan(0);
    });

    it('should handle physics scaling properties', () => {
      const rigidBody: IRigidBodyData = {
        type: 'dynamic',
        mass: 1.0,
        gravityScale: 2.0,
        restitution: 0.9,
        friction: 0.7,
      };

      expect(rigidBody.gravityScale).toBe(2.0);
      expect(rigidBody.restitution).toBeLessThanOrEqual(1.0);
      expect(rigidBody.friction).toBeGreaterThanOrEqual(0);
    });

    it('should handle disabled state', () => {
      const disabledBody: IRigidBodyData = {
        type: 'dynamic',
        mass: 1.0,
        enabled: false,
      };

      expect(disabledBody.enabled).toBe(false);
    });
  });
});
