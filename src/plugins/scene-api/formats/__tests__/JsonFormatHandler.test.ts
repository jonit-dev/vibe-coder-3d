import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import { FsSceneStore } from '@core/lib/serialization/common/FsSceneStore';
import { JsonFormatHandler } from '../JsonFormatHandler';

describe('JsonFormatHandler', () => {
  const TEST_DIR = './test-json-scenes-temp';
  let store: FsSceneStore;
  let handler: JsonFormatHandler;

  const validScene = {
    metadata: {
      name: 'Test Scene',
      version: 1,
      timestamp: '2025-10-08T00:00:00.000Z',
    },
    entities: [
      {
        id: 1,
        name: 'TestEntity',
        components: {
          Transform: { position: [0, 0, 0] },
        },
      },
    ],
    materials: [],
    prefabs: [],
  };

  beforeEach(async () => {
    store = new FsSceneStore(TEST_DIR);
    handler = new JsonFormatHandler(store);

    // Cleanup
    try {
      await fs.rm(TEST_DIR, { recursive: true, force: true });
    } catch {
      // Ignore
    }
  });

  afterEach(async () => {
    try {
      await fs.rm(TEST_DIR, { recursive: true, force: true });
    } catch {
      // Ignore
    }
  });

  describe('format and contentType', () => {
    it('should have correct format', () => {
      expect(handler.format).toBe('json');
    });

    it('should have correct contentType', () => {
      expect(handler.contentType).toBe('application/json');
    });
  });

  describe('save', () => {
    it('should save valid scene data', async () => {
      const result = await handler.save({
        name: 'test-scene',
        payload: validScene,
      });

      expect(result.filename).toBe('test-scene.json');
      expect(result.size).toBeGreaterThan(0);
      expect(result.modified).toBeDefined();
      expect(new Date(result.modified)).toBeInstanceOf(Date);
    });

    it('should sanitize filename', async () => {
      const result = await handler.save({
        name: 'My Scene!@#',
        payload: validScene,
      });

      expect(result.filename).toBe('My_Scene___.json');
    });

    it('should add .json extension if missing', async () => {
      const result = await handler.save({
        name: 'test',
        payload: validScene,
      });

      expect(result.filename).toBe('test.json');
    });

    it('should reject invalid scene data', async () => {
      const invalidScene = {
        invalid: 'data',
      };

      await expect(
        handler.save({
          name: 'test',
          payload: invalidScene,
        }),
      ).rejects.toThrow('Invalid scene data');
    });

    it('should reject missing metadata', async () => {
      const invalidScene = {
        entities: [],
        materials: [],
        prefabs: [],
      };

      await expect(
        handler.save({
          name: 'test',
          payload: invalidScene,
        }),
      ).rejects.toThrow();
    });

    it('should format JSON with indentation', async () => {
      await handler.save({
        name: 'test',
        payload: validScene,
      });

      const fileContent = await fs.readFile(`${TEST_DIR}/test.json`, 'utf-8');
      // Check if formatted (contains newlines and indentation)
      expect(fileContent).toContain('\n');
      expect(fileContent).toContain('  ');
    });
  });

  describe('load', () => {
    beforeEach(async () => {
      await handler.save({
        name: 'test-scene',
        payload: validScene,
      });
    });

    it('should load saved scene', async () => {
      const result = await handler.load({ name: 'test-scene' });

      expect(result.filename).toBe('test-scene.json');
      expect(result.data).toMatchObject(validScene);
      expect(result.modified).toBeDefined();
    });

    it('should add .json extension if missing', async () => {
      const result = await handler.load({ name: 'test-scene' });

      expect(result.filename).toBe('test-scene.json');
    });

    it('should handle filename with extension', async () => {
      const result = await handler.load({ name: 'test-scene.json' });

      expect(result.filename).toBe('test-scene.json');
    });

    it('should throw if file does not exist', async () => {
      await expect(handler.load({ name: 'nonexistent' })).rejects.toThrow();
    });

    it('should validate loaded scene data', async () => {
      // Manually write invalid JSON to file
      await fs.mkdir(TEST_DIR, { recursive: true });
      await fs.writeFile(`${TEST_DIR}/invalid.json`, JSON.stringify({ invalid: 'data' }));

      await expect(handler.load({ name: 'invalid' })).rejects.toThrow('Invalid scene file');
    });
  });

  describe('list', () => {
    it('should return empty array if no scenes exist', async () => {
      const result = await handler.list();

      expect(result).toEqual([]);
    });

    it('should list all JSON scenes', async () => {
      await handler.save({ name: 'scene1', payload: validScene });
      await handler.save({ name: 'scene2', payload: validScene });

      const result = await handler.list();

      expect(result).toHaveLength(2);
      expect(result.map((s) => s.filename)).toContain('scene1.json');
      expect(result.map((s) => s.filename)).toContain('scene2.json');
    });

    it('should exclude non-JSON files', async () => {
      await handler.save({ name: 'scene1', payload: validScene });
      // Manually create a non-JSON file
      await fs.mkdir(TEST_DIR, { recursive: true });
      await fs.writeFile(`${TEST_DIR}/other.txt`, 'content');

      const result = await handler.list();

      expect(result).toHaveLength(1);
      expect(result[0].filename).toBe('scene1.json');
    });

    it('should include metadata for each scene', async () => {
      await handler.save({ name: 'scene1', payload: validScene });

      const result = await handler.list();

      expect(result[0]).toHaveProperty('name', 'scene1.json');
      expect(result[0]).toHaveProperty('filename', 'scene1.json');
      expect(result[0]).toHaveProperty('modified');
      expect(result[0]).toHaveProperty('size');
      expect(result[0]).toHaveProperty('type', 'json');
      expect(result[0].size).toBeGreaterThan(0);
    });

    it('should sort by modification time, newest first', async () => {
      await handler.save({ name: 'old', payload: validScene });
      // Small delay to ensure different timestamps
      await new Promise((resolve) => setTimeout(resolve, 10));
      await handler.save({ name: 'new', payload: validScene });

      const result = await handler.list();

      expect(result[0].filename).toBe('new.json');
      expect(result[1].filename).toBe('old.json');
    });
  });

  describe('save/load parity', () => {
    it('should preserve scene data through save and load cycle', async () => {
      const complexScene = {
        metadata: {
          name: 'Complex Scene',
          version: 2,
          timestamp: '2025-10-08T12:34:56.789Z',
          author: 'Test Author',
          description: 'A complex test scene',
        },
        entities: [
          {
            id: 1,
            name: 'Entity1',
            components: {
              Transform: { position: [1, 2, 3], rotation: [0, 0, 0], scale: [1, 1, 1] },
              Mesh: { geometry: 'box' },
            },
          },
          {
            id: 2,
            name: 'Entity2',
            parentId: 1,
            components: {
              Transform: { position: [0, 1, 0] },
              Camera: { fov: 75 },
            },
          },
        ],
        materials: [],
        prefabs: [],
        inputAssets: [],
      };

      await handler.save({ name: 'complex', payload: complexScene });
      const result = await handler.load({ name: 'complex' });

      expect(result.data).toEqual(complexScene);
    });
  });
});
