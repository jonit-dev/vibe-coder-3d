/**
 * Component handler for BitECS components
 */

import { addComponent, hasComponent, removeComponent } from 'bitecs';

import { incrementWorldVersion, world } from '@/core/lib/ecs';

import type { IComponentDescriptor, IComponentHandler } from '../types/core';
import { ComponentError, ErrorLogger } from '../utils/errors';

export class BitEcsHandler implements IComponentHandler {
  constructor(private descriptor: IComponentDescriptor) {
    if (!descriptor.component) {
      throw new ComponentError(`BitEcsHandler requires a BitECS component`, descriptor.id);
    }
  }

  async add(entityId: number, data?: any): Promise<void> {
    try {
      // Add the component to the entity
      addComponent(world, this.descriptor.component, entityId);

      // Deserialize data if provided
      if (data) {
        try {
          const validatedData = this.descriptor.schema.parse(data);
          this.descriptor.deserialize(entityId, validatedData);
        } catch (error) {
          ErrorLogger.warn(`Failed to deserialize data for component '${this.descriptor.id}'`, {
            componentId: this.descriptor.id,
            entityId,
            operation: 'add',
            additionalData: { error: String(error), data },
          });
        }
      }

      // Call onAdd callback if defined
      if (this.descriptor.onAdd) {
        try {
          this.descriptor.onAdd(entityId);
        } catch (error) {
          ErrorLogger.error(`onAdd callback failed for component '${this.descriptor.id}'`, {
            componentId: this.descriptor.id,
            entityId,
            operation: 'add',
            additionalData: { error: String(error) },
          });
          throw error;
        }
      }

      incrementWorldVersion();

      ErrorLogger.debug(`Added BitECS component '${this.descriptor.id}' to entity ${entityId}`, {
        componentId: this.descriptor.id,
        entityId,
        operation: 'add',
      });
    } catch (error) {
      ErrorLogger.error(
        `Failed to add BitECS component '${this.descriptor.id}' to entity ${entityId}`,
        {
          componentId: this.descriptor.id,
          entityId,
          operation: 'add',
          additionalData: { error: String(error) },
        },
      );
      throw new ComponentError(
        `Failed to add BitECS component: ${String(error)}`,
        this.descriptor.id,
        entityId,
        'add',
      );
    }
  }

  async remove(entityId: number): Promise<void> {
    try {
      // Call onRemove callback if defined
      if (this.descriptor.onRemove) {
        try {
          this.descriptor.onRemove(entityId);
        } catch (error) {
          ErrorLogger.error(`onRemove callback failed for component '${this.descriptor.id}'`, {
            componentId: this.descriptor.id,
            entityId,
            operation: 'remove',
            additionalData: { error: String(error) },
          });
          throw error;
        }
      }

      // Remove the component from the entity
      removeComponent(world, this.descriptor.component, entityId);

      incrementWorldVersion();

      ErrorLogger.debug(
        `Removed BitECS component '${this.descriptor.id}' from entity ${entityId}`,
        {
          componentId: this.descriptor.id,
          entityId,
          operation: 'remove',
        },
      );
    } catch (error) {
      ErrorLogger.error(
        `Failed to remove BitECS component '${this.descriptor.id}' from entity ${entityId}`,
        {
          componentId: this.descriptor.id,
          entityId,
          operation: 'remove',
          additionalData: { error: String(error) },
        },
      );
      throw new ComponentError(
        `Failed to remove BitECS component: ${String(error)}`,
        this.descriptor.id,
        entityId,
        'remove',
      );
    }
  }

  async update(entityId: number, data: any): Promise<void> {
    try {
      // Validate and deserialize the new data
      const validatedData = this.descriptor.schema.parse(data);
      this.descriptor.deserialize(entityId, validatedData);

      incrementWorldVersion();

      ErrorLogger.debug(`Updated BitECS component '${this.descriptor.id}' for entity ${entityId}`, {
        componentId: this.descriptor.id,
        entityId,
        operation: 'update',
      });
    } catch (error) {
      ErrorLogger.error(
        `Failed to update BitECS component '${this.descriptor.id}' for entity ${entityId}`,
        {
          componentId: this.descriptor.id,
          entityId,
          operation: 'update',
          additionalData: { error: String(error), data },
        },
      );
      throw new ComponentError(
        `Failed to update BitECS component: ${String(error)}`,
        this.descriptor.id,
        entityId,
        'update',
      );
    }
  }

  has(entityId: number): boolean {
    return hasComponent(world, this.descriptor.component, entityId);
  }

  getData(entityId: number): any {
    try {
      if (!this.has(entityId)) {
        return null;
      }

      return this.descriptor.serialize(entityId);
    } catch (error) {
      ErrorLogger.warn(`Failed to get data for BitECS component '${this.descriptor.id}'`, {
        componentId: this.descriptor.id,
        entityId,
        operation: 'getData',
        additionalData: { error: String(error) },
      });
      return null;
    }
  }
}
