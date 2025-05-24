import { ComponentManager } from './ComponentManager';
import {
  materialDescriptor,
  meshColliderDescriptor,
  meshRendererDescriptor,
  meshTypeDescriptor,
  nameDescriptor,
  rigidBodyDescriptor,
  transformDescriptor,
  velocityDescriptor,
} from './components/BuiltInComponents';
import { BUILT_IN_COMPONENT_GROUPS } from './groups/BuiltInGroups';

/**
 * Initialize the unified component system
 */
export function initializeComponentManager(): ComponentManager {
  const manager = ComponentManager.getInstance();

  // Register built-in components
  registerBuiltInComponents(manager);

  // Register built-in component groups
  registerBuiltInComponentGroups(manager);

  return manager;
}

/**
 * Register all built-in components with the manager
 */
export function registerBuiltInComponents(manager: ComponentManager): void {
  // Core components
  manager.registerComponent(transformDescriptor);
  manager.registerComponent(nameDescriptor);

  // Rendering components
  manager.registerComponent(meshTypeDescriptor);
  manager.registerComponent(materialDescriptor);
  manager.registerComponent(meshRendererDescriptor);

  // Physics components
  manager.registerComponent(velocityDescriptor);
  manager.registerComponent(rigidBodyDescriptor);
  manager.registerComponent(meshColliderDescriptor);
}

/**
 * Register all built-in component groups with the manager
 */
export function registerBuiltInComponentGroups(manager: ComponentManager): void {
  for (const group of BUILT_IN_COMPONENT_GROUPS) {
    manager.registerComponentGroup(group);
  }
}

// Export singleton instances for backwards compatibility
export const componentManager = ComponentManager.getInstance();
export const componentRegistry = componentManager; // Alias for backwards compatibility
export const dynamicComponentManager = componentManager; // Alias for backwards compatibility

// Initialize built-in components and groups
registerBuiltInComponents(componentManager);
registerBuiltInComponentGroups(componentManager);

// Legacy compatibility exports
export { ComponentManager } from './ComponentManager';

// For old-style initialization
export function initializeDynamicComponents() {
  return {
    registry: componentManager,
    manager: componentManager,
  };
}
