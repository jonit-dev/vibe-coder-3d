import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SceneFolderManager } from '../SceneFolderManager';
import type { IMultiFileSceneData } from '../MultiFileSceneSerializer';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

describe('SceneFolderManager', () => {
  let manager: SceneFolderManager;
  let tempDir: string;
  let sceneFolderPath: string;

  beforeEach(async () => {
    manager = new SceneFolderManager();
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'folder-manager-test-'));
    sceneFolderPath = path.join(tempDir, 'TestScene');
  });

  afterEach(async () => {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('createSceneFolder', () => {
    it('should create scene folder', async () => {
      await manager.createSceneFolder(sceneFolderPath);

      const stats = await fs.stat(sceneFolderPath);
      expect(stats.isDirectory()).toBe(true);
    });

    it('should create nested folders recursively', async () => {
      const nestedPath = path.join(tempDir, 'level1', 'level2', 'TestScene');
      await manager.createSceneFolder(nestedPath);

      const stats = await fs.stat(nestedPath);
      expect(stats.isDirectory()).toBe(true);
    });

    it('should not fail if folder already exists', async () => {
      await manager.createSceneFolder(sceneFolderPath);
      await manager.createSceneFolder(sceneFolderPath); // Should not throw

      const stats = await fs.stat(sceneFolderPath);
      expect(stats.isDirectory()).toBe(true);
    });

    it('should throw error for invalid path', async () => {
      const invalidPath = '\0invalid';
      await expect(manager.createSceneFolder(invalidPath)).rejects.toThrow();
    });
  });

  describe('writeSceneFiles', () => {
    it('should write all scene files', async () => {
      const sceneData: IMultiFileSceneData = {
        index: 'index content',
        materials: 'materials content',
        prefabs: 'prefabs content',
        inputs: 'inputs content',
        metadata: 'metadata content',
      };

      const result = await manager.writeSceneFiles(sceneFolderPath, 'TestScene', sceneData);

      expect(result.filesWritten).toHaveLength(5);
      expect(result.totalSize).toBeGreaterThan(0);

      // Verify all files exist
      const indexExists = await fs.stat(path.join(sceneFolderPath, 'TestScene.index.tsx'));
      const materialsExists = await fs.stat(path.join(sceneFolderPath, 'TestScene.materials.tsx'));
      const prefabsExists = await fs.stat(path.join(sceneFolderPath, 'TestScene.prefabs.tsx'));
      const inputsExists = await fs.stat(path.join(sceneFolderPath, 'TestScene.inputs.tsx'));
      const metadataExists = await fs.stat(path.join(sceneFolderPath, 'TestScene.metadata.json'));

      expect(indexExists.isFile()).toBe(true);
      expect(materialsExists.isFile()).toBe(true);
      expect(prefabsExists.isFile()).toBe(true);
      expect(inputsExists.isFile()).toBe(true);
      expect(metadataExists.isFile()).toBe(true);
    });

    it('should write only required files when optional files missing', async () => {
      const sceneData: IMultiFileSceneData = {
        index: 'index content',
      };

      const result = await manager.writeSceneFiles(sceneFolderPath, 'TestScene', sceneData);

      expect(result.filesWritten).toHaveLength(1);
      expect(result.filesWritten[0]).toContain('index.tsx');
    });

    it('should return correct file sizes', async () => {
      const sceneData: IMultiFileSceneData = {
        index: 'a'.repeat(100),
        materials: 'b'.repeat(200),
      };

      const result = await manager.writeSceneFiles(sceneFolderPath, 'TestScene', sceneData);

      expect(result.totalSize).toBe(300);
    });

    it('should create folder if it does not exist', async () => {
      const sceneData: IMultiFileSceneData = {
        index: 'index content',
      };

      await manager.writeSceneFiles(sceneFolderPath, 'TestScene', sceneData);

      const stats = await fs.stat(sceneFolderPath);
      expect(stats.isDirectory()).toBe(true);
    });

    it('should cleanup on write error', async () => {
      const sceneData: IMultiFileSceneData = {
        index: 'index content',
      };

      // Write first time successfully
      await manager.writeSceneFiles(sceneFolderPath, 'TestScene', sceneData);

      // Make folder read-only to cause write error
      await fs.chmod(sceneFolderPath, 0o444);

      const sceneData2: IMultiFileSceneData = {
        index: 'new index',
        materials: 'new materials',
      };

      // Should fail to write
      await expect(
        manager.writeSceneFiles(sceneFolderPath, 'TestScene2', sceneData2),
      ).rejects.toThrow();

      // Restore permissions for cleanup
      await fs.chmod(sceneFolderPath, 0o755);
    });
  });

  describe('readSceneFolder', () => {
    it('should read all scene files', async () => {
      const sceneData: IMultiFileSceneData = {
        index: 'index content',
        materials: 'materials content',
        prefabs: 'prefabs content',
        inputs: 'inputs content',
        metadata: 'metadata content',
      };

      await manager.writeSceneFiles(sceneFolderPath, 'TestScene', sceneData);

      const result = await manager.readSceneFolder(sceneFolderPath, 'TestScene');

      expect(result.index).toBe('index content');
      expect(result.materials).toBe('materials content');
      expect(result.prefabs).toBe('prefabs content');
      expect(result.inputs).toBe('inputs content');
      expect(result.metadata).toBe('metadata content');
    });

    it('should handle missing optional files', async () => {
      const sceneData: IMultiFileSceneData = {
        index: 'index content',
      };

      await manager.writeSceneFiles(sceneFolderPath, 'TestScene', sceneData);

      const result = await manager.readSceneFolder(sceneFolderPath, 'TestScene');

      expect(result.index).toBe('index content');
      expect(result.materials).toBeUndefined();
      expect(result.prefabs).toBeUndefined();
      expect(result.inputs).toBeUndefined();
    });

    it('should throw error if index file missing', async () => {
      await manager.createSceneFolder(sceneFolderPath);

      await expect(
        manager.readSceneFolder(sceneFolderPath, 'TestScene'),
      ).rejects.toThrow();
    });

    it('should throw error if folder does not exist', async () => {
      await expect(
        manager.readSceneFolder(sceneFolderPath, 'TestScene'),
      ).rejects.toThrow();
    });
  });

  describe('isMultiFileScene', () => {
    it('should return true for multi-file scene', async () => {
      const sceneData: IMultiFileSceneData = {
        index: 'index content',
      };

      await manager.writeSceneFiles(sceneFolderPath, 'TestScene', sceneData);

      const result = await manager.isMultiFileScene(sceneFolderPath, 'TestScene');
      expect(result).toBe(true);
    });

    it('should return false for non-existent scene', async () => {
      const result = await manager.isMultiFileScene(sceneFolderPath, 'TestScene');
      expect(result).toBe(false);
    });

    it('should return false if folder exists but no index file', async () => {
      await manager.createSceneFolder(sceneFolderPath);

      const result = await manager.isMultiFileScene(sceneFolderPath, 'TestScene');
      expect(result).toBe(false);
    });
  });

  describe('deleteSceneFolder', () => {
    it('should delete scene folder and all files', async () => {
      const sceneData: IMultiFileSceneData = {
        index: 'index content',
        materials: 'materials content',
      };

      await manager.writeSceneFiles(sceneFolderPath, 'TestScene', sceneData);

      await manager.deleteSceneFolder(sceneFolderPath);

      // Verify folder no longer exists
      await expect(fs.stat(sceneFolderPath)).rejects.toThrow();
    });

    it('should not throw if folder does not exist', async () => {
      await manager.deleteSceneFolder(sceneFolderPath);
      // Should complete without error
      expect(true).toBe(true);
    });

    it('should delete nested folders', async () => {
      const nestedPath = path.join(sceneFolderPath, 'subfolder');
      await manager.createSceneFolder(nestedPath);

      const sceneData: IMultiFileSceneData = {
        index: 'index content',
      };
      await manager.writeSceneFiles(nestedPath, 'Nested', sceneData);

      await manager.deleteSceneFolder(sceneFolderPath);

      await expect(fs.stat(sceneFolderPath)).rejects.toThrow();
    });
  });

  describe('listSceneFolderFiles', () => {
    it('should list all files in scene folder', async () => {
      const sceneData: IMultiFileSceneData = {
        index: 'index content',
        materials: 'materials content',
        prefabs: 'prefabs content',
      };

      await manager.writeSceneFiles(sceneFolderPath, 'TestScene', sceneData);

      const files = await manager.listSceneFolderFiles(sceneFolderPath);

      expect(files).toHaveLength(3);
      expect(files.some((f) => f.endsWith('index.tsx'))).toBe(true);
      expect(files.some((f) => f.endsWith('materials.tsx'))).toBe(true);
      expect(files.some((f) => f.endsWith('prefabs.tsx'))).toBe(true);
    });

    it('should return empty array for empty folder', async () => {
      await manager.createSceneFolder(sceneFolderPath);

      const files = await manager.listSceneFolderFiles(sceneFolderPath);

      expect(files).toHaveLength(0);
    });

    it('should throw error if folder does not exist', async () => {
      await expect(manager.listSceneFolderFiles(sceneFolderPath)).rejects.toThrow();
    });
  });
});
