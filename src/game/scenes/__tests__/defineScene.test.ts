import { describe, it, expect } from 'vitest';
import { defineScene } from '../defineScene';
import type { ISceneData } from '@core/lib/serialization';

describe('defineScene', () => {
  describe('basic functionality', () => {
    it('should create a scene object with Component, metadata, and data', () => {
      const sceneData: ISceneData = {
        metadata: {
          name: 'test',
          version: 1,
          timestamp: '2025-01-01T00:00:00.000Z',
        },
        entities: [],
        materials: [],
        prefabs: [],
      };

      const result = defineScene(sceneData);

      expect(result).toHaveProperty('Component');
      expect(result).toHaveProperty('metadata');
      expect(result).toHaveProperty('data');
    });

    it('should preserve metadata', () => {
      const sceneData: ISceneData = {
        metadata: {
          name: 'test-scene',
          version: 2,
          timestamp: '2025-01-01T12:00:00.000Z',
        },
        entities: [],
        materials: [],
        prefabs: [],
      };

      const result = defineScene(sceneData);

      expect(result.metadata).toEqual(sceneData.metadata);
      expect(result.metadata.name).toBe('test-scene');
      expect(result.metadata.version).toBe(2);
    });

    it('should preserve complete scene data', () => {
      const sceneData: ISceneData = {
        metadata: {
          name: 'complete-scene',
          version: 1,
          timestamp: '2025-01-01T00:00:00.000Z',
        },
        entities: [
          {
            id: 1,
            name: 'Test Entity',
            components: {
              Transform: {
                position: [0, 1, 2],
                rotation: [0, 0, 0],
                scale: [1, 1, 1],
              },
            },
          },
        ],
        materials: [
          {
            id: 'mat1',
            name: 'Material 1',
            shader: 'standard',
            materialType: 'solid',
            color: '#ff0000',
            metalness: 0,
            roughness: 0.7,
            emissive: '#000000',
            emissiveIntensity: 0,
            normalScale: 1,
            occlusionStrength: 1,
            textureOffsetX: 0,
            textureOffsetY: 0,
            textureRepeatX: 1,
            textureRepeatY: 1,
          },
        ],
        prefabs: [
          {
            id: 'prefab1',
            name: 'Prefab 1',
            version: 1,
            root: {
              name: 'Root',
              components: {
                Transform: {
                  position: [0, 0, 0],
                  rotation: [0, 0, 0],
                  scale: [1, 1, 1],
                },
              },
            },
            metadata: {
              createdAt: '2025-01-01T00:00:00.000Z',
              createdFrom: 1,
            },
            dependencies: [],
            tags: [],
          },
        ],
      };

      const result = defineScene(sceneData);

      expect(result.data).toEqual(sceneData);
      expect(result.data.entities).toHaveLength(1);
      expect(result.data.materials).toHaveLength(1);
      expect(result.data.prefabs).toHaveLength(1);
    });
  });

  describe('Component', () => {
    it('should return a React component', () => {
      const sceneData: ISceneData = {
        metadata: {
          name: 'test',
          version: 1,
          timestamp: '2025-01-01T00:00:00.000Z',
        },
        entities: [],
        materials: [],
        prefabs: [],
      };

      const result = defineScene(sceneData);

      expect(typeof result.Component).toBe('function');
    });

    it('should have displayName set to scene name', () => {
      const sceneData: ISceneData = {
        metadata: {
          name: 'my-awesome-scene',
          version: 1,
          timestamp: '2025-01-01T00:00:00.000Z',
        },
        entities: [],
        materials: [],
        prefabs: [],
      };

      const result = defineScene(sceneData);

      expect(result.Component.displayName).toBe('my-awesome-scene');
    });

    it('should be a passive component (returns null)', () => {
      const sceneData: ISceneData = {
        metadata: {
          name: 'passive-test',
          version: 1,
          timestamp: '2025-01-01T00:00:00.000Z',
        },
        entities: [],
        materials: [],
        prefabs: [],
      };

      const result = defineScene(sceneData);
      const rendered = result.Component({});

      expect(rendered).toBeNull();
    });
  });

  describe('data accessibility', () => {
    it('should make entities accessible via data property', () => {
      const sceneData: ISceneData = {
        metadata: {
          name: 'test',
          version: 1,
          timestamp: '2025-01-01T00:00:00.000Z',
        },
        entities: [
          {
            id: 1,
            name: 'Camera',
            components: {
              Transform: {
                position: [0, 5, 10],
                rotation: [0, 0, 0],
                scale: [1, 1, 1],
              },
            },
          },
        ],
        materials: [],
        prefabs: [],
      };

      const result = defineScene(sceneData);

      expect(result.data.entities).toHaveLength(1);
      expect(result.data.entities[0].name).toBe('Camera');
    });

    it('should make materials accessible via data property', () => {
      const sceneData: ISceneData = {
        metadata: {
          name: 'test',
          version: 1,
          timestamp: '2025-01-01T00:00:00.000Z',
        },
        entities: [],
        materials: [
          {
            id: 'default',
            name: 'Default Material',
            shader: 'standard',
            materialType: 'solid',
            color: '#cccccc',
            metalness: 0,
            roughness: 0.7,
            emissive: '#000000',
            emissiveIntensity: 0,
            normalScale: 1,
            occlusionStrength: 1,
            textureOffsetX: 0,
            textureOffsetY: 0,
            textureRepeatX: 1,
            textureRepeatY: 1,
          },
        ],
        prefabs: [],
      };

      const result = defineScene(sceneData);

      expect(result.data.materials).toHaveLength(1);
      expect(result.data.materials[0].id).toBe('default');
    });

    it('should make prefabs accessible via data property', () => {
      const sceneData: ISceneData = {
        metadata: {
          name: 'test',
          version: 1,
          timestamp: '2025-01-01T00:00:00.000Z',
        },
        entities: [],
        materials: [],
        prefabs: [
          {
            id: 'tree',
            name: 'Tree',
            version: 1,
            root: {
              name: 'Tree Root',
              components: {
                Transform: {
                  position: [0, 0, 0],
                  rotation: [0, 0, 0],
                  scale: [1, 1, 1],
                },
              },
            },
            metadata: {
              createdAt: '2025-01-01T00:00:00.000Z',
              createdFrom: 1,
            },
            dependencies: [],
            tags: [],
          },
        ],
      };

      const result = defineScene(sceneData);

      expect(result.data.prefabs).toHaveLength(1);
      expect(result.data.prefabs[0].id).toBe('tree');
    });
  });

  describe('real-world usage', () => {
    it('should match the structure of Test.tsx scene', () => {
      const sceneData: ISceneData = {
        metadata: {
          name: 'test',
          version: 1,
          timestamp: '2025-10-01T23:20:44.771Z',
        },
        entities: [
          {
            id: 5,
            name: 'Main Camera',
            components: {
              PersistentId: {
                id: 'a0293986-830a-4818-a906-382600973f92',
              },
              Transform: {
                position: [0, 1, -10],
                rotation: [0, 0, 0],
                scale: [1, 1, 1],
              },
              Camera: {
                fov: 20,
                near: 0.1,
                far: 100,
                isMain: true,
              },
            },
          },
        ],
        materials: [
          {
            id: 'default',
            name: 'Default Material',
            shader: 'standard',
            materialType: 'solid',
            color: '#cccccc',
            metalness: 0,
            roughness: 0.7,
            emissive: '#000000',
            emissiveIntensity: 0,
            normalScale: 1,
            occlusionStrength: 1,
            textureOffsetX: 0,
            textureOffsetY: 0,
            textureRepeatX: 1,
            textureRepeatY: 1,
          },
        ],
        prefabs: [],
      };

      const result = defineScene(sceneData);

      // Verify structure matches expected format
      expect(result).toHaveProperty('Component');
      expect(result).toHaveProperty('metadata');
      expect(result).toHaveProperty('data');

      // Verify data is accessible for SceneRegistry
      expect(result.data.metadata.name).toBe('test');
      expect(result.data.entities).toHaveLength(1);
      expect(result.data.entities[0].name).toBe('Main Camera');
      expect(result.data.materials).toHaveLength(1);
      expect(result.data.materials[0].id).toBe('default');
    });

    it('should support complex entity hierarchies', () => {
      const sceneData: ISceneData = {
        metadata: {
          name: 'hierarchy-test',
          version: 1,
          timestamp: '2025-01-01T00:00:00.000Z',
        },
        entities: [
          {
            id: 10,
            name: 'Tree 0',
            components: {
              Transform: {
                position: [-2.25, 0, 0],
                rotation: [0, 0, 0],
                scale: [1, 1, 1],
              },
            },
          },
          {
            id: 11,
            name: 'Tree 1',
            parentId: 10,
            components: {
              Transform: {
                position: [2, 0, 0],
                rotation: [0, 0, 0],
                scale: [1, 1, 1],
              },
            },
          },
        ],
        materials: [],
        prefabs: [],
      };

      const result = defineScene(sceneData);

      expect(result.data.entities).toHaveLength(2);
      const child = result.data.entities.find((e) => e.name === 'Tree 1');
      expect(child?.parentId).toBe(10);
    });
  });

  describe('edge cases', () => {
    it('should handle empty entities, materials, and prefabs', () => {
      const sceneData: ISceneData = {
        metadata: {
          name: 'empty-scene',
          version: 1,
          timestamp: '2025-01-01T00:00:00.000Z',
        },
        entities: [],
        materials: [],
        prefabs: [],
      };

      const result = defineScene(sceneData);

      expect(result.data.entities).toEqual([]);
      expect(result.data.materials).toEqual([]);
      expect(result.data.prefabs).toEqual([]);
    });

    it('should preserve special characters in metadata', () => {
      const sceneData: ISceneData = {
        metadata: {
          name: 'test-scene-with-dashes_and_underscores',
          version: 1,
          timestamp: '2025-01-01T00:00:00.000Z',
        },
        entities: [],
        materials: [],
        prefabs: [],
      };

      const result = defineScene(sceneData);

      expect(result.metadata.name).toBe('test-scene-with-dashes_and_underscores');
      expect(result.Component.displayName).toBe('test-scene-with-dashes_and_underscores');
    });
  });
});
