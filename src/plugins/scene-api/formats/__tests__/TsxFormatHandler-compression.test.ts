import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TsxFormatHandler } from '../TsxFormatHandler';
import type { ISceneStore } from '../../../../core/lib/serialization/common/ISceneStore';

describe('TsxFormatHandler - Compression', () => {
  let handler: TsxFormatHandler;
  let mockStore: ISceneStore;
  let writtenContent: string;

  beforeEach(() => {
    writtenContent = '';
    mockStore = {
      write: vi.fn(async (_filename: string, content: string) => {
        writtenContent = content;
        return {
          modified: new Date().toISOString(),
          size: content.length,
        };
      }),
      read: vi.fn(),
      exists: vi.fn(),
      list: vi.fn(),
      delete: vi.fn(),
    };

    handler = new TsxFormatHandler(mockStore);
  });

  it('should omit Transform defaults (rotation, scale) when saving', async () => {
    const payload = {
      entities: [
        {
          name: 'Camera',
          components: {
            Transform: {
              position: [0, 2, -10],
              rotation: [0, 0, 0], // Default
              scale: [1, 1, 1], // Default
            },
          },
        },
      ],
      materials: [],
    };

    await handler.save({ name: 'TestScene', payload });

    // Check that defaults were omitted
    expect(writtenContent).toContain('"position"');
    expect(writtenContent).not.toContain('"rotation"');
    expect(writtenContent).not.toContain('"scale"');
  });

  it('should keep non-default Transform values', async () => {
    const payload = {
      entities: [
        {
          name: 'Rotated Object',
          components: {
            Transform: {
              position: [5, 0, 0],
              rotation: [45, 30, 0], // Non-default
              scale: [2, 2, 2], // Non-default
            },
          },
        },
      ],
      materials: [],
    };

    await handler.save({ name: 'TestScene', payload });

    // Check that non-defaults are kept
    expect(writtenContent).toContain('"position"');
    expect(writtenContent).toContain('"rotation"');
    expect(writtenContent).toContain('"scale"');
    expect(writtenContent).toContain('45');
    expect(writtenContent).toContain('30');
    expect(writtenContent).toMatch(/2,\s*2,\s*2/);
  });

  it('should omit Camera defaults when saving', async () => {
    const payload = {
      entities: [
        {
          name: 'Camera',
          components: {
            Camera: {
              fov: 60,
              near: 0.1, // Default
              far: 100, // Default
              isMain: true,
            },
          },
        },
      ],
      materials: [],
    };

    await handler.save({ name: 'TestScene', payload });

    // Check compression
    expect(writtenContent).toContain('"fov"');
    expect(writtenContent).toContain('"isMain"');
    expect(writtenContent).not.toContain('"near"');
    expect(writtenContent).not.toContain('"far"');
  });

  it('should deduplicate inline materials', async () => {
    const payload = {
      entities: [
        {
          name: 'Tree 1',
          components: {
            MeshRenderer: {
              meshId: 'tree',
              material: {
                color: '#2d5016',
                roughness: 0.9,
              },
            },
          },
        },
        {
          name: 'Tree 2',
          components: {
            MeshRenderer: {
              meshId: 'tree',
              material: {
                color: '#2d5016',
                roughness: 0.9,
              },
            },
          },
        },
      ],
      materials: [],
    };

    await handler.save({ name: 'TestScene', payload });

    // Check that material was extracted
    expect(writtenContent).toContain('"materialId"');
    expect(writtenContent).not.toContain('"material":');

    // Check materials array has exactly one material
    const materialsMatch = writtenContent.match(/materials:\s*\[([^\]]+)\]/);
    expect(materialsMatch).toBeTruthy();
    // Should have only one material object (dedup worked)
    const materialCount = (materialsMatch![1].match(/"id":/g) || []).length;
    expect(materialCount).toBe(1);
  });
});
