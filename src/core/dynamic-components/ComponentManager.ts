/**
 * Main component manager that orchestrates all services
 */

import { ComponentProvider } from './providers/ComponentProvider';
import { DependencyService } from './services/DependencyService';
import { EntityService } from './services/EntityService';
import { EventService } from './services/EventService';
import { RegistryService } from './services/RegistryService';
import { ValidationService } from './services/ValidationService';
import type {
  IComponentBatch,
  IComponentChangeEvent,
  IComponentDescriptor,
  IComponentOperationResult,
  IValidationResult,
} from './types/core';
import { createErrorResult, createSuccessResult, ErrorLogger } from './utils/errors';

export class ComponentManager {
  private registry: RegistryService;
  private dependencyService: DependencyService;
  private validationService: ValidationService;
  private eventService: EventService;
  private entityService: EntityService;
  private componentProvider: ComponentProvider;

  constructor(getEditorStore: () => any = () => null) {
    // Initialize services
    this.registry = new RegistryService();
    this.dependencyService = new DependencyService(this.registry);
    this.entityService = new EntityService();
    this.validationService = new ValidationService(
      this.registry,
      this.dependencyService,
      (entityId) => this.entityService.getEntityComponents(entityId),
    );
    this.eventService = new EventService();
    this.componentProvider = new ComponentProvider(this.registry, getEditorStore);

    ErrorLogger.debug('ComponentManager initialized');
  }

  /**
   * Register a component descriptor
   */
  registerComponent(descriptor: IComponentDescriptor): void {
    try {
      this.registry.register(descriptor);
      ErrorLogger.debug(`Component '${descriptor.id}' registered`, {
        componentId: descriptor.id,
      });
    } catch (error) {
      ErrorLogger.error(`Failed to register component '${descriptor.id}'`, {
        componentId: descriptor.id,
        additionalData: { error: String(error) },
      });
      throw error;
    }
  }

  /**
   * Add a component to an entity
   */
  async addComponent(
    entityId: number,
    componentId: string,
    data?: any,
  ): Promise<IValidationResult> {
    try {
      // Validate the operation
      const validation = this.validationService.validateAdd(entityId, componentId);
      if (!validation.valid) {
        return validation;
      }

      // Get component handler
      const handler = this.componentProvider.getHandler(componentId);
      if (!handler) {
        return createErrorResult([`No handler available for component '${componentId}'`]);
      }

      // Auto-add missing dependencies
      if (validation.missingDependencies && validation.missingDependencies.length > 0) {
        for (const depId of validation.missingDependencies) {
          const depResult = await this.addComponent(entityId, depId);
          if (!depResult.valid) {
            return createErrorResult([
              `Failed to add dependency '${depId}': ${depResult.errors.join(', ')}`,
            ]);
          }
        }
      }

      // Add the component
      await handler.add(entityId, data);

      // Track the component
      this.entityService.addComponent(entityId, componentId);

      // Emit event
      this.eventService.emit({
        entityId,
        componentId,
        action: 'add',
        data,
        timestamp: Date.now(),
      });

      return createSuccessResult(validation.warnings);
    } catch (error) {
      const errorMsg = `Failed to add component '${componentId}' to entity ${entityId}: ${String(error)}`;
      ErrorLogger.error(errorMsg, {
        componentId,
        entityId,
        operation: 'addComponent',
        additionalData: { error: String(error) },
      });
      return createErrorResult([errorMsg]);
    }
  }

  /**
   * Remove a component from an entity
   */
  async removeComponent(entityId: number, componentId: string): Promise<IValidationResult> {
    try {
      // Validate the operation
      const validation = this.validationService.validateRemove(entityId, componentId);
      if (!validation.valid) {
        return validation;
      }

      // Get component handler
      const handler = this.componentProvider.getHandler(componentId);
      if (!handler) {
        return createErrorResult([`No handler available for component '${componentId}'`]);
      }

      // Remove the component
      await handler.remove(entityId);

      // Untrack the component
      this.entityService.removeComponent(entityId, componentId);

      // Emit event
      this.eventService.emit({
        entityId,
        componentId,
        action: 'remove',
        timestamp: Date.now(),
      });

      return createSuccessResult();
    } catch (error) {
      const errorMsg = `Failed to remove component '${componentId}' from entity ${entityId}: ${String(error)}`;
      ErrorLogger.error(errorMsg, {
        componentId,
        entityId,
        operation: 'removeComponent',
        additionalData: { error: String(error) },
      });
      return createErrorResult([errorMsg]);
    }
  }

  /**
   * Update component data for an entity
   */
  async updateComponent(
    entityId: number,
    componentId: string,
    data: any,
  ): Promise<IValidationResult> {
    try {
      // Validate the operation
      const validation = this.validationService.validateUpdate(entityId, componentId, data);
      if (!validation.valid) {
        return validation;
      }

      // Get component handler
      const handler = this.componentProvider.getHandler(componentId);
      if (!handler) {
        return createErrorResult([`No handler available for component '${componentId}'`]);
      }

      // Update the component
      if (handler.update) {
        await handler.update(entityId, data);
      } else {
        // Fallback to add with new data
        await handler.add(entityId, data);
      }

      // Emit event
      this.eventService.emit({
        entityId,
        componentId,
        action: 'update',
        data,
        timestamp: Date.now(),
      });

      return createSuccessResult();
    } catch (error) {
      const errorMsg = `Failed to update component '${componentId}' for entity ${entityId}: ${String(error)}`;
      ErrorLogger.error(errorMsg, {
        componentId,
        entityId,
        operation: 'updateComponent',
        additionalData: { error: String(error) },
      });
      return createErrorResult([errorMsg]);
    }
  }

  /**
   * Process a batch of component operations
   */
  async processBatch(batch: IComponentBatch): Promise<IComponentOperationResult> {
    const { entityId, operations } = batch;
    const results: Array<{ operation: any; result: IValidationResult }> = [];
    let successCount = 0;
    const allErrors: string[] = [];

    for (const operation of operations) {
      let result: IValidationResult;

      try {
        switch (operation.type) {
          case 'add':
            result = await this.addComponent(entityId, operation.componentId, operation.data);
            break;
          case 'remove':
            result = await this.removeComponent(entityId, operation.componentId);
            break;
          case 'update':
            result = await this.updateComponent(entityId, operation.componentId, operation.data);
            break;
          default:
            result = createErrorResult([`Unknown operation type: ${(operation as any).type}`]);
        }

        results.push({ operation, result });

        if (result.valid) {
          successCount++;
        } else {
          allErrors.push(...result.errors);
        }
      } catch (error) {
        const errorMsg = `Batch operation failed: ${String(error)}`;
        allErrors.push(errorMsg);
        results.push({
          operation,
          result: createErrorResult([errorMsg]),
        });
      }
    }

    return {
      success: successCount === operations.length,
      errors: allErrors,
      warnings: results.flatMap((r) => r.result.warnings || []),
      data: {
        totalOperations: operations.length,
        successfulOperations: successCount,
        results,
      },
    };
  }

  /**
   * Check if an entity has a component
   */
  hasComponent(entityId: number, componentId: string): boolean {
    return this.entityService.hasComponent(entityId, componentId);
  }

  /**
   * Get all components for an entity
   */
  getEntityComponents(entityId: number): string[] {
    return this.entityService.getEntityComponents(entityId);
  }

  /**
   * Get component data for an entity
   */
  getComponentData(entityId: number, componentId: string): any {
    const handler = this.componentProvider.getHandler(componentId);
    return handler?.getData?.(entityId) ?? null;
  }

  /**
   * Validate adding a component (sync)
   */
  validateComponentAddition(entityId: number, componentId: string): IValidationResult {
    return this.validationService.validateAdd(entityId, componentId);
  }

  /**
   * Subscribe to component change events
   */
  subscribe(listener: (event: IComponentChangeEvent) => void): void {
    this.eventService.subscribe(listener);
  }

  /**
   * Unsubscribe from component change events
   */
  unsubscribe(listener: (event: IComponentChangeEvent) => void): void {
    this.eventService.unsubscribe(listener);
  }

  /**
   * Get system statistics
   */
  getStats() {
    return {
      registeredComponents: this.registry.size(),
      trackedEntities: this.entityService.getEntityCount(),
      totalComponentInstances: this.entityService.getTotalComponentCount(),
      cachedHandlers: this.componentProvider.getCacheSize(),
      eventListeners: this.eventService.getListenerCount(),
    };
  }

  /**
   * Clear all data (useful for testing)
   */
  clear(): void {
    this.registry.clear();
    this.entityService.clear();
    this.eventService.clear();
    this.componentProvider.clearCache();
    ErrorLogger.debug('ComponentManager cleared');
  }
}
