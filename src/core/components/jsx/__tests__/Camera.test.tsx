import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';

import { componentRegistry } from '@/core/lib/ecs/ComponentRegistry';

import { Camera, PerspectiveCamera, OrthographicCamera } from '../Camera';
import { EntityProvider } from '../EntityContext';

// Mock dependencies
vi.mock('@/core/lib/ecs/ComponentRegistry');

describe('Camera Component', () => {
  const mockEntityId = 42;
  const mockEntityContext = {
    entityId: mockEntityId,
    entityName: 'TestCamera',
    persistentId: 'test-camera-123',
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

  describe('Camera Creation', () => {
    it('should add Camera component with default props', () => {
      mockComponentRegistry.hasComponent.mockReturnValue(false);

      render(
        <EntityProvider value={mockEntityContext}>
          <Camera />
        </EntityProvider>,
      );

      expect(mockComponentRegistry.addComponent).toHaveBeenCalledWith(
        mockEntityId,
        'Camera',
        expect.objectContaining({
          fov: 50,
          near: 0.1,
          far: 100,
          projectionType: 'perspective',
          orthographicSize: 10,
          depth: 0,
          isMain: false,
          clearFlags: 'skybox',
          backgroundColor: { r: 0.0, g: 0.0, b: 0.0, a: 0 },
        }),
      );
    });

    it('should add Camera component with custom props', () => {
      mockComponentRegistry.hasComponent.mockReturnValue(false);

      render(
        <EntityProvider value={mockEntityContext}>
          <Camera
            fov={75}
            near={0.5}
            far={500}
            projectionType="orthographic"
            orthographicSize={15}
            depth={5}
            isMain={true}
            clearFlags="solidColor"
            backgroundColor={{ r: 0.5, g: 0.5, b: 0.5, a: 1 }}
          />
        </EntityProvider>,
      );

      expect(mockComponentRegistry.addComponent).toHaveBeenCalledWith(mockEntityId, 'Camera', {
        fov: 75,
        near: 0.5,
        far: 500,
        projectionType: 'orthographic',
        orthographicSize: 15,
        depth: 5,
        isMain: true,
        clearFlags: 'solidColor',
        backgroundColor: { r: 0.5, g: 0.5, b: 0.5, a: 1 },
      });
    });

    it('should update existing Camera component', () => {
      mockComponentRegistry.hasComponent.mockReturnValue(true);

      render(
        <EntityProvider value={mockEntityContext}>
          <Camera fov={60} near={0.2} far={200} />
        </EntityProvider>,
      );

      expect(mockComponentRegistry.updateComponent).toHaveBeenCalledWith(
        mockEntityId,
        'Camera',
        expect.objectContaining({
          fov: 60,
          near: 0.2,
          far: 200,
        }),
      );
    });
  });

  describe('Camera Updates', () => {
    it('should update Camera when props change', () => {
      mockComponentRegistry.hasComponent.mockReturnValue(true);

      const { rerender } = render(
        <EntityProvider value={mockEntityContext}>
          <Camera fov={50} />
        </EntityProvider>,
      );

      expect(mockComponentRegistry.updateComponent).toHaveBeenCalledTimes(1);

      // Change fov
      rerender(
        <EntityProvider value={mockEntityContext}>
          <Camera fov={75} />
        </EntityProvider>,
      );

      expect(mockComponentRegistry.updateComponent).toHaveBeenCalledTimes(2);
      expect(mockComponentRegistry.updateComponent).toHaveBeenLastCalledWith(
        mockEntityId,
        'Camera',
        expect.objectContaining({
          fov: 75,
        }),
      );
    });

    it('should update Camera when near plane changes', () => {
      mockComponentRegistry.hasComponent.mockReturnValue(true);

      const { rerender } = render(
        <EntityProvider value={mockEntityContext}>
          <Camera near={0.1} />
        </EntityProvider>,
      );

      rerender(
        <EntityProvider value={mockEntityContext}>
          <Camera near={0.5} />
        </EntityProvider>,
      );

      expect(mockComponentRegistry.updateComponent).toHaveBeenCalledTimes(2);
      expect(mockComponentRegistry.updateComponent).toHaveBeenLastCalledWith(
        mockEntityId,
        'Camera',
        expect.objectContaining({
          near: 0.5,
        }),
      );
    });

    it('should update Camera when far plane changes', () => {
      mockComponentRegistry.hasComponent.mockReturnValue(true);

      const { rerender } = render(
        <EntityProvider value={mockEntityContext}>
          <Camera far={100} />
        </EntityProvider>,
      );

      rerender(
        <EntityProvider value={mockEntityContext}>
          <Camera far={1000} />
        </EntityProvider>,
      );

      expect(mockComponentRegistry.updateComponent).toHaveBeenCalledTimes(2);
      expect(mockComponentRegistry.updateComponent).toHaveBeenLastCalledWith(
        mockEntityId,
        'Camera',
        expect.objectContaining({
          far: 1000,
        }),
      );
    });

    it('should update Camera when projection type changes', () => {
      mockComponentRegistry.hasComponent.mockReturnValue(true);

      const { rerender } = render(
        <EntityProvider value={mockEntityContext}>
          <Camera projectionType="perspective" />
        </EntityProvider>,
      );

      rerender(
        <EntityProvider value={mockEntityContext}>
          <Camera projectionType="orthographic" />
        </EntityProvider>,
      );

      expect(mockComponentRegistry.updateComponent).toHaveBeenCalledTimes(2);
      expect(mockComponentRegistry.updateComponent).toHaveBeenLastCalledWith(
        mockEntityId,
        'Camera',
        expect.objectContaining({
          projectionType: 'orthographic',
        }),
      );
    });

    it('should update Camera when isMain changes', () => {
      mockComponentRegistry.hasComponent.mockReturnValue(true);

      const { rerender } = render(
        <EntityProvider value={mockEntityContext}>
          <Camera isMain={false} />
        </EntityProvider>,
      );

      rerender(
        <EntityProvider value={mockEntityContext}>
          <Camera isMain={true} />
        </EntityProvider>,
      );

      expect(mockComponentRegistry.updateComponent).toHaveBeenCalledTimes(2);
      expect(mockComponentRegistry.updateComponent).toHaveBeenLastCalledWith(
        mockEntityId,
        'Camera',
        expect.objectContaining({
          isMain: true,
        }),
      );
    });

    it('should update Camera when clearFlags changes', () => {
      mockComponentRegistry.hasComponent.mockReturnValue(true);

      const { rerender } = render(
        <EntityProvider value={mockEntityContext}>
          <Camera clearFlags="skybox" />
        </EntityProvider>,
      );

      rerender(
        <EntityProvider value={mockEntityContext}>
          <Camera clearFlags="solidColor" />
        </EntityProvider>,
      );

      expect(mockComponentRegistry.updateComponent).toHaveBeenLastCalledWith(
        mockEntityId,
        'Camera',
        expect.objectContaining({
          clearFlags: 'solidColor',
        }),
      );
    });

    it('should update Camera when backgroundColor changes', () => {
      mockComponentRegistry.hasComponent.mockReturnValue(true);

      const { rerender } = render(
        <EntityProvider value={mockEntityContext}>
          <Camera backgroundColor={{ r: 0, g: 0, b: 0, a: 0 }} />
        </EntityProvider>,
      );

      rerender(
        <EntityProvider value={mockEntityContext}>
          <Camera backgroundColor={{ r: 1, g: 0, b: 0, a: 1 }} />
        </EntityProvider>,
      );

      expect(mockComponentRegistry.updateComponent).toHaveBeenCalledTimes(2);
      expect(mockComponentRegistry.updateComponent).toHaveBeenLastCalledWith(
        mockEntityId,
        'Camera',
        expect.objectContaining({
          backgroundColor: { r: 1, g: 0, b: 0, a: 1 },
        }),
      );
    });
  });

  describe('Projection Types', () => {
    it('should set orthographic size for orthographic camera', () => {
      mockComponentRegistry.hasComponent.mockReturnValue(false);

      render(
        <EntityProvider value={mockEntityContext}>
          <Camera projectionType="orthographic" orthographicSize={20} />
        </EntityProvider>,
      );

      expect(mockComponentRegistry.addComponent).toHaveBeenCalledWith(
        mockEntityId,
        'Camera',
        expect.objectContaining({
          projectionType: 'orthographic',
          orthographicSize: 20,
        }),
      );
    });

    it('should use perspective projection by default', () => {
      mockComponentRegistry.hasComponent.mockReturnValue(false);

      render(
        <EntityProvider value={mockEntityContext}>
          <Camera />
        </EntityProvider>,
      );

      expect(mockComponentRegistry.addComponent).toHaveBeenCalledWith(
        mockEntityId,
        'Camera',
        expect.objectContaining({
          projectionType: 'perspective',
        }),
      );
    });
  });

  describe('PerspectiveCamera Convenience Component', () => {
    it('should create perspective camera with default props', () => {
      mockComponentRegistry.hasComponent.mockReturnValue(false);

      render(
        <EntityProvider value={mockEntityContext}>
          <PerspectiveCamera />
        </EntityProvider>,
      );

      expect(mockComponentRegistry.addComponent).toHaveBeenCalledWith(
        mockEntityId,
        'Camera',
        expect.objectContaining({
          projectionType: 'perspective',
          fov: 50,
          near: 0.1,
          far: 100,
        }),
      );
    });

    it('should create perspective camera with custom props', () => {
      mockComponentRegistry.hasComponent.mockReturnValue(false);

      render(
        <EntityProvider value={mockEntityContext}>
          <PerspectiveCamera fov={90} near={0.5} far={500} isMain={true} />
        </EntityProvider>,
      );

      expect(mockComponentRegistry.addComponent).toHaveBeenCalledWith(
        mockEntityId,
        'Camera',
        expect.objectContaining({
          projectionType: 'perspective',
          fov: 90,
          near: 0.5,
          far: 500,
          isMain: true,
        }),
      );
    });

    it('should always use perspective projection type', () => {
      mockComponentRegistry.hasComponent.mockReturnValue(false);

      render(
        <EntityProvider value={mockEntityContext}>
          <PerspectiveCamera fov={60} />
        </EntityProvider>,
      );

      const cameraData = (mockComponentRegistry.addComponent as any).mock.calls[0][2];
      expect(cameraData.projectionType).toBe('perspective');
    });
  });

  describe('OrthographicCamera Convenience Component', () => {
    it('should create orthographic camera with default props', () => {
      mockComponentRegistry.hasComponent.mockReturnValue(false);

      render(
        <EntityProvider value={mockEntityContext}>
          <OrthographicCamera />
        </EntityProvider>,
      );

      expect(mockComponentRegistry.addComponent).toHaveBeenCalledWith(
        mockEntityId,
        'Camera',
        expect.objectContaining({
          projectionType: 'orthographic',
          orthographicSize: 10,
          near: 0.1,
          far: 100,
        }),
      );
    });

    it('should create orthographic camera with custom props', () => {
      mockComponentRegistry.hasComponent.mockReturnValue(false);

      render(
        <EntityProvider value={mockEntityContext}>
          <OrthographicCamera orthographicSize={15} near={-100} far={100} isMain={true} />
        </EntityProvider>,
      );

      expect(mockComponentRegistry.addComponent).toHaveBeenCalledWith(
        mockEntityId,
        'Camera',
        expect.objectContaining({
          projectionType: 'orthographic',
          orthographicSize: 15,
          near: -100,
          far: 100,
          isMain: true,
        }),
      );
    });

    it('should always use orthographic projection type', () => {
      mockComponentRegistry.hasComponent.mockReturnValue(false);

      render(
        <EntityProvider value={mockEntityContext}>
          <OrthographicCamera orthographicSize={20} />
        </EntityProvider>,
      );

      const cameraData = (mockComponentRegistry.addComponent as any).mock.calls[0][2];
      expect(cameraData.projectionType).toBe('orthographic');
    });
  });

  describe('Rendering', () => {
    it('should not render any DOM elements', () => {
      mockComponentRegistry.hasComponent.mockReturnValue(false);

      const { container } = render(
        <EntityProvider value={mockEntityContext}>
          <Camera />
        </EntityProvider>,
      );

      // Camera component should render nothing (null)
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Clear Flags', () => {
    it('should support skybox clear flag', () => {
      mockComponentRegistry.hasComponent.mockReturnValue(false);

      render(
        <EntityProvider value={mockEntityContext}>
          <Camera clearFlags="skybox" />
        </EntityProvider>,
      );

      expect(mockComponentRegistry.addComponent).toHaveBeenCalledWith(
        mockEntityId,
        'Camera',
        expect.objectContaining({
          clearFlags: 'skybox',
        }),
      );
    });

    it('should support solidColor clear flag', () => {
      mockComponentRegistry.hasComponent.mockReturnValue(false);

      render(
        <EntityProvider value={mockEntityContext}>
          <Camera clearFlags="solidColor" />
        </EntityProvider>,
      );

      expect(mockComponentRegistry.addComponent).toHaveBeenCalledWith(
        mockEntityId,
        'Camera',
        expect.objectContaining({
          clearFlags: 'solidColor',
        }),
      );
    });

    it('should support depthOnly clear flag', () => {
      mockComponentRegistry.hasComponent.mockReturnValue(false);

      render(
        <EntityProvider value={mockEntityContext}>
          <Camera clearFlags="depthOnly" />
        </EntityProvider>,
      );

      expect(mockComponentRegistry.addComponent).toHaveBeenCalledWith(
        mockEntityId,
        'Camera',
        expect.objectContaining({
          clearFlags: 'depthOnly',
        }),
      );
    });

    it('should support dontClear clear flag', () => {
      mockComponentRegistry.hasComponent.mockReturnValue(false);

      render(
        <EntityProvider value={mockEntityContext}>
          <Camera clearFlags="dontClear" />
        </EntityProvider>,
      );

      expect(mockComponentRegistry.addComponent).toHaveBeenCalledWith(
        mockEntityId,
        'Camera',
        expect.objectContaining({
          clearFlags: 'dontClear',
        }),
      );
    });
  });

  describe('Camera Depth', () => {
    it('should set camera depth for layering', () => {
      mockComponentRegistry.hasComponent.mockReturnValue(false);

      render(
        <EntityProvider value={mockEntityContext}>
          <Camera depth={10} />
        </EntityProvider>,
      );

      expect(mockComponentRegistry.addComponent).toHaveBeenCalledWith(
        mockEntityId,
        'Camera',
        expect.objectContaining({
          depth: 10,
        }),
      );
    });

    it('should support negative depth values', () => {
      mockComponentRegistry.hasComponent.mockReturnValue(false);

      render(
        <EntityProvider value={mockEntityContext}>
          <Camera depth={-5} />
        </EntityProvider>,
      );

      expect(mockComponentRegistry.addComponent).toHaveBeenCalledWith(
        mockEntityId,
        'Camera',
        expect.objectContaining({
          depth: -5,
        }),
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle extreme FOV values', () => {
      mockComponentRegistry.hasComponent.mockReturnValue(false);

      render(
        <EntityProvider value={mockEntityContext}>
          <Camera fov={179} />
        </EntityProvider>,
      );

      expect(mockComponentRegistry.addComponent).toHaveBeenCalledWith(
        mockEntityId,
        'Camera',
        expect.objectContaining({
          fov: 179,
        }),
      );
    });

    it('should handle very small near plane', () => {
      mockComponentRegistry.hasComponent.mockReturnValue(false);

      render(
        <EntityProvider value={mockEntityContext}>
          <Camera near={0.001} />
        </EntityProvider>,
      );

      expect(mockComponentRegistry.addComponent).toHaveBeenCalledWith(
        mockEntityId,
        'Camera',
        expect.objectContaining({
          near: 0.001,
        }),
      );
    });

    it('should handle very large far plane', () => {
      mockComponentRegistry.hasComponent.mockReturnValue(false);

      render(
        <EntityProvider value={mockEntityContext}>
          <Camera far={10000} />
        </EntityProvider>,
      );

      expect(mockComponentRegistry.addComponent).toHaveBeenCalledWith(
        mockEntityId,
        'Camera',
        expect.objectContaining({
          far: 10000,
        }),
      );
    });

    it('should handle all props simultaneously', () => {
      mockComponentRegistry.hasComponent.mockReturnValue(false);

      const allProps = {
        fov: 70,
        near: 0.5,
        far: 750,
        projectionType: 'perspective' as const,
        orthographicSize: 12,
        depth: 3,
        isMain: true,
        clearFlags: 'solidColor' as const,
        backgroundColor: { r: 0.2, g: 0.4, b: 0.6, a: 1.0 },
      };

      render(
        <EntityProvider value={mockEntityContext}>
          <Camera {...allProps} />
        </EntityProvider>,
      );

      expect(mockComponentRegistry.addComponent).toHaveBeenCalledWith(
        mockEntityId,
        'Camera',
        allProps,
      );
    });
  });

  describe('Integration with Entity Context', () => {
    it('should use entityId from context', () => {
      mockComponentRegistry.hasComponent.mockReturnValue(false);

      const customContext = {
        entityId: 999,
        entityName: 'CustomCamera',
        persistentId: 'custom-999',
      };

      render(
        <EntityProvider value={customContext}>
          <Camera />
        </EntityProvider>,
      );

      expect(mockComponentRegistry.addComponent).toHaveBeenCalledWith(
        999,
        'Camera',
        expect.any(Object),
      );
    });
  });
});
