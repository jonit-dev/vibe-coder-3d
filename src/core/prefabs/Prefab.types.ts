import { z } from 'zod';

export const PrefabVersionSchema = z.number().int().min(1).default(1);

export const PrefabEntitySchema: z.ZodType<IPrefabEntity> = z.lazy(() =>
  z.object({
    name: z.string(),
    components: z.record(z.string(), z.unknown()),
    children: z.array(PrefabEntitySchema).default([]),
  }),
);

export type IPrefabEntity = {
  name: string;
  components: Record<string, unknown>;
  children?: IPrefabEntity[];
};

export const PrefabDefinitionSchema = z.object({
  id: z.string(),
  name: z.string(),
  version: PrefabVersionSchema,
  root: PrefabEntitySchema,
  metadata: z.record(z.string(), z.unknown()).default({}),
  dependencies: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  description: z.string().optional(),
});

export type IPrefabDefinition = z.infer<typeof PrefabDefinitionSchema>;

export const PrefabVariantSchema = z.object({
  id: z.string(),
  baseId: z.string(),
  name: z.string(),
  version: PrefabVersionSchema,
  patch: z.unknown().optional(),
});

export type IPrefabVariant = z.infer<typeof PrefabVariantSchema>;

export interface IPrefabAssetMeta {
  id: string;
  name: string;
  path: string;
  description?: string;
  tags?: string[];
}

export interface IInstantiateOptions {
  parentEntityId?: number | null;
  applyOverrides?: unknown;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
}

export interface IPrefabOverrideRules {
  allowStructuralChanges: boolean;
}
