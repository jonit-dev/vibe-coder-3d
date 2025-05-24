// Re-exports from dynamic-components directory
export { ComponentGroupManager } from '../dynamic-components/groups/ComponentGroupManager';
export { DynamicComponentManager } from '../dynamic-components/manager/DynamicComponentManager';
export { ComponentRegistry } from '../dynamic-components/registry/ComponentRegistry';

// Re-export types
export type {
  ComponentCategory,
  IComponentBatch,
  IComponentChangeEvent,
  IComponentDescriptor,
  IComponentGroup,
  IComponentGroupResult,
  IComponentOperation,
  IComponentOperationResult,
  IValidationResult,
} from '../types/component-registry';

// Export singleton instances for backward compatibility
import { initializeDynamicComponents } from '../dynamic-components/init';

// Initialize the system
const { registry, manager } = initializeDynamicComponents();
export const componentRegistry = registry;
export const dynamicComponentManager = manager;
