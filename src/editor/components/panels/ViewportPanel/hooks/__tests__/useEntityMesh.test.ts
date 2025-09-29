import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';

import type { IMaterialDefinition } from '../../../../core/materials/Material.types';
import type { MeshRendererData } from '../../../../core/lib/ecs/components/definitions/MeshRendererComponent';
import { useEntityMesh } from '../useEntityMesh';

// Mock the materials store
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
    textureRepeatX: 1,
    textureRepeatY: 1,
  },
  {
    id: 'test123',
    name: 'Test Material',
    shader: 'standard',
    materialType: 'solid',
    color: '#ff6600',
    metalness: 0.3,
    roughness: 0.6,
    emissive: '#000000',
    emissiveIntensity: 0,
    normalScale: 1,
    occlusionStrength: 1,
    textureOffsetX: 0,
    textureOffsetY: 0,
    textureRepeatX: 1,
    textureRepeatY: 1,
  },
  {
    id: 'textured-material',
    name: 'Textured Material',
    shader: 'standard',
    materialType: 'texture',
    color: '#ffffff',
    metalness: 0.2,
    roughness: 0.8,
    emissive: '#000000',
    emissiveIntensity: 0,
    normalScale: 1.5,
    occlusionStrength: 0.8,
    textureOffsetX: 0.1,
    textureOffsetY: 0.2,
    albedoTexture: '/assets/textures/test.png',
    normalTexture: '/assets/textures/test_normal.png',
  },
];

vi.mock('../../../store/materialsStore', () => ({
  useMaterialsStore: (selector: any) => {
    if (typeof selector === 'function') {
      return selector({ materials: mockMaterials });
    }
    return { materials: mockMaterials };
  },
}));

// Mock React (for useEffect) - don't auto-execute to prevent infinite loops
vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return {
    ...actual,
    useEffect: vi.fn((fn, deps) => {
      // Only run on mount, not on every render
      if (!deps || deps.length === 0) {
        fn();
      }
    }),
  };
});

// Mock component registry functions
const mockCombineRenderingContributions = vi.fn();
const mockCombinePhysicsContributions = vi.fn();

vi.mock('../../../../core/lib/ecs/ComponentRegistry', () => ({
  combineRenderingContributions: mockCombineRenderingContributions,
  combinePhysicsContributions: mockCombinePhysicsContributions,
}));

describe('useEntityMesh', () => {
  const mockTransformComponent = {
    type: 'Transform',
    data: {
      position: [0, 0, 0],
      rotation: [0, 0, 0, 1],
      scale: [1, 1, 1],
    },
  };

  const mockGeometryComponent = {
    type: 'GeometryComponent',
    data: {
      geometryType: 'cube',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Set up default mock returns
    mockCombineRenderingContributions.mockReturnValue({
      castShadow: true,
      receiveShadow: true,
      visible: true,
      meshType: 'cube',
      material: {}
    });

    mockCombinePhysicsContributions.mockReturnValue({
      enabled: false,
      rigidBodyProps: {
        type: 'dynamic',
        mass: 1,
        friction: 0.7,
        restitution: 0.3,
        density: 1,
        gravityScale: 1,
        canSleep: true
      }
    });
  });

  describe('basic functionality', () => {
    it('should return default values when no components provided', () => {
      const { result } = renderHook(() =>
        useEntityMesh({
          entityComponents: [],
          isPlaying: false,
        }),
      );

      expect(result.current.meshType).toBe('cube');
      expect(result.current.entityColor).toBe('#3388ff');
      expect(result.current.shouldHavePhysics).toBe(false);
    });

    it('should combine rendering contributions from components', () => {
      const entityComponents = [mockTransformComponent, mockGeometryComponent];

      renderHook(() =>
        useEntityMesh({
          entityComponents,
          isPlaying: false,
        }),
      );

      expect(mockCombineRenderingContributions).toHaveBeenCalledWith(entityComponents);
    });

    it('should combine physics contributions from components', () => {
      const entityComponents = [mockTransformComponent, mockGeometryComponent];

      renderHook(() =>
        useEntityMesh({
          entityComponents,
          isPlaying: false,
        }),
      );

      expect(mockCombinePhysicsContributions).toHaveBeenCalledWith(entityComponents);
    });
  });

  describe('material handling', () => {
    it('should use default material when no MeshRenderer component', () => {
      const { result } = renderHook(() =>
        useEntityMesh({
          entityComponents: [mockTransformComponent],
          isPlaying: false,
        }),
      );

      expect(result.current.renderingContributions.material?.color).toBe('#cccccc');
      expect(result.current.entityColor).toBe('#cccccc');
    });

    it('should use specified material from MeshRenderer component', () => {
      const meshRendererComponent = {
        type: 'MeshRenderer',
        data: {
          materialId: 'test123',
        } as MeshRendererData,
      };

      const { result } = renderHook(() =>
        useEntityMesh({
          entityComponents: [mockTransformComponent, meshRendererComponent],
          isPlaying: false,
        }),
      );

      expect(result.current.renderingContributions.material?.color).toBe('#ff6600');
      expect(result.current.entityColor).toBe('#ff6600');
    });

    it('should handle material overrides from MeshRenderer', () => {
      const meshRendererComponent = {
        type: 'MeshRenderer',
        data: {
          materialId: 'test123',
          material: {
            color: '#00ff00',
            metalness: 0.8,
          },
        } as MeshRendererData,
      };

      const { result } = renderHook(() =>
        useEntityMesh({
          entityComponents: [mockTransformComponent, meshRendererComponent],
          isPlaying: false,
        }),
      );

      expect(result.current.renderingContributions.material?.color).toBe('#00ff00');
      expect(result.current.renderingContributions.material?.metalness).toBe(0.8);
      expect(result.current.renderingContributions.material?.roughness).toBe(0.6); // From base material
    });

    it('should fallback to default values when material not found', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const meshRendererComponent = {
        type: 'MeshRenderer',
        data: {
          materialId: 'non-existent',
        } as MeshRendererData,
      };

      const { result } = renderHook(() =>
        useEntityMesh({
          entityComponents: [mockTransformComponent, meshRendererComponent],
          isPlaying: false,
        }),
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        'Material not found in registry: non-existent',
        expect.objectContaining({
          availableMaterials: ['default', 'test123', 'textured-material'],
        }),
      );

      expect(result.current.renderingContributions.material?.color).toBe('#cccccc');
      expect(result.current.renderingContributions.material?.shader).toBe('standard');

      consoleSpy.mockRestore();
    });

    it('should handle textured materials correctly', () => {
      const meshRendererComponent = {
        type: 'MeshRenderer',
        data: {
          materialId: 'textured-material',
        } as MeshRendererData,
      };

      const { result } = renderHook(() =>
        useEntityMesh({
          entityComponents: [mockTransformComponent, meshRendererComponent],
          isPlaying: false,
        }),
      );

      const material = result.current.renderingContributions.material;
      expect(material?.albedoTexture).toBe('/assets/textures/test.png');
      expect(material?.normalTexture).toBe('/assets/textures/test_normal.png');
      expect(material?.normalScale).toBe(1.5);
      expect(material?.textureOffsetX).toBe(0.1);
      expect(material?.textureOffsetY).toBe(0.2);
    });
  });

  describe('physics handling', () => {
    it('should disable physics when not playing', () => {
      mockCombinePhysicsContributions.mockReturnValue({
        enabled: true,
        rigidBodyProps: {
          type: 'dynamic',
          mass: 1,
          friction: 0.7,
          restitution: 0.3,
          density: 1,
          gravityScale: 1,
          canSleep: true,
        },
      });

      const { result } = renderHook(() =>
        useEntityMesh({
          entityComponents: [mockTransformComponent],
          isPlaying: false,
        }),
      );

      expect(result.current.shouldHavePhysics).toBe(false);
    });

    it('should enable physics when playing and physics contributions enabled', () => {
      mockCombinePhysicsContributions.mockReturnValue({
        enabled: true,
        rigidBodyProps: {
          type: 'dynamic',
          mass: 1,
          friction: 0.7,
          restitution: 0.3,
          density: 1,
          gravityScale: 1,
          canSleep: true,
        },
      });

      const { result } = renderHook(() =>
        useEntityMesh({
          entityComponents: [mockTransformComponent],
          isPlaying: true,
        }),
      );

      expect(result.current.shouldHavePhysics).toBe(true);
    });

    it('should disable physics when physics contributions disabled even when playing', () => {
      mockCombinePhysicsContributions.mockReturnValue({
        enabled: false,
        rigidBodyProps: {
          type: 'fixed',
          mass: 1,
          friction: 0.7,
          restitution: 0.3,
          density: 1,
          gravityScale: 1,
          canSleep: true,
        },
      });

      const { result } = renderHook(() =>
        useEntityMesh({
          entityComponents: [mockTransformComponent],
          isPlaying: true,
        }),
      );

      expect(result.current.shouldHavePhysics).toBe(false);
    });
  });

  describe('reactivity', () => {
    it('should update when entity components change', () => {
      const initialComponents = [mockTransformComponent];
      const { result, rerender } = renderHook(
        ({ entityComponents }) =>
          useEntityMesh({
            entityComponents,
            isPlaying: false,
          }),
        {
          initialProps: { entityComponents: initialComponents },
        },
      );

      expect(mockCombineRenderingContributions).toHaveBeenCalledWith(initialComponents);

      const newComponents = [
        mockTransformComponent,
        {
          type: 'MeshRenderer',
          data: { materialId: 'test123' } as MeshRendererData,
        },
      ];

      rerender({ entityComponents: newComponents });

      expect(mockCombineRenderingContributions).toHaveBeenCalledWith(newComponents);
      expect(result.current.entityColor).toBe('#ff6600');
    });

    it('should update when isPlaying changes', () => {
      mockCombinePhysicsContributions.mockReturnValue({
        enabled: true,
        rigidBodyProps: {
          type: 'dynamic',
          mass: 1,
          friction: 0.7,
          restitution: 0.3,
          density: 1,
          gravityScale: 1,
          canSleep: true,
        },
      });

      const { result, rerender } = renderHook(
        ({ isPlaying }) =>
          useEntityMesh({
            entityComponents: [mockTransformComponent],
            isPlaying,
          }),
        {
          initialProps: { isPlaying: false },
        },
      );

      expect(result.current.shouldHavePhysics).toBe(false);

      rerender({ isPlaying: true });

      expect(result.current.shouldHavePhysics).toBe(true);
    });
  });

  describe('mesh type handling', () => {
    it('should return mesh type from rendering contributions', () => {
      mockCombineRenderingContributions.mockReturnValue({
        castShadow: true,
        receiveShadow: true,
        visible: true,
        meshType: 'sphere',
      });

      const { result } = renderHook(() =>
        useEntityMesh({
          entityComponents: [mockTransformComponent],
          isPlaying: false,
        }),
      );

      expect(result.current.meshType).toBe('sphere');
    });

    it('should handle null mesh type', () => {
      mockCombineRenderingContributions.mockReturnValue({
        castShadow: true,
        receiveShadow: true,
        visible: true,
        meshType: null,
      });

      const { result } = renderHook(() =>
        useEntityMesh({
          entityComponents: [mockTransformComponent],
          isPlaying: false,
        }),
      );

      expect(result.current.meshType).toBe(null);
    });
  });

  describe('material property fallbacks', () => {
    it('should provide fallback values for missing material properties', () => {
      const incompleteMaterial = {
        id: 'incomplete',
        name: 'Incomplete Material',
        shader: 'standard',
        materialType: 'solid',
        color: '#ff0000',
        // Missing other properties
      } as IMaterialDefinition;

      // Mock store to return incomplete material
      vi.mocked(require('../../../store/materialsStore')).useMaterialsStore = vi.fn(
        (selector: any) => {
          if (typeof selector === 'function') {
            return selector({ materials: [incompleteMaterial] });
          }
          return { materials: [incompleteMaterial] };
        },
      );

      const meshRendererComponent = {
        type: 'MeshRenderer',
        data: {
          materialId: 'incomplete',
        } as MeshRendererData,
      };

      const { result } = renderHook(() =>
        useEntityMesh({
          entityComponents: [mockTransformComponent, meshRendererComponent],
          isPlaying: false,
        }),
      );

      const material = result.current.renderingContributions.material;
      expect(material?.metalness).toBe(0); // Fallback value
      expect(material?.roughness).toBe(0.7); // Fallback value
      expect(material?.normalScale).toBe(1); // Fallback value
      expect(material?.emissiveIntensity).toBe(0); // Fallback value
    });
  });
});
