/**
 * ComponentsAPI - Direct component access for scripts
 * Provides entity.meshRenderer, entity.camera, etc. accessors
 */

import { ComponentMutationBuffer } from '@/core/lib/ecs/mutations/ComponentMutationBuffer';
import { createComponentsProxy } from '@/core/lib/ecs/components/accessors/ComponentAccessors';

/**
 * Create components API for an entity
 * Returns a proxy that provides direct component accessors (e.g., meshRenderer, camera)
 */
export function createComponentsAPI(
  entityId: number,
  sharedBuffer: ComponentMutationBuffer,
): Record<string, unknown> {
  return createComponentsProxy(entityId, sharedBuffer);
}
