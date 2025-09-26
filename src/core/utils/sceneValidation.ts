/**
 * Scene Validation Utilities
 * Provides comprehensive validation for scene data and components
 */

import { KnownComponentTypes } from '@/core/lib/ecs/IComponent';
import type { ComponentDataMap, SceneData, SceneEntityData } from '@/core/types/scene';
import { validateScene, validateSceneEntity } from '@/core/types/scene';
import { z } from 'zod';

/**
 * Validation error details
 */
export interface IValidationError {
  path: string;
  message: string;
  value: unknown;
}

/**
 * Validation result
 */
export interface IValidationResult<T = unknown> {
  success: boolean;
  data?: T;
  errors: IValidationError[];
  warnings: string[];
}

/**
 * Enhanced scene validation with detailed error reporting
 */
export class SceneValidator {
  private warnings: string[] = [];
  private errors: IValidationError[] = [];

  /**
   * Validates a complete scene with detailed error reporting
   */
  validateScene(data: unknown): IValidationResult<SceneData> {
    this.warnings = [];
    this.errors = [];

    try {
      const validatedData = validateScene(data);

      // Additional validation checks
      this.validateSceneStructure(validatedData);
      this.validateComponentConsistency(validatedData);
      this.validateEntityIds(validatedData);

      if (this.errors.length > 0) {
        return {
          success: false,
          errors: this.errors,
          warnings: this.warnings,
        };
      }

      return {
        success: true,
        data: validatedData,
        errors: [],
        warnings: this.warnings,
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        this.errors = error.errors.map((err) => ({
          path: err.path.join('.'),
          message: err.message,
          value: err.code,
        }));
      } else {
        this.errors.push({
          path: 'root',
          message: error instanceof Error ? error.message : 'Unknown validation error',
          value: data,
        });
      }

      return {
        success: false,
        errors: this.errors,
        warnings: this.warnings,
      };
    }
  }

  /**
   * Validates a single entity
   */
  validateEntity(entity: unknown): IValidationResult<SceneEntityData> {
    this.warnings = [];
    this.errors = [];

    try {
      const validatedEntity = validateSceneEntity(entity);
      this.validateEntityComponents(validatedEntity);

      if (this.errors.length > 0) {
        return {
          success: false,
          errors: this.errors,
          warnings: this.warnings,
        };
      }

      return {
        success: true,
        data: validatedEntity,
        errors: [],
        warnings: this.warnings,
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        this.errors = error.errors.map((err) => ({
          path: err.path.join('.'),
          message: err.message,
          value: err.code,
        }));
      } else {
        this.errors.push({
          path: 'root',
          message: error instanceof Error ? error.message : 'Unknown validation error',
          value: entity,
        });
      }

      return {
        success: false,
        errors: this.errors,
        warnings: this.warnings,
      };
    }
  }

  /**
   * Validates scene structure and metadata
   */
  private validateSceneStructure(scene: SceneData): void {
    // Check for required components
    const entitiesWithRequiredComponents = scene.entities.filter((entity) =>
      this.hasRequiredComponents(entity),
    );

    if (entitiesWithRequiredComponents.length < scene.entities.length) {
      this.warnings.push('Some entities are missing required components (Transform, etc.)');
    }

    // Check for orphaned entities
    const orphanedEntities = this.findOrphanedEntities(scene);
    if (orphanedEntities.length > 0) {
      this.warnings.push(`Found ${orphanedEntities.length} entities without parent relationships`);
    }

    // Check for circular dependencies
    const circularDeps = this.findCircularDependencies(scene);
    if (circularDeps.length > 0) {
      this.warnings.push(`Found ${circularDeps.length} circular parent-child dependencies`);
    }
  }

  /**
   * Validates component consistency across entities
   */
  private validateComponentConsistency(scene: SceneData): void {
    const componentCounts = new Map<string, number>();

    scene.entities.forEach((entity) => {
      Object.keys(entity.components).forEach((componentType) => {
        componentCounts.set(componentType, (componentCounts.get(componentType) || 0) + 1);
      });
    });

    // Warn about components that are used rarely
    const rareComponents = Array.from(componentCounts.entries())
      .filter(([, count]) => count === 1)
      .map(([component]) => component);

    if (rareComponents.length > 0) {
      this.warnings.push(
        `Found ${rareComponents.length} rarely used components: ${rareComponents.join(', ')}`,
      );
    }
  }

  /**
   * Validates entity IDs for uniqueness and format
   */
  private validateEntityIds(scene: SceneData): void {
    const ids = new Set<string>();

    scene.entities.forEach((entity) => {
      if (ids.has(entity.id)) {
        this.errors.push({
          path: `entities[${scene.entities.indexOf(entity)}].id`,
          message: `Duplicate entity ID: ${entity.id}`,
          value: entity.id,
        });
      } else {
        ids.add(entity.id);
      }

      // Check ID format
      if (!/^[a-zA-Z0-9_-]+$/.test(entity.id)) {
        this.warnings.push(`Entity ID '${entity.id}' contains special characters`);
      }
    });
  }

  /**
   * Validates entity components for correctness
   */
  private validateEntityComponents(entity: SceneEntityData): void {
    Object.entries(entity.components).forEach(([componentType, componentData]) => {
      if (!componentData) {
        this.errors.push({
          path: `components.${componentType}`,
          message: `Component '${componentType}' has null/undefined data`,
          value: componentData,
        });
        return;
      }

      // Validate known component types
      if (
        Object.values(KnownComponentTypes).includes(
          componentType as (typeof KnownComponentTypes)[keyof typeof KnownComponentTypes],
        )
      ) {
        try {
          // This would validate against the actual component schema
          // For now, just check basic structure
          if (typeof componentData !== 'object') {
            this.errors.push({
              path: `components.${componentType}`,
              message: `Component data must be an object`,
              value: componentData,
            });
          }
        } catch (error) {
          this.errors.push({
            path: `components.${componentType}`,
            message: `Invalid component data: ${error instanceof Error ? error.message : 'Unknown error'}`,
            value: componentData,
          });
        }
      }
    });
  }

  /**
   * Checks if an entity has required components
   */
  private hasRequiredComponents(entity: SceneEntityData): boolean {
    const requiredComponents = [KnownComponentTypes.TRANSFORM];
    return requiredComponents.some((required) => Object.keys(entity.components).includes(required));
  }

  /**
   * Finds entities without parent relationships
   */
  private findOrphanedEntities(scene: SceneData): SceneEntityData[] {
    const parentIds = new Set(scene.entities.map((e) => e.parentId).filter(Boolean));

    return scene.entities.filter((entity) => !parentIds.has(entity.id));
  }

  /**
   * Finds circular dependencies in parent-child relationships
   */
  private findCircularDependencies(scene: SceneData): string[][] {
    const circularDeps: string[][] = [];
    const entityMap = new Map(scene.entities.map((e) => [e.id, e]));

    // Simple cycle detection using DFS
    const visited = new Set<string>();
    const recStack = new Set<string>();

    const hasCycle = (entityId: string, path: string[] = []): boolean => {
      if (recStack.has(entityId)) {
        circularDeps.push([...path, entityId]);
        return true;
      }

      if (visited.has(entityId)) {
        return false;
      }

      visited.add(entityId);
      recStack.add(entityId);

      const entity = entityMap.get(entityId);
      if (entity?.parentId) {
        if (hasCycle(entity.parentId, [...path, entityId])) {
          return true;
        }
      }

      recStack.delete(entityId);
      return false;
    };

    scene.entities.forEach((entity) => {
      if (!visited.has(entity.id)) {
        hasCycle(entity.id);
      }
    });

    return circularDeps;
  }

  /**
   * Gets validation summary
   */
  getValidationSummary(): {
    totalErrors: number;
    totalWarnings: number;
    errorTypes: string[];
    warningTypes: string[];
  } {
    const errorTypes = [...new Set(this.errors.map((e) => e.message))];
    const warningTypes = [...new Set(this.warnings)];

    return {
      totalErrors: this.errors.length,
      totalWarnings: this.warnings.length,
      errorTypes,
      warningTypes,
    };
  }
}

/**
 * Quick scene validation utility
 */
export function quickValidateScene(data: unknown): IValidationResult<SceneData> {
  const validator = new SceneValidator();
  return validator.validateScene(data);
}

/**
 * Quick entity validation utility
 */
export function quickValidateEntity(data: unknown): IValidationResult<SceneEntityData> {
  const validator = new SceneValidator();
  return validator.validateEntity(data);
}

/**
 * Validates a component's data against its schema
 */
export function validateComponentData<T extends keyof ComponentDataMap>(
  _componentType: T,
  data: unknown,
): IValidationResult<ComponentDataMap[T]> {
  try {
    // Import the actual component schema for validation
    // This is a placeholder - would need to import actual schemas
    const validatedData = data as ComponentDataMap[T];

    return {
      success: true,
      data: validatedData,
      errors: [],
      warnings: [],
    };
  } catch (error) {
    return {
      success: false,
      errors: [
        {
          path: 'component',
          message: error instanceof Error ? error.message : 'Invalid component data',
          value: data,
        },
      ],
      warnings: [],
    };
  }
}

/**
 * Batch validation for multiple scenes
 */
export async function validateSceneBatch(
  scenes: Array<{ name: string; data: unknown }>,
): Promise<Array<{ name: string; result: IValidationResult<SceneData> }>> {
  const validator = new SceneValidator();

  return scenes.map(({ name, data }) => ({
    name,
    result: validator.validateScene(data),
  }));
}
