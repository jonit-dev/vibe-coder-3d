import { IComponentBatch, IComponentOperationResult, IValidationResult } from '../types';

import { ComponentOperations } from './ComponentOperations';
import { EditorStoreIntegration } from './EditorStoreIntegration';

export class DynamicComponentManager {
  private static instance: DynamicComponentManager;
  private operations: ComponentOperations;

  private constructor(
    private registry: {
      getComponent: (id: string) => any;
      getEntityComponents: (entityId: number) => string[];
      emitEvent: (event: any) => void;
    },
  ) {
    this.operations = new ComponentOperations(
      registry.getComponent.bind(registry),
      registry.getEntityComponents.bind(registry),
      registry.emitEvent.bind(registry),
      EditorStoreIntegration.handleComponent.bind(EditorStoreIntegration),
    );
  }

  static getInstance(registry?: any): DynamicComponentManager {
    if (!DynamicComponentManager.instance) {
      if (!registry) {
        throw new Error('Registry must be provided for first initialization');
      }
      DynamicComponentManager.instance = new DynamicComponentManager(registry);
    }
    return DynamicComponentManager.instance;
  }

  async addComponent(
    entityId: number,
    componentId: string,
    data?: any,
  ): Promise<IValidationResult> {
    return this.operations.addComponent(entityId, componentId, data);
  }

  async removeComponent(entityId: number, componentId: string): Promise<IValidationResult> {
    return this.operations.removeComponent(entityId, componentId);
  }

  async setComponentData(
    entityId: number,
    componentId: string,
    data: any,
  ): Promise<IValidationResult> {
    return this.operations.setComponentData(entityId, componentId, data);
  }

  async processBatch(batch: IComponentBatch): Promise<IComponentOperationResult> {
    return this.operations.processBatch(batch);
  }

  hasComponent(entityId: number, componentId: string): boolean {
    return this.registry.getEntityComponents(entityId).includes(componentId);
  }

  getEntityComponents(entityId: number): string[] {
    return this.registry.getEntityComponents(entityId);
  }

  getComponentData(entityId: number, componentId: string): any {
    const component = this.registry.getComponent(componentId);
    if (!component || !component.serialize) {
      return null;
    }

    try {
      return component.serialize(entityId);
    } catch (error) {
      console.warn(`Failed to serialize component '${componentId}':`, error);
      return null;
    }
  }

  // Synchronous validation method for UI components
  validateComponentAddition(entityId: number, componentId: string): IValidationResult {
    const component = this.registry.getComponent(componentId);
    if (!component) {
      return {
        valid: false,
        errors: [`Component '${componentId}' not found`],
        warnings: [],
      };
    }

    const currentComponents = this.registry.getEntityComponents(entityId);

    // Check if component is already present
    if (currentComponents.includes(componentId)) {
      return {
        valid: false,
        errors: [`Entity ${entityId} already has component '${componentId}'`],
        warnings: [],
      };
    }

    // Check dependencies
    const result: IValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
      missingDependencies: [],
      conflicts: [],
    };

    if (component.dependencies) {
      for (const depId of component.dependencies) {
        if (!currentComponents.includes(depId)) {
          result.missingDependencies?.push(depId);
          result.warnings.push(`Component '${componentId}' requires '${depId}'`);
        }
      }
    }

    // Check conflicts
    if (component.conflicts) {
      for (const conflictId of component.conflicts) {
        if (currentComponents.includes(conflictId)) {
          result.valid = false;
          result.conflicts?.push(conflictId);
          result.errors.push(`Component '${componentId}' conflicts with '${conflictId}'`);
        }
      }
    }

    return result;
  }
}
