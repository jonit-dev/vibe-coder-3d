import { z } from 'zod';
import { MaterialDefinitionSchema } from '../../../materials/Material.types';
import { PrefabDefinitionSchema } from '../../../prefabs/Prefab.types';
import { InputActionsAssetSchema } from '../../input/inputTypes';

/**
 * Validation result interface
 */
export interface IValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Scene data schema for JSON format
 * Reuses the same schema from SceneSerializer/SceneDeserializer
 */
export const SceneDataSchema = z.object({
  metadata: z.object({
    name: z.string(),
    version: z.number(),
    timestamp: z.string(),
    author: z.string().optional(),
    description: z.string().optional(),
  }),
  entities: z.array(z.any()), // Validated by EntitySerializer
  materials: z.array(MaterialDefinitionSchema),
  prefabs: z.array(PrefabDefinitionSchema),
  inputAssets: z.array(InputActionsAssetSchema).optional(),
});

/**
 * Validate scene data using Zod schema
 * @param data - The scene data to validate
 * @returns Validation result
 */
export const validateSceneData = (data: unknown): IValidationResult => {
  try {
    SceneDataSchema.parse(data);
    return { isValid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        error: error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
      };
    }
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Unknown validation error',
    };
  }
};
