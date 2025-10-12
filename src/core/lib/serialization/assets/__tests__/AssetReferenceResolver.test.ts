import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AssetReferenceResolver } from '../AssetReferenceResolver';
import type { IAssetRefResolutionContext } from '../AssetReferenceResolver';
import * as fs from 'fs/promises';
import * as path from 'path';

// Mock fs module
vi.mock('fs/promises');

describe('AssetReferenceResolver', () => {
  let resolver: AssetReferenceResolver;
  let context: IAssetRefResolutionContext;

  beforeEach(() => {
    resolver = new AssetReferenceResolver();
    context = {
      sceneFolder: 'src/game/scenes/Forest',
      assetLibraryRoot: 'src/game/assets',
      format: 'multi-file',
    };
    vi.clearAllMocks();
  });

  afterEach(() => {
    resolver.clearCache();
  });

  describe('resolvePath', () => {
    it('should resolve shared library reference (@/)', () => {
      const ref = '@/materials/common/Stone';
      const resolved = resolver.resolvePath(ref, context, 'material');

      expect(resolved).toBe('src/game/assets/materials/common/Stone.material.tsx');
    });

    it('should resolve scene-relative reference (./)', () => {
      const ref = './materials/TreeGreen';
      const resolved = resolver.resolvePath(ref, context, 'material');

      expect(resolved).toBe('src/game/scenes/Forest/Forest.materials.tsx');
    });

    it('should handle prefab asset type', () => {
      const ref = '@/prefabs/props/Tree';
      const resolved = resolver.resolvePath(ref, context, 'prefab');

      expect(resolved).toBe('src/game/assets/prefabs/props/Tree.prefab.tsx');
    });

    it('should handle input asset type', () => {
      const ref = '@/inputs/DefaultControls';
      const resolved = resolver.resolvePath(ref, context, 'input');

      expect(resolved).toBe('src/game/assets/inputs/DefaultControls.input.tsx');
    });

    it('should throw error for invalid reference', () => {
      const ref = 'invalid/reference';

      expect(() => {
        resolver.resolvePath(ref, context, 'material');
      }).toThrow('Invalid asset reference');
    });
  });

  describe('resolve', () => {
    it('should resolve material from scene-relative file', async () => {
      const mockFileContent = `import { defineMaterials } from '@core/lib/serialization/assets/defineMaterials';

export default defineMaterials([
  {
    "id": "TreeGreen",
    "name": "Tree Green",
    "color": "#2d5016",
    "roughness": 0.9
  }
]);`;

      vi.mocked(fs.readFile).mockResolvedValue(mockFileContent);

      const ref = './materials/TreeGreen';
      const material = await resolver.resolve(ref, context, 'material');

      expect(material).toEqual({
        id: 'TreeGreen',
        name: 'Tree Green',
        color: '#2d5016',
        roughness: 0.9,
      });
    });

    it('should resolve material from shared library', async () => {
      const mockFileContent = `import { defineMaterial } from '@core/lib/serialization/assets/defineMaterial';

export default defineMaterial({
  "id": "Stone",
  "name": "Generic Stone",
  "color": "#7a7a7a",
  "roughness": 0.85
});`;

      vi.mocked(fs.readFile).mockResolvedValue(mockFileContent);

      const ref = '@/materials/common/Stone';
      const material = await resolver.resolve(ref, context, 'material');

      expect(material).toEqual({
        id: 'Stone',
        name: 'Generic Stone',
        color: '#7a7a7a',
        roughness: 0.85,
      });
    });

    it('should cache resolved assets', async () => {
      const mockFileContent = `import { defineMaterial } from '@core/lib/serialization/assets/defineMaterial';

export default defineMaterial({
  "id": "Stone",
  "name": "Generic Stone"
});`;

      vi.mocked(fs.readFile).mockResolvedValue(mockFileContent);

      const ref = '@/materials/common/Stone';

      // First call
      await resolver.resolve(ref, context, 'material');
      expect(fs.readFile).toHaveBeenCalledTimes(1);

      // Second call should use cache
      await resolver.resolve(ref, context, 'material');
      expect(fs.readFile).toHaveBeenCalledTimes(1); // Not called again

      const stats = resolver.getCacheStats();
      expect(stats.size).toBe(1);
    });

    it('should return single asset even if ID doesnt match', async () => {
      // With single-asset files, the asset is returned regardless of reference ID
      const mockFileContent = `import { defineMaterials } from '@core/lib/serialization/assets/defineMaterials';

export default defineMaterials([
  {
    "id": "DifferentMaterial",
    "name": "Different Material"
  }
]);`;

      vi.mocked(fs.readFile).mockResolvedValue(mockFileContent);

      const ref = './materials/TreeGreen';

      const material = await resolver.resolve<any>(ref, context, 'material');

      // Returns the single asset in the file
      expect(material.id).toBe('DifferentMaterial');
      expect(material.name).toBe('Different Material');
    });

    it('should throw error if file not found', async () => {
      const error = new Error('ENOENT: no such file or directory');
      (error as NodeJS.ErrnoException).code = 'ENOENT';
      vi.mocked(fs.readFile).mockRejectedValue(error);

      const ref = '@/materials/common/Missing';

      await expect(resolver.resolve(ref, context, 'material')).rejects.toThrow(
        'Asset file not found',
      );
    });

    it('should handle materials with comments', async () => {
      const mockFileContent = `import { defineMaterials } from '@core/lib/serialization/assets/defineMaterials';

// This is a material file
export default defineMaterials([
  {
    "id": "TreeGreen",
    "name": "Tree Green", // Material name
    "color": "#2d5016" /* Green color */
  }
]);`;

      vi.mocked(fs.readFile).mockResolvedValue(mockFileContent);

      const ref = './materials/TreeGreen';
      const material = await resolver.resolve(ref, context, 'material');

      expect(material).toEqual({
        id: 'TreeGreen',
        name: 'Tree Green',
        color: '#2d5016',
      });
    });
  });

  describe('clearCache', () => {
    it('should clear cached assets', async () => {
      const mockFileContent = `import { defineMaterial } from '@core/lib/serialization/assets/defineMaterial';

export default defineMaterial({
  "id": "Stone",
  "name": "Generic Stone"
});`;

      vi.mocked(fs.readFile).mockResolvedValue(mockFileContent);

      const ref = '@/materials/common/Stone';

      // Populate cache
      await resolver.resolve(ref, context, 'material');
      expect(resolver.getCacheStats().size).toBe(1);

      // Clear cache
      resolver.clearCache();
      expect(resolver.getCacheStats().size).toBe(0);

      // Next resolve should hit file system again
      await resolver.resolve(ref, context, 'material');
      expect(fs.readFile).toHaveBeenCalledTimes(2);
    });
  });

  describe('getCacheStats', () => {
    it('should return cache statistics', async () => {
      const mockFileContent = `import { defineMaterial } from '@core/lib/serialization/assets/defineMaterial';

export default defineMaterial({
  "id": "Stone",
  "name": "Generic Stone"
});`;

      vi.mocked(fs.readFile).mockResolvedValue(mockFileContent);

      const stats1 = resolver.getCacheStats();
      expect(stats1.size).toBe(0);
      expect(stats1.keys).toEqual([]);

      // Add to cache
      await resolver.resolve('@/materials/common/Stone', context, 'material');

      const stats2 = resolver.getCacheStats();
      expect(stats2.size).toBe(1);
      expect(stats2.keys).toContain('src/game/scenes/Forest:@/materials/common/Stone');
    });
  });
});
