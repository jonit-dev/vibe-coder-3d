/**
 * Integration tests for Materials + Scene persistence
 * Tests the complete workflow of materials with scene save/load
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MaterialRegistry } from '../MaterialRegistry';
import { StreamingSceneSerializer, type IStreamingScene } from '../../lib/serialization/StreamingSceneSerializer';
import type { IMaterialDefinition } from '../Material.types';

describe('Material System - Scene Integration', () => {
  let materialRegistry: MaterialRegistry;
  let sceneSerializer: StreamingSceneSerializer;
  let testMaterials: IMaterialDefinition[];

  beforeEach(() => {
    // Reset MaterialRegistry singleton
    (MaterialRegistry as any).instance = null;
    materialRegistry = MaterialRegistry.getInstance();
    sceneSerializer = new StreamingSceneSerializer();

    testMaterials = [
      {
        id: 'test-material-1',
        name: 'Red Metal',
        shader: 'standard',
        materialType: 'solid',
        color: '#ff0000',
        metalness: 0.8,
        roughness: 0.2,
        emissive: '#000000',
        emissiveIntensity: 0,
        normalScale: 1,
        occlusionStrength: 1,
        textureOffsetX: 0,
        textureOffsetY: 0,
      },
      {
        id: 'test-material-2',
        name: 'Blue Fabric',
        shader: 'standard',
        materialType: 'texture',
        color: '#0000ff',
        metalness: 0.0,
        roughness: 0.9,
        emissive: '#000000',
        emissiveIntensity: 0,
        normalScale: 1,
        occlusionStrength: 1,
        textureOffsetX: 0,
        textureOffsetY: 0,
        albedoTexture: '/textures/fabric.jpg',
        normalTexture: '/textures/fabric_normal.jpg',
      },
      {
        id: 'test-material-3',
        name: 'Glowing Green',
        shader: 'unlit',
        materialType: 'solid',
        color: '#00ff00',
        metalness: 0,
        roughness: 1,
        emissive: '#00ff00',
        emissiveIntensity: 2.0,
        normalScale: 1,
        occlusionStrength: 1,
        textureOffsetX: 0,
        textureOffsetY: 0,
      },
    ];
  });

  describe('complete save/load workflow', () => {
    it('should save and restore materials with scene', async () => {
      // Setup: Add materials to registry
      testMaterials.forEach(material => {
        materialRegistry.upsert(material);
      });

      // Verify materials are in registry
      expect(materialRegistry.list()).toHaveLength(4); // 3 test + default

      // Mock entities with material references
      const entities = [
        { id: 1, name: 'Red Cube' },
        { id: 2, name: 'Blue Sphere' },
        { id: 3, name: 'Glowing Plane' },
      ];

      const getComponentsForEntity = (entityId: string | number) => {
        const id = typeof entityId === 'string' ? parseInt(entityId) : entityId;
        return [
          { type: 'Transform', data: { position: [id, 0, 0] } },
          { type: 'MeshRenderer', data: { materialId: `test-material-${id}` } },
        ];
      };

      const getMaterials = () => materialRegistry.list();

      // Export scene with materials
      const exportedScene = await sceneSerializer.exportScene(
        entities,
        getComponentsForEntity,
        { name: 'Material Test Scene', version: 6 },
        {},
        getMaterials,
      );

      // Verify exported scene contains materials
      expect(exportedScene.materials).toHaveLength(4);
      expect(exportedScene.materials).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: 'default' }),
          expect.objectContaining({ id: 'test-material-1' }),
          expect.objectContaining({ id: 'test-material-2' }),
          expect.objectContaining({ id: 'test-material-3' }),
        ])
      );

      // Clear registry to simulate fresh start
      materialRegistry.clearMaterials();
      expect(materialRegistry.list()).toHaveLength(1); // Only default

      // Mock entity/component managers for import
      const mockEntityManager = {
        clearEntities: vi.fn(),
        createEntity: vi.fn((name: string) => {
          const id = name.includes('Cube') ? 1 : name.includes('Sphere') ? 2 : 3;
          return { id };
        }),
        setParent: vi.fn(),
      };

      const mockComponentManager = {
        addComponent: vi.fn(),
      };

      const materialManagerAdapter = {
        clearMaterials: () => materialRegistry.clearMaterials(),
        upsertMaterial: (material: IMaterialDefinition) => materialRegistry.upsert(material),
      };

      // Import scene with materials
      await sceneSerializer.importScene(
        exportedScene,
        mockEntityManager,
        mockComponentManager,
        {},
        materialManagerAdapter,
      );

      // Verify materials were restored
      const restoredMaterials = materialRegistry.list();
      expect(restoredMaterials).toHaveLength(4);

      // Verify each material was restored correctly
      const redMetal = materialRegistry.get('test-material-1');
      expect(redMetal).toEqual(testMaterials[0]);

      const blueFabric = materialRegistry.get('test-material-2');
      expect(blueFabric).toEqual(testMaterials[1]);

      const glowingGreen = materialRegistry.get('test-material-3');
      expect(glowingGreen).toEqual(testMaterials[2]);

      // Verify entities were created
      expect(mockEntityManager.createEntity).toHaveBeenCalledTimes(3);
      expect(mockComponentManager.addComponent).toHaveBeenCalled();
    });

    it('should handle material updates between save/load cycles', async () => {
      // Create initial material
      const initialMaterial = testMaterials[0];
      materialRegistry.upsert(initialMaterial);

      // Export scene
      const entities = [{ id: 1, name: 'Test Entity' }];
      const getComponentsForEntity = () => [
        { type: 'MeshRenderer', data: { materialId: 'test-material-1' } },
      ];
      const getMaterials = () => materialRegistry.list();

      const scene1 = await sceneSerializer.exportScene(
        entities,
        getComponentsForEntity,
        { name: 'Scene 1' },
        {},
        getMaterials,
      );

      // Update material
      const updatedMaterial = { ...initialMaterial, color: '#ff6600', roughness: 0.5 };
      materialRegistry.upsert(updatedMaterial);

      // Export updated scene
      const scene2 = await sceneSerializer.exportScene(
        entities,
        getComponentsForEntity,
        { name: 'Scene 2' },
        {},
        getMaterials,
      );

      // Verify scenes have different material properties
      const material1 = scene1.materials.find(m => m.id === 'test-material-1');
      const material2 = scene2.materials.find(m => m.id === 'test-material-1');

      expect(material1?.color).toBe('#ff0000');
      expect(material1?.roughness).toBe(0.2);

      expect(material2?.color).toBe('#ff6600');
      expect(material2?.roughness).toBe(0.5);

      // Load scene 1 and verify material reverts
      const materialManagerAdapter = {
        clearMaterials: () => materialRegistry.clearMaterials(),
        upsertMaterial: (material: IMaterialDefinition) => materialRegistry.upsert(material),
      };

      const mockEntityManager = {
        clearEntities: vi.fn(),
        createEntity: vi.fn(() => ({ id: 1 })),
        setParent: vi.fn(),
      };

      const mockComponentManager = {
        addComponent: vi.fn(),
      };

      await sceneSerializer.importScene(
        scene1,
        mockEntityManager,
        mockComponentManager,
        {},
        materialManagerAdapter,
      );

      const restoredMaterial = materialRegistry.get('test-material-1');
      expect(restoredMaterial?.color).toBe('#ff0000');
      expect(restoredMaterial?.roughness).toBe(0.2);
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle scenes with no materials', async () => {
      const entities = [{ id: 1, name: 'Entity' }];
      const getComponentsForEntity = () => [
        { type: 'Transform', data: { position: [0, 0, 0] } },
      ];

      // Export without getMaterials function
      const scene = await sceneSerializer.exportScene(
        entities,
        getComponentsForEntity,
        { name: 'No Materials Scene' },
      );

      expect(scene.materials).toEqual([]);

      // Import should work fine
      const materialManagerAdapter = {
        clearMaterials: () => materialRegistry.clearMaterials(),
        upsertMaterial: (material: IMaterialDefinition) => materialRegistry.upsert(material),
      };

      const mockEntityManager = {
        clearEntities: vi.fn(),
        createEntity: vi.fn(() => ({ id: 1 })),
        setParent: vi.fn(),
      };

      const mockComponentManager = {
        addComponent: vi.fn(),
      };

      await sceneSerializer.importScene(
        scene,
        mockEntityManager,
        mockComponentManager,
        {},
        materialManagerAdapter,
      );

      // Only default material should remain
      expect(materialRegistry.list()).toHaveLength(1);
      expect(materialRegistry.get('default')).toBeDefined();
    });

    it('should handle duplicate material IDs gracefully', async () => {
      // Add material to registry
      materialRegistry.upsert(testMaterials[0]);

      // Create scene with same material ID but different properties
      const sceneWithDuplicateMaterial: IStreamingScene = {
        version: 6,
        name: 'Duplicate Material Scene',
        timestamp: new Date().toISOString(),
        totalEntities: 1,
        entities: [
          {
            id: '1',
            name: 'Entity 1',
            components: {},
          },
        ],
        materials: [
          {
            ...testMaterials[0],
            color: '#00ff00', // Different color
            name: 'Different Name',
          },
        ],
      };

      const materialManagerAdapter = {
        clearMaterials: () => materialRegistry.clearMaterials(),
        upsertMaterial: (material: IMaterialDefinition) => materialRegistry.upsert(material),
      };

      const mockEntityManager = {
        clearEntities: vi.fn(),
        createEntity: vi.fn(() => ({ id: 1 })),
        setParent: vi.fn(),
      };

      const mockComponentManager = {
        addComponent: vi.fn(),
      };

      await sceneSerializer.importScene(
        sceneWithDuplicateMaterial,
        mockEntityManager,
        mockComponentManager,
        {},
        materialManagerAdapter,
      );

      // Material should be updated with scene version
      const material = materialRegistry.get('test-material-1');
      expect(material?.color).toBe('#00ff00');
      expect(material?.name).toBe('Different Name');
    });

    it('should preserve default material through clear operations', async () => {
      // Add test materials
      testMaterials.forEach(material => {
        materialRegistry.upsert(material);
      });

      expect(materialRegistry.list()).toHaveLength(4);

      // Clear materials (simulating scene import)
      materialRegistry.clearMaterials();

      // Default should always remain
      expect(materialRegistry.list()).toHaveLength(1);
      const defaultMaterial = materialRegistry.get('default');
      expect(defaultMaterial).toBeDefined();
      expect(defaultMaterial?.name).toBe('Default Material');
    });
  });

  describe('performance and memory', () => {
    it('should handle large numbers of materials efficiently', async () => {
      // Create many materials
      const largeMaterialSet: IMaterialDefinition[] = [];
      for (let i = 0; i < 1000; i++) {
        largeMaterialSet.push({
          id: `material-${i}`,
          name: `Material ${i}`,
          shader: i % 2 === 0 ? 'standard' : 'unlit',
          materialType: i % 3 === 0 ? 'texture' : 'solid',
          color: `#${i.toString(16).padStart(6, '0')}`,
          metalness: i / 1000,
          roughness: (i % 100) / 100,
          emissive: '#000000',
          emissiveIntensity: 0,
          normalScale: 1,
          occlusionStrength: 1,
          textureOffsetX: 0,
          textureOffsetY: 0,
        });
      }

      // Add to registry
      largeMaterialSet.forEach(material => {
        materialRegistry.upsert(material);
      });

      expect(materialRegistry.list()).toHaveLength(1001); // 1000 + default

      // Export/import cycle
      const entities = [{ id: 1, name: 'Entity' }];
      const getComponentsForEntity = () => [
        { type: 'Transform', data: { position: [0, 0, 0] } },
      ];
      const getMaterials = () => materialRegistry.list();

      const startTime = performance.now();

      const scene = await sceneSerializer.exportScene(
        entities,
        getComponentsForEntity,
        { name: 'Large Material Scene' },
        {},
        getMaterials,
      );

      const exportTime = performance.now() - startTime;

      expect(scene.materials).toHaveLength(1001);
      expect(exportTime).toBeLessThan(1000); // Should complete in under 1 second

      // Clear and import
      materialRegistry.clearMaterials();

      const importStartTime = performance.now();

      const materialManagerAdapter = {
        clearMaterials: () => materialRegistry.clearMaterials(),
        upsertMaterial: (material: IMaterialDefinition) => materialRegistry.upsert(material),
      };

      const mockEntityManager = {
        clearEntities: vi.fn(),
        createEntity: vi.fn(() => ({ id: 1 })),
        setParent: vi.fn(),
      };

      const mockComponentManager = {
        addComponent: vi.fn(),
      };

      await sceneSerializer.importScene(
        scene,
        mockEntityManager,
        mockComponentManager,
        {},
        materialManagerAdapter,
      );

      const importTime = performance.now() - importStartTime;

      expect(materialRegistry.list()).toHaveLength(1001);
      expect(importTime).toBeLessThan(1000); // Should complete in under 1 second
    });
  });
});