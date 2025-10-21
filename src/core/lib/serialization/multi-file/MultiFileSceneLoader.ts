import { AssetReferenceResolver } from '../assets/AssetReferenceResolver';
import type { IAssetRefResolutionContext } from '../assets/AssetReferenceResolver';
import type { ISerializedEntity } from '../EntitySerializer';
import type { IMaterialDefinition } from '@core/materials/Material.types';
import type { IScriptDefinition } from '../assets/defineScripts';
import { extractAssetIdFromRef } from '../assets/AssetTypes';

import { applyResolvedScriptData } from '../utils/ScriptSerializationUtils';
import { readScriptFromFilesystem } from '../utils/ScriptFileResolver';

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
    materials?: string | string[];
    prefabs?: string | string[];
    inputs?: string | string[];
    scripts?: string | string[];
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

    const entitiesWithScripts = await this.resolveScriptReferences(
      entitiesWithResolvedRefs,
      sceneData.assetReferences,
      context,
    );

    // Extract inline materials from resolved entities
    const materials = this.extractInlineMaterials(entitiesWithScripts);

    return {
      entities: entitiesWithScripts,
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
        let updatedEntity = entity;

        // Resolve material reference in MeshRenderer
        if (entity.components?.MeshRenderer) {
          const meshRenderer = entity.components.MeshRenderer as Record<string, unknown>;

          if (meshRenderer.materialRef && typeof meshRenderer.materialRef === 'string') {
            try {
              const materialData = await this.assetResolver.resolve<IMaterialDefinition>(
                meshRenderer.materialRef,
                context,
                'material',
              );

              updatedEntity = {
                ...updatedEntity,
                components: {
                  ...updatedEntity.components,
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
            }
          }
        }

        // TODO: Add prefab reference resolution when prefab instantiation is implemented
        // if (entity.components?.PrefabInstance) { ... }

        // TODO: Add input reference resolution when input system uses references
        // if (entity.components?.InputHandler) { ... }

        return updatedEntity;
      }),
    );
  }

  private async resolveScriptReferences(
    entities: ISerializedEntity[],
    assetReferences: IMultiFileSceneData['assetReferences'],
    context: IAssetRefResolutionContext,
  ): Promise<ISerializedEntity[]> {
    const scriptsRefValue = assetReferences?.scripts;
    const scriptRefs = !scriptsRefValue
      ? []
      : Array.isArray(scriptsRefValue)
        ? scriptsRefValue
        : [scriptsRefValue];

    const scriptAssetCache = new Map<string, IScriptDefinition>();
    const resolvedScriptCache = new Map<string, Awaited<ReturnType<typeof readScriptFromFilesystem>> | null>();

    const resolveDefinition = async (scriptId: string): Promise<IScriptDefinition | null> => {
      if (scriptAssetCache.has(scriptId)) {
        return scriptAssetCache.get(scriptId)!;
      }

      const refEntry = scriptRefs.find((ref) => extractAssetIdFromRef(ref) === scriptId);
      if (!refEntry) return null;

      try {
        const definition = await this.assetResolver.resolve<IScriptDefinition>(refEntry, context, 'script');
        scriptAssetCache.set(scriptId, definition);
        return definition;
      } catch (error) {
        console.warn(
          `Failed to resolve script asset "${scriptId}" from reference ${refEntry}:`,
          error instanceof Error ? error.message : error,
        );
        return null;
      }
    };

    return Promise.all(
      entities.map(async (entity) => {
        const scriptComponent = entity.components?.Script as Record<string, unknown> | undefined;
        if (!scriptComponent) return entity;

        const scriptRef = scriptComponent.scriptRef as Record<string, unknown> | undefined;
        const scriptId = typeof scriptRef?.scriptId === 'string' ? scriptRef.scriptId : undefined;
        const isExternal = scriptRef?.source === 'external' || scriptRef?.source === 'EXTERNAL';

        if (!scriptId || !isExternal) {
          return entity;
        }

        const primaryPath = typeof scriptRef?.path === 'string' ? scriptRef.path : undefined;
        let scriptPath = primaryPath;

        if (!scriptPath) {
          const definition = await resolveDefinition(scriptId);
          if (definition && typeof definition.source === 'string') {
            scriptPath = definition.source;
          }
        }

        if (!scriptPath) {
          console.warn(
            `[MultiFileSceneLoader] Missing script path for scriptId "${scriptId}" – unable to hydrate code`,
          );
          return entity;
        }

        if (!resolvedScriptCache.has(scriptId)) {
          resolvedScriptCache.set(scriptId, await readScriptFromFilesystem(scriptPath));
        }

        const resolved = resolvedScriptCache.get(scriptId);
        if (!resolved) {
          return entity;
        }

        return {
          ...entity,
          components: {
            ...entity.components,
            Script: applyResolvedScriptData(scriptComponent, resolved),
          },
        };
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
