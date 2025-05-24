// Main exports for the unified dynamic components system
export { ComponentManager } from './ComponentManager';

// Export factory functions
export * from './factory';

// Export initialization functions and instances
export {
  componentManager,
  componentRegistry,
  dynamicComponentManager,
  initializeComponentManager,
  initializeDynamicComponents,
} from './init';

// Export built-in components and groups
export {
  materialDescriptor,
  meshColliderDescriptor,
  meshRendererDescriptor,
  meshTypeDescriptor,
  nameDescriptor,
  registerBuiltInComponents,
  rigidBodyDescriptor,
  transformDescriptor,
  velocityDescriptor,
} from './components/BuiltInComponents';

export { BUILT_IN_COMPONENT_GROUPS, registerBuiltInComponentGroups } from './groups/BuiltInGroups';
