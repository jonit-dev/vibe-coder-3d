import { PrefabRegistry } from './PrefabRegistry';
import type { IPrefabDefinition } from './Prefab.types';
import { Logger } from '@/core/lib/logger';

const logger = Logger.create('PrefabInit');

/**
 * Initialize prefabs from JSON files
 */
export async function initPrefabs(): Promise<void> {
  const registry = PrefabRegistry.getInstance();

  // List of built-in prefabs to load
  const builtInPrefabs = ['example-cube', 'player'];

  let loadedCount = 0;
  let errorCount = 0;

  for (const prefabId of builtInPrefabs) {
    try {
      const response = await fetch(`/assets/prefabs/${prefabId}.prefab.json`);

      if (!response.ok) {
        logger.warn(`Prefab file not found: ${prefabId}`);
        errorCount++;
        continue;
      }

      const prefabData = (await response.json()) as IPrefabDefinition;
      registry.upsert(prefabData);
      loadedCount++;

      logger.debug(`Loaded prefab: ${prefabId}`);
    } catch (error) {
      logger.error(`Failed to load prefab ${prefabId}:`, error);
      errorCount++;
    }
  }

  logger.info('Prefabs initialized', { loaded: loadedCount, errors: errorCount });
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
