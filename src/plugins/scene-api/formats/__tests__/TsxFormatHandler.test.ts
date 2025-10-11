import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import { FsSceneStore } from '@core/lib/serialization/common/FsSceneStore';
import { TsxFormatHandler } from '../TsxFormatHandler';

describe('TsxFormatHandler', () => {
  const TEST_DIR = './test-tsx-scenes-temp';
  let store: FsSceneStore;
  let handler: TsxFormatHandler;

  const validScenePayload = {
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
    inputAssets: [],
    description: 'Test scene description',
    author: 'Test Author',
  };

  beforeEach(async () => {
    store = new FsSceneStore(TEST_DIR);
    handler = new TsxFormatHandler(store, TEST_DIR);

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
      expect(handler.format).toBe('tsx');
    });

    it('should have correct contentType', () => {
      expect(handler.contentType).toBe('application/json');
    });
  });

  describe('save', () => {
    it('should save TSX scene with sanitized component name', async () => {
      const result = await handler.save({
        name: 'My Test Scene',
        payload: validScenePayload,
      });

      expect(result.filename).toBe('MyTestScene.tsx');
      expect(result.size).toBeGreaterThan(0);
      expect(result.modified).toBeDefined();
      expect(result.extra).toHaveProperty('componentName', 'MyTestScene');
    });

    it('should sanitize component name removing special characters', async () => {
      const result = await handler.save({
        name: 'Scene!@#$%123',
        payload: validScenePayload,
      });

      expect(result.filename).toBe('Scene123.tsx');
      expect(result.extra?.componentName).toBe('Scene123');
    });

    it('should remove leading numbers from component name', async () => {
      const result = await handler.save({
        name: '123Scene',
        payload: validScenePayload,
      });

      expect(result.filename).toBe('Scene.tsx');
      expect(result.extra?.componentName).toBe('Scene');
    });

    it('should default to "Scene" if name is all invalid characters', async () => {
      const result = await handler.save({
        name: '!!!',
        payload: validScenePayload,
      });

      expect(result.filename).toBe('Scene.tsx');
      expect(result.extra?.componentName).toBe('Scene');
    });

    it('should reject payload without entities array', async () => {
      const invalidPayload = {
        materials: [],
        prefabs: [],
      };

      await expect(
        handler.save({
          name: 'test',
          payload: invalidPayload,
        }),
      ).rejects.toThrow('Entities array is required');
    });

    it('should reject too many entities', async () => {
      const tooManyEntities = {
        entities: new Array(10001).fill({ id: 1, name: 'Entity', components: {} }),
        materials: [],
        prefabs: [],
      };

      await expect(
        handler.save({
          name: 'test',
          payload: tooManyEntities,
        }),
      ).rejects.toThrow('maximum 10,000 entities');
    });

    it('should generate TSX file with defineScene import', async () => {
      await handler.save({
        name: 'test',
        payload: validScenePayload,
      });

      const content = await fs.readFile(`${TEST_DIR}/Test.tsx`, 'utf-8');

      expect(content).toContain("import { defineScene } from './defineScene'");
    });

    it('should generate TSX file with defineScene call', async () => {
      await handler.save({
        name: 'test',
        payload: validScenePayload,
      });

      const content = await fs.readFile(`${TEST_DIR}/Test.tsx`, 'utf-8');

      expect(content).toContain('export default defineScene({');
      expect(content).toContain('metadata:');
      expect(content).toContain('entities:');
      expect(content).toContain('materials:');
      expect(content).toContain('prefabs:');
    });

    it('should include metadata in generated TSX', async () => {
      await handler.save({
        name: 'TestScene',
        payload: validScenePayload,
      });

      const content = await fs.readFile(`${TEST_DIR}/TestScene.tsx`, 'utf-8');

      expect(content).toContain('"name": "TestScene"');
      expect(content).toContain('"version": 1');
      expect(content).toContain('"author": "Test Author"');
      expect(content).toContain('"description": "Test scene description"');
    });
  });

  describe('load', () => {
    beforeEach(async () => {
      await handler.save({
        name: 'test-scene',
        payload: validScenePayload,
      });
    });

    it('should load TSX scene', async () => {
      const result = await handler.load({ name: 'test-scene' });

      expect(result.filename).toBe('Testscene.tsx');
      expect(result.data).toHaveProperty('entities');
      expect(result.data).toHaveProperty('materials');
      expect(result.data).toHaveProperty('prefabs');
    });

    it('should extract entities from TSX', async () => {
      const result = await handler.load({ name: 'test-scene' });

      const data = result.data as {
        entities: unknown[];
      };
      expect(data.entities).toHaveLength(1);
      expect(data.entities[0]).toMatchObject({
        id: 1,
        name: 'TestEntity',
      });
    });

    it('should handle filename with .tsx extension', async () => {
      const result = await handler.load({ name: 'Testscene.tsx' });

      expect(result.filename).toBe('Testscene.tsx');
    });

    it('should handle filename without extension', async () => {
      const result = await handler.load({ name: 'Testscene' });

      expect(result.filename).toBe('Testscene.tsx');
    });

    it('should try sanitized component name if file not found', async () => {
      // Save with a specific name
      await handler.save({ name: 'my-scene', payload: validScenePayload });

      // Load with unsanitized name should find the sanitized file
      const result = await handler.load({ name: 'my-scene' });

      expect(result.filename).toBe('Myscene.tsx');
    });

    it('should throw if file does not exist', async () => {
      await expect(handler.load({ name: 'nonexistent' })).rejects.toThrow('not found');
    });

    it('should throw if TSX does not contain defineScene', async () => {
      // Manually create invalid TSX file
      await fs.mkdir(TEST_DIR, { recursive: true });
      await fs.writeFile(`${TEST_DIR}/Invalid.tsx`, 'export default function Invalid() {}');

      await expect(handler.load({ name: 'Invalid' })).rejects.toThrow(
        'must use defineScene format',
      );
    });

    it('should throw if cannot extract defineScene data', async () => {
      // Manually create malformed TSX file
      await fs.mkdir(TEST_DIR, { recursive: true });
      await fs.writeFile(`${TEST_DIR}/Malformed.tsx`, 'import { defineScene } from "./defineScene"; export default defineScene(');

      await expect(handler.load({ name: 'Malformed' })).rejects.toThrow(
        'Could not extract defineScene data',
      );
    });
  });

  describe('list', () => {
    it('should return empty array if no scenes exist', async () => {
      const result = await handler.list();

      expect(result).toEqual([]);
    });

    it('should list all TSX scenes', async () => {
      await handler.save({ name: 'scene1', payload: validScenePayload });
      await handler.save({ name: 'scene2', payload: validScenePayload });

      const result = await handler.list();

      expect(result).toHaveLength(2);
      const filenames = result.map((s) => s.filename);
      expect(filenames).toContain('Scene1.tsx');
      expect(filenames).toContain('Scene2.tsx');
    });

    it('should exclude non-TSX files', async () => {
      await handler.save({ name: 'scene1', payload: validScenePayload });
      // Manually create a non-TSX file
      await fs.mkdir(TEST_DIR, { recursive: true });
      await fs.writeFile(`${TEST_DIR}/other.json`, 'content');

      const result = await handler.list();

      expect(result).toHaveLength(1);
      expect(result[0].filename).toBe('Scene1.tsx');
    });

    it('should strip .tsx extension from name field', async () => {
      await handler.save({ name: 'test', payload: validScenePayload });

      const result = await handler.list();

      expect(result[0].name).toBe('Test');
      expect(result[0].filename).toBe('Test.tsx');
    });

    it('should include metadata for each scene', async () => {
      await handler.save({ name: 'scene1', payload: validScenePayload });

      const result = await handler.list();

      expect(result[0]).toHaveProperty('name');
      expect(result[0]).toHaveProperty('filename');
      expect(result[0]).toHaveProperty('modified');
      expect(result[0]).toHaveProperty('size');
      expect(result[0]).toHaveProperty('type', 'tsx');
      expect(result[0].size).toBeGreaterThan(0);
    });

    it('should sort by modification time, newest first', async () => {
      await handler.save({ name: 'old', payload: validScenePayload });
      // Small delay to ensure different timestamps
      await new Promise((resolve) => setTimeout(resolve, 10));
      await handler.save({ name: 'new', payload: validScenePayload });

      const result = await handler.list();

      expect(result[0].filename).toBe('New.tsx');
      expect(result[1].filename).toBe('Old.tsx');
    });
  });

  describe('save/load parity', () => {
    it('should preserve entities through save and load cycle', async () => {
      const complexPayload = {
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
        materials: [{ id: 'mat1', name: 'Material1' }],
        prefabs: [{ id: 'prefab1', name: 'Prefab1' }],
        inputAssets: [{ id: 'input1', name: 'Input1' }],
        description: 'Complex scene',
        author: 'Test',
      };

      await handler.save({ name: 'complex', payload: complexPayload });
      const result = await handler.load({ name: 'complex' });

      const data = result.data as {
        entities: unknown[];
        materials: unknown[];
        prefabs: unknown[];
        inputAssets: unknown[];
      };

      expect(data.entities).toEqual(complexPayload.entities);
      expect(data.materials).toEqual(complexPayload.materials);
      expect(data.prefabs).toEqual(complexPayload.prefabs);
      expect(data.inputAssets).toEqual(complexPayload.inputAssets);
    });
  });
});
