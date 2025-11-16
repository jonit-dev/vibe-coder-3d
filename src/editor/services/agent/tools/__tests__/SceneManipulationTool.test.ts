/**
 * Tests for Enhanced Scene Manipulation Tool
 * Includes empty entity support per PRD: 4-30-empty-entity-add-menu-prd.md
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { executeSceneManipulation, sceneManipulationTool } from '../SceneManipulationTool';

vi.mock('../utils/entityIntrospection', () => {
  const mockGetEntitySummaries = vi.fn();
  const mockFormatEntityList = vi.fn();

  return {
    getEntitySummaries: mockGetEntitySummaries,
    formatEntityList: mockFormatEntityList,
  };
});

// Get mocked functions after import
import { getEntitySummaries, formatEntityList } from '../utils/entityIntrospection';

const mockGetEntitySummaries = vi.mocked(getEntitySummaries);
const mockFormatEntityList = vi.mocked(formatEntityList);

describe('SceneManipulationTool - list_entities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetEntitySummaries.mockReturnValue([
      { id: 1, name: 'Entity1', components: ['Transform'] },
      { id: 2, name: 'Entity2', components: ['Transform', 'MeshRenderer'] },
    ]);
    mockFormatEntityList.mockReturnValue('Formatted entity list');
  });

  it('should list entities using introspection helper', async () => {
    const result = await executeSceneManipulation({
      action: 'list_entities',
    });

    expect(mockGetEntitySummaries).toHaveBeenCalledWith(25);
    expect(mockFormatEntityList).toHaveBeenCalled();
    expect(result).toBe('Formatted entity list');
  });

  it('should indicate truncation when limit reached', async () => {
    mockGetEntitySummaries.mockReturnValue(new Array(25).fill({ id: 1 }));

    await executeSceneManipulation({
      action: 'list_entities',
    });

    expect(mockFormatEntityList).toHaveBeenCalledWith(expect.anything(), true);
  });

  it('should not indicate truncation when under limit', async () => {
    mockGetEntitySummaries.mockReturnValue([{ id: 1 }]);

    await executeSceneManipulation({
      action: 'list_entities',
    });

    expect(mockFormatEntityList).toHaveBeenCalledWith(expect.anything(), false);
  });

  it('should return structured data with entity IDs and transforms', async () => {
    mockGetEntitySummaries.mockReturnValue([
      {
        id: 1,
        name: 'Cube',
        components: ['Transform', 'MeshRenderer'],
        transform: { position: [0, 1, 2] },
      },
    ]);
    mockFormatEntityList.mockImplementation((summaries) => {
      const formatted = summaries
        .map(
          (s: { id: number; name: string; transform: { position: number[] } }) =>
            `ID: ${s.id}, Name: ${s.name}, Pos: ${s.transform.position.join(',')}`,
        )
        .join('\n');
      return formatted;
    });

    const result = await executeSceneManipulation({
      action: 'list_entities',
    });

    expect(result).toContain('ID: 1');
    expect(result).toContain('Name: Cube');
    expect(result).toContain('Pos: 0,1,2');
  });
});

describe('SceneManipulationTool - Empty Entity Support', () => {
  it('should include Entity type in entity_type enum', () => {
    const entityTypeProperty = sceneManipulationTool.input_schema.properties.entity_type;
    expect(entityTypeProperty.enum).toContain('Entity');
  });

  it('should mention empty entities in tool description', () => {
    expect(sceneManipulationTool.description).toContain('empty entities');
  });

  it('should mention Entity type in entity_type description', () => {
    const entityTypeProperty = sceneManipulationTool.input_schema.properties.entity_type;
    expect(entityTypeProperty.description).toContain('Entity');
  });
});

describe('SceneManipulationTool - Material and Transform Support', () => {
  it('should include material parameters in schema', () => {
    const { input_schema } = sceneManipulationTool;
    expect(input_schema.properties.material).toBeDefined();
    expect(input_schema.properties.material.properties).toHaveProperty('color');
    expect(input_schema.properties.material.properties).toHaveProperty('materialId');
    expect(input_schema.properties.material.properties).toHaveProperty('metalness');
    expect(input_schema.properties.material.properties).toHaveProperty('roughness');
  });

  it('should include rotation parameters in schema', () => {
    const { input_schema } = sceneManipulationTool;
    expect(input_schema.properties.rotation).toBeDefined();
    expect(input_schema.properties.rotation.properties).toHaveProperty('x');
    expect(input_schema.properties.rotation.properties).toHaveProperty('y');
    expect(input_schema.properties.rotation.properties).toHaveProperty('z');
  });

  it('should include scale parameters in schema', () => {
    const { input_schema } = sceneManipulationTool;
    expect(input_schema.properties.scale).toBeDefined();
    expect(input_schema.properties.scale.properties).toHaveProperty('x');
    expect(input_schema.properties.scale.properties).toHaveProperty('y');
    expect(input_schema.properties.scale.properties).toHaveProperty('z');
  });

  it('should have guidance about thoughtful entity creation in description', () => {
    const { description } = sceneManipulationTool;
    expect(description).toContain('thoughtful');
    expect(description).toContain('material');
  });

  it('should describe color parameter with examples', () => {
    const materialProps = sceneManipulationTool.input_schema.properties.material.properties;
    expect(materialProps.color.description).toContain('#');
    expect(materialProps.color.description).toContain('red');
  });

  it('should describe metalness with value range', () => {
    const materialProps = sceneManipulationTool.input_schema.properties.material.properties;
    expect(materialProps.metalness.description).toContain('0.0');
    expect(materialProps.metalness.description).toContain('1.0');
  });

  it('should describe roughness with value range', () => {
    const materialProps = sceneManipulationTool.input_schema.properties.material.properties;
    expect(materialProps.roughness.description).toContain('0.0');
    expect(materialProps.roughness.description).toContain('1.0');
  });
});

describe('SceneManipulationTool - add_entity with materials', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should dispatch material parameters in add_entity event', async () => {
    const mockListener = vi.fn();
    window.addEventListener('agent:add-entity', mockListener);

    const material = {
      color: '#8B4513',
      metalness: 0.8,
      roughness: 0.3,
    };

    const promise = executeSceneManipulation({
      action: 'add_entity',
      entity_type: 'Cube',
      material,
    });

    // Wait a tick for event to be dispatched
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(mockListener).toHaveBeenCalled();
    const eventDetail = mockListener.mock.calls[0][0].detail;
    expect(eventDetail.material).toEqual(material);

    // Simulate response to avoid timeout
    window.dispatchEvent(
      new CustomEvent('agent:add-entity-response', {
        detail: {
          _requestId: eventDetail._requestId,
          success: true,
          entityId: 1,
        },
      }),
    );

    await promise;
    window.removeEventListener('agent:add-entity', mockListener);
  });

  it('should dispatch rotation and scale in add_entity event', async () => {
    const mockListener = vi.fn();
    window.addEventListener('agent:add-entity', mockListener);

    const rotation = { x: 45, y: 90, z: 0 };
    const scale = { x: 2, y: 1.5, z: 0.5 };

    const promise = executeSceneManipulation({
      action: 'add_entity',
      entity_type: 'Cylinder',
      rotation,
      scale,
    });

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(mockListener).toHaveBeenCalled();
    const eventDetail = mockListener.mock.calls[0][0].detail;
    expect(eventDetail.rotation).toEqual(rotation);
    expect(eventDetail.scale).toEqual(scale);

    // Simulate response
    window.dispatchEvent(
      new CustomEvent('agent:add-entity-response', {
        detail: {
          _requestId: eventDetail._requestId,
          success: true,
          entityId: 2,
        },
      }),
    );

    await promise;
    window.removeEventListener('agent:add-entity', mockListener);
  });

  it('should include material details in success message', async () => {
    const mockListener = vi.fn();
    window.addEventListener('agent:add-entity', mockListener);

    const promise = executeSceneManipulation({
      action: 'add_entity',
      entity_type: 'Sphere',
      position: { x: 1, y: 2, z: 3 },
      rotation: { x: 0, y: 45, z: 0 },
      scale: { x: 1.5, y: 1.5, z: 1.5 },
      material: { color: '#ff0000' },
    });

    await new Promise((resolve) => setTimeout(resolve, 0));

    // Simulate response
    const eventDetail = mockListener.mock.calls[0][0].detail;
    window.dispatchEvent(
      new CustomEvent('agent:add-entity-response', {
        detail: {
          _requestId: eventDetail._requestId,
          success: true,
          entityId: 3,
        },
      }),
    );

    const result = await promise;
    expect(result).toContain('position (1, 2, 3)');
    expect(result).toContain('rotation (0°, 45°, 0°)');
    expect(result).toContain('scale (1.5, 1.5, 1.5)');
    expect(result).toContain('color #ff0000');

    window.removeEventListener('agent:add-entity', mockListener);
  });
});
