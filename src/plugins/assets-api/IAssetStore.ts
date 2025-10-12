import type { AssetType } from '../../core/lib/serialization/assets/AssetTypes';

/**
 * Asset file metadata
 */
export interface IAssetFileMeta {
  filename: string;
  path: string;
  size: number;
  type: AssetType;
}

/**
 * Save asset request
 */
export interface ISaveAssetRequest {
  path: string; // e.g., '@/materials/common/Stone' or './materials/TreeGreen'
  payload: unknown; // Asset data
  type: AssetType;
}

/**
 * Save asset result
 */
export interface ISaveAssetResult {
  filename: string;
  path: string;
  size: number;
}

/**
 * Load asset request
 */
export interface ILoadAssetRequest {
  path: string; // e.g., '@/materials/common/Stone'
  type: AssetType;
}

/**
 * Load asset result
 */
export interface ILoadAssetResult {
  filename: string;
  payload: unknown; // Asset data
}

/**
 * List assets request
 */
export interface IListAssetsRequest {
  type: AssetType;
  scope?: 'library' | 'scene'; // Filter by scope
  sceneName?: string; // Required if scope is 'scene'
}

/**
 * Generic asset store interface
 * Similar to ISceneStore but for individual assets
 */
export interface IAssetStore {
  /**
   * Save an asset to the filesystem
   */
  save(request: ISaveAssetRequest): Promise<ISaveAssetResult>;

  /**
   * Load an asset from the filesystem
   */
  load(request: ILoadAssetRequest): Promise<ILoadAssetResult>;

  /**
   * List all assets of a specific type
   */
  list(request: IListAssetsRequest): Promise<IAssetFileMeta[]>;

  /**
   * Delete an asset
   */
  delete(request: { path: string; type: AssetType }): Promise<void>;
}
