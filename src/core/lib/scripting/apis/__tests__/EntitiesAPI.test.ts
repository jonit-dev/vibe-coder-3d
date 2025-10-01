/**
 * EntitiesAPI Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createEntitiesAPI } from '../EntitiesAPI';
import { ComponentManager } from '@/core/lib/ecs/ComponentManager';

// Mock ComponentManager
vi.mock('@/core/lib/ecs/ComponentManager', () => {
  const entities = new Set([1, 2, 3, 10, 20]);

  return {
    ComponentManager: {
      getInstance: vi.fn(() => ({
        hasEntity: vi.fn((id: number) => entities.has(id)),
        getComponentData: vi.fn(),
        hasComponent: vi.fn(() => true),
        updateComponent: vi.fn(() => true),
        addComponent: vi.fn(() => ({})),
        removeComponent: vi.fn(() => true),
      })),
    },
  };
});

describe('EntitiesAPI', () => {
  let entitiesAPI: ReturnType<typeof createEntitiesAPI>;

  beforeEach(() => {
    entitiesAPI = createEntitiesAPI();
  });

  it('should create an entities API instance', () => {
    expect(entitiesAPI).toBeDefined();
    expect(entitiesAPI.fromRef).toBeInstanceOf(Function);
    expect(entitiesAPI.get).toBeInstanceOf(Function);
    expect(entitiesAPI.findByName).toBeInstanceOf(Function);
    expect(entitiesAPI.findByTag).toBeInstanceOf(Function);
    expect(entitiesAPI.exists).toBeInstanceOf(Function);
  });

  it('should resolve entity by ID', () => {
    const entity = entitiesAPI.get(1);

    expect(entity).toBeTruthy();
    expect(entity?.id).toBe(1);
  });

  it('should return null for non-existent entity ID', () => {
    const entity = entitiesAPI.get(999);

    expect(entity).toBeNull();
  });

  it('should check if entity exists', () => {
    expect(entitiesAPI.exists(1)).toBe(true);
    expect(entitiesAPI.exists(2)).toBe(true);
    expect(entitiesAPI.exists(999)).toBe(false);
  });

  it('should resolve entity reference by number', () => {
    const entity = entitiesAPI.fromRef(1);

    expect(entity).toBeTruthy();
    expect(entity?.id).toBe(1);
  });

  it('should resolve entity reference by IEntityRef with entityId', () => {
    const ref = { entityId: 2 };
    const entity = entitiesAPI.fromRef(ref);

    expect(entity).toBeTruthy();
    expect(entity?.id).toBe(2);
  });

  it('should return null for invalid entity reference', () => {
    const ref = { entityId: 999 };
    const entity = entitiesAPI.fromRef(ref);

    expect(entity).toBeNull();
  });

  it('should handle string path references (stub)', () => {
    const entity = entitiesAPI.fromRef('Root/Player/Weapon');

    // Currently returns null (stub implementation)
    expect(entity).toBeNull();
  });

  it('should handle guid references (stub)', () => {
    const ref = { guid: 'some-guid-123' };
    const entity = entitiesAPI.fromRef(ref);

    // Currently returns null (stub implementation)
    expect(entity).toBeNull();
  });

  it('should find entities by name (stub)', () => {
    const entities = entitiesAPI.findByName('Player');

    expect(Array.isArray(entities)).toBe(true);
    expect(entities.length).toBe(0); // Stub implementation
  });

  it('should find entities by tag (stub)', () => {
    const entities = entitiesAPI.findByTag('enemy');

    expect(Array.isArray(entities)).toBe(true);
    expect(entities.length).toBe(0); // Stub implementation
  });

  it('should return entity with API methods', () => {
    const entity = entitiesAPI.get(1);

    expect(entity).toBeTruthy();
    expect(entity?.transform).toBeDefined();
    expect(entity?.getComponent).toBeInstanceOf(Function);
    expect(entity?.setComponent).toBeInstanceOf(Function);
    expect(entity?.hasComponent).toBeInstanceOf(Function);
  });

  it('should handle multiple entity lookups', () => {
    const entity1 = entitiesAPI.get(1);
    const entity2 = entitiesAPI.get(2);
    const entity3 = entitiesAPI.get(3);

    expect(entity1?.id).toBe(1);
    expect(entity2?.id).toBe(2);
    expect(entity3?.id).toBe(3);
  });

  it('should handle mixed valid and invalid references', () => {
    const valid = entitiesAPI.fromRef(10);
    const invalid = entitiesAPI.fromRef(999);

    expect(valid).toBeTruthy();
    expect(invalid).toBeNull();
  });
});
