/**
 * ComponentAccessors Tests
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { createComponentsProxy } from '../ComponentAccessors';
import { ComponentMutationBuffer } from '../../../mutations/ComponentMutationBuffer';
import { componentRegistry } from '../../../ComponentRegistry';
import type { IMeshRendererAccessor } from '../types';

// Mock ComponentRegistry
vi.mock('../../../ComponentRegistry', () => ({
  componentRegistry: {
    hasComponent: vi.fn(),
    get: vi.fn(),
    getComponentData: vi.fn(),
  },
}));

describe('ComponentAccessors', () => {
  let buffer: ComponentMutationBuffer;
  let entityId: number;

  beforeEach(() => {
    buffer = new ComponentMutationBuffer();
    entityId = 1;
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('createComponentsProxy', () => {
    it('should return undefined for components that do not exist on entity', () => {
      vi.mocked(componentRegistry.hasComponent).mockReturnValue(false);

      const proxy = createComponentsProxy(entityId, buffer);
      const accessor = proxy.MeshRenderer;

      expect(accessor).toBeUndefined();
    });

    it('should return undefined for invalid component IDs', () => {
      const proxy = createComponentsProxy(entityId, buffer);
      const accessor = proxy.NonexistentComponent;

      expect(accessor).toBeUndefined();
    });

    it('should cache accessors on repeated access', () => {
      vi.mocked(componentRegistry.hasComponent).mockReturnValue(true);
      vi.mocked(componentRegistry.get).mockReturnValue({
        id: 'MeshRenderer',
        schema: {},
      } as never);

      const proxy = createComponentsProxy(entityId, buffer);

      const accessor1 = proxy.MeshRenderer;
      const accessor2 = proxy.MeshRenderer;

      expect(accessor1).toBe(accessor2); // Same reference
      expect(componentRegistry.hasComponent).toHaveBeenCalledTimes(1); // Only checked once
    });
  });

  describe('Base Accessor', () => {
    it('should provide get() method that returns component data', () => {
      const meshRendererData = {
        meshId: 'cube',
        materialId: 'default',
        enabled: true,
        castShadows: true,
        receiveShadows: true,
      };

      vi.mocked(componentRegistry.hasComponent).mockReturnValue(true);
      vi.mocked(componentRegistry.get).mockReturnValue({
        id: 'MeshRenderer',
        schema: {},
      } as never);
      vi.mocked(componentRegistry.getComponentData).mockReturnValue(meshRendererData);

      const proxy = createComponentsProxy(entityId, buffer);
      const accessor = proxy.MeshRenderer as IMeshRendererAccessor;

      const data = accessor.get();

      expect(data).toEqual(meshRendererData);
      expect(componentRegistry.getComponentData).toHaveBeenCalledWith(entityId, 'MeshRenderer');
    });

    it('should return null from get() if component data is unavailable', () => {
      vi.mocked(componentRegistry.hasComponent).mockReturnValue(true);
      vi.mocked(componentRegistry.get).mockReturnValue({
        id: 'MeshRenderer',
        schema: {},
      } as never);
      vi.mocked(componentRegistry.getComponentData).mockReturnValue(undefined);

      const proxy = createComponentsProxy(entityId, buffer);
      const accessor = proxy.MeshRenderer as IMeshRendererAccessor;

      const data = accessor.get();

      expect(data).toBeNull();
    });

    it('should queue field updates via set() method', () => {
      vi.mocked(componentRegistry.hasComponent).mockReturnValue(true);
      vi.mocked(componentRegistry.get).mockReturnValue({
        id: 'MeshRenderer',
        schema: {},
      } as never);

      const proxy = createComponentsProxy(entityId, buffer);
      const accessor = proxy.MeshRenderer as IMeshRendererAccessor;

      accessor.set({ enabled: false, castShadows: true });

      expect(buffer.size).toBe(2); // Two fields queued
    });

    it('should decompose nested patches into separate field updates', () => {
      vi.mocked(componentRegistry.hasComponent).mockReturnValue(true);
      vi.mocked(componentRegistry.get).mockReturnValue({
        id: 'MeshRenderer',
        schema: {},
      } as never);

      const proxy = createComponentsProxy(entityId, buffer);
      const accessor = proxy.MeshRenderer as IMeshRendererAccessor;

      accessor.set({
        enabled: true,
        material: { color: '#ff0000', metalness: 0.5 },
      });

      expect(buffer.size).toBe(2); // enabled + material
    });
  });

  describe('MeshRenderer Specialized Accessor', () => {
    beforeEach(() => {
      vi.mocked(componentRegistry.hasComponent).mockReturnValue(true);
      vi.mocked(componentRegistry.get).mockReturnValue({
        id: 'MeshRenderer',
        schema: {},
      } as never);
    });

    it('should provide enable() helper method', () => {
      const proxy = createComponentsProxy(entityId, buffer);
      const accessor = proxy.MeshRenderer as IMeshRendererAccessor;

      accessor.enable(true);

      expect(buffer.size).toBe(1);

      const applied: unknown[] = [];
      buffer.flush((eid, cid, field, value) => {
        if (field === 'enabled') applied.push(value);
      });

      expect(applied[0]).toBe(true);
    });

    it('should provide material.setColor() helper', () => {
      const proxy = createComponentsProxy(entityId, buffer);
      const accessor = proxy.MeshRenderer as IMeshRendererAccessor;

      accessor.material.setColor('#ff00ff');

      expect(buffer.size).toBe(1);

      const applied: unknown[] = [];
      buffer.flush((eid, cid, field, value) => {
        if (field === 'material') applied.push(value);
      });

      expect(applied[0]).toEqual({ color: '#ff00ff' });
    });

    it('should convert numeric color to hex string in setColor()', () => {
      const proxy = createComponentsProxy(entityId, buffer);
      const accessor = proxy.MeshRenderer as IMeshRendererAccessor;

      accessor.material.setColor(0xff0000); // Red as number

      const applied: unknown[] = [];
      buffer.flush((eid, cid, field, value) => {
        if (field === 'material') applied.push(value);
      });

      expect(applied[0]).toEqual({ color: '#ff0000' });
    });

    it('should clamp metalness to 0-1 range', () => {
      const proxy = createComponentsProxy(entityId, buffer);
      const accessor = proxy.MeshRenderer as IMeshRendererAccessor;

      accessor.material.setMetalness(1.5); // Out of range

      const applied: unknown[] = [];
      buffer.flush((eid, cid, field, value) => {
        if (field === 'material') applied.push(value);
      });

      expect(applied[0]).toEqual({ metalness: 1 }); // Clamped to 1
    });

    it('should clamp roughness to 0-1 range', () => {
      const proxy = createComponentsProxy(entityId, buffer);
      const accessor = proxy.MeshRenderer as IMeshRendererAccessor;

      accessor.material.setRoughness(-0.5); // Out of range

      const applied: unknown[] = [];
      buffer.flush((eid, cid, field, value) => {
        if (field === 'material') applied.push(value);
      });

      expect(applied[0]).toEqual({ roughness: 0 }); // Clamped to 0
    });

    it('should provide material.setEmissive() with default intensity', () => {
      const proxy = createComponentsProxy(entityId, buffer);
      const accessor = proxy.MeshRenderer as IMeshRendererAccessor;

      accessor.material.setEmissive('#00ff00');

      const applied: unknown[] = [];
      buffer.flush((eid, cid, field, value) => {
        if (field === 'material') applied.push(value);
      });

      expect(applied[0]).toEqual({
        emissive: '#00ff00',
        emissiveIntensity: 1,
      });
    });

    it('should provide material.setEmissive() with custom intensity', () => {
      const proxy = createComponentsProxy(entityId, buffer);
      const accessor = proxy.MeshRenderer as IMeshRendererAccessor;

      accessor.material.setEmissive('#00ff00', 2.5);

      const applied: unknown[] = [];
      buffer.flush((eid, cid, field, value) => {
        if (field === 'material') applied.push(value);
      });

      expect(applied[0]).toEqual({
        emissive: '#00ff00',
        emissiveIntensity: 2.5,
      });
    });

    it('should provide material.setTexture() for all texture types', () => {
      const proxy = createComponentsProxy(entityId, buffer);
      const accessor = proxy.MeshRenderer as IMeshRendererAccessor;

      const textureTypes = [
        'albedo',
        'normal',
        'metallic',
        'roughness',
        'emissive',
        'occlusion',
      ] as const;

      textureTypes.forEach((type) => {
        accessor.material.setTexture(type, `texture-${type}.png`);
      });

      // All setTexture calls update the same 'material' field, so last-write-wins
      // Buffer should have 1 entry (coalesced)
      expect(buffer.size).toBe(1);

      const applied: Array<{ field: string; value: unknown }> = [];
      buffer.flush((eid, cid, field, value) => {
        applied.push({ field, value });
      });

      // Last write wins - should have occlusion texture
      expect(applied).toHaveLength(1);
      expect(applied[0].value).toEqual({
        occlusionTexture: 'texture-occlusion.png',
      });
    });

    it('should set individual texture types correctly', () => {
      const proxy = createComponentsProxy(entityId, buffer);
      const accessor = proxy.MeshRenderer as IMeshRendererAccessor;

      accessor.material.setTexture('albedo', 'albedo.png');

      const applied: unknown[] = [];
      buffer.flush((eid, cid, field, value) => {
        if (field === 'material') applied.push(value);
      });

      expect(applied[0]).toEqual({ albedoTexture: 'albedo.png' });
    });
  });
});
