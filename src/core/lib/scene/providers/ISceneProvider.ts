/**
 * ISceneProvider - Interface for scene providers
 * Enables loading scenes from different sources (code, files, remote)
 */

import type { SceneDescriptor } from '../SceneStore';
import type { SerializedScene } from '../serialization/SceneSchema';

export interface ISceneLoadOptions {
  /** Whether to clear existing entities before loading */
  clearExisting?: boolean;
  /** Whether to load additively (merge with existing scene) */
  additive?: boolean;
  /** Validation options */
  validate?: boolean;
}

export interface ISceneLoadResult {
  success: boolean;
  persistentIdMap?: Map<string, number>; // PersistentId -> EntityId
  entitiesCreated?: number;
  entitiesUpdated?: number;
  errors?: string[];
  warnings?: string[];
}

/**
 * Base interface for scene providers
 */
export interface ISceneProvider {
  /** Unique identifier for this provider */
  readonly id: string;

  /** Human-readable name for this provider */
  readonly name: string;

  /** Whether this provider supports reading scenes */
  readonly canRead: boolean;

  /** Whether this provider supports writing scenes */
  readonly canWrite: boolean;

  /**
   * List all scenes available from this provider
   */
  list(): Promise<SceneDescriptor[]>;

  /**
   * Get metadata for a specific scene
   * @param id Scene ID
   */
  get(id: string): Promise<SceneDescriptor | undefined>;

  /**
   * Load a scene into the world
   * @param id Scene ID
   * @param options Load options
   */
  load(id: string, options?: ISceneLoadOptions): Promise<ISceneLoadResult>;

  /**
   * Save a scene (if provider supports writing)
   * @param scene Scene data
   * @param id Scene ID
   * @param metadata Optional metadata
   */
  save?(scene: SerializedScene, id: string, metadata?: Partial<SceneDescriptor>): Promise<boolean>;

  /**
   * Delete a scene (if provider supports writing)
   * @param id Scene ID
   */
  delete?(id: string): Promise<boolean>;

  /**
   * Check if a scene exists
   * @param id Scene ID
   */
  exists(id: string): Promise<boolean>;

  /**
   * Get the raw scene data without loading into world
   * @param id Scene ID
   */
  getSceneData(id: string): Promise<SerializedScene | undefined>;

  /**
   * Initialize the provider (if needed)
   */
  initialize?(): Promise<void>;

  /**
   * Cleanup provider resources
   */
  dispose?(): Promise<void>;
}