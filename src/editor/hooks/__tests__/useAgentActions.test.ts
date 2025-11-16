/**
 * Tests for useAgentActions hook
 */

import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useAgentActions } from '../useAgentActions';
import { componentRegistry } from '@core/lib/ecs/ComponentRegistry';
import { getComponentDefaults } from '@core/lib/serialization/defaults/ComponentDefaults';

// Mock dependencies
vi.mock('@core/hooks/useComponentRegistry', () => ({
  useComponentRegistry: () => ({
    updateComponent: vi.fn(),
  }),
}));

vi.mock('../useEntityCreation', () => ({
  useEntityCreation: () => ({
    createCube: vi.fn(),
    createSphere: vi.fn(),
    createCylinder: vi.fn(),
    createCone: vi.fn(),
    createPlane: vi.fn(),
    createDirectionalLight: vi.fn(),
    createGeometryAssetEntity: vi.fn(),
  }),
}));

vi.mock('@editor/store/prefabsStore', () => ({
  usePrefabsStore: () => ({
    refreshPrefabs: vi.fn(),
  }),
}));

vi.mock('@editor/store/editorStore', () => ({
  useEditorStore: () => ({
    setSelectedEntity: vi.fn(),
  }),
}));

describe('useAgentActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up event listeners
    window.removeEventListener('agent:add-component', () => {});
  });

  describe('handleAddComponent', () => {
    it('should add component with default values when available', () => {
      const addComponentSpy = vi.spyOn(componentRegistry, 'addComponent');

      // Render hook to set up event listeners
      renderHook(() => useAgentActions());

      // Get default values for RigidBody
      const defaults = getComponentDefaults('RigidBody');
      expect(defaults).toBeDefined();

      // Dispatch agent:add-component event
      const event = new CustomEvent('agent:add-component', {
        detail: {
          entityId: 26,
          componentType: 'RigidBody',
        },
      });
      window.dispatchEvent(event);

      // Verify addComponent was called with defaults
      expect(addComponentSpy).toHaveBeenCalledWith(
        26,
        'RigidBody',
        expect.objectContaining({
          enabled: true,
          bodyType: 'dynamic',
          mass: 1,
          gravityScale: 1,
          canSleep: true,
          material: expect.objectContaining({
            friction: 0.7,
            restitution: 0.3,
            density: 1,
          }),
        }),
      );
    });

    it('should add component with empty object when no defaults available', () => {
      const addComponentSpy = vi.spyOn(componentRegistry, 'addComponent');

      // Render hook to set up event listeners
      renderHook(() => useAgentActions());

      // Dispatch agent:add-component event for a component without defaults
      const event = new CustomEvent('agent:add-component', {
        detail: {
          entityId: 10,
          componentType: 'UnknownComponent',
        },
      });
      window.dispatchEvent(event);

      // Verify addComponent was called with empty object
      expect(addComponentSpy).toHaveBeenCalledWith(10, 'UnknownComponent', {});
    });

    it('should handle MeshCollider component with defaults', () => {
      const addComponentSpy = vi.spyOn(componentRegistry, 'addComponent');

      // Render hook to set up event listeners
      renderHook(() => useAgentActions());

      // Dispatch agent:add-component event
      const event = new CustomEvent('agent:add-component', {
        detail: {
          entityId: 15,
          componentType: 'MeshCollider',
        },
      });
      window.dispatchEvent(event);

      // Verify addComponent was called with complete defaults
      expect(addComponentSpy).toHaveBeenCalledWith(
        15,
        'MeshCollider',
        expect.objectContaining({
          enabled: true,
          isTrigger: false,
          colliderType: 'box',
          center: [0, 0, 0],
          size: expect.objectContaining({
            width: 1,
            height: 1,
            depth: 1,
            radius: 0.5,
            capsuleRadius: 0.5,
            capsuleHeight: 2,
          }),
          physicsMaterial: expect.objectContaining({
            friction: 0.7,
            restitution: 0.3,
            density: 1,
          }),
        }),
      );
    });

    it('should handle Camera component with defaults', () => {
      const addComponentSpy = vi.spyOn(componentRegistry, 'addComponent');

      // Render hook to set up event listeners
      renderHook(() => useAgentActions());

      // Dispatch agent:add-component event
      const event = new CustomEvent('agent:add-component', {
        detail: {
          entityId: 20,
          componentType: 'Camera',
        },
      });
      window.dispatchEvent(event);

      // Verify addComponent was called with defaults
      expect(addComponentSpy).toHaveBeenCalledWith(
        20,
        'Camera',
        expect.objectContaining({
          fov: 75,
          near: 0.1,
          far: 100,
          projectionType: 'perspective',
          isMain: false,
        }),
      );
    });
  });
});
