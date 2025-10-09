import type { ISceneStore } from '../../../core/lib/serialization/common/ISceneStore';
import { validateSceneData } from '../../../core/lib/serialization/common/SceneValidation';
import type {
  ISceneFormatHandler,
  ISaveArgs,
  ILoadArgs,
  ISaveResult,
  ILoadResult,
  ISceneListItem,
} from '../ISceneFormatHandler';

/**
 * Stream format handler for scene persistence
 * Handles streaming scene format (for large scenes with progressive loading)
 */
export class StreamFormatHandler implements ISceneFormatHandler {
  readonly format = 'stream' as const;
  readonly contentType = 'application/json';

  constructor(private readonly store: ISceneStore) {}

  /**
   * Save scene in streaming format
   */
  async save(args: ISaveArgs): Promise<ISaveResult> {
    const { name, payload } = args;

    // Validate scene data (streaming scenes still use the same schema)
    const validation = validateSceneData(payload);
    if (!validation.isValid) {
      throw new Error(`Invalid scene data: ${validation.error}`);
    }

    // Sanitize filename
    const filename = this.store.sanitizeFilename(name, '.json');

    // Serialize to JSON with formatting
    const content = JSON.stringify(payload, null, 2);

    // Write to store
    const { modified, size } = await this.store.write(filename, content);

    return {
      filename,
      modified,
      size,
    };
  }

  /**
   * Load scene from streaming format
   */
  async load(args: ILoadArgs): Promise<ILoadResult> {
    const { name } = args;

    // Ensure .json extension
    const filename = name.endsWith('.json') ? name : `${name}.json`;

    // Read from store
    const { content, modified } = await this.store.read(filename);

    // Parse JSON
    const data = JSON.parse(content);

    // Validate scene data
    const validation = validateSceneData(data);
    if (!validation.isValid) {
      throw new Error(`Invalid scene file: ${validation.error}`);
    }

    return {
      filename,
      data,
      modified,
    };
  }

  /**
   * List all streaming scene files
   */
  async list(): Promise<ISceneListItem[]> {
    const items = await this.store.list();

    return items
      .filter((f) => f.name.endsWith('.json'))
      .map((i) => ({
        name: i.name,
        filename: i.name,
        modified: i.modified,
        size: i.size,
        type: 'stream',
      }));
  }
}
