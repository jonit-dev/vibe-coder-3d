import { Types } from 'bitecs';
import { z } from 'zod';
import { ComponentCategory, ComponentFactory } from '../../ComponentRegistry';
import { EntityId } from '../../types';

// BitECS component interface for PrefabInstance component
export interface IPrefabInstanceBitECSComponent {
  prefabIdHash: Record<number, number>;
  version: Record<number, number>;
  instanceUuidHash: Record<number, number>;
  _prefabIdMap?: Map<number, string>;
  _instanceUuidMap?: Map<number, string>;
  _overridePatchMap?: Map<number, unknown>;
}

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
  serialize: (eid: EntityId, component: unknown) => {
    const prefabComponent = component as IPrefabInstanceBitECSComponent;
    return {
      prefabId: prefabComponent._prefabIdMap?.get(eid) || '',
      version: prefabComponent.version[eid] || 1,
      instanceUuid: prefabComponent._instanceUuidMap?.get(eid) || '',
      overridePatch: prefabComponent._overridePatchMap?.get(eid),
    };
  },
  deserialize: (eid: EntityId, data: IPrefabInstance, component: unknown) => {
    const prefabComponent = component as IPrefabInstanceBitECSComponent;

    // Initialize maps if they don't exist
    if (!prefabComponent._prefabIdMap) prefabComponent._prefabIdMap = new Map();
    if (!prefabComponent._instanceUuidMap) prefabComponent._instanceUuidMap = new Map();
    if (!prefabComponent._overridePatchMap) prefabComponent._overridePatchMap = new Map();

    // Store string data in maps, hashes in arrays
    prefabComponent._prefabIdMap.set(eid, data.prefabId);
    prefabComponent._instanceUuidMap.set(eid, data.instanceUuid);
    prefabComponent._overridePatchMap.set(eid, data.overridePatch);

    prefabComponent.prefabIdHash[eid] = hashString(data.prefabId);
    prefabComponent.version[eid] = data.version;
    prefabComponent.instanceUuidHash[eid] = hashString(data.instanceUuid);
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
