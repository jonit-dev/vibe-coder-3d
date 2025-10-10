import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';

import { componentRegistry } from '@/core/lib/ecs/ComponentRegistry';

import { Transform, Position, Rotation, Scale } from '../Transform';
import { EntityProvider } from '../EntityContext';

// Mock dependencies
vi.mock('@/core/lib/ecs/ComponentRegistry');

describe('Transform Component', () => {
  const mockEntityId = 42;
  const mockEntityContext = {
    entityId: mockEntityId,
    entityName: 'TestTransform',
    persistentId: 'test-transform-123',
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

  describe('Transform Creation', () => {
    it('should add Transform component with default props', () => {
      mockComponentRegistry.hasComponent.mockReturnValue(false);

      render(
        <EntityProvider value={mockEntityContext}>
          <Transform />
        </EntityProvider>,
      );

      expect(mockComponentRegistry.addComponent).toHaveBeenCalledWith(mockEntityId, 'Transform', {
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
      });
    });

    it('should add Transform component with custom position', () => {
      mockComponentRegistry.hasComponent.mockReturnValue(false);

      render(
        <EntityProvider value={mockEntityContext}>
          <Transform position={[5, 10, -3]} />
        </EntityProvider>,
      );

      expect(mockComponentRegistry.addComponent).toHaveBeenCalledWith(
        mockEntityId,
        'Transform',
        expect.objectContaining({
          position: [5, 10, -3],
        }),
      );
    });

    it('should add Transform component with custom rotation', () => {
      mockComponentRegistry.hasComponent.mockReturnValue(false);

      render(
        <EntityProvider value={mockEntityContext}>
          <Transform rotation={[0, Math.PI / 2, 0]} />
        </EntityProvider>,
      );

      expect(mockComponentRegistry.addComponent).toHaveBeenCalledWith(
        mockEntityId,
        'Transform',
        expect.objectContaining({
          rotation: [0, Math.PI / 2, 0],
        }),
      );
    });

    it('should add Transform component with custom scale', () => {
      mockComponentRegistry.hasComponent.mockReturnValue(false);

      render(
        <EntityProvider value={mockEntityContext}>
          <Transform scale={[2, 2, 2]} />
        </EntityProvider>,
      );

      expect(mockComponentRegistry.addComponent).toHaveBeenCalledWith(
        mockEntityId,
        'Transform',
        expect.objectContaining({
          scale: [2, 2, 2],
        }),
      );
    });

    it('should add Transform with all props', () => {
      mockComponentRegistry.hasComponent.mockReturnValue(false);

      render(
        <EntityProvider value={mockEntityContext}>
          <Transform position={[1, 2, 3]} rotation={[0.1, 0.2, 0.3]} scale={[0.5, 1.5, 2.5]} />
        </EntityProvider>,
      );

      expect(mockComponentRegistry.addComponent).toHaveBeenCalledWith(mockEntityId, 'Transform', {
        position: [1, 2, 3],
        rotation: [0.1, 0.2, 0.3],
        scale: [0.5, 1.5, 2.5],
      });
    });

    it('should update existing Transform component', () => {
      mockComponentRegistry.hasComponent.mockReturnValue(true);

      render(
        <EntityProvider value={mockEntityContext}>
          <Transform position={[10, 20, 30]} />
        </EntityProvider>,
      );

      expect(mockComponentRegistry.updateComponent).toHaveBeenCalledWith(
        mockEntityId,
        'Transform',
        expect.objectContaining({
          position: [10, 20, 30],
        }),
      );
    });
  });

  describe('Transform Updates', () => {
    it('should update Transform when position changes', () => {
      mockComponentRegistry.hasComponent.mockReturnValue(true);

      const { rerender } = render(
        <EntityProvider value={mockEntityContext}>
          <Transform position={[0, 0, 0]} />
        </EntityProvider>,
      );

      expect(mockComponentRegistry.updateComponent).toHaveBeenCalledTimes(1);

      rerender(
        <EntityProvider value={mockEntityContext}>
          <Transform position={[5, 5, 5]} />
        </EntityProvider>,
      );

      expect(mockComponentRegistry.updateComponent).toHaveBeenCalledTimes(2);
      expect(mockComponentRegistry.updateComponent).toHaveBeenLastCalledWith(
        mockEntityId,
        'Transform',
        expect.objectContaining({
          position: [5, 5, 5],
        }),
      );
    });

    it('should update Transform when rotation changes', () => {
      mockComponentRegistry.hasComponent.mockReturnValue(true);

      const { rerender } = render(
        <EntityProvider value={mockEntityContext}>
          <Transform rotation={[0, 0, 0]} />
        </EntityProvider>,
      );

      rerender(
        <EntityProvider value={mockEntityContext}>
          <Transform rotation={[Math.PI, 0, 0]} />
        </EntityProvider>,
      );

      expect(mockComponentRegistry.updateComponent).toHaveBeenCalledTimes(2);
      expect(mockComponentRegistry.updateComponent).toHaveBeenLastCalledWith(
        mockEntityId,
        'Transform',
        expect.objectContaining({
          rotation: [Math.PI, 0, 0],
        }),
      );
    });

    it('should update Transform when scale changes', () => {
      mockComponentRegistry.hasComponent.mockReturnValue(true);

      const { rerender } = render(
        <EntityProvider value={mockEntityContext}>
          <Transform scale={[1, 1, 1]} />
        </EntityProvider>,
      );

      rerender(
        <EntityProvider value={mockEntityContext}>
          <Transform scale={[3, 3, 3]} />
        </EntityProvider>,
      );

      expect(mockComponentRegistry.updateComponent).toHaveBeenCalledTimes(2);
      expect(mockComponentRegistry.updateComponent).toHaveBeenLastCalledWith(
        mockEntityId,
        'Transform',
        expect.objectContaining({
          scale: [3, 3, 3],
        }),
      );
    });

    it('should update when multiple properties change', () => {
      mockComponentRegistry.hasComponent.mockReturnValue(true);

      const { rerender } = render(
        <EntityProvider value={mockEntityContext}>
          <Transform position={[0, 0, 0]} rotation={[0, 0, 0]} scale={[1, 1, 1]} />
        </EntityProvider>,
      );

      rerender(
        <EntityProvider value={mockEntityContext}>
          <Transform position={[10, 0, 0]} rotation={[0, Math.PI, 0]} scale={[2, 1, 1]} />
        </EntityProvider>,
      );

      expect(mockComponentRegistry.updateComponent).toHaveBeenCalledTimes(2);
      expect(mockComponentRegistry.updateComponent).toHaveBeenLastCalledWith(
        mockEntityId,
        'Transform',
        {
          position: [10, 0, 0],
          rotation: [0, Math.PI, 0],
          scale: [2, 1, 1],
        },
      );
    });
  });

  describe('Position Convenience Component', () => {
    it('should create Transform with only position', () => {
      mockComponentRegistry.hasComponent.mockReturnValue(false);

      render(
        <EntityProvider value={mockEntityContext}>
          <Position position={[10, 20, 30]} />
        </EntityProvider>,
      );

      expect(mockComponentRegistry.addComponent).toHaveBeenCalledWith(mockEntityId, 'Transform', {
        position: [10, 20, 30],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
      });
    });

    it('should update position while keeping defaults', () => {
      mockComponentRegistry.hasComponent.mockReturnValue(true);

      render(
        <EntityProvider value={mockEntityContext}>
          <Position position={[-5, 0, 15]} />
        </EntityProvider>,
      );

      expect(mockComponentRegistry.updateComponent).toHaveBeenCalledWith(
        mockEntityId,
        'Transform',
        {
          position: [-5, 0, 15],
          rotation: [0, 0, 0],
          scale: [1, 1, 1],
        },
      );
    });
  });

  describe('Rotation Convenience Component', () => {
    it('should create Transform with only rotation', () => {
      mockComponentRegistry.hasComponent.mockReturnValue(false);

      render(
        <EntityProvider value={mockEntityContext}>
          <Rotation rotation={[0, Math.PI / 4, 0]} />
        </EntityProvider>,
      );

      expect(mockComponentRegistry.addComponent).toHaveBeenCalledWith(mockEntityId, 'Transform', {
        position: [0, 0, 0],
        rotation: [0, Math.PI / 4, 0],
        scale: [1, 1, 1],
      });
    });

    it('should update rotation while keeping defaults', () => {
      mockComponentRegistry.hasComponent.mockReturnValue(true);

      render(
        <EntityProvider value={mockEntityContext}>
          <Rotation rotation={[Math.PI / 2, 0, Math.PI]} />
        </EntityProvider>,
      );

      expect(mockComponentRegistry.updateComponent).toHaveBeenCalledWith(
        mockEntityId,
        'Transform',
        {
          position: [0, 0, 0],
          rotation: [Math.PI / 2, 0, Math.PI],
          scale: [1, 1, 1],
        },
      );
    });
  });

  describe('Scale Convenience Component', () => {
    it('should create Transform with only scale', () => {
      mockComponentRegistry.hasComponent.mockReturnValue(false);

      render(
        <EntityProvider value={mockEntityContext}>
          <Scale scale={[0.5, 2, 1.5]} />
        </EntityProvider>,
      );

      expect(mockComponentRegistry.addComponent).toHaveBeenCalledWith(mockEntityId, 'Transform', {
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [0.5, 2, 1.5],
      });
    });

    it('should update scale while keeping defaults', () => {
      mockComponentRegistry.hasComponent.mockReturnValue(true);

      render(
        <EntityProvider value={mockEntityContext}>
          <Scale scale={[10, 10, 10]} />
        </EntityProvider>,
      );

      expect(mockComponentRegistry.updateComponent).toHaveBeenCalledWith(
        mockEntityId,
        'Transform',
        {
          position: [0, 0, 0],
          rotation: [0, 0, 0],
          scale: [10, 10, 10],
        },
      );
    });
  });

  describe('Rendering', () => {
    it('should not render any DOM elements', () => {
      mockComponentRegistry.hasComponent.mockReturnValue(false);

      const { container } = render(
        <EntityProvider value={mockEntityContext}>
          <Transform />
        </EntityProvider>,
      );

      expect(container.firstChild).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    it('should handle negative position values', () => {
      mockComponentRegistry.hasComponent.mockReturnValue(false);

      render(
        <EntityProvider value={mockEntityContext}>
          <Transform position={[-100, -50, -25]} />
        </EntityProvider>,
      );

      expect(mockComponentRegistry.addComponent).toHaveBeenCalledWith(
        mockEntityId,
        'Transform',
        expect.objectContaining({
          position: [-100, -50, -25],
        }),
      );
    });

    it('should handle negative rotation values', () => {
      mockComponentRegistry.hasComponent.mockReturnValue(false);

      render(
        <EntityProvider value={mockEntityContext}>
          <Transform rotation={[-Math.PI, -Math.PI / 2, -0.5]} />
        </EntityProvider>,
      );

      expect(mockComponentRegistry.addComponent).toHaveBeenCalledWith(
        mockEntityId,
        'Transform',
        expect.objectContaining({
          rotation: [-Math.PI, -Math.PI / 2, -0.5],
        }),
      );
    });

    it('should handle zero scale', () => {
      mockComponentRegistry.hasComponent.mockReturnValue(false);

      render(
        <EntityProvider value={mockEntityContext}>
          <Transform scale={[0, 0, 0]} />
        </EntityProvider>,
      );

      expect(mockComponentRegistry.addComponent).toHaveBeenCalledWith(
        mockEntityId,
        'Transform',
        expect.objectContaining({
          scale: [0, 0, 0],
        }),
      );
    });

    it('should handle negative scale (mirroring)', () => {
      mockComponentRegistry.hasComponent.mockReturnValue(false);

      render(
        <EntityProvider value={mockEntityContext}>
          <Transform scale={[-1, 1, -1]} />
        </EntityProvider>,
      );

      expect(mockComponentRegistry.addComponent).toHaveBeenCalledWith(
        mockEntityId,
        'Transform',
        expect.objectContaining({
          scale: [-1, 1, -1],
        }),
      );
    });

    it('should handle very large position values', () => {
      mockComponentRegistry.hasComponent.mockReturnValue(false);

      render(
        <EntityProvider value={mockEntityContext}>
          <Transform position={[10000, 5000, -8000]} />
        </EntityProvider>,
      );

      expect(mockComponentRegistry.addComponent).toHaveBeenCalledWith(
        mockEntityId,
        'Transform',
        expect.objectContaining({
          position: [10000, 5000, -8000],
        }),
      );
    });

    it('should handle very small scale values', () => {
      mockComponentRegistry.hasComponent.mockReturnValue(false);

      render(
        <EntityProvider value={mockEntityContext}>
          <Transform scale={[0.001, 0.001, 0.001]} />
        </EntityProvider>,
      );

      expect(mockComponentRegistry.addComponent).toHaveBeenCalledWith(
        mockEntityId,
        'Transform',
        expect.objectContaining({
          scale: [0.001, 0.001, 0.001],
        }),
      );
    });

    it('should handle non-uniform scale', () => {
      mockComponentRegistry.hasComponent.mockReturnValue(false);

      render(
        <EntityProvider value={mockEntityContext}>
          <Transform scale={[5, 0.1, 20]} />
        </EntityProvider>,
      );

      expect(mockComponentRegistry.addComponent).toHaveBeenCalledWith(
        mockEntityId,
        'Transform',
        expect.objectContaining({
          scale: [5, 0.1, 20],
        }),
      );
    });

    it('should handle rotation beyond 2π', () => {
      mockComponentRegistry.hasComponent.mockReturnValue(false);

      render(
        <EntityProvider value={mockEntityContext}>
          <Transform rotation={[Math.PI * 3, Math.PI * 4, Math.PI * 5]} />
        </EntityProvider>,
      );

      expect(mockComponentRegistry.addComponent).toHaveBeenCalledWith(
        mockEntityId,
        'Transform',
        expect.objectContaining({
          rotation: [Math.PI * 3, Math.PI * 4, Math.PI * 5],
        }),
      );
    });
  });

  describe('Integration with Entity Context', () => {
    it('should use entityId from context', () => {
      mockComponentRegistry.hasComponent.mockReturnValue(false);

      const customContext = {
        entityId: 999,
        entityName: 'CustomEntity',
        persistentId: 'custom-999',
      };

      render(
        <EntityProvider value={customContext}>
          <Transform position={[1, 2, 3]} />
        </EntityProvider>,
      );

      expect(mockComponentRegistry.addComponent).toHaveBeenCalledWith(
        999,
        'Transform',
        expect.any(Object),
      );
    });
  });
});
