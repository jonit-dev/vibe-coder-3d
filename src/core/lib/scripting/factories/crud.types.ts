/**
 * CRUD Types and Schemas for GameObject API
 * Defines runtime creation options for primitives and models with Zod validation
 */

import { z } from 'zod';

// Transform schema
export const TransformOptionsSchema = z.object({
  position: z.tuple([z.number(), z.number(), z.number()]).optional(),
  rotation: z.tuple([z.number(), z.number(), z.number()]).optional(),
  scale: z.union([z.number(), z.tuple([z.number(), z.number(), z.number()])]).optional(),
});

export type ITransformOptions = z.infer<typeof TransformOptionsSchema>;

// Material schema
export const MaterialOptionsSchema = z.object({
  color: z.string().optional(),
  metalness: z.number().min(0).max(1).optional(),
  roughness: z.number().min(0).max(1).optional(),
});

export type IMaterialOptions = z.infer<typeof MaterialOptionsSchema>;

// Physics schema
export const PhysicsOptionsSchema = z.object({
  body: z.enum(['dynamic', 'kinematic', 'static']).optional(),
  collider: z.enum(['box', 'sphere', 'mesh']).optional(),
  mass: z.number().positive().optional(),
});

export type IPhysicsOptions = z.infer<typeof PhysicsOptionsSchema>;

// Primitive options schema
export const PrimitiveOptionsSchema = z.object({
  name: z.string().optional(),
  parent: z.number().int().nonnegative().optional(),
  transform: TransformOptionsSchema.optional(),
  material: MaterialOptionsSchema.optional(),
  physics: PhysicsOptionsSchema.optional(),
});

export type IPrimitiveOptions = z.infer<typeof PrimitiveOptionsSchema>;

// Model options schema
export const ModelOptionsSchema = PrimitiveOptionsSchema.extend({
  physics: z
    .object({
      body: z.enum(['dynamic', 'kinematic', 'static']).optional(),
      collider: z.enum(['mesh', 'box']).optional(),
      mass: z.number().positive().optional(),
    })
    .optional(),
});

export type IModelOptions = z.infer<typeof ModelOptionsSchema>;

// Clone overrides schema
export const CloneOverridesSchema = z.object({
  name: z.string().optional(),
  parent: z.number().int().nonnegative().optional(),
  transform: TransformOptionsSchema.optional(),
});

export type ICloneOverrides = z.infer<typeof CloneOverridesSchema>;

// Primitive types
export type PrimitiveKind = 'cube' | 'sphere' | 'plane' | 'cylinder' | 'cone' | 'torus';

// Component attachment schema
export const ComponentAttachmentSchema = z.object({
  type: z.string(),
  data: z.unknown(),
});

export type IComponentAttachment = z.infer<typeof ComponentAttachmentSchema>;
