import { useMemo } from 'react';

import {
  getGeometryAssetByPath,
  hasGeometryAssets,
  listGeometryAssets,
  type IGeometryAssetSummary,
} from '@/core/lib/geometry/metadata/geometryAssetCatalog';

export interface IGeometryAssetOption extends IGeometryAssetSummary {
  /**
   * Public URL that can be used with fetch/import for runtime loading.
   * For editor previews we rely on the in-memory meta instead.
   */
  url: string;
}

/**
 * Vite exposes JSON files as modules; we generate a deterministic URL using the module path.
 * When served by Vite the URL is the same as the path (prefixed with /).
 */
function toPublicUrl(path: string): string {
  return path;
}

export function useGeometryAssets(): IGeometryAssetOption[] {
  return useMemo(() => {
    return listGeometryAssets().map((asset) => ({
      ...asset,
      url: toPublicUrl(asset.path),
    }));
  }, []);
}

export function useGeometryAsset(
  path: string | undefined | null,
): IGeometryAssetOption | undefined {
  return useMemo(() => {
    console.log('[useGeometryAsset] Looking up geometry asset for path:', path);
    const found = getGeometryAssetByPath(path);

    if (!found) {
      console.warn('[useGeometryAsset] Geometry asset NOT FOUND for path:', path);
    } else {
      console.log(
        '[useGeometryAsset] Found geometry asset:',
        found.name,
        'vertices:',
        found.vertexCount,
      );
    }

    return found
      ? {
          ...found,
          url: toPublicUrl(found.path),
        }
      : undefined;
  }, [path]);
}

export function useHasGeometryAssets(): boolean {
  return useMemo(() => hasGeometryAssets(), []);
}
