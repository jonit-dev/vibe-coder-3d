/**
 * ComponentWriteSystem - Flushes batched component mutations to ECS
 * Runs after scripts have queued their updates via component accessors
 */

import { componentRegistry } from '@/core/lib/ecs/ComponentRegistry';
import { ComponentMutationBuffer } from '@/core/lib/ecs/mutations/ComponentMutationBuffer';
import { Logger } from '@/core/lib/logger';

const logger = Logger.create('ComponentWriteSystem');

/**
 * Create a component write system that flushes mutations from a shared buffer
 */
export function createComponentWriteSystem(buffer: ComponentMutationBuffer) {
  return function componentWriteSystem(): void {
    if (!buffer.hasPending) {
      return; // No mutations to flush
    }

    buffer.flush((entityId, componentId, field, value) => {
      try {
        // Skip physics-specific mutations (they're handled by physics binding)
        // These are prefixed with __ to avoid conflicts with regular component fields
        if (field.startsWith('__')) {
          return;
        }

        // Get current component data
        const current = componentRegistry.getComponentData<Record<string, unknown>>(
          entityId,
          componentId,
        );

        if (!current) {
          logger.warn(`Cannot update ${componentId} on entity ${entityId}: component not found`);
          return;
        }

        // Apply field update with shallow merge for nested objects
        const patch: Record<string, unknown> = {
          ...current,
          [field]:
            typeof value === 'object' && value !== null && !Array.isArray(value)
              ? { ...(current[field] as object), ...(value as object) }
              : value,
        };

        // Update component via registry (triggers validation and events)
        const success = componentRegistry.updateComponent(entityId, componentId, patch);

        if (!success) {
          logger.warn(`Failed to update ${componentId}.${field} on entity ${entityId}`);
        }
      } catch (error) {
        logger.error(
          `Error applying mutation to ${componentId}.${field} on entity ${entityId}`,
          error,
        );
      }
    });
  };
}
