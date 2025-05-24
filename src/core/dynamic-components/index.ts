// Main exports for the dynamic components system
export * from './components';
export * from './groups';
export * from './manager';
export * from './registry';
export * from './types';
export * from './validation';

// Re-export for backwards compatibility
export { ComponentGroupManager } from './groups/ComponentGroupManager';
export { DynamicComponentManager } from './manager/DynamicComponentManager';
export { ComponentRegistry } from './registry/ComponentRegistry';
