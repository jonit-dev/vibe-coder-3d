import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import { FsAssetStore } from '../FsAssetStore';

describe('FsAssetStore', () => {
  const testDir = path.join(process.cwd(), 'test-fs-asset-store-temp');
  const libraryRoot = path.join(testDir, 'assets');
  const scenesRoot = path.join(testDir, 'scenes');

  let store: FsAssetStore;

  beforeEach(async () => {
    // Create test directories
    await fs.mkdir(libraryRoot, { recursive: true });
    await fs.mkdir(scenesRoot, { recursive: true });

    store = new FsAssetStore(libraryRoot, scenesRoot);
  });

  afterEach(async () => {
    // Clean up test directory
    await fs.rm(testDir, { recursive: true, force: true });
  });

  describe('save', () => {
    it('should save a library material asset', async () => {
      const payload = {
        id: 'test-material',
        name: 'Test Material',
        shader: 'standard',
        color: '#ff0000',
      };

      const result = await store.save({
        path: '@/materials/Test',
        payload,
        type: 'material',
      });

      expect(result.filename).toBe('Test.material.tsx');
      expect(result.path).toBe('@/materials/Test');
      expect(result.size).toBeGreaterThan(0);

      // Verify file exists
      const filePath = path.join(libraryRoot, 'materials', 'Test.material.tsx');
      const exists = await fs
        .access(filePath)
        .then(() => true)
        .catch(() => false);
      expect(exists).toBe(true);

      // Verify file content
      const content = await fs.readFile(filePath, 'utf-8');
      expect(content).toContain('defineMaterial');
      expect(content).toContain('test-material');
    });

    it('should save an input asset', async () => {
      const payload = {
        name: 'Test Input',
        controlSchemes: [],
        actionMaps: [],
      };

      const result = await store.save({
        path: '@/inputs/TestInput',
        payload,
        type: 'input',
      });

      expect(result.filename).toBe('TestInput.input.tsx');
      expect(result.path).toBe('@/inputs/TestInput');

      // Verify file content includes required imports
      const filePath = path.join(libraryRoot, 'inputs', 'TestInput.input.tsx');
      const content = await fs.readFile(filePath, 'utf-8');
      expect(content).toContain('ActionType');
      expect(content).toContain('ControlType');
      expect(content).toContain('DeviceType');
    });

    it('should create subdirectories as needed', async () => {
      const payload = {
        id: 'nested-material',
        name: 'Nested Material',
        shader: 'standard',
      };

      await store.save({
        path: '@/materials/rocks/granite/Granite',
        payload,
        type: 'material',
      });

      const filePath = path.join(libraryRoot, 'materials', 'rocks', 'granite', 'Granite.material.tsx');
      const exists = await fs
        .access(filePath)
        .then(() => true)
        .catch(() => false);
      expect(exists).toBe(true);
    });
  });

  describe('load', () => {
    it('should load a saved material asset', async () => {
      const payload = {
        id: 'load-test',
        name: 'Load Test Material',
        shader: 'standard',
        color: '#00ff00',
      };

      await store.save({
        path: '@/materials/LoadTest',
        payload,
        type: 'material',
      });

      const result = await store.load({
        path: '@/materials/LoadTest',
        type: 'material',
      });

      expect(result.filename).toBe('LoadTest.material.tsx');
      expect(result.payload).toEqual(payload);
    });

    it('should throw error when asset file not found', async () => {
      await expect(
        store.load({
          path: '@/materials/NonExistent',
          type: 'material',
        }),
      ).rejects.toThrow();
    });
  });

  describe('list', () => {
    it('should list library materials', async () => {
      // Create test materials
      await store.save({
        path: '@/materials/Mat1',
        payload: { id: 'mat1', name: 'Material 1' },
        type: 'material',
      });

      await store.save({
        path: '@/materials/common/Mat2',
        payload: { id: 'mat2', name: 'Material 2' },
        type: 'material',
      });

      const result = await store.list({
        type: 'material',
        scope: 'library',
      });

      expect(result.length).toBe(2);
      expect(result.map((r) => r.filename)).toContain('Mat1.material.tsx');
      expect(result.map((r) => r.filename)).toContain('Mat2.material.tsx');
    });

    it('should return empty array when no assets exist', async () => {
      const result = await store.list({
        type: 'material',
        scope: 'library',
      });

      expect(result).toEqual([]);
    });

    it('should list assets recursively', async () => {
      // Create nested materials
      await store.save({
        path: '@/materials/rocks/Granite',
        payload: { id: 'granite', name: 'Granite' },
        type: 'material',
      });

      await store.save({
        path: '@/materials/metals/Steel',
        payload: { id: 'steel', name: 'Steel' },
        type: 'material',
      });

      const result = await store.list({
        type: 'material',
        scope: 'library',
      });

      expect(result.length).toBe(2);
      expect(result.map((r) => r.path)).toContain('@/materials/rocks/Granite');
      expect(result.map((r) => r.path)).toContain('@/materials/metals/Steel');
    });
  });

  describe('delete', () => {
    it('should delete an asset file', async () => {
      await store.save({
        path: '@/materials/DeleteMe',
        payload: { id: 'delete-me', name: 'Delete Me' },
        type: 'material',
      });

      const filePath = path.join(libraryRoot, 'materials', 'DeleteMe.material.tsx');
      let exists = await fs
        .access(filePath)
        .then(() => true)
        .catch(() => false);
      expect(exists).toBe(true);

      await store.delete({
        path: '@/materials/DeleteMe',
        type: 'material',
      });

      exists = await fs
        .access(filePath)
        .then(() => true)
        .catch(() => false);
      expect(exists).toBe(false);
    });
  });
});
