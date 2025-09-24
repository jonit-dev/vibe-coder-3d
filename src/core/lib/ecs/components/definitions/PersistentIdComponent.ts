/**
 * Persistent ID Component Definition
 * Provides stable entity identity across save/load cycles
 */

import { Types } from 'bitecs';
import { z } from 'zod';

import { ComponentCategory, ComponentFactory } from '../../ComponentRegistry';
import { EntityId } from '../../types';

// Persistent ID Schema - accepts UUID or deterministic hash strings
export const PersistentIdSchema = z.object({
  id: z.string().uuid().or(z.string().min(8).max(64)),
});

// Helper to generate a simple hash from string to u32
function hashStringToU32(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

// Map to store ID string <-> hash mappings
const idStringMap = new Map<number, string>();
const hashToIdMap = new Map<string, number>();

// Persistent ID Component Definition
export const persistentIdComponent = ComponentFactory.create({
  id: 'PersistentId',
  name: 'Persistent Id',
  category: ComponentCategory.Core,
  schema: PersistentIdSchema,
  fields: {
    idHash: Types.ui32, // Store hash of the ID string for performance
  },
  serialize: (eid: EntityId, component: any) => {
    const hash = component.idHash[eid];
    const id = idStringMap.get(hash) || `entity-${eid}`;
    return { id };
  },
  deserialize: (eid: EntityId, data, component: any) => {
    const hash = hashStringToU32(data.id);
    component.idHash[eid] = hash;
    idStringMap.set(hash, data.id);
    hashToIdMap.set(data.id, hash);
  },
  metadata: {
    description: 'Stable entity identity for round-trip serialization',
    version: '1.0.0',
  },
});

// Helper functions for working with persistent IDs
export function generatePersistentId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 9)}`;
}

export function getPersistentIdString(hash: number): string | undefined {
  return idStringMap.get(hash);
}

export function getPersistentIdHash(id: string): number | undefined {
  return hashToIdMap.get(id);
}

export type PersistentIdData = z.infer<typeof PersistentIdSchema>;
