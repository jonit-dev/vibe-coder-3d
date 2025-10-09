/**
 * Arguments for save operation
 */
export interface ISaveArgs {
  name: string;
  payload: unknown;
}

/**
 * Arguments for load operation
 */
export interface ILoadArgs {
  name: string;
}

/**
 * Arguments for list operation
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface IListArgs {}

/**
 * Result of save operation
 */
export interface ISaveResult {
  filename: string;
  modified: string;
  size: number;
  extra?: Record<string, unknown>;
}

/**
 * Result of load operation
 */
export interface ILoadResult {
  filename: string;
  data: unknown;
  modified?: string;
  extra?: Record<string, unknown>;
}

/**
 * Scene file information in list
 */
export interface ISceneListItem {
  name: string;
  filename: string;
  modified: string;
  size: number;
  type: string;
}

/**
 * Interface for scene format handlers
 * Each format (JSON, TSX, stream) implements this interface
 */
export interface ISceneFormatHandler {
  /**
   * The format identifier
   */
  readonly format: 'json' | 'tsx' | 'stream';

  /**
   * The content type for HTTP responses
   */
  readonly contentType: string;

  /**
   * Save a scene in this format
   * @param args - Save arguments
   * @returns Save result with file metadata
   */
  save(args: ISaveArgs): Promise<ISaveResult>;

  /**
   * Load a scene in this format
   * @param args - Load arguments
   * @returns Load result with scene data
   */
  load(args: ILoadArgs): Promise<ILoadResult>;

  /**
   * List all scenes in this format
   * @param args - List arguments (optional)
   * @returns Array of scene file information
   */
  list(args?: IListArgs): Promise<ISceneListItem[]>;
}
