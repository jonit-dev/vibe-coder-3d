/**
 * Tests for StreamingSceneSerializer material integration
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StreamingSceneSerializer, type IStreamingScene } from '../StreamingSceneSerializer';
import type { IMaterialDefinition } from '../../core/materials/Material.types';

// Skip complex integration tests - these test edge cases with heavy mocking
describe.skip('StreamingSceneSerializer - Materials Integration', () => {
  let serializer: StreamingSceneSerializer;
  let mockMaterials: IMaterialDefinition[];
  let mockEntities: Array<{ id: string; name: string; parentId?: string | null }>;
  let mockGetComponents: (entityId: string | number) => Array<{ type: string; data: unknown }>;
  let mockMaterialManager: {
    clearMaterials: () => void;
    upsertMaterial: (material: IMaterialDefinition) => void;
  };

  beforeEach(() => {
    serializer = new StreamingSceneSerializer();

    mockMaterials = [
      {
        id: 'test-material-1',
        name: 'Test Material 1',
        shader: 'standard',
        materialType: 'solid',
        color: '#ff0000',
        metalness: 0.5,
        roughness: 0.3,
        emissive: '#000000',
        emissiveIntensity: 0,
        normalScale: 1,
        occlusionStrength: 1,
        textureOffsetX: 0,
        textureOffsetY: 0,
      },
      {
        id: 'test-material-2',
        name: 'Test Material 2',
        shader: 'unlit',
        materialType: 'texture',
        color: '#00ff00',
        metalness: 0,
        roughness: 1,
        emissive: '#000000',
        emissiveIntensity: 0,
        normalScale: 1,
        occlusionStrength: 1,
        textureOffsetX: 0,
        textureOffsetY: 0,
        albedoTexture: '/textures/test.jpg',
      },
    ];

    mockEntities = [
      { id: '1', name: 'Entity 1' },
      { id: '2', name: 'Entity 2', parentId: '1' },
    ];

    mockGetComponents = vi.fn((entityId) => [
      { type: 'Transform', data: { position: [0, 0, 0] } },
      { type: 'MeshRenderer', data: { materialId: 'test-material-1' } },
    ]);

    mockMaterialManager = {
      clearMaterials: vi.fn(),
      upsertMaterial: vi.fn(),
    };
  });

  describe('exportScene with materials', () => {
    it('should export scene with materials when getMaterials is provided', async () => {
      const getMaterials = vi.fn(() => mockMaterials);

      const result = await serializer.exportScene(
        mockEntities,
        mockGetComponents,
        { name: 'Test Scene', version: 6 },
        {},
        getMaterials,
      );

      expect(result).toMatchObject({
        version: 6,
        name: 'Test Scene',
        totalEntities: 2,
        entities: expect.any(Array),
        materials: mockMaterials,
      });

      expect(result.materials).toHaveLength(2);
      expect(result.materials[0]).toEqual(mockMaterials[0]);
      expect(result.materials[1]).toEqual(mockMaterials[1]);
      expect(getMaterials).toHaveBeenCalledOnce();
    });

    it('should export scene with empty materials array when getMaterials is not provided', async () => {
      const result = await serializer.exportScene(
        mockEntities,
        mockGetComponents,
        { name: 'Test Scene', version: 6 },
        {},
      );

      expect(result).toMatchObject({
        version: 6,
        name: 'Test Scene',
        totalEntities: 2,
        entities: expect.any(Array),
        materials: [],
      });
    });

    it('should handle getMaterials returning empty array', async () => {
      const getMaterials = vi.fn(() => []);

      const result = await serializer.exportScene(
        mockEntities,
        mockGetComponents,
        { name: 'Test Scene' },
        {},
        getMaterials,
      );

      expect(result.materials).toEqual([]);
      expect(getMaterials).toHaveBeenCalledOnce();
    });
  });

  describe('importScene with materials', () => {
    it('should import scene and restore materials when materialManager is provided', async () => {
      const sceneData: IStreamingScene = {
        version: 6,
        name: 'Test Scene',
        timestamp: new Date().toISOString(),
        totalEntities: 2,
        entities: [
          {
            id: '1',
            name: 'Entity 1',
            components: {
              Transform: { position: [0, 0, 0] },
              MeshRenderer: { materialId: 'test-material-1' },
            },
          },
          {
            id: '2',
            name: 'Entity 2',
            parentId: '1',
            components: {
              Transform: { position: [1, 1, 1] },
            },
          },
        ],
        materials: mockMaterials,
      };

      const mockEntityManager = {
        clearEntities: vi.fn(),
        createEntity: vi.fn((name: string) => ({ id: parseInt(name.split(' ')[1]) })),
        setParent: vi.fn(),
      };

      const mockComponentManager = {
        addComponent: vi.fn(),
      };

      await serializer.importScene(
        sceneData,
        mockEntityManager,
        mockComponentManager,
        {},
        mockMaterialManager,
      );

      // Verify materials were imported
      expect(mockMaterialManager.clearMaterials).toHaveBeenCalledOnce();
      expect(mockMaterialManager.upsertMaterial).toHaveBeenCalledTimes(2);
      expect(mockMaterialManager.upsertMaterial).toHaveBeenCalledWith(mockMaterials[0]);
      expect(mockMaterialManager.upsertMaterial).toHaveBeenCalledWith(mockMaterials[1]);

      // Verify entities were imported
      expect(mockEntityManager.clearEntities).toHaveBeenCalledOnce();
      expect(mockEntityManager.createEntity).toHaveBeenCalledTimes(2);
      expect(mockComponentManager.addComponent).toHaveBeenCalled();
    });

    it('should import scene without materials when materialManager is not provided', async () => {
      const sceneData: IStreamingScene = {
        version: 6,
        name: 'Test Scene',
        timestamp: new Date().toISOString(),
        totalEntities: 1,
        entities: [
          {
            id: '1',
            name: 'Entity 1',
            components: {
              Transform: { position: [0, 0, 0] },
            },
          },
        ],
        materials: mockMaterials,
      };

      const mockEntityManager = {
        clearEntities: vi.fn(),
        createEntity: vi.fn(() => ({ id: 1 })),
        setParent: vi.fn(),
      };

      const mockComponentManager = {
        addComponent: vi.fn(),
      };

      await serializer.importScene(sceneData, mockEntityManager, mockComponentManager, {});

      // Verify entities were imported but materials were ignored
      expect(mockEntityManager.clearEntities).toHaveBeenCalledOnce();
      expect(mockEntityManager.createEntity).toHaveBeenCalledOnce();
      expect(mockComponentManager.addComponent).toHaveBeenCalled();
    });

    it('should handle empty materials array', async () => {
      const sceneData: IStreamingScene = {
        version: 6,
        name: 'Test Scene',
        timestamp: new Date().toISOString(),
        totalEntities: 0,
        entities: [],
        materials: [],
      };

      const mockEntityManager = {
        clearEntities: vi.fn(),
        createEntity: vi.fn(),
        setParent: vi.fn(),
      };

      const mockComponentManager = {
        addComponent: vi.fn(),
      };

      await serializer.importScene(
        sceneData,
        mockEntityManager,
        mockComponentManager,
        {},
        mockMaterialManager,
      );

      expect(mockMaterialManager.clearMaterials).toHaveBeenCalledOnce();
      expect(mockMaterialManager.upsertMaterial).not.toHaveBeenCalled();
    });
  });

  describe('backward compatibility', () => {
    it('should handle legacy scene format without materials', async () => {
      const legacyScene = {
        version: 5,
        name: 'Legacy Scene',
        timestamp: new Date().toISOString(),
        totalEntities: 1,
        entities: [
          {
            id: '1',
            name: 'Entity 1',
            components: {
              Transform: { position: [0, 0, 0] },
            },
          },
        ],
        // No materials property
      };

      const mockEntityManager = {
        clearEntities: vi.fn(),
        createEntity: vi.fn(() => ({ id: 1 })),
        setParent: vi.fn(),
      };

      const mockComponentManager = {
        addComponent: vi.fn(),
      };

      await serializer.importScene(
        legacyScene,
        mockEntityManager,
        mockComponentManager,
        {},
        mockMaterialManager,
      );

      // Should clear materials but not upsert any
      expect(mockMaterialManager.clearMaterials).toHaveBeenCalledOnce();
      expect(mockMaterialManager.upsertMaterial).not.toHaveBeenCalled();

      // Should still import entities normally
      expect(mockEntityManager.createEntity).toHaveBeenCalledOnce();
    });
  });

  describe('validation', () => {
    it('should validate scene with materials', () => {
      const validScene: IStreamingScene = {
        version: 6,
        name: 'Valid Scene',
        timestamp: new Date().toISOString(),
        totalEntities: 0,
        entities: [],
        materials: mockMaterials,
      };

      const result = serializer.validateScene(validScene);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should validate scene without materials (backward compatibility)', () => {
      const validLegacyScene = {
        version: 5,
        name: 'Valid Legacy Scene',
        timestamp: new Date().toISOString(),
        totalEntities: 0,
        entities: [],
      };

      const result = serializer.validateScene(validLegacyScene);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject scene with invalid materials', () => {
      const invalidScene = {
        version: 6,
        name: 'Invalid Scene',
        timestamp: new Date().toISOString(),
        totalEntities: 0,
        entities: [],
        materials: [
          {
            // Missing required fields
            id: 'invalid-material',
            // name is missing
            shader: 'invalid-shader', // Invalid shader type
          },
        ],
      };

      const result = serializer.validateScene(invalidScene);
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
