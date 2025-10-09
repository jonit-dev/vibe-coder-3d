import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import { FsSceneStore } from '../FsSceneStore';

describe('FsSceneStore', () => {
  const TEST_DIR = './test-scenes-temp';
  let store: FsSceneStore;

  beforeEach(async () => {
    store = new FsSceneStore(TEST_DIR);
    // Ensure clean slate
    try {
      await fs.rm(TEST_DIR, { recursive: true, force: true });
    } catch {
      // Ignore if doesn't exist
    }
  });

  afterEach(async () => {
    // Cleanup
    try {
      await fs.rm(TEST_DIR, { recursive: true, force: true });
    } catch {
      // Ignore errors
    }
  });

  describe('sanitizeFilename', () => {
    it('should sanitize filename with special characters', () => {
      const result = store.sanitizeFilename('My Scene!@#$%', '.json');
      expect(result).toBe('My_Scene_____.json');
    });

    it('should add extension if missing', () => {
      const result = store.sanitizeFilename('scene', '.json');
      expect(result).toBe('scene.json');
    });

    it('should handle existing extension correctly', () => {
      const result = store.sanitizeFilename('scene.json', '.json');
      expect(result).toBe('scene_json.json');
    });

    it('should handle path separators', () => {
      const result = store.sanitizeFilename('../../../etc/passwd', '.json');
      expect(result).toBe('_________etc_passwd.json');
    });
  });

  describe('write', () => {
    it('should write file and return metadata', async () => {
      const content = JSON.stringify({ test: 'data' });
      const result = await store.write('test.json', content);

      expect(result).toHaveProperty('modified');
      expect(result).toHaveProperty('size');
      expect(result.size).toBeGreaterThan(0);
      expect(new Date(result.modified)).toBeInstanceOf(Date);
    });

    it('should create directory if it does not exist', async () => {
      const content = 'test content';
      await store.write('test.json', content);

      const dirExists = await fs
        .access(TEST_DIR)
        .then(() => true)
        .catch(() => false);
      expect(dirExists).toBe(true);
    });

    it('should reject path traversal attempts', async () => {
      await expect(store.write('../outside/test.json', 'data')).rejects.toThrow(
        'path traversal detected',
      );
    });
  });

  describe('read', () => {
    it('should read file and return content with metadata', async () => {
      const content = JSON.stringify({ test: 'data' });
      await store.write('test.json', content);

      const result = await store.read('test.json');

      expect(result.content).toBe(content);
      expect(result).toHaveProperty('modified');
      expect(result).toHaveProperty('size');
      expect(result.size).toBeGreaterThan(0);
    });

    it('should throw error if file does not exist', async () => {
      await expect(store.read('nonexistent.json')).rejects.toThrow();
    });

    it('should reject path traversal attempts', async () => {
      await expect(store.read('../../../etc/passwd')).rejects.toThrow('path traversal detected');
    });
  });

  describe('list', () => {
    it('should return empty array if directory does not exist', async () => {
      const result = await store.list();
      expect(result).toEqual([]);
    });

    it('should list all files', async () => {
      await store.write('scene1.json', 'content1');
      await store.write('scene2.json', 'content2');
      await store.write('scene3.tsx', 'content3');

      const result = await store.list();

      expect(result).toHaveLength(3);
      expect(result.map((f) => f.name)).toContain('scene1.json');
      expect(result.map((f) => f.name)).toContain('scene2.json');
      expect(result.map((f) => f.name)).toContain('scene3.tsx');
    });

    it('should sort by modification time, newest first', async () => {
      await store.write('old.json', 'old');
      // Small delay to ensure different timestamps
      await new Promise((resolve) => setTimeout(resolve, 10));
      await store.write('new.json', 'new');

      const result = await store.list();

      expect(result[0].name).toBe('new.json');
      expect(result[1].name).toBe('old.json');
    });

    it('should include file metadata', async () => {
      await store.write('test.json', 'content');

      const result = await store.list();

      expect(result[0]).toHaveProperty('name');
      expect(result[0]).toHaveProperty('modified');
      expect(result[0]).toHaveProperty('size');
      expect(result[0].size).toBeGreaterThan(0);
    });

    it('should skip directories', async () => {
      await fs.mkdir(path.join(TEST_DIR, 'subdir'), { recursive: true });
      await store.write('file.json', 'content');

      const result = await store.list();

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('file.json');
    });
  });

  describe('exists', () => {
    it('should return true if file exists', async () => {
      await store.write('test.json', 'content');

      const result = await store.exists('test.json');

      expect(result).toBe(true);
    });

    it('should return false if file does not exist', async () => {
      const result = await store.exists('nonexistent.json');

      expect(result).toBe(false);
    });

    it('should return false for path traversal attempts', async () => {
      const result = await store.exists('../../../etc/passwd');

      expect(result).toBe(false);
    });
  });
});
