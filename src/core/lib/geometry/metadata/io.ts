import { type IGeometryMeta, GeometryMetaSchema } from './IGeometryMeta';
import { Logger } from '@core/lib/logger';

const logger = Logger.create('GeometryMetaIO');

/**
 * Load geometry metadata from a JSON file or URL
 */
export async function loadGeometryMeta(pathOrUrl: string): Promise<IGeometryMeta> {
  try {
    const response = await fetch(pathOrUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch geometry metadata: ${response.statusText}`);
    }
    const json = await response.json();
    const meta = GeometryMetaSchema.parse(json);
    logger.debug('Loaded geometry metadata', { path: pathOrUrl, name: meta.meta.name });
    return meta;
  } catch (error) {
    logger.error('Failed to load geometry metadata', { path: pathOrUrl, error });
    throw error;
  }
}

/**
 * Save geometry metadata to a JSON string
 */
export function saveGeometryMetaToJSON(meta: IGeometryMeta, pretty = true): string {
  const validated = GeometryMetaSchema.parse(meta);
  return JSON.stringify(validated, null, pretty ? 2 : undefined);
}

/**
 * Download geometry metadata as a .shape.json file
 */
export function downloadGeometryMeta(meta: IGeometryMeta, filename: string): void {
  const json = saveGeometryMetaToJSON(meta, true);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.shape.json') ? filename : `${filename}.shape.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  logger.info('Downloaded geometry metadata', { filename: a.download });
}
