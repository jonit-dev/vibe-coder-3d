/**
 * Tests for Entity Edit Tool
 * Tests all entity manipulation actions including new additions
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { executeEntityEdit, entityEditTool } from '../EntityEditTool';

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

  afterEach(() => {
    vi.restoreAllMocks();
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

  afterEach(() => {
    vi.restoreAllMocks();
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

    expect(dispatchEventSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'agent:duplicate-entity',
        detail: { entityId: 5 },
      }),
    );
    expect(result).toContain('Duplicated entity 5');
  });
});

describe('EntityEditTool - Component Actions', () => {
  let dispatchEventSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    dispatchEventSpy = vi.spyOn(window, 'dispatchEvent');
  });

  afterEach(() => {
    vi.restoreAllMocks();
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
        },
      }),
    );
    expect(result).toContain('Requested Transform component data for entity 1');
  });
});

describe('EntityEditTool - Hierarchy Actions', () => {
  let dispatchEventSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    dispatchEventSpy = vi.spyOn(window, 'dispatchEvent');
  });

  afterEach(() => {
    vi.restoreAllMocks();
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

  afterEach(() => {
    vi.restoreAllMocks();
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
