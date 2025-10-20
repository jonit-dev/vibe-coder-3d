import { GeometryMetaSchema, type IGeometryMeta } from './IGeometryMeta';

/**
 * Normalise geometry asset paths to ensure a leading slash and consistent casing.
 */
function normalizeGeometryAssetPath(path: string): string {
  if (!path) {
    return path;
  }

  const trimmed = path.trim();
  return trimmed.startsWith('/') ? trimmed : `/${trimmed.replace(/^\.?\/*/, '')}`;
}

/**
 * Vite glob import pulling in all geometry metadata JSON files under src/game/geometry.
 * Files are eagerly loaded so we can expose summaries synchronously without additional fetches.
 */
const geometryAssetModules = import.meta.glob('/src/game/geometry/**/*.shape.json', {
  eager: true,
});

export interface GeometryAssetSummary {
  path: string;
  name: string;
  tags: string[];
  category?: string;
  meta: IGeometryMeta;
  vertexCount: number;
  hasNormals: boolean;
  hasUVs: boolean;
  hasTangents: boolean;
}

const geometryAssetSummaries: GeometryAssetSummary[] = [];
const geometryAssetMap = new Map<string, GeometryAssetSummary>();

Object.entries(geometryAssetModules).forEach(([rawPath, module]) => {
  try {
    const normalizedPath = normalizeGeometryAssetPath(rawPath);
    // When importing JSON through Vite the module is already parsed, but we handle both cases.
    const metaCandidate = (module as { default?: unknown }).default ?? module;
    const meta = GeometryMetaSchema.parse(metaCandidate);

    const vertexCount =
      (meta.attributes.position?.array?.length ?? 0) /
      (meta.attributes.position?.itemSize ?? 1);

    const summary: GeometryAssetSummary = {
      path: normalizedPath,
      name: meta.meta.name ?? normalizedPath.split('/').pop()?.replace('.shape.json', '') ?? 'Geometry Asset',
      tags: meta.meta.tags ?? [],
      category: meta.meta.category,
      meta,
      vertexCount,
      hasNormals: Boolean(meta.attributes.normal),
      hasUVs: Boolean(meta.attributes.uv),
      hasTangents: Boolean(meta.attributes.tangent),
    };

    geometryAssetSummaries.push(summary);
    geometryAssetMap.set(normalizedPath, summary);

    // Also index the path without the leading slash for resilience when data was persisted that way.
    const withoutLeadingSlash = normalizedPath.startsWith('/')
      ? normalizedPath.slice(1)
      : normalizedPath;
    geometryAssetMap.set(withoutLeadingSlash, summary);
  } catch (error) {
    console.error(`[geometryAssetCatalog] Failed to parse geometry asset at ${rawPath}`, error);
  }
});

geometryAssetSummaries.sort((a, b) => a.name.localeCompare(b.name));

export function listGeometryAssets(): GeometryAssetSummary[] {
  return geometryAssetSummaries;
}

export function getGeometryAssetByPath(path: string | undefined | null): GeometryAssetSummary | undefined {
  if (!path) return undefined;
  return geometryAssetMap.get(normalizeGeometryAssetPath(path)) ?? geometryAssetMap.get(path);
}

export function hasGeometryAssets(): boolean {
  return geometryAssetSummaries.length > 0;
}
