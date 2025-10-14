import { promises as fs } from 'fs';
import { join } from 'path';
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
 */
export class RustSceneExporter {
  private readonly rustSceneDir: string;

  constructor(baseDir: string = 'rust/game/scenes') {
    this.rustSceneDir = join(process.cwd(), baseDir);
  }

  /**
   * Export scene to Rust folder
   */
  async export(
    name: string,
    sceneData: IRustSceneData,
    metadata: IRustSceneMetadata,
  ): Promise<void> {
    try {
      // Ensure directory exists
      await fs.mkdir(this.rustSceneDir, { recursive: true });

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
      const filepath = join(this.rustSceneDir, filename);

      await fs.writeFile(filepath, JSON.stringify(fullSceneData, null, 2), 'utf-8');

      logger.debug('Exported scene to Rust', { name, filepath });
    } catch (error) {
      logger.warn('Failed to export scene to Rust', { name, error });
      // Don't throw - this is a best-effort operation
    }
  }
}
