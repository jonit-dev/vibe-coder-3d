import * as fs from 'fs/promises';
import * as path from 'path';
import { AssetType, ASSET_EXTENSIONS } from './AssetTypes';
import { AssetReferenceResolver } from './AssetReferenceResolver';

/**
 * Asset library catalog entry
 */
export interface IAssetCatalogEntry {
  id: string;
  name: string;
  type: AssetType;
  libraryPath: string; // e.g., '@/materials/common/Default'
  filePath: string; // e.g., 'src/game/assets/materials/common/Default.material.tsx'
}

/**
 * Catalog of all assets in the library
 * Provides fast lookup for determining if an asset exists in the library
 */
export class AssetLibraryCatalog {
  private assetsByType = new Map<AssetType, Map<string, IAssetCatalogEntry>>();
  private resolver = new AssetReferenceResolver();

  constructor(private libraryRoot: string = 'src/game/assets') {}

  /**
   * Scan the library and build the catalog
   */
  async build(): Promise<void> {
    const assetTypes: AssetType[] = ['material', 'prefab', 'input', 'script'];

    for (const assetType of assetTypes) {
      const typeDir = path.join(this.libraryRoot, `${assetType}s`);
      const entries = await this.scanDirectory(typeDir, assetType);

      this.assetsByType.set(assetType, entries);
    }
  }

  /**
   * Check if an asset ID exists in the library
   */
  has(assetType: AssetType, assetId: string): boolean {
    const typeMap = this.assetsByType.get(assetType);
    return typeMap?.has(assetId) ?? false;
  }

  /**
   * Get library reference path for an asset ID
   */
  getLibraryRef(assetType: AssetType, assetId: string): string | null {
    const typeMap = this.assetsByType.get(assetType);
    const entry = typeMap?.get(assetId);
    return entry?.libraryPath ?? null;
  }

  /**
   * Get all assets of a specific type
   */
  getAssetsByType(assetType: AssetType): IAssetCatalogEntry[] {
    const typeMap = this.assetsByType.get(assetType);
    return typeMap ? Array.from(typeMap.values()) : [];
  }

  /**
   * Get catalog statistics
   */
  getStats(): Record<AssetType, number> {
    return {
      material: this.assetsByType.get('material')?.size ?? 0,
      prefab: this.assetsByType.get('prefab')?.size ?? 0,
      input: this.assetsByType.get('input')?.size ?? 0,
      script: this.assetsByType.get('script')?.size ?? 0,
    };
  }

  /**
   * Scan a directory recursively for asset files
   */
  private async scanDirectory(
    dir: string,
    assetType: AssetType,
  ): Promise<Map<string, IAssetCatalogEntry>> {
    const entries = new Map<string, IAssetCatalogEntry>();
    const extension = ASSET_EXTENSIONS[assetType];

    try {
      const files = await this.findAssetFiles(dir, extension);

      for (const filePath of files) {
        const assets = await this.parseAssetFile(filePath, assetType);
        for (const asset of assets) {
          const libraryPath = this.filePathToLibraryRef(filePath, assetType);
          entries.set(asset.id, {
            id: asset.id,
            name: asset.name,
            type: assetType,
            libraryPath,
            filePath,
          });
        }
      }
    } catch (error) {
      // Directory doesn't exist yet, return empty
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }

    return entries;
  }

  /**
   * Find all asset files in a directory recursively
   */
  private async findAssetFiles(dir: string, extension: string): Promise<string[]> {
    const results: string[] = [];

    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          const subFiles = await this.findAssetFiles(fullPath, extension);
          results.push(...subFiles);
        } else if (entry.isFile() && entry.name.endsWith(extension)) {
          results.push(fullPath);
        }
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }

    return results;
  }

  /**
   * Parse asset file and extract asset IDs and names
   */
  private async parseAssetFile(
    filePath: string,
    assetType: AssetType,
  ): Promise<Array<{ id: string; name: string }>> {
    const content = await fs.readFile(filePath, 'utf-8');

    try {
      // Use the resolver's parsing logic
      const assets = (this.resolver as any).parseAssetFile(content, assetType);
      return assets.map((a: any) => ({ id: a.id, name: a.name || a.id }));
    } catch {
      // If parsing fails, return empty array
      return [];
    }
  }

  /**
   * Convert file path to library reference
   * e.g., 'src/game/assets/materials/common/Default.material.tsx' -> '@/materials/common/Default'
   */
  private filePathToLibraryRef(filePath: string, assetType: AssetType): string {
    const extension = ASSET_EXTENSIONS[assetType];
    const relativePath = path.relative(this.libraryRoot, filePath);
    const refPath = relativePath.replace(extension, '');
    return `@/${refPath}`;
  }
}
