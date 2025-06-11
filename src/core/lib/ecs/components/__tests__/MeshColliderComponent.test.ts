import { describe, it, expect } from 'vitest';
import type { IMeshColliderData } from '../MeshColliderComponent';

describe('MeshColliderComponent', () => {
  describe('IMeshColliderData interface', () => {
    it('should have required properties', () => {
      const collider: IMeshColliderData = {
        enabled: true,
        colliderType: 'box',
        isTrigger: false,
        center: [0, 0, 0],
        size: {
          width: 1,
          height: 1,
          depth: 1,
          radius: 0.5,
          capsuleRadius: 0.5,
          capsuleHeight: 2,
        },
        physicsMaterial: {
          friction: 0.5,
          restitution: 0.3,
          density: 1.0,
        },
      };

      expect(collider.enabled).toBe(true);
      expect(collider.colliderType).toBe('box');
      expect(collider.isTrigger).toBe(false);
      expect(collider.center).toEqual([0, 0, 0]);
    });

    it('should support different collider types', () => {
      const colliderTypes: IMeshColliderData['colliderType'][] = [
        'box',
        'sphere',
        'capsule',
        'convex',
        'mesh',
      ];

      colliderTypes.forEach((colliderType) => {
        const collider: IMeshColliderData = {
          enabled: true,
          colliderType,
          isTrigger: false,
          center: [0, 0, 0],
          size: {
            width: 1,
            height: 1,
            depth: 1,
            radius: 0.5,
            capsuleRadius: 0.5,
            capsuleHeight: 2,
          },
          physicsMaterial: {
            friction: 0.5,
            restitution: 0.3,
            density: 1.0,
          },
        };

        expect(['box', 'sphere', 'capsule', 'convex', 'mesh']).toContain(collider.colliderType);
      });
    });

    it('should handle box collider configuration', () => {
      const boxCollider: IMeshColliderData = {
        enabled: true,
        colliderType: 'box',
        isTrigger: false,
        center: [0, 0.5, 0],
        size: {
          width: 2,
          height: 1,
          depth: 3,
          radius: 0,
          capsuleRadius: 0,
          capsuleHeight: 0,
        },
        physicsMaterial: {
          friction: 0.7,
          restitution: 0.2,
          density: 2.0,
        },
      };

      expect(boxCollider.colliderType).toBe('box');
      expect(boxCollider.size.width).toBe(2);
      expect(boxCollider.size.height).toBe(1);
      expect(boxCollider.size.depth).toBe(3);
      expect(boxCollider.center).toEqual([0, 0.5, 0]);
    });

    it('should handle sphere collider configuration', () => {
      const sphereCollider: IMeshColliderData = {
        enabled: true,
        colliderType: 'sphere',
        isTrigger: false,
        center: [0, 0, 0],
        size: {
          width: 0,
          height: 0,
          depth: 0,
          radius: 1.5,
          capsuleRadius: 0,
          capsuleHeight: 0,
        },
        physicsMaterial: {
          friction: 0.4,
          restitution: 0.8,
          density: 0.5,
        },
      };

      expect(sphereCollider.colliderType).toBe('sphere');
      expect(sphereCollider.size.radius).toBe(1.5);
      expect(sphereCollider.physicsMaterial.restitution).toBe(0.8);
    });

    it('should handle capsule collider configuration', () => {
      const capsuleCollider: IMeshColliderData = {
        enabled: true,
        colliderType: 'capsule',
        isTrigger: false,
        center: [0, 1, 0],
        size: {
          width: 0,
          height: 0,
          depth: 0,
          radius: 0,
          capsuleRadius: 0.5,
          capsuleHeight: 2.0,
        },
        physicsMaterial: {
          friction: 0.6,
          restitution: 0.1,
          density: 1.5,
        },
      };

      expect(capsuleCollider.colliderType).toBe('capsule');
      expect(capsuleCollider.size.capsuleRadius).toBe(0.5);
      expect(capsuleCollider.size.capsuleHeight).toBe(2.0);
    });

    it('should handle trigger colliders', () => {
      const triggerCollider: IMeshColliderData = {
        enabled: true,
        colliderType: 'box',
        isTrigger: true,
        center: [0, 0, 0],
        size: {
          width: 1,
          height: 1,
          depth: 1,
          radius: 0,
          capsuleRadius: 0,
          capsuleHeight: 0,
        },
        physicsMaterial: {
          friction: 0,
          restitution: 0,
          density: 0,
        },
      };

      expect(triggerCollider.isTrigger).toBe(true);
      expect(triggerCollider.physicsMaterial.friction).toBe(0);
      expect(triggerCollider.physicsMaterial.restitution).toBe(0);
    });

    it('should handle disabled colliders', () => {
      const disabledCollider: IMeshColliderData = {
        enabled: false,
        colliderType: 'box',
        isTrigger: false,
        center: [0, 0, 0],
        size: {
          width: 1,
          height: 1,
          depth: 1,
          radius: 0,
          capsuleRadius: 0,
          capsuleHeight: 0,
        },
        physicsMaterial: {
          friction: 0.5,
          restitution: 0.3,
          density: 1.0,
        },
      };

      expect(disabledCollider.enabled).toBe(false);
    });

    it('should handle legacy properties', () => {
      const legacyCollider: IMeshColliderData = {
        enabled: true,
        colliderType: 'mesh',
        isTrigger: false,
        center: [0, 0, 0],
        size: {
          width: 1,
          height: 1,
          depth: 1,
          radius: 0,
          capsuleRadius: 0,
          capsuleHeight: 0,
        },
        physicsMaterial: {
          friction: 0.5,
          restitution: 0.3,
          density: 1.0,
        },
        type: 'legacy-mesh',
        meshId: 'mesh-123',
      };

      expect(legacyCollider.type).toBe('legacy-mesh');
      expect(legacyCollider.meshId).toBe('mesh-123');
    });

    it('should validate physics material properties', () => {
      const collider: IMeshColliderData = {
        enabled: true,
        colliderType: 'box',
        isTrigger: false,
        center: [0, 0, 0],
        size: {
          width: 1,
          height: 1,
          depth: 1,
          radius: 0,
          capsuleRadius: 0,
          capsuleHeight: 0,
        },
        physicsMaterial: {
          friction: 0.8,
          restitution: 0.9,
          density: 2.5,
        },
      };

      expect(collider.physicsMaterial.friction).toBeGreaterThanOrEqual(0);
      expect(collider.physicsMaterial.restitution).toBeGreaterThanOrEqual(0);
      expect(collider.physicsMaterial.restitution).toBeLessThanOrEqual(1);
      expect(collider.physicsMaterial.density).toBeGreaterThan(0);
    });

    it('should handle center positioning', () => {
      const offsetCollider: IMeshColliderData = {
        enabled: true,
        colliderType: 'sphere',
        isTrigger: false,
        center: [1.5, -0.5, 2.0],
        size: {
          width: 0,
          height: 0,
          depth: 0,
          radius: 1,
          capsuleRadius: 0,
          capsuleHeight: 0,
        },
        physicsMaterial: {
          friction: 0.5,
          restitution: 0.3,
          density: 1.0,
        },
      };

      expect(offsetCollider.center).toHaveLength(3);
      expect(offsetCollider.center[0]).toBe(1.5);
      expect(offsetCollider.center[1]).toBe(-0.5);
      expect(offsetCollider.center[2]).toBe(2.0);
    });
  });
});
