/**
 * SceneStore - Abstraction for external scene I/O operations
 * Provides Open/Save/Save As/Delete/List functionality with browser FS Access API
 * and download/upload fallbacks
 */

import { z } from 'zod';

import type { SerializedScene } from './serialization/SceneSchema';

export const SceneDescriptorSchema = z.object({
  id: z.string(),
  guid: z.string(),
  name: z.string(),
  source: z.enum(['code', 'file', 'remote']),
  path: z.string().optional(),
  tags: z.array(z.string()).optional(),
  updatedAt: z.string().optional(),
  metadata: z
    .object({
      author: z.string().optional(),
      description: z.string().optional(),
      version: z.string().optional(),
      previewImage: z.string().optional(),
    })
    .optional(),
});

export type SceneDescriptor = z.infer<typeof SceneDescriptorSchema>;

export interface ISceneOpenResult {
  scene: SerializedScene;
  descriptor: Partial<SceneDescriptor>;
}

export interface ISceneSaveResult {
  path?: string;
  guid?: string;
  success: boolean;
  message?: string;
}

/**
 * Scene store abstraction for file operations
 */
export interface ISceneStore {
  /**
   * Open a scene file through file picker or by path
   * @param path Optional specific path to open
   * @returns Scene data and descriptor, or null if canceled/failed
   */
  open(path?: string): Promise<ISceneOpenResult | null>;

  /**
   * Save current scene to existing path or prompt for new location
   * @param scene Scene data to save
   * @param suggestName Suggested filename if no existing path
   * @returns Save result with path and guid
   */
  save(scene: SerializedScene, suggestName?: string): Promise<ISceneSaveResult>;

  /**
   * Save scene with "Save As" dialog (always prompt for location)
   * @param scene Scene data to save
   * @param defaultName Default filename in save dialog
   * @returns Save result with path and guid
   */
  saveAs(scene: SerializedScene, defaultName?: string): Promise<ISceneSaveResult>;

  /**
   * Delete a scene file
   * @param path Path to scene file
   * @returns True if successfully deleted
   */
  delete(path: string): Promise<boolean>;

  /**
   * List recently opened scene files
   * @returns Array of scene descriptors
   */
  listRecent(): Promise<SceneDescriptor[]>;

  /**
   * Check if a path is accessible/exists
   * @param path Path to check
   * @returns True if accessible
   */
  exists(path: string): Promise<boolean>;

  /**
   * Get metadata for a scene file without loading the full scene
   * @param path Path to scene file
   * @returns Scene descriptor or null if not accessible
   */
  getMetadata(path: string): Promise<SceneDescriptor | null>;
}

/**
 * Browser-based scene store implementation using FS Access API with fallbacks
 */
export class BrowserSceneStore implements ISceneStore {
  private recentScenes: SceneDescriptor[] = [];
  private maxRecentCount = 10;

  constructor() {
    this.loadRecentScenes();
  }

  async open(path?: string): Promise<ISceneOpenResult | null> {
    try {
      let fileHandle: FileSystemFileHandle | File;

      if (path) {
        // Direct path access - not fully supported in browsers yet
        console.warn('[SceneStore] Direct path access not supported in browsers');
        return null;
      }

      if ('showOpenFilePicker' in window) {
        // Use FS Access API
        const [handle] = await (window as any).showOpenFilePicker({
          types: [
            {
              description: 'Scene files',
              accept: { 'application/json': ['.scene.json', '.json'] },
            },
          ],
          multiple: false,
        });
        fileHandle = handle;
      } else {
        // Fallback to file input
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.scene.json,.json';

        return new Promise((resolve) => {
          input.onchange = async () => {
            const file = input.files?.[0];
            if (!file) {
              resolve(null);
              return;
            }

            try {
              const content = await file.text();
              const scene = JSON.parse(content);

              const descriptor: Partial<SceneDescriptor> = {
                name: file.name.replace(/\.(scene\.)?json$/, ''),
                source: 'file',
                path: file.name,
                updatedAt: new Date(file.lastModified).toISOString(),
              };

              resolve({ scene, descriptor });
            } catch (error) {
              console.error('[SceneStore] Failed to parse scene file:', error);
              resolve(null);
            }
          };

          input.click();
        });
      }

      // Handle FS Access API file
      if ('getFile' in fileHandle) {
        const file = await (fileHandle as FileSystemFileHandle).getFile();
        const content = await file.text();
        const scene = JSON.parse(content);

        const descriptor: Partial<SceneDescriptor> = {
          name: file.name.replace(/\.(scene\.)?json$/, ''),
          source: 'file',
          path: file.name,
          updatedAt: new Date(file.lastModified).toISOString(),
        };

        // Add to recent files
        this.addToRecent(descriptor as SceneDescriptor);

        return { scene, descriptor };
      }

      return null;
    } catch (error) {
      console.error('[SceneStore] Open failed:', error);
      return null;
    }
  }

  async save(scene: SerializedScene, suggestName?: string): Promise<ISceneSaveResult> {
    // For now, always use "Save As" behavior since we don't track current file handles
    return this.saveAs(scene, suggestName);
  }

  async saveAs(scene: SerializedScene, defaultName?: string): Promise<ISceneSaveResult> {
    try {
      const fileName = `${defaultName || 'scene'}.scene.json`;
      const content = JSON.stringify(scene, null, 2);

      if ('showSaveFilePicker' in window) {
        // Use FS Access API
        const fileHandle = await (window as any).showSaveFilePicker({
          suggestedName: fileName,
          types: [
            {
              description: 'Scene files',
              accept: { 'application/json': ['.scene.json'] },
            },
          ],
        });

        const writable = await fileHandle.createWritable();
        await writable.write(content);
        await writable.close();

        const descriptor: SceneDescriptor = {
          id: crypto.randomUUID(),
          guid: crypto.randomUUID(),
          name: fileName.replace(/\.(scene\.)?json$/, ''),
          source: 'file',
          path: fileName,
          updatedAt: new Date().toISOString(),
        };

        this.addToRecent(descriptor);

        return {
          path: fileName,
          guid: descriptor.guid,
          success: true,
          message: 'Scene saved successfully',
        };
      } else {
        // Fallback to download
        const blob = new Blob([content], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();

        URL.revokeObjectURL(url);

        return {
          path: fileName,
          success: true,
          message: 'Scene downloaded successfully',
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('[SceneStore] Save failed:', error);
      return {
        success: false,
        message: `Save failed: ${errorMessage}`,
      };
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async delete(_path: string): Promise<boolean> {
    // Not supported in browser environment for security reasons
    console.warn('[SceneStore] Delete operation not supported in browser environment');
    return false;
  }

  async listRecent(): Promise<SceneDescriptor[]> {
    return this.recentScenes;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async exists(_path: string): Promise<boolean> {
    // Cannot check file existence in browser environment without user interaction
    return false;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getMetadata(_path: string): Promise<SceneDescriptor | null> {
    // Cannot access file metadata in browser environment without user interaction
    return null;
  }

  private addToRecent(descriptor: SceneDescriptor): void {
    // Remove existing entry if present
    this.recentScenes = this.recentScenes.filter((scene) => scene.path !== descriptor.path);

    // Add to beginning
    this.recentScenes.unshift(descriptor);

    // Limit to max count
    if (this.recentScenes.length > this.maxRecentCount) {
      this.recentScenes = this.recentScenes.slice(0, this.maxRecentCount);
    }

    this.saveRecentScenes();
  }

  private loadRecentScenes(): void {
    try {
      const stored = localStorage.getItem('vibe-coder-recent-scenes');
      if (stored) {
        this.recentScenes = JSON.parse(stored);
      }
    } catch (error) {
      console.warn('[SceneStore] Failed to load recent scenes:', error);
      this.recentScenes = [];
    }
  }

  private saveRecentScenes(): void {
    try {
      localStorage.setItem('vibe-coder-recent-scenes', JSON.stringify(this.recentScenes));
    } catch (error) {
      console.warn('[SceneStore] Failed to save recent scenes:', error);
    }
  }
}

// Export default instance
export const sceneStore = new BrowserSceneStore();