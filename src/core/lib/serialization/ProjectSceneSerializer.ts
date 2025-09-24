/**
 * Project-aware Scene Serializer
 * Handles saving/loading scenes to/from the project's scene directory
 */

// import { getCurrentProjectConfig } from '../extension/GameExtensionPoints'; // Will be used in future implementation
import { serializeWorld, deserializeIntoWorld, SerializedScene } from './SceneSerializer';

export class ProjectSceneSerializer {
  private static instance: ProjectSceneSerializer;

  private constructor() {}

  public static getInstance(): ProjectSceneSerializer {
    if (!ProjectSceneSerializer.instance) {
      ProjectSceneSerializer.instance = new ProjectSceneSerializer();
    }
    return ProjectSceneSerializer.instance;
  }

  /**
   * Gets the project's scene directory path
   */
  public getSceneDirectoryPath(): string {
    // For now, assume scenes are always in src/game/scenes/
    // In the future, this could be configurable via project config
    return 'src/game/scenes';
  }

  /**
   * Generates a scene file path for a given scene ID
   */
  public getSceneFilePath(sceneId: string): string {
    const scenesDir = this.getSceneDirectoryPath();
    const filename = sceneId.replace(/[^a-zA-Z0-9.-]/g, '_'); // Sanitize filename
    return `${scenesDir}/${filename}.json`;
  }

  /**
   * Serializes the current world and returns the scene data
   * This can be used by the editor to save scenes to the project directory
   */
  public serializeCurrentScene(sceneId: string, description?: string): SerializedScene {
    const sceneData = serializeWorld();

    // Add project-specific metadata
    sceneData.metadata = {
      ...sceneData.metadata,
      timestamp: new Date().toISOString(),
      description: description || `Scene: ${sceneId}`,
    };

    // Store additional project metadata separately if needed (for future use)
    // const projectMetadata = { sceneId, projectName: 'Unknown Project' };

    return sceneData;
  }

  /**
   * Deserializes scene data into the current world
   */
  public async deserializeScene(sceneData: SerializedScene): Promise<void> {
    deserializeIntoWorld(sceneData);
  }

  /**
   * Validates that a scene file path is within the project's scene directory
   */
  public isValidSceneFile(filePath: string): boolean {
    const scenesDir = this.getSceneDirectoryPath();
    const normalizedPath = filePath.replace(/\\/g, '/'); // Normalize path separators

    return (
      normalizedPath.startsWith(scenesDir) &&
      (normalizedPath.endsWith('.json') || normalizedPath.endsWith('.ts'))
    );
  }

  /**
   * Gets the scene ID from a file path
   */
  public getSceneIdFromPath(filePath: string): string {
    const filename = filePath.split('/').pop() || '';
    return filename.replace(/\.(json|ts)$/, '');
  }

  /**
   * Validates scene data format
   */
  public async validateSceneData(data: unknown): Promise<boolean> {
    try {
      // Use the schema from SceneSerializer to validate
      // This import is done dynamically to avoid circular dependencies
      const { SerializedSceneSchema } = await import('./SceneSerializer');
      SerializedSceneSchema.parse(data);
      return true;
    } catch (error) {
      console.error('[ProjectSceneSerializer] Invalid scene data:', error);
      return false;
    }
  }
}
