import { hasComponent } from 'bitecs';

import {
  ComponentCategory,
  IComponentChangeEvent,
  IComponentDescriptor,
  IValidationResult,
  validateValidationResult,
} from '../types/component-registry';

import { world } from './ecs';

export class ComponentRegistry {
  private static instance: ComponentRegistry;
  private components: Map<string, IComponentDescriptor> = new Map();
  private eventListeners: Array<(event: IComponentChangeEvent) => void> = [];

  static getInstance(): ComponentRegistry {
    if (!ComponentRegistry.instance) {
      ComponentRegistry.instance = new ComponentRegistry();
    }
    return ComponentRegistry.instance;
  }

  registerComponent<T>(descriptor: IComponentDescriptor<T>): void {
    if (this.components.has(descriptor.id)) {
      console.warn(`Component with id '${descriptor.id}' is already registered, skipping...`);
      return;
    }

    // Validate descriptor - use safeParse to check if schema can handle partial data
    const validationResult = descriptor.schema.safeParse({});
    if (!validationResult.success) {
      // Try with default values if available
      const defaultValidation = descriptor.schema.safeParse(undefined);
      if (!defaultValidation.success) {
        console.warn(
          `Schema validation warning for component '${descriptor.id}': schema may require specific values. This is normal for components with required fields.`,
        );
      }
    }

    this.components.set(descriptor.id, descriptor);
    console.log(`Component '${descriptor.name}' registered with id '${descriptor.id}'`);
  }

  unregisterComponent(id: string): void {
    if (!this.components.has(id)) {
      throw new Error(`Component with id '${id}' is not registered`);
    }

    this.components.delete(id);
    console.log(`Component with id '${id}' unregistered`);
  }

  getComponent(id: string): IComponentDescriptor | undefined {
    return this.components.get(id);
  }

  getComponentsByCategory(category: ComponentCategory): IComponentDescriptor[] {
    return Array.from(this.components.values()).filter(
      (component) => component.category === category,
    );
  }

  getAllComponents(): IComponentDescriptor[] {
    return Array.from(this.components.values());
  }

  validateDependencies(componentIds: string[]): IValidationResult {
    const result: IValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
      missingDependencies: [],
      conflicts: [],
    };

    const resolvedDeps = new Set<string>();
    const conflicts = new Set<string>();

    for (const componentId of componentIds) {
      const component = this.getComponent(componentId);
      if (!component) {
        result.errors.push(`Component '${componentId}' not found`);
        result.valid = false;
        continue;
      }

      // Check dependencies
      if (component.dependencies) {
        for (const depId of component.dependencies) {
          if (!componentIds.includes(depId) && !resolvedDeps.has(depId)) {
            result.missingDependencies?.push(depId);
            result.warnings.push(
              `Component '${componentId}' requires '${depId}' but it's not included`,
            );
          }
          resolvedDeps.add(depId);
        }
      }

      // Check conflicts
      if (component.conflicts) {
        for (const conflictId of component.conflicts) {
          if (componentIds.includes(conflictId)) {
            conflicts.add(conflictId);
            result.conflicts?.push(conflictId);
            result.errors.push(`Component '${componentId}' conflicts with '${conflictId}'`);
            result.valid = false;
          }
        }
      }
    }

    return validateValidationResult(result);
  }

  resolveDependencies(componentIds: string[]): string[] {
    const resolved = new Set<string>(componentIds);
    const toProcess = [...componentIds];

    while (toProcess.length > 0) {
      const currentId = toProcess.shift()!;
      const component = this.getComponent(currentId);

      if (!component || !component.dependencies) continue;

      for (const depId of component.dependencies) {
        if (!resolved.has(depId)) {
          resolved.add(depId);
          toProcess.push(depId);
        }
      }
    }

    return Array.from(resolved);
  }

  hasEntityComponent(entityId: number, componentId: string): boolean {
    const component = this.getComponent(componentId);
    if (!component) return false;

    // Handle editor store components
    const editorStoreComponents = ['rigidBody', 'meshCollider', 'meshRenderer'];
    if (editorStoreComponents.includes(componentId)) {
      return this.hasEditorStoreComponent(entityId, componentId);
    }

    // Handle bitECS components
    if (component.component) {
      return hasComponent(world, component.component, entityId);
    }

    return false;
  }

  getEntityComponents(entityId: number): string[] {
    const entityComponents: string[] = [];

    for (const [id, descriptor] of this.components) {
      if (descriptor.component && hasComponent(world, descriptor.component, entityId)) {
        entityComponents.push(id);
      } else if (['rigidBody', 'meshCollider', 'meshRenderer'].includes(id)) {
        // Check editor store components
        if (this.hasEditorStoreComponent(entityId, id)) {
          entityComponents.push(id);
        }
      }
    }

    return entityComponents;
  }

  private hasEditorStoreComponent(entityId: number, componentId: string): boolean {
    // We need to access the editor store state, but we have a circular dependency issue.
    // For now, we'll check if the component exists in the browser's global state.
    try {
      // Access the editor store via a global reference if available
      const globalThis = window as any;
      const editorStore = globalThis.__editorStore;

      if (!editorStore) {
        // Fallback: always return false to allow adding components
        // This will be improved when we refactor the circular dependency
        return false;
      }

      const state = editorStore.getState();

      switch (componentId) {
        case 'rigidBody':
          return state.rigidBodies[entityId] != null;
        case 'meshCollider':
          return state.meshColliders[entityId] != null;
        case 'meshRenderer':
          return state.meshRenderers[entityId] != null;
        default:
          return false;
      }
    } catch (error) {
      console.warn(`Failed to check editor store component '${componentId}':`, error);
      return false;
    }
  }

  addEventListener(listener: (event: IComponentChangeEvent) => void): void {
    this.eventListeners.push(listener);
  }

  removeEventListener(listener: (event: IComponentChangeEvent) => void): void {
    const index = this.eventListeners.indexOf(listener);
    if (index > -1) {
      this.eventListeners.splice(index, 1);
    }
  }

  emitEvent(event: IComponentChangeEvent): void {
    this.eventListeners.forEach((listener) => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in component event listener:', error);
      }
    });
  }

  reset(): void {
    this.components.clear();
    this.eventListeners.length = 0;
  }
}

// Export singleton instance
export const componentRegistry = ComponentRegistry.getInstance();
