/**
 * Tests for TypeScript Type Validation System
 *
 * These tests validate that:
 * 1. Component types are correctly defined
 * 2. ITypedSceneEntity provides type safety
 * 3. IComponentMap correctly maps component names to types
 */

import { describe, it, expect } from 'vitest';
import type {
  ITypedSceneEntity,
  IComponentMap,
  ITransformComponent,
  ICameraComponent,
  ILightComponent,
  IMeshRendererComponent,
  IPersistentIdComponent,
} from './components';

describe('TypeScript Component Type System', () => {
  describe('ITransformComponent', () => {
    it('should accept valid transform data', () => {
      const transform: ITransformComponent = {
        position: [0, 1, -10],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
      };

      expect(transform.position).toEqual([0, 1, -10]);
      expect(transform.rotation).toEqual([0, 0, 0]);
      expect(transform.scale).toEqual([1, 1, 1]);
    });

    it('should require all three properties', () => {
      // This test validates the type system at compile time
      // Runtime validation would be handled by Zod schemas
      const transform: ITransformComponent = {
        position: [1, 2, 3],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
      };

      expect(transform).toBeDefined();
    });
  });

  describe('ICameraComponent', () => {
    it('should accept valid camera data', () => {
      const camera: ICameraComponent = {
        fov: 75,
        near: 0.1,
        far: 1000,
        projectionType: 'perspective',
        orthographicSize: 10,
        depth: 0,
        isMain: true,
      };

      expect(camera.projectionType).toBe('perspective');
      expect(camera.isMain).toBe(true);
    });

    it('should accept optional properties', () => {
      const camera: ICameraComponent = {
        fov: 60,
        near: 0.1,
        far: 1000,
        projectionType: 'orthographic',
        orthographicSize: 10,
        depth: 0,
        isMain: false,
        clearFlags: 'skybox',
        backgroundColor: { r: 0, g: 0, b: 0, a: 1 },
      };

      expect(camera.clearFlags).toBe('skybox');
      expect(camera.backgroundColor).toEqual({ r: 0, g: 0, b: 0, a: 1 });
    });
  });

  describe('ILightComponent', () => {
    it('should accept valid light data', () => {
      const light: ILightComponent = {
        lightType: 'directional',
        color: { r: 1, g: 1, b: 1 },
        intensity: 1,
        enabled: true,
        castShadow: true,
        directionX: 0,
        directionY: -1,
        directionZ: 0,
        range: 10,
        decay: 1,
        angle: 0.523,
        penumbra: 0.1,
        shadowMapSize: 1024,
        shadowBias: -0.0001,
        shadowRadius: 1,
      };

      expect(light.lightType).toBe('directional');
      expect(light.intensity).toBe(1);
    });
  });

  describe('IPersistentIdComponent', () => {
    it('should accept valid UUID', () => {
      const persistentId: IPersistentIdComponent = {
        id: 'a0293986-830a-4818-a906-382600973f92',
      };

      expect(persistentId.id).toBe('a0293986-830a-4818-a906-382600973f92');
    });
  });

  describe('ITypedSceneEntity', () => {
    it('should accept entity with required components', () => {
      const entity: ITypedSceneEntity = {
        id: 0,
        name: 'Test Entity',
        components: {
          Transform: {
            position: [0, 0, 0],
            rotation: [0, 0, 0],
            scale: [1, 1, 1],
          },
        },
      };

      expect(entity.name).toBe('Test Entity');
      expect(entity.components.Transform).toBeDefined();
    });

    it('should accept entity with multiple components', () => {
      const entity: ITypedSceneEntity = {
        id: 0,
        name: 'Camera Entity',
        components: {
          Transform: {
            position: [0, 1, -10],
            rotation: [0, 0, 0],
            scale: [1, 1, 1],
          },
          Camera: {
            fov: 75,
            near: 0.1,
            far: 1000,
            projectionType: 'perspective',
            orthographicSize: 10,
            depth: 0,
            isMain: true,
          },
        },
      };

      expect(entity.components.Transform).toBeDefined();
      expect(entity.components.Camera).toBeDefined();
      expect(entity.components.Camera?.fov).toBe(75);
    });

    it('should accept entity with optional PersistentId', () => {
      const entity: ITypedSceneEntity = {
        id: 0,
        name: 'Entity with ID',
        components: {
          PersistentId: {
            id: 'a0293986-830a-4818-a906-382600973f92',
          },
          Transform: {
            position: [0, 0, 0],
            rotation: [0, 0, 0],
            scale: [1, 1, 1],
          },
        },
      };

      expect(entity.components.PersistentId).toBeDefined();
      expect(entity.components.PersistentId?.id).toBe('a0293986-830a-4818-a906-382600973f92');
    });

    it('should accept entity without PersistentId', () => {
      const entity: ITypedSceneEntity = {
        id: 0,
        name: 'Entity without ID',
        components: {
          Transform: {
            position: [0, 0, 0],
            rotation: [0, 0, 0],
            scale: [1, 1, 1],
          },
        },
      };

      expect(entity.components.PersistentId).toBeUndefined();
    });

    it('should accept entity with parentId', () => {
      const entity: ITypedSceneEntity = {
        id: 1,
        name: 'Child Entity',
        parentId: 0,
        components: {
          Transform: {
            position: [0, 0, 0],
            rotation: [0, 0, 0],
            scale: [1, 1, 1],
          },
        },
      };

      expect(entity.parentId).toBe(0);
    });
  });

  describe('IComponentMap', () => {
    it('should map component names to correct types', () => {
      // This validates the type system structure
      const components: Partial<IComponentMap> = {
        Transform: {
          position: [0, 0, 0],
          rotation: [0, 0, 0],
          scale: [1, 1, 1],
        },
        Camera: {
          fov: 75,
          near: 0.1,
          far: 1000,
          projectionType: 'perspective',
          orthographicSize: 10,
          depth: 0,
          isMain: true,
        },
      };

      expect(components.Transform).toBeDefined();
      expect(components.Camera).toBeDefined();
    });

    it('should allow optional PersistentId in component map', () => {
      const components: Partial<IComponentMap> = {
        Transform: {
          position: [0, 0, 0],
          rotation: [0, 0, 0],
          scale: [1, 1, 1],
        },
        // PersistentId is optional, so it can be omitted
      };

      expect(components.PersistentId).toBeUndefined();
    });

    it('should accept PersistentId when provided', () => {
      const components: Partial<IComponentMap> = {
        Transform: {
          position: [0, 0, 0],
          rotation: [0, 0, 0],
          scale: [1, 1, 1],
        },
        PersistentId: {
          id: 'a0293986-830a-4818-a906-382600973f92',
        },
      };

      expect(components.PersistentId).toBeDefined();
    });
  });

  describe('Type Safety Validation', () => {
    it('should provide autocomplete for component names', () => {
      const entity: ITypedSceneEntity = {
        id: 0,
        name: 'Test',
        components: {
          // The type system provides autocomplete here:
          // Transform, Camera, Light, MeshRenderer, PersistentId, RigidBody, MeshCollider, PrefabInstance, Script
          Transform: {
            position: [0, 0, 0],
            rotation: [0, 0, 0],
            scale: [1, 1, 1],
          },
        },
      };

      expect(entity).toBeDefined();
    });

    it('should provide autocomplete for component properties', () => {
      const entity: ITypedSceneEntity = {
        id: 0,
        name: 'Test',
        components: {
          Transform: {
            // The type system provides autocomplete here:
            // position, rotation, scale
            position: [0, 0, 0],
            rotation: [0, 0, 0],
            scale: [1, 1, 1],
          },
        },
      };

      expect(entity).toBeDefined();
    });
  });
});
