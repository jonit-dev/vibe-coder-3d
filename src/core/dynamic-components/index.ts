// Main exports for the refactored dynamic components system
export { ComponentManager } from './ComponentManager';

// Export factory functions
export * from './factory';

// Export services
export * from './services';

// Export handlers
export * from './handlers';

// Export providers
export * from './providers';

// Export types
export * from './types';

// Export utilities
export * from './utils';

// Legacy exports for backwards compatibility
export * from './components';
export * from './groups';
export * from './manager';
export * from './registry';
export * from './validation';

// Re-export for backwards compatibility
export { ComponentGroupManager } from './groups/ComponentGroupManager';
export { DynamicComponentManager } from './manager/DynamicComponentManager';
export { ComponentRegistry } from './registry/ComponentRegistry';
