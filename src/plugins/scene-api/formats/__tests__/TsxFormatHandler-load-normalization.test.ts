import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TsxFormatHandler } from '../TsxFormatHandler';
import type { ISceneStore } from '../../../../core/lib/serialization/common/ISceneStore';

describe('TsxFormatHandler - Load Normalization', () => {
  let handler: TsxFormatHandler;
  let mockStore: ISceneStore;

  beforeEach(() => {
    mockStore = {
      write: vi.fn(),
      read: vi.fn(),
      exists: vi.fn(),
      list: vi.fn(),
      delete: vi.fn(),
    };

    handler = new TsxFormatHandler(mockStore, '/test/scenes');
  });

  it('should convert inline materials to materialId references on load', async () => {
    // Mock file content with inline materials (old format)
    const tsxContent = `import { defineScene } from './defineScene';

export default defineScene({
  metadata: {
    name: 'OldScene',
    version: 1,
    timestamp: '2025-01-01T00:00:00.000Z'
  },
  entities: [
    {
      name: 'Cube',
      components: {
        MeshRenderer: {
          meshId: 'cube',
          material: {
            color: '#ff0000',
            roughness: 0.8
          }
        }
      }
    }
  ],
  materials: []
});`;

    vi.mocked(mockStore.exists).mockResolvedValue(true);
    vi.mocked(mockStore.read).mockResolvedValue({
      content: tsxContent,
      modified: new Date().toISOString(),
      size: tsxContent.length,
    });

    const result = await handler.load({ name: 'OldScene' });

    // Check that inline material was extracted
    const entity = (result.data as any).entities[0];
    expect(entity.components.MeshRenderer).toHaveProperty('materialId');
    expect(entity.components.MeshRenderer).not.toHaveProperty('material');

    // Check that material was added to materials array
    expect((result.data as any).materials).toHaveLength(1);
    expect((result.data as any).materials[0]).toMatchObject({
      color: '#ff0000',
      roughness: 0.8,
    });
  });

  it('should handle MeshRenderer with no material or materialId by adding default', async () => {
    const tsxContent = `import { defineScene } from './defineScene';

export default defineScene({
  metadata: { name: 'Test', version: 1, timestamp: '2025-01-01T00:00:00.000Z' },
  entities: [
    {
      name: 'Cube',
      components: {
        MeshRenderer: {
          meshId: 'cube'
        }
      }
    }
  ],
  materials: []
});`;

    vi.mocked(mockStore.exists).mockResolvedValue(true);
    vi.mocked(mockStore.read).mockResolvedValue({
      content: tsxContent,
      modified: new Date().toISOString(),
      size: tsxContent.length,
    });

    const result = await handler.load({ name: 'Test' });

    const entity = (result.data as any).entities[0];
    expect(entity.components.MeshRenderer.materialId).toBe('default');
  });

  it('should preserve existing materialId references', async () => {
    const tsxContent = `import { defineScene } from './defineScene';

export default defineScene({
  metadata: { name: 'Test', version: 1, timestamp: '2025-01-01T00:00:00.000Z' },
  entities: [
    {
      name: 'Cube',
      components: {
        MeshRenderer: {
          meshId: 'cube',
          materialId: 'my-material'
        }
      }
    }
  ],
  materials: []
});`;

    vi.mocked(mockStore.exists).mockResolvedValue(true);
    vi.mocked(mockStore.read).mockResolvedValue({
      content: tsxContent,
      modified: new Date().toISOString(),
      size: tsxContent.length,
    });

    const result = await handler.load({ name: 'Test' });

    const entity = (result.data as any).entities[0];
    expect(entity.components.MeshRenderer.materialId).toBe('my-material');
  });
});
