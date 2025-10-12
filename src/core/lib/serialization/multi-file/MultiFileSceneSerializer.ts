import type { ISerializedEntity } from '../EntitySerializer';
import type { ISceneMetadata } from '../SceneSerializer';
import type { IMaterialDefinition } from '@core/materials/Material.types';
import type { IPrefabDefinition } from '@core/prefabs/Prefab.types';
import type { IInputActionsAsset } from '@core/lib/input/inputTypes';
import { AssetLibraryCatalog } from '../assets/AssetLibraryCatalog';

export interface IMultiFileSceneData {
  index: string; // Forest.index.tsx content
  materials?: string; // Forest.materials.tsx content
  prefabs?: string; // Forest.prefabs.tsx content
  inputs?: string; // Forest.inputs.tsx content
  metadata?: string; // Forest.metadata.json content
}

export interface IMultiFileSerializeOptions {
  extractMaterials?: boolean; // Extract to .materials.tsx
  extractPrefabs?: boolean; // Extract to .prefabs.tsx
  extractInputs?: boolean; // Extract to .inputs.tsx
  libraryRoot?: string; // Asset library root (default: 'src/game/assets')
  preferLibraryRefs?: boolean; // Prefer @/ library refs over ./ scene refs (default: true)
}

/**
 * Serialize scenes to multi-file format with external asset references
 * Splits materials, prefabs, and input assets into separate files
 */
export class MultiFileSceneSerializer {
  private catalog: AssetLibraryCatalog | null = null;

  /**
   * Serialize scene to multi-file format
   */
  async serializeMultiFile(
    entities: ISerializedEntity[],
    metadata: ISceneMetadata,
    materials: IMaterialDefinition[],
    prefabs: IPrefabDefinition[],
    inputAssets?: IInputActionsAsset[],
    options: IMultiFileSerializeOptions = {},
  ): Promise<IMultiFileSceneData> {
    const {
      extractMaterials = true,
      extractPrefabs = true,
      extractInputs = true,
      libraryRoot = 'src/game/assets',
      preferLibraryRefs = true,
    } = options;

    // Build catalog if preferring library refs
    if (preferLibraryRefs) {
      this.catalog = new AssetLibraryCatalog(libraryRoot);
      await this.catalog.build();
    }

    // Extract materials and replace inline IDs with references
    let sceneMaterials: IMaterialDefinition[] = [];
    let materialReferences = new Map<string, string>();
    let entitiesWithMaterialRefs = entities;

    if (extractMaterials && materials.length > 0) {
      sceneMaterials = materials;
      materialReferences = this.createMaterialReferenceMap(materials);
      entitiesWithMaterialRefs = this.replaceMaterialReferences(entities, materialReferences);
    }

    // Extract prefabs
    let scenePrefabs: IPrefabDefinition[] = [];
    if (extractPrefabs && prefabs.length > 0) {
      scenePrefabs = prefabs;
    }

    // Extract inputs
    let sceneInputs: IInputActionsAsset[] = [];
    if (extractInputs && inputAssets && inputAssets.length > 0) {
      sceneInputs = inputAssets;
    }

    // Generate file contents
    const result: IMultiFileSceneData = {
      index: this.generateIndexFile(entitiesWithMaterialRefs, metadata, {
        hasMaterials: sceneMaterials.length > 0,
        hasPrefabs: scenePrefabs.length > 0,
        hasInputs: sceneInputs.length > 0,
      }),
    };

    if (sceneMaterials.length > 0) {
      result.materials = this.generateMaterialsFile(sceneMaterials);
    }

    if (scenePrefabs.length > 0) {
      result.prefabs = this.generatePrefabsFile(scenePrefabs);
    }

    if (sceneInputs.length > 0) {
      result.inputs = this.generateInputsFile(sceneInputs);
    }

    result.metadata = this.generateMetadataFile(metadata, {
      materialCount: sceneMaterials.length,
      prefabCount: scenePrefabs.length,
      inputCount: sceneInputs.length,
    });

    return result;
  }

  /**
   * Create material ID to reference path mapping
   * Prefers library references (@/) when available, otherwise uses scene-relative (./)
   */
  private createMaterialReferenceMap(materials: IMaterialDefinition[]): Map<string, string> {
    const references = new Map<string, string>();

    materials.forEach((mat) => {
      // Check if material exists in library
      const libraryRef = this.catalog?.getLibraryRef('material', mat.id);

      if (libraryRef) {
        // Use library reference
        references.set(mat.id, libraryRef);
      } else {
        // Use scene-relative reference
        const refPath = `./materials/${mat.id}`;
        references.set(mat.id, refPath);
      }
    });

    return references;
  }

  /**
   * Replace material IDs with external references in entities
   */
  private replaceMaterialReferences(
    entities: ISerializedEntity[],
    references: Map<string, string>,
  ): ISerializedEntity[] {
    return entities.map((entity) => {
      if (!entity.components?.MeshRenderer) return entity;

      const meshRenderer = entity.components.MeshRenderer as Record<string, unknown>;
      const materialId = meshRenderer.materialId as string;

      if (materialId && references.has(materialId)) {
        return {
          ...entity,
          components: {
            ...entity.components,
            MeshRenderer: {
              ...meshRenderer,
              materialRef: references.get(materialId),
              materialId: undefined, // Remove inline ID
            },
          },
        };
      }

      return entity;
    });
  }

  /**
   * Generate index file content
   */
  private generateIndexFile(
    entities: ISerializedEntity[],
    metadata: ISceneMetadata,
    refs: { hasMaterials: boolean; hasPrefabs: boolean; hasInputs: boolean },
  ): string {
    const assetReferences: Record<string, string> = {};

    if (refs.hasMaterials) {
      assetReferences.materials = `./${metadata.name}.materials.tsx`;
    }
    if (refs.hasPrefabs) {
      assetReferences.prefabs = `./${metadata.name}.prefabs.tsx`;
    }
    if (refs.hasInputs) {
      assetReferences.inputs = `./${metadata.name}.inputs.tsx`;
    }

    const hasAssetRefs = Object.keys(assetReferences).length > 0;

    return `import { defineScene } from '../defineScene';

/**
 * ${metadata.name} Scene
 * Generated: ${metadata.timestamp}
 * Version: ${metadata.version} (Multi-file format)
 */
export default defineScene({
  metadata: ${JSON.stringify(metadata, null, 2)},
  entities: ${JSON.stringify(entities, null, 2)},${hasAssetRefs ? `\n  assetReferences: ${JSON.stringify(assetReferences, null, 2)},` : ''}
});
`;
  }

  /**
   * Generate materials file content
   */
  private generateMaterialsFile(materials: IMaterialDefinition[]): string {
    return `import { defineMaterials } from '@core/lib/serialization/assets/defineMaterials';

/**
 * Scene Materials
 * ${materials.length} unique material${materials.length === 1 ? '' : 's'}
 */
export default defineMaterials(${JSON.stringify(materials, null, 2)});
`;
  }

  /**
   * Generate prefabs file content
   */
  private generatePrefabsFile(prefabs: IPrefabDefinition[]): string {
    return `import { definePrefabs } from '@core/lib/serialization/assets/definePrefabs';

/**
 * Scene Prefabs
 * ${prefabs.length} prefab definition${prefabs.length === 1 ? '' : 's'}
 */
export default definePrefabs(${JSON.stringify(prefabs, null, 2)});
`;
  }

  /**
   * Generate inputs file content
   */
  private generateInputsFile(inputs: IInputActionsAsset[]): string {
    return `import { defineInputAssets } from '@core/lib/serialization/assets/defineInputAssets';
import { ActionType, ControlType, DeviceType, CompositeType } from '@core';

/**
 * Scene Input Assets
 * ${inputs.length} input action map${inputs.length === 1 ? '' : 's'}
 */
export default defineInputAssets(${JSON.stringify(inputs, null, 2)});
`;
  }

  /**
   * Generate metadata JSON file
   */
  private generateMetadataFile(
    metadata: ISceneMetadata,
    stats: { materialCount: number; prefabCount: number; inputCount: number },
  ): string {
    return JSON.stringify(
      {
        ...metadata,
        stats,
        generatedAt: new Date().toISOString(),
      },
      null,
      2,
    );
  }
}
