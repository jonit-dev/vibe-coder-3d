import * as fs from 'fs/promises';
import * as path from 'path';
import type { IMultiFileSceneData } from './MultiFileSceneSerializer';

/**
 * Manages file system operations for multi-file scenes
 * Handles folder creation, file writing, and cleanup
 */
export class SceneFolderManager {
  /**
   * Create scene folder if it doesn't exist
   */
  async createSceneFolder(sceneFolderPath: string): Promise<void> {
    try {
      await fs.mkdir(sceneFolderPath, { recursive: true });
    } catch (error) {
      throw new Error(
        `Failed to create scene folder '${sceneFolderPath}': ${error instanceof Error ? error.message : error}`,
      );
    }
  }

  /**
   * Write all scene files to folder
   */
  async writeSceneFiles(
    sceneFolderPath: string,
    sceneName: string,
    sceneData: IMultiFileSceneData,
  ): Promise<{
    filesWritten: string[];
    totalSize: number;
  }> {
    const filesWritten: string[] = [];
    let totalSize = 0;

    try {
      // Ensure folder exists
      await this.createSceneFolder(sceneFolderPath);

      // Write index file
      const indexPath = path.join(sceneFolderPath, `${sceneName}.index.tsx`);
      await fs.writeFile(indexPath, sceneData.index, 'utf-8');
      const indexStats = await fs.stat(indexPath);
      filesWritten.push(indexPath);
      totalSize += indexStats.size;

      // Write materials file if present
      if (sceneData.materials) {
        const materialsPath = path.join(sceneFolderPath, `${sceneName}.materials.tsx`);
        await fs.writeFile(materialsPath, sceneData.materials, 'utf-8');
        const materialsStats = await fs.stat(materialsPath);
        filesWritten.push(materialsPath);
        totalSize += materialsStats.size;
      }

      // Write prefabs file if present
      if (sceneData.prefabs) {
        const prefabsPath = path.join(sceneFolderPath, `${sceneName}.prefabs.tsx`);
        await fs.writeFile(prefabsPath, sceneData.prefabs, 'utf-8');
        const prefabsStats = await fs.stat(prefabsPath);
        filesWritten.push(prefabsPath);
        totalSize += prefabsStats.size;
      }

      // Write inputs file if present
      if (sceneData.inputs) {
        const inputsPath = path.join(sceneFolderPath, `${sceneName}.inputs.tsx`);
        await fs.writeFile(inputsPath, sceneData.inputs, 'utf-8');
        const inputsStats = await fs.stat(inputsPath);
        filesWritten.push(inputsPath);
        totalSize += inputsStats.size;
      }

      // Write metadata file if present
      if (sceneData.metadata) {
        const metadataPath = path.join(sceneFolderPath, `${sceneName}.metadata.json`);
        await fs.writeFile(metadataPath, sceneData.metadata, 'utf-8');
        const metadataStats = await fs.stat(metadataPath);
        filesWritten.push(metadataPath);
        totalSize += metadataStats.size;
      }

      return { filesWritten, totalSize };
    } catch (error) {
      // Cleanup on error - remove any files that were written
      await this.cleanupSceneFolder(sceneFolderPath, filesWritten);
      throw new Error(
        `Failed to write scene files: ${error instanceof Error ? error.message : error}`,
      );
    }
  }

  /**
   * Read all scene files from folder
   */
  async readSceneFolder(
    sceneFolderPath: string,
    sceneName: string,
  ): Promise<{
    index: string;
    materials?: string;
    prefabs?: string;
    inputs?: string;
    metadata?: string;
  }> {
    try {
      // Read index file (required)
      const indexPath = path.join(sceneFolderPath, `${sceneName}.index.tsx`);
      const index = await fs.readFile(indexPath, 'utf-8');

      // Read optional files
      const materialsPath = path.join(sceneFolderPath, `${sceneName}.materials.tsx`);
      let materials: string | undefined;
      try {
        materials = await fs.readFile(materialsPath, 'utf-8');
      } catch {
        // File doesn't exist, that's ok
      }

      const prefabsPath = path.join(sceneFolderPath, `${sceneName}.prefabs.tsx`);
      let prefabs: string | undefined;
      try {
        prefabs = await fs.readFile(prefabsPath, 'utf-8');
      } catch {
        // File doesn't exist, that's ok
      }

      const inputsPath = path.join(sceneFolderPath, `${sceneName}.inputs.tsx`);
      let inputs: string | undefined;
      try {
        inputs = await fs.readFile(inputsPath, 'utf-8');
      } catch {
        // File doesn't exist, that's ok
      }

      const metadataPath = path.join(sceneFolderPath, `${sceneName}.metadata.json`);
      let metadata: string | undefined;
      try {
        metadata = await fs.readFile(metadataPath, 'utf-8');
      } catch {
        // File doesn't exist, that's ok
      }

      return { index, materials, prefabs, inputs, metadata };
    } catch (error) {
      throw new Error(
        `Failed to read scene folder '${sceneFolderPath}': ${error instanceof Error ? error.message : error}`,
      );
    }
  }

  /**
   * Check if path is a multi-file scene folder
   */
  async isMultiFileScene(sceneFolderPath: string, sceneName: string): Promise<boolean> {
    try {
      const indexPath = path.join(sceneFolderPath, `${sceneName}.index.tsx`);
      await fs.access(indexPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Delete scene folder and all its files
   */
  async deleteSceneFolder(sceneFolderPath: string): Promise<void> {
    try {
      await fs.rm(sceneFolderPath, { recursive: true, force: true });
    } catch (error) {
      throw new Error(
        `Failed to delete scene folder '${sceneFolderPath}': ${error instanceof Error ? error.message : error}`,
      );
    }
  }

  /**
   * List all files in scene folder
   */
  async listSceneFolderFiles(sceneFolderPath: string): Promise<string[]> {
    try {
      const files = await fs.readdir(sceneFolderPath);
      return files.map((file) => path.join(sceneFolderPath, file));
    } catch (error) {
      throw new Error(
        `Failed to list scene folder '${sceneFolderPath}': ${error instanceof Error ? error.message : error}`,
      );
    }
  }

  /**
   * Cleanup scene folder by removing specific files
   * Used for rollback on error
   */
  private async cleanupSceneFolder(
    sceneFolderPath: string,
    filesToRemove: string[],
  ): Promise<void> {
    for (const file of filesToRemove) {
      try {
        await fs.unlink(file);
      } catch {
        // Ignore errors during cleanup
      }
    }

    // Try to remove folder if empty
    try {
      const files = await fs.readdir(sceneFolderPath);
      if (files.length === 0) {
        await fs.rmdir(sceneFolderPath);
      }
    } catch {
      // Ignore errors during cleanup
    }
  }
}
