// Import the unified system
import { ComponentManager } from '../dynamic-components/ComponentManager';
import {
  componentManager,
  componentRegistry,
  dynamicComponentManager,
  initializeComponentManager,
  initializeDynamicComponents,
} from '../dynamic-components/init';

// Export the unified system
export {
  ComponentManager,
  componentManager,
  componentRegistry,
  dynamicComponentManager,
  initializeComponentManager,
  initializeDynamicComponents,
};

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

// Legacy aliases - these all point to the same unified ComponentManager instance
export {
  componentManager as ComponentGroupManager,
  componentRegistry as ComponentRegistry,
  dynamicComponentManager as DynamicComponentManager,
};

// Initialize the system
initializeComponentManager();
