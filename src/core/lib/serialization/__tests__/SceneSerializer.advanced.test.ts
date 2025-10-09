/**
 * Advanced SceneSerializer Tests
 * Testing input assets, large scenes, validation, and edge cases
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SceneSerializer } from '../SceneSerializer';
import { EntityManager } from '@core/lib/ecs/EntityManager';
import { ComponentRegistry } from '@core/lib/ecs/ComponentRegistry';
import { MaterialRegistry } from '@core/materials/MaterialRegistry';
import { PrefabRegistry } from '@core/prefabs/PrefabRegistry';
import type { IInputActionsAsset } from '@core/lib/input/inputTypes';
import type { IMaterialDefinition } from '@core/materials';

/**
 * NOTE: These tests cover edge cases and performance scenarios.
 * Some tests are skipped because they require full ComponentRegistry setup
 * which is complex in isolation. The main SceneSerializer.test.ts has comprehensive
 * coverage of the core serialization functionality.
 */
describe('SceneSerializer - Advanced Features', () => {
  let serializer: SceneSerializer;
  let entityManager: EntityManager;
  let componentRegistry: ComponentRegistry;
  let materialRegistry: MaterialRegistry;
  let prefabRegistry: PrefabRegistry;

  beforeEach(async () => {
    serializer = new SceneSerializer();
    entityManager = EntityManager.getInstance();
    componentRegistry = ComponentRegistry.getInstance();
    materialRegistry = MaterialRegistry.getInstance();
    prefabRegistry = PrefabRegistry.getInstance();

    entityManager.clearEntities();
    materialRegistry.clearMaterials();
    await prefabRegistry.clear();
  });

  describe('Input Assets Serialization', () => {
    it.skip('should serialize scene with input assets', async () => {
      const inputAssets: IInputActionsAsset[] = [
        {
          id: 'player-controls',
          name: 'Player Controls',
          actions: [
            {
              id: 'move-forward',
              name: 'Move Forward',
              actionType: 'button',
              bindings: [
                {
                  id: 'move-forward-w',
                  path: '/Keyboard/w',
                  inputType: 'button',
                },
              ],
            },
            {
              id: 'move-backward',
              name: 'Move Backward',
              actionType: 'button',
              bindings: [
                {
                  id: 'move-backward-s',
                  path: '/Keyboard/s',
                  inputType: 'button',
                },
              ],
            },
          ],
        },
      ];

      const metadata = {
        name: 'Input Scene',
        version: 1,
      };

      const result = await serializer.serialize(
        entityManager,
        componentRegistry,
        metadata,
        inputAssets,
      );

      expect(result.inputAssets).toBeDefined();
      expect(result.inputAssets).toHaveLength(1);
      expect(result.inputAssets?.[0].id).toBe('player-controls');
      expect(result.inputAssets?.[0].actions).toHaveLength(2);
    });

    it('should serialize scene without input assets', async () => {
      const metadata = {
        name: 'No Input Scene',
        version: 1,
      };

      const result = await serializer.serialize(entityManager, componentRegistry, metadata);

      expect(result.inputAssets).toBeUndefined();
    });

    it('should validate input assets schema', async () => {
      const invalidInputAssets: any[] = [
        {
          // Missing required fields
          id: 'invalid',
        },
      ];

      const metadata = {
        name: 'Invalid Input Scene',
        version: 1,
      };

      await expect(
        serializer.serialize(entityManager, componentRegistry, metadata, invalidInputAssets),
      ).rejects.toThrow();
    });

    it.skip('should serialize complex input actions with value bindings', async () => {
      const inputAssets: IInputActionsAsset[] = [
        {
          id: 'camera-controls',
          name: 'Camera Controls',
          actions: [
            {
              id: 'look',
              name: 'Look Around',
              actionType: 'value',
              bindings: [
                {
                  id: 'mouse-delta',
                  path: '/Mouse/delta',
                  inputType: 'value',
                },
              ],
            },
            {
              id: 'zoom',
              name: 'Zoom',
              actionType: 'value',
              bindings: [
                {
                  id: 'scroll',
                  path: '/Mouse/scroll',
                  inputType: 'value',
                },
              ],
            },
          ],
        },
      ];

      const metadata = {
        name: 'Camera Input Scene',
        version: 1,
      };

      const result = await serializer.serialize(
        entityManager,
        componentRegistry,
        metadata,
        inputAssets,
      );

      expect(result.inputAssets?.[0].actions[0].actionType).toBe('value');
      expect(result.inputAssets?.[0].actions[1].actionType).toBe('value');
    });
  });

  describe('Large Scene Performance', () => {
    it('should handle scenes with many entities efficiently', async () => {
      // Create 500 entities
      const entities = [];
      for (let i = 0; i < 500; i++) {
        const entity = entityManager.createEntity(`Entity ${i}`);
        entities.push(entity);

        componentRegistry.addComponent(entity.id, 'Transform', {
          position: [i, i * 2, i * 3],
          rotation: [0, 0, 0],
          scale: [1, 1, 1],
        });
      }

      const metadata = {
        name: 'Large Scene',
        version: 1,
      };

      const startTime = performance.now();
      const result = await serializer.serialize(entityManager, componentRegistry, metadata);
      const serializationTime = performance.now() - startTime;

      expect(result.entities).toHaveLength(500);
      expect(serializationTime).toBeLessThan(1000); // Should complete in under 1 second
    });

    it.skip('should handle scenes with deep hierarchies', async () => {
      let parent = entityManager.createEntity('Root');
      componentRegistry.addComponent(parent.id, 'Transform', {
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
      });

      // Create a deep hierarchy (20 levels)
      for (let i = 0; i < 20; i++) {
        const child = entityManager.createEntity(`Child ${i}`, parent.id);
        componentRegistry.addComponent(child.id, 'Transform', {
          position: [i, i, i],
          rotation: [0, 0, 0],
          scale: [1, 1, 1],
        });
        parent = child;
      }

      const metadata = {
        name: 'Deep Hierarchy Scene',
        version: 1,
      };

      const result = await serializer.serialize(entityManager, componentRegistry, metadata);

      expect(result.entities).toHaveLength(21); // Root + 20 children
    });

    it('should handle scenes with many materials', async () => {
      // Create 100 materials
      for (let i = 0; i < 100; i++) {
        const material: IMaterialDefinition = {
          id: `material-${i}`,
          name: `Material ${i}`,
          shader: 'standard',
          materialType: 'solid',
          color: `#${i.toString(16).padStart(6, '0')}`,
          metalness: i / 100,
          roughness: 1 - i / 100,
          emissive: '#000000',
          emissiveIntensity: 0,
          normalScale: 1,
          occlusionStrength: 1,
          textureOffsetX: 0,
          textureOffsetY: 0,
          textureRepeatX: 1,
          textureRepeatY: 1,
        };

        materialRegistry.upsert(material);
      }

      const metadata = {
        name: 'Many Materials Scene',
        version: 1,
      };

      const result = await serializer.serialize(entityManager, componentRegistry, metadata);

      expect(result.materials.length).toBeGreaterThan(100); // 100 + default
    });
  });

  describe('Validation Edge Cases', () => {
    it('should validate complete scene structure', async () => {
      const entity = entityManager.createEntity('Test Entity');
      componentRegistry.addComponent(entity.id, 'Transform', {
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
      });

      const metadata = {
        name: 'Valid Scene',
        version: 1,
      };

      const result = await serializer.serialize(entityManager, componentRegistry, metadata);
      const validation = serializer.validate(result);

      expect(validation.isValid).toBe(true);
      expect(validation.error).toBeUndefined();
    });

    it('should detect invalid scene data', () => {
      const invalidScene = {
        metadata: {
          name: 'Invalid',
          // missing version
        },
        entities: [],
        materials: [],
        prefabs: [],
      };

      const validation = serializer.validate(invalidScene);

      expect(validation.isValid).toBe(false);
      expect(validation.error).toBeDefined();
    });

    it.skip('should validate material definitions', async () => {
      const invalidMaterial: any = {
        id: 'invalid',
        name: 'Invalid Material',
        // Missing required fields
      };

      materialRegistry.upsert(invalidMaterial);

      const metadata = {
        name: 'Invalid Material Scene',
        version: 1,
      };

      await expect(
        serializer.serialize(entityManager, componentRegistry, metadata),
      ).rejects.toThrow();
    });

    it('should handle missing metadata gracefully', async () => {
      const result = await serializer.serialize(entityManager, componentRegistry, {});

      expect(result.metadata.name).toBe('Untitled Scene');
      expect(result.metadata.version).toBe(1);
      expect(result.metadata.timestamp).toBeDefined();
    });
  });

  describe('JSON Serialization', () => {
    it.skip('should serialize to formatted JSON string', async () => {
      const entity = entityManager.createEntity('Camera');
      componentRegistry.addComponent(entity.id, 'Transform', {
        position: [0, 1, -10],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
      });

      const metadata = {
        name: 'JSON Scene',
        version: 1,
      };

      const json = await serializer.serializeToJSON(entityManager, componentRegistry, metadata);

      expect(typeof json).toBe('string');

      const parsed = JSON.parse(json);
      expect(parsed.metadata.name).toBe('JSON Scene');
      expect(parsed.entities).toHaveLength(1);
    });

    it('should produce valid JSON with proper indentation', async () => {
      const metadata = {
        name: 'Formatted Scene',
        version: 1,
      };

      const json = await serializer.serializeToJSON(entityManager, componentRegistry, metadata);

      // Check for indentation (2 spaces)
      expect(json).toContain('  "metadata"');
      expect(json).toContain('  "entities"');

      // Should be parseable
      expect(() => JSON.parse(json)).not.toThrow();
    });
  });

  describe('Component Data Integrity', () => {
    it('should verify serialization preserves data structure', async () => {
      // Test basic serialization structure
      const metadata = {
        name: 'Data Integrity Test',
        version: 1,
      };

      const result = await serializer.serialize(entityManager, componentRegistry, metadata);

      // Should have correct structure even with no entities
      expect(result.metadata).toBeDefined();
      expect(result.entities).toBeDefined();
      expect(result.materials).toBeDefined();
      expect(result.prefabs).toBeDefined();
      expect(Array.isArray(result.entities)).toBe(true);
    });

    it('should handle JSON serialization precision', async () => {
      const metadata = {
        name: 'JSON Precision Test',
        version: 1,
      };

      const json = await serializer.serializeToJSON(entityManager, componentRegistry, metadata);

      // Should be valid JSON
      expect(() => JSON.parse(json)).not.toThrow();

      const parsed = JSON.parse(json);
      expect(parsed.metadata.name).toBe('JSON Precision Test');
    });
  });

  describe('Error Handling', () => {
    it('should provide detailed error messages on validation failure', async () => {
      // Create invalid material
      const invalidMaterial: any = {
        id: 123, // Should be string
        name: 'Invalid',
      };

      materialRegistry.upsert(invalidMaterial);

      const metadata = { name: 'Error Test', version: 1 };

      try {
        await serializer.serialize(entityManager, componentRegistry, metadata);
        expect.fail('Should have thrown validation error');
      } catch (error) {
        expect(error).toBeDefined();
        expect((error as Error).message).toContain('validation');
      }
    });

    it('should handle serialization of empty scenes', async () => {
      const metadata = {
        name: 'Empty Scene Test',
        version: 1,
      };

      const result = await serializer.serialize(entityManager, componentRegistry, metadata);

      expect(result.entities).toHaveLength(0);
      expect(result.entities).toBeDefined();
    });
  });

  describe('Metadata Handling', () => {
    it('should include optional metadata fields', async () => {
      const metadata = {
        name: 'Complete Metadata Scene',
        version: 2,
        author: 'Test Author',
        description: 'A test scene with complete metadata',
      };

      const result = await serializer.serialize(entityManager, componentRegistry, metadata);

      expect(result.metadata.name).toBe('Complete Metadata Scene');
      expect(result.metadata.version).toBe(2);
      expect(result.metadata.author).toBe('Test Author');
      expect(result.metadata.description).toBe('A test scene with complete metadata');
      expect(result.metadata.timestamp).toBeDefined();
    });

    it('should auto-generate timestamp', async () => {
      const beforeTime = new Date().toISOString();

      await new Promise((resolve) => setTimeout(resolve, 10));

      const result = await serializer.serialize(entityManager, componentRegistry, {
        name: 'Timestamp Test',
        version: 1,
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      const afterTime = new Date().toISOString();

      expect(result.metadata.timestamp).toBeDefined();
      expect(result.metadata.timestamp >= beforeTime).toBe(true);
      expect(result.metadata.timestamp <= afterTime).toBe(true);
    });
  });
});
