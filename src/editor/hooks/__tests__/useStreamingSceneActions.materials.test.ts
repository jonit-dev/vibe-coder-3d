/**
 * Tests for useStreamingSceneActions material integration
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useStreamingSceneActions } from '../useStreamingSceneActions';
import type { IMaterialDefinition } from '@/core/materials/Material.types';

// Mock all dependencies
vi.mock('@/core/lib/serialization/StreamingSceneSerializer', () => ({
  streamingSerializer: {
    exportScene: vi.fn(),
    importScene: vi.fn(),
    cancel: vi.fn(),
  },
  downloadSceneStream: vi.fn(),
  readSceneStream: vi.fn(),
}));

vi.mock('@/core/materials/MaterialRegistry', () => ({
  MaterialRegistry: {
    getInstance: vi.fn(() => ({
      list: vi.fn(() => mockMaterials),
      clearMaterials: vi.fn(),
      upsert: vi.fn(),
    })),
  },
}));

vi.mock('@/core/stores/toastStore', () => ({
  useProjectToasts: () => ({
    showOperationStart: vi.fn(() => 'toast-id'),
    showOperationSuccess: vi.fn(),
    showOperationError: vi.fn(),
  }),
  useToastStore: () => ({
    removeToast: vi.fn(),
  }),
}));

vi.mock('../useEntityManager', () => ({
  useEntityManager: () => ({
    getAllEntities: vi.fn(() => mockEntities),
    clearEntities: vi.fn(),
    createEntity: vi.fn((name) => ({ id: parseInt(name.split(' ')[1]) })),
    setParent: vi.fn(),
  }),
}));

vi.mock('../useComponentManager', () => ({
  useComponentManager: () => ({
    getComponentsForEntity: vi.fn(() => [
      { type: 'Transform', data: { position: [0, 0, 0] } },
      { type: 'MeshRenderer', data: { materialId: 'test-material' } },
    ]),
    addComponent: vi.fn(),
  }),
}));

vi.mock('../useScenePersistence', () => ({
  useScenePersistence: () => ({
    saveTsxScene: vi.fn(() => Promise.resolve(true)),
    loadScene: vi.fn(),
    error: null,
  }),
}));

const mockMaterials: IMaterialDefinition[] = [
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
  },
  {
    id: 'test-material',
    name: 'Test Material',
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
];

const mockEntities = [
  { id: 1, name: 'Entity 1' },
  { id: 2, name: 'Entity 2', parentId: 1 },
];

describe('useStreamingSceneActions - Materials Integration', () => {
  let streamingSerializer: any;
  let materialRegistry: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Get mocked instances
    const { streamingSerializer: serializer } = require('@/core/lib/serialization/StreamingSceneSerializer');
    const { MaterialRegistry } = require('@/core/materials/MaterialRegistry');

    streamingSerializer = serializer;
    materialRegistry = MaterialRegistry.getInstance();
  });

  describe('exportScene with materials', () => {
    it('should export scene with materials from registry', async () => {
      const mockScene = {
        version: 6,
        name: 'Test Scene',
        timestamp: new Date().toISOString(),
        totalEntities: 2,
        entities: mockEntities,
        materials: mockMaterials,
      };

      streamingSerializer.exportScene.mockResolvedValue(mockScene);

      const { result } = renderHook(() => useStreamingSceneActions());

      await act(async () => {
        const scene = await result.current.exportScene({ name: 'Test Scene' });
        expect(scene).toEqual(mockScene);
      });

      expect(streamingSerializer.exportScene).toHaveBeenCalledWith(
        expect.any(Array), // entities
        expect.any(Function), // getComponentsForEntity
        { version: 6, name: 'Test Scene' }, // metadata
        expect.any(Object), // callbacks
        expect.any(Function), // getMaterials
      );

      // Test that getMaterials function works correctly
      const exportCall = streamingSerializer.exportScene.mock.calls[0];
      const getMaterials = exportCall[4];
      expect(getMaterials()).toEqual(mockMaterials);
    });
  });

  describe('importScene with materials', () => {
    it('should import scene and restore materials to registry', async () => {
      const mockScene = {
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
              MeshRenderer: { materialId: 'test-material' },
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

      streamingSerializer.importScene.mockResolvedValue(undefined);

      const { result } = renderHook(() => useStreamingSceneActions());

      await act(async () => {
        await result.current.importScene(mockScene);
      });

      expect(streamingSerializer.importScene).toHaveBeenCalledWith(
        mockScene,
        expect.any(Object), // entityManagerAdapter
        expect.any(Object), // componentManagerAdapter
        expect.any(Object), // callbacks
        expect.any(Object), // materialManagerAdapter
      );

      // Test that material manager adapter works correctly
      const importCall = streamingSerializer.importScene.mock.calls[0];
      const materialManagerAdapter = importCall[4];

      expect(materialManagerAdapter).toHaveProperty('clearMaterials');
      expect(materialManagerAdapter).toHaveProperty('upsertMaterial');

      // Test calling the adapter methods
      materialManagerAdapter.clearMaterials();
      expect(materialRegistry.clearMaterials).toHaveBeenCalled();

      materialManagerAdapter.upsertMaterial(mockMaterials[0]);
      expect(materialRegistry.upsert).toHaveBeenCalledWith(mockMaterials[0]);
    });
  });

  describe('handleClear with materials', () => {
    it('should clear both entities and materials', () => {
      const { result } = renderHook(() => useStreamingSceneActions());

      act(() => {
        result.current.handleClear();
      });

      expect(materialRegistry.clearMaterials).toHaveBeenCalled();
    });
  });

  describe('downloadJSON with materials', () => {
    it('should download scene with materials included', async () => {
      const mockScene = {
        version: 6,
        name: 'Download Test',
        timestamp: new Date().toISOString(),
        totalEntities: 2,
        entities: mockEntities,
        materials: mockMaterials,
      };

      streamingSerializer.exportScene.mockResolvedValue(mockScene);

      const { downloadSceneStream } = require('@/core/lib/serialization/StreamingSceneSerializer');
      downloadSceneStream.mockResolvedValue(undefined);

      const { result } = renderHook(() => useStreamingSceneActions());

      await act(async () => {
        await result.current.handleDownloadJSON('test-scene.json');
      });

      expect(streamingSerializer.exportScene).toHaveBeenCalled();
      expect(downloadSceneStream).toHaveBeenCalledWith(
        mockScene,
        'test-scene.json',
        expect.any(Function),
      );
    });
  });

  describe('load from file with materials', () => {
    it('should load scene file and restore materials', async () => {
      const mockScene = {
        version: 6,
        name: 'File Test',
        timestamp: new Date().toISOString(),
        totalEntities: 2,
        entities: mockEntities,
        materials: mockMaterials,
      };

      const { readSceneStream } = require('@/core/lib/serialization/StreamingSceneSerializer');
      readSceneStream.mockResolvedValue(mockScene);
      streamingSerializer.importScene.mockResolvedValue(undefined);

      const { result } = renderHook(() => useStreamingSceneActions());

      const mockFile = new File(['{}'], 'test-scene.json', { type: 'application/json' });
      const mockEvent = {
        target: { files: [mockFile] },
      } as any;

      await act(async () => {
        await result.current.handleLoad(mockEvent);
      });

      expect(readSceneStream).toHaveBeenCalledWith(mockFile, expect.any(Function));
      expect(streamingSerializer.importScene).toHaveBeenCalledWith(
        mockScene,
        expect.any(Object),
        expect.any(Object),
        expect.any(Object),
        expect.objectContaining({
          clearMaterials: expect.any(Function),
          upsertMaterial: expect.any(Function),
        }),
      );
    });
  });

  describe('error handling', () => {
    it('should handle export errors gracefully', async () => {
      streamingSerializer.exportScene.mockRejectedValue(new Error('Export failed'));

      const { result } = renderHook(() => useStreamingSceneActions());

      await act(async () => {
        try {
          await result.current.exportScene({ name: 'Test Scene' });
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
          expect((error as Error).message).toBe('Export failed');
        }
      });
    });

    it('should handle import errors gracefully', async () => {
      const mockScene = {
        version: 6,
        name: 'Error Test',
        timestamp: new Date().toISOString(),
        totalEntities: 0,
        entities: [],
        materials: [],
      };

      streamingSerializer.importScene.mockRejectedValue(new Error('Import failed'));

      const { result } = renderHook(() => useStreamingSceneActions());

      await act(async () => {
        try {
          await result.current.importScene(mockScene);
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
          expect((error as Error).message).toBe('Import failed');
        }
      });
    });
  });

  describe('backward compatibility', () => {
    it('should handle legacy scenes without materials during import', async () => {
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

      streamingSerializer.importScene.mockResolvedValue(undefined);

      const { result } = renderHook(() => useStreamingSceneActions());

      await act(async () => {
        await result.current.importScene(legacyScene);
      });

      // Should still call with material manager even for legacy scenes
      expect(streamingSerializer.importScene).toHaveBeenCalledWith(
        legacyScene,
        expect.any(Object),
        expect.any(Object),
        expect.any(Object),
        expect.objectContaining({
          clearMaterials: expect.any(Function),
          upsertMaterial: expect.any(Function),
        }),
      );
    });
  });
});