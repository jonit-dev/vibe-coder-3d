import * as path from 'path';
import { AssetReferenceResolver } from '../assets/AssetReferenceResolver';
import type { IAssetRefResolutionContext } from '../assets/AssetReferenceResolver';
import type { ISerializedEntity } from '../common/types';
import type { IMaterialDefinition } from '@core/materials/Material.types';

export interface IMultiFileSceneData {
  metadata: {
    name: string;
    version: number;
    timestamp: string;
    format?: 'multi-file' | 'single-file';
    [key: string]: unknown;
  };
  entities: ISerializedEntity[];
  assetReferences?: {
    materials?: string;
    prefabs?: string;
    inputs?: string;
  };
}

/**
 * Load scenes from multi-file format with external asset references
 * Resolves asset references and restores inline materials for deserialization
 */
export class MultiFileSceneLoader {
  private assetResolver = new AssetReferenceResolver();

  /**
   * Load multi-file scene and resolve all asset references
   */
  async loadMultiFile(
    sceneData: IMultiFileSceneData,
    sceneFolder: string,
    assetLibraryRoot: string = 'src/game/assets',
  ): Promise<{
    entities: ISerializedEntity[];
    materials: IMaterialDefinition[];
    metadata: IMultiFileSceneData['metadata'];
  }> {
    // Setup resolution context
    const context: IAssetRefResolutionContext = {
      sceneFolder,
      assetLibraryRoot,
      format: 'multi-file',
    };

    // Resolve asset references in entities
    const entitiesWithResolvedRefs = await this.resolveEntityReferences(
      sceneData.entities,
      context,
    );

    // Extract inline materials from resolved entities
    const materials = this.extractInlineMaterials(entitiesWithResolvedRefs);

    return {
      entities: entitiesWithResolvedRefs,
      materials,
      metadata: sceneData.metadata,
    };
  }

  /**
   * Resolve asset references in entities
   */
  private async resolveEntityReferences(
    entities: ISerializedEntity[],
    context: IAssetRefResolutionContext,
  ): Promise<ISerializedEntity[]> {
    return Promise.all(
      entities.map(async (entity: ISerializedEntity) => {
        if (!entity.components?.MeshRenderer) return entity;

        const meshRenderer = entity.components.MeshRenderer as Record<string, unknown>;

        // Resolve material reference
        if (meshRenderer.materialRef && typeof meshRenderer.materialRef === 'string') {
          try {
            const materialData = await this.assetResolver.resolve<IMaterialDefinition>(
              meshRenderer.materialRef,
              context,
              'material',
            );

            // Replace reference with inline material for deserialization
            return {
              ...entity,
              components: {
                ...entity.components,
                MeshRenderer: {
                  ...meshRenderer,
                  material: materialData,
                  materialRef: undefined, // Remove reference
                },
              },
            };
          } catch (error) {
            console.warn(
              `Failed to resolve material reference '${meshRenderer.materialRef}':`,
              error instanceof Error ? error.message : error,
            );
            // Return entity unchanged if reference fails
            return entity;
          }
        }

        return entity;
      }),
    );
  }

  /**
   * Extract inline materials from entities for material registry
   */
  private extractInlineMaterials(entities: ISerializedEntity[]): IMaterialDefinition[] {
    const materials: IMaterialDefinition[] = [];
    const seen = new Set<string>();

    for (const entity of entities) {
      if (!entity.components?.MeshRenderer) continue;

      const meshRenderer = entity.components.MeshRenderer as Record<string, unknown>;
      const material = meshRenderer.material as IMaterialDefinition | undefined;

      if (material && material.id && !seen.has(material.id)) {
        materials.push(material);
        seen.add(material.id);
      }
    }

    return materials;
  }

  /**
   * Clear asset resolution cache (for hot-reload)
   */
  clearCache(): void {
    this.assetResolver.clearCache();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return this.assetResolver.getCacheStats();
  }
}
