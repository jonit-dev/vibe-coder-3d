/**
 * Registry service for managing component descriptors
 */

import type { IComponentDescriptor } from '../types/core';
import { ErrorLogger, RegistrationError } from '../utils/errors';

export class RegistryService {
  private components = new Map<string, IComponentDescriptor>();

  /**
   * Register a component descriptor
   */
  register(descriptor: IComponentDescriptor): void {
    if (this.components.has(descriptor.id)) {
      ErrorLogger.warn(`Component '${descriptor.id}' is already registered`, {
        componentId: descriptor.id,
      });
      return;
    }

    // Validate the descriptor
    this.validateDescriptor(descriptor);

    this.components.set(descriptor.id, descriptor);
    ErrorLogger.debug(`Component '${descriptor.id}' registered successfully`, {
      componentId: descriptor.id,
    });
  }

  /**
   * Get a component descriptor by ID
   */
  get(componentId: string): IComponentDescriptor | undefined {
    return this.components.get(componentId);
  }

  /**
   * Check if a component is registered
   */
  has(componentId: string): boolean {
    return this.components.has(componentId);
  }

  /**
   * Get all registered component IDs
   */
  getAllIds(): string[] {
    return Array.from(this.components.keys());
  }

  /**
   * Get components by category
   */
  getByCategory(category: string): IComponentDescriptor[] {
    return Array.from(this.components.values()).filter(
      (component) => component.category === category,
    );
  }

  /**
   * Unregister a component
   */
  unregister(componentId: string): boolean {
    const existed = this.components.delete(componentId);
    if (existed) {
      ErrorLogger.debug(`Component '${componentId}' unregistered`, {
        componentId,
      });
    }
    return existed;
  }

  /**
   * Clear all registered components
   */
  clear(): void {
    this.components.clear();
    ErrorLogger.debug('All components unregistered');
  }

  /**
   * Get the number of registered components
   */
  size(): number {
    return this.components.size;
  }

  private validateDescriptor(descriptor: IComponentDescriptor): void {
    if (!descriptor.id) {
      throw new RegistrationError('Component descriptor must have an id');
    }

    if (!descriptor.name) {
      throw new RegistrationError('Component descriptor must have a name', descriptor.id);
    }

    if (!descriptor.schema) {
      throw new RegistrationError('Component descriptor must have a schema', descriptor.id);
    }

    if (!descriptor.serialize) {
      throw new RegistrationError(
        'Component descriptor must have a serialize function',
        descriptor.id,
      );
    }

    if (!descriptor.deserialize) {
      throw new RegistrationError(
        'Component descriptor must have a deserialize function',
        descriptor.id,
      );
    }

    // Validate schema can handle empty data
    const schemaValidation = descriptor.schema.safeParse({});
    if (!schemaValidation.success) {
      // Try with undefined
      const undefinedValidation = descriptor.schema.safeParse(undefined);
      if (!undefinedValidation.success) {
        ErrorLogger.warn(`Component '${descriptor.id}' schema validation failed`, {
          componentId: descriptor.id,
          additionalData: {
            emptyValidation: schemaValidation.error.issues,
            undefinedValidation: undefinedValidation.error.issues,
          },
        });
      }
    }
  }
}
