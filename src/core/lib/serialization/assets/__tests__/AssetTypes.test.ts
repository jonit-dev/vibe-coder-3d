import { describe, it, expect } from 'vitest';
import {
  AssetType,
  ASSET_EXTENSIONS,
  ASSET_DEFINE_FUNCTIONS,
  defineAssets,
  defineAsset,
  isLibraryRef,
  isSceneRef,
  extractAssetIdFromRef,
} from '../AssetTypes';

describe('AssetTypes', () => {
  describe('ASSET_EXTENSIONS', () => {
    it('should have correct extensions for all asset types', () => {
      expect(ASSET_EXTENSIONS.material).toBe('.material.tsx');
      expect(ASSET_EXTENSIONS.prefab).toBe('.prefab.tsx');
      expect(ASSET_EXTENSIONS.input).toBe('.input.tsx');
      expect(ASSET_EXTENSIONS.script).toBe('.script.tsx');
    });
  });

  describe('ASSET_DEFINE_FUNCTIONS', () => {
    it('should have correct function names for all asset types', () => {
      expect(ASSET_DEFINE_FUNCTIONS.material.single).toBe('defineMaterial');
      expect(ASSET_DEFINE_FUNCTIONS.material.plural).toBe('defineMaterials');
      expect(ASSET_DEFINE_FUNCTIONS.prefab.single).toBe('definePrefab');
      expect(ASSET_DEFINE_FUNCTIONS.prefab.plural).toBe('definePrefabs');
      expect(ASSET_DEFINE_FUNCTIONS.input.single).toBe('defineInputAsset');
      expect(ASSET_DEFINE_FUNCTIONS.input.plural).toBe('defineInputAssets');
      expect(ASSET_DEFINE_FUNCTIONS.script.single).toBe('defineScript');
      expect(ASSET_DEFINE_FUNCTIONS.script.plural).toBe('defineScripts');
    });
  });

  describe('defineAsset / defineAssets', () => {
    it('should return asset unchanged', () => {
      const asset = { id: 'test', name: 'Test Asset' };
      expect(defineAsset(asset)).toEqual(asset);
    });

    it('should return assets array unchanged', () => {
      const assets = [
        { id: 'test1', name: 'Test Asset 1' },
        { id: 'test2', name: 'Test Asset 2' },
      ];
      expect(defineAssets(assets)).toEqual(assets);
    });
  });

  describe('isLibraryRef', () => {
    it('should return true for library references', () => {
      expect(isLibraryRef('@/materials/common/Default')).toBe(true);
      expect(isLibraryRef('@/prefabs/Player')).toBe(true);
    });

    it('should return false for scene-relative references', () => {
      expect(isLibraryRef('./materials/TreeGreen')).toBe(false);
      expect(isLibraryRef('./prefabs/Tree')).toBe(false);
    });
  });

  describe('isSceneRef', () => {
    it('should return true for scene-relative references', () => {
      expect(isSceneRef('./materials/TreeGreen')).toBe(true);
      expect(isSceneRef('./prefabs/Tree')).toBe(true);
    });

    it('should return false for library references', () => {
      expect(isSceneRef('@/materials/common/Default')).toBe(false);
      expect(isSceneRef('@/prefabs/Player')).toBe(false);
    });
  });

  describe('extractAssetIdFromRef', () => {
    it('should extract asset ID from library reference', () => {
      expect(extractAssetIdFromRef('@/materials/common/Default')).toBe('Default');
      expect(extractAssetIdFromRef('@/prefabs/Player')).toBe('Player');
    });

    it('should extract asset ID from scene-relative reference', () => {
      expect(extractAssetIdFromRef('./materials/TreeGreen')).toBe('TreeGreen');
      expect(extractAssetIdFromRef('./prefabs/Tree')).toBe('Tree');
    });

    it('should handle single-segment paths', () => {
      expect(extractAssetIdFromRef('Default')).toBe('Default');
    });
  });
});
