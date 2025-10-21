import type { IInputActionsAsset } from '../../../core/lib/input/inputTypes';
import type { ISceneStore } from '../../../core/lib/serialization/common/ISceneStore';
import { sanitizeComponentName } from '../../../core/lib/serialization/common/NameUtils';
import { getComponentDefaults } from '../../../core/lib/serialization/defaults/index';
import { MultiFileSceneLoader } from '../../../core/lib/serialization/multi-file/MultiFileSceneLoader';
import { RustSceneExporter } from '../../../core/lib/serialization/RustSceneExporter';
import { omitDefaults } from '../../../core/lib/serialization/utils/DefaultOmitter';
import {
  MaterialDeduplicator,
  extractMaterialFromMeshRenderer,
  replaceMaterialWithReference,
} from '../../../core/lib/serialization/utils/MaterialHasher';
import { sanitizeScriptComponentData } from '../../../core/lib/serialization/utils/ScriptSerializationUtils';
import type { IMaterialDefinition } from '../../../core/materials/Material.types';
import type { IPrefabDefinition } from '../../../core/prefabs/Prefab.types';
import { triggerLuaTranspile } from '../../utils/triggerLuaTranspile';
import type {
  ILoadArgs,
  ILoadResult,
  ISaveArgs,
  ISaveResult,
  ISceneFormatHandler,
  ISceneListItem,
} from '../ISceneFormatHandler';

/**
 * TSX format handler for scene persistence
 * Saves and loads scenes as multi-file folders using defineScene
 */
export class TsxFormatHandler implements ISceneFormatHandler {
  readonly format = 'tsx' as const;
  readonly contentType = 'application/json';

  private readonly multiFileLoader = new MultiFileSceneLoader();
  private readonly rustExporter = new RustSceneExporter();

  constructor(
    private readonly store: ISceneStore,
    private readonly baseDir: string,
  ) {}

  /**
   * Save scene as multi-file folder
   */
  async save(args: ISaveArgs): Promise<ISaveResult> {
    const { name, payload } = args;

    // Strip .tsx extension from name if present to avoid double extensions
    const cleanName = name.replace(/\.tsx$/i, '');

    // Extract scene data from payload
    const sceneData = payload as {
      entities: unknown[];
      materials?: IMaterialDefinition[];
      prefabs?: IPrefabDefinition[];
      inputAssets?: IInputActionsAsset[];
      lockedEntityIds?: number[];
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
      name: cleanName,
      version: 1,
      timestamp: new Date().toISOString(),
      description: sceneData.description,
      author: sceneData.author,
    };

    // Save full scene dump to Rust folder (no compression)
    await this.rustExporter.export(cleanName, sceneData, metadata);

    // Apply compression to entities
    const materialDeduplicator = new MaterialDeduplicator();

    const compressedEntities = (
      sceneData.entities as Array<{ components?: Record<string, unknown> }>
    ).map((entity) => {
      if (!entity.components) return entity;

      const compressedComponents: Record<string, unknown> = {};

      for (const [componentType, componentData] of Object.entries(entity.components)) {
        if (!componentData || typeof componentData !== 'object') {
          compressedComponents[componentType] = componentData;
          continue;
        }

        let processedData = componentData as Record<string, unknown>;

        if (componentType === 'Script') {
          const rawScript = componentData as Record<string, unknown>;
          const scriptRef = rawScript.scriptRef as Record<string, unknown> | undefined;

          if (scriptRef?.source === 'external') {
            // Sanitize script data: strip code and compiledCode for external scripts
            processedData = sanitizeScriptComponentData(rawScript);
          }
        }

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

    // Save assets to global library and collect path references
    const { FsAssetStore } = await import('../../assets-api/FsAssetStore');
    const assetStore = new FsAssetStore('src/game/assets', 'src/game/scenes');

    const materialRefsSet = new Set<string>();
    for (const material of allMaterials) {
      const mat = material as IMaterialDefinition;
      // Use material ID as filename for consistency
      // Entity uses materialId → must match filename
      const assetPath = `@/materials/${mat.id}`;

      await assetStore.save({
        path: assetPath,
        payload: mat,
        type: 'material',
      });

      materialRefsSet.add(assetPath);
    }

    const inputRefsSet = new Set<string>();
    if (sceneData.inputAssets) {
      for (const input of sceneData.inputAssets) {
        const inp = input as IInputActionsAsset;
        const filename = sanitizeComponentName(inp.name);
        const assetPath = `@/inputs/${filename}`;

        await assetStore.save({
          path: assetPath,
          payload: inp,
          type: 'input',
        });

        inputRefsSet.add(assetPath);
      }
    }

    const prefabRefsSet = new Set<string>();
    if (sceneData.prefabs) {
      for (const prefab of sceneData.prefabs) {
        const pref = prefab as IPrefabDefinition;
        const filename = sanitizeComponentName(pref.id);
        const assetPath = `@/prefabs/${filename}`;

        await assetStore.save({
          path: assetPath,
          payload: pref,
          type: 'prefab',
        });

        prefabRefsSet.add(assetPath);
      }
    }

    // Do not generate script asset files; rely on scriptRef.path to point to src/game/scripts/*.ts
    // This avoids duplication between src/game/assets/scripts/*.script.tsx and src/game/scripts/*.ts

    // Generate KISS scene file with entities + path references
    // IMPORTANT: Keep filename lowercase to match scene registry expectations
    const sceneName = sanitizeComponentName(cleanName); // lowercase, not PascalCase
    const sceneContent = this.generateSceneWithPaths(
      compressedEntities as never[],
      metadata,
      Array.from(materialRefsSet),
      Array.from(inputRefsSet),
      Array.from(prefabRefsSet),
      [],
      sceneData.lockedEntityIds || [],
    );

    const filename = `${sceneName}.tsx`;
    const result = await this.store.write(filename, sceneContent);

    await triggerLuaTranspile('scene-api/tsx');

    return {
      filename,
      modified: result.modified,
      size: result.size,
    };
  }

  /**
   * Generate KISS scene file with entities and path references
   * Path format: @/materials/MaterialName matches src/game/assets/materials/MaterialName.material.tsx
   */
  private generateSceneWithPaths(
    entities: unknown[],
    metadata: {
      name: string;
      version: number;
      timestamp: string;
      description?: string;
      author?: string;
    },
    materialRefs: string[],
    inputRefs: string[],
    prefabRefs: string[],
    scriptRefs: string[],
    lockedEntityIds: number[],
  ): string {
    const refs: string[] = [];
    if (materialRefs.length > 0) refs.push(`    materials: ${JSON.stringify(materialRefs)}`);
    if (inputRefs.length > 0) refs.push(`    inputs: ${JSON.stringify(inputRefs)}`);
    if (prefabRefs.length > 0) refs.push(`    prefabs: ${JSON.stringify(prefabRefs)}`);
    if (scriptRefs.length > 0) refs.push(`    scripts: ${JSON.stringify(scriptRefs)}`);

    const assetRefsBlock =
      refs.length > 0 ? `,\n  assetReferences: {\n${refs.join(',\n')}\n  }` : '';
    const lockedIdsBlock =
      lockedEntityIds.length > 0
        ? `,\n  lockedEntityIds: ${JSON.stringify(lockedEntityIds, null, 2)}`
        : '';

    return `import { defineScene } from './defineScene';

/**
 * ${metadata.name}${metadata.description ? `\n * ${metadata.description}` : ''}
 * Generated: ${metadata.timestamp}
 * Version: ${metadata.version}${metadata.author ? `\n * Author: ${metadata.author}` : ''}
 */
export default defineScene({
  metadata: ${JSON.stringify(metadata, null, 2)},
  entities: ${JSON.stringify(entities, null, 2)}${assetRefsBlock}${lockedIdsBlock}
});
`;
  }

  /**
   * Load scene from single-file or multi-file folder
   */
  async load(args: ILoadArgs): Promise<ILoadResult> {
    const { name } = args;

    // Sanitize name to match how save sanitizes it (camelCase)
    const cleanName = name.replace(/\.tsx$/i, '');
    const sanitizedName = sanitizeComponentName(cleanName);

    // Try single-file format first: sceneName.tsx (camelCase)
    const singleFilename = `${sanitizedName}.tsx`;

    if (await this.store.exists(singleFilename)) {
      // Single-file scene
      const result = await this.store.read(singleFilename);
      const content = result.content;

      // Extract scene data from TSX file
      const data = this.extractDefineSceneData(content);

      // Use MultiFileSceneLoader to resolve asset references (@/materials/..., @/inputs/...)
      const resolvedData = await this.multiFileLoader.loadMultiFile(
        data as any,
        this.baseDir, // Scene folder (not used for single-file)
        'src/game/assets', // Asset library root
      );

      // Normalize loaded data: convert inline materials to materialId references
      const normalizedData = this.normalizeSceneData({
        ...(data as object),
        entities: resolvedData.entities,
      });

      return {
        filename: singleFilename,
        data: normalizedData,
      };
    }

    // Fall back to multi-file format: sceneName/sceneName.index.tsx
    const folderName = sanitizedName;
    const indexFilename = `${folderName}/${folderName}.index.tsx`;

    if (!(await this.store.exists(indexFilename))) {
      throw new Error(`Scene not found: ${name} (tried ${singleFilename} and ${indexFilename})`);
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
      'src/game/assets', // Asset library root, not scenes root
    );

    // Normalize loaded data: convert inline materials to materialId references
    const normalizedData = this.normalizeSceneData({
      ...(data as object),
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

      // NOTE: Do NOT strip comments naively - they might be inside string literals!
      // The comment stripping was causing issues where // inside "code": "//..." strings
      // would remove the rest of the string content, leaving invalid JSON.
      // Since JSON.stringify doesn't produce comments, we can skip this step.

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

      // Check for new ID-based format vs old inline format
      const hasAssetReferences =
        sceneObj.assetReferences && typeof sceneObj.assetReferences === 'object';

      if (hasAssetReferences) {
        // New format: assetReferences with IDs
        // Convert IDs to materialRef paths for MultiFileSceneLoader
        const entities = (sceneObj.entities || []).map((entity: any) => {
          if (entity.components?.MeshRenderer && entity.components.MeshRenderer.materialId) {
            const materialId = entity.components.MeshRenderer.materialId;
            return {
              ...entity,
              components: {
                ...entity.components,
                MeshRenderer: {
                  ...entity.components.MeshRenderer,
                  materialRef: `@/materials/${materialId}`,
                  materialId: undefined, // Remove inline ID, use ref
                },
              },
            };
          }
          return entity;
        });

        return {
          version: sceneObj.metadata?.version || 4,
          name: sceneObj.metadata?.name || 'Untitled',
          timestamp: sceneObj.metadata?.timestamp || new Date().toISOString(),
          entities,
          assetReferences: sceneObj.assetReferences,
          lockedEntityIds: sceneObj.lockedEntityIds || [],
        };
      }

      // Old format: inline materials/prefabs/inputs
      return {
        version: sceneObj.metadata?.version || 4,
        name: sceneObj.metadata?.name || 'Untitled',
        timestamp: sceneObj.metadata?.timestamp || new Date().toISOString(),
        entities: sceneObj.entities || [],
        materials: sceneObj.materials || [],
        prefabs: sceneObj.prefabs || [],
        inputAssets: sceneObj.inputAssets || [],
        lockedEntityIds: sceneObj.lockedEntityIds || [],
      };
    } catch (error) {
      throw new Error(
        `Failed to parse defineScene data: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}
