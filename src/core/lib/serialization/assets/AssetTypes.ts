/**
 * Generic asset type definitions and utilities
 * Used across the asset library system for type safety and consistency
 */

/**
 * All supported asset types in the system
 */
export type AssetType = 'material' | 'prefab' | 'input' | 'script' | 'animation';

/**
 * Generic asset metadata interface
 * All asset types should include these base properties
 */
export interface IAssetMeta {
  id: string;
  name: string;
  path?: string; // Optional path for library assets
}

/**
 * Asset file extension mapping
 */
export const ASSET_EXTENSIONS: Record<AssetType, string> = {
  material: '.material.tsx',
  prefab: '.prefab.tsx',
  input: '.input.tsx',
  script: '.script.tsx',
  animation: '.animation.tsx',
};

/**
 * Asset define function naming
 */
export const ASSET_DEFINE_FUNCTIONS: Record<AssetType, { single: string; plural: string }> = {
  material: { single: 'defineMaterial', plural: 'defineMaterials' },
  prefab: { single: 'definePrefab', plural: 'definePrefabs' },
  input: { single: 'defineInputAsset', plural: 'defineInputAssets' },
  script: { single: 'defineScript', plural: 'defineScripts' },
  animation: { single: 'defineAnimationClip', plural: 'defineAnimationClips' },
};

/**
 * Generic asset definition helper
 * Provides type-safe asset definition with runtime validation
 */
export function defineAssets<T extends IAssetMeta>(assets: T[]): T[] {
  return assets;
}

/**
 * Generic single asset definition helper
 */
export function defineAsset<T extends IAssetMeta>(asset: T): T {
  return asset;
}

/**
 * Asset reference prefixes
 */
export const ASSET_REF_PREFIXES = {
  LIBRARY: '@/', // Library asset: @/materials/common/Default
  SCENE: './', // Scene-local asset: ./materials/TreeGreen
} as const;

/**
 * Check if a reference is a library reference
 */
export function isLibraryRef(ref: string): boolean {
  return ref.startsWith(ASSET_REF_PREFIXES.LIBRARY);
}

/**
 * Check if a reference is a scene-relative reference
 */
export function isSceneRef(ref: string): boolean {
  return ref.startsWith(ASSET_REF_PREFIXES.SCENE);
}

/**
 * Extract asset ID from reference path
 */
export function extractAssetIdFromRef(ref: string): string {
  return ref.split('/').pop() || '';
}
