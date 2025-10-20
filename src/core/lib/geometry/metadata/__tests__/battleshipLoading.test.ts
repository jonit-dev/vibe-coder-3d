import { describe, it, expect } from 'vitest';
import {
  listGeometryAssets,
  getGeometryAssetByPath,
  hasGeometryAssets,
} from '../geometryAssetCatalog';

describe('Battleship Geometry Asset Loading', () => {
  it('should have geometry assets loaded', () => {
    const hasAssets = hasGeometryAssets();
    const allAssets = listGeometryAssets();

    console.log(`Total geometry assets loaded: ${allAssets.length}`);
    console.log('Available assets:', allAssets.map((a) => a.path));

    expect(hasAssets).toBe(true);
    expect(allAssets.length).toBeGreaterThan(0);
  });

  it('should find battleship geometry asset by path', () => {
    const battleshipPath = '/src/game/geometry/battleship.shape.json';
    const asset = getGeometryAssetByPath(battleshipPath);

    if (!asset) {
      console.error(`❌ Battleship asset NOT FOUND at path: ${battleshipPath}`);
      console.error('Available assets:', listGeometryAssets().map((a) => a.path));
    } else {
      console.log('✅ Battleship asset found:', {
        name: asset.name,
        path: asset.path,
        vertexCount: asset.vertexCount,
        hasNormals: asset.hasNormals,
        hasUVs: asset.hasUVs,
      });
    }

    expect(asset).toBeDefined();
    expect(asset?.name).toBe('Battleship-Optimized');
    expect(asset?.path).toBe(battleshipPath);
  });

  it('should parse battleship metadata correctly', () => {
    const battleshipPath = '/src/game/geometry/battleship.shape.json';
    const asset = getGeometryAssetByPath(battleshipPath);

    expect(asset).toBeDefined();
    expect(asset!.meta).toBeDefined();
    expect(asset!.meta.attributes.position).toBeDefined();
    expect(asset!.meta.attributes.normal).toBeDefined();
    expect(asset!.meta.index).toBeDefined();

    // Verify vertex data
    expect(asset!.vertexCount).toBeGreaterThan(0);
    expect(asset!.hasNormals).toBe(true);
  });

  it('should handle path normalization', () => {
    // Try different path formats
    const paths = [
      '/src/game/geometry/battleship.shape.json',
      'src/game/geometry/battleship.shape.json',
      '/src/game/geometry/battleship.shape.json',
    ];

    paths.forEach((path) => {
      const asset = getGeometryAssetByPath(path);
      expect(asset).toBeDefined();
      expect(asset?.path).toBe('/src/game/geometry/battleship.shape.json');
    });
  });
});
