import { z } from 'zod';

// Zod schema for MeshType enum values
export const MeshTypeEnumSchema = z.nativeEnum({
  Cube: 0,
  Sphere: 1,
  Cylinder: 2,
  Cone: 3,
  Torus: 4,
  Plane: 5,
});

// ECS Component schemas
export const Vector3Schema = z.tuple([z.number(), z.number(), z.number()]);
export const QuaternionSchema = z.tuple([z.number(), z.number(), z.number(), z.number()]);
export const RGBColorSchema = z.tuple([
  z.number().min(0).max(1),
  z.number().min(0).max(1),
  z.number().min(0).max(1),
]);

// Transform component schema
export const TransformComponentSchema = z.object({
  position: Vector3Schema.default([0, 0, 0]),
  rotation: Vector3Schema.default([0, 0, 0]), // Euler angles
  scale: Vector3Schema.default([1, 1, 1]),
  needsUpdate: z.number().int().min(0).max(1).default(1),
});

// Velocity component schema
export const VelocityComponentSchema = z.object({
  linear: Vector3Schema.default([0, 0, 0]),
  angular: Vector3Schema.default([0, 0, 0]),
  linearDamping: z.number().min(0).max(1).default(0.01),
  angularDamping: z.number().min(0).max(1).default(0.01),
  priority: z.number().int().min(0).max(255).default(1),
});

// Material component schema
export const MaterialComponentSchema = z.object({
  color: RGBColorSchema.default([0.2, 0.6, 1.0]),
  needsUpdate: z.number().int().min(0).max(1).default(1),
});

// Velocity options schema for addVelocity function
export const VelocityOptionsSchema = z.object({
  linear: Vector3Schema.optional(),
  angular: Vector3Schema.optional(),
  linearDamping: z.number().min(0).max(1).optional(),
  angularDamping: z.number().min(0).max(1).optional(),
  priority: z.number().int().min(0).max(255).optional(),
});

// Entity creation options schema
export const EntityCreationOptionsSchema = z.object({
  meshType: MeshTypeEnumSchema.default(0), // Cube
  position: Vector3Schema.optional(),
  rotation: Vector3Schema.optional(),
  scale: Vector3Schema.optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(), // Hex color
  name: z.string().max(32).optional(),
  velocity: VelocityOptionsSchema.optional(),
});

// Entity ID schema
export const EntityIdSchema = z.number().int().nonnegative();

// Entity query result schema
export const EntityQueryResultSchema = z.array(EntityIdSchema);

// World state schema
export const WorldStateSchema = z.object({
  version: z.number().int().nonnegative(),
  entityCount: z.number().int().nonnegative(),
  components: z.object({
    transform: z.number().int().nonnegative(),
    velocity: z.number().int().nonnegative(),
    material: z.number().int().nonnegative(),
    meshType: z.number().int().nonnegative(),
    name: z.number().int().nonnegative(),
  }),
});

// Export inferred types
export type IMeshTypeEnum = z.infer<typeof MeshTypeEnumSchema>;
export type IVector3 = z.infer<typeof Vector3Schema>;
export type IQuaternion = z.infer<typeof QuaternionSchema>;
export type IRGBColor = z.infer<typeof RGBColorSchema>;
export type ITransformComponent = z.infer<typeof TransformComponentSchema>;
export type IVelocityComponent = z.infer<typeof VelocityComponentSchema>;
export type IMaterialComponent = z.infer<typeof MaterialComponentSchema>;
export type IVelocityOptions = z.infer<typeof VelocityOptionsSchema>;
export type IEntityCreationOptions = z.infer<typeof EntityCreationOptionsSchema>;
export type IEntityId = z.infer<typeof EntityIdSchema>;
export type IEntityQueryResult = z.infer<typeof EntityQueryResultSchema>;
export type IWorldState = z.infer<typeof WorldStateSchema>;

// Validation helper functions
export const validateMeshType = (meshType: unknown): IMeshTypeEnum =>
  MeshTypeEnumSchema.parse(meshType);

export const validateVector3 = (vector: unknown): IVector3 => Vector3Schema.parse(vector);

export const validateQuaternion = (quaternion: unknown): IQuaternion =>
  QuaternionSchema.parse(quaternion);

export const validateRGBColor = (color: unknown): IRGBColor => RGBColorSchema.parse(color);

export const validateTransformComponent = (transform: unknown): ITransformComponent =>
  TransformComponentSchema.parse(transform);

export const validateVelocityComponent = (velocity: unknown): IVelocityComponent =>
  VelocityComponentSchema.parse(velocity);

export const validateVelocityOptions = (options: unknown): IVelocityOptions =>
  VelocityOptionsSchema.parse(options);

export const validateEntityCreationOptions = (options: unknown): IEntityCreationOptions =>
  EntityCreationOptionsSchema.parse(options);

export const validateEntityId = (id: unknown): IEntityId => EntityIdSchema.parse(id);

export const validateEntityQueryResult = (result: unknown): IEntityQueryResult =>
  EntityQueryResultSchema.parse(result);

export const validateWorldState = (state: unknown): IWorldState => WorldStateSchema.parse(state);

// Safe validation helpers
export const safeValidateMeshType = (meshType: unknown) => MeshTypeEnumSchema.safeParse(meshType);

export const safeValidateVector3 = (vector: unknown) => Vector3Schema.safeParse(vector);

export const safeValidateVelocityOptions = (options: unknown) =>
  VelocityOptionsSchema.safeParse(options);

export const safeValidateEntityCreationOptions = (options: unknown) =>
  EntityCreationOptionsSchema.safeParse(options);

// Utility functions for working with hex colors
export const validateHexColor = (color: string): boolean => {
  return /^#[0-9A-Fa-f]{6}$/.test(color);
};

export const hexToRGB = (hex: string): IRGBColor => {
  if (!validateHexColor(hex)) {
    throw new Error(`Invalid hex color: ${hex}`);
  }

  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  return validateRGBColor([r, g, b]);
};

export const rgbToHex = (rgb: IRGBColor): string => {
  const [r, g, b] = validateRGBColor(rgb);
  const rHex = Math.round(r * 255)
    .toString(16)
    .padStart(2, '0');
  const gHex = Math.round(g * 255)
    .toString(16)
    .padStart(2, '0');
  const bHex = Math.round(b * 255)
    .toString(16)
    .padStart(2, '0');

  return `#${rHex}${gHex}${bHex}`;
};
