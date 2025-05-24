import { z } from 'zod';

// Core asset metadata interfaces
export enum AssetKeys {
  NightStalkerModel = 'NightStalkerModel',
  // Add other asset keys as needed
}

export const AssetTypeSchema = z.enum(['gltf', 'fbx', 'obj', 'dae', 'texture', 'audio']);
export type AssetType = z.infer<typeof AssetTypeSchema>;

// Base asset metadata schema
export const BaseAssetMetadataSchema = z.object({
  key: z.nativeEnum(AssetKeys),
  type: AssetTypeSchema,
  url: z.string().url(),
});

// Animation configuration schema
export const AnimationConfigSchema = z.object({
  loop: z.boolean().default(true),
  timeScale: z.number().positive().default(1.0),
  clampWhenFinished: z.boolean().default(false),
  blendDuration: z.number().nonnegative().default(0.2),
  crossFadeEnabled: z.boolean().default(true),
});

// Physics configuration schema
export const PhysicsConfigSchema = z.object({
  enabled: z.boolean().default(false),
  mass: z.number().positive().default(1.0),
  friction: z.number().min(0).max(1).default(0.5),
  restitution: z.number().min(0).max(1).default(0.0),
  linearDamping: z.number().min(0).max(1).default(0.01),
  angularDamping: z.number().min(0).max(1).default(0.01),
  useGravity: z.boolean().default(true),
});

// Collision configuration schema
export const CollisionConfigSchema = z.object({
  enabled: z.boolean().default(false),
  type: z.enum(['static', 'dynamic', 'kinematic', 'characterController']).default('static'),
  shape: z.enum(['box', 'sphere', 'capsule', 'mesh', 'convexHull']).default('box'),
  height: z.number().positive().optional(),
  radius: z.number().positive().optional(),
  offset: z.tuple([z.number(), z.number(), z.number()]).default([0, 0, 0]),
  isTrigger: z.boolean().default(false),
  layer: z.string().default('default'),
});

// Level of Detail (LOD) configuration schema
const LODLevelSchema = z.object({
  distance: z.number().nonnegative(),
  detail: z.enum(['high', 'medium', 'low', 'ultralow']),
});

// GameObject configuration schema
export const GameObjectConfigSchema = z.object({
  tag: z.string().default('untagged'),
  layer: z.string().default('default'),
  isInteractive: z.boolean().default(false),
  isSelectable: z.boolean().default(false),
  castShadows: z.boolean().default(true),
  receiveShadows: z.boolean().default(true),
  cullingEnabled: z.boolean().default(true),
  LODLevels: z.array(LODLevelSchema).optional(),
});

// Debug mode configuration schema
export const DebugConfigSchema = z.object({
  enabled: z.boolean().default(false),
  showBoundingBox: z.boolean().default(false),
  showColliders: z.boolean().default(false),
  showSkeleton: z.boolean().default(false),
  showWireframe: z.boolean().default(false),
  showPhysicsForces: z.boolean().default(false),
  showVelocity: z.boolean().default(false),
  showObjectPivot: z.boolean().default(false),
  debugColor: z
    .tuple([z.number().min(0).max(1), z.number().min(0).max(1), z.number().min(0).max(1)])
    .default([0, 1, 0]),
  logToConsole: z.boolean().default(false),
});

// Model configuration schema
export const ModelConfigSchema = z.object({
  scale: z
    .union([
      z.number().positive(),
      z.tuple([z.number().positive(), z.number().positive(), z.number().positive()]),
    ])
    .default(1),
  position: z.tuple([z.number(), z.number(), z.number()]).default([0, 0, 0]),
  rotation: z.tuple([z.number(), z.number(), z.number()]).default([0, 0, 0]),
  offset: z.tuple([z.number(), z.number(), z.number()]).default([0, 0, 0]),

  // Animation properties
  initialAnimation: z.string().optional(),
  animations: z.array(z.string()).optional(),
  animationConfig: AnimationConfigSchema.optional(),

  // Game engine properties
  physics: PhysicsConfigSchema.optional(),
  collision: CollisionConfigSchema.optional(),
  gameObject: GameObjectConfigSchema.optional(),
  debugMode: DebugConfigSchema.optional(),
});

// Texture configuration schema
export const TextureConfigSchema = z.object({
  repeat: z.tuple([z.number().positive(), z.number().positive()]).default([1, 1]),
  filter: z.enum(['nearest', 'linear', 'mipmap']).default('linear'),
  mipmap: z.boolean().default(true),
  anisotropy: z.number().positive().max(16).default(1),
  encoding: z.enum(['linear', 'sRGB', 'RGBE', 'RGBM']).default('sRGB'),
  flipY: z.boolean().default(true),
  premultiplyAlpha: z.boolean().default(false),
  wrapS: z.enum(['clamp', 'repeat', 'mirror']).default('repeat'),
  wrapT: z.enum(['clamp', 'repeat', 'mirror']).default('repeat'),
  generateMipmaps: z.boolean().default(true),
  compression: z
    .enum(['none', 'default', 'ASTC', 'BPTC', 'ETC1', 'ETC2', 'S3TC', 'PVRTC'])
    .default('none'),
});

// Audio configuration schema
export const AudioConfigSchema = z.object({
  volume: z.number().min(0).max(1).default(1),
  loop: z.boolean().default(false),
  autoplay: z.boolean().default(false),
  spatial: z.boolean().default(false),
  maxDistance: z.number().positive().default(10000),
  rolloffFactor: z.number().positive().default(1),
});

// Model asset metadata schema
export const ModelAssetMetadataSchema = BaseAssetMetadataSchema.extend({
  type: z.enum(['gltf', 'fbx', 'obj', 'dae']),
  config: ModelConfigSchema,
});

// Texture asset metadata schema
export const TextureAssetMetadataSchema = BaseAssetMetadataSchema.extend({
  type: z.literal('texture'),
  config: TextureConfigSchema,
});

// Audio asset metadata schema
export const AudioAssetMetadataSchema = BaseAssetMetadataSchema.extend({
  type: z.literal('audio'),
  config: AudioConfigSchema,
});

// Union schema for all asset configs
export const AssetConfigSchema = z.union([
  ModelConfigSchema,
  TextureConfigSchema,
  AudioConfigSchema,
]);

// Union schema for all asset metadata
export const AssetMetadataUnionSchema = z.union([
  ModelAssetMetadataSchema,
  TextureAssetMetadataSchema,
  AudioAssetMetadataSchema,
]);

// Asset manifest schema
export const AssetManifestSchema = z.record(z.nativeEnum(AssetKeys), AssetMetadataUnionSchema);

// Export inferred types for backward compatibility
export type IAnimationConfig = z.infer<typeof AnimationConfigSchema>;
export type IPhysicsConfig = z.infer<typeof PhysicsConfigSchema>;
export type ICollisionConfig = z.infer<typeof CollisionConfigSchema>;
export type ILODLevel = z.infer<typeof LODLevelSchema>;
export type IGameObjectConfig = z.infer<typeof GameObjectConfigSchema>;
export type IDebugConfig = z.infer<typeof DebugConfigSchema>;
export type IModelConfig = z.infer<typeof ModelConfigSchema>;
export type ITextureConfig = z.infer<typeof TextureConfigSchema>;
export type IAudioConfig = z.infer<typeof AudioConfigSchema>;
export type IBaseAssetMetadata = z.infer<typeof BaseAssetMetadataSchema>;
export type IModelAssetMetadata = z.infer<typeof ModelAssetMetadataSchema>;
export type ITextureAssetMetadata = z.infer<typeof TextureAssetMetadataSchema>;
export type IAudioAssetMetadata = z.infer<typeof AudioAssetMetadataSchema>;
export type IAssetConfig = z.infer<typeof AssetConfigSchema>;
export type IAssetMetadataUnion = z.infer<typeof AssetMetadataUnionSchema>;
export type AssetManifest = z.infer<typeof AssetManifestSchema>;

// Validation helper functions
export const validateModelConfig = (config: unknown): IModelConfig =>
  ModelConfigSchema.parse(config);

export const validateTextureConfig = (config: unknown): ITextureConfig =>
  TextureConfigSchema.parse(config);

export const validateAudioConfig = (config: unknown): IAudioConfig =>
  AudioConfigSchema.parse(config);

export const validateAssetMetadata = (metadata: unknown): IAssetMetadataUnion =>
  AssetMetadataUnionSchema.parse(metadata);

export const validateAssetManifest = (manifest: unknown): AssetManifest =>
  AssetManifestSchema.parse(manifest);

// Safe parsing helpers that return results without throwing
export const safeValidateModelConfig = (config: unknown) => ModelConfigSchema.safeParse(config);

export const safeValidateAssetMetadata = (metadata: unknown) =>
  AssetMetadataUnionSchema.safeParse(metadata);

export const safeValidateAssetManifest = (manifest: unknown) =>
  AssetManifestSchema.safeParse(manifest);
