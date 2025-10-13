import { describe, it, expect, beforeEach } from 'vitest';
import { streamingSerializer } from '../StreamingSceneSerializer';
import type { IStreamingScene } from '../StreamingSceneSerializer';

describe('StreamingSceneSerializer - Locked Entity IDs', () => {
  const mockEntities = [
    { id: 1, name: 'Entity 1', parentId: null },
    { id: 2, name: 'Entity 2', parentId: 1 },
    { id: 3, name: 'Entity 3', parentId: null },
  ];

  const mockGetComponentsForEntity = () => [];

  describe('exportScene', () => {
    it('should export locked entity IDs', async () => {
      const lockedIds = [1, 3];
      const getLockedEntityIds = () => lockedIds;

      const scene = await streamingSerializer.exportScene(
        mockEntities,
        mockGetComponentsForEntity,
        { version: 7, name: 'Test Scene' },
        {},
        undefined,
        undefined,
        getLockedEntityIds,
      );

      expect(scene.lockedEntityIds).toEqual([1, 3]);
    });

    it('should export empty array when no entities are locked', async () => {
      const getLockedEntityIds = () => [];

      const scene = await streamingSerializer.exportScene(
        mockEntities,
        mockGetComponentsForEntity,
        { version: 7, name: 'Test Scene' },
        {},
        undefined,
        undefined,
        getLockedEntityIds,
      );

      expect(scene.lockedEntityIds).toEqual([]);
    });

    it('should handle undefined getLockedEntityIds', async () => {
      const scene = await streamingSerializer.exportScene(
        mockEntities,
        mockGetComponentsForEntity,
        { version: 7, name: 'Test Scene' },
        {},
        undefined,
        undefined,
        undefined,
      );

      expect(scene.lockedEntityIds).toEqual([]);
    });

    it('should export all locked entities', async () => {
      const lockedIds = [1, 2, 3];
      const getLockedEntityIds = () => lockedIds;

      const scene = await streamingSerializer.exportScene(
        mockEntities,
        mockGetComponentsForEntity,
        { version: 7, name: 'Test Scene' },
        {},
        undefined,
        undefined,
        getLockedEntityIds,
      );

      expect(scene.lockedEntityIds).toEqual([1, 2, 3]);
    });
  });

  describe('importScene', () => {
    let importedLockedIds: number[] = [];
    let createdEntityIdMap: Map<string, number>;

    beforeEach(() => {
      importedLockedIds = [];
      createdEntityIdMap = new Map();
      createdEntityIdMap.set('1', 10);
      createdEntityIdMap.set('2', 20);
      createdEntityIdMap.set('3', 30);
    });

    const mockEntityManager = {
      clearEntities: () => {},
      createEntity: (name: string, _parentId?: number | null, persistentId?: string) => {
        const newId = createdEntityIdMap.get(persistentId || name.split(' ')[1]) || 1;
        return { id: newId };
      },
      setParent: () => {},
    };

    const mockComponentManager = {
      addComponent: () => {},
    };

    it('should import locked entity IDs', async () => {
      const scene: IStreamingScene = {
        version: 7,
        name: 'Test Scene',
        timestamp: new Date().toISOString(),
        totalEntities: 3,
        entities: [
          { id: 1, name: 'Entity 1', components: {} },
          { id: 2, name: 'Entity 2', components: {} },
          { id: 3, name: 'Entity 3', components: {} },
        ],
        materials: [],
        prefabs: [],
        lockedEntityIds: [1, 3],
      };

      const setLockedEntityIds = (ids: number[]) => {
        importedLockedIds = ids;
      };

      await streamingSerializer.importScene(
        scene,
        mockEntityManager,
        mockComponentManager,
        {},
        undefined,
        undefined,
        setLockedEntityIds,
      );

      expect(importedLockedIds).toEqual([10, 30]);
    });

    it('should handle empty locked entity IDs', async () => {
      const scene: IStreamingScene = {
        version: 7,
        name: 'Test Scene',
        timestamp: new Date().toISOString(),
        totalEntities: 3,
        entities: [
          { id: 1, name: 'Entity 1', components: {} },
          { id: 2, name: 'Entity 2', components: {} },
          { id: 3, name: 'Entity 3', components: {} },
        ],
        materials: [],
        prefabs: [],
        lockedEntityIds: [],
      };

      const setLockedEntityIds = (ids: number[]) => {
        importedLockedIds = ids;
      };

      await streamingSerializer.importScene(
        scene,
        mockEntityManager,
        mockComponentManager,
        {},
        undefined,
        undefined,
        setLockedEntityIds,
      );

      expect(importedLockedIds).toEqual([]);
    });

    it('should handle missing lockedEntityIds field (backward compatibility)', async () => {
      const scene: IStreamingScene = {
        version: 7,
        name: 'Test Scene',
        timestamp: new Date().toISOString(),
        totalEntities: 3,
        entities: [
          { id: 1, name: 'Entity 1', components: {} },
          { id: 2, name: 'Entity 2', components: {} },
          { id: 3, name: 'Entity 3', components: {} },
        ],
        materials: [],
        prefabs: [],
        // lockedEntityIds intentionally omitted
      };

      const setLockedEntityIds = (ids: number[]) => {
        importedLockedIds = ids;
      };

      await streamingSerializer.importScene(
        scene,
        mockEntityManager,
        mockComponentManager,
        {},
        undefined,
        undefined,
        setLockedEntityIds,
      );

      // Should not call setLockedEntityIds when field is missing
      expect(importedLockedIds).toEqual([]);
    });

    it('should map old entity IDs to new entity IDs correctly', async () => {
      const scene: IStreamingScene = {
        version: 7,
        name: 'Test Scene',
        timestamp: new Date().toISOString(),
        totalEntities: 2,
        entities: [
          { id: 1, name: 'Entity 1', components: {} },
          { id: 2, name: 'Entity 2', components: {} },
        ],
        materials: [],
        prefabs: [],
        lockedEntityIds: [1, 2],
      };

      const setLockedEntityIds = (ids: number[]) => {
        importedLockedIds = ids;
      };

      await streamingSerializer.importScene(
        scene,
        mockEntityManager,
        mockComponentManager,
        {},
        undefined,
        undefined,
        setLockedEntityIds,
      );

      // Old IDs [1, 2] should map to new IDs [10, 20]
      expect(importedLockedIds).toEqual([10, 20]);
    });

    it('should filter out locked IDs that do not map to valid entities', async () => {
      const scene: IStreamingScene = {
        version: 7,
        name: 'Test Scene',
        timestamp: new Date().toISOString(),
        totalEntities: 2,
        entities: [
          { id: 1, name: 'Entity 1', components: {} },
          { id: 2, name: 'Entity 2', components: {} },
        ],
        materials: [],
        prefabs: [],
        lockedEntityIds: [1, 2, 999], // 999 doesn't exist
      };

      const setLockedEntityIds = (ids: number[]) => {
        importedLockedIds = ids;
      };

      await streamingSerializer.importScene(
        scene,
        mockEntityManager,
        mockComponentManager,
        {},
        undefined,
        undefined,
        setLockedEntityIds,
      );

      // Only valid mapped IDs should be returned
      expect(importedLockedIds).toEqual([10, 20]);
    });
  });
});
