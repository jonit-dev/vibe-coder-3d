import { registerBuiltInComponents } from './components/BuiltInComponents';
import { registerBuiltInComponentGroups } from './groups/BuiltInGroups';
import { DynamicComponentManager } from './manager/DynamicComponentManager';
import { ComponentRegistry } from './registry/ComponentRegistry';

/**
 * Initialize the dynamic components system
 */
export function initializeDynamicComponents(): {
  registry: ComponentRegistry;
  manager: DynamicComponentManager;
} {
  // Get registry instance
  const registry = ComponentRegistry.getInstance();

  // Initialize manager with registry
  const manager = DynamicComponentManager.getInstance(registry);

  // Register built-in components
  registerBuiltInComponents(registry);

  // Register built-in component groups
  registerBuiltInComponentGroups();

  return { registry, manager };
}

// Export instances for backwards compatibility
export const componentRegistry = ComponentRegistry.getInstance();
export const dynamicComponentManager = DynamicComponentManager.getInstance(componentRegistry);
