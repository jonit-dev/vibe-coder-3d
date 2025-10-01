import { z } from 'zod';
import type { IComponent } from '../../IComponent';

export const PrefabInstanceSchema = z.object({
  prefabId: z.string(),
  version: z.number().int().min(1),
  instanceUuid: z.string(),
  overridePatch: z.unknown().optional(),
});

export type IPrefabInstance = z.infer<typeof PrefabInstanceSchema>;

export const PrefabInstanceComponent: IComponent<IPrefabInstance> = {
  name: 'PrefabInstance',
  schema: PrefabInstanceSchema,
  defaultValue: () => ({
    prefabId: '',
    version: 1,
    instanceUuid: crypto.randomUUID(),
    overridePatch: undefined,
  }),
};
