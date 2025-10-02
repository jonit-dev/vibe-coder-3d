import { describe, it, expect, beforeEach } from 'vitest';
import { PrefabSerializer } from '../PrefabSerializer';
import { PrefabRegistry } from '@core/prefabs/PrefabRegistry';
import type { IPrefabDefinition } from '@core/prefabs';

describe('PrefabSerializer', () => {
  let serializer: PrefabSerializer;
  let registry: PrefabRegistry;

  beforeEach(async () => {
    serializer = new PrefabSerializer();
    registry = PrefabRegistry.getInstance();
    // Clear registry
    await registry.clear();
  });

  describe('serialize', () => {
    it('should serialize empty prefabs', async () => {
      const result = await serializer.serialize();
      expect(result).toEqual([]);
    });

    it('should serialize single prefab', async () => {
      const prefab: IPrefabDefinition = {
        id: 'test-prefab',
        name: 'Test Prefab',
        version: 1,
        root: {
          name: 'Root',
          components: {
            Transform: {
              position: [0, 0, 0],
              rotation: [0, 0, 0],
              scale: [1, 1, 1],
            },
          },
        },
        metadata: {
          createdAt: '2025-01-01T00:00:00.000Z',
          createdFrom: 1,
        },
        dependencies: [],
        tags: [],
      };

      registry.upsert(prefab);

      const result = await serializer.serialize();
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'test-prefab',
        name: 'Test Prefab',
        version: 1,
      });
    });

    it('should serialize multiple prefabs', async () => {
      const prefabs: IPrefabDefinition[] = [
        {
          id: 'prefab1',
          name: 'Prefab 1',
          version: 1,
          root: {
            name: 'Root1',
            components: {
              Transform: {
                position: [0, 0, 0],
                rotation: [0, 0, 0],
                scale: [1, 1, 1],
              },
            },
          },
          metadata: {
            createdAt: '2025-01-01T00:00:00.000Z',
            createdFrom: 1,
          },
          dependencies: [],
          tags: [],
        },
        {
          id: 'prefab2',
          name: 'Prefab 2',
          version: 1,
          root: {
            name: 'Root2',
            components: {
              Transform: {
                position: [1, 2, 3],
                rotation: [0, 0, 0],
                scale: [1, 1, 1],
              },
            },
          },
          metadata: {
            createdAt: '2025-01-01T00:00:00.000Z',
            createdFrom: 2,
          },
          dependencies: [],
          tags: [],
        },
      ];

      prefabs.forEach((prefab) => registry.upsert(prefab));

      const result = await serializer.serialize();
      expect(result).toHaveLength(2);
      expect(result.map((p) => p.id)).toEqual(['prefab1', 'prefab2']);
    });

    it('should preserve prefab hierarchy', async () => {
      const prefab: IPrefabDefinition = {
        id: 'hierarchy-test',
        name: 'Hierarchy Test',
        version: 1,
        root: {
          name: 'Parent',
          components: {
            Transform: {
              position: [0, 0, 0],
              rotation: [0, 0, 0],
              scale: [1, 1, 1],
            },
          },
          children: [
            {
              name: 'Child1',
              components: {
                Transform: {
                  position: [1, 0, 0],
                  rotation: [0, 0, 0],
                  scale: [1, 1, 1],
                },
              },
            },
            {
              name: 'Child2',
              components: {
                Transform: {
                  position: [0, 1, 0],
                  rotation: [0, 0, 0],
                  scale: [1, 1, 1],
                },
              },
            },
          ],
        },
        metadata: {
          createdAt: '2025-01-01T00:00:00.000Z',
          createdFrom: 1,
        },
        dependencies: [],
        tags: [],
      };

      registry.upsert(prefab);

      const result = await serializer.serialize();
      expect(result).toHaveLength(1);
      expect(result[0].root.children).toHaveLength(2);
      expect(result[0].root.children?.[0].name).toBe('Child1');
      expect(result[0].root.children?.[1].name).toBe('Child2');
    });
  });

  describe('deserialize', () => {
    it('should deserialize empty array', async () => {
      await expect(serializer.deserialize([])).resolves.not.toThrow();
    });

    it('should deserialize single prefab', async () => {
      const prefabs = [
        {
          id: 'test-prefab',
          name: 'Test Prefab',
          version: 1,
          root: {
            name: 'Root',
            components: {
              Transform: {
                position: [0, 0, 0],
                rotation: [0, 0, 0],
                scale: [1, 1, 1],
              },
            },
          },
          metadata: {
            createdAt: '2025-01-01T00:00:00.000Z',
            createdFrom: 1,
          },
          dependencies: [],
          tags: [],
        },
      ];

      await serializer.deserialize(prefabs);

      const result = registry.get('test-prefab');
      expect(result).toBeDefined();
      expect(result?.name).toBe('Test Prefab');
    });

    it('should deserialize multiple prefabs in order', async () => {
      const prefabs = [
        {
          id: 'prefab1',
          name: 'Prefab 1',
          version: 1,
          root: {
            name: 'Root1',
            components: {
              Transform: {
                position: [0, 0, 0],
                rotation: [0, 0, 0],
                scale: [1, 1, 1],
              },
            },
          },
          metadata: {
            createdAt: '2025-01-01T00:00:00.000Z',
            createdFrom: 1,
          },
          dependencies: [],
          tags: [],
        },
        {
          id: 'prefab2',
          name: 'Prefab 2',
          version: 1,
          root: {
            name: 'Root2',
            components: {
              Transform: {
                position: [1, 2, 3],
                rotation: [0, 0, 0],
                scale: [1, 1, 1],
              },
            },
          },
          metadata: {
            createdAt: '2025-01-01T00:00:00.000Z',
            createdFrom: 2,
          },
          dependencies: [],
          tags: [],
        },
      ];

      await serializer.deserialize(prefabs);

      expect(registry.get('prefab1')).toBeDefined();
      expect(registry.get('prefab2')).toBeDefined();
    });

    it('should preserve prefab hierarchy on deserialize', async () => {
      const prefabs = [
        {
          id: 'hierarchy-test',
          name: 'Hierarchy Test',
          version: 1,
          root: {
            name: 'Parent',
            components: {
              Transform: {
                position: [0, 0, 0],
                rotation: [0, 0, 0],
                scale: [1, 1, 1],
              },
            },
            children: [
              {
                name: 'Child',
                components: {
                  Transform: {
                    position: [1, 0, 0],
                    rotation: [0, 0, 0],
                    scale: [1, 1, 1],
                  },
                },
              },
            ],
          },
          metadata: {
            createdAt: '2025-01-01T00:00:00.000Z',
            createdFrom: 1,
          },
          dependencies: [],
          tags: [],
        },
      ];

      await serializer.deserialize(prefabs);

      const result = registry.get('hierarchy-test');
      expect(result).toBeDefined();
      expect(result?.root.children).toHaveLength(1);
      expect(result?.root.children?.[0].name).toBe('Child');
    });

    it('should handle invalid prefab data gracefully', async () => {
      const invalidPrefabs = [
        { id: 'invalid' }, // Missing required fields
      ];

      // Should not throw but may log warnings
      await expect(serializer.deserialize(invalidPrefabs)).resolves.not.toThrow();
    });
  });

  describe('clear', () => {
    it('should clear all prefabs', async () => {
      const prefabs = [
        {
          id: 'test-prefab',
          name: 'Test Prefab',
          version: 1,
          root: {
            name: 'Root',
            components: {
              Transform: {
                position: [0, 0, 0],
                rotation: [0, 0, 0],
                scale: [1, 1, 1],
              },
            },
          },
          metadata: {
            createdAt: '2025-01-01T00:00:00.000Z',
            createdFrom: 1,
          },
          dependencies: [],
          tags: [],
        },
      ];

      await serializer.deserialize(prefabs);
      expect(registry.get('test-prefab')).toBeDefined();

      await serializer.clear();
      expect(registry.get('test-prefab')).toBeUndefined();
    });
  });

  describe('round-trip serialization', () => {
    it('should preserve data through serialize -> deserialize cycle', async () => {
      const originalPrefab: IPrefabDefinition = {
        id: 'round-trip-test',
        name: 'Round Trip Test',
        version: 1,
        root: {
          name: 'Root',
          components: {
            Transform: {
              position: [1, 2, 3],
              rotation: [45, 90, 180],
              scale: [2, 2, 2],
            },
          },
          children: [
            {
              name: 'Child',
              components: {
                Transform: {
                  position: [0, 1, 0],
                  rotation: [0, 0, 0],
                  scale: [1, 1, 1],
                },
              },
            },
          ],
        },
        metadata: {
          createdAt: '2025-01-01T00:00:00.000Z',
          createdFrom: 1,
        },
        dependencies: ['dep1', 'dep2'],
        tags: ['test', 'example'],
      };

      registry.upsert(originalPrefab);

      const serialized = await serializer.serialize();

      // Clear and deserialize
      await registry.clear();
      await serializer.deserialize(serialized);

      const result = registry.get('round-trip-test');
      expect(result).toBeDefined();
      expect(result?.name).toBe('Round Trip Test');
      expect(result?.root.components.Transform?.position).toEqual([1, 2, 3]);
      expect(result?.root.children).toHaveLength(1);
      expect(result?.dependencies).toEqual(['dep1', 'dep2']);
      expect(result?.tags).toEqual(['test', 'example']);
    });
  });
});
