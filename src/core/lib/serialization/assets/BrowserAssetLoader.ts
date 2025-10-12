import type { IMaterialDefinition } from '@core/materials/Material.types';
import type { IPrefabDefinition } from '@core/prefabs/Prefab.types';
import type { IInputActionsAsset } from '@core/lib/input/inputTypes';
import { AssetType } from './AssetTypes';

/**
 * Browser-compatible asset loader
 * Uses dynamic imports to load asset files in the browser
 */
export class BrowserAssetLoader {
  /**
   * Load all assets of a specific type from the library
   */
  async loadLibraryAssets<T>(assetType: AssetType): Promise<T[]> {
    const assets: T[] = [];

    try {
      // Use dynamic imports with glob pattern
      // Vite will bundle these at build time
      const modules = await this.loadAssetModules(assetType);

      for (const module of modules) {
        const assetData = module.default;

        // Handle both single asset and array of assets
        if (Array.isArray(assetData)) {
          assets.push(...(assetData as T[]));
        } else if (assetData) {
          assets.push(assetData as T);
        }
      }
    } catch (error) {
      console.warn(`Failed to load ${assetType} assets from library:`, error);
    }

    return assets;
  }

  /**
   * Load asset modules using dynamic imports
   */
  private async loadAssetModules(assetType: AssetType): Promise<Array<{ default: unknown }>> {
    const modules: Array<{ default: unknown }> = [];

    try {
      switch (assetType) {
        case 'material': {
          // Load all .material.tsx files from the library
          const materialModules = import.meta.glob(
            '/src/game/assets/materials/**/*.material.tsx',
            { eager: false }
          );

          for (const path in materialModules) {
            const module = await materialModules[path]() as { default: unknown };
            modules.push(module);
          }
          break;
        }

        case 'prefab': {
          const prefabModules = import.meta.glob(
            '/src/game/assets/prefabs/**/*.prefab.tsx',
            { eager: false }
          );

          for (const path in prefabModules) {
            const module = await prefabModules[path]() as { default: unknown };
            modules.push(module);
          }
          break;
        }

        case 'input': {
          const inputModules = import.meta.glob(
            '/src/game/assets/inputs/**/*.input.tsx',
            { eager: false }
          );

          for (const path in inputModules) {
            const module = await inputModules[path]() as { default: unknown };
            modules.push(module);
          }
          break;
        }

        case 'script': {
          const scriptModules = import.meta.glob(
            '/src/game/assets/scripts/**/*.script.tsx',
            { eager: false }
          );

          for (const path in scriptModules) {
            const module = await scriptModules[path]() as { default: unknown };
            modules.push(module);
          }
          break;
        }
      }
    } catch (error) {
      console.warn(`Failed to load ${assetType} modules:`, error);
    }

    return modules;
  }

  /**
   * Load materials from library
   */
  async loadMaterials(): Promise<IMaterialDefinition[]> {
    return this.loadLibraryAssets<IMaterialDefinition>('material');
  }

  /**
   * Load prefabs from library
   */
  async loadPrefabs(): Promise<IPrefabDefinition[]> {
    return this.loadLibraryAssets<IPrefabDefinition>('prefab');
  }

  /**
   * Load input assets from library
   */
  async loadInputAssets(): Promise<IInputActionsAsset[]> {
    return this.loadLibraryAssets<IInputActionsAsset>('input');
  }
}
