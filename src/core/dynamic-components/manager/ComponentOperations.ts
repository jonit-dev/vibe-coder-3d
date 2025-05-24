import { addComponent, removeComponent } from 'bitecs';

import { incrementWorldVersion, world } from '@/core/lib/ecs';
import { frameEventBatch } from '@/core/lib/ecs-events';
import { ecsManager } from '@/core/lib/ecs-manager';
import {
  IComponentBatch,
  IComponentChangeEvent,
  IComponentDescriptor,
  IComponentOperation,
  IComponentOperationResult,
  IValidationResult,
} from '@/core/types/component-registry';

import { ComponentValidator } from '../validation/ComponentValidator';
import { DependencyResolver } from '../validation/DependencyResolver';

export class ComponentOperations {
  constructor(
    private getComponent: (id: string) => IComponentDescriptor | undefined,
    private getEntityComponents: (entityId: number) => string[],
    private emitEvent: (event: IComponentChangeEvent) => void,
    private handleEditorStoreComponent: (
      entityId: number,
      componentId: string,
      operation: 'add' | 'remove',
      data?: any,
    ) => Promise<void>,
  ) {}

  async addComponent(
    entityId: number,
    componentId: string,
    data?: any,
  ): Promise<IValidationResult> {
    const descriptor = this.getComponent(componentId);
    if (!descriptor) {
      return {
        valid: false,
        errors: [`Component '${componentId}' not found`],
        warnings: [],
      };
    }

    const currentComponents = this.getEntityComponents(entityId);
    const validation = ComponentValidator.validateComponentAddition(
      entityId,
      componentId,
      descriptor,
      currentComponents,
    );

    if (!validation.valid) {
      return validation;
    }

    try {
      // Add required dependencies first
      if (validation.missingDependencies) {
        for (const depId of validation.missingDependencies) {
          const depResult = await this.addComponent(entityId, depId);
          if (!depResult.valid) {
            return {
              valid: false,
              errors: [`Failed to add dependency '${depId}': ${depResult.errors.join(', ')}`],
              warnings: [],
            };
          }
        }
      }

      // Add the component to the entity
      if (descriptor.component) {
        addComponent(world, descriptor.component, entityId);
      }

      // Handle editor store components
      const editorStoreComponents = ['rigidBody', 'meshCollider', 'meshRenderer'];
      if (editorStoreComponents.includes(componentId)) {
        await this.handleEditorStoreComponent(entityId, componentId, 'add', data);
      }

      // Deserialize data if provided (for bitECS components)
      if (data && descriptor.component) {
        try {
          const validatedData = descriptor.schema.parse(data);
          descriptor.deserialize(entityId, validatedData);
        } catch (error) {
          console.warn(`Failed to deserialize data for component '${componentId}':`, error);
        }
      }

      // Call onAdd callback if defined
      if (descriptor.onAdd) {
        descriptor.onAdd(entityId);
      }

      // Emit event
      this.emitEvent({
        entityId,
        componentId,
        action: 'add',
        data,
        timestamp: Date.now(),
      });

      incrementWorldVersion();

      return {
        valid: true,
        errors: [],
        warnings: validation.warnings,
      };
    } catch (error) {
      return {
        valid: false,
        errors: [`Failed to add component '${componentId}': ${error}`],
        warnings: [],
      };
    }
  }

  async removeComponent(entityId: number, componentId: string): Promise<IValidationResult> {
    const descriptor = this.getComponent(componentId);
    if (!descriptor) {
      return {
        valid: false,
        errors: [`Component '${componentId}' not found`],
        warnings: [],
      };
    }

    const currentComponents = this.getEntityComponents(entityId);
    const dependentComponents = DependencyResolver.findDependentComponents(
      componentId,
      currentComponents,
      this.getComponent,
    );

    const validation = ComponentValidator.validateComponentRemoval(
      entityId,
      componentId,
      descriptor,
      currentComponents,
      dependentComponents,
    );

    if (!validation.valid) {
      return validation;
    }

    try {
      // Call onRemove callback if defined
      if (descriptor.onRemove) {
        descriptor.onRemove(entityId);
      }

      // Remove the component from the entity
      if (descriptor.component) {
        removeComponent(world, descriptor.component, entityId);
      }

      // Handle editor store components
      const editorStoreComponents = ['rigidBody', 'meshCollider', 'meshRenderer'];
      if (editorStoreComponents.includes(componentId)) {
        await this.handleEditorStoreComponent(entityId, componentId, 'remove');
      }

      // Emit event
      this.emitEvent({
        entityId,
        componentId,
        action: 'remove',
        timestamp: Date.now(),
      });

      incrementWorldVersion();

      return {
        valid: true,
        errors: [],
        warnings: [],
      };
    } catch (error) {
      return {
        valid: false,
        errors: [`Failed to remove component '${componentId}': ${error}`],
        warnings: [],
      };
    }
  }

  async setComponentData(
    entityId: number,
    componentId: string,
    data: any,
  ): Promise<IValidationResult> {
    const descriptor = this.getComponent(componentId);
    if (!descriptor) {
      return {
        valid: false,
        errors: [`Component '${componentId}' not found`],
        warnings: [],
      };
    }

    try {
      // Validate data against schema
      const validatedData = descriptor.schema.parse(data);

      // Handle editor store components
      const editorStoreComponents = ['rigidBody', 'meshCollider', 'meshRenderer'];
      if (editorStoreComponents.includes(componentId)) {
        await this.handleEditorStoreComponent(entityId, componentId, 'add', validatedData);
      } else if (componentId === 'transform' && descriptor.id === 'transform') {
        ecsManager.updateTransform(entityId, validatedData);
        frameEventBatch.emit();
      } else if (descriptor.component && descriptor.deserialize) {
        // Handle other bitECS components via direct deserialization
        descriptor.deserialize(entityId, validatedData);
      }

      // Emit generic event (for other systems that might be listening)
      this.emitEvent({
        entityId,
        componentId,
        action: 'update',
        data: validatedData,
        timestamp: Date.now(),
      });

      incrementWorldVersion();

      return {
        valid: true,
        errors: [],
        warnings: [],
      };
    } catch (error) {
      return {
        valid: false,
        errors: [`Failed to set component data for '${componentId}': ${error}`],
        warnings: [],
      };
    }
  }

  async processBatch(batch: IComponentBatch): Promise<IComponentOperationResult> {
    const { entityId, operations } = batch;
    const results: Array<{ operation: IComponentOperation; result: IValidationResult }> = [];
    let successCount = 0;
    const allErrors: string[] = [];

    for (const operation of operations) {
      let result: IValidationResult;

      switch (operation.type) {
        case 'add':
          result = await this.addComponent(entityId, operation.componentId, operation.data);
          break;
        case 'remove':
          result = await this.removeComponent(entityId, operation.componentId);
          break;
        case 'update':
          result = await this.setComponentData(entityId, operation.componentId, operation.data);
          break;
        default:
          result = {
            valid: false,
            errors: [`Unknown operation type: ${(operation as any).type}`],
            warnings: [],
          };
      }

      results.push({ operation, result });

      if (result.valid) {
        successCount++;
      } else {
        allErrors.push(...result.errors);
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
}
