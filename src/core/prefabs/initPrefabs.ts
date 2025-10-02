import type { IPrefabDefinition } from './Prefab.types';
import { Logger } from '@/core/lib/logger';

const logger = Logger.create('PrefabInit');

/**
 * Initialize prefabs from JSON files
 */
export async function initPrefabs(): Promise<void> {
  // No built-in prefabs to load - prefabs are loaded from scene files
  logger.info('Prefabs initialized', { loaded: 0, errors: 0 });
}

/**
 * Load a prefab from a file path
 */
export async function loadPrefabFromFile(path: string): Promise<IPrefabDefinition | null> {
  try {
    const response = await fetch(path);

    if (!response.ok) {
      logger.error(`Failed to load prefab from ${path}: ${response.statusText}`);
      return null;
    }

    const prefabData = (await response.json()) as IPrefabDefinition;
    return prefabData;
  } catch (error) {
    logger.error(`Failed to load prefab from ${path}:`, error);
    return null;
  }
}

/**
 * Save a prefab to a file (browser environment - triggers download)
 */
export function downloadPrefab(prefab: IPrefabDefinition): void {
  const json = JSON.stringify(prefab, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `${prefab.id}.prefab.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  logger.info('Prefab downloaded', { prefabId: prefab.id });
}
