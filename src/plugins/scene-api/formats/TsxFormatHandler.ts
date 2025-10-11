import type { ISceneStore } from '../../../core/lib/serialization/common/ISceneStore';
import { sanitizeComponentName } from '../../../core/lib/serialization/common/NameUtils';
import type { IMaterialDefinition } from '../../../core/materials/Material.types';
import type { IPrefabDefinition } from '../../../core/prefabs/Prefab.types';
import type { IInputActionsAsset } from '../../../core/lib/input/inputTypes';
import { getComponentDefaults } from '../../../core/lib/serialization/defaults/index';
import { omitDefaults } from '../../../core/lib/serialization/utils/DefaultOmitter';
import {
  MaterialDeduplicator,
  extractMaterialFromMeshRenderer,
  replaceMaterialWithReference,
} from '../../../core/lib/serialization/utils/MaterialHasher';
import { MultiFileSceneSerializer } from '../../../core/lib/serialization/multi-file/MultiFileSceneSerializer';
import { MultiFileSceneLoader } from '../../../core/lib/serialization/multi-file/MultiFileSceneLoader';
import { SceneFolderManager } from '../../../core/lib/serialization/multi-file/SceneFolderManager';
import type {
  ISceneFormatHandler,
  ISaveArgs,
  ILoadArgs,
  ISaveResult,
  ILoadResult,
  ISceneListItem,
} from '../ISceneFormatHandler';

/**
 * TSX format handler for scene persistence
 * Saves and loads scenes as multi-file folders using defineScene
 */
export class TsxFormatHandler implements ISceneFormatHandler {
  readonly format = 'tsx' as const;
  readonly contentType = 'application/json';

  private readonly multiFileSerializer = new MultiFileSceneSerializer();
  private readonly multiFileLoader = new MultiFileSceneLoader();
  private readonly folderManager = new SceneFolderManager();

  constructor(
    private readonly store: ISceneStore,
    private readonly baseDir: string,
  ) {}

  /**
   * Save scene as multi-file folder
   */
  async save(args: ISaveArgs): Promise<ISaveResult> {
    const { name, payload } = args;

    // Extract scene data from payload
    const sceneData = payload as {
      entities: unknown[];
      materials?: IMaterialDefinition[];
      prefabs?: IPrefabDefinition[];
      inputAssets?: IInputActionsAsset[];
      description?: string;
      author?: string;
    };

    if (!Array.isArray(sceneData.entities)) {
      throw new Error('Entities array is required');
    }

    // Validate entity count
    if (sceneData.entities.length > 10000) {
      throw new Error('Scene too large: maximum 10,000 entities allowed');
    }

    // Create metadata
    const metadata = {
      name,
      version: 1,
      timestamp: new Date().toISOString(),
      description: sceneData.description,
      author: sceneData.author,
    };

    // Apply compression to entities
    const materialDeduplicator = new MaterialDeduplicator();
    const compressedEntities = (sceneData.entities as Array<{ components?: Record<string, unknown> }>).map((entity) => {
      if (!entity.components) return entity;

      const compressedComponents: Record<string, unknown> = {};

      for (const [componentType, componentData] of Object.entries(entity.components)) {
        if (!componentData || typeof componentData !== 'object') {
          compressedComponents[componentType] = componentData;
          continue;
        }

        let processedData = componentData as Record<string, unknown>;

        // Extract and deduplicate materials from MeshRenderer
        if (componentType === 'MeshRenderer') {
          const inlineMaterial = extractMaterialFromMeshRenderer(processedData);
          if (inlineMaterial) {
            const materialId = materialDeduplicator.addMaterial(inlineMaterial);
            processedData = replaceMaterialWithReference(processedData, materialId);
          } else if (!processedData.materialId) {
            // Safety: Ensure MeshRenderer always has materialId
            processedData = {
              ...processedData,
              materialId: 'default',
            };
          }
        }

        // Omit default values
        const defaults = getComponentDefaults(componentType);
        if (defaults) {
          processedData = omitDefaults(processedData, defaults) as Record<string, unknown>;
        }

        compressedComponents[componentType] = processedData;
      }

      return {
        ...entity,
        components: compressedComponents,
      };
    });

    // Get deduplicated materials
    const extractedMaterials = materialDeduplicator.getMaterials();
    const allMaterials = [...extractedMaterials, ...(sceneData.materials || [])];

    // Serialize to multi-file format
    const multiFileData = this.multiFileSerializer.serializeMultiFile(
      compressedEntities as never[],
      metadata,
      allMaterials,
      sceneData.prefabs || [],
      sceneData.inputAssets,
    );

    // Sanitize scene name for folder
    const sceneName = sanitizeComponentName(name);
    const sceneFolderPath = `${this.baseDir}/${sceneName}`;

    // Write all files to folder
    const writeResult = await this.folderManager.writeSceneFiles(
      sceneFolderPath,
      sceneName,
      multiFileData,
    );

    return {
      filename: `${sceneName}/${sceneName}.index.tsx`,
      modified: new Date().toISOString(),
      size: writeResult.totalSize,
      extra: { filesWritten: writeResult.filesWritten },
    };
  }

  /**
   * Load scene from multi-file folder
   */
  async load(args: ILoadArgs): Promise<ILoadResult> {
    const { name } = args;

    // Multi-file scenes are in folders: SceneName/SceneName.index.tsx
    const folderName = name.replace(/\.tsx$/, '');
    const indexFilename = `${folderName}/${folderName}.index.tsx`;

    if (!(await this.store.exists(indexFilename))) {
      throw new Error(`Multi-file scene not found: ${name} (looking for ${indexFilename})`);
    }

    const result = await this.store.read(indexFilename);
    const content = result.content;

    // Extract scene data from TSX file
    const data = this.extractDefineSceneData(content);

    // Use MultiFileSceneLoader to resolve material references
    const sceneFolderPath = `${this.baseDir}/${folderName}`;
    const resolvedData = await this.multiFileLoader.loadMultiFile(
      data as any,
      sceneFolderPath,
      this.baseDir,
    );

    // Normalize loaded data: convert inline materials to materialId references
    const normalizedData = this.normalizeSceneData({
      ...data,
      entities: resolvedData.entities,
    });

    return {
      filename: indexFilename,
      data: normalizedData,
    };
  }

  /**
   * Normalize scene data on load
   * Converts inline materials to materialId references for backward compatibility
   */
  private normalizeSceneData(sceneData: any): any {
    const materialDeduplicator = new MaterialDeduplicator();

    // Process entities to extract inline materials
    const normalizedEntities = (sceneData.entities || []).map((entity: any) => {
      if (!entity.components) return entity;

      const normalizedComponents: Record<string, unknown> = {};

      for (const [componentType, componentData] of Object.entries(entity.components)) {
        if (!componentData || typeof componentData !== 'object') {
          normalizedComponents[componentType] = componentData;
          continue;
        }

        let processedData = componentData as Record<string, unknown>;

        // Extract and deduplicate materials from MeshRenderer
        if (componentType === 'MeshRenderer') {
          const inlineMaterial = extractMaterialFromMeshRenderer(processedData);
          if (inlineMaterial) {
            // Preserve the original material ID if it exists
            const proposedId = (inlineMaterial as IMaterialDefinition).id;
            const materialId = materialDeduplicator.addMaterial(inlineMaterial, proposedId);
            processedData = replaceMaterialWithReference(processedData, materialId);
          } else if (!processedData.materialId) {
            // Safety: Ensure MeshRenderer always has materialId
            processedData = {
              ...processedData,
              materialId: 'default',
            };
          }
        }

        normalizedComponents[componentType] = processedData;
      }

      return {
        ...entity,
        components: normalizedComponents,
      };
    });

    // Merge extracted materials with existing materials
    const extractedMaterials = materialDeduplicator.getMaterials();
    const existingMaterials = sceneData.materials || [];
    const allMaterials = [...extractedMaterials, ...existingMaterials];

    return {
      ...sceneData,
      entities: normalizedEntities,
      materials: allMaterials,
    };
  }

  /**
   * List all multi-file scene folders
   */
  async list(): Promise<ISceneListItem[]> {
    const items = await this.store.list();

    // FsSceneStore now returns folders that contain .index.tsx files
    return items.map((i) => ({
      name: i.name,
      filename: i.name,
      modified: i.modified,
      size: i.size,
      type: 'tsx',
    }));
  }

  /**
   * Extract defineScene data from TSX file content
   * Supports the new defineScene format
   */
  private extractDefineSceneData(content: string): unknown {
    // Check if this is the new defineScene format
    const isDefineSceneFormat = content.includes('defineScene(');

    if (!isDefineSceneFormat) {
      throw new Error('TSX file must use defineScene format');
    }

    // Extract from defineScene({...})
    const defineSceneMatch = content.match(/defineScene\(\s*({[\s\S]*?})\s*\);?\s*$/m);

    if (!defineSceneMatch) {
      throw new Error('Could not extract defineScene data from TSX file');
    }

    try {
      // Parse the defineScene argument as JSON
      let sceneDataString = defineSceneMatch[1];

      // Strip comments (both // and /* */) BEFORE processing
      // Remove single-line comments
      sceneDataString = sceneDataString.replace(/\/\/.*$/gm, '');
      // Remove multi-line comments
      sceneDataString = sceneDataString.replace(/\/\*[\s\S]*?\*\//g, '');

      // Replace enum references with their string values BEFORE JSON parsing
      // DeviceType enums
      sceneDataString = sceneDataString.replace(/DeviceType\.Keyboard/g, '"keyboard"');
      sceneDataString = sceneDataString.replace(/DeviceType\.Mouse/g, '"mouse"');
      sceneDataString = sceneDataString.replace(/DeviceType\.Gamepad/g, '"gamepad"');
      sceneDataString = sceneDataString.replace(/DeviceType\.Touch/g, '"touch"');

      // ActionType enums
      sceneDataString = sceneDataString.replace(/ActionType\.Button/g, '"button"');
      sceneDataString = sceneDataString.replace(/ActionType\.Value/g, '"value"');
      sceneDataString = sceneDataString.replace(/ActionType\.PassThrough/g, '"passthrough"');

      // ControlType enums
      sceneDataString = sceneDataString.replace(/ControlType\.Button/g, '"button"');
      sceneDataString = sceneDataString.replace(/ControlType\.Axis/g, '"axis"');
      sceneDataString = sceneDataString.replace(/ControlType\.Vector2/g, '"vector2"');
      sceneDataString = sceneDataString.replace(/ControlType\.Vector3/g, '"vector3"');

      // CompositeType enums
      sceneDataString = sceneDataString.replace(/CompositeType\.OneModifier/g, '"1DAxis"');
      sceneDataString = sceneDataString.replace(/CompositeType\.TwoDVector/g, '"2DVector"');
      sceneDataString = sceneDataString.replace(/CompositeType\.ThreeDVector/g, '"3DVector"');

      // Convert to valid JSON (handle unquoted keys, single quotes, etc.)
      sceneDataString = sceneDataString.replace(
        /([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g,
        '$1"$2":',
      );
      sceneDataString = sceneDataString.replace(/'([^'\\]*(\\.[^'\\]*)*)'/g, '"$1"');
      sceneDataString = sceneDataString.replace(/,(\s*[}\]])/g, '$1');

      const sceneObj = JSON.parse(sceneDataString);

      // Return scene data in the expected format
      return {
        version: sceneObj.metadata?.version || 4,
        name: sceneObj.metadata?.name || 'Untitled',
        timestamp: sceneObj.metadata?.timestamp || new Date().toISOString(),
        entities: sceneObj.entities || [],
        materials: sceneObj.materials || [],
        prefabs: sceneObj.prefabs || [],
        inputAssets: sceneObj.inputAssets || [],
      };
    } catch (error) {
      throw new Error(
        `Failed to parse defineScene data: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}
