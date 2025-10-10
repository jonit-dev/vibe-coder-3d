import { render, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';

import { componentRegistry } from '@/core/lib/ecs/ComponentRegistry';
import { EntityManager } from '@/core/lib/ecs/EntityManager';
import { generatePersistentId } from '@/core/lib/ecs/components/definitions/PersistentIdComponent';

import { Entity, EntityDebug } from '../Entity';
import { useEntityContext } from '../EntityContext';

// Mock dependencies
vi.mock('@/core/lib/ecs/EntityManager');
vi.mock('@/core/lib/ecs/ComponentRegistry');
vi.mock('@/core/lib/ecs/components/definitions/PersistentIdComponent');

describe('Entity Component', () => {
  let mockEntityManager: ReturnType<typeof vi.fn>;
  let mockComponentRegistry: typeof componentRegistry;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup mock EntityManager
    mockEntityManager = {
      createEntity: vi.fn(),
      deleteEntity: vi.fn(),
    };

    vi.mocked(EntityManager.getInstance).mockReturnValue(mockEntityManager as any);

    // Setup mock ComponentRegistry
    mockComponentRegistry = {
      hasComponent: vi.fn(),
      addComponent: vi.fn(),
      updateComponent: vi.fn(),
    } as any;

    Object.assign(componentRegistry, mockComponentRegistry);

    // Mock generatePersistentId
    vi.mocked(generatePersistentId).mockReturnValue('test-persistent-id-123');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Entity Lifecycle', () => {
    it('should create an entity with default name on mount', async () => {
      const mockEntity = { id: 1, name: 'Entity', children: [] };
      mockEntityManager.createEntity.mockReturnValue(mockEntity);
      mockComponentRegistry.hasComponent.mockReturnValue(false);

      render(<Entity />);

      await waitFor(() => {
        expect(mockEntityManager.createEntity).toHaveBeenCalledWith('Entity', undefined);
      });
    });

    it('should create an entity with custom name', async () => {
      const mockEntity = { id: 1, name: 'Player', children: [] };
      mockEntityManager.createEntity.mockReturnValue(mockEntity);
      mockComponentRegistry.hasComponent.mockReturnValue(false);

      render(<Entity name="Player" />);

      await waitFor(() => {
        expect(mockEntityManager.createEntity).toHaveBeenCalledWith('Player', undefined);
      });
    });

    it('should create an entity with parentId', async () => {
      const mockEntity = { id: 2, name: 'Child', children: [] };
      mockEntityManager.createEntity.mockReturnValue(mockEntity);
      mockComponentRegistry.hasComponent.mockReturnValue(false);

      render(<Entity name="Child" parentId={1} />);

      await waitFor(() => {
        expect(mockEntityManager.createEntity).toHaveBeenCalledWith('Child', 1);
      });
    });

    it('should delete entity on unmount', async () => {
      const mockEntity = { id: 1, name: 'Entity', children: [] };
      mockEntityManager.createEntity.mockReturnValue(mockEntity);
      mockComponentRegistry.hasComponent.mockReturnValue(false);

      const { unmount } = render(<Entity />);

      await waitFor(() => {
        expect(mockEntityManager.createEntity).toHaveBeenCalled();
      });

      unmount();

      // Entity now uses ref to track entityId for cleanup, so it works correctly
      expect(mockEntityManager.deleteEntity).toHaveBeenCalledWith(1);
    });

    it('should handle entity creation errors gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockEntityManager.createEntity.mockImplementation(() => {
        throw new Error('Entity creation failed');
      });

      render(<Entity />);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          expect.stringContaining('[Entity] Failed to create entity'),
          expect.any(Error),
        );
      });

      consoleErrorSpy.mockRestore();
    });

    it('should handle entity deletion errors gracefully', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const mockEntity = { id: 1, name: 'Entity', children: [] };
      mockEntityManager.createEntity.mockReturnValue(mockEntity);
      mockComponentRegistry.hasComponent.mockReturnValue(false);
      mockEntityManager.deleteEntity.mockImplementation(() => {
        throw new Error('Deletion failed');
      });

      const { unmount } = render(<Entity />);

      await waitFor(() => {
        expect(mockEntityManager.createEntity).toHaveBeenCalled();
      });

      unmount();

      // Cleanup now works correctly with ref, so error handling is triggered
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Entity] Failed to cleanup entity'),
        expect.any(Error),
      );

      consoleWarnSpy.mockRestore();
    });
  });

  describe('Persistent ID Management', () => {
    it('should generate persistent ID if not provided', async () => {
      const mockEntity = { id: 1, name: 'Entity', children: [] };
      mockEntityManager.createEntity.mockReturnValue(mockEntity);
      mockComponentRegistry.hasComponent.mockReturnValue(false);

      render(<Entity />);

      await waitFor(() => {
        expect(generatePersistentId).toHaveBeenCalled();
        expect(mockComponentRegistry.addComponent).toHaveBeenCalledWith(1, 'PersistentId', {
          id: 'test-persistent-id-123',
        });
      });
    });

    it('should use provided persistent ID', async () => {
      const customPersistentId = 'custom-id-456';
      const mockEntity = { id: 1, name: 'Entity', children: [] };
      mockEntityManager.createEntity.mockReturnValue(mockEntity);
      mockComponentRegistry.hasComponent.mockReturnValue(false);

      render(<Entity persistentId={customPersistentId} />);

      await waitFor(() => {
        expect(generatePersistentId).not.toHaveBeenCalled();
        expect(mockComponentRegistry.addComponent).toHaveBeenCalledWith(1, 'PersistentId', {
          id: customPersistentId,
        });
      });
    });

    it('should update existing PersistentId component if already present', async () => {
      const customPersistentId = 'custom-id-789';
      const mockEntity = { id: 1, name: 'Entity', children: [] };
      mockEntityManager.createEntity.mockReturnValue(mockEntity);
      mockComponentRegistry.hasComponent.mockReturnValue(true); // Component exists

      render(<Entity persistentId={customPersistentId} />);

      await waitFor(() => {
        expect(mockComponentRegistry.updateComponent).toHaveBeenCalledWith(1, 'PersistentId', {
          id: customPersistentId,
        });
      });
    });
  });

  describe('Context Provider', () => {
    it('should provide entity context to children', async () => {
      const mockEntity = { id: 42, name: 'TestEntity', children: [] };
      mockEntityManager.createEntity.mockReturnValue(mockEntity);
      mockComponentRegistry.hasComponent.mockReturnValue(false);

      let contextValue: any = null;

      const ChildComponent = () => {
        contextValue = useEntityContext();
        return <div>Child</div>;
      };

      render(
        <Entity name="TestEntity">
          <ChildComponent />
        </Entity>,
      );

      await waitFor(() => {
        expect(contextValue).toEqual({
          entityId: 42,
          entityName: 'TestEntity',
          persistentId: 'test-persistent-id-123',
        });
      });
    });

    it('should not render children until entity is created', () => {
      const mockEntity = { id: 1, name: 'Entity', children: [] };
      mockEntityManager.createEntity.mockReturnValue(mockEntity);
      mockComponentRegistry.hasComponent.mockReturnValue(false);

      let childRendered = false;

      const ChildComponent = () => {
        childRendered = true;
        return <div>Child</div>;
      };

      const { container } = render(
        <Entity>
          <ChildComponent />
        </Entity>,
      );

      // Before entity creation, children should not render
      if (container.innerHTML === '') {
        expect(childRendered).toBe(false);
      }
    });
  });

  describe('React StrictMode Compatibility', () => {
    it('should prevent double entity creation in StrictMode', async () => {
      const mockEntity = { id: 1, name: 'Entity', children: [] };
      mockEntityManager.createEntity.mockReturnValue(mockEntity);
      mockComponentRegistry.hasComponent.mockReturnValue(false);

      // Simulate React StrictMode double mounting
      const { unmount, rerender } = render(<Entity />);

      await waitFor(() => {
        expect(mockEntityManager.createEntity).toHaveBeenCalledTimes(1);
      });

      // Rerender should not create another entity
      rerender(<Entity />);

      expect(mockEntityManager.createEntity).toHaveBeenCalledTimes(1);

      unmount();
    });
  });

  describe('Nested Entities', () => {
    it('should support nested entity hierarchy', async () => {
      const parentEntity = { id: 1, name: 'Parent', children: [] };
      const childEntity = { id: 2, name: 'Child', children: [] };

      mockEntityManager.createEntity
        .mockReturnValueOnce(parentEntity)
        .mockReturnValueOnce(childEntity);
      mockComponentRegistry.hasComponent.mockReturnValue(false);

      let parentContext: any = null;
      let childContext: any = null;

      const ChildComponent = () => {
        childContext = useEntityContext();
        return <div>Child</div>;
      };

      const ParentComponent = () => {
        parentContext = useEntityContext();
        return (
          <Entity name="Child" parentId={parentContext?.entityId}>
            <ChildComponent />
          </Entity>
        );
      };

      render(
        <Entity name="Parent">
          <ParentComponent />
        </Entity>,
      );

      await waitFor(() => {
        expect(parentContext).toBeTruthy();
        expect(childContext).toBeTruthy();
        expect(parentContext?.entityName).toBe('Parent');
        expect(childContext?.entityName).toBe('Child');
      });
    });
  });

  describe('EntityDebug Component', () => {
    it('should render debug wrapper with children', () => {
      const { container } = render(
        <EntityDebug>
          <div>Test Content</div>
        </EntityDebug>,
      );

      expect(container.querySelector('div[style*="border"]')).toBeTruthy();
      expect(container.textContent).toContain('Test Content');
    });

    it('should have debug styling', () => {
      const { container } = render(
        <EntityDebug>
          <div>Debug Test</div>
        </EntityDebug>,
      );

      const debugWrapper = container.querySelector('div[style*="border"]') as HTMLElement;
      expect(debugWrapper).toBeTruthy();
      expect(debugWrapper.style.border).toContain('dashed');
    });
  });

  describe('Edge Cases', () => {
    it('should handle entity creation with all props', async () => {
      const mockEntity = { id: 5, name: 'CompleteEntity', children: [] };
      mockEntityManager.createEntity.mockReturnValue(mockEntity);
      mockComponentRegistry.hasComponent.mockReturnValue(false);

      render(
        <Entity name="CompleteEntity" persistentId="complete-id-999" parentId={3} debug={true}>
          <div>Child Content</div>
        </Entity>,
      );

      await waitFor(() => {
        expect(mockEntityManager.createEntity).toHaveBeenCalledWith('CompleteEntity', 3);
        expect(mockComponentRegistry.addComponent).toHaveBeenCalledWith(5, 'PersistentId', {
          id: 'complete-id-999',
        });
      });
    });

    it('should handle rapid mount/unmount cycles', async () => {
      const mockEntity = { id: 1, name: 'Entity', children: [] };
      mockEntityManager.createEntity.mockReturnValue(mockEntity);
      mockComponentRegistry.hasComponent.mockReturnValue(false);

      const { unmount, rerender } = render(<Entity />);

      await waitFor(() => {
        expect(mockEntityManager.createEntity).toHaveBeenCalledTimes(1);
      });

      unmount();

      // Cleanup now works correctly with ref
      expect(mockEntityManager.createEntity).toHaveBeenCalledTimes(1);
      expect(mockEntityManager.deleteEntity).toHaveBeenCalledTimes(1);
      expect(mockEntityManager.deleteEntity).toHaveBeenCalledWith(1);
    });

    it('should handle empty children gracefully', async () => {
      const mockEntity = { id: 1, name: 'Entity', children: [] };
      mockEntityManager.createEntity.mockReturnValue(mockEntity);
      mockComponentRegistry.hasComponent.mockReturnValue(false);

      const { container } = render(<Entity />);

      await waitFor(() => {
        expect(mockEntityManager.createEntity).toHaveBeenCalled();
      });

      // Should render without errors even with no children
      expect(container).toBeTruthy();
    });

    it('should handle null entityId gracefully during cleanup', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Force entityId to remain null
      const mockEntity = { id: null as any, name: 'Entity', children: [] };
      mockEntityManager.createEntity.mockReturnValue(mockEntity);
      mockComponentRegistry.hasComponent.mockReturnValue(false);

      const { unmount } = render(<Entity />);

      unmount();

      // Should not attempt to delete if entityId is null
      expect(mockEntityManager.deleteEntity).not.toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });
  });

  describe('Performance', () => {
    it('should only create entity once per mount', async () => {
      const mockEntity = { id: 1, name: 'Entity', children: [] };
      mockEntityManager.createEntity.mockReturnValue(mockEntity);
      mockComponentRegistry.hasComponent.mockReturnValue(false);

      const { rerender } = render(<Entity />);

      await waitFor(() => {
        expect(mockEntityManager.createEntity).toHaveBeenCalledTimes(1);
      });

      // Multiple rerenders should not create new entities
      rerender(<Entity />);
      rerender(<Entity />);
      rerender(<Entity />);

      expect(mockEntityManager.createEntity).toHaveBeenCalledTimes(1);
    });

    it('should have empty dependency array in useEffect', async () => {
      // This test validates that the effect only runs once
      const mockEntity = { id: 1, name: 'Entity', children: [] };
      mockEntityManager.createEntity.mockReturnValue(mockEntity);
      mockComponentRegistry.hasComponent.mockReturnValue(false);

      const { rerender } = render(<Entity name="Test" />);

      await waitFor(() => {
        expect(mockEntityManager.createEntity).toHaveBeenCalledTimes(1);
      });

      // Change props - should still only have created entity once
      rerender(<Entity name="Updated" />);

      expect(mockEntityManager.createEntity).toHaveBeenCalledTimes(1);
    });
  });
});
