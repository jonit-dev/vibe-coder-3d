import { z } from 'zod';

export const MaterialShaderSchema = z.enum(['standard', 'unlit']);
export const MaterialTypeSchema = z.enum(['solid', 'texture']);

export const MaterialDefinitionSchema = z.object({
  id: z.string(),
  name: z.string(),
  shader: MaterialShaderSchema.default('standard'),
  materialType: MaterialTypeSchema.default('solid'),
  // Main
  color: z.string().default('#cccccc'),
  metalness: z.number().default(0),
  roughness: z.number().default(0.7),
  // Emission
  emissive: z.string().default('#000000'),
  emissiveIntensity: z.number().default(0),
  // Textures
  albedoTexture: z.string().optional(),
  normalTexture: z.string().optional(),
  metallicTexture: z.string().optional(),
  roughnessTexture: z.string().optional(),
  emissiveTexture: z.string().optional(),
  occlusionTexture: z.string().optional(),
  // Texture xform
  normalScale: z.number().default(1),
  occlusionStrength: z.number().default(1),
  textureOffsetX: z.number().default(0),
  textureOffsetY: z.number().default(0),
  textureRepeatX: z.number().default(1),
  textureRepeatY: z.number().default(1),
});

export type IMaterialDefinition = z.infer<typeof MaterialDefinitionSchema>;

export interface IMaterialAssetMeta {
  id: string;
  name: string;
  path: string; // /assets/materials/whatever.mat.json
}
