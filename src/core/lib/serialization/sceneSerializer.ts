import { z } from 'zod';

// Enhanced schema for scene serialization
export const SceneSchema = z.object({
  version: z.number(),
  name: z.string().optional(),
  timestamp: z.string().optional(),
  entities: z.array(z.object({
    id: z.union([z.string(), z.number()]), // Support both string and numeric IDs
    name: z.string(),
    parentId: z.union([z.string(), z.number()]).optional().nullable(),
    components: z.record(z.any()),
  })),
});

export interface ISerializedScene extends z.infer<typeof SceneSchema> {}

export interface ISceneMetadata {
  name?: string;
  timestamp?: string;
  version: number;
}

/**
 * Normalizes entity ID to string format for consistent serialization
 */
const normalizeEntityId = (id: string | number): string => {
  return typeof id === 'number' ? id.toString() : id;
};

/**
 * Serializes scene entities to JSON format with metadata
 * Enforces consistent string IDs and validates output
 */
export const exportScene = (
  entities: Array<{
    id: string | number;
    name: string;
    parentId?: string | number | null;
  }>,
  getComponentsForEntity: (entityId: string | number) => Array<{ type: string; data: any }>,
  metadata: Partial<ISceneMetadata> = {}
): ISerializedScene => {
  const serializedEntities = entities.map((entity) => {
    const normalizedId = normalizeEntityId(entity.id);
    const entityComponents = getComponentsForEntity(entity.id);

    const entityData = {
      id: normalizedId,
      name: entity.name || `Entity ${normalizedId}`,
      parentId: entity.parentId ? normalizeEntityId(entity.parentId) : null,
      components: {} as Record<string, any>,
    };

    entityComponents.forEach((component) => {
      if (component.data) {
        entityData.components[component.type] = component.data;
      }
    });

    return entityData;
  });

  const scene: ISerializedScene = {
    version: metadata.version || 4,
    name: metadata.name,
    timestamp: metadata.timestamp || new Date().toISOString(),
    entities: serializedEntities,
  };

  // Validate the serialized scene before returning
  const validation = validateScene(scene);
  if (!validation.isValid) {
    throw new Error(`Scene serialization validation failed: ${validation.error}`);
  }

  return scene;
};

/**
 * Imports scene from JSON format with validation and type conversion
 */
export const importScene = async (
  scene: unknown,
  entityManager: {
    clearEntities: () => void;
    createEntity: (name: string, parentId?: string | number | null) => { id: string | number };
  },
  componentManager: {
    addComponent: (entityId: string | number, componentType: string, componentData: any) => void;
  }
): Promise<void> => {
  // Validate scene structure with detailed error reporting
  let validatedScene: z.infer<typeof SceneSchema>;

  try {
    validatedScene = SceneSchema.parse(scene);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorDetails = error.errors.map(err =>
        `${err.path.join('.')}: Expected ${err.expected}, got ${err.received} (${err.message})`
      ).join('\n');

      throw new Error(`Scene validation failed:\n${errorDetails}`);
    }
    throw error;
  }

  if (!validatedScene || !validatedScene.entities) {
    throw new Error('Invalid scene data: missing entities array');
  }

  console.log(`[SceneSerializer] Importing scene with ${validatedScene.entities.length} entities`);

  // Clear existing entities first
  entityManager.clearEntities();

  // Import entities with better error handling
  const importErrors: string[] = [];

  for (const entityData of validatedScene.entities) {
    try {
      // Convert IDs to the format expected by the entity manager
      const parentId = entityData.parentId ?
        (typeof entityData.parentId === 'string' ? entityData.parentId : entityData.parentId.toString())
        : null;

      const entity = entityManager.createEntity(
        entityData.name || `Entity ${entityData.id}`,
        parentId
      );

      // Add components
      const componentEntries = Object.entries(entityData.components || {});
      for (const [componentType, componentData] of componentEntries) {
        if (componentData) {
          componentManager.addComponent(entity.id, componentType, componentData);
        }
      }

      console.log(`[SceneSerializer] Successfully imported entity: ${entityData.name} (${entityData.id}) with ${componentEntries.length} components`);
    } catch (error) {
      const errorMessage = `Failed to import entity ${entityData.name} (${entityData.id}): ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(`[SceneSerializer] ${errorMessage}`, entityData);
      importErrors.push(errorMessage);
    }
  }

  // Report any import errors but don't fail completely
  if (importErrors.length > 0) {
    console.warn(`[SceneSerializer] Scene imported with ${importErrors.length} errors:`, importErrors);
  } else {
    console.log(`[SceneSerializer] Scene imported successfully: ${validatedScene.entities.length} entities`);
  }
};

/**
 * Validates scene data without importing
 */
export const validateScene = (scene: unknown): { isValid: boolean; error?: string } => {
  try {
    SceneSchema.parse(scene);
    return { isValid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { isValid: false, error: error.errors.map(e => e.message).join(', ') };
    }
    return { isValid: false, error: 'Unknown validation error' };
  }
};