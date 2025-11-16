/**
 * Tests for Enhanced Scene Manipulation Tool
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
