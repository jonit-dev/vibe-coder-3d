import * as path from 'path';
import * as fs from 'fs/promises';
import type { IMaterialDefinition } from '@core/materials/Material.types';
import type { IPrefabDefinition } from '@core/prefabs/Prefab.types';
import type { IInputActionsAsset } from '@core/lib/input/inputTypes';

export type AssetType = 'material' | 'prefab' | 'input';

export interface IAssetRefResolutionContext {
  sceneFolder: string; // e.g., 'src/game/scenes/Forest'
  assetLibraryRoot: string; // e.g., 'src/game/assets'
  format: 'single-file' | 'multi-file';
}

/**
 * Asset reference types:
 *
 * 1. Scene-relative reference:
 *    './materials/TreeGreen' → ./Forest.materials.tsx#TreeGreen
 *
 * 2. Shared library reference:
 *    '@/materials/common/Stone' → /src/game/assets/materials/common/Stone.material.tsx
 */
export class AssetReferenceResolver {
  private cache = new Map<string, unknown>();

  /**
   * Resolve asset reference to actual asset data
   */
  async resolve<T = unknown>(
    ref: string,
    context: IAssetRefResolutionContext,
    assetType: AssetType,
  ): Promise<T> {
    const cacheKey = `${context.sceneFolder}:${ref}`;

    // Check cache
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey) as T;
    }

    // Resolve path
    const resolvedPath = this.resolvePath(ref, context, assetType);

    // Load asset
    const assetData = await this.loadAsset<T>(resolvedPath, ref, assetType);

    // Cache and return
    this.cache.set(cacheKey, assetData);
    return assetData;
  }

  /**
   * Resolve reference string to file path
   */
  resolvePath(ref: string, context: IAssetRefResolutionContext, assetType: AssetType): string {
    // Absolute reference: @/materials/common/Stone
    if (ref.startsWith('@/')) {
      const refPath = ref.replace('@/', '');
      return path.join(
        context.assetLibraryRoot,
        `${refPath}.${assetType}.tsx`,
      );
    }

    // Relative reference: ./materials/TreeGreen
    if (ref.startsWith('./')) {
      // Scene-relative references point to the scene's asset file
      const assetId = ref.split('/').pop() || '';
      const sceneName = path.basename(context.sceneFolder);
      const assetFile = `${sceneName}.${assetType}s.tsx`;
      return path.join(context.sceneFolder, assetFile);
    }

    // Invalid reference
    throw new Error(`Invalid asset reference: ${ref}. Must start with '@/' or './'`);
  }

  /**
   * Load asset file and extract specific asset by ID
   */
  private async loadAsset<T>(filePath: string, ref: string, assetType: AssetType): Promise<T> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');

      // Extract asset ID from reference
      const assetId = ref.split('/').pop() || '';

      // Parse the file to get assets array
      const assets = this.parseAssetFile(content, assetType);

      // Find the specific asset by ID
      const asset = assets.find((a: any) => a.id === assetId);

      if (!asset) {
        throw new Error(`Asset '${assetId}' not found in ${filePath}`);
      }

      return asset as T;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new Error(`Asset file not found: ${filePath}`);
      }
      throw error;
    }
  }

  /**
   * Parse asset file and extract assets array
   */
  private parseAssetFile(content: string, assetType: AssetType): unknown[] {
    // Extract the default export from the file
    // Supports both defineMaterials([...]) and defineMaterial({...})
    const singlePattern = new RegExp(`define${this.capitalize(assetType)}\\(\\s*({[\\s\\S]*?})\\s*\\);?\\s*$`, 'm');
    const arrayPattern = new RegExp(`define${this.capitalize(assetType)}s\\(\\s*(\\[[\\s\\S]*?\\])\\s*\\);?\\s*$`, 'm');

    // Try array format first (defineMaterials([...]))
    let match = content.match(arrayPattern);
    if (match) {
      const jsonStr = this.sanitizeForJson(match[1]);
      return JSON.parse(jsonStr);
    }

    // Try single format (defineMaterial({...}))
    match = content.match(singlePattern);
    if (match) {
      const jsonStr = this.sanitizeForJson(match[1]);
      return [JSON.parse(jsonStr)];
    }

    throw new Error(`Could not parse asset file: no define${this.capitalize(assetType)}(s) found`);
  }

  /**
   * Sanitize TypeScript object notation to JSON
   */
  private sanitizeForJson(str: string): string {
    // Remove comments
    str = str.replace(/\/\/.*$/gm, '');
    str = str.replace(/\/\*[\s\S]*?\*\//g, '');

    // Replace unquoted keys with quoted keys
    str = str.replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1"$2":');

    // Replace single quotes with double quotes
    str = str.replace(/'([^'\\]*(\\.[^'\\]*)*)'/g, '"$1"');

    // Remove trailing commas
    str = str.replace(/,(\\s*[}\]])/g, '$1');

    return str;
  }

  /**
   * Capitalize first letter
   */
  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Clear resolution cache (for hot-reload)
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}
