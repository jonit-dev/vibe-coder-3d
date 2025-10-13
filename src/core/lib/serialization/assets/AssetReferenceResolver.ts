import * as fs from 'fs/promises';
import * as path from 'path';

import { ASSET_DEFINE_FUNCTIONS, ASSET_EXTENSIONS, AssetType } from './AssetTypes';
import { MaterialDefinitionSchema } from '../../../materials/Material.types';
import { PrefabDefinitionSchema } from '../../../prefabs/Prefab.types';
import { InputActionsAssetSchema } from '../../input/inputTypes';
import { ScriptDefinitionSchema } from './defineScripts';

// Re-export AssetType for backward compatibility
export type { AssetType };

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
      const extension = ASSET_EXTENSIONS[assetType];
      return path.join(context.assetLibraryRoot, `${refPath}${extension}`);
    }

    // Relative reference: ./materials/TreeGreen
    if (ref.startsWith('./')) {
      // Scene-relative references point to the scene's asset file
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

      // If there's only one asset in the file, return it (single asset file)
      if (assets.length === 1) {
        return assets[0] as T;
      }

      // Find the specific asset by ID (for multi-asset files)
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
    // Supports both plural (defineMaterials([...])) and single (defineMaterial({...})) forms
    const { single, plural } = ASSET_DEFINE_FUNCTIONS[assetType];

    const singlePattern = new RegExp(`${single}\\(\\s*({[\\s\\S]*?})\\s*\\);?\\s*$`, 'm');
    const arrayPattern = new RegExp(`${plural}\\(\\s*(\\[[\\s\\S]*?\\])\\s*\\);?\\s*$`, 'm');

    let parsedAssets: unknown[];

    // Try array format first (defineMaterials([...]))
    let match = content.match(arrayPattern);
    if (match) {
      const jsonStr = this.sanitizeForJson(match[1]);
      parsedAssets = JSON.parse(jsonStr);
    } else {
      // Try single format (defineMaterial({...}))
      match = content.match(singlePattern);
      if (match) {
        const jsonStr = this.sanitizeForJson(match[1]);
        parsedAssets = [JSON.parse(jsonStr)];
      } else {
        throw new Error(`Could not parse asset file: no ${single} or ${plural} found`);
      }
    }

    // Apply schema validation and defaults
    return parsedAssets.map(asset => this.applySchema(asset, assetType));
  }

  /**
   * Apply appropriate Zod schema to asset data to ensure defaults are applied
   */
  private applySchema(asset: unknown, assetType: AssetType): unknown {
    switch (assetType) {
      case 'material':
        return MaterialDefinitionSchema.parse(asset);
      case 'prefab':
        return PrefabDefinitionSchema.parse(asset);
      case 'input':
        return InputActionsAssetSchema.parse(asset);
      case 'script':
        return ScriptDefinitionSchema.parse(asset);
      default:
        return asset;
    }
  }

  /**
   * Sanitize TypeScript object notation to JSON
   */
  private sanitizeForJson(str: string): string {
    // Remove comments
    str = str.replace(/\/\/.*$/gm, '');
    str = str.replace(/\/\*[\s\S]*?\*\//g, '');

    // Replace TypeScript enum references with their string values
    // DeviceType.Keyboard -> "keyboard", ActionType.Button -> "button"
    str = str.replace(/([A-Z][a-zA-Z]*Type)\.([A-Z][a-zA-Z]*)/g, '"$2"');
    str = str.replace(/([A-Z][a-zA-Z]*Type)\.([a-z][a-zA-Z]*)/g, '"$2"');

    // Replace unquoted keys with quoted keys
    str = str.replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1"$2":');

    // Replace single quotes with double quotes
    str = str.replace(/'([^'\\]*(\\.[^'\\]*)*)'/g, '"$1"');

    // Remove trailing commas
    str = str.replace(/,(\s*[}\]])/g, '$1');

    return str;
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
