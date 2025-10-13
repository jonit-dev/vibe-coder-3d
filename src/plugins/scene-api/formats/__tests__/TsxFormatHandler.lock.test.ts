import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TsxFormatHandler } from '../TsxFormatHandler';
import type { ISceneStore } from '@/core/lib/serialization/common/ISceneStore';

// Mock the asset store
vi.mock('../../../assets-api/FsAssetStore', () => ({
  FsAssetStore: class {
    async save() {
      return { success: true };
    }
  },
}));

describe('TsxFormatHandler - Locked Entity IDs', () => {
  let handler: TsxFormatHandler;
  let mockStore: ISceneStore;
  let writtenContent: string = '';

  beforeEach(() => {
    writtenContent = '';
    mockStore = {
      write: vi.fn(async (_filename: string, content: string) => {
        writtenContent = content;
        return {
          filename: 'test.tsx',
          modified: new Date().toISOString(),
          size: content.length,
        };
      }),
      read: vi.fn(),
      exists: vi.fn(),
      list: vi.fn(),
      delete: vi.fn(),
    };

    handler = new TsxFormatHandler(mockStore, 'src/game/scenes');
  });

  describe('save', () => {
    it('should include locked entity IDs in saved scene', async () => {
      const payload = {
        entities: [
          { id: 1, name: 'Entity 1', components: {} },
          { id: 2, name: 'Entity 2', components: {} },
          { id: 3, name: 'Entity 3', components: {} },
        ],
        materials: [],
        prefabs: [],
        inputAssets: [],
        lockedEntityIds: [1, 3],
      };

      await handler.save({ name: 'TestScene', payload });

      expect(writtenContent).toContain('lockedEntityIds');
      expect(writtenContent).toContain('[');
      expect(writtenContent).toContain('1');
      expect(writtenContent).toContain('3');
    });

    it('should save empty array when no entities are locked', async () => {
      const payload = {
        entities: [{ id: 1, name: 'Entity 1', components: {} }],
        materials: [],
        prefabs: [],
        inputAssets: [],
        lockedEntityIds: [],
      };

      await handler.save({ name: 'TestScene', payload });

      // Should not include lockedEntityIds block when empty
      expect(writtenContent).not.toContain('lockedEntityIds');
    });

    it('should handle missing lockedEntityIds in payload', async () => {
      const payload = {
        entities: [{ id: 1, name: 'Entity 1', components: {} }],
        materials: [],
        prefabs: [],
        inputAssets: [],
      };

      await handler.save({ name: 'TestScene', payload });

      // Should not crash and should not include lockedEntityIds
      expect(writtenContent).not.toContain('lockedEntityIds');
    });
  });

  describe('load - new format with assetReferences', () => {
    it('should extract locked entity IDs from scene file', () => {
      const sceneContent = `import { defineScene } from './defineScene';

export default defineScene({
  metadata: {
    "name": "TestScene",
    "version": 1,
    "timestamp": "2025-01-01T00:00:00.000Z"
  },
  entities: [
    { "id": 1, "name": "Entity 1", "components": {} },
    { "id": 2, "name": "Entity 2", "components": {} }
  ],
  assetReferences: {
    materials: ["@/materials/default"]
  },
  lockedEntityIds: [1]
});`;

      mockStore.read = vi.fn(async () => ({
        content: sceneContent,
        filename: 'TestScene.tsx',
        modified: new Date().toISOString(),
        size: sceneContent.length,
      }));
      mockStore.exists = vi.fn(async () => true);

      // Access the private method for testing
      const data = (handler as any).extractDefineSceneData(sceneContent);

      expect(data.lockedEntityIds).toEqual([1]);
    });

    it('should default to empty array when lockedEntityIds is missing', () => {
      const sceneContent = `import { defineScene } from './defineScene';

export default defineScene({
  metadata: {
    "name": "TestScene",
    "version": 1,
    "timestamp": "2025-01-01T00:00:00.000Z"
  },
  entities: [
    { "id": 1, "name": "Entity 1", "components": {} }
  ],
  assetReferences: {
    materials: ["@/materials/default"]
  }
});`;

      const data = (handler as any).extractDefineSceneData(sceneContent);

      expect(data.lockedEntityIds).toEqual([]);
    });
  });

  describe('load - old format without assetReferences', () => {
    it('should extract locked entity IDs from old format scene file', () => {
      const sceneContent = `import { defineScene } from './defineScene';

export default defineScene({
  metadata: {
    "name": "TestScene",
    "version": 1,
    "timestamp": "2025-01-01T00:00:00.000Z"
  },
  entities: [
    { "id": 1, "name": "Entity 1", "components": {} },
    { "id": 2, "name": "Entity 2", "components": {} }
  ],
  materials: [],
  prefabs: [],
  inputAssets: [],
  lockedEntityIds: [2]
});`;

      const data = (handler as any).extractDefineSceneData(sceneContent);

      expect(data.lockedEntityIds).toEqual([2]);
    });

    it('should default to empty array when lockedEntityIds is missing in old format', () => {
      const sceneContent = `import { defineScene } from './defineScene';

export default defineScene({
  metadata: {
    "name": "TestScene",
    "version": 1,
    "timestamp": "2025-01-01T00:00:00.000Z"
  },
  entities: [
    { "id": 1, "name": "Entity 1", "components": {} }
  ],
  materials: [],
  prefabs: [],
  inputAssets: []
});`;

      const data = (handler as any).extractDefineSceneData(sceneContent);

      expect(data.lockedEntityIds).toEqual([]);
    });

    it('should handle multiple locked entities', () => {
      const sceneContent = `import { defineScene } from './defineScene';

export default defineScene({
  metadata: {
    "name": "TestScene",
    "version": 1,
    "timestamp": "2025-01-01T00:00:00.000Z"
  },
  entities: [
    { "id": 1, "name": "Entity 1", "components": {} },
    { "id": 2, "name": "Entity 2", "components": {} },
    { "id": 3, "name": "Entity 3", "components": {} }
  ],
  materials: [],
  prefabs: [],
  inputAssets: [],
  lockedEntityIds: [1, 2, 3]
});`;

      const data = (handler as any).extractDefineSceneData(sceneContent);

      expect(data.lockedEntityIds).toEqual([1, 2, 3]);
    });
  });
});
