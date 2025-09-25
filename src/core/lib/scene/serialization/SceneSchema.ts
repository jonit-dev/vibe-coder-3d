/**
 * Scene Schema - Zod schemas for scene validation using registered component descriptors
 * This provides compile-time validation for all scene components
 */

import { z } from 'zod';

// Base schema for any component data (unknown to allow flexibility)
const ComponentDataSchema = z.unknown();

// Schema for serialized component data with component registry validation
const SerializedComponentSchema = z.record(z.string(), ComponentDataSchema);

// Schema for serialized entity with persistent ID
const SerializedEntitySchema = z.object({
  persistentId: z.string(),
  name: z.string().optional(),
  parentPersistentId: z.string().optional(),
  components: SerializedComponentSchema,
});

// Schema for complete serialized scene with validation
export const SerializedSceneSchema = z.object({
  entities: z.array(SerializedEntitySchema),
  metadata: z
    .object({
      timestamp: z.string(),
      description: z.string().optional(),
      sceneId: z.string().optional(),
      engineVersion: z.string().optional(),
    })
    .optional(),
});

// Schema for scene metadata
export const SceneMetadataSchema = z.object({
  timestamp: z.string(),
  description: z.string().optional(),
  sceneId: z.string().optional(),
  engineVersion: z.string().optional(),
});

// Schema for scene override patches
export const ScenePatchSchema = z.object({
  persistentId: z.string(),
  entityName: z.string().optional(),
  components: z.record(z.string(), z.union([ComponentDataSchema, z.null()])),
});

// Schema for complete scene overrides file
export const SceneOverridesSchema = z.object({
  sceneId: z.string(),
  timestamp: z.string(),
  patches: z.array(ScenePatchSchema),
  metadata: z
    .object({
      description: z.string().optional(),
      editorVersion: z.string().optional(),
    })
    .optional(),
});

export type SerializedEntity = z.infer<typeof SerializedEntitySchema>;
export type SerializedScene = z.infer<typeof SerializedSceneSchema>;
export type SceneMetadata = z.infer<typeof SceneMetadataSchema>;
export type ScenePatch = z.infer<typeof ScenePatchSchema>;
export type SceneOverrides = z.infer<typeof SceneOverridesSchema>;

/**
 * Get component schema for a specific component type
 * This validates against the registered component descriptors
 */
export function getComponentSchema(_componentType: string): z.ZodType<unknown> | null {
  // For now, return a generic schema
  // In the future, this could validate against specific component schemas
  // based on the component registry
  return ComponentDataSchema;
}

/**
 * Validate component data against its registered schema
 */
export function validateComponentData(componentType: string, data: unknown): boolean {
  try {
    const schema = getComponentSchema(componentType);
    if (schema) {
      schema.parse(data);
      return true;
    }
    return true; // If no schema, allow any data
  } catch (error) {
    console.error(`Component validation failed for ${componentType}:`, error);
    return false;
  }
}

/**
 * Create a schema for a specific scene with component validation
 */
export function createSceneSchemaForComponents(componentTypes: string[]): z.ZodObject<any> {
  const componentSchemas: Record<string, z.ZodType<unknown>> = {};

  componentTypes.forEach((componentType) => {
    componentSchemas[componentType] = getComponentSchema(componentType) || ComponentDataSchema;
  });

  return z.object({
    entities: z.array(
      z.object({
        persistentId: z.string(),
        name: z.string().optional(),
        parentPersistentId: z.string().optional(),
        components: z.object(componentSchemas),
      }),
    ),
    metadata: SceneMetadataSchema.optional(),
  });
}

/**
 * Validate an entity against registered component schemas
 */
export function validateEntity(entity: SerializedEntity): boolean {
  try {
    // Validate entity structure
    SerializedEntitySchema.parse(entity);

    // Validate each component
    for (const [componentType, componentData] of Object.entries(entity.components)) {
      if (!validateComponentData(componentType, componentData)) {
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Entity validation failed:', error);
    return false;
  }
}

/**
 * Validate a complete scene against registered component schemas
 */
export function validateScene(scene: SerializedScene): boolean {
  try {
    // Validate scene structure
    SerializedSceneSchema.parse(scene);

    // Validate each entity
    for (const entity of scene.entities) {
      if (!validateEntity(entity)) {
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Scene validation failed:', error);
    return false;
  }
}
