import { hasComponent } from 'bitecs';

import { world } from '@/core/lib/ecs';
import {
  ComponentCategory,
  IComponentChangeEvent,
  IComponentDescriptor,
  IValidationResult,
} from '@/core/types/component-registry';

import { DependencyResolver } from '../validation/DependencyResolver';

import { ComponentMap } from './ComponentMap';

export class ComponentRegistry {
  private static instance: ComponentRegistry;
  private componentMap = new ComponentMap();
  private eventListeners: Array<(event: IComponentChangeEvent) => void> = [];

  static getInstance(): ComponentRegistry {
    if (!ComponentRegistry.instance) {
      ComponentRegistry.instance = new ComponentRegistry();
    }
    return ComponentRegistry.instance;
  }

  registerComponent<T>(descriptor: IComponentDescriptor<T>): void {
    if (this.componentMap.has(descriptor.id)) {
      return;
    }

    // Validate descriptor schema
    const validationResult = descriptor.schema.safeParse({});
    if (!validationResult.success) {
      const defaultValidation = descriptor.schema.safeParse(undefined);
      if (!defaultValidation.success) {
        // Optionally keep this warning, or gate it behind a debug flag
      }
    }

    this.componentMap.register(descriptor);
    // Optionally keep this log, or gate it behind a debug flag
  }

  unregisterComponent(id: string): void {
    if (!this.componentMap.has(id)) {
      throw new Error(`Component with id '${id}' is not registered`);
    }

    this.componentMap.unregister(id);
    console.log(`Component with id '${id}' unregistered`);
  }

  getComponent(id: string): IComponentDescriptor | undefined {
    return this.componentMap.get(id);
  }

  getComponentsByCategory(category: ComponentCategory): IComponentDescriptor[] {
    return this.componentMap.getByCategory(category);
  }

  getAllComponents(): IComponentDescriptor[] {
    return this.componentMap.getAll();
  }

  searchComponents(query: string): IComponentDescriptor[] {
    return this.componentMap.search(query);
  }

  getComponentsByTag(tag: string): IComponentDescriptor[] {
    return this.componentMap.getByTag(tag);
  }

  validateDependencies(componentIds: string[]): IValidationResult {
    return DependencyResolver.validateDependencies(componentIds, (id) => this.getComponent(id));
  }

  resolveDependencies(componentIds: string[]): string[] {
    return DependencyResolver.resolveDependencies(componentIds, (id) => this.getComponent(id));
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

    for (const descriptor of this.componentMap.getAll()) {
      const { id } = descriptor;

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
    // Access the editor store via a global reference if available
    try {
      const globalThis = window as any;
      const editorStore = globalThis.__editorStore;

      if (!editorStore) {
        // Fallback: always return false to allow adding components
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
      console.warn('Failed to access editor store:', error);
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
    for (const listener of this.eventListeners) {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in component change event listener:', error);
      }
    }
  }

  getStatistics() {
    return {
      totalComponents: this.componentMap.size(),
      categories: this.componentMap.getCategories(),
      tags: this.componentMap.getTags(),
      componentsByCategory: this.componentMap.getCategories().map((category) => ({
        category,
        count: this.componentMap.getByCategory(category).length,
      })),
    };
  }

  reset(): void {
    this.componentMap.clear();
    this.eventListeners = [];
  }
}
