// Backward compatibility exports for the refactored dynamic components system
export { ComponentGroupManager } from '../dynamic-components/groups/ComponentGroupManager';
export { DynamicComponentManager } from '../dynamic-components/manager/DynamicComponentManager';
export { ComponentRegistry } from '../dynamic-components/registry/ComponentRegistry';

// Re-export types
export type {
  ComponentCategory,
  IComponentChangeEvent,
  IComponentDescriptor,
  IValidationResult,
} from '../dynamic-components/types';

export type { IComponentGroup, IComponentGroupResult } from '../dynamic-components/types';

// Export singleton instances for backward compatibility
import { initializeDynamicComponents } from '../dynamic-components/init';

// Initialize the new system
const { registry, manager } = initializeDynamicComponents();
export const componentRegistry = registry;
export const dynamicComponentManager = manager;
