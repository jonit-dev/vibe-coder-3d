import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';

import { componentRegistry } from '@/core/lib/ecs/ComponentRegistry';

import { Light, DirectionalLight, PointLight, SpotLight, AmbientLight } from '../Light';
import { EntityProvider } from '../EntityContext';

// Mock dependencies
vi.mock('@/core/lib/ecs/ComponentRegistry');

describe('Light Component', () => {
  const mockEntityId = 42;
  const mockEntityContext = {
    entityId: mockEntityId,
    entityName: 'TestLight',
    persistentId: 'test-light-123',
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

  describe('Light Creation', () => {
    it('should add Light component with default props', () => {
      mockComponentRegistry.hasComponent.mockReturnValue(false);

      render(
        <EntityProvider value={mockEntityContext}>
          <Light />
        </EntityProvider>,
      );

      expect(mockComponentRegistry.addComponent).toHaveBeenCalledWith(
        mockEntityId,
        'Light',
        expect.objectContaining({
          lightType: 'directional',
          color: { r: 1.0, g: 1.0, b: 1.0 },
          intensity: 1.0,
          enabled: true,
          castShadow: false,
          range: 10,
          angle: 30,
          penumbra: 0,
          directionX: 0,
          directionY: -1,
          directionZ: 0,
          shadowMapSize: 1024,
          shadowBias: -0.0001,
          shadowRadius: 1.0,
        }),
      );
    });

    it('should add Light component with custom props', () => {
      mockComponentRegistry.hasComponent.mockReturnValue(false);

      render(
        <EntityProvider value={mockEntityContext}>
          <Light
            lightType="point"
            color={{ r: 1.0, g: 0.5, b: 0.0 }}
            intensity={2.5}
            enabled={false}
            castShadow={true}
            range={20}
            shadowMapSize={2048}
          />
        </EntityProvider>,
      );

      expect(mockComponentRegistry.addComponent).toHaveBeenCalledWith(
        mockEntityId,
        'Light',
        expect.objectContaining({
          lightType: 'point',
          color: { r: 1.0, g: 0.5, b: 0.0 },
          intensity: 2.5,
          enabled: false,
          castShadow: true,
          range: 20,
          shadowMapSize: 2048,
        }),
      );
    });

    it('should update existing Light component', () => {
      mockComponentRegistry.hasComponent.mockReturnValue(true);

      render(
        <EntityProvider value={mockEntityContext}>
          <Light intensity={3.0} color={{ r: 0.8, g: 0.2, b: 0.1 }} />
        </EntityProvider>,
      );

      expect(mockComponentRegistry.updateComponent).toHaveBeenCalledWith(
        mockEntityId,
        'Light',
        expect.objectContaining({
          intensity: 3.0,
          color: { r: 0.8, g: 0.2, b: 0.1 },
        }),
      );
    });
  });

  describe('Light Types', () => {
    it('should create directional light', () => {
      mockComponentRegistry.hasComponent.mockReturnValue(false);

      render(
        <EntityProvider value={mockEntityContext}>
          <Light lightType="directional" directionX={1} directionY={-1} directionZ={0} />
        </EntityProvider>,
      );

      expect(mockComponentRegistry.addComponent).toHaveBeenCalledWith(
        mockEntityId,
        'Light',
        expect.objectContaining({
          lightType: 'directional',
          directionX: 1,
          directionY: -1,
          directionZ: 0,
        }),
      );
    });

    it('should create point light with range', () => {
      mockComponentRegistry.hasComponent.mockReturnValue(false);

      render(
        <EntityProvider value={mockEntityContext}>
          <Light lightType="point" range={15} />
        </EntityProvider>,
      );

      expect(mockComponentRegistry.addComponent).toHaveBeenCalledWith(
        mockEntityId,
        'Light',
        expect.objectContaining({
          lightType: 'point',
          range: 15,
        }),
      );
    });

    it('should create spot light with angle and penumbra', () => {
      mockComponentRegistry.hasComponent.mockReturnValue(false);

      render(
        <EntityProvider value={mockEntityContext}>
          <Light lightType="spot" angle={45} penumbra={0.5} />
        </EntityProvider>,
      );

      expect(mockComponentRegistry.addComponent).toHaveBeenCalledWith(
        mockEntityId,
        'Light',
        expect.objectContaining({
          lightType: 'spot',
          angle: 45,
          penumbra: 0.5,
        }),
      );
    });

    it('should create ambient light', () => {
      mockComponentRegistry.hasComponent.mockReturnValue(false);

      render(
        <EntityProvider value={mockEntityContext}>
          <Light lightType="ambient" intensity={0.5} />
        </EntityProvider>,
      );

      expect(mockComponentRegistry.addComponent).toHaveBeenCalledWith(
        mockEntityId,
        'Light',
        expect.objectContaining({
          lightType: 'ambient',
          intensity: 0.5,
        }),
      );
    });
  });

  describe('Light Properties', () => {
    it('should set light color', () => {
      mockComponentRegistry.hasComponent.mockReturnValue(false);

      const customColor = { r: 0.3, g: 0.7, b: 0.9 };

      render(
        <EntityProvider value={mockEntityContext}>
          <Light color={customColor} />
        </EntityProvider>,
      );

      expect(mockComponentRegistry.addComponent).toHaveBeenCalledWith(
        mockEntityId,
        'Light',
        expect.objectContaining({
          color: customColor,
        }),
      );
    });

    it('should set light intensity', () => {
      mockComponentRegistry.hasComponent.mockReturnValue(false);

      render(
        <EntityProvider value={mockEntityContext}>
          <Light intensity={5.0} />
        </EntityProvider>,
      );

      expect(mockComponentRegistry.addComponent).toHaveBeenCalledWith(
        mockEntityId,
        'Light',
        expect.objectContaining({
          intensity: 5.0,
        }),
      );
    });

    it('should enable/disable light', () => {
      mockComponentRegistry.hasComponent.mockReturnValue(false);

      const { rerender } = render(
        <EntityProvider value={mockEntityContext}>
          <Light enabled={true} />
        </EntityProvider>,
      );

      expect(mockComponentRegistry.addComponent).toHaveBeenCalledWith(
        mockEntityId,
        'Light',
        expect.objectContaining({
          enabled: true,
        }),
      );

      mockComponentRegistry.hasComponent.mockReturnValue(true);

      rerender(
        <EntityProvider value={mockEntityContext}>
          <Light enabled={false} />
        </EntityProvider>,
      );

      expect(mockComponentRegistry.updateComponent).toHaveBeenCalledWith(
        mockEntityId,
        'Light',
        expect.objectContaining({
          enabled: false,
        }),
      );
    });

    it('should configure shadow casting', () => {
      mockComponentRegistry.hasComponent.mockReturnValue(false);

      render(
        <EntityProvider value={mockEntityContext}>
          <Light castShadow={true} shadowMapSize={4096} shadowBias={-0.001} shadowRadius={2.0} />
        </EntityProvider>,
      );

      expect(mockComponentRegistry.addComponent).toHaveBeenCalledWith(
        mockEntityId,
        'Light',
        expect.objectContaining({
          castShadow: true,
          shadowMapSize: 4096,
          shadowBias: -0.001,
          shadowRadius: 2.0,
        }),
      );
    });
  });

  describe('DirectionalLight Convenience Component', () => {
    it('should create directional light with default props', () => {
      mockComponentRegistry.hasComponent.mockReturnValue(false);

      render(
        <EntityProvider value={mockEntityContext}>
          <DirectionalLight />
        </EntityProvider>,
      );

      expect(mockComponentRegistry.addComponent).toHaveBeenCalledWith(
        mockEntityId,
        'Light',
        expect.objectContaining({
          lightType: 'directional',
        }),
      );
    });

    it('should create directional light with custom direction', () => {
      mockComponentRegistry.hasComponent.mockReturnValue(false);

      render(
        <EntityProvider value={mockEntityContext}>
          <DirectionalLight directionX={0} directionY={0} directionZ={-1} />
        </EntityProvider>,
      );

      expect(mockComponentRegistry.addComponent).toHaveBeenCalledWith(
        mockEntityId,
        'Light',
        expect.objectContaining({
          lightType: 'directional',
          directionX: 0,
          directionY: 0,
          directionZ: -1,
        }),
      );
    });
  });

  describe('PointLight Convenience Component', () => {
    it('should create point light with default props', () => {
      mockComponentRegistry.hasComponent.mockReturnValue(false);

      render(
        <EntityProvider value={mockEntityContext}>
          <PointLight />
        </EntityProvider>,
      );

      expect(mockComponentRegistry.addComponent).toHaveBeenCalledWith(
        mockEntityId,
        'Light',
        expect.objectContaining({
          lightType: 'point',
          range: 10,
        }),
      );
    });

    it('should create point light with custom range', () => {
      mockComponentRegistry.hasComponent.mockReturnValue(false);

      render(
        <EntityProvider value={mockEntityContext}>
          <PointLight range={25} intensity={3.0} />
        </EntityProvider>,
      );

      expect(mockComponentRegistry.addComponent).toHaveBeenCalledWith(
        mockEntityId,
        'Light',
        expect.objectContaining({
          lightType: 'point',
          range: 25,
          intensity: 3.0,
        }),
      );
    });
  });

  describe('SpotLight Convenience Component', () => {
    it('should create spot light with default props', () => {
      mockComponentRegistry.hasComponent.mockReturnValue(false);

      render(
        <EntityProvider value={mockEntityContext}>
          <SpotLight />
        </EntityProvider>,
      );

      expect(mockComponentRegistry.addComponent).toHaveBeenCalledWith(
        mockEntityId,
        'Light',
        expect.objectContaining({
          lightType: 'spot',
          angle: 30,
          penumbra: 0,
        }),
      );
    });

    it('should create spot light with custom angle and penumbra', () => {
      mockComponentRegistry.hasComponent.mockReturnValue(false);

      render(
        <EntityProvider value={mockEntityContext}>
          <SpotLight angle={60} penumbra={0.8} range={30} />
        </EntityProvider>,
      );

      expect(mockComponentRegistry.addComponent).toHaveBeenCalledWith(
        mockEntityId,
        'Light',
        expect.objectContaining({
          lightType: 'spot',
          angle: 60,
          penumbra: 0.8,
          range: 30,
        }),
      );
    });
  });

  describe('AmbientLight Convenience Component', () => {
    it('should create ambient light with default props', () => {
      mockComponentRegistry.hasComponent.mockReturnValue(false);

      render(
        <EntityProvider value={mockEntityContext}>
          <AmbientLight />
        </EntityProvider>,
      );

      expect(mockComponentRegistry.addComponent).toHaveBeenCalledWith(
        mockEntityId,
        'Light',
        expect.objectContaining({
          lightType: 'ambient',
        }),
      );
    });

    it('should create ambient light with custom intensity', () => {
      mockComponentRegistry.hasComponent.mockReturnValue(false);

      render(
        <EntityProvider value={mockEntityContext}>
          <AmbientLight intensity={0.3} color={{ r: 0.5, g: 0.5, b: 0.7 }} />
        </EntityProvider>,
      );

      expect(mockComponentRegistry.addComponent).toHaveBeenCalledWith(
        mockEntityId,
        'Light',
        expect.objectContaining({
          lightType: 'ambient',
          intensity: 0.3,
          color: { r: 0.5, g: 0.5, b: 0.7 },
        }),
      );
    });
  });

  describe('Rendering', () => {
    it('should not render any DOM elements', () => {
      mockComponentRegistry.hasComponent.mockReturnValue(false);

      const { container } = render(
        <EntityProvider value={mockEntityContext}>
          <Light />
        </EntityProvider>,
      );

      expect(container.firstChild).toBeNull();
    });
  });

  describe('Light Updates', () => {
    it('should update when intensity changes', () => {
      mockComponentRegistry.hasComponent.mockReturnValue(true);

      const { rerender } = render(
        <EntityProvider value={mockEntityContext}>
          <Light intensity={1.0} />
        </EntityProvider>,
      );

      rerender(
        <EntityProvider value={mockEntityContext}>
          <Light intensity={5.0} />
        </EntityProvider>,
      );

      expect(mockComponentRegistry.updateComponent).toHaveBeenCalledTimes(2);
      expect(mockComponentRegistry.updateComponent).toHaveBeenLastCalledWith(
        mockEntityId,
        'Light',
        expect.objectContaining({
          intensity: 5.0,
        }),
      );
    });

    it('should update when color changes', () => {
      mockComponentRegistry.hasComponent.mockReturnValue(true);

      const { rerender } = render(
        <EntityProvider value={mockEntityContext}>
          <Light color={{ r: 1, g: 1, b: 1 }} />
        </EntityProvider>,
      );

      rerender(
        <EntityProvider value={mockEntityContext}>
          <Light color={{ r: 1, g: 0, b: 0 }} />
        </EntityProvider>,
      );

      expect(mockComponentRegistry.updateComponent).toHaveBeenCalledTimes(2);
      expect(mockComponentRegistry.updateComponent).toHaveBeenLastCalledWith(
        mockEntityId,
        'Light',
        expect.objectContaining({
          color: { r: 1, g: 0, b: 0 },
        }),
      );
    });

    it('should update when shadow properties change', () => {
      mockComponentRegistry.hasComponent.mockReturnValue(true);

      const { rerender } = render(
        <EntityProvider value={mockEntityContext}>
          <Light castShadow={false} />
        </EntityProvider>,
      );

      rerender(
        <EntityProvider value={mockEntityContext}>
          <Light castShadow={true} shadowMapSize={2048} />
        </EntityProvider>,
      );

      expect(mockComponentRegistry.updateComponent).toHaveBeenLastCalledWith(
        mockEntityId,
        'Light',
        expect.objectContaining({
          castShadow: true,
          shadowMapSize: 2048,
        }),
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle very high intensity', () => {
      mockComponentRegistry.hasComponent.mockReturnValue(false);

      render(
        <EntityProvider value={mockEntityContext}>
          <Light intensity={1000} />
        </EntityProvider>,
      );

      expect(mockComponentRegistry.addComponent).toHaveBeenCalledWith(
        mockEntityId,
        'Light',
        expect.objectContaining({
          intensity: 1000,
        }),
      );
    });

    it('should handle zero intensity', () => {
      mockComponentRegistry.hasComponent.mockReturnValue(false);

      render(
        <EntityProvider value={mockEntityContext}>
          <Light intensity={0} />
        </EntityProvider>,
      );

      expect(mockComponentRegistry.addComponent).toHaveBeenCalledWith(
        mockEntityId,
        'Light',
        expect.objectContaining({
          intensity: 0,
        }),
      );
    });

    it('should handle extreme shadow map sizes', () => {
      mockComponentRegistry.hasComponent.mockReturnValue(false);

      render(
        <EntityProvider value={mockEntityContext}>
          <Light castShadow={true} shadowMapSize={8192} />
        </EntityProvider>,
      );

      expect(mockComponentRegistry.addComponent).toHaveBeenCalledWith(
        mockEntityId,
        'Light',
        expect.objectContaining({
          shadowMapSize: 8192,
        }),
      );
    });

    it('should handle negative shadow bias', () => {
      mockComponentRegistry.hasComponent.mockReturnValue(false);

      render(
        <EntityProvider value={mockEntityContext}>
          <Light shadowBias={-0.01} />
        </EntityProvider>,
      );

      expect(mockComponentRegistry.addComponent).toHaveBeenCalledWith(
        mockEntityId,
        'Light',
        expect.objectContaining({
          shadowBias: -0.01,
        }),
      );
    });

    it('should handle all props simultaneously', () => {
      mockComponentRegistry.hasComponent.mockReturnValue(false);

      const allProps = {
        lightType: 'spot' as const,
        color: { r: 0.5, g: 0.8, b: 0.3 },
        intensity: 2.5,
        enabled: true,
        castShadow: true,
        range: 20,
        angle: 45,
        penumbra: 0.5,
        directionX: 1,
        directionY: 0,
        directionZ: 0,
        shadowMapSize: 2048,
        shadowBias: -0.0005,
        shadowRadius: 1.5,
      };

      render(
        <EntityProvider value={mockEntityContext}>
          <Light {...allProps} />
        </EntityProvider>,
      );

      expect(mockComponentRegistry.addComponent).toHaveBeenCalledWith(
        mockEntityId,
        'Light',
        allProps,
      );
    });
  });
});
