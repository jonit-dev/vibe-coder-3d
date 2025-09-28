/**
 * Type-Safe Scene Loading Utilities
 * Provides enhanced scene loading with validation and type safety
 */

import { KnownComponentTypes as _KnownComponentTypes } from '@/core/lib/ecs/IComponent';
import type { SceneData } from '@/core/types/scene';
import { IValidationResult, SceneValidator } from '@/core/utils/sceneValidation';
import { useComponentManager } from '@/editor/hooks/useComponentManager';
import { useEntityManager } from '@/editor/hooks/useEntityManager';
import { Profiler } from '../lib/perf/Profiler';

/**
 * Scene loading options
 */
export interface ISceneLoadOptions {
  validateBeforeLoad?: boolean;
  clearExisting?: boolean;
  onProgress?: (progress: number, message: string) => void;
  onError?: (error: string, entityId?: string) => void;
  onWarning?: (warning: string, entityId?: string) => void;
}

/**
 * Enhanced scene loader with validation and error handling
 */
export class SceneLoader {
  private entityManager;
  private componentManager;
  private validator: SceneValidator;

  constructor() {
    this.entityManager = useEntityManager();
    this.componentManager = useComponentManager();
    this.validator = new SceneValidator();
  }

  /**
   * Loads a scene with full validation and type safety
   */
  async loadScene(
    sceneData: unknown,
    options: ISceneLoadOptions = {},
  ): Promise<{
    success: boolean;
    loadedEntities: number;
    errors: string[];
    warnings: string[];
  }> {
    return Profiler.timeAsync('sceneLoader.loadScene', async () => {
      const {
        validateBeforeLoad = true,
        clearExisting = true,
        onProgress,
        onError,
        onWarning,
      } = options;

      const errors: string[] = [];
      const warnings: string[] = [];

      try {
        onProgress?.(0, 'Validating scene data...');

        // Validate scene data if requested
        let validatedScene: SceneData;
        if (validateBeforeLoad) {
          const validation = this.validator.validateScene(sceneData);

          if (!validation.success) {
            validation.errors.forEach((error) => {
              errors.push(`${error.path}: ${error.message}`);
              onError?.(`${error.path}: ${error.message}`);
            });
            return { success: false, loadedEntities: 0, errors, warnings };
          }

          validatedScene = validation.data!;
          validation.warnings.forEach((warning) => {
            warnings.push(warning);
            onWarning?.(warning);
          });
        } else {
          validatedScene = sceneData as SceneData;
        }

        onProgress?.(25, `Loading ${validatedScene.entities.length} entities...`);

        // Clear existing entities if requested
        if (clearExisting) {
          this.entityManager.clearEntities();
        }

        // Build ID mapping and load components in two passes to preserve hierarchy
        // First pass: create all entities without parents and attach components (excluding PersistentId)
        const idMap = new Map<string, number>();
        let loadedCount = 0;

        for (let i = 0; i < validatedScene.entities.length; i++) {
          const entity = validatedScene.entities[i];
          try {
            // Validate entity structure
            const entityValidation = this.validator.validateEntity(entity);
            if (!entityValidation.success) {
              entityValidation.errors.forEach((error) => {
                onError?.(`${error.path}: ${error.message}`, entity.id);
              });
              throw new Error('Entity validation failed');
            }

            entityValidation.warnings.forEach((warning) => {
              onWarning?.(warning, entity.id);
            });

            // Extract persisted PersistentId if present
            const persistentId = (entity.components as any)?.PersistentId?.id as
              | string
              | undefined;

            // Create entity WITHOUT assigning parent yet
            const created = this.entityManager.createEntity(entity.name, undefined, persistentId);
            idMap.set(String(entity.id), created.id);

            // Attach components except PersistentId (already set at creation time if present)
            for (const [componentType, componentData] of Object.entries(entity.components)) {
              if (!componentData) continue;
              if (componentType === 'PersistentId') continue;

              try {
                // Optional: validate known components here if needed
                this.componentManager.addComponent(created.id, componentType, componentData);
              } catch (error) {
                const errorMsg = `Failed to add component '${componentType}': ${
                  error instanceof Error ? error.message : 'Unknown error'
                }`;
                onError?.(errorMsg, entity.id);
                throw error;
              }
            }

            loadedCount++;

            const progress = 25 + (i / validatedScene.entities.length) * 50; // reserve last 25% for parenting
            onProgress?.(
              progress,
              `Creating entity ${entity.name} (${i + 1}/${validatedScene.entities.length})`,
            );
          } catch (error) {
            const errorMsg = `Failed to load entity '${entity.name}': ${
              error instanceof Error ? error.message : 'Unknown error'
            }`;
            errors.push(errorMsg);
            onError?.(errorMsg, entity.id);
          }
        }

        // Second pass: resolve and assign parent relationships using the ID map
        for (let i = 0; i < validatedScene.entities.length; i++) {
          const entity = validatedScene.entities[i];
          const parentRef = entity.parentId;
          if (parentRef === undefined || parentRef === null) continue;

          const childEid = idMap.get(String(entity.id));
          const parentEid = idMap.get(String(parentRef));

          if (childEid === undefined) {
            const warn = `Child entity not found in ID map for ${entity.name} (${entity.id})`;
            warnings.push(warn);
            onWarning?.(warn, entity.id);
            continue;
          }

          if (parentEid === undefined) {
            const warn = `Parent entity mapping missing for ${entity.name} (${entity.id}) -> parent ${parentRef}`;
            warnings.push(warn);
            onWarning?.(warn, entity.id);
            continue;
          }

          this.entityManager.setParent(childEid, parentEid);

          const progress = 75 + (i / validatedScene.entities.length) * 25;
          onProgress?.(progress, `Assigning parent for ${entity.name}`);
        }

        onProgress?.(100, 'Scene loading complete');

        return {
          success: errors.length === 0,
          loadedEntities: loadedCount,
          errors,
          warnings,
        };
      } catch (error) {
        const errorMsg = `Scene loading failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
        errors.push(errorMsg);
        onError?.(errorMsg);
        return { success: false, loadedEntities: 0, errors, warnings };
      }
    });
  }


  /**
   * Validates scene data without loading
   */
  validateSceneData(sceneData: unknown): IValidationResult<SceneData> {
    return this.validator.validateScene(sceneData);
  }

  /**
   * Gets validation summary for a scene
   */
  getValidationSummary(sceneData: unknown): {
    totalErrors: number;
    totalWarnings: number;
    errorTypes: string[];
    warningTypes: string[];
  } {
    const validation = this.validator.validateScene(sceneData);

    if (!validation.success) {
      return {
        totalErrors: validation.errors.length,
        totalWarnings: validation.warnings.length,
        errorTypes: [...new Set(validation.errors.map((e) => e.message))],
        warningTypes: [...new Set(validation.warnings)],
      };
    }

    return {
      totalErrors: 0,
      totalWarnings: validation.warnings.length,
      errorTypes: [],
      warningTypes: [...new Set(validation.warnings)],
    };
  }
}

/**
 * Hook for loading scenes with React state management
 */
export function useSceneLoader() {
  const sceneLoader = new SceneLoader();

  const loadScene = async (sceneData: unknown, options: ISceneLoadOptions = {}) => {
    return sceneLoader.loadScene(sceneData, options);
  };

  const validateScene = (sceneData: unknown) => {
    return sceneLoader.validateSceneData(sceneData);
  };

  const getValidationSummary = (sceneData: unknown) => {
    return sceneLoader.getValidationSummary(sceneData);
  };

  return {
    loadScene,
    validateScene,
    getValidationSummary,
  };
}

/**
 * Utility to load scene from URL with fetch
 */
export async function loadSceneFromUrl(
  url: string,
  options: ISceneLoadOptions = {},
): Promise<{
  success: boolean;
  loadedEntities: number;
  errors: string[];
  warnings: string[];
}> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const sceneData = await response.json();
    const sceneLoader = new SceneLoader();
    return sceneLoader.loadScene(sceneData, options);
  } catch (error) {
    return {
      success: false,
      loadedEntities: 0,
      errors: [
        `Failed to load scene from ${url}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      ],
      warnings: [],
    };
  }
}

/**
 * Utility to load scene from file path (Node.js environment)
 */
export async function loadSceneFromFile(
  filePath: string,
  options: ISceneLoadOptions = {},
): Promise<{
  success: boolean;
  loadedEntities: number;
  errors: string[];
  warnings: string[];
}> {
  try {
    // This would use fs module in Node.js environment
    const fs = await import('fs/promises');
    const sceneData = JSON.parse(await fs.readFile(filePath, 'utf-8'));
    const sceneLoader = new SceneLoader();
    return sceneLoader.loadScene(sceneData, options);
  } catch (error) {
    return {
      success: false,
      loadedEntities: 0,
      errors: [
        `Failed to load scene from ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      ],
      warnings: [],
    };
  }
}

/**
 * Batch scene loading utility
 */
export async function loadScenesBatch(
  scenes: Array<{ name: string; data: unknown }>,
  options: ISceneLoadOptions & { continueOnError?: boolean } = {},
): Promise<
  Array<{
    name: string;
    result: {
      success: boolean;
      loadedEntities: number;
      errors: string[];
      warnings: string[];
    };
  }>
> {
  const { continueOnError = true, ...loadOptions } = options;
  const results = [];

  for (const scene of scenes) {
    try {
      const sceneLoader = new SceneLoader();
      const result = await sceneLoader.loadScene(scene.data, loadOptions);
      results.push({ name: scene.name, result });
    } catch (error) {
      const result = {
        success: false,
        loadedEntities: 0,
        errors: [
          `Scene loading failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ],
        warnings: [],
      };
      results.push({ name: scene.name, result });

      if (!continueOnError) {
        break;
      }
    }
  }

  return results;
}
