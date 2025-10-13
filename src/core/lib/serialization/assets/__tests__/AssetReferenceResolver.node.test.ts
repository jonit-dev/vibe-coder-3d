import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import { AssetReferenceResolver } from '../AssetReferenceResolver';
import type { IAssetRefResolutionContext } from '../AssetReferenceResolver';

describe('AssetReferenceResolver (Node)', () => {
  const testDir = path.join(process.cwd(), 'test-assets-temp');
  const sceneDir = path.join(testDir, 'scenes', 'TestScene');
  const libraryDir = path.join(testDir, 'assets');

  const context: IAssetRefResolutionContext = {
    sceneFolder: sceneDir,
    assetLibraryRoot: libraryDir,
    format: 'multi-file',
  };

  beforeEach(async () => {
    // Create test directory structure
    await fs.mkdir(path.join(libraryDir, 'materials', 'common'), { recursive: true });
    await fs.mkdir(sceneDir, { recursive: true });

    // Create test library material
    // Note: asset ID must match the last part of the reference path
    const libraryMaterial = `import { defineMaterial } from '@core';
export default defineMaterial({
  id: 'LibraryMaterial',
  name: 'Library Material',
  shader: 'standard',
  color: '#ff0000'
});`;
    await fs.writeFile(
      path.join(libraryDir, 'materials', 'common', 'LibraryMaterial.material.tsx'),
      libraryMaterial,
    );

    // Create test scene materials
    const sceneMaterials = `import { defineMaterials } from '@core';
export default defineMaterials([
  {
    id: 'scene-material',
    name: 'Scene Material',
    shader: 'standard',
    color: '#00ff00'
  }
]);`;
    await fs.writeFile(path.join(sceneDir, 'TestScene.materials.tsx'), sceneMaterials);
  });

  afterEach(async () => {
    // Clean up test directory
    await fs.rm(testDir, { recursive: true, force: true });
  });

  describe('resolvePath', () => {
    it('should resolve library reference to correct file path', () => {
      const resolver = new AssetReferenceResolver();
      const ref = '@/materials/common/LibraryMaterial';
      const resolved = resolver.resolvePath(ref, context, 'material');

      expect(resolved).toBe(
        path.join(libraryDir, 'materials', 'common', 'LibraryMaterial.material.tsx'),
      );
    });

    it('should resolve scene-relative reference to correct file path', () => {
      const resolver = new AssetReferenceResolver();
      const ref = './materials/scene-material';
      const resolved = resolver.resolvePath(ref, context, 'material');

      expect(resolved).toBe(path.join(sceneDir, 'TestScene.materials.tsx'));
    });

    it('should throw error for invalid reference format', () => {
      const resolver = new AssetReferenceResolver();
      const ref = 'invalid-ref';

      expect(() => resolver.resolvePath(ref, context, 'material')).toThrow(
        'Invalid asset reference',
      );
    });
  });

  describe('resolve', () => {
    it('should resolve library material reference', async () => {
      const resolver = new AssetReferenceResolver();
      const ref = '@/materials/common/LibraryMaterial';

      const asset = await resolver.resolve<{ id: string; name: string; color: string }>(
        ref,
        context,
        'material',
      );

      expect(asset).toMatchObject({
        id: 'LibraryMaterial',
        name: 'Library Material',
        shader: 'standard',
        color: '#ff0000',
      });
    });

    it('should resolve scene-relative material reference', async () => {
      const resolver = new AssetReferenceResolver();
      const ref = './materials/scene-material';

      const asset = await resolver.resolve<{ id: string; name: string; color: string }>(
        ref,
        context,
        'material',
      );

      expect(asset).toMatchObject({
        id: 'scene-material',
        name: 'Scene Material',
        shader: 'standard',
        color: '#00ff00',
      });
    });

    it('should cache resolved assets', async () => {
      const resolver = new AssetReferenceResolver();
      const ref = '@/materials/common/LibraryMaterial';

      // Resolve once
      await resolver.resolve(ref, context, 'material');

      // Check cache
      const stats = resolver.getCacheStats();
      expect(stats.size).toBeGreaterThan(0);
      expect(stats.keys).toContain(`${sceneDir}:${ref}`);
    });

    it('should return single asset even if ID doesnt match', async () => {
      // With single-asset files, the asset is returned regardless of reference ID
      const resolver = new AssetReferenceResolver();
      const ref = './materials/non-existent';

      const material = await resolver.resolve<any>(ref, context, 'material');

      // It returns the only asset in the file (scene-material)
      expect(material.id).toBe('scene-material');
    });
  });

  describe('clearCache', () => {
    it('should clear resolution cache', async () => {
      const resolver = new AssetReferenceResolver();
      const ref = '@/materials/common/LibraryMaterial';

      // Resolve and cache
      await resolver.resolve(ref, context, 'material');
      expect(resolver.getCacheStats().size).toBeGreaterThan(0);

      // Clear cache
      resolver.clearCache();
      expect(resolver.getCacheStats().size).toBe(0);
    });
  });
});
