/**
 * Overrides Store - Handle saving and loading scene override files
 * Supports both File System Access API and fallback download/upload
 */

import { OverridesFile, validateOverridesFile } from '../../serialization/SceneDiff';

export interface IOverridesStore {
  save(overrides: OverridesFile, filename?: string): Promise<void>;
  load(): Promise<OverridesFile | null>;
  exists(sceneId: string): Promise<boolean>;
  delete(sceneId: string): Promise<boolean>;
}

/**
 * Browser-based overrides store using File System Access API with fallbacks
 */
export class BrowserOverridesStore implements IOverridesStore {
  private fileHandles = new Map<string, FileSystemFileHandle>();

  /**
   * Save overrides file
   */
  async save(overrides: OverridesFile, filename?: string): Promise<void> {
    const fileName = filename || `${overrides.sceneId}.overrides.json`;

    try {
      // Try File System Access API first
      if ('showSaveFilePicker' in window) {
        const fileHandle = await window.showSaveFilePicker({
          suggestedName: fileName,
          types: [
            {
              description: 'Scene Overrides',
              accept: { 'application/json': ['.json'] },
            },
          ],
        });

        const writable = await fileHandle.createWritable();
        await writable.write(JSON.stringify(overrides, null, 2));
        await writable.close();

        // Store handle for future use
        this.fileHandles.set(overrides.sceneId, fileHandle);

        console.log(`[OverridesStore] Saved overrides to: ${fileName}`);
        return;
      }
    } catch (error) {
      console.warn('[OverridesStore] File System Access API failed:', error);
    }

    // Fallback: download as file
    this.downloadAsFile(overrides, fileName);
  }

  /**
   * Load overrides file
   */
  async load(): Promise<OverridesFile | null> {
    try {
      // Try File System Access API first
      if ('showOpenFilePicker' in window) {
        const [fileHandle] = await window.showOpenFilePicker({
          types: [
            {
              description: 'Scene Overrides',
              accept: { 'application/json': ['.json'] },
            },
          ],
          multiple: false,
        });

        const file = await fileHandle.getFile();
        const text = await file.text();
        const data = JSON.parse(text);

        const overrides = validateOverridesFile(data);
        if (overrides) {
          // Store handle for future saves
          this.fileHandles.set(overrides.sceneId, fileHandle);
          console.log(`[OverridesStore] Loaded overrides for scene: ${overrides.sceneId}`);
          return overrides;
        } else {
          throw new Error('Invalid overrides file format');
        }
      }
    } catch (error) {
      console.warn('[OverridesStore] File System Access API failed:', error);
    }

    // Fallback: file input
    return this.loadViaFileInput();
  }

  /**
   * Check if overrides exist for a scene
   */
  async exists(sceneId: string): Promise<boolean> {
    // For browser storage, we can only check if we have a handle
    return this.fileHandles.has(sceneId);
  }

  /**
   * Delete overrides for a scene
   */
  async delete(sceneId: string): Promise<boolean> {
    // Remove file handle reference
    const existed = this.fileHandles.has(sceneId);
    this.fileHandles.delete(sceneId);
    return existed;
  }

  /**
   * Download overrides as file (fallback)
   */
  private downloadAsFile(overrides: OverridesFile, filename: string): void {
    const blob = new Blob([JSON.stringify(overrides, null, 2)], {
      type: 'application/json',
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    console.log(`[OverridesStore] Downloaded overrides as: ${filename}`);
  }

  /**
   * Load via file input (fallback)
   */
  private async loadViaFileInput(): Promise<OverridesFile | null> {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';

      input.addEventListener('change', async (event) => {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (!file) {
          resolve(null);
          return;
        }

        try {
          const text = await file.text();
          const data = JSON.parse(text);
          const overrides = validateOverridesFile(data);

          if (overrides) {
            console.log(`[OverridesStore] Loaded overrides from file: ${file.name}`);
            resolve(overrides);
          } else {
            throw new Error('Invalid overrides file format');
          }
        } catch (error) {
          console.error('[OverridesStore] Failed to load file:', error);
          resolve(null);
        }
      });

      input.click();
    });
  }
}

/**
 * LocalStorage-based overrides store (for development/testing)
 */
export class LocalStorageOverridesStore implements IOverridesStore {
  private getKey(sceneId: string): string {
    return `scene-overrides-${sceneId}`;
  }

  async save(overrides: OverridesFile, _filename?: string): Promise<void> {
    const key = this.getKey(overrides.sceneId);
    localStorage.setItem(key, JSON.stringify(overrides));
    console.log(`[OverridesStore] Saved overrides to localStorage: ${key}`);
  }

  async load(): Promise<OverridesFile | null> {
    // For localStorage, we need to know which scene we're looking for
    // This is a simplified implementation
    const keys = Object.keys(localStorage).filter((key) => key.startsWith('scene-overrides-'));

    if (keys.length === 0) return null;

    // Return the first found overrides (in real app, we'd specify the scene)
    const data = localStorage.getItem(keys[0]);
    if (!data) return null;

    try {
      const overrides = validateOverridesFile(JSON.parse(data));
      if (overrides) {
        console.log(
          `[OverridesStore] Loaded overrides from localStorage for: ${overrides.sceneId}`,
        );
      }
      return overrides;
    } catch (error) {
      console.error('[OverridesStore] Invalid overrides in localStorage:', error);
      return null;
    }
  }

  async exists(sceneId: string): Promise<boolean> {
    const key = this.getKey(sceneId);
    return localStorage.getItem(key) !== null;
  }

  async delete(sceneId: string): Promise<boolean> {
    const key = this.getKey(sceneId);
    const existed = localStorage.getItem(key) !== null;
    localStorage.removeItem(key);
    return existed;
  }
}

// Create default store instance
export const overridesStore: IOverridesStore =
  typeof window !== 'undefined' && 'showSaveFilePicker' in window
    ? new BrowserOverridesStore()
    : new LocalStorageOverridesStore();
