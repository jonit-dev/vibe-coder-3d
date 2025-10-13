/**
 * ModelMatrixSystem Tests
 * Tests for the batched matrix update system
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { threeJSEntityRegistry } from '@/core/lib/scripting/ThreeJSEntityRegistry';
import * as THREE from 'three';

// Mock @react-three/fiber
let frameCallback: ((state: unknown, delta: number) => void) | null = null;
vi.mock('@react-three/fiber', () => ({
  useFrame: (callback: (state: unknown, delta: number) => void) => {
    frameCallback = callback;
  },
}));

// Import after mocking
const { ModelMatrixSystem } = await import('../ModelMatrixSystem');

describe('ModelMatrixSystem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    frameCallback = null;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should have correct displayName', () => {
    expect(ModelMatrixSystem.displayName).toBe('ModelMatrixSystem');
  });

  it('should return null (does not render visible content)', () => {
    const result = ModelMatrixSystem({});
    expect(result).toBeNull();
  });

  it('should register useFrame callback', () => {
    ModelMatrixSystem({});
    expect(frameCallback).toBeTruthy();
  });

  describe('matrix updates', () => {
    it('should call updateMatrixWorld on registered entities', () => {
      // Create mock Object3D instances
      const mockObject3D1 = new THREE.Object3D();
      const mockObject3D2 = new THREE.Object3D();
      const updateMatrixWorldSpy1 = vi.spyOn(mockObject3D1, 'updateMatrixWorld');
      const updateMatrixWorldSpy2 = vi.spyOn(mockObject3D2, 'updateMatrixWorld');

      // Mock the registry
      vi.spyOn(threeJSEntityRegistry, 'getAllEntities').mockReturnValue([1, 2]);
      vi.spyOn(threeJSEntityRegistry, 'getEntityObject3D').mockImplementation((entityId) => {
        if (entityId === 1) return mockObject3D1;
        if (entityId === 2) return mockObject3D2;
        return undefined;
      });

      // Render component and trigger frame
      ModelMatrixSystem({});
      expect(frameCallback).toBeTruthy();
      frameCallback!({}, 0.016);

      // updateMatrixWorld should have been called with true parameter
      expect(updateMatrixWorldSpy1).toHaveBeenCalledWith(true);
      expect(updateMatrixWorldSpy2).toHaveBeenCalledWith(true);
    });

    it('should handle entities without Object3D gracefully', () => {
      // Mock registry with entities but no Object3D
      vi.spyOn(threeJSEntityRegistry, 'getAllEntities').mockReturnValue([1, 2, 3]);
      vi.spyOn(threeJSEntityRegistry, 'getEntityObject3D').mockReturnValue(undefined);

      // Should not throw
      ModelMatrixSystem({});
      expect(frameCallback).toBeTruthy();
      expect(() => frameCallback!({}, 0.016)).not.toThrow();
    });

    it('should handle empty entity list', () => {
      vi.spyOn(threeJSEntityRegistry, 'getAllEntities').mockReturnValue([]);

      // Should not throw
      ModelMatrixSystem({});
      expect(frameCallback).toBeTruthy();
      expect(() => frameCallback!({}, 0.016)).not.toThrow();
    });

    it('should batch update all entities in a single frame', () => {
      const entityCount = 20;
      const mockObjects = Array.from({ length: entityCount }, () => new THREE.Object3D());
      const updateSpies = mockObjects.map((obj) => vi.spyOn(obj, 'updateMatrixWorld'));

      vi.spyOn(threeJSEntityRegistry, 'getAllEntities').mockReturnValue(
        Array.from({ length: entityCount }, (_, i) => i + 1),
      );
      vi.spyOn(threeJSEntityRegistry, 'getEntityObject3D').mockImplementation(
        (entityId) => mockObjects[(entityId as number) - 1],
      );

      ModelMatrixSystem({});
      expect(frameCallback).toBeTruthy();
      frameCallback!({}, 0.016);

      // All entities should have been updated
      updateSpies.forEach((spy) => {
        expect(spy).toHaveBeenCalledWith(true);
      });
    });
  });

  describe('performance characteristics', () => {
    it('should update matrices in a single useFrame call', () => {
      const mockObject = new THREE.Object3D();
      const updateSpy = vi.spyOn(mockObject, 'updateMatrixWorld');

      vi.spyOn(threeJSEntityRegistry, 'getAllEntities').mockReturnValue([1]);
      vi.spyOn(threeJSEntityRegistry, 'getEntityObject3D').mockReturnValue(mockObject);

      ModelMatrixSystem({});
      expect(frameCallback).toBeTruthy();
      frameCallback!({}, 0.016);

      // Should be called exactly once
      expect(updateSpy).toHaveBeenCalledTimes(1);
    });

    it('should scale to many entities without crashing', () => {
      const largeEntityCount = 100;
      const mockObjects = Array.from({ length: largeEntityCount }, () => new THREE.Object3D());

      vi.spyOn(threeJSEntityRegistry, 'getAllEntities').mockReturnValue(
        Array.from({ length: largeEntityCount }, (_, i) => i + 1),
      );
      vi.spyOn(threeJSEntityRegistry, 'getEntityObject3D').mockImplementation(
        (entityId) => mockObjects[(entityId as number) - 1],
      );

      // Should not throw or crash
      ModelMatrixSystem({});
      expect(frameCallback).toBeTruthy();
      expect(() => frameCallback!({}, 0.016)).not.toThrow();
    });
  });

  describe('recursive matrix updates', () => {
    it('should force recursive updates through hierarchy', () => {
      // Create parent-child hierarchy
      const parent = new THREE.Object3D();
      const child = new THREE.Object3D();
      parent.add(child);

      const parentUpdateSpy = vi.spyOn(parent, 'updateMatrixWorld');

      vi.spyOn(threeJSEntityRegistry, 'getAllEntities').mockReturnValue([1]);
      vi.spyOn(threeJSEntityRegistry, 'getEntityObject3D').mockReturnValue(parent);

      ModelMatrixSystem({});
      expect(frameCallback).toBeTruthy();
      frameCallback!({}, 0.016);

      // Should be called with true to force recursive update
      expect(parentUpdateSpy).toHaveBeenCalledWith(true);
    });
  });
});
