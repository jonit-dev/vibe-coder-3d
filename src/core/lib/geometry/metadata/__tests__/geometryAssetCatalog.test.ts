import { describe, it, expect } from 'vitest';

import {
  getGeometryAssetByPath,
  listGeometryAssets,
} from '../geometryAssetCatalog';

describe('geometryAssetCatalog', () => {
  it('lists available geometry assets', () => {
    const assets = listGeometryAssets();
    expect(assets.length).toBeGreaterThan(0);
    const example = assets.find((asset) =>
      asset.path.endsWith('example_box.shape.json'),
    );
    expect(example).toBeDefined();
    expect(example?.vertexCount).toBeGreaterThan(0);
  });

  it('retrieves geometry asset by path', () => {
    const asset = getGeometryAssetByPath('/src/game/geometry/example_box.shape.json');
    expect(asset).toBeDefined();
    expect(asset?.meta.meta.name).toBe('Example Box');
  });
});
