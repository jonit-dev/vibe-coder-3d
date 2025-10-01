import { Types } from 'bitecs';
import { z } from 'zod';
import { ComponentCategory, ComponentFactory } from '../../ComponentRegistry';

export const PrefabInstanceSchema = z.object({
  prefabId: z.string(),
  version: z.number().int().min(1),
  instanceUuid: z.string(),
  overridePatch: z.unknown().optional(),
});

export type IPrefabInstance = z.infer<typeof PrefabInstanceSchema>;

export const PrefabInstanceComponent = ComponentFactory.create({
  id: 'PrefabInstance',
  name: 'Prefab Instance',
  category: ComponentCategory.Core,
  schema: PrefabInstanceSchema,
  fields: {
    prefabIdHash: Types.ui32, // Hash of prefabId string for performance
    version: Types.ui32,
    instanceUuidHash: Types.ui32, // Hash of instanceUuid string
  },
  serialize: (eid, component: any) => ({
    prefabId: component._prefabIdMap?.get(eid) || '',
    version: component.version[eid] || 1,
    instanceUuid: component._instanceUuidMap?.get(eid) || '',
    overridePatch: component._overridePatchMap?.get(eid),
  }),
  deserialize: (eid, data, component: any) => {
    // Initialize maps if they don't exist
    if (!component._prefabIdMap) component._prefabIdMap = new Map();
    if (!component._instanceUuidMap) component._instanceUuidMap = new Map();
    if (!component._overridePatchMap) component._overridePatchMap = new Map();

    // Store string data in maps, hashes in arrays
    component._prefabIdMap.set(eid, data.prefabId);
    component._instanceUuidMap.set(eid, data.instanceUuid);
    component._overridePatchMap.set(eid, data.overridePatch);

    component.prefabIdHash[eid] = hashString(data.prefabId);
    component.version[eid] = data.version;
    component.instanceUuidHash[eid] = hashString(data.instanceUuid);
  },
  metadata: {
    description: 'Marks an entity as an instance of a prefab',
    version: '1.0.0',
  },
});

// Simple string hash function for IDs
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}
