import { z } from 'zod';

export const AttributeTypeSchema = z.enum([
  'float32',
  'float16',
  'uint32',
  'uint16',
  'uint8',
  'int32',
  'int16',
  'int8',
]);

export type AttributeType = z.infer<typeof AttributeTypeSchema>;

export const AccessorSchema = z.object({
  itemSize: z.number().int().min(1),
  normalized: z.boolean().default(false),
  // One of the following data sources must be provided
  array: z.array(z.number()).optional(), // Inline numbers (JSON)
  uri: z.string().optional(), // External .bin or data URI
  type: AttributeTypeSchema.default('float32'),
});

export type IAccessor = z.infer<typeof AccessorSchema>;

export const GeometryMetaSchema = z.object({
  meta: z.object({
    version: z.string().default('1.0.0'),
    generator: z.string().default('vibe-geometry-exporter'),
    name: z.string().optional(),
    tags: z.array(z.string()).optional(),
    category: z.string().optional(), // e.g., "Forest/Trees", "Environment/Rocks"
  }),
  attributes: z.object({
    position: AccessorSchema, // required
    normal: AccessorSchema.optional(), // optional
    uv: AccessorSchema.optional(), // optional
    color: AccessorSchema.optional(), // optional
    tangent: AccessorSchema.optional(), // optional (xyz + w)
    // Future: skinIndex, skinWeight, morphAttributes, etc.
  }),
  index: AccessorSchema.optional(),
  groups: z
    .array(
      z.object({
        start: z.number().int(),
        count: z.number().int(),
        materialIndex: z.number().int().optional(),
      }),
    )
    .optional(),
  drawRange: z.object({ start: z.number().int(), count: z.number().int() }).optional(),
  bounds: z
    .object({
      aabb: z
        .tuple([
          z.tuple([z.number(), z.number(), z.number()]),
          z.tuple([z.number(), z.number(), z.number()]),
        ])
        .optional(),
      sphere: z
        .object({ center: z.tuple([z.number(), z.number(), z.number()]), radius: z.number() })
        .optional(),
    })
    .optional(),
});

export type IGeometryMeta = z.infer<typeof GeometryMetaSchema>;
export type IGeometryGroup = NonNullable<z.infer<typeof GeometryMetaSchema>['groups']>[number];
export type IGeometryBounds = z.infer<typeof GeometryMetaSchema>['bounds'];
