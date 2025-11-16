/**
 * Tests for Entity Edit Tool
 * Tests all entity manipulation actions including new additions
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { executeEntityEdit, entityEditTool, resetEntityManager } from '../EntityEditTool';
import { componentRegistry } from '@/core/lib/ecs/ComponentRegistry';
import { EntityManager } from '@/core/lib/ecs/EntityManager';

// Mock dependencies
vi.mock('@/core/lib/ecs/EntityManager', () => ({
  EntityManager: {
    getInstance: vi.fn(),
  },
}));

vi.mock('@/core/lib/ecs/ComponentRegistry');

// Global test setup
let mockEntityManagerInstance: ReturnType<typeof vi.fn>;
let mockComponentRegistry: typeof componentRegistry;

beforeEach(async () => {
  vi.clearAllMocks();

  // Reset cached entity manager
  resetEntityManager();

  // Setup mock EntityManager instance
  mockEntityManagerInstance = {
    getEntity: vi.fn(),
    createEntity: vi.fn(),
    deleteEntity: vi.fn(),
    setParent: vi.fn(),
  };

  // Mock EntityManager.getInstance to return our mock instance
  vi.mocked(EntityManager.getInstance).mockReturnValue(mockEntityManagerInstance as any);

  // Setup mock ComponentRegistry with proper return values for Transform component
  mockComponentRegistry = {
    hasComponent: vi.fn().mockReturnValue(true),
    getComponentData: vi.fn().mockReturnValue({
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
    }),
    getEntityComponents: vi.fn().mockReturnValue(['Transform']),
    addComponent: vi.fn().mockReturnValue(true),
    removeComponent: vi.fn().mockReturnValue(true),
    updateComponent: vi.fn().mockReturnValue(true),
  } as any;

  // Mock the componentRegistry import directly
  const { componentRegistry: mockedComponentRegistry } = await import(
    '@/core/lib/ecs/ComponentRegistry'
  );
  Object.assign(mockedComponentRegistry, mockComponentRegistry);

  // Mock getEntity to return a valid entity for IDs 1, 2, 3, 5, 10, 11
  vi.mocked(mockEntityManagerInstance.getEntity).mockImplementation((id) => {
    if (id === 1 || id === 2 || id === 3 || id === 5 || id === 10 || id === 11) {
      return {
        id,
        name: `Entity${id}`,
        children: [],
        parentId: undefined,
      };
    }
    return null;
  });

  // Mock createEntity to return a new entity
  vi.mocked(mockEntityManagerInstance.createEntity).mockReturnValue({
    id: 999,
    name: 'Entity1 (Copy)',
    children: [],
    parentId: undefined,
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('EntityEditTool - Schema', () => {
  it('should include all actions in enum', () => {
    const actionProperty = entityEditTool.input_schema.properties.action;
    expect(actionProperty.enum).toContain('set_position');
    expect(actionProperty.enum).toContain('set_rotation');
    expect(actionProperty.enum).toContain('set_scale');
    expect(actionProperty.enum).toContain('rename');
    expect(actionProperty.enum).toContain('delete');
    expect(actionProperty.enum).toContain('add_component');
    expect(actionProperty.enum).toContain('remove_component');
    expect(actionProperty.enum).toContain('set_component_property');
    expect(actionProperty.enum).toContain('get_component');
    expect(actionProperty.enum).toContain('duplicate');
    expect(actionProperty.enum).toContain('set_parent');
    expect(actionProperty.enum).toContain('set_enabled');
  });

  it('should have parent_id parameter for set_parent action', () => {
    const schema = entityEditTool.input_schema.properties;
    expect(schema.parent_id).toBeDefined();
    expect(schema.parent_id.type).toBe('number');
  });

  it('should have enabled parameter for set_enabled action', () => {
    const schema = entityEditTool.input_schema.properties;
    expect(schema.enabled).toBeDefined();
    expect(schema.enabled.type).toBe('boolean');
  });
});

describe('EntityEditTool - Transform Actions', () => {
  let dispatchEventSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    dispatchEventSpy = vi.spyOn(window, 'dispatchEvent');
  });

  it('should dispatch set_position event with correct data', async () => {
    const params = {
      entity_id: 1,
      action: 'set_position',
      position: { x: 1, y: 2, z: 3 },
    };

    const result = await executeEntityEdit(params);

    expect(dispatchEventSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'agent:set-position',
        detail: {
          entityId: 1,
          position: { x: 1, y: 2, z: 3 },
        },
      }),
    );
    expect(result).toContain('Set position of entity 1');
  });

  it('should dispatch set_rotation event with correct data', async () => {
    const params = {
      entity_id: 2,
      action: 'set_rotation',
      rotation: { x: 45, y: 90, z: 180 },
    };

    const result = await executeEntityEdit(params);

    expect(dispatchEventSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'agent:set-rotation',
        detail: {
          entityId: 2,
          rotation: { x: 45, y: 90, z: 180 },
        },
      }),
    );
    expect(result).toContain('Set rotation of entity 2');
  });

  it('should dispatch set_scale event with correct data', async () => {
    const params = {
      entity_id: 3,
      action: 'set_scale',
      scale: { x: 2, y: 2, z: 2 },
    };

    const result = await executeEntityEdit(params);

    expect(dispatchEventSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'agent:set-scale',
        detail: {
          entityId: 3,
          scale: { x: 2, y: 2, z: 2 },
        },
      }),
    );
    expect(result).toContain('Set scale of entity 3');
  });
});

describe('EntityEditTool - Entity Actions', () => {
  let dispatchEventSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    dispatchEventSpy = vi.spyOn(window, 'dispatchEvent');
  });

  it('should dispatch rename event with correct data', async () => {
    const params = {
      entity_id: 1,
      action: 'rename',
      name: 'NewEntityName',
    };

    const result = await executeEntityEdit(params);

    expect(dispatchEventSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'agent:rename-entity',
        detail: {
          entityId: 1,
          name: 'NewEntityName',
        },
      }),
    );
    expect(result).toContain('Renamed entity 1');
  });

  it('should dispatch delete event with correct data', async () => {
    const params = {
      entity_id: 1,
      action: 'delete',
    };

    const result = await executeEntityEdit(params);

    expect(dispatchEventSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'agent:delete-entity',
        detail: { entityId: 1 },
      }),
    );
    expect(result).toContain('Deleted entity 1');
  });

  it('should dispatch duplicate event', async () => {
    const params = {
      entity_id: 5,
      action: 'duplicate',
    };

    const result = await executeEntityEdit(params);

    expect(dispatchEventSpy).toHaveBeenCalledWith(expect.any(CustomEvent));
    expect(dispatchEventSpy.mock.calls[0][0].type).toBe('agent:duplicate-entity');
    expect(dispatchEventSpy.mock.calls[0][0].detail).toEqual({ entityId: 5 });
    expect(result).toContain('Duplicated entity 5');
  });
});

describe('EntityEditTool - Component Actions', () => {
  let dispatchEventSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    dispatchEventSpy = vi.spyOn(window, 'dispatchEvent');
  });

  it('should dispatch add_component event with correct data', async () => {
    const params = {
      entity_id: 1,
      action: 'add_component',
      component_type: 'RigidBody',
    };

    const result = await executeEntityEdit(params);

    expect(dispatchEventSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'agent:add-component',
        detail: {
          entityId: 1,
          componentType: 'RigidBody',
        },
      }),
    );
    expect(result).toContain('Added RigidBody component to entity 1');
  });

  it('should dispatch remove_component event with correct data', async () => {
    const params = {
      entity_id: 1,
      action: 'remove_component',
      component_type: 'RigidBody',
    };

    const result = await executeEntityEdit(params);

    expect(dispatchEventSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'agent:remove-component',
        detail: {
          entityId: 1,
          componentType: 'RigidBody',
        },
      }),
    );
    expect(result).toContain('Removed RigidBody component from entity 1');
  });

  it('should dispatch set_component_property event with correct data', async () => {
    const params = {
      entity_id: 1,
      action: 'set_component_property',
      component_type: 'Transform',
      property_name: 'position',
      property_value: [0, 1, 2],
    };

    const result = await executeEntityEdit(params);

    expect(dispatchEventSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'agent:set-component-property',
        detail: {
          entityId: 1,
          componentType: 'Transform',
          propertyName: 'position',
          propertyValue: [0, 1, 2],
        },
      }),
    );
    expect(result).toContain('Set Transform.position');
  });

  it('should parse JSON strings in set_component_property', async () => {
    const params = {
      entity_id: 1,
      action: 'set_component_property',
      component_type: 'Transform',
      property_name: 'position',
      property_value: '[0, 1, 2]',
    };

    await executeEntityEdit(params);

    expect(dispatchEventSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: expect.objectContaining({
          propertyValue: [0, 1, 2],
        }),
      }),
    );
  });

  it('should dispatch get_component event', async () => {
    const params = {
      entity_id: 1,
      action: 'get_component',
      component_type: 'Transform',
    };

    const result = await executeEntityEdit(params);

    expect(dispatchEventSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'agent:get-component',
        detail: {
          entityId: 1,
          componentType: 'Transform',
          data: expect.any(Object),
        },
      }),
    );
    expect(result).toContain('Transform component data for entity 1');
  });
});

describe('EntityEditTool - Hierarchy Actions', () => {
  let dispatchEventSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    dispatchEventSpy = vi.spyOn(window, 'dispatchEvent');
  });

  it('should dispatch set_parent event with parent ID', async () => {
    const params = {
      entity_id: 5,
      action: 'set_parent',
      parent_id: 10,
    };

    const result = await executeEntityEdit(params);

    expect(dispatchEventSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'agent:set-parent',
        detail: {
          entityId: 5,
          parentId: 10,
        },
      }),
    );
    expect(result).toContain('Set parent of entity 5 to 10');
  });

  it('should dispatch set_parent event with null to unparent', async () => {
    const params = {
      entity_id: 5,
      action: 'set_parent',
      parent_id: null,
    };

    const result = await executeEntityEdit(params);

    expect(dispatchEventSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'agent:set-parent',
        detail: {
          entityId: 5,
          parentId: null,
        },
      }),
    );
    expect(result).toContain('Unparented entity 5');
  });

  it('should dispatch set_parent event with undefined to unparent', async () => {
    const params = {
      entity_id: 5,
      action: 'set_parent',
      parent_id: undefined,
    };

    const result = await executeEntityEdit(params);

    expect(dispatchEventSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'agent:set-parent',
        detail: {
          entityId: 5,
          parentId: undefined,
        },
      }),
    );
    expect(result).toContain('Unparented entity 5');
  });
});

describe('EntityEditTool - State Actions', () => {
  let dispatchEventSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    dispatchEventSpy = vi.spyOn(window, 'dispatchEvent');
  });

  it('should dispatch set_enabled event with true', async () => {
    const params = {
      entity_id: 1,
      action: 'set_enabled',
      enabled: true,
    };

    const result = await executeEntityEdit(params);

    expect(dispatchEventSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'agent:set-enabled',
        detail: {
          entityId: 1,
          enabled: true,
        },
      }),
    );
    expect(result).toContain('Set entity 1 enabled state to true');
  });

  it('should dispatch set_enabled event with false', async () => {
    const params = {
      entity_id: 1,
      action: 'set_enabled',
      enabled: false,
    };

    const result = await executeEntityEdit(params);

    expect(dispatchEventSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'agent:set-enabled',
        detail: {
          entityId: 1,
          enabled: false,
        },
      }),
    );
    expect(result).toContain('Set entity 1 enabled state to false');
  });
});

describe('EntityEditTool - Error Handling', () => {
  it('should return error for invalid entity_id type', async () => {
    const params = {
      entity_id: 'not-a-number',
      action: 'delete',
    };

    const result = await executeEntityEdit(params);

    expect(result).toContain('Error: entity_id must be a number');
  });

  it('should return error for missing position in set_position', async () => {
    const params = {
      entity_id: 1,
      action: 'set_position',
    };

    const result = await executeEntityEdit(params);

    expect(result).toContain('Error: position is required');
  });

  it('should return error for missing component_type in add_component', async () => {
    const params = {
      entity_id: 1,
      action: 'add_component',
    };

    const result = await executeEntityEdit(params);

    expect(result).toContain('Error: component_type is required');
  });

  it('should return error for missing enabled in set_enabled', async () => {
    const params = {
      entity_id: 1,
      action: 'set_enabled',
    };

    const result = await executeEntityEdit(params);

    expect(result).toContain('Error: enabled is required');
  });

  it('should return error for unknown action', async () => {
    const params = {
      entity_id: 1,
      action: 'unknown_action',
    };

    const result = await executeEntityEdit(params);

    expect(result).toContain('Unknown action: unknown_action');
  });
});
