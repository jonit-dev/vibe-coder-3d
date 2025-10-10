#!/usr/bin/env tsx
/**
 * Scene Validation Script
 *
 * Validates a scene file to ensure it can be loaded without errors.
 *
 * Usage:
 *   yarn verify:scene src/game/scenes/Test.tsx
 *
 * Exit codes:
 *   0 - Scene is valid
 *   1 - Scene has validation errors
 */

import { resolve } from 'path';
import { z } from 'zod';

// Import schemas
import { SerializedEntitySchema } from '../src/core/lib/serialization/EntitySerializer';

const SceneMetadataSchema = z.object({
  name: z.string(),
  version: z.number(),
  timestamp: z.string(),
  author: z.string().optional(),
  description: z.string().optional(),
});

const SceneDataSchema = z.object({
  metadata: SceneMetadataSchema,
  entities: z.array(z.unknown()),
  materials: z.array(z.unknown()),
  prefabs: z.array(z.unknown()),
  inputAssets: z.array(z.unknown()).optional(),
});

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  entityCount: number;
  sceneName: string;
}

async function validateScene(scenePath: string): Promise<ValidationResult> {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    entityCount: 0,
    sceneName: '',
  };

  try {
    // Resolve absolute path
    const absolutePath = resolve(process.cwd(), scenePath);

    console.log(`\n🔍 Validating scene: ${scenePath}\n`);

    // Import the scene file
    const sceneModule = await import(absolutePath);
    const sceneDefinition = sceneModule.default;

    if (!sceneDefinition || !sceneDefinition.data) {
      result.isValid = false;
      result.errors.push(
        'Scene file must export a default scene definition created with defineScene()',
      );
      return result;
    }

    const sceneData = sceneDefinition.data;

    // Validate scene structure
    try {
      const validatedScene = SceneDataSchema.parse(sceneData);
      result.sceneName = validatedScene.metadata.name;
      result.entityCount = validatedScene.entities.length;

      console.log(`✅ Scene metadata valid`);
      console.log(`   Name: ${validatedScene.metadata.name}`);
      console.log(`   Version: ${validatedScene.metadata.version}`);
      console.log(`   Entities: ${validatedScene.entities.length}`);
      console.log(`   Materials: ${validatedScene.materials.length}`);
      console.log(`   Prefabs: ${validatedScene.prefabs.length}`);
      if (validatedScene.inputAssets) {
        console.log(`   Input Assets: ${validatedScene.inputAssets.length}`);
      }
      console.log();
    } catch (error) {
      result.isValid = false;
      if (error instanceof z.ZodError) {
        result.errors.push('Scene structure validation failed:');
        error.errors.forEach((err) => {
          result.errors.push(`  - ${err.path.join('.')}: ${err.message}`);
        });
      } else {
        result.errors.push(`Scene validation error: ${error}`);
      }
      return result;
    }

    // Validate each entity
    console.log('🔍 Validating entities...\n');

    const entityIdMap = new Map<string | number, number>();
    let autoIdCounter = 0;

    sceneData.entities.forEach((entity: any, index: number) => {
      try {
        // Validate entity structure (allowing optional id)
        const EntitySchema = z.object({
          id: z.union([z.number(), z.string()]).optional(),
          name: z.string(),
          parentId: z.union([z.number(), z.string()]).optional().nullable(),
          components: z.record(z.unknown()),
        });

        EntitySchema.parse(entity);

        // Track entity ID (auto-generate if missing)
        const entityId = entity.id ?? autoIdCounter++;

        if (entityIdMap.has(entityId)) {
          result.warnings.push(`Entity ${index} (${entity.name}): Duplicate ID "${entityId}"`);
        }
        entityIdMap.set(entityId, index);

        // Validate components exist
        const componentCount = Object.keys(entity.components).length;
        if (componentCount === 0) {
          result.warnings.push(`Entity ${index} (${entity.name}): No components defined`);
        }

        // Check for common required components
        if (!entity.components.Transform) {
          result.warnings.push(
            `Entity ${index} (${entity.name}): Missing Transform component (recommended)`,
          );
        }

        // Validate parent-child relationships
        if (entity.parentId !== undefined && entity.parentId !== null) {
          if (!entityIdMap.has(entity.parentId)) {
            result.errors.push(
              `Entity ${index} (${entity.name}): Parent ID "${entity.parentId}" not found. ` +
                `Parent entities must be defined before their children.`,
            );
            result.isValid = false;
          }
        }

        console.log(
          `✅ Entity ${index}: ${entity.name} (${componentCount} components)${entity.id === undefined ? ' [auto-ID]' : ''}`,
        );
      } catch (error) {
        result.isValid = false;
        if (error instanceof z.ZodError) {
          result.errors.push(`Entity ${index} (${entity.name || 'unnamed'}): Validation failed`);
          error.errors.forEach((err) => {
            result.errors.push(`  - ${err.path.join('.')}: ${err.message}`);
          });
        } else {
          result.errors.push(`Entity ${index}: ${error}`);
        }
      }
    });

    console.log();

    // Check for PersistentId usage
    const entitiesWithPersistentId = sceneData.entities.filter(
      (e: any) => e.components.PersistentId,
    );
    const entitiesWithoutPersistentId = sceneData.entities.filter(
      (e: any) => !e.components.PersistentId,
    );

    if (entitiesWithoutPersistentId.length > 0) {
      console.log(
        `ℹ️  ${entitiesWithoutPersistentId.length} entities will have auto-generated PersistentId UUIDs`,
      );
    }
    if (entitiesWithPersistentId.length > 0) {
      console.log(
        `ℹ️  ${entitiesWithPersistentId.length} entities have manual PersistentId values`,
      );
    }

    // Check for entity ID usage
    const entitiesWithId = sceneData.entities.filter((e: any) => e.id !== undefined);
    const entitiesWithoutId = sceneData.entities.filter((e: any) => e.id === undefined);

    if (entitiesWithoutId.length > 0) {
      console.log(
        `ℹ️  ${entitiesWithoutId.length} entities will have auto-generated IDs from array position`,
      );
    }
    if (entitiesWithId.length > 0) {
      console.log(`ℹ️  ${entitiesWithId.length} entities have manual ID values`);
    }
  } catch (error) {
    result.isValid = false;
    result.errors.push(`Failed to load scene file: ${error}`);
  }

  return result;
}

async function main() {
  const scenePath = process.argv[2];

  if (!scenePath) {
    console.error('\n❌ Error: Scene path required\n');
    console.log('Usage: yarn verify:scene <path-to-scene>\n');
    console.log('Example: yarn verify:scene src/game/scenes/Test.tsx\n');
    process.exit(1);
  }

  const result = await validateScene(scenePath);

  console.log('\n' + '='.repeat(60));

  if (result.isValid) {
    console.log('\n✅ Scene validation PASSED\n');

    if (result.warnings.length > 0) {
      console.log('⚠️  Warnings:');
      result.warnings.forEach((warning) => console.log(`   ${warning}`));
      console.log();
    }

    console.log(`Scene: ${result.sceneName}`);
    console.log(`Entities: ${result.entityCount}`);
    console.log();

    process.exit(0);
  } else {
    console.log('\n❌ Scene validation FAILED\n');

    console.log('Errors:');
    result.errors.forEach((error) => console.log(`   ${error}`));
    console.log();

    if (result.warnings.length > 0) {
      console.log('Warnings:');
      result.warnings.forEach((warning) => console.log(`   ${warning}`));
      console.log();
    }

    process.exit(1);
  }
}

main().catch((error) => {
  console.error('\n❌ Unexpected error:', error);
  process.exit(1);
});
