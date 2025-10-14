import type { IMaterialDefinition } from '../../materials/Material.types';
import type { IPrefabDefinition } from '../../prefabs/Prefab.types';
import type { IInputActionsAsset } from '../input/inputTypes';
import { Logger } from '../logger';

const logger = Logger.create('RustSceneExporter');

interface IRustSceneData {
  entities: unknown[];
  materials?: IMaterialDefinition[];
  prefabs?: IPrefabDefinition[];
  inputAssets?: IInputActionsAsset[];
  lockedEntityIds?: number[];
}

interface IRustSceneMetadata {
  name: string;
  version: number;
  timestamp: string;
  description?: string;
  author?: string;
}

/**
 * Export scene data to Rust game folder for engine consumption
 * Creates uncompressed JSON files in rust/game/scenes/
 *
 * Note: This only works in Node.js environment (server-side)
 */
export class RustSceneExporter {
  private readonly baseDir: string;

  constructor(baseDir: string = 'rust/game/scenes') {
    this.baseDir = baseDir;
  }

  /**
   * Export scene to Rust folder
   * Only works in Node.js environment (server-side)
   */
  async export(
    name: string,
    sceneData: IRustSceneData,
    metadata: IRustSceneMetadata,
  ): Promise<void> {
    // Skip if not in Node.js environment
    if (typeof process === 'undefined' || typeof process.cwd !== 'function') {
      logger.debug('Skipping Rust export in browser environment');
      return;
    }

    try {
      // Dynamic import for Node.js-only modules
      const fs = await import('fs');
      const path = await import('path');

      // Resolve directory path
      const rustSceneDir = path.join(process.cwd(), this.baseDir);

      // Ensure directory exists
      await fs.promises.mkdir(rustSceneDir, { recursive: true });

      // Build full scene data (no compression)
      const fullSceneData = {
        metadata,
        entities: sceneData.entities,
        materials: sceneData.materials || [],
        prefabs: sceneData.prefabs || [],
        inputAssets: sceneData.inputAssets || [],
        lockedEntityIds: sceneData.lockedEntityIds || [],
      };

      const filename = `${name}.json`;
      const filepath = path.join(rustSceneDir, filename);

      await fs.promises.writeFile(filepath, JSON.stringify(fullSceneData, null, 2), 'utf-8');

      logger.debug('Exported scene to Rust', { name, filepath });
    } catch (error) {
      logger.warn('Failed to export scene to Rust', { name, error });
      // Don't throw - this is a best-effort operation
    }
  }
}
