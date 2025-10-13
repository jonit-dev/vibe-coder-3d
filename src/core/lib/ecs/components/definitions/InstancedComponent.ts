/**
 * Instanced Component Definition
 * Handles rendering many identical meshes efficiently using THREE.InstancedMesh
 */

import { Types } from 'bitecs';
import { z } from 'zod';

import { ComponentCategory, ComponentFactory } from '../../ComponentRegistry';
import { EntityId } from '../../types';
import { getRgbAsHex, setRgbValues } from '../../utils/colorUtils';
import { getStringFromHash, storeString } from '../../utils/stringHashUtils';

// Single instance data schema
const InstanceDataSchema = z.object({
  position: z.tuple([z.number(), z.number(), z.number()]),
  rotation: z.tuple([z.number(), z.number(), z.number()]).optional(),
  scale: z.tuple([z.number(), z.number(), z.number()]).optional(),
  color: z.tuple([z.number(), z.number(), z.number()]).optional(),
  userData: z.record(z.unknown()).optional(),
});

// Instanced Component Schema
const InstancedComponentSchema = z.object({
  enabled: z.boolean().default(true),
  capacity: z.number().int().min(1).max(100000).default(100),
  baseMeshId: z.string(),
  baseMaterialId: z.string(),
  instances: z.array(InstanceDataSchema).default([]),
  castShadows: z.boolean().default(true),
  receiveShadows: z.boolean().default(true),
  frustumCulled: z.boolean().default(true),
});

// Instanced Component Definition
export const instancedComponent = ComponentFactory.create({
  id: 'Instanced',
  name: 'Instanced Mesh',
  category: ComponentCategory.Rendering,
  schema: InstancedComponentSchema,
  incompatibleComponents: ['MeshRenderer', 'Camera', 'Light'],
  fields: {
    enabled: Types.ui8,
    capacity: Types.ui32,
    instanceCount: Types.ui32, // Current number of instances
    castShadows: Types.ui8,
    receiveShadows: Types.ui8,
    frustumCulled: Types.ui8,
    baseMeshIdHash: Types.ui32,
    baseMaterialIdHash: Types.ui32,
    needsUpdate: Types.ui8, // Flag to trigger buffer updates
  },
  serialize: (eid: EntityId, component: unknown) => {
    const comp = component as Record<string, Float32Array | Uint8Array | Uint32Array>;

    // Get instance data from external storage (managed by InstanceSystem)
    const instances = (globalThis as any).__instanceData__?.[eid] || [];

    return {
      enabled: Boolean(comp.enabled[eid]),
      capacity: comp.capacity[eid],
      baseMeshId: getStringFromHash(comp.baseMeshIdHash[eid]),
      baseMaterialId: getStringFromHash(comp.baseMaterialIdHash[eid]),
      instances,
      castShadows: Boolean(comp.castShadows[eid]),
      receiveShadows: Boolean(comp.receiveShadows[eid]),
      frustumCulled: Boolean(comp.frustumCulled[eid]),
    };
  },
  deserialize: (eid: EntityId, data: Record<string, unknown>, component: unknown) => {
    const comp = component as Record<string, Float32Array | Uint8Array | Uint32Array>;
    const instanceData = data as Partial<InstancedComponentData>;

    comp.enabled[eid] = (instanceData.enabled ?? true) ? 1 : 0;
    comp.capacity[eid] = instanceData.capacity ?? 100;
    comp.instanceCount[eid] = instanceData.instances?.length ?? 0;
    comp.castShadows[eid] = (instanceData.castShadows ?? true) ? 1 : 0;
    comp.receiveShadows[eid] = (instanceData.receiveShadows ?? true) ? 1 : 0;
    comp.frustumCulled[eid] = (instanceData.frustumCulled ?? true) ? 1 : 0;
    comp.baseMeshIdHash[eid] = storeString(instanceData.baseMeshId || '');
    comp.baseMaterialIdHash[eid] = storeString(instanceData.baseMaterialId || '');
    comp.needsUpdate[eid] = 1;

    // Store instance data externally (arrays of varying length can't fit in BitECS)
    if (!((globalThis as any).__instanceData__)) {
      (globalThis as any).__instanceData__ = {};
    }
    (globalThis as any).__instanceData__[eid] = instanceData.instances || [];
  },
  dependencies: ['Transform'],
  conflicts: ['MeshRenderer', 'Camera', 'Light'],
  metadata: {
    description: 'Efficiently renders many identical meshes using GPU instancing',
    version: '1.0.0',
  },
});

export type InstancedComponentData = z.infer<typeof InstancedComponentSchema>;
export type InstanceData = z.infer<typeof InstanceDataSchema>;
