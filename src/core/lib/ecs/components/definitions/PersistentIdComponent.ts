/**
 * Persistent ID Component Definition
 * Provides stable entity identity across save/load cycles
 */

import { Types } from 'bitecs';
import { z } from 'zod';

import { ComponentCategory, ComponentFactory } from '../../ComponentRegistry';
import { EntityId } from '../../types';

// BitECS component interface for PersistentId component
export interface IPersistentIdBitECSComponent {
  idHash: Record<number, number>;
}

// Persistent ID Schema - accepts any non-empty string for human-readable IDs
export const PersistentIdSchema = z.object({
  id: z.string().min(1, 'Persistent ID cannot be empty'),
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

// Create component definition lazily to avoid circular dependency issues
let _persistentIdComponent: ReturnType<typeof ComponentFactory.create> | null = null;

function createPersistentIdComponent() {
  if (!_persistentIdComponent) {
    _persistentIdComponent = ComponentFactory.create({
      id: 'PersistentId',
      name: 'Persistent Id',
      category: ComponentCategory.Core,
      schema: PersistentIdSchema,
      fields: {
        idHash: Types.ui32, // Store hash of the ID string for performance
      },
      serialize: (eid: EntityId, component: unknown) => {
        const persistentIdComponent = component as IPersistentIdBitECSComponent;
        const hash = persistentIdComponent.idHash[eid];
        const id = idStringMap.get(hash) || `entity-${eid}`;
        return { id };
      },
      deserialize: (eid: EntityId, data: PersistentIdData, component: unknown) => {
        const persistentIdComponent = component as IPersistentIdBitECSComponent;
        const hash = hashStringToU32(data.id);
        persistentIdComponent.idHash[eid] = hash;
        idStringMap.set(hash, data.id);
        hashToIdMap.set(data.id, hash);
      },
      metadata: {
        description: 'Stable entity identity for round-trip serialization',
        version: '1.0.0',
      },
    });
  }
  return _persistentIdComponent;
}

// Export getter for component
export const persistentIdComponent = {
  get() {
    return createPersistentIdComponent();
  },
};

// Helper functions for working with persistent IDs
export function generatePersistentId(): string {
  // Generate a proper UUID v4
  return crypto.randomUUID();
}

export function getPersistentIdString(hash: number): string | undefined {
  return idStringMap.get(hash);
}

export function getPersistentIdHash(id: string): number | undefined {
  return hashToIdMap.get(id);
}

/**
 * Clear all persistent ID mappings - called during system reset
 */
export function clearPersistentIdMaps(): void {
  idStringMap.clear();
  hashToIdMap.clear();
}

export type PersistentIdData = z.infer<typeof PersistentIdSchema>;
