import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';

import { componentRegistry } from '@/core/lib/ecs/ComponentRegistry';
import { DEFAULT_MATERIAL_COLOR } from '@/core/materials/constants';

import { MeshRenderer, Cube, Sphere, Cylinder, Plane } from '../MeshRenderer';
import { EntityProvider } from '../EntityContext';

// Mock dependencies
vi.mock('@/core/lib/ecs/ComponentRegistry');
vi.mock('@/core/materials/constants', () => ({
  DEFAULT_MATERIAL_COLOR: '#cccccc',
}));

describe('MeshRenderer Component', () => {
  const mockEntityId = 42;
  const mockEntityContext = {
    entityId: mockEntityId,
    entityName: 'TestMesh',
    persistentId: 'test-mesh-123',
  };

  let mockComponentRegistry: typeof componentRegistry;

  beforeEach(() => {
    vi.clearAllMocks();

    mockComponentRegistry = {
      hasComponent: vi.fn(),
      addComponent: vi.fn(),
      updateComponent: vi.fn(),
    } as any;

    Object.assign(componentRegistry, mockComponentRegistry);
  });

  describe('MeshRenderer Creation', () => {
    it('should add MeshRenderer component with default props', () => {
      mockComponentRegistry.hasComponent.mockReturnValue(false);

      render(
        <EntityProvider value={mockEntityContext}>
          <MeshRenderer meshId="cube" />
        </EntityProvider>,
      );

      expect(mockComponentRegistry.addComponent).toHaveBeenCalledWith(
        mockEntityId,
        'MeshRenderer',
        expect.objectContaining({
          meshId: 'cube',
          materialId: 'default',
          enabled: true,
          castShadows: true,
          receiveShadows: true,
        }),
      );
    });

    it('should add MeshRenderer component with custom props', () => {
      mockComponentRegistry.hasComponent.mockReturnValue(false);

      render(
        <EntityProvider value={mockEntityContext}>
          <MeshRenderer
            meshId="sphere"
            materialId="custom-material"
            enabled={false}
            castShadows={false}
            receiveShadows={false}
          />
        </EntityProvider>,
      );

      expect(mockComponentRegistry.addComponent).toHaveBeenCalledWith(
        mockEntityId,
        'MeshRenderer',
        expect.objectContaining({
          meshId: 'sphere',
          materialId: 'custom-material',
          enabled: false,
          castShadows: false,
          receiveShadows: false,
        }),
      );
    });

    it('should update existing MeshRenderer component', () => {
      mockComponentRegistry.hasComponent.mockReturnValue(true);

      render(
        <EntityProvider value={mockEntityContext}>
          <MeshRenderer meshId="cylinder" enabled={false} />
        </EntityProvider>,
      );

      expect(mockComponentRegistry.updateComponent).toHaveBeenCalledWith(
        mockEntityId,
        'MeshRenderer',
        expect.objectContaining({
          meshId: 'cylinder',
          enabled: false,
        }),
      );
    });
  });

  describe('Material Properties', () => {
    it('should add MeshRenderer with material properties', () => {
      mockComponentRegistry.hasComponent.mockReturnValue(false);

      const material = {
        color: '#ff0000',
        metalness: 0.5,
        roughness: 0.3,
      };

      render(
        <EntityProvider value={mockEntityContext}>
          <MeshRenderer meshId="cube" material={material} />
        </EntityProvider>,
      );

      expect(mockComponentRegistry.addComponent).toHaveBeenCalledWith(
        mockEntityId,
        'MeshRenderer',
        expect.objectContaining({
          meshId: 'cube',
          material: expect.objectContaining({
            color: '#ff0000',
            metalness: 0.5,
            roughness: 0.3,
          }),
        }),
      );
    });

    it('should merge material properties with defaults', () => {
      mockComponentRegistry.hasComponent.mockReturnValue(false);

      const material = {
        color: '#00ff00',
      };

      render(
        <EntityProvider value={mockEntityContext}>
          <MeshRenderer meshId="sphere" material={material} />
        </EntityProvider>,
      );

      const callArgs = (mockComponentRegistry.addComponent as any).mock.calls[0][2];
      expect(callArgs.material).toMatchObject({
        shader: 'standard',
        materialType: 'solid',
        color: '#00ff00',
        normalScale: 1,
        metalness: 0,
        roughness: 0.7,
        emissive: '#000000',
        emissiveIntensity: 0,
        occlusionStrength: 1,
        textureOffsetX: 0,
        textureOffsetY: 0,
        textureRepeatX: 1,
        textureRepeatY: 1,
      });
    });

    it('should support texture material type', () => {
      mockComponentRegistry.hasComponent.mockReturnValue(false);

      const material = {
        materialType: 'texture' as const,
        albedoTexture: '/textures/wood.jpg',
        normalTexture: '/textures/wood-normal.jpg',
      };

      render(
        <EntityProvider value={mockEntityContext}>
          <MeshRenderer meshId="cube" material={material} />
        </EntityProvider>,
      );

      expect(mockComponentRegistry.addComponent).toHaveBeenCalledWith(
        mockEntityId,
        'MeshRenderer',
        expect.objectContaining({
          material: expect.objectContaining({
            materialType: 'texture',
            albedoTexture: '/textures/wood.jpg',
            normalTexture: '/textures/wood-normal.jpg',
          }),
        }),
      );
    });

    it('should support all texture types', () => {
      mockComponentRegistry.hasComponent.mockReturnValue(false);

      const material = {
        albedoTexture: '/albedo.jpg',
        normalTexture: '/normal.jpg',
        metallicTexture: '/metallic.jpg',
        roughnessTexture: '/roughness.jpg',
        emissiveTexture: '/emissive.jpg',
        occlusionTexture: '/occlusion.jpg',
      };

      render(
        <EntityProvider value={mockEntityContext}>
          <MeshRenderer meshId="sphere" material={material} />
        </EntityProvider>,
      );

      expect(mockComponentRegistry.addComponent).toHaveBeenCalledWith(
        mockEntityId,
        'MeshRenderer',
        expect.objectContaining({
          material: expect.objectContaining(material),
        }),
      );
    });

    it('should support shader types', () => {
      mockComponentRegistry.hasComponent.mockReturnValue(false);

      const unlitMaterial = {
        shader: 'unlit' as const,
        color: '#ffffff',
      };

      render(
        <EntityProvider value={mockEntityContext}>
          <MeshRenderer meshId="cube" material={unlitMaterial} />
        </EntityProvider>,
      );

      expect(mockComponentRegistry.addComponent).toHaveBeenCalledWith(
        mockEntityId,
        'MeshRenderer',
        expect.objectContaining({
          material: expect.objectContaining({
            shader: 'unlit',
          }),
        }),
      );
    });

    it('should support emissive properties', () => {
      mockComponentRegistry.hasComponent.mockReturnValue(false);

      const material = {
        emissive: '#ff9900',
        emissiveIntensity: 2.5,
      };

      render(
        <EntityProvider value={mockEntityContext}>
          <MeshRenderer meshId="sphere" material={material} />
        </EntityProvider>,
      );

      expect(mockComponentRegistry.addComponent).toHaveBeenCalledWith(
        mockEntityId,
        'MeshRenderer',
        expect.objectContaining({
          material: expect.objectContaining({
            emissive: '#ff9900',
            emissiveIntensity: 2.5,
          }),
        }),
      );
    });
  });

  describe('Shadow Configuration', () => {
    it('should enable shadow casting by default', () => {
      mockComponentRegistry.hasComponent.mockReturnValue(false);

      render(
        <EntityProvider value={mockEntityContext}>
          <MeshRenderer meshId="cube" />
        </EntityProvider>,
      );

      expect(mockComponentRegistry.addComponent).toHaveBeenCalledWith(
        mockEntityId,
        'MeshRenderer',
        expect.objectContaining({
          castShadows: true,
          receiveShadows: true,
        }),
      );
    });

    it('should allow disabling shadow casting', () => {
      mockComponentRegistry.hasComponent.mockReturnValue(false);

      render(
        <EntityProvider value={mockEntityContext}>
          <MeshRenderer meshId="sphere" castShadows={false} />
        </EntityProvider>,
      );

      expect(mockComponentRegistry.addComponent).toHaveBeenCalledWith(
        mockEntityId,
        'MeshRenderer',
        expect.objectContaining({
          castShadows: false,
        }),
      );
    });

    it('should allow disabling shadow receiving', () => {
      mockComponentRegistry.hasComponent.mockReturnValue(false);

      render(
        <EntityProvider value={mockEntityContext}>
          <MeshRenderer meshId="plane" receiveShadows={false} />
        </EntityProvider>,
      );

      expect(mockComponentRegistry.addComponent).toHaveBeenCalledWith(
        mockEntityId,
        'MeshRenderer',
        expect.objectContaining({
          receiveShadows: false,
        }),
      );
    });
  });

  describe('Model Loading', () => {
    it('should support external model path', () => {
      mockComponentRegistry.hasComponent.mockReturnValue(false);

      render(
        <EntityProvider value={mockEntityContext}>
          <MeshRenderer meshId="custom" modelPath="/models/character.glb" />
        </EntityProvider>,
      );

      expect(mockComponentRegistry.addComponent).toHaveBeenCalledWith(
        mockEntityId,
        'MeshRenderer',
        expect.objectContaining({
          meshId: 'custom',
          modelPath: '/models/character.glb',
        }),
      );
    });
  });

  describe('Cube Convenience Component', () => {
    it('should create cube mesh', () => {
      mockComponentRegistry.hasComponent.mockReturnValue(false);

      render(
        <EntityProvider value={mockEntityContext}>
          <Cube />
        </EntityProvider>,
      );

      expect(mockComponentRegistry.addComponent).toHaveBeenCalledWith(
        mockEntityId,
        'MeshRenderer',
        expect.objectContaining({
          meshId: 'cube',
        }),
      );
    });

    it('should create cube with material', () => {
      mockComponentRegistry.hasComponent.mockReturnValue(false);

      render(
        <EntityProvider value={mockEntityContext}>
          <Cube material={{ color: '#0000ff' }} />
        </EntityProvider>,
      );

      expect(mockComponentRegistry.addComponent).toHaveBeenCalledWith(
        mockEntityId,
        'MeshRenderer',
        expect.objectContaining({
          meshId: 'cube',
          material: expect.objectContaining({
            color: '#0000ff',
          }),
        }),
      );
    });
  });

  describe('Sphere Convenience Component', () => {
    it('should create sphere mesh', () => {
      mockComponentRegistry.hasComponent.mockReturnValue(false);

      render(
        <EntityProvider value={mockEntityContext}>
          <Sphere />
        </EntityProvider>,
      );

      expect(mockComponentRegistry.addComponent).toHaveBeenCalledWith(
        mockEntityId,
        'MeshRenderer',
        expect.objectContaining({
          meshId: 'sphere',
        }),
      );
    });
  });

  describe('Cylinder Convenience Component', () => {
    it('should create cylinder mesh', () => {
      mockComponentRegistry.hasComponent.mockReturnValue(false);

      render(
        <EntityProvider value={mockEntityContext}>
          <Cylinder />
        </EntityProvider>,
      );

      expect(mockComponentRegistry.addComponent).toHaveBeenCalledWith(
        mockEntityId,
        'MeshRenderer',
        expect.objectContaining({
          meshId: 'cylinder',
        }),
      );
    });
  });

  describe('Plane Convenience Component', () => {
    it('should create plane mesh', () => {
      mockComponentRegistry.hasComponent.mockReturnValue(false);

      render(
        <EntityProvider value={mockEntityContext}>
          <Plane />
        </EntityProvider>,
      );

      expect(mockComponentRegistry.addComponent).toHaveBeenCalledWith(
        mockEntityId,
        'MeshRenderer',
        expect.objectContaining({
          meshId: 'plane',
        }),
      );
    });

    it('should create plane with no shadow casting', () => {
      mockComponentRegistry.hasComponent.mockReturnValue(false);

      render(
        <EntityProvider value={mockEntityContext}>
          <Plane castShadows={false} receiveShadows={true} />
        </EntityProvider>,
      );

      expect(mockComponentRegistry.addComponent).toHaveBeenCalledWith(
        mockEntityId,
        'MeshRenderer',
        expect.objectContaining({
          meshId: 'plane',
          castShadows: false,
          receiveShadows: true,
        }),
      );
    });
  });

  describe('Rendering', () => {
    it('should not render any DOM elements', () => {
      mockComponentRegistry.hasComponent.mockReturnValue(false);

      const { container } = render(
        <EntityProvider value={mockEntityContext}>
          <MeshRenderer meshId="cube" />
        </EntityProvider>,
      );

      expect(container.firstChild).toBeNull();
    });
  });

  describe('MeshRenderer Updates', () => {
    it('should update when meshId changes', () => {
      mockComponentRegistry.hasComponent.mockReturnValue(true);

      const { rerender } = render(
        <EntityProvider value={mockEntityContext}>
          <MeshRenderer meshId="cube" />
        </EntityProvider>,
      );

      rerender(
        <EntityProvider value={mockEntityContext}>
          <MeshRenderer meshId="sphere" />
        </EntityProvider>,
      );

      expect(mockComponentRegistry.updateComponent).toHaveBeenCalledTimes(2);
      expect(mockComponentRegistry.updateComponent).toHaveBeenLastCalledWith(
        mockEntityId,
        'MeshRenderer',
        expect.objectContaining({
          meshId: 'sphere',
        }),
      );
    });

    it('should update when material changes', () => {
      mockComponentRegistry.hasComponent.mockReturnValue(true);

      const { rerender } = render(
        <EntityProvider value={mockEntityContext}>
          <MeshRenderer meshId="cube" material={{ color: '#ff0000' }} />
        </EntityProvider>,
      );

      rerender(
        <EntityProvider value={mockEntityContext}>
          <MeshRenderer meshId="cube" material={{ color: '#00ff00' }} />
        </EntityProvider>,
      );

      expect(mockComponentRegistry.updateComponent).toHaveBeenCalledTimes(2);
      expect(mockComponentRegistry.updateComponent).toHaveBeenLastCalledWith(
        mockEntityId,
        'MeshRenderer',
        expect.objectContaining({
          material: expect.objectContaining({
            color: '#00ff00',
          }),
        }),
      );
    });

    it('should update when enabled state changes', () => {
      mockComponentRegistry.hasComponent.mockReturnValue(true);

      const { rerender } = render(
        <EntityProvider value={mockEntityContext}>
          <MeshRenderer meshId="cube" enabled={true} />
        </EntityProvider>,
      );

      rerender(
        <EntityProvider value={mockEntityContext}>
          <MeshRenderer meshId="cube" enabled={false} />
        </EntityProvider>,
      );

      expect(mockComponentRegistry.updateComponent).toHaveBeenLastCalledWith(
        mockEntityId,
        'MeshRenderer',
        expect.objectContaining({
          enabled: false,
        }),
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined material', () => {
      mockComponentRegistry.hasComponent.mockReturnValue(false);

      render(
        <EntityProvider value={mockEntityContext}>
          <MeshRenderer meshId="cube" material={undefined} />
        </EntityProvider>,
      );

      const callArgs = (mockComponentRegistry.addComponent as any).mock.calls[0][2];
      expect(callArgs.material).toBeUndefined();
    });

    it('should handle all material properties', () => {
      mockComponentRegistry.hasComponent.mockReturnValue(false);

      const completeMaterial = {
        shader: 'standard' as const,
        materialType: 'texture' as const,
        color: '#ff5500',
        metalness: 0.8,
        roughness: 0.2,
        emissive: '#ffaa00',
        emissiveIntensity: 1.5,
        normalScale: 2.0,
        occlusionStrength: 0.5,
        textureOffsetX: 0.5,
        textureOffsetY: 0.5,
        albedoTexture: '/albedo.jpg',
        normalTexture: '/normal.jpg',
        metallicTexture: '/metallic.jpg',
        roughnessTexture: '/roughness.jpg',
        emissiveTexture: '/emissive.jpg',
        occlusionTexture: '/occlusion.jpg',
      };

      render(
        <EntityProvider value={mockEntityContext}>
          <MeshRenderer meshId="sphere" material={completeMaterial} />
        </EntityProvider>,
      );

      expect(mockComponentRegistry.addComponent).toHaveBeenCalledWith(
        mockEntityId,
        'MeshRenderer',
        expect.objectContaining({
          material: expect.objectContaining(completeMaterial),
        }),
      );
    });
  });
});
